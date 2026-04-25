import React from 'react';
import {
  Clock, CheckCircle2, Loader2, AlertTriangle, X,
  ShieldAlert, ArrowUpCircle, RotateCcw, HelpCircle,
} from 'lucide-react';

const STATUS_CONFIG = {
  PENDING_AI: {
    label:   'AI Routing',
    classes: 'bg-sky-100 text-sky-700 border-sky-200',
    dot:     'bg-sky-500',
    icon:    Loader2,
    animate: true,
  },
  PENDING_ADMIN: {
    label:   'Pending Review',
    classes: 'bg-amber-100 text-amber-700 border-amber-200',
    dot:     'bg-amber-500',
    icon:    Clock,
  },
  ASSIGNED: {
    label:   'Assigned',
    classes: 'bg-blue-100 text-blue-700 border-blue-200',
    dot:     'bg-blue-500',
    icon:    ArrowUpCircle,
  },
  IN_PROGRESS: {
    label:   'In Progress',
    classes: 'bg-violet-100 text-violet-700 border-violet-200',
    dot:     'bg-violet-500',
    icon:    Loader2,
    animate: true,
  },
  RESOLVED: {
    label:   'Resolved',
    classes: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    dot:     'bg-emerald-500',
    icon:    CheckCircle2,
  },
  CLOSED: {
    label:   'Closed',
    classes: 'bg-slate-100 text-slate-600 border-slate-200',
    dot:     'bg-slate-400',
    icon:    X,
  },
  ESCALATED_TO_ADMIN: {
    label:   'Escalated',
    classes: 'bg-red-100 text-red-700 border-red-200',
    dot:     'bg-red-500',
    icon:    ShieldAlert,
  },
  ESCALATED_TO_OFFICER: {
    label:   'To Officer',
    classes: 'bg-red-100 text-red-700 border-red-200',
    dot:     'bg-red-500',
    icon:    ShieldAlert,
  },
  REOPENED: {
    label:   'Reopened',
    classes: 'bg-orange-100 text-orange-700 border-orange-200',
    dot:     'bg-orange-500',
    icon:    RotateCcw,
  },
  REJECTED: {
    label:   'Rejected',
    classes: 'bg-rose-100 text-rose-700 border-rose-200',
    dot:     'bg-rose-500',
    icon:    AlertTriangle,
  },
};

const SIZE_CLASSES = {
  sm: 'px-2 py-0.5 text-[10px] gap-1',
  md: 'px-2.5 py-1 text-xs gap-1.5',
  lg: 'px-3 py-1.5 text-sm gap-2',
};

const StatusBadge = ({ status, size = 'md', showIcon = true, className = '' }) => {
  const cfg = STATUS_CONFIG[status] ?? {
    label:   status?.replace(/_/g, ' ') ?? 'Unknown',
    classes: 'bg-surface-container text-on-surface-variant border-outline-variant',
    dot:     'bg-outline-variant',
    icon:    HelpCircle,
  };

  const Icon = cfg.icon;

  return (
    <span
      className={[
        'inline-flex items-center font-bold rounded-full border uppercase tracking-wide leading-none',
        SIZE_CLASSES[size] ?? SIZE_CLASSES.md,
        cfg.classes,
        className,
      ].join(' ')}
    >
      {showIcon && Icon ? (
        <Icon className={`w-3 h-3 shrink-0 ${cfg.animate ? 'animate-spin' : ''}`} />
      ) : (
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
      )}
      {cfg.label}
    </span>
  );
};

export default StatusBadge;
