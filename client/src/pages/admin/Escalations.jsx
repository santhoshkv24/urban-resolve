import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../api/client';
import Button from '../../components/ui/Button';
import { PageLoader } from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import { AlertTriangle, Clock, MapPin, ArrowRight } from 'lucide-react';
import { formatDate } from '../../utils/dateUtils';

const AdminEscalations = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEscalations = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get('/tickets?status=ESCALATED_TO_ADMIN');
        if (response.data.success) {
          setTickets(response.data.data.tickets);
        }
      } catch (err) {
        console.error('Failed to fetch escalations:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEscalations();
  }, []);

  if (loading && tickets.length === 0) return <PageLoader message="Loading escalation queue..." />;

  return (
    <div className="p-6 lg:p-8 w-full max-w-6xl mx-auto animate-fade-up">
      <div className="mb-8">
        <p className="text-xs font-bold text-red-600 uppercase tracking-widest mb-2 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" /> Action Required
        </p>
        <h1 className="text-3xl font-display font-bold text-on-surface tracking-tight mb-2">
          Escalation Queue
        </h1>
        <p className="text-on-surface-variant text-[15px] max-w-3xl">
          These tickets have been flagged by field workers as invalid, duplicate, or unserviceable.
          Admin review is required to reject them or re-assign to another department.
        </p>
      </div>

      {!loading && tickets.length === 0 ? (
        <EmptyState preset="tickets" message="Queue is Empty. No pending escalations require admin attention right now." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tickets.map(ticket => (
            <div key={ticket.id} className="p-6 rounded-2xl border border-red-200 bg-white relative overflow-hidden flex flex-col shadow-ambient-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-ambient-md group">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500" />
              <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none transition-transform duration-500 group-hover:scale-110">
                <AlertTriangle className="w-32 h-32 text-red-900" />
              </div>
              
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-[10px] px-2.5 py-1 bg-surface-container text-on-surface font-black rounded-full uppercase tracking-widest border border-outline-variant/20 inline-block mb-2">
                      TICKET #{ticket.id}
                    </span>
                    <p className="text-on-surface-variant text-xs font-medium flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-red-500" /> {formatDate(ticket.updatedAt)}
                    </p>
                  </div>
                  <span className="bg-red-50 text-red-700 border border-red-200 font-bold text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full">
                    Escalated
                  </span>
                </div>
                
                <h3 className="text-lg font-bold font-display text-on-surface mb-3 leading-tight">
                  {ticket.description || 'Unspecified Civic Issue'}
                </h3>
                
                <div className="flex items-center gap-1.5 text-xs text-on-surface-variant font-medium mb-5">
                  <MapPin className="w-3.5 h-3.5 text-secondary" /> {ticket.latitude}, {ticket.longitude}
                </div>

                <div className="p-4 rounded-xl mb-6 flex-1 border border-red-100 bg-red-50/50 shadow-inner-soft">
                  <p className="text-[10px] text-red-700 font-black uppercase tracking-wider mb-1.5">Worker Escalation Note</p>
                  <p className="text-sm font-medium text-red-900 italic">"{ticket.escalationReason || 'No reason provided.'}"</p>
                  <div className="mt-3 text-[10px] font-bold text-red-800/70 uppercase tracking-wider text-right">
                    — From: {ticket.assignedDepartment?.name || 'Unknown'}
                  </div>
                </div>

                <div className="mt-auto">
                  <Link to={`/admin/tickets/${ticket.id}`} className="block">
                    <Button variant="danger" className="w-full" rightIcon={ArrowRight}>
                      Review & Resolve Issue
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminEscalations;
