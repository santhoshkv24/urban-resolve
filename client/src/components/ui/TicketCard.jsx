import React from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin, Clock, ChevronRight, Zap, Wrench, Calendar, AlertCircle
} from 'lucide-react';
import StatusBadge from './StatusBadge';
import SlaChip from './SlaChip';

const PRIORITY_CONFIG = {
  LOW:      { bg: 'bg-emerald-500/10', text: 'text-emerald-600', border: 'border-emerald-500/20', glow: 'shadow-emerald-500/10' },
  MEDIUM:   { bg: 'bg-amber-500/10',   text: 'text-amber-600',   border: 'border-amber-500/20',   glow: 'shadow-amber-500/10'   },
  HIGH:     { bg: 'bg-rose-500/10',    text: 'text-rose-600',    border: 'border-rose-500/20',    glow: 'shadow-rose-500/10'    },
  CRITICAL: { bg: 'bg-purple-500/10',  text: 'text-purple-600',  border: 'border-purple-500/20',  glow: 'shadow-purple-500/10'  },
};

const formatDate = (date) => {
  if (!date) return '—';
  try {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric',
    });
  } catch { return '—'; }
};

const TicketCard = ({ ticket, to, compact = false }) => {
  const priority = PRIORITY_CONFIG[ticket.priority] || PRIORITY_CONFIG.MEDIUM;
  const departmentName = ticket.assignedDepartment?.name || ticket.recommendedDepartment?.name || 'Pending Dept';

  const resolvedLink = to || (ticket.citizenId ? `/citizen/tickets/${ticket.id}` : `/admin/tickets/${ticket.id}`);

  return (
    <Link
      to={resolvedLink}
      className="group relative block rounded-3xl transition-all duration-500 hover:-translate-y-1"
    >
      {/* Dynamic Glow Shadow */}
      <div className={`absolute -inset-0.5 rounded-[32px] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${priority.glow}`} />

      <div className="relative h-full glass-card border border-outline-variant/30 rounded-3xl overflow-hidden shadow-ambient-lg bg-white/80 backdrop-blur-md flex flex-col">
        {/* Card Header with Image Overlay Effect if needed */}
        <div className="p-5 flex-1">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${priority.text.replace('text', 'bg')}`} />
              <span className="text-[10px] font-mono font-bold text-on-surface-variant/40 tracking-tight uppercase">
                ID-{String(ticket.id).padStart(4, '0')}
              </span>
            </div>
            <StatusBadge status={ticket.status} size="xs" />
          </div>

          <h3 className="text-[15px] font-display font-bold text-on-surface leading-snug line-clamp-2 mb-4 group-hover:text-primary transition-colors duration-300">
            {ticket.description || 'Civic infrastructure report'}
          </h3>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-y-3 gap-x-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-surface-container-low flex items-center justify-center border border-outline-variant/10">
                <Wrench className="w-3.5 h-3.5 text-on-surface-variant/60" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-bold text-on-surface-variant/40 uppercase tracking-tighter">Department</p>
                <p className="text-[11px] font-semibold text-on-surface truncate">{departmentName}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-surface-container-low flex items-center justify-center border border-outline-variant/10">
                <Calendar className="w-3.5 h-3.5 text-on-surface-variant/60" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-bold text-on-surface-variant/40 uppercase tracking-tighter">Reported</p>
                <p className="text-[11px] font-semibold text-on-surface truncate">{formatDate(ticket.createdAt)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Row / Footer */}
        <div className="mt-auto px-5 py-4 bg-surface-container-low/40 border-t border-outline-variant/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
             <div className={`px-2 py-0.5 rounded-lg border ${priority.bg} ${priority.text} ${priority.border} text-[10px] font-black uppercase tracking-wider`}>
               {ticket.priority}
             </div>
             {ticket.aiConfidenceScore && (
               <div className="flex items-center gap-1 text-[10px] font-bold text-secondary-hover bg-secondary/5 px-2 py-0.5 rounded-lg border border-secondary/10">
                 <Zap className="w-2.5 h-2.5" />
                 {(ticket.aiConfidenceScore * 100).toFixed(0)}%
               </div>
             )}
          </div>
          
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-primary opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300">View Details</span>
            <div className="w-7 h-7 rounded-full bg-white shadow-sm border border-outline-variant/10 flex items-center justify-center group-hover:bg-primary transition-colors duration-300">
              <ChevronRight className="w-4 h-4 text-outline-variant group-hover:text-white transition-colors duration-300" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default TicketCard;
