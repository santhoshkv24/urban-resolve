import React from 'react';
import {
  Clock, CheckCircle2, Loader2, AlertTriangle, X,
  ShieldAlert, ArrowUpCircle, RotateCcw, HelpCircle,
} from 'lucide-react';

const STATUS_CONFIG = {
  PENDING_AI: {
    label:   'AI Routing',
    classes: 'bg-zinc-100 text-zinc-700 border-zinc-200',
    dot:     'bg-zinc-400',
    icon:    Loader2,
    animate: true,
  },
  PENDING_ADMIN: {
    label:   'Pending Review',
    classes: 'bg-zinc-100 text-zinc-700 border-zinc-200',
    dot:     'bg-zinc-400',
    icon:    Clock,
  },
  ASSIGNED: {
    label:   'Assigned',
    classes: 'bg-zinc-100 text-zinc-700 border-zinc-200',
    dot:     'bg-zinc-400',
    icon:    ArrowUpCircle,
  },
  IN_PROGRESS: {
    label:   'In Progress',
    classes: 'bg-zinc-100 text-zinc-700 border-zinc-200',
    dot:     'bg-zinc-400',
    icon:    Loader2,
    animate: true,
  },
  RESOLVED: {
    label:   'Resolved',
    classes: 'bg-zinc-800 text-white border-zinc-700',
    dot:     'bg-zinc-100',
    icon:    CheckCircle2,
  },
  CLOSED: {
    label:   'Closed',
    classes: 'bg-zinc-100 text-zinc-500 border-zinc-200',
    dot:     'bg-zinc-300',
    icon:    X,
  },
  ESCALATED_TO_ADMIN: {
    label:   'Escalated',
    classes: 'bg-red-50 text-red-700 border-red-200',
    dot:     'bg-red-500',
    icon:    ShieldAlert,
  },
  ESCALATED_TO_OFFICER: {
    label:   'To Officer',
    classes: 'bg-red-50 text-red-700 border-red-200',
    dot:     'bg-red-500',
    icon:    ShieldAlert,
  },
  REOPENED: {
    label:   'Reopened',
    classes: 'bg-zinc-100 text-zinc-700 border-zinc-200',
    dot:     'bg-zinc-500',
    icon:    RotateCcw,
  },
  REJECTED: {
    label:   'Rejected',
    classes: 'bg-red-50 text-red-700 border-red-200',
    dot:     'bg-red-500',
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
