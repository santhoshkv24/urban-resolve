import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, AlertTriangle, FileText, ArrowRight, ShieldAlert } from 'lucide-react';
import apiClient from '../../api/client';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import SlaChip from '../../components/ui/SlaChip';
import { PageLoader } from '../../components/ui/Spinner';

const PRIORITY_BADGE = {
  CRITICAL: 'bg-red-50 text-red-700 border-red-200',
  HIGH: 'bg-amber-50 text-amber-800 border-amber-200',
  MEDIUM: 'bg-sky-50 text-sky-700 border-sky-200',
  LOW: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const AdminTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    const fetchTickets = async () => {
      setLoading(true);
      try {
        const query = statusFilter ? `?status=${statusFilter}` : '';
        const response = await apiClient.get(`/tickets${query}`);
        setTickets(response.data.data.tickets);
      } catch (err) {
        console.error('Failed to fetch tickets:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, [statusFilter]);

  if (loading && tickets.length === 0) return <PageLoader message="Loading civic reports..." />;

  return (
    <div className="p-6 lg:p-8 w-full max-w-7xl mx-auto animate-fade-up">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-xs font-bold text-secondary/80 uppercase tracking-widest mb-2">
            Ticket Management
          </p>
          <h1 className="text-3xl font-display font-bold text-on-surface tracking-tight">
            All Tickets
          </h1>
          <p className="text-on-surface-variant text-[15px] mt-1">
            Review and manage civic reports across all departments.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors" />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-9 pr-8 py-2.5 rounded-xl border border-outline-variant/50 bg-white text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
              style={{ boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}
            >
              <option value="">All Statuses</option>
              <option value="PENDING_ADMIN">Pending Review</option>
              <option value="ESCALATED_TO_ADMIN">Escalated</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-2xl border border-outline-variant/25 overflow-hidden transition-all duration-300"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.05)' }}>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left font-body">
            <thead className="bg-surface-container-low/50 text-on-surface-variant border-b border-outline-variant/20">
              <tr>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">ID</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Description</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider hidden md:table-cell">Location</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider hidden lg:table-cell">AI Dept</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Priority</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider hidden sm:table-cell">SLA</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map(ticket => {
                const isEscalated = ticket.status === 'ESCALATED_TO_ADMIN';
                return (
                  <tr key={ticket.id} className={`border-b border-outline-variant/15 last:border-0 hover:bg-surface-container-low transition-colors table-row-hover ${isEscalated ? 'bg-red-50/30' : ''}`}>
                    <td className="px-6 py-4 text-xs font-mono font-bold text-on-surface-variant/70 whitespace-nowrap">
                      #{ticket.id}
                    </td>
                    <td className="px-6 py-4 font-semibold text-on-surface text-sm max-w-[200px]" title={ticket.description}>
                      <div className="flex items-center gap-2">
                        {ticket.interventions?.length > 0 && (
                          <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" title="Officer Intervention Active" />
                        )}
                        <span className="truncate">{ticket.description || 'Unspecified Issue'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-on-surface-variant hidden md:table-cell max-w-[150px] truncate" title={ticket.location}>
                      {ticket.location || `${ticket.latitude}, ${ticket.longitude}`}
                    </td>
                    <td className="px-6 py-4 text-sm hidden lg:table-cell">
                      {ticket.recommendedDepartment ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 bg-surface-container text-on-surface-variant rounded-full truncate max-w-[120px]">
                          {ticket.recommendedDepartment.name}
                        </span>
                      ) : (
                        <span className="text-xs text-on-surface-variant/50">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider border ${PRIORITY_BADGE[ticket.priority] || PRIORITY_BADGE.LOW}`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={ticket.status} size="sm" />
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      <SlaChip ticket={ticket} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link to={`/admin/tickets/${ticket.id}`}>
                        <Button 
                          variant={ticket.status === 'PENDING_ADMIN' || isEscalated ? 'primary' : 'outline'} 
                          size="sm" 
                          rightIcon={ArrowRight}
                        >
                          {ticket.status === 'PENDING_ADMIN' ? 'Assign' : isEscalated ? 'Review' : 'View'}
                        </Button>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {loading && tickets.length > 0 && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center">
              <PageLoader message="Updating tickets..." />
            </div>
          )}

          {!loading && tickets.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-surface-container-low flex items-center justify-center mb-4 border border-outline-variant/30">
                <FileText className="w-8 h-8 text-on-surface-variant/50" />
              </div>
              <h3 className="text-lg font-bold text-on-surface font-display mb-1">No Tickets Found</h3>
              <p className="text-sm text-on-surface-variant">There are no reports matching your current filter.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminTickets;
