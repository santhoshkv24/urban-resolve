import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle2, AlertTriangle, Flame } from 'lucide-react';

const DEFAULT_SLA_HOURS = 48;

/**
 * SlaChip — Displays real-time SLA status and ETA for a ticket.
 * 
 * States:
 *  - RESOLVED: Shows resolution time
 *  - ASSIGNED (on track): Shows time remaining
 *  - ASSIGNED (at risk, < 12h left): Warning pulse
 *  - ASSIGNED (breached): Red alert
 *  - Other: Awaiting assignment
 */
const SlaChip = ({ ticket, className = '' }) => {
  const [now, setNow] = useState(new Date());

  // Update every minute so countdown is live
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const formatDuration = (ms) => {
    const totalMins = Math.abs(Math.floor(ms / 60_000));
    const hrs = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
  };

  // RESOLVED: show how long it took
  if (ticket.status === 'RESOLVED' && ticket.assignedAt && ticket.resolvedAt) {
    const slaHours = ticket.slaPolicyHours || DEFAULT_SLA_HOURS;
    const durationMs = new Date(ticket.resolvedAt) - new Date(ticket.assignedAt);
    const durationHrs = durationMs / (1000 * 60 * 60);
    const withinSla = durationHrs <= slaHours;

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
          withinSla
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-rose-50 text-rose-700 border-rose-200'
        } ${className}`}
      >
        <CheckCircle2 className="w-3 h-3" />
        {withinSla ? `Done in ${formatDuration(durationMs)}` : `Resolved (late)`}
      </span>
    );
  }

  // Active tickets: calculate SLA countdown from backend due date/policy.
  if (['ASSIGNED', 'ESCALATED_TO_ADMIN'].includes(ticket.status) && ticket.assignedAt) {
    if (ticket.slaPausedAt) {
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border bg-violet-50 text-violet-700 border-violet-200 ${className}`}
        >
          <Clock className="w-3 h-3" />
          SLA Frozen (Emergency)
        </span>
      );
    }

    const slaHours = ticket.slaPolicyHours || DEFAULT_SLA_HOURS;
    const deadline = ticket.dueAt
      ? new Date(ticket.dueAt)
      : new Date(new Date(ticket.assignedAt).getTime() + slaHours * 60 * 60 * 1000);
    const remainingMs = deadline - now;

    // Breached
    if (remainingMs <= 0) {
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border bg-rose-50 text-rose-700 border-rose-200 ${className}`}
        >
          <Flame className="w-3 h-3 animate-pulse" />
          SLA Breached {formatDuration(remainingMs)} ago
        </span>
      );
    }

    // At risk threshold = min(12h, 25% of policy window), but at least 2h.
    const dynamicRiskMs = Math.max(2 * 60 * 60 * 1000, Math.min(12 * 60 * 60 * 1000, slaHours * 0.25 * 60 * 60 * 1000));
    const isAtRisk = remainingMs < dynamicRiskMs;

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
          isAtRisk
            ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
            : 'bg-sky-50 text-sky-700 border-sky-200'
        } ${className}`}
      >
        <Clock className={`w-3 h-3 ${isAtRisk ? '' : ''}`} />
        {isAtRisk ? `${formatDuration(remainingMs)} left` : `${formatDuration(remainingMs)} remaining`}
      </span>
    );
  }

  // PENDING states — show pending message
  if (['PENDING_AI', 'PENDING_ADMIN', 'ESCALATED_TO_ADMIN'].includes(ticket.status)) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border bg-zinc-50 text-zinc-500 border-zinc-200 ${className}`}
      >
        <AlertTriangle className="w-3 h-3" />
        Awaiting Assignment
      </span>
    );
  }

  return null;
};

export default SlaChip;
