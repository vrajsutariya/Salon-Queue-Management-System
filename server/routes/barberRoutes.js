import express from 'express';
import mongoose from 'mongoose';
import { Barber, QueueTicket } from '../models/index.js';

const router = express.Router();

/**
 * GET /api/barbers
 * Returns barbers. If ?all=true returns all barbers; otherwise returns on-duty barbers.
 */
router.get('/', async (req, res) => {
  try {
    const { all } = req.query;
    const filter = all === 'true' ? {} : { isOnDuty: true };
    const barbers = await Barber.find(filter).sort({ name: 1 });
    res.json({ success: true, count: barbers.length, barbers });
  } catch (error) {
    console.error('Error fetching barbers:', error);
    res.status(500).json({ success: false, message: 'Server error fetching barbers' });
  }
});

/**
 * POST /api/barbers
 * Add a new barber to the roster
 */
router.post('/', async (req, res) => {
  try {
    const { name, photo, status, isOnDuty } = req.body;
    const cleanName = String(name || '').trim();

    if (!cleanName || cleanName.length < 2) {
      return res.status(400).json({ success: false, message: 'Valid barber name (at least 2 letters) is required.' });
    }

    const existing = await Barber.findOne({ name: new RegExp(`^${cleanName}$`, 'i') });
    if (existing) {
      return res.status(409).json({ success: false, message: `A barber named "${cleanName}" already exists.` });
    }

    const newBarber = new Barber({
      name: cleanName,
      photo: photo || '',
      status: status || 'free',
      isOnDuty: typeof isOnDuty === 'boolean' ? isOnDuty : true,
    });

    await newBarber.save();

    if (req.io) {
      req.io.emit('barber:updated', {
        action: 'created',
        barberId: newBarber._id,
        name: newBarber.name,
        status: newBarber.status,
        isOnDuty: newBarber.isOnDuty,
      });
      req.io.emit('queue:updated', { action: 'barber_roster_changed' });
    }

    res.status(201).json({
      success: true,
      message: `Barber ${newBarber.name} added successfully.`,
      barber: newBarber,
    });
  } catch (error) {
    console.error('Error adding barber:', error);
    res.status(500).json({ success: false, message: 'Server error adding barber.' });
  }
});

/**
 * PUT /api/barbers/:id
 * Update barber details, status, and on-duty state
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, photo, status, isOnDuty } = req.body;

    let barber = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      barber = await Barber.findById(id);
    } else {
      barber = await Barber.findOne({ name: new RegExp(`^${id}$`, 'i') });
    }

    if (!barber) {
      return res.status(404).json({ success: false, message: 'Barber not found.' });
    }

    if (name) {
      const cleanName = String(name).trim();
      if (cleanName.length >= 2) {
        barber.name = cleanName;
      }
    }

    if (photo !== undefined) {
      barber.photo = photo;
    }

    if (status) {
      const validStatuses = ['free', 'busy', 'break'];
      if (validStatuses.includes(status)) {
        barber.status = status;
      }
    }

    if (typeof isOnDuty === 'boolean') {
      barber.isOnDuty = isOnDuty;
    }

    await barber.save();

    if (req.io) {
      req.io.emit('barber:updated', {
        action: 'updated',
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
      req.io.emit('queue:updated', { action: 'barber_roster_changed' });
    }

    res.json({
      success: true,
      message: `Barber ${barber.name} updated successfully.`,
      barber,
    });
  } catch (error) {
    console.error('Error updating barber:', error);
    res.status(500).json({ success: false, message: 'Server error updating barber.' });
  }
});

/**
 * DELETE /api/barbers/:id
 * Remove a barber from the salon roster
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let barber = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      barber = await Barber.findByIdAndDelete(id);
    } else {
      barber = await Barber.findOneAndDelete({ name: new RegExp(`^${id}$`, 'i') });
    }

    if (!barber) {
      return res.status(404).json({ success: false, message: 'Barber not found.' });
    }

    if (req.io) {
      req.io.emit('barber:updated', { action: 'deleted', barberId: barber._id });
      req.io.emit('queue:updated', { action: 'barber_roster_changed' });
    }

    res.json({
      success: true,
      message: `Barber ${barber.name} removed from roster.`,
    });
  } catch (error) {
    console.error('Error deleting barber:', error);
    res.status(500).json({ success: false, message: 'Server error deleting barber.' });
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
