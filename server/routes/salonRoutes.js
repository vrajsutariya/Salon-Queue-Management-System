import express from 'express';
import { Barber, Service, QueueTicket, SalonSetting } from '../models/index.js';

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
    const activeBarbersCount = Math.max(1, activeBarbers.length);

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

    // Approximate general wait time using: total minutes / active barbers
    const estimatedWaitMinutes = Math.round(totalServiceMinutes / activeBarbersCount);

    res.json({
      success: true,
      salonStatus: settings.isQueueOpen ? `Open · Closes ${settings.closingTime || '9 PM'}` : 'Online Queue Closed',
      isOpen: settings.isQueueOpen,
      isQueueOpen: settings.isQueueOpen,
      closingTime: settings.closingTime,
      waitingCount,
      calledCount,
      inChairCount,
      activeBarbersCount,
      estimatedWaitMinutes,
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
