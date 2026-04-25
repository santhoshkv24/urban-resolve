import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../../api/client';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import StatusBadge from '../../components/ui/StatusBadge';
import { useToast } from '../../components/ui/Toast';
import { PageLoader } from '../../components/ui/Spinner';
import { Camera, CheckCircle, AlertTriangle, ArrowLeft, Lock, Sparkles, MapPin, ShieldAlert } from 'lucide-react';
import { getImageUrl } from '../../utils/imageUrl';
import ReadOnlyMap from '../../components/ui/ReadOnlyMap';

// Terminal statuses where no worker actions are allowed
const TERMINAL_STATUSES = ['RESOLVED', 'REJECTED', 'ESCALATED_TO_ADMIN'];

const WorkerExecution = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState('solve'); // solve | flag

  // Resolution State
  const [file, setFile] = useState(null);
  const [notes, setNotes] = useState('');
  const [escalationReason, setEscalationReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const response = await apiClient.get(`/tickets/${id}`);
        setTicket(response.data.data.ticket);
      } catch (err) {
        console.error('Failed to fetch ticket:', err);
        toast.error('Could not load ticket details.');
      } finally {
        setLoading(false);
      }
    };
    fetchTicket();
  }, [id]);

  const handleResolve = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.warning('Resolution proof photo is required.');
      return;
    }

    setProcessing(true);
    const formData = new FormData();
    formData.append('resolutionImage', file);
    if (notes) formData.append('resolutionNotes', notes);

    try {
      await apiClient.put(`/tickets/${id}/resolve`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Ticket resolved successfully!');
      navigate('/worker');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to resolve ticket.');
    } finally {
      setProcessing(false);
    }
  };

  const handleFlag = async (e) => {
    e.preventDefault();
    if (!escalationReason.trim()) {
      toast.warning('Escalation reason is required.');
      return;
    }

    setProcessing(true);
    try {
      await apiClient.put(`/tickets/${id}/flag-false`, { escalationReason });
      toast.success('Ticket escalated to admin.');
      navigate('/worker');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to escalate ticket.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <PageLoader message="Loading ticket details..." />;

  if (!ticket) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h2 className="text-xl font-bold text-on-surface">Ticket Not Found</h2>
        <Button onClick={() => navigate('/worker')} variant="outline" className="mt-4">Back to Dashboard</Button>
      </div>
    );
  }

  const isTerminal = TERMINAL_STATUSES.includes(ticket.status);
  const resolutionImageUrl = getImageUrl(ticket.resolutionImageUrl);

  return (
    <div className="p-6 lg:p-8 w-full max-w-6xl mx-auto animate-fade-up">
      <Button variant="tertiary" size="sm" className="mb-6 -ml-2" onClick={() => navigate(-1)} leftIcon={ArrowLeft}>
        Back to Dashboard
      </Button>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* ── LEFT: Ticket Info ── */}
        <div className="xl:col-span-2 space-y-6">
          {ticket.interventions?.length > 0 && (
            <div className="p-5 rounded-2xl border-2 border-amber-300 bg-amber-50 shadow-sm animate-in slide-in-from-top-4 duration-300">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-amber-200 flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5 text-amber-800" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-amber-900 uppercase tracking-widest">Officer Intervention Active</h3>
                  <p className="text-xs text-amber-700 font-bold">Flagged by {ticket.interventions[0].officer?.name}</p>
                </div>
              </div>
              <div className="p-4 bg-white/60 rounded-xl border border-amber-200/50">
                <p className="text-sm text-amber-900 font-bold leading-relaxed italic">
                  "{ticket.interventions[0].note}"
                </p>
              </div>
            </div>
          )}

          <div className="p-6 lg:p-8 rounded-2xl border border-outline-variant/25 bg-white shadow-ambient-sm">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-6 pb-6 border-b border-outline-variant/20">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-[10px] px-2.5 py-1 bg-surface-container text-on-surface font-black rounded-full uppercase tracking-widest border border-outline-variant/20">
                    TICKET #{ticket.id}
                  </span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                    ticket.priority === 'CRITICAL' ? 'bg-red-50 text-red-700 border-red-200' :
                    ticket.priority === 'HIGH' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                    'bg-sky-50 text-sky-700 border-sky-200'
                  }`}>
                    {ticket.priority} Priority
                  </span>
                </div>
                <h2 className="text-2xl font-display font-bold text-on-surface leading-tight mt-1">
                  {ticket.description || 'Unspecified Civic Issue'}
                </h2>
              </div>
              <StatusBadge status={ticket.status} size="md" />
            </div>

            <div className="w-full h-72 rounded-2xl overflow-hidden mb-8 border border-outline-variant/20 shadow-inner bg-surface-container-lowest">
              {ticket.imageUrl ? (
                <img src={getImageUrl(ticket.imageUrl)} className="w-full h-full object-cover" alt="Issue Evidence" />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-on-surface-variant/50">
                  <Camera className="w-10 h-10 mb-2 opacity-50" />
                  <p className="font-medium text-sm">No Photo Provided</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-8">
              <div className="p-4 bg-surface-container-low/50 rounded-xl border border-outline-variant/20">
                <span className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">Reported By</span>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {ticket.citizen?.name?.charAt(0) || 'C'}
                  </div>
                  <div>
                    <span className="font-bold text-on-surface block">{ticket.citizen?.name}</span>
                    <span className="text-xs font-medium text-on-surface-variant">{ticket.citizen?.email}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-surface-container-low/50 rounded-xl border border-outline-variant/20 flex flex-col justify-center">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Location Data</span>
                  <span className="font-mono text-[10px] text-on-surface-variant bg-surface-container px-2 py-0.5 rounded">
                    {Number(ticket.latitude).toFixed(4)}, {Number(ticket.longitude).toFixed(4)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-secondary font-bold text-sm">
                  <MapPin className="w-4 h-4" /> View Map Below
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-outline-variant/20 overflow-hidden shadow-sm h-48">
               <ReadOnlyMap lat={Number(ticket.latitude)} lng={Number(ticket.longitude)} height="100%" />
            </div>
          </div>
        </div>

        {/* ── RIGHT: Action Panel or Terminal State Card ── */}
        <div className="space-y-6">
          {isTerminal ? (
            /* ── Read-only view for terminal statuses ── */
            <div className="p-6 rounded-2xl border border-outline-variant/25 bg-white shadow-ambient-sm relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-1 h-full ${ticket.status === 'RESOLVED' ? 'bg-emerald-500' : 'bg-red-500'}`} />
              
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${ticket.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                  <Lock className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold font-display text-on-surface">Task Completed</h3>
              </div>

              <div className="p-4 bg-surface-container-low/50 rounded-xl mb-6 border border-outline-variant/20">
                <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-2.5">Final Status</p>
                <StatusBadge status={ticket.status} size="md" />
                <p className="text-sm font-medium text-on-surface-variant mt-3 leading-relaxed">
                  {ticket.status === 'RESOLVED' && 'This ticket has been resolved. No further action is needed.'}
                  {ticket.status === 'REJECTED' && 'This ticket was rejected by the admin. No further worker action is allowed.'}
                  {ticket.status === 'ESCALATED_TO_ADMIN' && 'This ticket has been escalated and is now under admin review.'}
                </p>
              </div>

              {/* Resolution proof if resolved */}
              {ticket.status === 'RESOLVED' && resolutionImageUrl && (
                <div className="mb-6">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-2">Resolution Proof</p>
                  <div className="rounded-xl overflow-hidden h-40 border border-outline-variant/20">
                    <img src={resolutionImageUrl} className="w-full h-full object-cover" alt="Resolution" />
                  </div>
                </div>
              )}

              {ticket.resolutionNotes && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                   <p className="text-[10px] font-bold uppercase text-emerald-700 mb-1">Your Resolution Notes</p>
                   <p className="text-sm text-emerald-900 font-medium italic">"{ticket.resolutionNotes}"</p>
                </div>
              )}

              {ticket.escalationReason && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-[10px] font-bold uppercase text-amber-700 mb-1">Your Escalation Note</p>
                  <p className="text-sm text-amber-900 font-medium italic">"{ticket.escalationReason}"</p>
                </div>
              )}

              {ticket.adminResolutionNotes && (
                <div className="mt-4 p-4 bg-surface border border-outline-variant/30 rounded-xl shadow-inner-soft">
                  <p className="text-[10px] font-bold uppercase text-on-surface-variant mb-1">Admin Remarks</p>
                  <p className="text-sm text-on-surface font-medium italic">"{ticket.adminResolutionNotes}"</p>
                </div>
              )}
            </div>
          ) : ticket.status !== 'ASSIGNED' ? (
            /* ── Not yet assigned to this worker ── */
            <div className="p-8 rounded-2xl border border-outline-variant/25 bg-surface-container-lowest text-center h-full flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-surface-container-low flex items-center justify-center mb-4">
                <Lock className="w-8 h-8 text-on-surface-variant/40" />
              </div>
              <h4 className="font-bold text-on-surface mb-1 text-lg font-display">Not Assigned</h4>
              <p className="text-sm text-on-surface-variant">
                This ticket is in <strong>{ticket.status.replace(/_/g, ' ')}</strong> status. Only tickets explicitly assigned to you can be executed.
              </p>
            </div>
          ) : (
            /* ── Active action panel (ASSIGNED status only) ── */
            <div className="p-6 rounded-2xl border border-primary/20 bg-white shadow-ambient-sm">
              <h3 className="text-xl font-bold font-display text-on-surface mb-6">Action Required</h3>

              {/* Tab switcher */}
              <div className="flex p-1 mb-6 bg-surface-container-low rounded-xl border border-outline-variant/20">
                <button
                  onClick={() => setAction('solve')}
                  className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-bold transition-all duration-200 ${
                    action === 'solve'
                      ? 'bg-white shadow-sm text-primary border border-outline-variant/10'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                  }`}
                >
                  Resolve Issue
                </button>
                <button
                  onClick={() => setAction('flag')}
                  className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-bold transition-all duration-200 ${
                    action === 'flag'
                      ? 'bg-red-50 shadow-sm text-red-600 border border-red-100'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                  }`}
                >
                  Flag / Escalate
                </button>
              </div>

              {action === 'solve' ? (
                <form onSubmit={handleResolve} className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                  {/* Photo upload */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-2">Resolution Proof (Required)</label>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className={`relative h-40 rounded-xl border-2 border-dashed cursor-pointer overflow-hidden transition-all duration-200 flex flex-col items-center justify-center group ${
                        file ? 'border-primary/50 bg-primary/5' : 'border-outline-variant/50 hover:border-primary/50 hover:bg-primary/5'
                      }`}
                    >
                      {file ? (
                        <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" alt="Preview" />
                      ) : (
                        <div className="flex flex-col items-center text-center px-4">
                          <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                            <Camera className="w-5 h-5 text-on-surface-variant" />
                          </div>
                          <span className="text-sm font-bold text-on-surface">Upload "After" Photo</span>
                          <span className="text-xs font-medium text-on-surface-variant mt-1">Click to browse or take a photo</span>
                        </div>
                      )}
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => setFile(e.target.files[0])}
                      />
                    </div>
                  </div>

                  <Input
                    label="Resolution Notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g., Cleared debris and sealed the pipe."
                  />

                  <Button type="submit" variant="primary" loading={processing} className="w-full" disabled={!file}>
                   Mark as Resolved
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleFlag} className="space-y-5 animate-in fade-in slide-in-from-left-4 duration-300">
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm font-medium text-red-900 leading-relaxed flex items-start gap-3 shadow-inner-soft">
                    <AlertTriangle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
                    <p>If this report is invalid, duplicated, or a prank — provide your reasoning below. An admin will review this escalation.</p>
                  </div>

                  <Input
                    label="Escalation Reason"
                    value={escalationReason}
                    onChange={(e) => setEscalationReason(e.target.value)}
                    placeholder="e.g., Visited the location — no issue found."
                    required
                  />

                  <Button type="submit" variant="danger" loading={processing} className="w-full py-3" disabled={!escalationReason.trim()}>
                    Escalate to Admin
                  </Button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkerExecution;
