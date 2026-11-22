import express from 'express';
import { QueueTicket, SalonSetting, Barber, Service } from '../models/index.js';

const router = express.Router();

/**
 * POST /api/admin/verify-pin
 * Validates 4-digit PIN (default: '1234')
 */
router.post('/verify-pin', async (req, res) => {
  try {
    const { pin } = req.body;
    const settings = await SalonSetting.getSettings();

    const expectedPin = settings.adminPin || '1234';

    if (!pin || String(pin).trim() !== String(expectedPin).trim()) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect PIN. Try again.',
      });
    }

    res.json({
      success: true,
      message: 'PIN verified successfully. Owner session unlocked.',
    });
  } catch (error) {
    console.error('Error verifying admin PIN:', error);
    res.status(500).json({ success: false, message: 'Server error verifying PIN.' });
  }
});

/**
 * GET /api/admin/settings
 * Returns current salon operational settings
 */
router.get('/settings', async (req, res) => {
  try {
    const settings = await SalonSetting.getSettings();
    res.json({
      success: true,
      settings: {
        isQueueOpen: settings.isQueueOpen,
        closingTime: settings.closingTime,
        announcement: settings.announcement,
      },
    });
  } catch (error) {
    console.error('Error fetching admin settings:', error);
    res.status(500).json({ success: false, message: 'Server error fetching settings.' });
  }
});

/**
 * POST /api/admin/queue-toggle
 * Updates salon online queue open/closed state in MongoDB
 * Emits salon:status-changed and queue:updated
 */
router.post('/queue-toggle', async (req, res) => {
  try {
    const { isQueueOpen } = req.body;
    const settings = await SalonSetting.getSettings();

    if (typeof isQueueOpen === 'boolean') {
      settings.isQueueOpen = isQueueOpen;
    } else {
      settings.isQueueOpen = !settings.isQueueOpen;
    }

    await settings.save();

    if (req.io) {
      req.io.emit('salon:status-changed', {
        isQueueOpen: settings.isQueueOpen,
        closingTime: settings.closingTime,
      });

      req.io.emit('queue:updated', {
        action: 'queue_toggle',
        isQueueOpen: settings.isQueueOpen,
      });
    }

    res.json({
      success: true,
      isQueueOpen: settings.isQueueOpen,
      message: `Online queue is now ${settings.isQueueOpen ? 'OPEN' : 'CLOSED'}.`,
      settings,
    });
  } catch (error) {
    console.error('Error toggling queue status:', error);
    res.status(500).json({ success: false, message: 'Server error toggling queue status.' });
  }
});

/**
 * GET /api/admin/stats
 * Aggregates today's real-time analytics:
 * - Customers served (done)
 * - Average wait time (minutes)
 * - No-show count
 * - Today's estimated revenue
 */
router.get('/stats', async (req, res) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todayTickets = await QueueTicket.find({
      createdAt: { $gte: startOfToday },
    }).populate('services');

    const doneTickets = todayTickets.filter((t) => t.status === 'done');
    const noShowTickets = todayTickets.filter((t) => t.status === 'no-show');
    const waitingTickets = todayTickets.filter((t) => t.status === 'waiting');
    const inChairTickets = todayTickets.filter((t) => t.status === 'in-chair');

    // 1. Total revenue earned from completed tickets
    let todayRevenue = 0;
    doneTickets.forEach((t) => {
      t.services?.forEach((s) => {
        todayRevenue += s.priceInr || 0;
      });
    });

    // 2. Average wait time in minutes before customer was called
    let totalWaitMinutes = 0;
    let waitCalculatedCount = 0;

    todayTickets.forEach((t) => {
      if (t.calledAt && t.joinedAt) {
        const diffMs = new Date(t.calledAt) - new Date(t.joinedAt);
        const mins = Math.max(0, Math.round(diffMs / 60000));
        totalWaitMinutes += mins;
        waitCalculatedCount++;
      }
    });

    const avgWaitTimeMinutes =
      waitCalculatedCount > 0
        ? Math.round(totalWaitMinutes / waitCalculatedCount)
        : doneTickets.length > 0
        ? 15
        : 0;

    const stats = {
      customersServed: doneTickets.length,
      avgWaitTimeMinutes,
      noShowCount: noShowTickets.length,
      todayRevenue,
      waitingCount: waitingTickets.length,
      inChairCount: inChairTickets.length,
      totalActiveToday: todayTickets.length,
    };

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ success: false, message: 'Server error aggregating stats.' });
  }
});

export default router;
