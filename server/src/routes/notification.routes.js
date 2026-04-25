const express = require('express');
const router = express.Router();
const prisma = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { sendSuccess, sendError } = require('../utils/helpers');

router.use(authenticate);

// ---- GET /api/notifications ----
// Get user's notifications
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 30;
    
    const notifications = await prisma.notificationLog.findMany({
      where: { recipientUserId: req.user.userId },
      orderBy: { sentAt: 'desc' },
      take: limit,
      select: {
        id: true,
        subject: true,
        body: true,
        status: true,
        isRead: true,
        sentAt: true,
        deepLink: true,
        ticket: { select: { id: true, status: true } },
      },
    });

    const unreadCount = await prisma.notificationLog.count({
      where: { recipientUserId: req.user.userId, isRead: false },
    });

    return sendSuccess(res, { notifications, unreadCount });
  } catch (error) {
    console.error('Fetch notifications error:', error);
    return sendError(res, 'Failed to fetch notifications.');
  }
});

// ---- PUT /api/notifications/:id/read ----
// Mark single notification as read
router.put('/:id/read', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const notif = await prisma.notificationLog.findUnique({ where: { id } });
    
    if (!notif) return sendError(res, 'Notification not found.', 404);
    if (notif.recipientUserId !== req.user.userId) return sendError(res, 'Access denied.', 403);

    await prisma.notificationLog.update({
      where: { id },
      data: { isRead: true },
    });
    
    return sendSuccess(res, null, 200, 'Marked as read');
  } catch (error) {
    console.error('Mark read error:', error);
    return sendError(res, 'Failed to update notification.');
  }
});

// ---- PUT /api/notifications/read-all ----
// Mark all notifications as read
router.put('/read-all', async (req, res) => {
  try {
    await prisma.notificationLog.updateMany({
      where: { recipientUserId: req.user.userId, isRead: false },
      data: { isRead: true },
    });
    return sendSuccess(res, null, 200, 'All marked as read');
  } catch (error) {
    console.error('Mark all read error:', error);
    return sendError(res, 'Failed to update notifications.');
  }
});

module.exports = router;
