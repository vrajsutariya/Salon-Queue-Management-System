import express from 'express';
import mongoose from 'mongoose';
import { QueueTicket, Barber, Service, SalonSetting } from '../models/index.js';

const router = express.Router();

/**
 * GET /api/queue
 * List all active queue tickets (or filtered by status)
 */
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    let filter = {};

    if (status === 'all') {
      // return all tickets from today
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      filter = { createdAt: { $gte: startOfToday } };
    } else if (status) {
      filter = { status };
    } else {
      // default: active tickets (waiting, called, in-chair)
      filter = { status: { $in: ['waiting', 'called', 'in-chair'] } };
    }

    const tickets = await QueueTicket.find(filter)
      .populate('services')
      .populate('assignedBarber')
      .sort({ joinedAt: 1 });

    const waitingCount = await QueueTicket.countDocuments({ status: 'waiting' });
    const calledCount = await QueueTicket.countDocuments({ status: 'called' });
    const inChairCount = await QueueTicket.countDocuments({ status: 'in-chair' });

    res.json({
      success: true,
      count: tickets.length,
      tickets,
      summary: {
        waitingCount,
        calledCount,
        inChairCount,
        totalActive: waitingCount + calledCount + inChairCount,
      },
    });
  } catch (error) {
    console.error('Error fetching queue list:', error);
    res.status(500).json({ success: false, message: 'Server error fetching queue list.' });
  }
});

/**
 * POST /api/queue/call-next
 * Allocation algorithm: Assign next waiting customer to a specific barber
 */
router.post('/call-next', async (req, res) => {
  try {
    const { barberId } = req.body;

    if (!barberId) {
      return res.status(400).json({ success: false, message: 'Barber ID is required.' });
    }

    // 1. Validate barber existence and status
    let barber = null;
    if (mongoose.Types.ObjectId.isValid(barberId)) {
      barber = await Barber.findById(barberId);
    } else {
      barber = await Barber.findOne({ name: new RegExp(`^${barberId}$`, 'i') });
    }

    if (!barber) {
      return res.status(404).json({ success: false, message: 'Barber not found.' });
    }

    if (barber.status === 'break') {
      return res.status(400).json({
        success: false,
        message: `${barber.name} is currently on break. Please change status to free first.`,
      });
    }

    // 2. Validate barber does NOT already have an active customer in-chair or called
    const activeCustomer = await QueueTicket.findOne({
      assignedBarber: barber._id,
      status: { $in: ['called', 'in-chair'] },
    });

    if (activeCustomer) {
      return res.status(400).json({
        success: false,
        message: `${barber.name} already has an active customer: ${activeCustomer.token} (${activeCustomer.customerName}) in chair or called.`,
        activeTicket: activeCustomer,
      });
    }

    // Self-heal: If barber was marked busy but has no active tickets, ensure they are free to take customers
    if (barber.status === 'busy') {
      barber.status = 'free';
      await barber.save();
    }

    // 3. Selection Rule:
    // Find the earliest customer with status 'waiting' where:
    // preferredBarber == barberId OR preferredBarber matches barber.name OR preferredBarber == "any"
    // Strict rule: A customer who requested Ravi must NEVER be called by Amit or Imran!
    const candidateTicket = await QueueTicket.findOne({
      status: 'waiting',
      $or: [
        { preferredBarber: 'any' },
        { preferredBarber: { $regex: new RegExp(`^${barber.name}$`, 'i') } },
        { preferredBarber: barber._id.toString() },
        { preferredBarber: barber._id },
      ],
    })
      .sort({ joinedAt: 1 })
      .populate('services');

    if (!candidateTicket) {
      return res.status(200).json({
        success: false,
        noMatch: true,
        message: `No waiting customer matches Barber ${barber.name} at this moment.`,
      });
    }

    // 4. Update ticket status to 'called' and assign barber
    candidateTicket.status = 'called';
    candidateTicket.assignedBarber = barber._id;
    candidateTicket.calledAt = new Date();
    await candidateTicket.save();

    // 5. Update barber status to 'busy'
    barber.status = 'busy';
    await barber.save();

    const populatedTicket = await QueueTicket.findById(candidateTicket._id)
      .populate('services')
      .populate('assignedBarber');

    // 6. Broadcast over Socket.io
    if (req.io) {
      req.io.emit('queue:updated', {
        action: 'called',
        ticketId: populatedTicket._id,
        token: populatedTicket.token,
        customerName: populatedTicket.customerName,
        barberId: barber._id,
        barberName: barber.name,
      });

      req.io.emit('ticket:called', {
        ticketId: populatedTicket._id,
        token: populatedTicket.token,
        assignedBarber: barber,
      });

      req.io.emit('barber:updated', {
        barberId: barber._id,
        status: barber.status,
      });
    }

    res.json({
      success: true,
      message: `Successfully called ${populatedTicket.token} (${populatedTicket.customerName}) for ${barber.name}!`,
      ticket: populatedTicket,
      barber,
    });
  } catch (error) {
    console.error('Error in call-next algorithm:', error);
    res.status(500).json({ success: false, message: 'Server error executing call-next.' });
  }
});

/**
 * POST /api/queue/walkin
 * Reception desk walk-in customer addition
 */
router.post('/walkin', async (req, res) => {
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

    // 2. Active spot check
    const existingActiveTicket = await QueueTicket.findOne({
      phone: cleanPhone,
      status: { $in: ['waiting', 'called', 'in-chair'] },
    }).populate('services');

    if (existingActiveTicket) {
      return res.status(409).json({
        success: false,
        alreadyActive: true,
        message: `Phone number already has an active spot: ${existingActiveTicket.token}`,
        ticket: existingActiveTicket,
      });
    }

    // 3. Verify services
    const validServices = await Service.find({
      _id: { $in: services },
      isActive: true,
    });

    if (validServices.length !== services.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more selected services are invalid.',
      });
    }

    // 4. Token sequence
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todayCount = await QueueTicket.countDocuments({
      createdAt: { $gte: startOfToday },
    });

    const token = `S-${todayCount + 1}`;

    // 5. Calculate wait estimate
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
    const populatedTicket = await QueueTicket.findById(newTicket._id)
      .populate('services')
      .populate('assignedBarber');

    if (req.io) {
      req.io.emit('queue:updated', {
        action: 'walkin_added',
        ticketId: populatedTicket._id,
        token: populatedTicket.token,
        customerName: populatedTicket.customerName,
      });
    }

    res.status(201).json({
      success: true,
      message: `Walk-in customer registered with Token ${populatedTicket.token}!`,
      ticket: populatedTicket,
    });
  } catch (error) {
    console.error('Error adding walk-in:', error);
    res.status(500).json({ success: false, message: 'Server error registering walk-in.' });
  }
});

/**
 * POST /api/queue/:id/no-show
 * Mark a ticket as no-show and release the barber
 */
router.post('/:id/no-show', async (req, res) => {
  try {
    const { id } = req.params;
    let ticket = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      ticket = await QueueTicket.findById(id).populate('assignedBarber');
    } else {
      ticket = await QueueTicket.findOne({ token: id }).populate('assignedBarber');
    }

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found.' });
    }

    ticket.status = 'no-show';
    await ticket.save();

    // Release barber back to free if assigned and no other in-chair tickets
    if (ticket.assignedBarber) {
      const barberId = ticket.assignedBarber._id;
      const otherActive = await QueueTicket.findOne({
        _id: { $ne: ticket._id },
        assignedBarber: barberId,
        status: { $in: ['called', 'in-chair'] },
      });

      if (!otherActive) {
        await Barber.findByIdAndUpdate(barberId, { status: 'free' });
        if (req.io) {
          req.io.emit('barber:updated', { barberId, status: 'free' });
        }
      }
    }

    if (req.io) {
      req.io.emit('queue:updated', {
        action: 'no_show',
        ticketId: ticket._id,
        token: ticket.token,
      });
      req.io.emit('ticket:no-show', {
        ticketId: ticket._id,
        token: ticket.token,
      });
    }

    res.json({
      success: true,
      message: `Ticket ${ticket.token} marked as no-show.`,
      ticket,
    });
  } catch (error) {
    console.error('Error marking no-show:', error);
    res.status(500).json({ success: false, message: 'Server error marking no-show.' });
  }
});

/**
 * POST /api/queue/join
 * Join the digital walk-in queue
 */
router.post('/join', async (req, res) => {
  try {
    // 0. Master Queue Switch check
    const settings = await SalonSetting.getSettings();
    if (!settings.isQueueOpen) {
      return res.status(403).json({
        success: false,
        queueClosed: true,
        message: 'Online joining is closed for today. Walk-ins are still welcome at the salon.',
      });
    }

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

/**
 * POST /api/queue/:id/cancel
 * Cancel a spot in the queue
 */
router.post('/:id/cancel', async (req, res) => {
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

    if (ticket.status === 'cancelled') {
      return res.status(200).json({
        success: true,
        message: 'Ticket is already cancelled.',
        ticket,
      });
    }

    if (ticket.status === 'done') {
      return res.status(400).json({
        success: false,
        message: 'Completed services cannot be cancelled.',
      });
    }

    ticket.status = 'cancelled';
    await ticket.save();

    // Release barber if this ticket was assigned and barber has no other in-chair tickets
    if (ticket.assignedBarber) {
      const barberId = ticket.assignedBarber._id || ticket.assignedBarber;
      const otherActive = await QueueTicket.findOne({
        _id: { $ne: ticket._id },
        assignedBarber: barberId,
        status: { $in: ['called', 'in-chair'] },
      });
      if (!otherActive) {
        await Barber.findByIdAndUpdate(barberId, { status: 'free' });
        if (req.io) {
          req.io.emit('barber:updated', { barberId, status: 'free' });
        }
      }
    }

    // Recalculate and emit socket updates
    if (req.io) {
      req.io.emit('queue:updated', {
        action: 'cancelled',
        ticketId: ticket._id,
        token: ticket.token,
        customerName: ticket.customerName,
      });
      req.io.emit('ticket:cancelled', {
        ticketId: ticket._id,
        token: ticket.token,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Spot successfully cancelled.',
      ticket,
    });
  } catch (error) {
    console.error('Error cancelling spot:', error);
    res.status(500).json({ success: false, message: 'Server error while cancelling spot.' });
  }
});

/**
 * POST /api/queue/:id/start
 * Updates ticket status to in-chair and starts elapsed service timer
 * Emits ticket:started and queue:updated
 */
router.post('/:id/start', async (req, res) => {
  try {
    const { id } = req.params;
    let ticket = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      ticket = await QueueTicket.findById(id);
    } else {
      ticket = await QueueTicket.findOne({ token: id });
    }

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found.' });
    }

    if (ticket.status === 'done' || ticket.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: `Cannot start service for ticket in "${ticket.status}" status.`,
      });
    }

    ticket.status = 'in-chair';
    ticket.inChairAt = new Date();

    // Ensure assigned barber is set to busy
    if (ticket.assignedBarber) {
      const barber = await Barber.findById(ticket.assignedBarber);
      if (barber) {
        barber.status = 'busy';
        await barber.save();

        if (req.io) {
          req.io.emit('barber:updated', {
            barberId: barber._id,
            name: barber.name,
            status: 'busy',
            isOnDuty: barber.isOnDuty,
          });
          req.io.emit('barber:status-changed', {
            barberId: barber._id,
            name: barber.name,
            status: 'busy',
          });
        }
      }
    }

    await ticket.save();

    const populatedTicket = await QueueTicket.findById(ticket._id)
      .populate('services')
      .populate('assignedBarber');

    if (req.io) {
      req.io.emit('ticket:started', {
        ticketId: populatedTicket._id,
        token: populatedTicket.token,
        status: 'in-chair',
        assignedBarber: populatedTicket.assignedBarber,
      });

      req.io.emit('queue:updated', {
        action: 'started',
        ticketId: populatedTicket._id,
        token: populatedTicket.token,
        status: 'in-chair',
      });
    }

    res.json({
      success: true,
      message: `Service started for Token ${populatedTicket.token}! Customer is now seated in chair.`,
      ticket: populatedTicket,
    });
  } catch (error) {
    console.error('Error starting service for ticket:', error);
    res.status(500).json({ success: false, message: 'Server error starting service.' });
  }
});

/**
 * POST /api/queue/:id/done
 * Updates ticket status to done, sets barber status to free
 * Emits ticket:done and queue:updated
 */
router.post('/:id/done', async (req, res) => {
  try {
    const { id } = req.params;
    let ticket = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      ticket = await QueueTicket.findById(id);
    } else {
      ticket = await QueueTicket.findOne({ token: id });
    }

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found.' });
    }

    ticket.status = 'done';
    ticket.completedAt = new Date();
    await ticket.save();

    // Release barber back to free if no other active in-chair/called ticket exists
    if (ticket.assignedBarber) {
      const barberId = ticket.assignedBarber._id || ticket.assignedBarber;
      const otherActive = await QueueTicket.findOne({
        _id: { $ne: ticket._id },
        assignedBarber: barberId,
        status: { $in: ['called', 'in-chair'] },
      });

      if (!otherActive) {
        const barber = await Barber.findById(barberId);
        if (barber) {
          // If barber was not manually put on break, return to free
          if (barber.status !== 'break') {
            barber.status = 'free';
            await barber.save();
          }

          if (req.io) {
            req.io.emit('barber:updated', {
              barberId: barber._id,
              name: barber.name,
              status: barber.status,
              isOnDuty: barber.isOnDuty,
            });
            req.io.emit('barber:status-changed', {
              barberId: barber._id,
              name: barber.name,
              status: barber.status,
            });
          }
        }
      }
    }

    const populatedTicket = await QueueTicket.findById(ticket._id)
      .populate('services')
      .populate('assignedBarber');

    if (req.io) {
      req.io.emit('ticket:done', {
        ticketId: populatedTicket._id,
        token: populatedTicket.token,
        status: 'done',
        assignedBarber: populatedTicket.assignedBarber,
      });

      req.io.emit('queue:updated', {
        action: 'done',
        ticketId: populatedTicket._id,
        token: populatedTicket.token,
        status: 'done',
      });
    }

    res.json({
      success: true,
      message: `Service completed for Token ${populatedTicket.token}! Barber chair is now free.`,
      ticket: populatedTicket,
    });
  } catch (error) {
    console.error('Error completing service for ticket:', error);
    res.status(500).json({ success: false, message: 'Server error completing service.' });
  }
});

/**
 * PATCH /api/queue/:id/status
 * Update ticket status (waiting, called, in-chair, done, no-show, cancelled)
 */
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, barberId, barberName } = req.body;

    const validStatuses = ['waiting', 'called', 'in-chair', 'done', 'cancelled', 'no-show'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    let ticket = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      ticket = await QueueTicket.findById(id);
    } else {
      ticket = await QueueTicket.findOne({ token: id });
    }

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found.' });
    }

    ticket.status = status;

    if (status === 'called') {
      ticket.calledAt = new Date();
    } else if (status === 'in-chair') {
      ticket.inChairAt = new Date();
    } else if (status === 'done') {
      ticket.completedAt = new Date();
    }

    // Assign barber if provided
    if (barberId && mongoose.Types.ObjectId.isValid(barberId)) {
      ticket.assignedBarber = barberId;
    } else if (barberName) {
      const barber = await Barber.findOne({ name: new RegExp(`^${barberName}$`, 'i') });
      if (barber) {
        ticket.assignedBarber = barber._id;
      }
    }

    await ticket.save();

    // If status transitioned to done, no-show, or cancelled, release barber back to free
    if (['done', 'no-show', 'cancelled'].includes(status) && ticket.assignedBarber) {
      const bId = ticket.assignedBarber._id || ticket.assignedBarber;
      const otherActive = await QueueTicket.findOne({
        _id: { $ne: ticket._id },
        assignedBarber: bId,
        status: { $in: ['called', 'in-chair'] },
      });
      if (!otherActive) {
        await Barber.findByIdAndUpdate(bId, { status: 'free' });
        if (req.io) {
          req.io.emit('barber:updated', { barberId: bId, status: 'free' });
        }
      }
    }

    const updatedTicket = await QueueTicket.findById(ticket._id)
      .populate('services')
      .populate('assignedBarber');

    if (req.io) {
      req.io.emit('queue:updated', {
        action: 'status_changed',
        ticketId: updatedTicket._id,
        token: updatedTicket.token,
        status: updatedTicket.status,
      });

      if (status === 'called') {
        req.io.emit('ticket:called', {
          ticketId: updatedTicket._id,
          token: updatedTicket.token,
          assignedBarber: updatedTicket.assignedBarber,
        });
      }
    }

    res.json({
      success: true,
      message: `Ticket status updated to ${status}.`,
      ticket: updatedTicket,
    });
  } catch (error) {
    console.error('Error updating ticket status:', error);
    res.status(500).json({ success: false, message: 'Server error updating ticket status.' });
  }
});

export default router;
