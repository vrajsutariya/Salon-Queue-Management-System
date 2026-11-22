import express from 'express';
import mongoose from 'mongoose';
import { Barber, QueueTicket } from '../models/index.js';

const router = express.Router();

/**
 * GET /api/barbers
 * Returns all on-duty barbers
 */
router.get('/', async (req, res) => {
  try {
    const barbers = await Barber.find({ isOnDuty: true }).sort({ name: 1 });
    res.json({ success: true, count: barbers.length, barbers });
  } catch (error) {
    console.error('Error fetching barbers:', error);
    res.status(500).json({ success: false, message: 'Server error fetching barbers' });
  }
});

/**
 * GET /api/barbers/:identifier
 * Returns a barber by ID or name
 */
router.get('/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    let barber = null;

    if (mongoose.Types.ObjectId.isValid(identifier)) {
      barber = await Barber.findById(identifier);
    } else {
      barber = await Barber.findOne({ name: new RegExp(`^${identifier}$`, 'i') });
    }

    if (!barber) {
      return res.status(404).json({ success: false, message: 'Barber not found.' });
    }

    res.json({ success: true, barber });
  } catch (error) {
    console.error('Error fetching barber:', error);
    res.status(500).json({ success: false, message: 'Server error fetching barber' });
  }
});

/**
 * POST /api/barbers/:name/toggle-break
 * Toggles status between 'free' and 'break' (or 'break' <-> 'free' / 'busy')
 * Emits barber:status-changed, barber:updated, and queue:updated
 */
router.post('/:name/toggle-break', async (req, res) => {
  try {
    const { name } = req.params;
    let barber = null;

    if (mongoose.Types.ObjectId.isValid(name)) {
      barber = await Barber.findById(name);
    } else {
      barber = await Barber.findOne({ name: new RegExp(`^${name}$`, 'i') });
    }

    if (!barber) {
      return res.status(404).json({ success: false, message: `Barber "${name}" not found.` });
    }

    // Toggle status: If 'break', revert to 'free'. If not 'break', switch to 'break'.
    const nextStatus = barber.status === 'break' ? 'free' : 'break';
    barber.status = nextStatus;
    await barber.save();

    // Broadcast real-time events over Socket.io
    if (req.io) {
      req.io.emit('barber:status-changed', {
        barberId: barber._id,
        name: barber.name,
        status: barber.status,
      });

      req.io.emit('barber:updated', {
        barberId: barber._id,
        name: barber.name,
        status: barber.status,
        isOnDuty: barber.isOnDuty,
      });

      req.io.emit('queue:updated', {
        action: 'barber_break_toggle',
        barberId: barber._id,
        barberName: barber.name,
        status: barber.status,
      });
    }

    res.json({
      success: true,
      message: `Barber ${barber.name} is now ${barber.status === 'break' ? 'On Break' : 'Available'}.`,
      barber,
    });
  } catch (error) {
    console.error('Error toggling barber break:', error);
    res.status(500).json({ success: false, message: 'Server error toggling barber break.' });
  }
});

/**
 * PATCH /api/barbers/:id/status
 * Update barber status and on-duty flag
 */
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, isOnDuty } = req.body;

    let barber = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      barber = await Barber.findById(id);
    } else {
      barber = await Barber.findOne({ name: new RegExp(`^${id}$`, 'i') });
    }

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
      req.io.emit('barber:status-changed', {
        barberId: barber._id,
        name: barber.name,
        status: barber.status,
      });

      req.io.emit('barber:updated', {
        barberId: barber._id,
        name: barber.name,
        status: barber.status,
        isOnDuty: barber.isOnDuty,
      });

      req.io.emit('queue:updated', {
        action: 'barber_status_change',
        barberId: barber._id,
        barberName: barber.name,
        status: barber.status,
      });
    }

    res.json({
      success: true,
      message: `Barber ${barber.name} status updated to ${barber.status}.`,
      barber,
    });
  } catch (error) {
    console.error('Error updating barber status:', error);
    res.status(500).json({ success: false, message: 'Server error updating barber status.' });
  }
});

export default router;
