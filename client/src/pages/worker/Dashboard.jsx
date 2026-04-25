import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ClipboardList, Zap, ArrowRight, CheckCircle2, ShieldAlert } from 'lucide-react';
import apiClient from '../../api/client';
import { getImageUrl } from '../../utils/imageUrl';
import EmptyState from '../../components/ui/EmptyState';
import StatusBadge from '../../components/ui/StatusBadge';
import SlaChip from '../../components/ui/SlaChip';
import { PageLoader } from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';
import { formatDate } from '../../utils/dateUtils';
import DirectiveBanner from '../../components/shared/DirectiveBanner';
import EmergencyBanner from '../../components/shared/EmergencyBanner';

const WorkerDashboard = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const response = await apiClient.get('/tickets');
        setTickets(response.data.data.tickets.filter(t => t.status === 'ASSIGNED'));
      } catch (err) {
        console.error('Failed to fetch assigned tickets:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();

    // Poll to pick up workforce reallocation updates without manual refresh.
    const interval = setInterval(fetchTickets, 30_000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <PageLoader message="Loading assigned tasks…" />;

  return (
    <>
      <EmergencyBanner />
      <DirectiveBanner />
      
      <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-8 animate-fade-up">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-secondary/80 uppercase tracking-widest mb-2">
              Worker Portal
            </p>
            <h1 className="text-3xl font-display font-bold text-on-surface tracking-tight">
              My Assigned Tasks
            </h1>
            <p className="text-on-surface-variant text-[15px] mt-1">
              {tickets.length > 0
                ? `You have ${tickets.length} active assignment${tickets.length > 1 ? 's' : ''} to resolve.`
                : 'No active assignments at the moment.'}
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/worker/history">
              <Button variant="outline" leftIcon={ClipboardList}>
                View History
              </Button>
            </Link>
          </div>
        </div>

        {/* ── Content ── */}
        {tickets.length === 0 ? (
          <div className="glass-card mt-8">
            <EmptyState
              preset="default"
              icon={CheckCircle2}
              title="All clear!"
              message="You have no active assignments. Check back later or review your task history."
              action={
                <Link to="/worker/history">
                  <Button variant="civic">View History</Button>
                </Link>
              }
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 stagger-children">
            {tickets.map(ticket => (
              <Link
                key={ticket.id}
                to={`/worker/tickets/${ticket.id}`}
                className="group flex flex-col bg-white rounded-2xl border border-outline-variant/25 overflow-hidden hover:shadow-ambient-lg hover:-translate-y-1 transition-all duration-300"
                style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)' }}
              >
                {/* Image Area */}
                <div className="relative h-48 bg-surface-container overflow-hidden">
                  {ticket.imageUrl ? (
                    <img
                      src={getImageUrl(ticket.imageUrl)}
                      alt="Issue"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-surface-container-low text-on-surface-variant/40 gap-2">
                      <ClipboardList className="w-8 h-8" />
                      <span className="text-xs font-medium">No image provided</span>
                    </div>
                  )}
                  {/* Overlay Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
                  
                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 right-3 flex justify-between items-start pointer-events-none">
                    <div>
                      {ticket.interventions?.length > 0 && (
                        <div className="bg-amber-500 text-white p-1.5 rounded-lg shadow-lg animate-pulse" title="Command Intervention Active">
                          <ShieldAlert className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                    <StatusBadge status={ticket.status} size="sm" />
                  </div>
                  
                  {/* Bottom Image Overlay Text */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                    <span className="text-xs font-mono font-bold text-white/90 bg-black/30 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10">
                      #{typeof ticket.id === 'string' ? ticket.id.slice(0,8) : ticket.id}
                    </span>
                  </div>
                </div>

                {/* Content Area */}
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-bold text-on-surface text-base leading-snug mb-3 group-hover:text-primary transition-colors line-clamp-2">
                    {ticket.description || 'Civic Issue'}
                  </h3>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {ticket.assignedDepartment && (
                      <span className="chip bg-surface-container text-on-surface-variant">
                        {ticket.assignedDepartment.name}
                      </span>
                    )}
                    <SlaChip ticket={ticket} />
                  </div>

                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-outline-variant/15">
                    <div className="flex items-center gap-1.5 text-on-surface-variant/70 min-w-0">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span className="text-xs truncate">
                        {ticket.location || (ticket.latitude ? `${Number(ticket.latitude).toFixed(3)}, ${Number(ticket.longitude).toFixed(3)}` : 'Unknown location')}
                      </span>
                    </div>
                    <span className="text-[10px] font-medium text-on-surface-variant/50 shrink-0">
                      {formatDate(ticket.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Action Footer */}
                <div className="px-5 pb-5 pt-0">
                  <div className="w-full py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/20 text-on-surface text-sm font-bold text-center group-hover:btn-civic transition-all duration-300 flex items-center justify-center gap-2">
                    <Zap className="w-4 h-4 group-hover:animate-pulse" />
                    <span>Execute Task</span>
                    <ArrowRight className="w-4 h-4 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default WorkerDashboard;
