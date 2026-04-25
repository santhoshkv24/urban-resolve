import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import {
  BarChart2, CheckCircle2, Clock3, TrendingUp, ShieldAlert,
  Megaphone, Plus, X, Loader2, RefreshCw, AlertTriangle,
  Siren, Users, MoveRight, Save, Target, Trash2,
} from 'lucide-react';
import apiClient from '../../api/client';
import AnomalyAlerts from '../../components/officer/AnomalyAlerts';
import ImpactScoreCard from '../../components/officer/ImpactScoreCard';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { PageLoader } from '../../components/ui/Spinner';

/* ── Premium KPI Card ── */
const StatCard = ({ icon: Icon, label, value, color, bgColor, sub }) => (
  <div className={`relative overflow-hidden rounded-2xl p-5 border border-outline-variant/25 transition-all duration-300 hover:-translate-y-0.5 ${bgColor}`}
    style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)' }}
  >
    <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />

    <div className="flex items-start justify-between mb-4">
      <div className={`w-11 h-11 rounded-xl ${color} flex items-center justify-center shadow-sm`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
    </div>
    <p className="text-4xl font-display font-black text-on-surface">{value ?? '—'}</p>
    <p className="text-sm text-on-surface-variant font-bold mt-1">{label}</p>
    {sub && <p className="text-[10px] text-on-surface-variant/70 mt-1 font-semibold">{sub}</p>}
  </div>
);

const DirectiveForm = ({ onSuccess }) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState('normal');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      setError('Message is required.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await apiClient.post('/directives', { message: message.trim(), priority });
      setMessage('');
      setPriority('normal');
      setOpen(false);
      onSuccess?.();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to post directive.');
    } finally {
      setSubmitting(false);
    }
  };

  const PRIORITY_OPTIONS = [
    { value: 'normal', label: 'Normal', activeClass: 'border-sky-400 bg-sky-50 text-sky-700' },
    { value: 'urgent', label: 'Urgent', activeClass: 'border-amber-400 bg-amber-50 text-amber-700' },
    { value: 'critical', label: 'Critical', activeClass: 'border-red-400 bg-red-50 text-red-700' },
  ];

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} variant="civic" size="md" leftIcon={Plus} className="w-full">
        Post New Directive
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-outline-variant/25 p-5 space-y-4 shadow-ambient-sm animate-in fade-in zoom-in-95 duration-200">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-primary" />
          <h3 className="font-bold text-on-surface text-sm font-display tracking-tight">Post Executive Directive</h3>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div>
        <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">Priority Level</label>
        <div className="flex gap-2">
          {PRIORITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setPriority(opt.value)}
              className={`flex-1 py-2 text-xs font-bold rounded-xl border-2 transition-all ${
                priority === opt.value ? opt.activeClass : 'border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-low'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">Message</label>
        <textarea
          rows={3}
          maxLength={280}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Announce strategic updates to all admin and worker teams..."
          className="w-full bg-surface-container-lowest rounded-xl border border-outline-variant/50 p-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none transition-shadow resize-none"
        />
      </div>

      {error && <p className="text-error text-xs font-semibold">{error}</p>}

      <div className="flex gap-3">
        <Button
          type="button"
          onClick={() => setOpen(false)}
          variant="secondary"
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          loading={submitting}
          disabled={!message.trim()}
          variant="primary"
          leftIcon={Megaphone}
          className="flex-1"
        >
          Post Directive
        </Button>
      </div>
    </form>
  );
};

const ActiveDirectives = ({ directive, onDeactivate, loading }) => {
  if (loading) return <div className="animate-pulse h-20 bg-surface-container-low rounded-2xl" />;
  if (!directive) return null;

  const priorityStyles = {
    critical: 'bg-red-50 border-red-200 text-red-700',
    urgent: 'bg-amber-50 border-amber-200 text-amber-700',
    normal: 'bg-sky-50 border-sky-200 text-sky-700',
  };

  return (
    <div className={`p-4 rounded-2xl border ${priorityStyles[directive.priority || 'normal']} shadow-sm animate-in fade-in slide-in-from-top-2`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/60 border border-current/20">
              Active Directive ({directive.priority})
            </span>
            <span className="text-[10px] font-bold opacity-70">
              Posted {new Date(directive.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <p className="text-sm font-bold leading-relaxed">{directive.message}</p>
        </div>
        <button
          onClick={() => onDeactivate(directive.id)}
          className="p-1.5 rounded-lg hover:bg-black/5 transition-colors"
          title="End Directive"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

const DepartmentSlaRow = ({ row, draftHours, onChangeHours, onSaveHours, savingId, readOnly }) => {
  const loadClass =
    row.ticketsPerWorker != null && row.ticketsPerWorker >= 6
      ? 'text-red-700 bg-red-50 border-red-200'
      : row.ticketsPerWorker != null && row.ticketsPerWorker >= 3
      ? 'text-amber-700 bg-amber-50 border-amber-200'
      : 'text-emerald-700 bg-emerald-50 border-emerald-200';

  return (
    <tr className="border-b border-outline-variant/15 hover:bg-surface-container-low/50 transition-colors">
      <td className="px-5 py-4 text-sm font-bold text-on-surface">{row.name}</td>
      <td className="px-5 py-4 text-xs font-medium text-on-surface-variant">{row.openTicketCount}</td>
      <td className="px-5 py-4 text-xs font-medium text-on-surface-variant">{row.workerCount}</td>
      <td className="px-5 py-4">
        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border tracking-wide ${loadClass}`}>
          {row.ticketsPerWorker == null ? 'NO WORKERS' : `${row.ticketsPerWorker} / WORKER`}
        </span>
      </td>
      <td className="px-5 py-4">
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            max={168}
            value={draftHours}
            onChange={(e) => onChangeHours(row.id, e.target.value)}
            disabled={readOnly}
            className="w-20 px-2.5 py-1.5 rounded-lg border border-outline-variant/50 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-shadow"
          />
          <span className="text-xs font-semibold text-on-surface-variant">hrs</span>
        </div>
      </td>
      <td className="px-5 py-4 text-right">
        {!readOnly && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onSaveHours(row.id)}
            loading={savingId === row.id}
            leftIcon={Save}
          >
            Save
          </Button>
        )}
      </td>
    </tr>
  );
};

const OfficerDashboard = () => {
  const { user } = useAuth();
  const isOfficer = user?.role === 'OFFICER';

  const [analytics, setAnalytics] = useState(null);
  const [anomalies, setAnomalies] = useState([]);
  const [anomalyLoading, setAnomalyLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [activeInterventionCount, setActiveInterventionCount] = useState(0);

  const [activeDirective, setActiveDirective] = useState(null);
  const [directiveLoading, setDirectiveLoading] = useState(true);
  const [emergencyState, setEmergencyState] = useState(null);
  const [emergencySubmitting, setEmergencySubmitting] = useState(false);
  const [emergencyForm, setEmergencyForm] = useState({
    targetDepartmentId: '',
    reason: '',
    message: '',
  });
  const [emergencyMessage, setEmergencyMessage] = useState('');

  const [policies, setPolicies] = useState([]);
  const [policiesLoading, setPoliciesLoading] = useState(true);
  const [policyDraft, setPolicyDraft] = useState({});
  const [policySavingId, setPolicySavingId] = useState(null);

  const [workforce, setWorkforce] = useState([]);
  const [workforceLoading, setWorkforceLoading] = useState(true);
  const [draftWorkers, setDraftWorkers] = useState([]);
  const [targetDepartmentId, setTargetDepartmentId] = useState('');
  const [reassignReason, setReassignReason] = useState('');
  const [reassigning, setReassigning] = useState(false);
  const [workforceMessage, setWorkforceMessage] = useState('');

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/analytics/overview');
      setAnalytics(res.data.data);
    } catch {
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAnomalies = useCallback(async () => {
    setAnomalyLoading(true);
    try {
      const res = await apiClient.get('/analytics/anomalies');
      setAnomalies(res.data.data.alerts || []);
    } catch {
      setAnomalies([]);
    } finally {
      setAnomalyLoading(false);
    }
  }, []);

  const fetchInterventionCount = useCallback(async () => {
    try {
      const res = await apiClient.get('/officer/interventions');
      setActiveInterventionCount((res.data.data.interventions || []).length);
    } catch {
      setActiveInterventionCount(0);
    }
  }, []);

  const fetchEmergencyState = useCallback(async () => {
    try {
      const res = await apiClient.get('/officer/emergency-state');
      setEmergencyState(res.data.data.emergencyState || null);
    } catch {
      setEmergencyState(null);
    }
  }, []);

  const fetchActiveDirective = useCallback(async () => {
    setDirectiveLoading(true);
    try {
      const res = await apiClient.get('/directives/active');
      setActiveDirective(res.data.data.directive || null);
    } catch {
      setActiveDirective(null);
    } finally {
      setDirectiveLoading(false);
    }
  }, []);

  const fetchPolicies = useCallback(async () => {
    setPoliciesLoading(true);
    try {
      const res = await apiClient.get('/officer/policies');
      const rows = res.data.data.policies || [];
      setPolicies(rows);
      setPolicyDraft(Object.fromEntries(rows.map((row) => [row.id, String(row.defaultSlaHours)])));
      if (!targetDepartmentId && rows.length > 0) {
        setTargetDepartmentId(String(rows[0].id));
      }
      if (!emergencyForm.targetDepartmentId && rows.length > 0) {
        setEmergencyForm((prev) => ({ ...prev, targetDepartmentId: String(rows[0].id) }));
      }
    } catch {
      setPolicies([]);
    } finally {
      setPoliciesLoading(false);
    }
  }, [emergencyForm.targetDepartmentId, targetDepartmentId]);

  const fetchWorkforce = useCallback(async () => {
    setWorkforceLoading(true);
    try {
      const res = await apiClient.get('/officer/workforce-overview');
      setWorkforce(res.data.data.departments || []);
    } catch {
      setWorkforce([]);
    } finally {
      setWorkforceLoading(false);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([
      fetchAnalytics(),
      fetchAnomalies(),
      fetchInterventionCount(),
      fetchEmergencyState(),
      fetchActiveDirective(),
      fetchPolicies(),
      fetchWorkforce(),
    ]);
  }, [fetchAnalytics, fetchAnomalies, fetchInterventionCount, fetchEmergencyState, fetchActiveDirective, fetchPolicies, fetchWorkforce]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const deptChartData =
    analytics?.ticketsByDepartment?.map((d) => ({
      name: d.name?.split(' ')[0] ?? d.name,
      tickets: d._count?.assignedTickets ?? 0,
    })) ?? [];

  const BAR_COLORS = ['#6366f1', '#22d3ee', '#f59e0b', '#10b981', '#f43f5e'];

  const handleActivateEmergency = async (e) => {
    e.preventDefault();
    if (!isOfficer) return;

    const payload = {
      targetDepartmentId: Number(emergencyForm.targetDepartmentId),
      reason: emergencyForm.reason.trim(),
      message: emergencyForm.message.trim(),
    };

    if (!payload.targetDepartmentId || !payload.reason || !payload.message) {
      setEmergencyMessage('Provide target department, reason, and broadcast message.');
      return;
    }

    try {
      setEmergencySubmitting(true);
      await apiClient.post('/officer/emergency-state/activate', payload);
      setEmergencyForm((prev) => ({ ...prev, reason: '', message: '' }));
      setEmergencyMessage('Emergency state activated and SLA freeze applied.');
      await Promise.all([fetchEmergencyState(), fetchAnalytics(), fetchWorkforce()]);
    } catch (err) {
      setEmergencyMessage(err.response?.data?.error?.message || 'Failed to activate emergency state.');
    } finally {
      setEmergencySubmitting(false);
    }
  };

  const handleDeactivateEmergency = async () => {
    if (!isOfficer) return;
    try {
      setEmergencySubmitting(true);
      await apiClient.post('/officer/emergency-state/deactivate');
      setEmergencyMessage('Emergency state deactivated and paused SLA timers resumed.');
      await Promise.all([fetchEmergencyState(), fetchAnalytics(), fetchWorkforce()]);
    } catch (err) {
      setEmergencyMessage(err.response?.data?.error?.message || 'Failed to deactivate emergency state.');
    } finally {
      setEmergencySubmitting(false);
    }
  };

  const handleDeactivateDirective = async (id) => {
    try {
      await apiClient.put(`/directives/${id}/deactivate`);
      fetchActiveDirective();
    } catch (err) {
      console.error('Deactivate directive error:', err);
    }
  };

  const handlePolicyHoursChange = (departmentId, value) => {
    setPolicyDraft((prev) => ({ ...prev, [departmentId]: value }));
  };

  const handleSavePolicy = async (departmentId) => {
    if (!isOfficer) return;

    const raw = policyDraft[departmentId];
    const defaultSlaHours = Number(raw);

    if (!Number.isInteger(defaultSlaHours) || defaultSlaHours < 1 || defaultSlaHours > 168) {
      return;
    }

    try {
      setPolicySavingId(departmentId);
      await apiClient.put(`/officer/policies/${departmentId}`, { defaultSlaHours });
      await Promise.all([fetchPolicies(), fetchAnalytics()]);
    } catch {
      // no-op
    } finally {
      setPolicySavingId(null);
    }
  };

  const handleWorkerDragStart = (event, worker, department) => {
    event.dataTransfer.setData(
      'application/json',
      JSON.stringify({
        id: worker.id,
        name: worker.name,
        departmentId: department.id,
        departmentName: department.name,
      })
    );
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleDraftDrop = (event) => {
    event.preventDefault();
    try {
      const payload = JSON.parse(event.dataTransfer.getData('application/json'));

      setDraftWorkers((prev) => {
        const alreadyExists = prev.some((w) => w.id === payload.id);
        if (alreadyExists) return prev;

        if (prev.length > 0 && prev[0].departmentId !== payload.departmentId) {
          setWorkforceMessage('Select workers from the same source department for one transfer batch.');
          return prev;
        }

        setWorkforceMessage('');
        return [...prev, payload];
      });
    } catch {
      // no-op
    }
  };

  const removeDraftWorker = (workerId) => {
    setDraftWorkers((prev) => prev.filter((worker) => worker.id !== workerId));
  };

  const handleReassignWorkers = async () => {
    if (!isOfficer || draftWorkers.length === 0) return;

    const fromDepartmentId = draftWorkers[0].departmentId;
    const toDepartmentId = Number(targetDepartmentId);

    if (!toDepartmentId) {
      setWorkforceMessage('Select a target department.');
      return;
    }
    if (toDepartmentId === fromDepartmentId) {
      setWorkforceMessage('Source and target departments must be different.');
      return;
    }

    try {
      setReassigning(true);
      setWorkforceMessage('');

      const res = await apiClient.post('/officer/reassign-workers', {
        fromDepartmentId,
        toDepartmentId,
        workerIds: draftWorkers.map((worker) => worker.id),
        reason: reassignReason.trim(),
      });

      setWorkforceMessage(res.data.message || 'Workers reassigned successfully.');
      setDraftWorkers([]);
      setReassignReason('');

      await Promise.all([fetchWorkforce(), fetchPolicies()]);
    } catch (err) {
      setWorkforceMessage(err.response?.data?.error?.message || 'Failed to reassign workers.');
    } finally {
      setReassigning(false);
    }
  };

  if (loading && !analytics) return <PageLoader message="Initializing Command Center…" />;

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto animate-fade-up">
      {/* ── Header ── */}
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-bold text-secondary/80 uppercase tracking-widest mb-2">
            Officer Portal
          </p>
          <h1 className="text-3xl font-extrabold font-display text-on-surface tracking-tight mb-1">
            Command Center
          </h1>
          <p className="text-on-surface-variant text-[15px] mt-1">
            Coordinate emergency actions, policy controls, and active resource allocations.
          </p>
        </div>
        <Button
          onClick={refreshAll}
          variant="secondary"
          size="md"
          leftIcon={RefreshCw}
          loading={loading || anomalyLoading || policiesLoading || workforceLoading}
        >
          Refresh All
        </Button>
      </header>

      {/* ── Anomalies ── */}
      <AnomalyAlerts alerts={anomalies} loading={anomalyLoading} onRefresh={fetchAnomalies} />

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        <StatCard
          icon={BarChart2} label="Total Tickets" value={analytics?.totalTickets ?? 0}
          color="bg-slate-500" bgColor="bg-white"
        />
        <StatCard
          icon={CheckCircle2} label="Resolved" value={analytics?.resolvedTickets ?? 0}
          color="bg-emerald-500" bgColor="bg-emerald-50/70"
          sub={`${analytics?.resolutionRate ?? 0}% rate`}
        />
        <StatCard
          icon={Clock3} label="Avg Resolution" value={analytics?.avgResolutionTime != null ? `${analytics.avgResolutionTime}h` : '—'}
          color="bg-indigo-500" bgColor="bg-indigo-50/70"
        />
        <StatCard
          icon={ShieldAlert} label="Active Interventions" value={activeInterventionCount}
          color="bg-amber-500" bgColor="bg-amber-50/70"
          sub="Requires attention"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* ── Chart ── */}
        <div className="xl:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold text-on-surface text-base font-display flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-secondary" /> Tickets by Department
            </h2>
          </div>
          {deptChartData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-on-surface-variant font-medium text-sm">No data yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={deptChartData} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#71717a' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#71717a' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e4e4e7', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} />
                <Bar dataKey="tickets" radius={[6, 6, 0, 0]}>
                  {deptChartData.map((_, i) => (
                    <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* ── Impact & Directives ── */}
        <div className="space-y-6">
          <ImpactScoreCard officerId={user?.id} />

          <div className="glass-card p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-primary" />
              <h2 className="font-bold text-on-surface text-base font-display">Executive Directive</h2>
            </div>
            
            <ActiveDirectives 
              directive={activeDirective} 
              onDeactivate={handleDeactivateDirective}
              loading={directiveLoading}
            />

            {!activeDirective && !directiveLoading && (
              <p className="text-xs text-on-surface-variant font-medium">
                Post a strategic directive that appears across admin and worker dashboards.
              </p>
            )}
            
            {!activeDirective && !directiveLoading && (
              <DirectiveForm onSuccess={fetchActiveDirective} />
            )}
          </div>
        </div>
      </div>

      {/* ── Emergency State ── */}
      <section className="glass-card p-6 lg:p-8">
        <div className="flex items-center gap-2 mb-6">
          <Siren className="w-6 h-6 text-red-600 animate-pulse" />
          <h2 className="font-bold text-on-surface text-lg font-display">Emergency State Control</h2>
        </div>

        {emergencyState?.isActive ? (
          <div className="mb-6 p-5 rounded-2xl border border-red-300 bg-red-50/80 shadow-inner-soft">
            <p className="text-xs font-black uppercase tracking-widest text-red-700 mb-1">Emergency Active</p>
            <p className="text-base text-red-900 font-bold">Target: {emergencyState.targetDepartment?.name}</p>
            <p className="text-sm text-red-800 mt-2 font-medium bg-red-100/50 p-3 rounded-xl border border-red-200">{emergencyState.message}</p>
          </div>
        ) : (
          <div className="mb-6 p-4 rounded-xl border border-emerald-200 bg-emerald-50/70 text-emerald-800 text-sm font-bold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            No emergency state is currently active.
          </div>
        )}

        {isOfficer ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <form onSubmit={handleActivateEmergency} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-2">Target Department</label>
                <select
                  value={emergencyForm.targetDepartmentId}
                  onChange={(e) => setEmergencyForm((prev) => ({ ...prev, targetDepartmentId: e.target.value }))}
                  className="w-full rounded-xl border border-outline-variant/50 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-shadow"
                >
                  <option value="">Select target department</option>
                  {policies.map((row) => (
                    <option key={row.id} value={row.id}>{row.name}</option>
                  ))}
                </select>
              </div>

              <Input
                label="Reason"
                value={emergencyForm.reason}
                onChange={(e) => setEmergencyForm((prev) => ({ ...prev, reason: e.target.value }))}
                placeholder="Example: Flooding across central zone"
              />

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-2">Broadcast Message</label>
                <textarea
                  rows={3}
                  value={emergencyForm.message}
                  onChange={(e) => setEmergencyForm((prev) => ({ ...prev, message: e.target.value }))}
                  placeholder="Message shown as a red global banner to all dashboards"
                  className="w-full rounded-xl border border-outline-variant/50 bg-white px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 transition-shadow"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="submit"
                  loading={emergencySubmitting}
                  className="bg-red-600 hover:bg-red-700 text-white"
                  leftIcon={AlertTriangle}
                >
                  Activate Emergency
                </Button>

                {emergencyState?.isActive && (
                  <Button
                    type="button"
                    onClick={handleDeactivateEmergency}
                    disabled={emergencySubmitting}
                    variant="outline"
                  >
                    Deactivate
                  </Button>
                )}
              </div>
            </form>

            <div className="p-6 rounded-2xl border border-outline-variant/25 bg-surface-container-low/30 text-sm text-on-surface-variant space-y-3 shadow-sm h-fit">
              <p className="font-bold text-on-surface text-base mb-4">Emergency Mode Effects</p>
              <div className="space-y-3 font-medium">
                <p className="flex items-start gap-2"><span className="text-red-500 font-bold">1.</span> Tickets in the target department are escalated to CRITICAL priority.</p>
                <p className="flex items-start gap-2"><span className="text-red-500 font-bold">2.</span> SLA timers for non-target active tickets are frozen.</p>
                <p className="flex items-start gap-2"><span className="text-red-500 font-bold">3.</span> Admin and Worker dashboards display the emergency broadcast banner.</p>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-on-surface-variant font-medium">Only officers can activate or deactivate emergency state.</p>
        )}

        {emergencyMessage && <p className="mt-4 text-sm font-bold text-secondary">{emergencyMessage}</p>}
      </section>

      {/* ── Policies ── */}
      <section className="glass-card p-6 lg:p-8">
        <div className="flex items-center gap-2 mb-6">
          <Target className="w-5 h-5 text-primary" />
          <h2 className="font-bold text-on-surface text-lg font-display">Policy Control Panel <span className="text-sm font-medium text-on-surface-variant ml-2">(Dynamic SLA Engine)</span></h2>
        </div>

        {policiesLoading ? (
          <div className="py-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-outline-variant" /></div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-outline-variant/20">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-outline-variant/20 bg-surface-container-low">
                  <th className="px-5 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Department</th>
                  <th className="px-5 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Open</th>
                  <th className="px-5 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Workers</th>
                  <th className="px-5 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Load</th>
                  <th className="px-5 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Default SLA</th>
                  <th className="px-5 py-4 text-right text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody>
                {policies.map((row) => (
                  <DepartmentSlaRow
                    key={row.id}
                    row={row}
                    draftHours={policyDraft[row.id] ?? String(row.defaultSlaHours)}
                    onChangeHours={handlePolicyHoursChange}
                    onSaveHours={handleSavePolicy}
                    savingId={policySavingId}
                    readOnly={!isOfficer}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Workforce ── */}
      <section className="glass-card p-6 lg:p-8">
        <div className="flex items-center gap-2 mb-6">
          <Users className="w-5 h-5 text-primary" />
          <h2 className="font-bold text-on-surface text-lg font-display">Resource Reallocation</h2>
        </div>

        {workforceLoading ? (
          <div className="py-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-outline-variant" /></div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
            <div className="xl:col-span-3 grid grid-cols-1 lg:grid-cols-2 gap-4">
              {workforce.map((department) => (
                <div key={department.id} className="rounded-2xl border border-outline-variant/25 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <p className="text-base font-bold text-on-surface">{department.name}</p>
                      <p className="text-xs font-medium text-on-surface-variant mt-0.5">
                        {department.openTicketCount} open tickets, {department.workerCount} workers
                      </p>
                    </div>
                    <span className="text-[10px] px-2.5 py-1 rounded-full bg-surface-container-low text-on-surface font-black border border-outline-variant/20 tracking-wide">
                      {department.ticketsPerWorker == null ? 'N/A' : `${department.ticketsPerWorker}/worker`}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {department.workers.length === 0 ? (
                      <span className="text-xs font-medium text-on-surface-variant/70 italic px-1">No active workers</span>
                    ) : (
                      department.workers.map((worker) => (
                        <button
                          key={worker.id}
                          type="button"
                          draggable={isOfficer}
                          onDragStart={(event) => handleWorkerDragStart(event, worker, department)}
                          className="text-xs font-bold px-3 py-1.5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-on-surface cursor-grab active:cursor-grabbing hover:border-primary/40 hover:bg-primary/5 transition-colors shadow-sm"
                        >
                          {worker.name}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="xl:col-span-2 rounded-3xl border-2 border-dashed border-outline-variant/60 bg-surface-container-lowest/50 p-6 flex flex-col" onDragOver={(e) => e.preventDefault()} onDrop={handleDraftDrop}>
              <div className="flex items-center gap-2 mb-2">
                <MoveRight className="w-5 h-5 text-secondary" />
                <h3 className="text-base font-bold text-on-surface font-display">Draft Board</h3>
              </div>

              <p className="text-xs font-medium text-on-surface-variant mb-5">
                Drag workers from a source department and assign them to a target unit.
              </p>

              <div className="space-y-2 mb-6 flex-1 max-h-48 overflow-y-auto pr-2">
                {draftWorkers.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center min-h-[100px] border border-dashed border-outline-variant/30 rounded-xl bg-white/50 text-on-surface-variant/50">
                    <p className="text-xs font-bold uppercase tracking-wider">Drop workers here</p>
                  </div>
                ) : (
                  draftWorkers.map((worker) => (
                    <div key={worker.id} className="flex items-center justify-between gap-2 px-4 py-3 rounded-xl bg-white border border-outline-variant/30 shadow-sm animate-in zoom-in-95 duration-200">
                      <div>
                        <p className="text-sm font-bold text-on-surface">{worker.name}</p>
                        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mt-0.5">From {worker.departmentName}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeDraftWorker(worker.id)}
                        className="p-1.5 rounded-lg text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="space-y-3 pt-4 border-t border-outline-variant/20">
                <select
                  value={targetDepartmentId}
                  onChange={(e) => setTargetDepartmentId(e.target.value)}
                  className="w-full rounded-xl border border-outline-variant/50 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-shadow"
                  disabled={!isOfficer}
                >
                  <option value="">Select target department</option>
                  {workforce.map((department) => (
                    <option key={department.id} value={department.id}>{department.name}</option>
                  ))}
                </select>

                <Input
                  value={reassignReason}
                  onChange={(e) => setReassignReason(e.target.value)}
                  placeholder="Reason for temporary reallocation"
                  disabled={!isOfficer}
                />

                {isOfficer && (
                  <Button
                    onClick={handleReassignWorkers}
                    disabled={draftWorkers.length === 0}
                    loading={reassigning}
                    variant="civic"
                    className="w-full mt-2"
                    leftIcon={Users}
                  >
                    Reassign Workers
                  </Button>
                )}
              </div>

              {workforceMessage && (
                <p className="mt-4 text-xs font-bold text-secondary text-center">{workforceMessage}</p>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default OfficerDashboard;
