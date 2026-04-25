import React, { useState } from 'react';
import { AlertTriangle, MapPin, ChevronDown, ChevronUp, ExternalLink, X, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getImageUrl } from '../../utils/imageUrl';
import { formatDate } from '../../utils/dateUtils';
import StatusBadge from './StatusBadge';

/**
 * DuplicateNudge — Shows nearby open tickets when citizen is filing a new report.
 * 
 * Props:
 *   nearbyTickets: array of nearby ticket objects from /api/tickets/nearby
 *   onDismiss: callback to dismiss the nudge and proceed with filing
 */
const DuplicateNudge = ({ nearbyTickets = [], onDismiss }) => {
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || !nearbyTickets || nearbyTickets.length === 0) return null;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  const formatDistance = (km) => {
    if (km < 0.1) return `${Math.round(km * 1000)}m away`;
    return `${km.toFixed(2)} km away`;
  };

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/80 overflow-hidden shadow-ambient-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Header */}
      <div className="flex items-start gap-3 p-4">
        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-amber-900 text-sm font-display mb-0.5">
            {nearbyTickets.length} Similar Report{nearbyTickets.length > 1 ? 's' : ''} Found Nearby
          </h3>
          <p className="text-xs text-amber-700 leading-relaxed">
            Citizens near you have already reported similar issues. Check if one of these matches your issue before filing a new report.
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-100 transition-colors shrink-0"
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Ticket list */}
      <div className={`overflow-hidden transition-all duration-300 ${expanded ? 'max-h-[600px]' : 'max-h-[180px]'}`}>
        <div className="px-4 pb-1 space-y-2.5">
          {nearbyTickets.map((ticket) => {
            const dept = ticket.assignedDepartment?.name || ticket.recommendedDepartment?.name;
            const imageUrl = getImageUrl(ticket.imageUrl);

            return (
              <div
                key={ticket.id}
                className="flex gap-3 p-3 bg-white rounded-xl border border-amber-100 hover:border-amber-300 transition-colors shadow-sm"
              >
                {/* Thumbnail */}
                <div className="w-14 h-14 rounded-lg overflow-hidden bg-amber-100 shrink-0">
                  {imageUrl ? (
                    <img src={imageUrl} alt="Existing report" className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-amber-400" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <StatusBadge status={ticket.status} size="xs" />
                    {dept && (
                      <span className="text-[10px] text-amber-700 font-semibold truncate">{dept}</span>
                    )}
                  </div>
                  <p className="text-xs text-on-surface font-medium leading-snug line-clamp-2 mb-1">
                    {ticket.description || 'Civic issue reported'}
                  </p>
                  <div className="flex items-center gap-3 text-[10px] text-on-surface-variant">
                    <span className="flex items-center gap-0.5">
                      <MapPin className="w-3 h-3 text-amber-500" />
                      {formatDistance(ticket.distanceKm)}
                    </span>
                    <span>{formatDate(ticket.createdAt)}</span>
                  </div>
                </div>

                {/* View link */}
                <Link
                  to={`/citizen/tickets/${ticket.id}`}
                  className="shrink-0 self-center p-2 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                  title="View this report"
                >
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </div>
            );
          })}
        </div>
      </div>

      {/* Toggle expand / collapse if more than 1 ticket */}
      {nearbyTickets.length > 1 && (
        <button
          onClick={() => setExpanded((e) => !e)}
          className="w-full flex items-center justify-center gap-1.5 py-2 text-xs text-amber-700 font-semibold hover:bg-amber-100/50 transition-colors border-t border-amber-100"
        >
          {expanded ? (
            <><ChevronUp className="w-3.5 h-3.5" /> Show less</>
          ) : (
            <><ChevronDown className="w-3.5 h-3.5" /> See all {nearbyTickets.length} nearby reports</>
          )}
        </button>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 px-4 py-3 bg-amber-100/40 border-t border-amber-200">
        <button
          onClick={handleDismiss}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white text-amber-800 font-bold text-sm rounded-xl border border-amber-200 hover:bg-amber-50 transition-colors active:scale-95"
        >
          <CheckCircle className="w-4 h-4" />
          My issue is different — Report Anyway
        </button>
      </div>
    </div>
  );
};

export default DuplicateNudge;
