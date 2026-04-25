import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Calendar, FileText, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import apiClient from '../../api/client';
import { getImageUrl } from '../../utils/imageUrl';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import { PageLoader } from '../../components/ui/Spinner';

const TaskHistory = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await apiClient.get('/tickets?limit=50');
        const data = res.data;
        
        if (!data.success) throw new Error(data.error?.message || 'Failed to fetch tickets');
        
        // Filter out active tasks (which are handled in WorkerDashboard)
        // History contains RESOLVED, ESCALATED_TO_ADMIN, REJECTED
        const historyTickets = data.data.tickets.filter(t => 
          ['RESOLVED', 'ESCALATED_TO_ADMIN', 'REJECTED'].includes(t.status)
        );
        
        setTickets(historyTickets);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  if (loading && tickets.length === 0) return <PageLoader message="Loading task history..." />;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto flex flex-col h-full animate-fade-up">
      <div className="mb-8">
        <p className="text-xs font-bold text-secondary/80 uppercase tracking-widest mb-2">
          Your Activity
        </p>
        <h1 className="text-3xl font-display font-bold text-on-surface tracking-tight">
          Task History
        </h1>
        <p className="text-on-surface-variant text-[15px] mt-1">
          Archive of your previously resolved or flagged tasks.
        </p>
      </div>

      {error ? (
        <div className="p-6 text-center text-red-600 bg-red-50 border border-red-200 rounded-2xl">
          <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
          <p className="font-bold">{error}</p>
        </div>
      ) : tickets.length === 0 ? (
        <EmptyState 
          preset="tickets" 
          message="No historical tasks found. Tasks you complete or escalate will appear here." 
        />
      ) : (
        <div className="bg-white rounded-2xl border border-outline-variant/25 overflow-hidden shadow-ambient-sm transition-all duration-300">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-body">
              <thead className="bg-surface-container-low/30 text-on-surface-variant border-b border-outline-variant/20">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Ticket ID</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Issue Reference</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-center">Status</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Date Handled</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr key={ticket.id} className="border-b border-outline-variant/15 last:border-0 hover:bg-surface-container-low transition-colors table-row-hover">
                    <td className="px-6 py-4 font-bold text-on-surface text-sm">#{ticket.id}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {ticket.imageUrl ? (
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-surface-container-lowest flex-shrink-0 border border-outline-variant/20 shadow-sm">
                            <img src={getImageUrl(ticket.imageUrl)} alt="Issue" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center text-on-surface-variant border border-outline-variant/20 shadow-sm">
                            <FileText className="h-5 w-5 opacity-50" />
                          </div>
                        )}
                        <span className="text-on-surface font-medium max-w-xs truncate text-sm">
                          {ticket.description || 'No description provided'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <StatusBadge status={ticket.status} size="sm" />
                    </td>
                    <td className="px-6 py-4 text-on-surface-variant text-sm font-medium">
                      <div className="flex items-center gap-1.5 whitespace-nowrap">
                        <Calendar className="h-3.5 w-3.5 opacity-70" />
                        {new Date(ticket.resolvedAt || ticket.updatedAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        to={`/worker/tickets/${ticket.id}`}
                        className="inline-flex h-9 items-center justify-center rounded-lg border border-outline-variant/30 bg-white px-3 text-sm font-bold text-on-surface hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 gap-1.5 group"
                      >
                        View Report
                        <ArrowRight className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskHistory;
