// ===========================================
// Ticket Routes — Full Lifecycle
// Implements the ticket state machine:
// PENDING_AI → PENDING_ADMIN → ASSIGNED → RESOLVED
//                             → ESCALATED_TO_ADMIN → REJECTED / re-ASSIGNED
// ===========================================

const express = require('express');
const router = express.Router();

const prisma = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { upload, handleUploadError } = require('../middleware/upload');
const { classifyImage } = require('../services/ai.service');
const {
  notifyTicketAssigned,
  notifyTicketResolved,
  notifyTicketEscalated,
  notifyTicketRejected,
  notifyTicketReassigned,
} = require('../services/email.service');
const { buildAssignmentSlaData } = require('../services/sla.service');
const { sendSuccess, sendError, getPagination } = require('../utils/helpers');

const PUBLIC_UPVOTE_PRIORITY_THRESHOLD = 5;

// All ticket routes require authentication
router.use(authenticate);

// ---- POST /api/tickets ----
// Citizen creates a new ticket with image upload and GPS coordinates.
// Triggers AI classification pipeline automatically.
router.post(
  '/',
  requireRole('CITIZEN'),
  upload.single('image'),
  handleUploadError,
  async (req, res) => {
    try {
      const { description, latitude, longitude, visibility } = req.body;
      const citizenId = req.user.userId;

      // Validate required fields
      if (!req.file) {
        return sendError(res, 'An image file is required.', 400, 'VALIDATION_ERROR');
      }
      if (!latitude || !longitude) {
        return sendError(res, 'GPS coordinates (latitude, longitude) are required.', 400, 'VALIDATION_ERROR');
      }
      if (!visibility || !['PUBLIC', 'PRIVATE'].includes(visibility)) {
        return sendError(res, 'Visibility must be either "PUBLIC" or "PRIVATE".', 400, 'VALIDATION_ERROR');
      }

      const imageUrl = req.file.path;

      // Create ticket with initial PENDING_AI status
      const ticket = await prisma.ticket.create({
        data: {
          citizenId,
          description: description || null,
          imageUrl,
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          visibility,
          status: 'PENDING_AI',
        },
      });

      // Trigger AI classification asynchronously
      // (runs in background but updates the ticket)
      classifyImage(req.file.path)
        .then(async (result) => {
          await prisma.ticket.update({
            where: { id: ticket.id },
            data: {
              recommendedDepartmentId: result.departmentId,
              aiConfidenceScore: result.confidence,
              status: 'PENDING_ADMIN',
            },
          });
          console.log(`✅ Ticket #${ticket.id} classified: ${result.label} (${result.confidence})`);
        })
        .catch(async (err) => {
          console.error(`❌ AI classification failed for ticket #${ticket.id}:`, err);
          // Still move to PENDING_ADMIN for manual review
          await prisma.ticket.update({
            where: { id: ticket.id },
            data: { status: 'PENDING_ADMIN' },
          });
        });

      return sendSuccess(res, { ticket }, 201, 'Ticket created successfully. AI classification in progress.');
    } catch (error) {
      console.error('Create ticket error:', error);
      return sendError(res, 'Failed to create ticket.');
    }
  }
);

// ---- GET /api/tickets/nearby ----
// Find open tickets within a radius of the given coordinates.
// Used by the citizen duplicate-report nudge before submission.
// Uses Haversine approximation (1 degree ≈ 111 km).
router.get('/nearby', requireRole('CITIZEN'), async (req, res) => {
  try {
    const { lat, lng, radiusKm = 0.5 } = req.query;

    if (!lat || !lng) {
      return sendError(res, 'Latitude and longitude are required.', 400, 'VALIDATION_ERROR');
    }

    const latF = parseFloat(lat);
    const lngF = parseFloat(lng);
    const radius = parseFloat(radiusKm);

    // Approximate bounding box (1 deg lat ≈ 111 km, 1 deg lng ≈ 111 km * cos(lat))
    const deltaLat = radius / 111.0;
    const deltaLng = radius / (111.0 * Math.cos((latF * Math.PI) / 180));

    const tickets = await prisma.ticket.findMany({
      where: {
        status: { notIn: ['RESOLVED', 'REJECTED'] },
        latitude: { gte: latF - deltaLat, lte: latF + deltaLat },
        longitude: { gte: lngF - deltaLng, lte: lngF + deltaLng },
        // Exclude the authenticated citizen's own tickets to avoid self-nudge
        citizenId: { not: req.user.userId },
      },
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        description: true,
        imageUrl: true,
        status: true,
        latitude: true,
        longitude: true,
        createdAt: true,
        assignedDepartment: { select: { id: true, name: true } },
        recommendedDepartment: { select: { id: true, name: true } },
      },
    });

    // Calculate actual distance for each result
    const withDistance = tickets
      .map((t) => {
        const dLat = (parseFloat(t.latitude) - latF) * (Math.PI / 180);
        const dLng = (parseFloat(t.longitude) - lngF) * (Math.PI / 180);
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos((latF * Math.PI) / 180) *
            Math.cos((parseFloat(t.latitude) * Math.PI) / 180) *
            Math.sin(dLng / 2) ** 2;
        const distKm = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return { ...t, distanceKm: parseFloat(distKm.toFixed(3)) };
      })
      .filter((t) => t.distanceKm <= radius)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    return sendSuccess(res, { nearbyTickets: withDistance });
  } catch (error) {
    console.error('Nearby tickets error:', error);
    return sendError(res, 'Failed to fetch nearby tickets.');
  }
});

// ---- GET /api/tickets/community-feed ----
// Citizen feed of public tickets with upvote metadata.
router.get('/community-feed', requireRole('CITIZEN'), async (req, res) => {
  try {
    const { page, limit, departmentId } = req.query;

    const where = {
      visibility: 'PUBLIC',
      status: { notIn: ['REJECTED'] },
      citizenId: { not: req.user.userId },
      ...(departmentId ? { assignedDepartmentId: parseInt(departmentId) } : {}),
    };

    const total = await prisma.ticket.count({ where });
    const pagination = getPagination(page, limit, total);

    const tickets = await prisma.ticket.findMany({
      where,
      skip: pagination.skip,
      take: pagination.limit,
      orderBy: [
        { priority: 'desc' },
        { upvoteCount: 'desc' },
        { createdAt: 'desc' },
      ],
      include: {
        citizen: { select: { id: true, name: true } },
        assignedDepartment: { select: { id: true, name: true } },
        recommendedDepartment: { select: { id: true, name: true } },
        _count: { select: { upvotes: true } },
        upvotes: {
          where: { citizenId: req.user.userId },
          select: { id: true },
        },
      },
    });

    const feed = tickets.map((ticket) => ({
      ...ticket,
      hasUpvoted: ticket.upvotes.length > 0,
      upvoteCount: ticket._count.upvotes,
      upvotes: undefined,
    }));

    return sendSuccess(res, { feed, pagination });
  } catch (error) {
    console.error('Community feed error:', error);
    return sendError(res, 'Failed to fetch community feed.');
  }
});

// ---- POST /api/tickets/:id/upvote ----
// Citizen confirms they are experiencing the same public issue.
router.post('/:id/upvote', requireRole('CITIZEN'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const citizenId = req.user.userId;

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      select: {
        id: true,
        citizenId: true,
        visibility: true,
        status: true,
        priority: true,
      },
    });

    if (!ticket) {
      return sendError(res, 'Ticket not found.', 404, 'NOT_FOUND');
    }
    if (ticket.visibility !== 'PUBLIC') {
      return sendError(res, 'Only public tickets can be upvoted.', 400, 'VALIDATION_ERROR');
    }
    if (ticket.citizenId === citizenId) {
      return sendError(res, 'You cannot upvote your own ticket.', 400, 'VALIDATION_ERROR');
    }
    if (['RESOLVED', 'REJECTED'].includes(ticket.status)) {
      return sendError(res, 'This ticket is no longer open for upvotes.', 400, 'INVALID_STATE_TRANSITION');
    }

    const existing = await prisma.ticketUpvote.findUnique({
      where: {
        ticketId_citizenId: {
          ticketId: id,
          citizenId,
        },
      },
    });

    if (existing) {
      const count = await prisma.ticketUpvote.count({ where: { ticketId: id } });
      return sendSuccess(res, {
        ticketId: id,
        upvoteCount: count,
        priority: ticket.priority,
        hasUpvoted: true,
      }, 200, 'Ticket already upvoted.');
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.ticketUpvote.create({
        data: {
          ticketId: id,
          citizenId,
        },
      });

      const upvoteCount = await tx.ticketUpvote.count({ where: { ticketId: id } });

      const shouldBumpPriority = upvoteCount >= PUBLIC_UPVOTE_PRIORITY_THRESHOLD;
      const updated = await tx.ticket.update({
        where: { id },
        data: {
          upvoteCount,
          ...(shouldBumpPriority && ['LOW', 'MEDIUM'].includes(ticket.priority)
            ? { priority: 'HIGH' }
            : {}),
        },
        select: {
          id: true,
          priority: true,
          upvoteCount: true,
        },
      });

      return updated;
    });

    return sendSuccess(res, {
      ticketId: result.id,
      upvoteCount: result.upvoteCount,
      priority: result.priority,
      hasUpvoted: true,
      threshold: PUBLIC_UPVOTE_PRIORITY_THRESHOLD,
    }, 201, 'Upvote registered successfully.');
  } catch (error) {
    console.error('Ticket upvote error:', error);
    return sendError(res, 'Failed to upvote ticket.');
  }
});

// ---- DELETE /api/tickets/:id/upvote ----
// Citizen retracts an upvote from a public ticket.
router.delete('/:id/upvote', requireRole('CITIZEN'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const citizenId = req.user.userId;

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      select: { id: true, priority: true, visibility: true },
    });

    if (!ticket) {
      return sendError(res, 'Ticket not found.', 404, 'NOT_FOUND');
    }
    if (ticket.visibility !== 'PUBLIC') {
      return sendError(res, 'Only public tickets support upvote actions.', 400, 'VALIDATION_ERROR');
    }

    const existing = await prisma.ticketUpvote.findUnique({
      where: {
        ticketId_citizenId: {
          ticketId: id,
          citizenId,
        },
      },
    });

    if (!existing) {
      const count = await prisma.ticketUpvote.count({ where: { ticketId: id } });
      return sendSuccess(res, {
        ticketId: id,
        upvoteCount: count,
        priority: ticket.priority,
        hasUpvoted: false,
      }, 200, 'Upvote was not present.');
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.ticketUpvote.delete({ where: { id: existing.id } });
      const upvoteCount = await tx.ticketUpvote.count({ where: { ticketId: id } });

      const updated = await tx.ticket.update({
        where: { id },
        data: {
          upvoteCount,
          ...(upvoteCount < PUBLIC_UPVOTE_PRIORITY_THRESHOLD && ticket.priority === 'HIGH'
            ? { priority: 'MEDIUM' }
            : {}),
        },
        select: {
          id: true,
          priority: true,
          upvoteCount: true,
        },
      });

      return updated;
    });

    return sendSuccess(res, {
      ticketId: result.id,
      upvoteCount: result.upvoteCount,
      priority: result.priority,
      hasUpvoted: false,
      threshold: PUBLIC_UPVOTE_PRIORITY_THRESHOLD,
    }, 200, 'Upvote removed successfully.');
  } catch (error) {
    console.error('Remove upvote error:', error);
    return sendError(res, 'Failed to remove upvote.');
  }
});

// ---- GET /api/tickets ----
// List tickets with role-based filtering:
// - CITIZEN: own tickets only
// - ADMIN: all tickets (with optional status filter)
// - DEPT_WORKER: tickets assigned to self or own department
// - OFFICER: all tickets (read-only)
router.get('/', async (req, res) => {
  try {
    const { status, page, limit, departmentId, priority } = req.query;
    const where = {};

    // Apply role-based filtering
    switch (req.user.role) {
      case 'CITIZEN':
        where.citizenId = req.user.userId;
        break;
      case 'DEPT_WORKER':
        // Get worker's department
        const worker = await prisma.user.findUnique({
          where: { id: req.user.userId },
          select: { departmentId: true },
        });
        where.OR = [
          { assignedWorkerId: req.user.userId },
          { assignedDepartmentId: worker?.departmentId },
        ];
        break;
      case 'ADMIN':
      case 'OFFICER':
        // Can see all tickets
        break;
      default:
        return sendError(res, 'Invalid role.', 403, 'FORBIDDEN');
    }

    // Apply optional filters
    if (status) where.status = status;
    if (departmentId) where.assignedDepartmentId = parseInt(departmentId);
    if (priority) where.priority = priority;

    const total = await prisma.ticket.count({ where });
    const pagination = getPagination(page, limit, total);

    const include = {
      citizen: { select: { id: true, name: true, email: true } },
      recommendedDepartment: { select: { id: true, name: true } },
      assignedDepartment: { select: { id: true, name: true } },
      assignedWorker: { select: { id: true, name: true } },
      interventions: {
        where: { isActive: true },
        select: { id: true, note: true, priority: true, createdAt: true, officer: { select: { id: true, name: true } } },
      },
      _count: {
        select: { upvotes: true },
      },
    };

    if (req.user.role === 'CITIZEN') {
      include.upvotes = {
        where: { citizenId: req.user.userId },
        select: { id: true },
      };
    }

    const tickets = await prisma.ticket.findMany({
      where,
      skip: pagination.skip,
      take: pagination.limit,
      orderBy:
        req.user.role === 'ADMIN' || req.user.role === 'OFFICER'
          ? [{ priority: 'desc' }, { createdAt: 'desc' }]
          : [{ createdAt: 'desc' }],
      include,
    });

    const enriched = tickets.map((ticket) => ({
      ...ticket,
      upvoteCount: ticket._count.upvotes,
      hasUpvoted: Array.isArray(ticket.upvotes) ? ticket.upvotes.length > 0 : false,
      upvotes: undefined,
    }));

    return sendSuccess(res, { tickets: enriched, pagination });
  } catch (error) {
    console.error('List tickets error:', error);
    return sendError(res, 'Failed to fetch tickets.');
  }
});

// ---- GET /api/tickets/:id ----
// Get detailed ticket info (authorized based on role)
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        citizen: { select: { id: true, name: true, email: true } },
        recommendedDepartment: { select: { id: true, name: true } },
        assignedDepartment: { select: { id: true, name: true } },
        assignedWorker: { select: { id: true, name: true } },
        notifications: {
          select: { id: true, subject: true, status: true, isRead: true, sentAt: true, deepLink: true },
          orderBy: { sentAt: 'desc' },
        },
        interventions: {
          where: { isActive: true },
          include: { officer: { select: { id: true, name: true } } },
        },
        _count: {
          select: { upvotes: true },
        },
        upvotes: {
          where: { citizenId: req.user.userId },
          select: { id: true },
        },
      },
    });

    if (!ticket) {
      return sendError(res, 'Ticket not found.', 404, 'NOT_FOUND');
    }

    // Authorization check
    if (req.user.role === 'CITIZEN' && ticket.citizenId !== req.user.userId && ticket.visibility !== 'PUBLIC') {
      return sendError(res, 'Access denied.', 403, 'FORBIDDEN');
    }

    if (req.user.role === 'DEPT_WORKER') {
      const worker = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: { departmentId: true },
      });
      if (ticket.assignedWorkerId !== req.user.userId && ticket.assignedDepartmentId !== worker?.departmentId) {
        return sendError(res, 'Access denied.', 403, 'FORBIDDEN');
      }
    }

    const payload = {
      ...ticket,
      upvoteCount: ticket._count.upvotes,
      hasUpvoted: ticket.upvotes.length > 0,
      upvotes: undefined,
    };

    return sendSuccess(res, { ticket: payload });
  } catch (error) {
    console.error('Get ticket error:', error);
    return sendError(res, 'Failed to fetch ticket.');
  }
});

// ---- PUT /api/tickets/:id/assign ----
// Admin assigns a ticket to a specific worker in a department.
// Accepts or overrides the AI recommendation.
router.put('/:id/assign', requireRole('ADMIN'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { departmentId, workerId } = req.body;

    if (!departmentId || !workerId) {
      return sendError(res, 'Department ID and Worker ID are required.', 400, 'VALIDATION_ERROR');
    }

    const ticket = await prisma.ticket.findUnique({ where: { id } });
    if (!ticket) {
      return sendError(res, 'Ticket not found.', 404, 'NOT_FOUND');
    }

    // Enforce valid state transition: only PENDING_ADMIN can be assigned
    if (ticket.status !== 'PENDING_ADMIN') {
      return sendError(
        res,
        `Invalid state transition. Ticket is in "${ticket.status}" status; only "PENDING_ADMIN" tickets can be assigned.`,
        400,
        'INVALID_STATE_TRANSITION'
      );
    }

    // Verify worker exists and belongs to the specified department
    const worker = await prisma.user.findUnique({ where: { id: parseInt(workerId) } });
    if (!worker || worker.role !== 'DEPT_WORKER') {
      return sendError(res, 'Specified worker not found or is not a DEPT_WORKER.', 404, 'WORKER_NOT_FOUND');
    }
    if (worker.departmentId !== parseInt(departmentId)) {
      return sendError(res, 'Worker does not belong to the specified department.', 400, 'WORKER_DEPT_MISMATCH');
    }

    // Determine if admin accepted AI recommendation
    const aiAccepted = ticket.recommendedDepartmentId === parseInt(departmentId);
    const assignedAt = new Date();
    const slaData = await buildAssignmentSlaData(parseInt(departmentId), assignedAt);

    const updatedTicket = await prisma.ticket.update({
      where: { id },
      data: {
        status: 'ASSIGNED',
        assignedDepartmentId: parseInt(departmentId),
        assignedWorkerId: parseInt(workerId),
        aiRecommendationAccepted: aiAccepted,
        ...slaData,
        reopenReason: null,
      },
      include: {
        citizen: { select: { id: true, name: true, email: true } },
        assignedDepartment: { select: { id: true, name: true } },
        assignedWorker: { select: { id: true, name: true } },
      },
    });

    // Send notification to citizen
    await notifyTicketAssigned(updatedTicket, updatedTicket.citizen.email, updatedTicket.citizen.id);

    return sendSuccess(res, { ticket: updatedTicket }, 200, 'Ticket assigned successfully');
  } catch (error) {
    console.error('Assign ticket error:', error);
    return sendError(res, 'Failed to assign ticket.');
  }
});

// ---- PUT /api/tickets/:id/resolve ----
// Worker resolves a ticket with proof (After photo + notes).
router.put(
  '/:id/resolve',
  requireRole('DEPT_WORKER'),
  upload.single('resolutionImage'),
  handleUploadError,
  async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { resolutionNotes } = req.body;

      const ticket = await prisma.ticket.findUnique({ where: { id } });
      if (!ticket) {
        return sendError(res, 'Ticket not found.', 404, 'NOT_FOUND');
      }

      // Enforce: only ASSIGNED tickets can be resolved
      if (ticket.status !== 'ASSIGNED') {
        return sendError(
          res,
          `Invalid state transition. Only "ASSIGNED" tickets can be resolved. Current status: "${ticket.status}".`,
          400,
          'INVALID_STATE_TRANSITION'
        );
      }

      // Enforce: only the assigned worker can resolve
      if (ticket.assignedWorkerId !== req.user.userId) {
        return sendError(res, 'Only the assigned worker can resolve this ticket.', 403, 'FORBIDDEN');
      }

      // Resolution image is required
      if (!req.file) {
        return sendError(res, 'A resolution image (\"After\" photo) is required.', 400, 'VALIDATION_ERROR');
      }

      const resolutionImageUrl = req.file.path;

      const [updatedTicket] = await prisma.$transaction([
        prisma.ticket.update({
          where: { id },
          data: {
            status: 'RESOLVED',
            resolutionImageUrl,
            resolutionNotes: resolutionNotes || null,
            resolvedAt: new Date(),
            slaPausedAt: null,
          },
          include: {
            citizen: { select: { id: true, name: true, email: true } },
          },
        }),
        prisma.user.update({
          where: { id: ticket.citizenId },
          data: {
            civicTrustScore: { increment: 10 },
          },
        }),
      ]);

      // Notify citizen
      await notifyTicketResolved(updatedTicket, updatedTicket.citizen.email, updatedTicket.citizen.id);

      return sendSuccess(res, { ticket: updatedTicket, trustDelta: 10 }, 200, 'Ticket resolved successfully');
    } catch (error) {
      console.error('Resolve ticket error:', error);
      return sendError(res, 'Failed to resolve ticket.');
    }
  }
);

// ---- PUT /api/tickets/:id/flag-false ----
// Worker flags a ticket as a false/invalid report.
router.put('/:id/flag-false', requireRole('DEPT_WORKER'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { escalationReason } = req.body;

    if (!escalationReason || escalationReason.trim() === '') {
      return sendError(res, 'Escalation reason is required when flagging a false report.', 400, 'VALIDATION_ERROR');
    }

    const ticket = await prisma.ticket.findUnique({ where: { id } });
    if (!ticket) {
      return sendError(res, 'Ticket not found.', 404, 'NOT_FOUND');
    }

    // Enforce: only ASSIGNED tickets can be flagged
    if (ticket.status !== 'ASSIGNED') {
      return sendError(
        res,
        `Invalid state transition. Only "ASSIGNED" tickets can be flagged. Current status: "${ticket.status}".`,
        400,
        'INVALID_STATE_TRANSITION'
      );
    }

    // Enforce: only the assigned worker can flag
    if (ticket.assignedWorkerId !== req.user.userId) {
      return sendError(res, 'Only the assigned worker can flag this ticket.', 403, 'FORBIDDEN');
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id },
      data: {
        status: 'ESCALATED_TO_ADMIN',
        escalationReason: escalationReason.trim(),
      },
    });

    // Notify admins about escalation
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN', isActive: true },
      select: { id: true, email: true },
    });

    for (const admin of admins) {
      await notifyTicketEscalated(updatedTicket, admin.email, admin.id);
    }

    return sendSuccess(res, { ticket: updatedTicket }, 200, 'Ticket flagged as false report. Escalated to admin.');
  } catch (error) {
    console.error('Flag ticket error:', error);
    return sendError(res, 'Failed to flag ticket.');
  }
});

// ---- PUT /api/tickets/:id/resolve-escalation ----
// Admin resolves an escalated ticket — either REJECT or RE-ASSIGN.
router.put('/:id/resolve-escalation', requireRole('ADMIN'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { action, adminResolutionNotes, departmentId, workerId } = req.body;

    if (!action || !['reject', 'reassign'].includes(action)) {
      return sendError(res, 'Action must be either "reject" or "reassign".', 400, 'VALIDATION_ERROR');
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: { citizen: { select: { id: true, email: true } } },
    });

    if (!ticket) {
      return sendError(res, 'Ticket not found.', 404, 'NOT_FOUND');
    }

    // Enforce: only ESCALATED_TO_ADMIN tickets can be resolved
    if (ticket.status !== 'ESCALATED_TO_ADMIN') {
      return sendError(
        res,
        `Invalid state transition. Only "ESCALATED_TO_ADMIN" tickets can be handled. Current status: "${ticket.status}".`,
        400,
        'INVALID_STATE_TRANSITION'
      );
    }

    if (action === 'reject') {
      // Mark as REJECTED
      const [updatedTicket] = await prisma.$transaction([
        prisma.ticket.update({
          where: { id },
          data: {
            status: 'REJECTED',
            adminResolutionNotes: adminResolutionNotes || null,
            resolvedAt: new Date(),
            isFalseReportConfirmed: true,
            slaPausedAt: null,
          },
        }),
        prisma.user.update({
          where: { id: ticket.citizen.id },
          data: {
            civicTrustScore: { decrement: 15 },
          },
        }),
      ]);

      // Notify citizen
      await notifyTicketRejected(updatedTicket, ticket.citizen.email, ticket.citizen.id);

      return sendSuccess(res, { ticket: updatedTicket, trustDelta: -15 }, 200, 'Ticket rejected and closed.');
    }

    if (action === 'reassign') {
      if (!departmentId || !workerId) {
        return sendError(res, 'Department ID and Worker ID are required for re-assignment.', 400, 'VALIDATION_ERROR');
      }

      // Verify worker
      const worker = await prisma.user.findUnique({ where: { id: parseInt(workerId) } });
      if (!worker || worker.role !== 'DEPT_WORKER') {
        return sendError(res, 'Specified worker not found or is not a DEPT_WORKER.', 404, 'WORKER_NOT_FOUND');
      }
      if (worker.departmentId !== parseInt(departmentId)) {
        return sendError(res, 'Worker does not belong to the specified department.', 400, 'WORKER_DEPT_MISMATCH');
      }

      const assignedAt = new Date();
      const slaData = await buildAssignmentSlaData(parseInt(departmentId), assignedAt);

      const updatedTicket = await prisma.ticket.update({
        where: { id },
        data: {
          status: 'ASSIGNED',
          assignedDepartmentId: parseInt(departmentId),
          assignedWorkerId: parseInt(workerId),
          adminResolutionNotes: adminResolutionNotes || null,
          ...slaData,
          escalationReason: null, // Clear escalation since it's re-assigned
          isFalseReportConfirmed: false,
          reopenReason: null,
        },
      });

      // Notify the new worker
      await notifyTicketReassigned(updatedTicket, worker.email, worker.id);

      return sendSuccess(res, { ticket: updatedTicket }, 200, 'Ticket re-assigned successfully.');
    }
  } catch (error) {
    console.error('Resolve escalation error:', error);
    return sendError(res, 'Failed to resolve escalation.');
  }
});

// ---- PUT /api/tickets/:id/reopen ----
// Citizen reopens a resolved ticket for admin review.
router.put('/:id/reopen', requireRole('CITIZEN'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { reopenReason } = req.body;

    if (!reopenReason || reopenReason.trim() === '') {
      return sendError(res, 'A reopen reason is required.', 400, 'VALIDATION_ERROR');
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        citizen: { select: { id: true, email: true } },
      },
    });

    if (!ticket) {
      return sendError(res, 'Ticket not found.', 404, 'NOT_FOUND');
    }
    if (ticket.citizenId !== req.user.userId) {
      return sendError(res, 'Access denied.', 403, 'FORBIDDEN');
    }
    if (ticket.status !== 'RESOLVED') {
      return sendError(res, 'Only resolved tickets can be reopened.', 400, 'INVALID_STATE_TRANSITION');
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id },
      data: {
        status: 'ESCALATED_TO_ADMIN',
        escalationReason: reopenReason.trim(),
        reopenReason: reopenReason.trim(),
        assignedWorkerId: null,
        resolvedAt: null,
        adminResolutionNotes: null,
        dueAt: null,
        slaPausedAt: null,
      },
    });

    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN', isActive: true },
      select: { id: true, email: true },
    });

    for (const admin of admins) {
      await notifyTicketEscalated(updatedTicket, admin.email, admin.id);
    }

    return sendSuccess(res, { ticket: updatedTicket }, 200, 'Ticket reopened and escalated to admin review.');
  } catch (error) {
    console.error('Reopen ticket error:', error);
    return sendError(res, 'Failed to reopen ticket.');
  }
});

module.exports = router;
