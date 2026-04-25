const express = require('express');
const router = express.Router();
const prisma = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { sendSuccess, sendError } = require('../utils/helpers');

// ---- GET /api/directives/active ----
// Get the currently active directive
router.get('/active', async (req, res) => {
  try {
    const directive = await prisma.directive.findFirst({
      where: {
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { name: true } },
      },
    });

    return sendSuccess(res, { directive });
  } catch (error) {
    console.error('Fetch active directive error:', error);
    return sendError(res, 'Failed to fetch directive.');
  }
});

// ---- POST /api/directives ----
// Post a new executive directive
router.post('/', authenticate, requireRole('OFFICER', 'ADMIN'), async (req, res) => {
  try {
    const { message, priority, expiresInHours } = req.body;

    if (!message) return sendError(res, 'Message is required.', 400);

    // Deactivate all previous
    await prisma.directive.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    let expiresAt = null;
    if (expiresInHours) {
      expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + expiresInHours);
    }

    const directive = await prisma.directive.create({
      data: {
        authorId: req.user.userId,
        message,
        priority: priority || 'normal',
        expiresAt,
      },
    });

    return sendSuccess(res, { directive }, 201, 'Directive posted');
  } catch (error) {
    console.error('Post directive error:', error);
    return sendError(res, 'Failed to post directive.');
  }
});

module.exports = router;
