import React, { useState, useEffect } from 'react';
import { Target, Zap, FileText, TrendingUp, Clock, Award, RefreshCw, Info } from 'lucide-react';
import apiClient from '../../api/client';

/**
 * Circular gauge SVG — renders a clean arc progress indicator.
 */
const CircularGauge = ({ score = 0, size = 120 }) => {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(100, score));
  const offset = circumference - (progress / 100) * circumference;

  const colorClass =
    progress >= 70 ? '#10b981' : progress >= 40 ? '#f59e0b' : '#f43f5e';

  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      {/* Background track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={8}
        className="text-outline-variant/30"
      />
      {/* Progress arc */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={colorClass}
        strokeWidth={8}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 1s ease-out' }}
      />
    </svg>
  );
};

/**
 * ImpactScoreCard — Displays officer impact score and KPI breakdown.
 */
const ImpactScoreCard = ({ officerId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showInfo, setShowInfo] = useState(false);

  const fetchImpact = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/analytics/officer-impact');
      setData(res.data.data.officerImpact);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchImpact(); }, [officerId]);

  const scoreColor = (s) =>
    s >= 70 ? 'text-emerald-600' : s >= 40 ? 'text-amber-600' : 'text-rose-600';

  const scoreLabel = (s) =>
    s >= 70 ? 'High Impact' : s >= 40 ? 'Moderate' : 'Building Impact';

  const kpis = data
    ? [
        {
          Icon: Zap,
          label: 'Interventions',
          value: data.totalInterventions,
          sub: `${data.activeInterventions} active`,
          color: 'text-amber-600',
          bg: 'bg-amber-50',
        },
        {
          Icon: FileText,
          label: 'Directives',
          value: data.directivesIssued,
          sub: 'posted',
          color: 'text-sky-600',
          bg: 'bg-sky-50',
        },
        {
          Icon: TrendingUp,
          label: 'Resolution Rate',
          value: `${data.interventionResolutionRate}%`,
          sub: 'flagged tickets resolved',
          color: 'text-emerald-600',
          bg: 'bg-emerald-50',
        },
        {
          Icon: Clock,
          label: 'Avg Resolution',
          value: data.avgResolutionAfterIntervention != null ? `${data.avgResolutionAfterIntervention}h` : '—',
          sub: 'after intervention',
          color: 'text-indigo-600',
          bg: 'bg-indigo-50',
        },
      ]
    : [];

  return (
    <div className="bg-white rounded-2xl border border-outline-variant/25 overflow-hidden transition-all duration-300"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/15 bg-surface-container-low/30">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-primary" />
          <h3 className="font-bold text-on-surface text-sm font-display tracking-tight">Officer Impact Score</h3>
          <button
            onClick={() => setShowInfo((s) => !s)}
            className="p-1 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>
        <button
          onClick={fetchImpact}
          className="p-1.5 rounded-xl text-on-surface-variant hover:bg-surface-container transition-colors"
          title="Refresh"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Info tooltip */}
      {showInfo && (
        <div className="mx-5 mt-4 p-3 bg-primary/5 rounded-xl border border-primary/10 text-[11px] text-on-surface-variant leading-relaxed">
          Score formula: 40% resolution rate + 30% intervention volume (cap 20) + 30% directives issued (cap 10).
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : !data ? (
        <div className="flex flex-col items-center justify-center py-12 text-center px-6">
          <Target className="w-10 h-10 text-on-surface-variant/20 mb-2" />
          <p className="text-sm text-on-surface-variant">Impact data not available.</p>
        </div>
      ) : (
        <div className="p-5 space-y-5">
          {/* Gauge + Score */}
          <div className="flex items-center gap-5">
            <div className="relative shrink-0">
              <CircularGauge score={data.impactScore} size={110} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-3xl font-black font-display ${scoreColor(data.impactScore)}`}>
                  {data.impactScore}
                </span>
                <span className="text-[10px] text-on-surface-variant font-bold">/100</span>
              </div>
            </div>
            <div>
              <p className={`text-lg font-extrabold font-display tracking-tight ${scoreColor(data.impactScore)}`}>
                {scoreLabel(data.impactScore)}
              </p>
              <p className="text-xs text-on-surface-variant leading-relaxed mt-1 font-medium">
                Based on interventions, directives, and resolution outcomes. Take action to improve your score.
              </p>
            </div>
          </div>

          {/* KPI grid */}
          <div className="grid grid-cols-2 gap-3">
            {kpis.map(({ Icon, label, value, sub, color, bg }) => (
              <div key={label} className={`flex items-center gap-3 p-3 rounded-xl border border-outline-variant/10 ${bg}`}>
                <div className="w-8 h-8 rounded-lg bg-white/70 flex items-center justify-center shrink-0 border border-white">
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <div className="min-w-0">
                  <p className={`text-base font-black font-display ${color}`}>{value}</p>
                  <p className="text-[10px] text-on-surface-variant font-bold leading-tight">{label}</p>
                  <p className="text-[9px] text-on-surface-variant/70 font-medium truncate">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImpactScoreCard;
