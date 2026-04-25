import React from 'react';
import { Flame, TrendingUp, AlertOctagon, RefreshCw, ShieldCheck } from 'lucide-react';

const SEVERITY_CONFIG = {
  critical: {
    bg: 'bg-rose-50 border-rose-200',
    icon: 'text-rose-600',
    badge: 'bg-rose-100 text-rose-700 border-rose-200',
    label: 'Critical',
    Icon: Flame,
  },
  warning: {
    bg: 'bg-amber-50 border-amber-200',
    icon: 'text-amber-600',
    badge: 'bg-amber-100 text-amber-700 border-amber-200',
    label: 'Warning',
    Icon: AlertOctagon,
  },
  info: {
    bg: 'bg-sky-50 border-sky-200',
    icon: 'text-sky-600',
    badge: 'bg-sky-100 text-sky-700 border-sky-200',
    label: 'Info',
    Icon: TrendingUp,
  },
};

const TYPE_ICON = {
  VOLUME_SPIKE: TrendingUp,
  SLA_CLUSTER: AlertOctagon,
  ESCALATION_SURGE: Flame,
};

/**
 * AnomalyAlerts — Renders actionable operational alert cards for the officer dashboard.
 */
const AnomalyAlerts = ({ alerts = [], loading = false, onRefresh }) => {
  if (loading) {
    return (
      <div className="flex items-center gap-3 px-5 py-4 rounded-2xl border border-outline-variant/20 bg-white shadow-ambient-sm">
        <RefreshCw className="w-4 h-4 text-primary animate-spin" />
        <span className="text-sm font-medium text-on-surface-variant">Scanning for anomalies…</span>
      </div>
    );
  }

  if (!alerts || alerts.length === 0) {
    return (
      <div className="flex items-center gap-4 px-6 py-5 rounded-2xl border border-emerald-200 bg-emerald-50/70 shadow-ambient-sm">
        <div className="w-11 h-11 rounded-xl bg-emerald-100 border border-emerald-200/50 flex items-center justify-center shrink-0">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <p className="text-sm font-bold text-emerald-800 font-display tracking-tight">All Systems Normal</p>
          <p className="text-xs text-emerald-700 font-medium">No volume spikes, SLA clusters, or escalation surges detected.</p>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="ml-auto p-2 rounded-xl text-emerald-600 hover:bg-emerald-100 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-rose-500" />
          <h3 className="text-base font-bold text-on-surface font-display tracking-tight">
            Active Alerts
            <span className="ml-2.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-black border border-rose-200">
              {alerts.length}
            </span>
          </h3>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="p-1.5 rounded-xl text-on-surface-variant hover:bg-surface-container transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Alert cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {alerts.map((alert, idx) => {
          const cfg = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.warning;
          const TypeIcon = TYPE_ICON[alert.type] || AlertOctagon;

          return (
            <div
              key={idx}
              className={`flex flex-col gap-4 p-5 rounded-2xl border ${cfg.bg} shadow-ambient-sm transition-transform hover:-translate-y-0.5 animate-in fade-in slide-in-from-bottom-2`}
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl border border-white/40 flex items-center justify-center shrink-0 bg-white/70 shadow-sm`}>
                  <TypeIcon className={`w-5 h-5 ${cfg.icon}`} />
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${cfg.badge}`}>
                      {cfg.label}
                    </span>
                    {alert.departmentName && (
                      <span className="text-[10px] text-on-surface-variant font-bold truncate">{alert.departmentName}</span>
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-on-surface leading-snug">{alert.title}</h4>
                </div>
              </div>
              <p className="text-xs text-on-surface-variant font-medium leading-relaxed">{alert.description}</p>
              
              {/* Metric bar */}
              <div className="flex items-center justify-between text-[10px] bg-white/70 border border-white/50 rounded-xl px-3 py-2 mt-auto">
                <span className="text-on-surface-variant font-bold">Current</span>
                <span className="font-black text-on-surface text-xs">{alert.metric}</span>
                <span className="text-on-surface-variant font-bold">Threshold</span>
                <span className="font-black text-on-surface text-xs">{alert.threshold}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AnomalyAlerts;
