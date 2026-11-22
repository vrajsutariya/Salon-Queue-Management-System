import express from 'express';
import { Barber, Service, QueueTicket, SalonSetting } from '../models/index.js';
import { checkAutoCloseStatus, computeEstimatedWaitTime } from '../utils/queueRules.js';

const router = express.Router();

/**
 * GET /api/salon/live-status
 * Returns salon open state, waiting count, active barbers, and general estimated wait time
 */
router.get('/live-status', async (req, res) => {
  try {
    // 0. Get salon settings
    const settings = await SalonSetting.getSettings();

    // 1. Get on-duty barbers
    const activeBarbers = await Barber.find({ isOnDuty: true }).select('name photo status isOnDuty');
    const activeBarbersCount = activeBarbers.length;

    // 2. Get active tickets (waiting, called, in-chair)
    const waitingTickets = await QueueTicket.find({ status: 'waiting' }).populate('services');
    const calledTickets = await QueueTicket.find({ status: 'called' }).populate('services');
    const inChairTickets = await QueueTicket.find({ status: 'in-chair' }).populate('services');

    const waitingCount = waitingTickets.length;
    const calledCount = calledTickets.length;
    const inChairCount = inChairTickets.length;

    // 3. Calculate total minutes ahead in queue
    let totalServiceMinutes = 0;
    waitingTickets.forEach((ticket) => {
      ticket.services?.forEach((srv) => {
        totalServiceMinutes += srv.durationMinutes || 0;
      });
    });

    calledTickets.forEach((ticket) => {
      ticket.services?.forEach((srv) => {
        totalServiceMinutes += srv.durationMinutes || 0;
      });
    });

    // In-chair remaining time adjustment: Remaining(c) = max(0, TotalDuration(c) - ElapsedMinutes(c))
    inChairTickets.forEach((ticket) => {
      let dur = 0;
      ticket.services?.forEach((srv) => {
        dur += srv.durationMinutes || 0;
      });
      if (ticket.inChairAt) {
        const elapsed = Math.floor((new Date() - new Date(ticket.inChairAt)) / 60000);
        totalServiceMinutes += Math.max(0, dur - elapsed);
      } else {
        totalServiceMinutes += dur;
      }
    });

    // Calculate wait time using ceil( totalServiceMinutes / activeBarbersCount )
    const estimatedWaitMinutes = computeEstimatedWaitTime(totalServiceMinutes, activeBarbersCount);
    const barbersUnavailable = activeBarbersCount === 0;

    // Master Admin Queue Switch controls online queue availability
    const autoClose = checkAutoCloseStatus(settings.closingTime);
    const isOnlineQueueOpen = settings.isQueueOpen;

    let salonStatusText = 'Online Queue Closed';
    if (isOnlineQueueOpen) {
      salonStatusText = `Open · Closes ${settings.closingTime || '9:00 PM'}`;
    } else {
      salonStatusText = `Online Queue Closed · Walk-ins until ${settings.closingTime || '9:00 PM'}`;
    }

    res.json({
      success: true,
      salonStatus: salonStatusText,
      isOpen: settings.isQueueOpen,
      isQueueOpen: isOnlineQueueOpen,
      isManualQueueOpen: settings.isQueueOpen,
      isAutoClosed: autoClose.isAutoClosed,
      autoCloseMessage: `Online queue has closed for today. Walk-ins are accepted until ${settings.closingTime || '9:00 PM'}.`,
      closingTime: settings.closingTime,
      waitingCount,
      calledCount,
      inChairCount,
      activeBarbersCount,
      estimatedWaitMinutes,
      barbersUnavailable,
      activeBarbers,
    });
  } catch (error) {
    console.error('Error fetching salon live-status:', error);
    res.status(500).json({ success: false, message: 'Server error fetching salon live status' });
  }
});

/**
 * GET /api/services
 * Returns all active services
 */
router.get('/services', async (req, res) => {
  try {
    const services = await Service.find({ isActive: true }).sort({ priceInr: 1 });
    res.json({ success: true, count: services.length, services });
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ success: false, message: 'Server error fetching services' });
  }
});

/**
 * GET /api/barbers
 * Returns all on-duty barbers
 */
router.get('/barbers', async (req, res) => {
  try {
    const barbers = await Barber.find({ isOnDuty: true }).sort({ name: 1 });
    res.json({ success: true, count: barbers.length, barbers });
  } catch (error) {
    console.error('Error fetching barbers:', error);
    res.status(500).json({ success: false, message: 'Server error fetching barbers' });
  }
});

/**
 * PATCH /api/barbers/:id/status
 * Update barber status (free, busy, break) and duty state
 */
router.patch('/barbers/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, isOnDuty } = req.body;

    const barber = await Barber.findById(id);
    if (!barber) {
      return res.status(404).json({ success: false, message: 'Barber not found.' });
    }

    if (status) {
      const validStatuses = ['free', 'busy', 'break'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status value.' });
      }
      barber.status = status;
    }

    if (typeof isOnDuty === 'boolean') {
      barber.isOnDuty = isOnDuty;
    }

    await barber.save();

    if (req.io) {
      req.io.emit('barber:updated', {
        barberId: barber._id,
        name: barber.name,
        status: barber.status,
        isOnDuty: barber.isOnDuty,
      });
      req.io.emit('queue:updated', { action: 'barber_status_change' });
    }

    res.json({ success: true, message: `Barber ${barber.name} status updated to ${barber.status}.`, barber });
  } catch (error) {
    console.error('Error updating barber status:', error);
    res.status(500).json({ success: false, message: 'Server error updating barber status.' });
  }
});

export default router;
