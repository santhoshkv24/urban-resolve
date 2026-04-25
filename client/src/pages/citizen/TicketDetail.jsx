import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../../api/client';
import { getImageUrl } from '../../utils/imageUrl';
import ReadOnlyMap from '../../components/ui/ReadOnlyMap';
import { formatDate, formatDateTime } from '../../utils/dateUtils';
import Modal from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { PageLoader } from '../../components/ui/Spinner';
import StatusBadge from '../../components/ui/StatusBadge';
import { ArrowLeft, MapPin, Calendar, Sparkles, CheckCircle, Ban, AlertTriangle, Clock, Activity, FileText } from 'lucide-react';

const statusConfig = {
  'PENDING_AI': { label: 'Processing by AI', icon: Sparkles },
  'PENDING_ADMIN': { label: 'Under Review', icon: Clock },
  'ASSIGNED': { label: 'Worker Assigned', icon: Activity },
  'RESOLVED': { label: 'Resolved Successfully', icon: CheckCircle },
  'ESCALATED_TO_ADMIN': { label: 'Escalated', icon: AlertTriangle },
  'REJECTED': { label: 'Rejected', icon: Ban },
};

const TicketDetail = () => {
  const { id } = useParams();
  const toast = useToast();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  const [reopening, setReopening] = useState(false);

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const response = await apiClient.get(`/tickets/${id}`);
        setTicket(response.data.data.ticket);
      } catch (err) {
        console.error('Failed to load ticket details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTicket();
  }, [id]);

  if (loading) return <PageLoader message="Loading report details..." />;

  if (!ticket) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h2 className="text-xl font-bold text-on-surface">Report Not Found</h2>
        <Link to="/citizen" className="mt-4 px-6 py-2.5 bg-white border border-outline-variant/30 rounded-xl font-bold hover:bg-surface-container transition-colors">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const deptName = ticket.assignedDepartment?.name || ticket.recommendedDepartment?.name || 'Unassigned';
  const config = statusConfig[ticket.status] || statusConfig['PENDING_ADMIN'];
  const StatusIcon = config.icon;
  const imageUrl = getImageUrl(ticket.imageUrl);
  const resolutionImageUrl = getImageUrl(ticket.resolutionImageUrl);

  const handleReopenTicket = async () => {
    const reason = reopenReason.trim();
    if (!reason) {
      toast.warning('Please provide a reason for reopening this request.');
      return;
    }

    try {
      setReopening(true);
      await apiClient.put(`/tickets/${id}/reopen`, { reopenReason: reason });

      const refreshed = await apiClient.get(`/tickets/${id}`);
      setTicket(refreshed.data.data.ticket);

      setShowReopenModal(false);
      setReopenReason('');
      toast.success('Request reopened and moved to admin review.');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to reopen request.');
    } finally {
      setReopening(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 w-full max-w-6xl mx-auto animate-fade-up">
      {/* Breadcrumb Navigation */}
      <Link to="/citizen" className="inline-flex items-center gap-2 text-sm font-bold text-on-surface-variant hover:text-primary transition-colors mb-6 group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Dashboard
      </Link>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* ── Main Section ── */}
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-outline-variant/25 overflow-hidden shadow-ambient-sm">
            {imageUrl ? (
              <div className="h-72 relative bg-surface-container-lowest border-b border-outline-variant/20">
                <img src={imageUrl} alt="Issue submission" className="w-full h-full object-cover" />
                <div className="absolute top-4 right-4 shadow-ambient-sm">
                  <StatusBadge status={ticket.status} size="lg" />
                </div>
              </div>
            ) : (
              <div className="h-48 bg-surface-container-lowest flex flex-col items-center justify-center text-on-surface-variant/50 border-b border-outline-variant/20">
                <FileText className="w-12 h-12 mb-3 opacity-50" />
                <span className="font-bold">No original photo provided</span>
              </div>
            )}

            <div className="p-6 lg:p-8">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <span className="text-[10px] font-black text-primary bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full uppercase tracking-wider">
                  {deptName}
                </span>
                <span className="text-sm text-on-surface-variant flex items-center gap-1.5 font-bold">
                  <Calendar className="w-4 h-4 opacity-70" />
                  {formatDate(ticket.createdAt)}
                </span>
              </div>

              <h1 className="text-2xl font-bold font-display text-on-surface mb-8 leading-tight">
                {ticket.description || 'Unspecified Civic Issue'}
              </h1>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-surface-container-low/50 p-5 rounded-2xl border border-outline-variant/20">
                  <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-secondary" />
                        Incident Location
                      </h3>
                    </div>
                    <div className="flex-1 rounded-xl overflow-hidden border border-outline-variant/20 h-40 relative">
                      <ReadOnlyMap lat={Number(ticket.latitude)} lng={Number(ticket.longitude)} height="100%" />
                    </div>
                    <div className="mt-3 font-mono text-[10px] text-on-surface-variant bg-white px-2.5 py-1.5 rounded-lg border border-outline-variant/30 w-fit">
                      {Number(ticket.latitude).toFixed(4)}, {Number(ticket.longitude).toFixed(4)}
                    </div>
                  </div>
                </div>

                {ticket.aiConfidenceScore && (
                  <div className="bg-primary/5 p-5 rounded-2xl border border-primary/10 flex flex-col justify-center">
                    <h3 className="text-[10px] font-black uppercase tracking-wider text-primary mb-3 flex items-center gap-1.5">
                       <Sparkles className="w-4 h-4" />
                       AI Analysis
                    </h3>
                    <p className="text-sm font-medium text-on-surface-variant leading-relaxed">
                      Our system categorized this as <strong className="text-primary">{deptName}</strong> with a confidence score of <strong className="text-primary">{(Number(ticket.aiConfidenceScore) * 100).toFixed(1)}%</strong>. It was routed automatically to ensure a fast response.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Sidebar / Status Section ── */}
        <div className="space-y-6">
          <div className="bg-white p-6 lg:p-8 rounded-2xl shadow-ambient-sm border border-outline-variant/25">
            <h3 className="font-bold font-display text-xl mb-6 text-on-surface flex items-center gap-2">
              <StatusIcon className="w-5 h-5 text-on-surface-variant" />
              Resolution Status
            </h3>
            
            {ticket.status === 'RESOLVED' ? (
              <div className="space-y-5">
                {resolutionImageUrl && (
                  <div className="rounded-xl overflow-hidden border border-emerald-200 mb-3 bg-emerald-50">
                    <div className="text-[10px] text-center text-emerald-800 font-black uppercase py-1.5 tracking-widest border-b border-emerald-200 bg-emerald-100">
                      Resolution Proof
                    </div>
                    <img src={resolutionImageUrl} alt="Resolution" className="w-full h-40 object-cover" />
                  </div>
                )}
                
                {ticket.resolutionNotes && (
                  <div className="text-sm font-medium text-emerald-900 bg-emerald-50 p-4 rounded-xl border border-emerald-100 italic shadow-inner-soft">
                    "{ticket.resolutionNotes}"
                  </div>
                )}

                <div className="pt-5 border-t border-outline-variant/20 flex items-center justify-center gap-2 text-sm text-emerald-700 font-black uppercase tracking-wider bg-emerald-50/50 rounded-xl py-3 border border-emerald-100">
                  <CheckCircle className="w-5 h-5" />
                  Resolved Successfully
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowReopenModal(true)}
                    className="w-full px-4 py-3 text-sm font-bold rounded-xl border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 transition-colors shadow-sm flex items-center justify-center gap-2"
                  >
                    <AlertTriangle className="w-4 h-4" /> Reopen Request
                  </button>
                  <p className="text-[11px] text-center text-on-surface-variant font-medium mt-2">
                    If the issue is still not fixed, you can reopen this ticket.
                  </p>
                </div>
              </div>
            ) : ticket.status === 'REJECTED' ? (
              <div className="space-y-5">
                <div className="flex flex-col items-center justify-center p-6 text-center bg-red-50 rounded-xl border border-red-200">
                  <Ban className="w-8 h-8 text-red-600 mb-3" />
                  <h4 className="font-bold text-red-900 font-display text-lg mb-1">Report Rejected</h4>
                  <p className="text-xs text-red-800/80 font-medium leading-relaxed">This report was marked as invalid or duplicated by the administration.</p>
                </div>
                
                {ticket.adminResolutionNotes && (
                  <div className="p-4 bg-white rounded-xl border border-red-100 italic text-sm text-red-900 shadow-inner-soft">
                    <p className="text-[10px] uppercase font-black tracking-wider text-red-700 mb-2 not-italic">Admin Remarks</p>
                    "{ticket.adminResolutionNotes}"
                  </div>
                )}
              </div>
            ) : ticket.status === 'ESCALATED_TO_ADMIN' ? (
              <div className="space-y-5">
                <div className="flex flex-col items-center justify-center p-6 text-center bg-amber-50 rounded-xl border border-amber-200">
                  <AlertTriangle className="w-8 h-8 text-amber-600 mb-3" />
                  <h4 className="font-bold text-amber-900 font-display text-lg mb-1">Escalated to Admin</h4>
                  <p className="text-xs text-amber-800/80 font-medium leading-relaxed">Further investigation is required for this report before a worker can proceed.</p>
                </div>
              </div>
            ) : (
               <div className="flex flex-col items-center justify-center p-8 text-center bg-surface-container-lowest rounded-xl border border-outline-variant/30 h-48">
                  <Clock className="w-10 h-10 text-on-surface-variant/40 mb-4 animate-pulse" />
                  <p className="text-sm text-on-surface-variant font-medium leading-relaxed">
                    {ticket.status === 'ASSIGNED' 
                      ? 'The assigned department is actively working on resolving this report.'
                      : 'Your report is waiting to be processed by our administration.'}
                  </p>
               </div>
            )}
          </div>
          
          {/* Timeline / Notifications */}
          <div className="bg-white p-6 lg:p-8 rounded-2xl shadow-ambient-sm border border-outline-variant/25">
             <h3 className="font-bold font-display text-lg mb-6 text-on-surface flex items-center gap-2">
               <Activity className="w-5 h-5 text-on-surface-variant" />
               Activity Log
             </h3>
             <div className="pl-5 border-l-2 border-outline-variant/20 space-y-8">
               
               {/* History: Final Status */}
               {ticket.status === 'RESOLVED' && (
                 <div className="relative">
                   <div className="absolute -left-[27px] top-1 w-4 h-4 bg-emerald-500 rounded-full ring-4 ring-white" />
                   <p className="text-sm font-bold text-on-surface mb-0.5">Marked as Resolved</p>
                   <span className="text-xs font-medium text-on-surface-variant">{formatDateTime(ticket.resolvedAt || ticket.updatedAt)}</span>
                 </div>
               )}

               {ticket.status === 'REJECTED' && (
                 <div className="relative">
                   <div className="absolute -left-[27px] top-1 w-4 h-4 bg-red-500 rounded-full ring-4 ring-white" />
                   <p className="text-sm font-bold text-on-surface mb-0.5">Case Rejected</p>
                   <span className="text-xs font-medium text-on-surface-variant">{formatDateTime(ticket.resolvedAt || ticket.updatedAt)}</span>
                 </div>
               )}

               {/* History: Escalation */}
               {ticket.escalationReason && (
                  <div className="relative">
                    <div className="absolute -left-[27px] top-1 w-4 h-4 bg-amber-500 rounded-full ring-4 ring-white" />
                    <p className="text-sm font-bold text-on-surface mb-0.5">Escalated for Review</p>
                    <span className="text-xs font-medium text-on-surface-variant">{formatDateTime(ticket.updatedAt)}</span>
                  </div>
               )}

               {/* History: Assignment */}
               {ticket.assignedAt && (
                 <div className="relative">
                   <div className="absolute -left-[27px] top-1 w-4 h-4 bg-sky-500 rounded-full ring-4 ring-white" />
                   <p className="text-sm font-bold text-on-surface mb-0.5">Assigned to Field Worker</p>
                   <span className="text-xs font-medium text-on-surface-variant">{formatDateTime(ticket.assignedAt)}</span>
                 </div>
               )}

               {/* History: Created */}
               <div className="relative">
                 <div className="absolute -left-[27px] top-1 w-4 h-4 bg-primary rounded-full ring-4 ring-white" />
                 <p className="text-sm font-bold text-on-surface mb-0.5">Report Created</p>
                 <span className="text-xs font-medium text-on-surface-variant">{formatDateTime(ticket.createdAt)}</span>
               </div>
               
             </div>
          </div>
        </div>

      </div>

      <Modal
        open={showReopenModal}
        onClose={() => {
          if (!reopening) {
            setShowReopenModal(false);
            setReopenReason('');
          }
        }}
        title="Reopen Request"
        confirmLabel="Reopen Request"
        onConfirm={handleReopenTicket}
        loading={reopening}
      >
        <div className="space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-sm font-medium flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600" />
            <p>This will move your ticket back to the admin escalation queue for investigation and reassignment.</p>
          </div>
          
          <div>
            <label htmlFor="reopen-reason" className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-2">
              Why is this still unresolved?
            </label>
            <textarea
              id="reopen-reason"
              value={reopenReason}
              onChange={(e) => setReopenReason(e.target.value)}
              rows={4}
              placeholder="Describe what is still pending or incorrect..."
              className="w-full px-4 py-3 rounded-xl bg-white border border-outline-variant/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-shadow resize-none"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TicketDetail;
