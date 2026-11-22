import express from 'express';
import mongoose from 'mongoose';
import { QueueTicket, Barber, Service } from '../models/index.js';

const router = express.Router();

/**
 * POST /api/queue/join
 * Join the digital walk-in queue
 */
router.post('/join', async (req, res) => {
  try {
    const { customerName, phone, services, preferredBarber } = req.body;

    // 1. Validation
    if (!customerName || typeof customerName !== 'string' || customerName.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Valid customer name is required (at least 2 characters).',
      });
    }

    const cleanPhone = String(phone || '').replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      return res.status(400).json({
        success: false,
        message: 'A valid 10-digit mobile number is required.',
      });
    }

    if (!Array.isArray(services) || services.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please select at least one service.',
      });
    }

    if (services.length > 3) {
      return res.status(400).json({
        success: false,
        message: 'A maximum of 3 services can be selected per walk-in.',
      });
    }

    // 2. One active spot per phone number rule
    const existingActiveTicket = await QueueTicket.findOne({
      phone: cleanPhone,
      status: { $in: ['waiting', 'called', 'in-chair'] },
    }).populate('services');

    if (existingActiveTicket) {
      return res.status(409).json({
        success: false,
        alreadyActive: true,
        message: 'You already have an active ticket in the queue.',
        ticket: existingActiveTicket,
      });
    }

    // 3. Verify selected service IDs exist
    const validServices = await Service.find({
      _id: { $in: services },
      isActive: true,
    });

    if (validServices.length !== services.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more selected services are invalid or inactive.',
      });
    }

    // 4. Generate daily token sequence: S-1, S-2...
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todayCount = await QueueTicket.countDocuments({
      createdAt: { $gte: startOfToday },
    });

    const token = `S-${todayCount + 1}`;

    // 5. Calculate wait time ahead
    const activeBarbers = await Barber.find({ isOnDuty: true });
    const activeBarbersCount = Math.max(1, activeBarbers.length);

    const ticketsAhead = await QueueTicket.find({
      status: { $in: ['waiting', 'called'] },
    }).populate('services');

    let minutesAhead = 0;
    ticketsAhead.forEach((t) => {
      t.services?.forEach((s) => {
        minutesAhead += s.durationMinutes || 0;
      });
    });

    const estimatedWaitTimeMinutes = Math.round(minutesAhead / activeBarbersCount);

    // 6. Create ticket
    const newTicket = new QueueTicket({
      token,
      customerName: customerName.trim(),
      phone: cleanPhone,
      services: validServices.map((s) => s._id),
      preferredBarber: preferredBarber || 'any',
      status: 'waiting',
      estimatedWaitTimeMinutes,
      joinedAt: new Date(),
    });

    await newTicket.save();
    const populatedTicket = await QueueTicket.findById(newTicket._id).populate('services');

    // 7. Emit Socket.io update event across all connected clients
    if (req.io) {
      req.io.emit('queue:updated', {
        action: 'joined',
        ticketId: populatedTicket._id,
        token: populatedTicket.token,
        customerName: populatedTicket.customerName,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Successfully joined the queue!',
      ticket: populatedTicket,
    });
  } catch (error) {
    console.error('Error joining queue:', error);
    res.status(500).json({ success: false, message: 'Server error while joining the queue.' });
  }
});

/**
 * GET /api/queue/:id
 * Retrieve live status for a specific ticket
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let ticket = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      ticket = await QueueTicket.findById(id).populate('services').populate('assignedBarber');
    } else {
      ticket = await QueueTicket.findOne({ token: id }).populate('services').populate('assignedBarber');
    }

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found.' });
    }

    // Calculate position in queue if waiting
    let position = 0;
    if (ticket.status === 'waiting') {
      position = await QueueTicket.countDocuments({
        status: 'waiting',
        joinedAt: { $lte: ticket.joinedAt },
      });
    } else if (ticket.status === 'called' || ticket.status === 'in-chair') {
      position = 1;
    }

    // Calculate dynamic wait time
    const activeBarbers = await Barber.find({ isOnDuty: true });
    const activeBarbersCount = Math.max(1, activeBarbers.length);

    let waitTime = 0;
    if (ticket.status === 'waiting') {
      const ticketsAhead = await QueueTicket.find({
        status: 'waiting',
        joinedAt: { $lt: ticket.joinedAt },
      }).populate('services');

      let mins = 0;
      ticketsAhead.forEach((t) => {
        t.services?.forEach((s) => {
          mins += s.durationMinutes || 0;
        });
      });
      waitTime = Math.round(mins / activeBarbersCount);
    }

    res.json({
      success: true,
      ticket,
      position,
      estimatedWaitTimeMinutes: waitTime,
    });
  } catch (error) {
    console.error('Error fetching ticket status:', error);
    res.status(500).json({ success: false, message: 'Server error fetching ticket status.' });
  }
});

export default router;
