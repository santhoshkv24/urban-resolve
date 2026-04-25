const express = require('express');
const router = express.Router();
const prisma = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const {
  pauseSlaForNonTargetDepartmentTickets,
  recalculateDepartmentOpenTicketSla,
  resumePausedSlaTickets,
} = require('../services/sla.service');
const { logSystemNotification } = require('../services/email.service');
const { sendSuccess, sendError } = require('../utils/helpers');

router.use(authenticate);

const OPEN_TICKET_STATUSES = ['PENDING_ADMIN', 'ASSIGNED', 'ESCALATED_TO_ADMIN'];

// ---- GET /api/officer/interventions ----
// List active interventions
router.get('/interventions', requireRole('OFFICER', 'ADMIN'), async (req, res) => {
  try {
    const interventions = await prisma.officerIntervention.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      include: {
        officer: { select: { id: true, name: true } },
        ticket: { 
          select: { 
            id: true, description: true, status: true, imageUrl: true, createdAt: true,
            assignedAt: true, resolvedAt: true,
            assignedDepartment: { select: { name: true } }
          } 
        },
      },
    });

    return sendSuccess(res, { interventions });
  } catch (error) {
    console.error('Fetch interventions error:', error);
    return sendError(res, 'Failed to fetch interventions.');
  }
});

// ---- POST /api/officer/interventions ----
// Flag a ticket
router.post('/interventions', requireRole('OFFICER', 'ADMIN'), async (req, res) => {
  try {
    const { ticketId, note, priority } = req.body;

    if (!ticketId || !note) {
      return sendError(res, 'Ticket ID and note are required.', 400);
    }

    const ticket = await prisma.ticket.findUnique({ where: { id: parseInt(ticketId) } });
    if (!ticket || ['RESOLVED', 'REJECTED'].includes(ticket.status)) {
      return sendError(res, 'Invalid ticket for intervention.', 400);
    }

    const intervention = await prisma.officerIntervention.create({
      data: {
        ticketId: parseInt(ticketId),
        officerId: req.user.userId,
        note,
        priority: priority || 'high',
      },
    });

    return sendSuccess(res, { intervention }, 201, 'Ticket flagged successfully.');
  } catch (error) {
    console.error('Create intervention error:', error);
    return sendError(res, 'Failed to create intervention.');
  }
});

// ---- DELETE /api/officer/interventions/:id ----
// Remove intervention flag
router.delete('/interventions/:id', requireRole('OFFICER', 'ADMIN'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.officerIntervention.update({
      where: { id },
      data: { isActive: false },
    });
    return sendSuccess(res, null, 200, 'Intervention removed.');
  } catch (error) {
    console.error('Remove intervention error:', error);
    return sendError(res, 'Failed to remove intervention.');
  }
});

// ---- GET /api/officer/emergency-state ----
// Public emergency status for admin/worker dashboards.
router.get('/emergency-state', requireRole('OFFICER', 'ADMIN', 'DEPT_WORKER'), async (req, res) => {
  try {
    const emergencyState = await prisma.emergencyState.findFirst({
      where: { isActive: true },
      orderBy: { activatedAt: 'desc' },
      include: {
        targetDepartment: { select: { id: true, name: true } },
        activatedBy: { select: { id: true, name: true } },
      },
    });

    return sendSuccess(res, { emergencyState });
  } catch (error) {
    console.error('Fetch emergency state error:', error);
    return sendError(res, 'Failed to fetch emergency state.');
  }
});

// ---- POST /api/officer/emergency-state/activate ----
// Activate emergency mode for a target department.
router.post('/emergency-state/activate', requireRole('OFFICER'), async (req, res) => {
  try {
    const { targetDepartmentId, reason, message } = req.body;

    if (!targetDepartmentId || !reason || !message) {
      return sendError(res, 'Target department, reason, and message are required.', 400, 'VALIDATION_ERROR');
    }

    const department = await prisma.department.findUnique({ where: { id: parseInt(targetDepartmentId) } });
    if (!department) {
      return sendError(res, 'Target department not found.', 404, 'NOT_FOUND');
    }

    const now = new Date();

    await prisma.emergencyState.updateMany({
      where: { isActive: true },
      data: {
        isActive: false,
        deactivatedAt: now,
      },
    });

    const emergencyState = await prisma.emergencyState.create({
      data: {
        targetDepartmentId: parseInt(targetDepartmentId),
        activatedById: req.user.userId,
        reason: reason.trim(),
        message: message.trim(),
      },
      include: {
        targetDepartment: { select: { id: true, name: true } },
        activatedBy: { select: { id: true, name: true } },
      },
    });

    const pausedCount = await pauseSlaForNonTargetDepartmentTickets(parseInt(targetDepartmentId));
    await resumePausedSlaTickets({ assignedDepartmentId: parseInt(targetDepartmentId) });

    const escalated = await prisma.ticket.updateMany({
      where: {
        assignedDepartmentId: parseInt(targetDepartmentId),
        status: { in: OPEN_TICKET_STATUSES },
      },
      data: {
        priority: 'CRITICAL',
        slaPausedAt: null,
      },
    });

    return sendSuccess(
      res,
      {
        emergencyState,
        impact: {
          pausedSlaTickets: pausedCount,
          criticalEscalations: escalated.count,
        },
      },
      200,
      'Emergency state activated successfully.'
    );
  } catch (error) {
    console.error('Activate emergency error:', error);
    return sendError(res, 'Failed to activate emergency state.');
  }
});

// ---- POST /api/officer/emergency-state/deactivate ----
// Deactivate active emergency mode and resume frozen SLA timers.
router.post('/emergency-state/deactivate', requireRole('OFFICER'), async (req, res) => {
  try {
    const activeEmergency = await prisma.emergencyState.findFirst({
      where: { isActive: true },
      orderBy: { activatedAt: 'desc' },
    });

    if (!activeEmergency) {
      return sendError(res, 'No active emergency state found.', 404, 'NOT_FOUND');
    }

    await prisma.emergencyState.update({
      where: { id: activeEmergency.id },
      data: {
        isActive: false,
        deactivatedAt: new Date(),
      },
    });

    const resumedCount = await resumePausedSlaTickets({});

    return sendSuccess(
      res,
      {
        emergencyStateId: activeEmergency.id,
        resumedSlaTickets: resumedCount,
      },
      200,
      'Emergency state deactivated successfully.'
    );
  } catch (error) {
    console.error('Deactivate emergency error:', error);
    return sendError(res, 'Failed to deactivate emergency state.');
  }
});

// ---- GET /api/officer/policies ----
// Department-wise SLA policy configuration panel.
router.get('/policies', requireRole('OFFICER', 'ADMIN'), async (req, res) => {
  try {
    const [departments, groupedOpenTickets] = await Promise.all([
      prisma.department.findMany({
        orderBy: { name: 'asc' },
        include: {
          workers: {
            where: { role: 'DEPT_WORKER', isActive: true },
            select: { id: true },
          },
        },
      }),
      prisma.ticket.groupBy({
        by: ['assignedDepartmentId'],
        where: {
          assignedDepartmentId: { not: null },
          status: { in: OPEN_TICKET_STATUSES },
        },
        _count: { id: true },
      }),
    ]);

    const openTicketMap = Object.fromEntries(
      groupedOpenTickets.map((row) => [row.assignedDepartmentId, row._count.id])
    );

    const policies = departments.map((department) => {
      const openTicketCount = openTicketMap[department.id] || 0;
      const workerCount = department.workers.length;

      return {
        id: department.id,
        name: department.name,
        defaultSlaHours: department.defaultSlaHours,
        openTicketCount,
        workerCount,
        ticketsPerWorker:
          workerCount > 0 ? parseFloat((openTicketCount / workerCount).toFixed(2)) : null,
      };
    });

    return sendSuccess(res, { policies });
  } catch (error) {
    console.error('List policies error:', error);
    return sendError(res, 'Failed to fetch SLA policies.');
  }
});

// ---- PUT /api/officer/policies/:departmentId ----
// Update default department SLA and recalculate open ticket deadlines.
router.put('/policies/:departmentId', requireRole('OFFICER'), async (req, res) => {
  try {
    const departmentId = parseInt(req.params.departmentId);
    const { defaultSlaHours } = req.body;

    if (!Number.isInteger(defaultSlaHours) || defaultSlaHours < 1 || defaultSlaHours > 168) {
      return sendError(res, 'defaultSlaHours must be an integer between 1 and 168.', 400, 'VALIDATION_ERROR');
    }

    const department = await prisma.department.update({
      where: { id: departmentId },
      data: { defaultSlaHours },
      select: { id: true, name: true, defaultSlaHours: true },
    });

    const recalculatedTickets = await recalculateDepartmentOpenTicketSla(departmentId, defaultSlaHours);

    return sendSuccess(
      res,
      {
        department,
        recalculatedTickets,
      },
      200,
      'SLA policy updated and open ticket deadlines recalculated.'
    );
  } catch (error) {
    console.error('Update policy error:', error);
    return sendError(res, 'Failed to update SLA policy.');
  }
});

// ---- GET /api/officer/workforce-overview ----
// Compare department workload against active workers.
router.get('/workforce-overview', requireRole('OFFICER', 'ADMIN'), async (req, res) => {
  try {
    const [departments, groupedOpenTickets] = await Promise.all([
      prisma.department.findMany({
        orderBy: { name: 'asc' },
        include: {
          workers: {
            where: { role: 'DEPT_WORKER', isActive: true },
            select: { id: true, name: true, email: true, isActive: true },
            orderBy: { name: 'asc' },
          },
        },
      }),
      prisma.ticket.groupBy({
        by: ['assignedDepartmentId'],
        where: {
          assignedDepartmentId: { not: null },
          status: { in: OPEN_TICKET_STATUSES },
        },
        _count: { id: true },
      }),
    ]);

    const openTicketMap = Object.fromEntries(
      groupedOpenTickets.map((row) => [row.assignedDepartmentId, row._count.id])
    );

    const departmentsOverview = departments.map((department) => {
      const openTicketCount = openTicketMap[department.id] || 0;
      const workerCount = department.workers.length;

      return {
        id: department.id,
        name: department.name,
        defaultSlaHours: department.defaultSlaHours,
        openTicketCount,
        workerCount,
        ticketsPerWorker:
          workerCount > 0 ? parseFloat((openTicketCount / workerCount).toFixed(2)) : null,
        workers: department.workers,
      };
    });

    return sendSuccess(res, { departments: departmentsOverview });
  } catch (error) {
    console.error('Workforce overview error:', error);
    return sendError(res, 'Failed to fetch workforce overview.');
  }
});

// ---- POST /api/officer/reassign-workers ----
// Temporarily move workers from one department to another.
router.post('/reassign-workers', requireRole('OFFICER'), async (req, res) => {
  try {
    const { fromDepartmentId, toDepartmentId, workerIds, reason } = req.body;

    if (!fromDepartmentId || !toDepartmentId || !Array.isArray(workerIds) || workerIds.length === 0) {
      return sendError(res, 'fromDepartmentId, toDepartmentId, and workerIds are required.', 400, 'VALIDATION_ERROR');
    }
    if (parseInt(fromDepartmentId) === parseInt(toDepartmentId)) {
      return sendError(res, 'Source and target departments must be different.', 400, 'VALIDATION_ERROR');
    }

    const [fromDepartment, toDepartment] = await Promise.all([
      prisma.department.findUnique({ where: { id: parseInt(fromDepartmentId) }, select: { id: true, name: true } }),
      prisma.department.findUnique({ where: { id: parseInt(toDepartmentId) }, select: { id: true, name: true } }),
    ]);

    if (!fromDepartment || !toDepartment) {
      return sendError(res, 'One or both departments were not found.', 404, 'NOT_FOUND');
    }

    const workers = await prisma.user.findMany({
      where: {
        id: { in: workerIds.map((id) => parseInt(id)) },
        role: 'DEPT_WORKER',
        isActive: true,
        departmentId: parseInt(fromDepartmentId),
      },
      select: { id: true, name: true, email: true },
    });

    if (workers.length !== workerIds.length) {
      return sendError(res, 'Some selected workers are invalid or not part of the source department.', 400, 'VALIDATION_ERROR');
    }

    await prisma.user.updateMany({
      where: {
        id: { in: workers.map((worker) => worker.id) },
      },
      data: {
        departmentId: parseInt(toDepartmentId),
      },
    });

    let admins = await prisma.user.findMany({
      where: {
        role: 'ADMIN',
        isActive: true,
        OR: [{ departmentId: parseInt(toDepartmentId) }, { departmentId: null }],
      },
      select: { id: true },
    });

    if (admins.length === 0) {
      admins = await prisma.user.findMany({
        where: { role: 'ADMIN', isActive: true },
        select: { id: true },
      });
    }

    const workerNames = workers.map((worker) => worker.name).join(', ');
    const moveReason = reason?.trim() || 'Operational rebalancing';

    await Promise.all([
      ...admins.map((admin) =>
        logSystemNotification({
          recipientUserId: admin.id,
          subject: 'Temporary Workforce Reallocation',
          body: `${workers.length} worker(s) moved from ${fromDepartment.name} to ${toDepartment.name}. Reason: ${moveReason}.`,
          deepLink: `/admin/users?departmentId=${toDepartment.id}`,
        })
      ),
      ...workers.map((worker) =>
        logSystemNotification({
          recipientUserId: worker.id,
          subject: 'Department Assignment Updated',
          body: `You have been temporarily reassigned from ${fromDepartment.name} to ${toDepartment.name}.`,
          deepLink: '/worker',
        })
      ),
    ]);

    return sendSuccess(
      res,
      {
        fromDepartment,
        toDepartment,
        movedWorkerIds: workers.map((worker) => worker.id),
        movedWorkerNames: workerNames,
      },
      200,
      'Workers reassigned successfully.'
    );
  } catch (error) {
    console.error('Reassign workers error:', error);
    return sendError(res, 'Failed to reassign workers.');
  }
});

module.exports = router;
