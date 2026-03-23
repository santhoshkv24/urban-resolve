// ===========================================
// Analytics Routes — Officer Dashboard Data
// All endpoints return aggregated JSON data.
// Accessible by OFFICER and ADMIN roles.
// ===========================================

const express = require('express');
const router = express.Router();

const prisma = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { sendSuccess, sendError } = require('../utils/helpers');

// All analytics routes require authentication + OFFICER or ADMIN role
router.use(authenticate, requireRole('OFFICER', 'ADMIN'));

// ---- GET /api/analytics/tickets-by-department ----
// Count of tickets grouped by assigned department.
router.get('/tickets-by-department', async (req, res) => {
  try {
    const result = await prisma.ticket.groupBy({
      by: ['assignedDepartmentId'],
      _count: { id: true },
      where: { assignedDepartmentId: { not: null } },
    });

    // Enrich with department names
    const departments = await prisma.department.findMany({
      select: { id: true, name: true },
    });
    const deptMap = Object.fromEntries(departments.map((d) => [d.id, d.name]));

    const data = result.map((r) => ({
      departmentId: r.assignedDepartmentId,
      departmentName: deptMap[r.assignedDepartmentId] || 'Unknown',
      ticketCount: r._count.id,
    }));

    return sendSuccess(res, { ticketsByDepartment: data });
  } catch (error) {
    console.error('Analytics — tickets by department error:', error);
    return sendError(res, 'Failed to fetch analytics data.');
  }
});

// ---- GET /api/analytics/tickets-by-status ----
// Count of tickets grouped by current status.
router.get('/tickets-by-status', async (req, res) => {
  try {
    const result = await prisma.ticket.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    const data = result.map((r) => ({
      status: r.status,
      ticketCount: r._count.id,
    }));

    return sendSuccess(res, { ticketsByStatus: data });
  } catch (error) {
    console.error('Analytics — tickets by status error:', error);
    return sendError(res, 'Failed to fetch analytics data.');
  }
});

// ---- GET /api/analytics/average-resolution-time ----
// Average time from ASSIGNED to RESOLVED, grouped by department.
router.get('/average-resolution-time', async (req, res) => {
  try {
    // Get all resolved tickets with assignment and resolution timestamps
    const resolvedTickets = await prisma.ticket.findMany({
      where: {
        status: 'RESOLVED',
        assignedAt: { not: null },
        resolvedAt: { not: null },
        assignedDepartmentId: { not: null },
      },
      select: {
        assignedDepartmentId: true,
        assignedAt: true,
        resolvedAt: true,
      },
    });

    // Group by department and calculate averages
    const deptTimes = {};
    for (const ticket of resolvedTickets) {
      const deptId = ticket.assignedDepartmentId;
      const duration = ticket.resolvedAt.getTime() - ticket.assignedAt.getTime();
      if (!deptTimes[deptId]) deptTimes[deptId] = [];
      deptTimes[deptId].push(duration);
    }

    // Enrich with department names
    const departments = await prisma.department.findMany({
      select: { id: true, name: true },
    });
    const deptMap = Object.fromEntries(departments.map((d) => [d.id, d.name]));

    const data = Object.entries(deptTimes).map(([deptId, times]) => {
      const avgMs = times.reduce((a, b) => a + b, 0) / times.length;
      const avgHours = (avgMs / (1000 * 60 * 60)).toFixed(2);
      return {
        departmentId: parseInt(deptId),
        departmentName: deptMap[parseInt(deptId)] || 'Unknown',
        averageResolutionTimeHours: parseFloat(avgHours),
        ticketsResolved: times.length,
      };
    });

    return sendSuccess(res, { averageResolutionTime: data });
  } catch (error) {
    console.error('Analytics — avg resolution time error:', error);
    return sendError(res, 'Failed to fetch analytics data.');
  }
});

// ---- GET /api/analytics/ai-accuracy-rate ----
// Percentage of times Admin accepted the AI recommendation.
router.get('/ai-accuracy-rate', async (req, res) => {
  try {
    const totalAssigned = await prisma.ticket.count({
      where: { aiRecommendationAccepted: { not: null } },
    });

    const aiAccepted = await prisma.ticket.count({
      where: { aiRecommendationAccepted: true },
    });

    const accuracyRate = totalAssigned > 0
      ? parseFloat(((aiAccepted / totalAssigned) * 100).toFixed(2))
      : 0;

    return sendSuccess(res, {
      aiAccuracyRate: {
        totalAssigned,
        aiAccepted,
        aiOverridden: totalAssigned - aiAccepted,
        accuracyPercentage: accuracyRate,
      },
    });
  } catch (error) {
    console.error('Analytics — AI accuracy rate error:', error);
    return sendError(res, 'Failed to fetch analytics data.');
  }
});

// ---- GET /api/analytics/sla-compliance ----
// Percentage of tickets resolved within SLA thresholds.
// Default SLA: 48 hours from assignment to resolution.
router.get('/sla-compliance', async (req, res) => {
  try {
    const slaHours = parseInt(req.query.slaHours) || 48; // Default 48h SLA
    const slaMs = slaHours * 60 * 60 * 1000;

    const resolvedTickets = await prisma.ticket.findMany({
      where: {
        status: 'RESOLVED',
        assignedAt: { not: null },
        resolvedAt: { not: null },
      },
      select: {
        assignedAt: true,
        resolvedAt: true,
      },
    });

    const total = resolvedTickets.length;
    const withinSla = resolvedTickets.filter((t) => {
      const duration = t.resolvedAt.getTime() - t.assignedAt.getTime();
      return duration <= slaMs;
    }).length;

    const complianceRate = total > 0
      ? parseFloat(((withinSla / total) * 100).toFixed(2))
      : 0;

    return sendSuccess(res, {
      slaCompliance: {
        slaThresholdHours: slaHours,
        totalResolved: total,
        withinSla,
        breachedSla: total - withinSla,
        compliancePercentage: complianceRate,
      },
    });
  } catch (error) {
    console.error('Analytics — SLA compliance error:', error);
    return sendError(res, 'Failed to fetch analytics data.');
  }
});

// ---- GET /api/analytics/monthly-trend ----
// Ticket count trend over the past 12 months.
router.get('/monthly-trend', async (req, res) => {
  try {
    const now = new Date();
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    const tickets = await prisma.ticket.findMany({
      where: {
        createdAt: { gte: twelveMonthsAgo },
      },
      select: {
        createdAt: true,
      },
    });

    // Group by month
    const monthCounts = {};
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthCounts[key] = 0;
    }

    for (const ticket of tickets) {
      const date = new Date(ticket.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (monthCounts[key] !== undefined) {
        monthCounts[key]++;
      }
    }

    const data = Object.entries(monthCounts).map(([month, count]) => ({
      month,
      ticketCount: count,
    }));

    return sendSuccess(res, { monthlyTrend: data });
  } catch (error) {
    console.error('Analytics — monthly trend error:', error);
    return sendError(res, 'Failed to fetch analytics data.');
  }
});

module.exports = router;
