import express from 'express';
import mongoose from 'mongoose';
import { Service } from '../models/index.js';

const router = express.Router();

/**
 * GET /api/services
 * Returns services. By default active only; with ?all=true returns all services including inactive.
 */
router.get('/', async (req, res) => {
  try {
    const { all } = req.query;
    const filter = all === 'true' ? {} : { isActive: true };
    const services = await Service.find(filter).sort({ priceInr: 1 });
    res.json({ success: true, count: services.length, services });
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ success: false, message: 'Server error fetching services.' });
  }
});

/**
 * POST /api/services
 * Add a new service
 */
router.post('/', async (req, res) => {
  try {
    const { name, durationMinutes, priceInr, isActive } = req.body;

    let enName = '';
    let guName = '';

    if (typeof name === 'object') {
      enName = String(name.en || '').trim();
      guName = String(name.gu || '').trim();
    } else {
      enName = String(name || '').trim();
      guName = enName;
    }

    if (!enName) {
      return res.status(400).json({ success: false, message: 'Service name (English) is required.' });
    }

    const duration = Number(durationMinutes);
    const price = Number(priceInr);

    if (!duration || duration <= 0) {
      return res.status(400).json({ success: false, message: 'Valid duration (minutes) is required.' });
    }

    if (isNaN(price) || price < 0) {
      return res.status(400).json({ success: false, message: 'Valid price (INR) is required.' });
    }

    const newService = new Service({
      name: {
        en: enName,
        gu: guName || enName,
      },
      durationMinutes: duration,
      priceInr: price,
      isActive: typeof isActive === 'boolean' ? isActive : true,
    });

    await newService.save();

    if (req.io) {
      req.io.emit('services:updated', { action: 'created', serviceId: newService._id });
      req.io.emit('queue:updated', { action: 'service_catalog_changed' });
    }

    res.status(201).json({
      success: true,
      message: `Service "${newService.name.en}" created successfully.`,
      service: newService,
    });
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).json({ success: false, message: 'Server error creating service.' });
  }
});

/**
 * PUT /api/services/:id
 * Update an existing service
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, durationMinutes, priceInr, isActive } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid service ID.' });
    }

    const service = await Service.findById(id);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found.' });
    }

    if (name) {
      if (typeof name === 'object') {
        if (name.en) service.name.en = String(name.en).trim();
        if (name.gu) service.name.gu = String(name.gu).trim();
      } else {
        service.name.en = String(name).trim();
      }
    }

    if (durationMinutes !== undefined) {
      const dur = Number(durationMinutes);
      if (dur > 0) service.durationMinutes = dur;
    }

    if (priceInr !== undefined) {
      const prc = Number(priceInr);
      if (prc >= 0) service.priceInr = prc;
    }

    if (typeof isActive === 'boolean') {
      service.isActive = isActive;
    }

    await service.save();

    if (req.io) {
      req.io.emit('services:updated', { action: 'updated', serviceId: service._id });
      req.io.emit('queue:updated', { action: 'service_catalog_changed' });
    }

    res.json({
      success: true,
      message: `Service "${service.name.en}" updated successfully.`,
      service,
    });
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({ success: false, message: 'Server error updating service.' });
  }
});

/**
 * DELETE /api/services/:id
 * Remove a service
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid service ID.' });
    }

    const service = await Service.findByIdAndDelete(id);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found.' });
    }

    if (req.io) {
      req.io.emit('services:updated', { action: 'deleted', serviceId: id });
      req.io.emit('queue:updated', { action: 'service_catalog_changed' });
    }

    res.json({
      success: true,
      message: `Service "${service.name?.en || id}" deleted successfully.`,
    });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({ success: false, message: 'Server error deleting service.' });
  }
});

export default router;
