import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../api/client';
import DirectiveBanner from '../../components/shared/DirectiveBanner';
import EmergencyBanner from '../../components/shared/EmergencyBanner';
import StatusBadge from '../../components/ui/StatusBadge';
import { PageLoader } from '../../components/ui/Spinner';
import {
  Users, FileText, CheckCircle2, Clock, AlertTriangle, ArrowRight,
  Zap, BarChart3, Layers, Building2, ShieldAlert, TrendingUp,
} from 'lucide-react';

/* ── Premium KPI Card ── */
const StatCard = ({ icon: Icon, label, value, color, bgColor, to, trend }) => {
  const inner = (
    <div className={`relative overflow-hidden rounded-2xl p-5 border border-outline-variant/25 transition-all duration-300 hover:-translate-y-0.5 ${bgColor}`}
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)' }}
    >
      {/* Shimmer effect on hover */}
      <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />

      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl ${color} flex items-center justify-center shadow-sm`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${trend >= 0 ? 'text-emerald-700 bg-emerald-100' : 'text-red-700 bg-red-100'}`}>
            <TrendingUp className={`w-3 h-3 ${trend < 0 ? 'rotate-180' : ''}`} />
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className="text-4xl font-display font-black text-on-surface">{value}</p>
      <p className="text-sm text-on-surface-variant font-medium mt-1">{label}</p>
    </div>
  );

  return to ? (
    <Link to={to} className="block cursor-pointer">
      {inner}
    </Link>
  ) : inner;
};

/* ── Quick-action tile ── */
const QuickAction = ({ label, description, to, gradient, icon: Icon }) => (
  <Link
    to={to}
    className={`group flex flex-col gap-2 p-5 rounded-2xl bg-gradient-to-br ${gradient} text-white shadow-ambient-sm hover:-translate-y-0.5 hover:shadow-ambient-lg transition-all duration-200`}
  >
    <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center border border-white/20 mb-1">
      <Icon className="w-4 h-4" />
    </div>
    <p className="font-bold text-sm">{label}</p>
    {description && <p className="text-white/60 text-xs leading-tight">{description}</p>}
    <ArrowRight className="w-4 h-4 opacity-50 mt-auto group-hover:translate-x-0.5 transition-transform" />
  </Link>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState({ pending: 0, escalated: 0, resolved: 0, total: 0 });
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statusRes, ticketsRes] = await Promise.all([
          apiClient.get('/analytics/tickets-by-status'),
          apiClient.get('/tickets?limit=8'),
        ]);

        if (statusRes.data.success) {
          const byStatus = statusRes.data.data.ticketsByStatus;
          const sum = (s) => Number(byStatus.find(x => x.status === s)?.ticketCount ?? 0);
          setStats({
            pending:   sum('PENDING_ADMIN'),
            escalated: sum('ESCALATED_TO_ADMIN'),
            resolved:  sum('RESOLVED'),
            total:     byStatus.reduce((acc, x) => acc + Number(x.ticketCount), 0),
          });
        }

        if (ticketsRes.data.success) setTickets(ticketsRes.data.data.tickets);
      } catch (err) {
        console.error('Failed to fetch admin dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <PageLoader message="Loading control center…" />;

  const resolutionRate = stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0;

  return (
    <>
      <EmergencyBanner />
      <DirectiveBanner />

      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-fade-up">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-secondary/80 uppercase tracking-widest mb-2">
              Admin Portal
            </p>
            <h1 className="text-3xl font-display font-bold text-on-surface tracking-tight">
              Control Center
            </h1>
            <p className="text-on-surface-variant text-[15px] mt-1">
              Manage tickets, users, and routing in real time.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              to="/admin/tickets"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold rounded-xl btn-civic"
            >
              <FileText className="w-4 h-4" />
              All Tickets
            </Link>
          </div>
        </div>

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
          <StatCard
            icon={Zap} label="Total Tickets" value={stats.total}
            color="bg-slate-500" bgColor="bg-white"
          />
          <StatCard
            icon={Clock} label="Pending Review" value={stats.pending}
            color="bg-amber-500" bgColor="bg-amber-50/70"
            to="/admin/tickets"
          />
          <StatCard
            icon={ShieldAlert} label="Escalated" value={stats.escalated}
            color="bg-red-500" bgColor="bg-red-50/70"
            to="/admin/escalations"
          />
          <StatCard
            icon={CheckCircle2} label="Resolved" value={stats.resolved}
            color="bg-emerald-500" bgColor="bg-emerald-50/70"
            to="/admin/tickets"
          />
        </div>

        {/* ── Resolution progress bar ── */}
        <div className="bg-white rounded-2xl border border-outline-variant/25 p-5"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-on-surface-variant" />
              <span className="text-sm font-bold text-on-surface">Resolution Rate</span>
            </div>
            <span className="text-2xl font-display font-black text-emerald-600">{resolutionRate}%</span>
          </div>
          <div className="h-2 bg-surface-container rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-700"
              style={{ width: `${resolutionRate}%` }}
            />
          </div>
          <p className="text-xs text-on-surface-variant mt-2">{stats.resolved} of {stats.total} tickets resolved</p>
        </div>

        {/* ── Quick actions ── */}
        <div>
          <h2 className="text-xl font-display font-bold text-on-surface mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <QuickAction label="Manage Tickets"   description="Review & assign"     to="/admin/tickets"      icon={FileText}   gradient="from-teal-500 to-teal-600" />
            <QuickAction label="Escalations"       description="High-priority cases" to="/admin/escalations"  icon={AlertTriangle} gradient="from-red-500 to-rose-600" />
            <QuickAction label="Users & Workers"   description="Access management"   to="/admin/users"        icon={Users}      gradient="from-indigo-500 to-violet-600" />
            <QuickAction label="Departments"       description="Configure routing"   to="/admin/departments"  icon={Building2}  gradient="from-slate-500 to-slate-600" />
          </div>
        </div>

        {/* ── Recent tickets ── */}
        <div className="bg-white rounded-2xl border border-outline-variant/25 overflow-hidden"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.05)' }}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/20">
            <div className="flex items-center gap-2.5">
              <Layers className="w-4 h-4 text-on-surface-variant" />
              <h2 className="font-bold text-on-surface">Recent Tickets</h2>
            </div>
            <Link to="/admin/tickets" className="text-xs text-secondary font-bold hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-outline-variant/20 bg-surface-container-low">
                  {['ID', 'Issue', 'AI Suggestion', 'Status', ''].map((h, i) => (
                    <th
                      key={h}
                      className={`px-6 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider ${
                        h === '' ? 'text-right' : ''
                      } ${i === 2 ? 'hidden sm:table-cell' : ''}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tickets.map(ticket => (
                  <tr
                    key={ticket.id}
                    className="border-b border-outline-variant/15 last:border-0 hover:bg-surface-container-low transition-colors table-row-hover"
                  >
                    <td className="px-6 py-4 text-xs font-mono text-on-surface-variant/70">
                      #{ticket.id}
                    </td>
                    <td className="px-6 py-4 font-semibold text-on-surface text-sm max-w-[180px] truncate">
                      {ticket.description || 'Unspecified Issue'}
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      {ticket.recommendedDepartment ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 bg-secondary/10 text-secondary rounded-full">
                          {ticket.recommendedDepartment.name}
                          {ticket.aiConfidenceScore &&
                            <span className="text-secondary/60 font-normal">
                              · {(ticket.aiConfidenceScore * 100).toFixed(0)}%
                            </span>
                          }
                        </span>
                      ) : (
                        <span className="text-xs text-on-surface-variant/50">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={ticket.status} size="sm" showIcon={false} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/admin/tickets/${ticket.id}`}
                        className="text-xs font-bold text-secondary hover:text-secondary-hover inline-flex items-center gap-1 hover:underline"
                      >
                        Review <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
                {tickets.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-14 text-center">
                      <FileText className="w-8 h-8 mx-auto mb-3 text-outline-variant" />
                      <p className="text-on-surface-variant text-sm">No tickets in queue.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;
