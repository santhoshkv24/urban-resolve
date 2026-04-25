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

// ---- GET /api/analytics/overview ----
// Consolidated payload for officer command center widgets.
router.get('/overview', async (req, res) => {
  try {
    const [
      totalTickets,
      resolvedTickets,
      resolvedWithTiming,
      ticketsByDepartment,
      criticalOpenTickets,
    ] = await Promise.all([
      prisma.ticket.count(),
      prisma.ticket.count({ where: { status: 'RESOLVED' } }),
      prisma.ticket.findMany({
        where: {
          status: 'RESOLVED',
          assignedAt: { not: null },
          resolvedAt: { not: null },
        },
        select: {
          assignedAt: true,
          resolvedAt: true,
        },
      }),
      prisma.department.findMany({
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: { assignedTickets: true },
          },
        },
      }),
      prisma.ticket.count({
        where: {
          priority: 'CRITICAL',
          status: { notIn: ['RESOLVED', 'REJECTED'] },
        },
      }),
    ]);

    let avgResolutionTime = null;
    if (resolvedWithTiming.length > 0) {
      const totalMs = resolvedWithTiming.reduce((sum, ticket) => {
        return sum + (ticket.resolvedAt.getTime() - ticket.assignedAt.getTime());
      }, 0);
      avgResolutionTime = parseFloat((totalMs / resolvedWithTiming.length / (1000 * 60 * 60)).toFixed(1));
    }

    const resolutionRate = totalTickets > 0
      ? parseFloat(((resolvedTickets / totalTickets) * 100).toFixed(1))
      : 0;

    return sendSuccess(res, {
      totalTickets,
      resolvedTickets,
      resolutionRate,
      avgResolutionTime,
      criticalOpenTickets,
      ticketsByDepartment,
    });
  } catch (error) {
    console.error('Analytics — overview error:', error);
    return sendError(res, 'Failed to fetch analytics overview.');
  }
});

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

// ---- GET /api/analytics/anomalies ----
// Detects volume spikes, SLA clusters, and escalation surges.
router.get('/anomalies', async (req, res) => {
  try {
    const alerts = [];
    
    // 1. Volume Spikes (e.g. > 10 tickets today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTickets = await prisma.ticket.count({
      where: { createdAt: { gte: today } }
    });
    if (todayTickets > 10) {
      alerts.push({
        type: 'VOLUME_SPIKE',
        severity: 'warning',
        title: 'High Influx of Reports',
        description: 'Ticket volume today is significantly higher than the daily average.',
        metric: todayTickets,
        threshold: 10,
      });
    }

    // 2. Escalation Surges (e.g. > 3 unresolved escalations)
    const escalated = await prisma.ticket.count({
      where: { status: 'ESCALATED_TO_ADMIN' }
    });
    if (escalated >= 3) {
      alerts.push({
        type: 'ESCALATION_SURGE',
        severity: 'critical',
        title: 'Escalation Bottleneck',
        description: 'Multiple tickets have been escalated and require immediate admin resolution.',
        metric: escalated,
        threshold: 3,
      });
    }

    // 3. SLA Clusters (e.g. > 5 tickets breached in a specific department)
    const slaMs = 48 * 60 * 60 * 1000;
    const activeTickets = await prisma.ticket.findMany({
      where: { status: 'ASSIGNED', assignedAt: { not: null } },
      select: { assignedDepartmentId: true, assignedAt: true },
    });
    const breachedByDept = {};
    const now = Date.now();
    for (const t of activeTickets) {
      if (now - t.assignedAt.getTime() > slaMs) {
        breachedByDept[t.assignedDepartmentId] = (breachedByDept[t.assignedDepartmentId] || 0) + 1;
      }
    }
    
    for (const [deptId, count] of Object.entries(breachedByDept)) {
      if (count >= 5) {
        const dept = await prisma.department.findUnique({ where: { id: parseInt(deptId) } });
        alerts.push({
          type: 'SLA_CLUSTER',
          severity: 'critical',
          departmentName: dept?.name,
          title: 'SLA Breach Cluster',
          description: `High number of SLA breaches detected in ${dept?.name}. Resource reallocation recommended.`,
          metric: count,
          threshold: 5,
        });
      }
    }

    return sendSuccess(res, { alerts });
  } catch (error) {
    console.error('Analytics — anomalies error:', error);
    return sendError(res, 'Failed to fetch anomalies.');
  }
});

// ---- GET /api/analytics/officer-impact ----
// Calculates the officer's performance scorecard.
router.get('/officer-impact', async (req, res) => {
  try {
    const officerId = req.user.userId;

    const interventions = await prisma.officerIntervention.findMany({
      where: { officerId },
      include: {
        ticket: { select: { status: true, assignedAt: true, resolvedAt: true } }
      }
    });

    const activeInterventions = interventions.filter(i => i.isActive).length;
    const totalInterventions = interventions.length;
    
    let resolvedCount = 0;
    let totalResolveTimeMs = 0;

    for (const i of interventions) {
      if (i.ticket.status === 'RESOLVED') {
        resolvedCount++;
        if (i.ticket.assignedAt && i.ticket.resolvedAt) {
          totalResolveTimeMs += (i.ticket.resolvedAt.getTime() - i.ticket.assignedAt.getTime());
        }
      }
    }

    const directivesIssued = await prisma.directive.count({ where: { authorId: officerId } });

    const interventionResolutionRate = totalInterventions > 0
      ? Math.round((resolvedCount / totalInterventions) * 100) : 0;
      
    const avgResolutionAfterIntervention = resolvedCount > 0
      ? parseFloat((totalResolveTimeMs / resolvedCount / (1000 * 60 * 60)).toFixed(1)) : null;

    // Score formula: 40% res rate + 30% intervention vol (cap 20) + 30% directives (cap 10)
    let score = 0;
    score += (interventionResolutionRate * 0.4);
    score += (Math.min(totalInterventions, 20) / 20) * 30;
    score += (Math.min(directivesIssued, 10) / 10) * 30;

    const impactScore = Math.round(score);

    return sendSuccess(res, {
      officerImpact: {
        impactScore,
        totalInterventions,
        activeInterventions,
        directivesIssued,
        interventionResolutionRate,
        avgResolutionAfterIntervention,
      }
    });
  } catch (error) {
    console.error('Analytics — officer impact error:', error);
    return sendError(res, 'Failed to fetch officer impact.');
  }
});

module.exports = router;
