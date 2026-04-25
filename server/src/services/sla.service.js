const prisma = require('../config/db');

const DEFAULT_SLA_HOURS = 48;
const ACTIVE_SLA_STATUSES = ['ASSIGNED', 'ESCALATED_TO_ADMIN'];

const calculateDueAt = (assignedAt, slaHours) => {
  const assigned = new Date(assignedAt);
  return new Date(assigned.getTime() + slaHours * 60 * 60 * 1000);
};

const getDepartmentSlaHours = async (departmentId) => {
  if (!departmentId) return DEFAULT_SLA_HOURS;

  const department = await prisma.department.findUnique({
    where: { id: Number(departmentId) },
    select: { defaultSlaHours: true },
  });

  return department?.defaultSlaHours || DEFAULT_SLA_HOURS;
};

const buildAssignmentSlaData = async (departmentId, assignedAt = new Date()) => {
  const slaHours = await getDepartmentSlaHours(departmentId);
  return {
    assignedAt,
    slaPolicyHours: slaHours,
    dueAt: calculateDueAt(assignedAt, slaHours),
    slaPausedAt: null,
  };
};

const recalculateDepartmentOpenTicketSla = async (departmentId, slaHours) => {
  const tickets = await prisma.ticket.findMany({
    where: {
      assignedDepartmentId: Number(departmentId),
      status: { in: ACTIVE_SLA_STATUSES },
      assignedAt: { not: null },
    },
    select: {
      id: true,
      assignedAt: true,
      slaPausedAt: true,
    },
  });

  const nowMs = Date.now();
  const updates = tickets.map((ticket) => {
    let dueAtMs = new Date(ticket.assignedAt).getTime() + slaHours * 60 * 60 * 1000;

    if (ticket.slaPausedAt) {
      const pauseMs = Math.max(0, nowMs - new Date(ticket.slaPausedAt).getTime());
      dueAtMs += pauseMs;
    }

    return prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        slaPolicyHours: slaHours,
        dueAt: new Date(dueAtMs),
      },
    });
  });

  if (updates.length > 0) {
    await prisma.$transaction(updates);
  }

  return updates.length;
};

const pauseSlaForNonTargetDepartmentTickets = async (targetDepartmentId) => {
  const now = new Date();
  const result = await prisma.ticket.updateMany({
    where: {
      status: { in: ACTIVE_SLA_STATUSES },
      assignedDepartmentId: { not: Number(targetDepartmentId) },
      slaPausedAt: null,
    },
    data: {
      slaPausedAt: now,
    },
  });

  return result.count;
};

const resumePausedSlaTickets = async (where = {}) => {
  const pausedTickets = await prisma.ticket.findMany({
    where: {
      ...where,
      status: { in: ACTIVE_SLA_STATUSES },
      slaPausedAt: { not: null },
      dueAt: { not: null },
    },
    select: {
      id: true,
      dueAt: true,
      slaPausedAt: true,
    },
  });

  const nowMs = Date.now();

  const updates = pausedTickets.map((ticket) => {
    const pauseMs = Math.max(0, nowMs - new Date(ticket.slaPausedAt).getTime());

    return prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        dueAt: new Date(new Date(ticket.dueAt).getTime() + pauseMs),
        slaPausedAt: null,
      },
    });
  });

  if (updates.length > 0) {
    await prisma.$transaction(updates);
  }

  return updates.length;
};

module.exports = {
  DEFAULT_SLA_HOURS,
  ACTIVE_SLA_STATUSES,
  calculateDueAt,
  getDepartmentSlaHours,
  buildAssignmentSlaData,
  recalculateDepartmentOpenTicketSla,
  pauseSlaForNonTargetDepartmentTickets,
  resumePausedSlaTickets,
};
