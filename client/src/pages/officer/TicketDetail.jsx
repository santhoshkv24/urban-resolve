import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import apiClient from '../../api/client';
import { getImageUrl } from '../../utils/imageUrl';
import StatusBadge from '../../components/ui/StatusBadge';
import SlaChip from '../../components/ui/SlaChip';
import ReadOnlyMap from '../../components/ui/ReadOnlyMap';
import { formatDateTime } from '../../utils/dateUtils';

const OfficerTicketDetail = () => {
  const { id } = useParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const res = await apiClient.get(`/tickets/${id}`);
        setTicket(res.data.data.ticket);
      } catch (err) {
        console.error('Failed to load ticket detail:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTicket();
  }, [id]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[40vh]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="p-8 text-center text-on-surface-variant">
        Ticket not found. <Link to="/officer" className="text-primary hover:underline">Return to command center</Link>
      </div>
    );
  }

  const departmentName = ticket.assignedDepartment?.name || ticket.recommendedDepartment?.name || 'Unassigned';

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold font-display text-on-surface">Ticket #{ticket.id}</h1>
          <p className="text-sm text-on-surface-variant mt-1">Operational read-only view for officer review.</p>
        </div>
        <Link to="/officer/interventions" className="text-sm font-semibold text-primary hover:underline">
          Back to Interventions
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-surface-container-lowest rounded-2xl border border-outline-variant/20 overflow-hidden">
          <div className="h-64 bg-surface-container overflow-hidden">
            {ticket.imageUrl ? (
              <img src={getImageUrl(ticket.imageUrl)} alt="Ticket evidence" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-on-surface-variant">No image provided</div>
            )}
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs text-on-surface-variant">Department</p>
                <p className="font-bold text-on-surface">{departmentName}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-bold">{ticket.priority}</span>
                <StatusBadge status={ticket.status} size="sm" />
              </div>
            </div>

            <p className="text-sm text-on-surface">{ticket.description || 'No description provided.'}</p>

            <div className="pt-2">
              <SlaChip ticket={ticket} />
            </div>

            <div className="bg-surface-container-low rounded-xl p-3 border border-outline-variant/20">
              <p className="text-xs font-bold uppercase tracking-wide text-on-surface-variant mb-2">Location</p>
              <ReadOnlyMap lat={Number(ticket.latitude)} lng={Number(ticket.longitude)} height="200px" />
            </div>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 p-5 space-y-4">
          <div>
            <p className="text-xs text-on-surface-variant">Citizen</p>
            <p className="font-semibold text-on-surface">{ticket.citizen?.name}</p>
          </div>
          <div>
            <p className="text-xs text-on-surface-variant">Upvotes</p>
            <p className="font-semibold text-on-surface">{ticket.upvoteCount || 0}</p>
          </div>
          <div>
            <p className="text-xs text-on-surface-variant">Created</p>
            <p className="font-semibold text-on-surface">{formatDateTime(ticket.createdAt)}</p>
          </div>
          {ticket.assignedAt && (
            <div>
              <p className="text-xs text-on-surface-variant">Assigned</p>
              <p className="font-semibold text-on-surface">{formatDateTime(ticket.assignedAt)}</p>
            </div>
          )}
          {ticket.resolvedAt && (
            <div>
              <p className="text-xs text-on-surface-variant">Resolved</p>
              <p className="font-semibold text-on-surface">{formatDateTime(ticket.resolvedAt)}</p>
            </div>
          )}
          {ticket.reopenReason && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-[10px] font-bold uppercase text-amber-700 mb-1">Reopen Reason</p>
              <p className="text-xs text-amber-900">{ticket.reopenReason}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OfficerTicketDetail;
