import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../../api/client';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import StatusBadge from '../../components/ui/StatusBadge';
import { PageLoader } from '../../components/ui/Spinner';
import { ArrowLeft, UserCheck, AlertTriangle, FileText, CheckCircle, MapPin, Sparkles, Map as MapIcon, Ban, ShieldAlert } from 'lucide-react';
import { getImageUrl } from '../../utils/imageUrl';
import ReadOnlyMap from '../../components/ui/ReadOnlyMap';
import { formatDate } from '../../utils/dateUtils';

const AdminTicketDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Assignment State
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedWorker, setSelectedWorker] = useState('');
  const [processing, setProcessing] = useState(false);
  
  // Escalation State
  const [adminNotes, setAdminNotes] = useState('');
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [tRes, dRes] = await Promise.all([
          apiClient.get(`/tickets/${id}`),
          apiClient.get('/admin/departments')
        ]);
        setTicket(tRes.data.data.ticket);
        setDepartments(dRes.data.data.departments);
        
        // Default to AI recommendation if Pending
        if (tRes.data.data.ticket.status === 'PENDING_ADMIN' && tRes.data.data.ticket.recommendedDepartmentId) {
          setSelectedDept(tRes.data.data.ticket.recommendedDepartmentId.toString());
        }
      } catch (err) {
        console.error('Failed to load detail', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // Load workers when department changes
  useEffect(() => {
    if (!selectedDept) {
      setWorkers([]);
      return;
    }
    const fetchWorkers = async () => {
      try {
        const res = await apiClient.get(`/admin/users?role=DEPT_WORKER&departmentId=${selectedDept}`);
        setWorkers(res.data.data.users || []);
        if (res.data.data.users.length > 0) {
          setSelectedWorker(res.data.data.users[0].id.toString());
        } else {
          setSelectedWorker('');
        }
      } catch (err) {
        console.error('Failed to fetch workers', err);
      }
    };
    fetchWorkers();
  }, [selectedDept]);

  const handleAssign = async (e) => {
    e.preventDefault();
    setActionError('');
    if (!selectedDept || !selectedWorker) {
      setActionError('Department and Worker required');
      return;
    }
    try {
      setProcessing(true);
      await apiClient.put(`/tickets/${id}/assign`, {
        departmentId: parseInt(selectedDept),
        workerId: parseInt(selectedWorker)
      });
      navigate('/admin/tickets');
    } catch (err) {
      setActionError(err.response?.data?.error?.message || 'Assignment failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleEscalation = async (actionStr) => {
    setActionError('');
    if (actionStr === 'reject' && !adminNotes.trim()) {
      setActionError('Admin notes are required when rejecting a ticket.');
      return;
    }

    try {
      setProcessing(true);
      const payload = { action: actionStr, adminResolutionNotes: adminNotes.trim() };
      if (actionStr === 'reassign') {
        if (!selectedDept || !selectedWorker) {
          setActionError('Select new Department and Worker');
          setProcessing(false);
          return;
        }
        payload.departmentId = parseInt(selectedDept);
        payload.workerId = parseInt(selectedWorker);
      }
      await apiClient.put(`/tickets/${id}/resolve-escalation`, payload);
      navigate('/admin/tickets');
    } catch (err) {
      setActionError(err.response?.data?.error?.message || 'Failed to resolve escalation');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <PageLoader message="Loading ticket details..." />;
  if (!ticket) return (
    <div className="flex flex-col items-center justify-center py-20">
      <h2 className="text-xl font-bold text-on-surface">Ticket Not Found</h2>
      <Button onClick={() => navigate('/admin/tickets')} variant="outline" className="mt-4">Back to Tickets</Button>
    </div>
  );

  return (
    <div className="p-6 lg:p-8 w-full max-w-6xl mx-auto animate-fade-up">
      <Button variant="tertiary" size="sm" className="mb-6 -ml-2" onClick={() => navigate(-1)} leftIcon={ArrowLeft}>
        Back to List
      </Button>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* ── Detail Panel ── */}
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
                <img src={getImageUrl(ticket.imageUrl)} className="w-full h-full object-cover" alt="Issue Evidence"/>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-on-surface-variant/50">
                  <MapIcon className="w-10 h-10 mb-2 opacity-50" />
                  <p className="font-medium text-sm">No Photo Provided</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-8">
              <div className="p-4 bg-surface-container-low/50 rounded-xl border border-outline-variant/20 hover:border-primary/20 transition-colors">
                <span className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Reporter</span>
                <span className="font-bold text-on-surface text-base">{ticket.citizen?.name}</span>
                <span className="block text-xs font-medium text-on-surface-variant mt-0.5">{ticket.citizen?.email}</span>
              </div>
              <div className="p-4 bg-surface-container-low/50 rounded-xl border border-outline-variant/20 hover:border-primary/20 transition-colors">
                <span className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Reported On</span>
                <span className="font-bold text-on-surface text-base">{formatDate(ticket.createdAt)}</span>
              </div>
              <div className="p-4 bg-primary/5 rounded-xl border border-primary/20 md:col-span-2 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-primary uppercase tracking-wider mb-0.5">AI Classification</span>
                  <p className="font-bold text-on-surface">
                    {ticket.recommendedDepartment?.name || 'Unable to classify automatically'}
                  </p>
                  {ticket.aiConfidenceScore != null && (
                    <p className="text-xs font-medium text-on-surface-variant mt-1">
                      Confidence Score: <span className="text-primary font-bold">{(ticket.aiConfidenceScore * 100).toFixed(0)}%</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-outline-variant/20 overflow-hidden shadow-sm">
               <div className="px-4 py-3 bg-surface-container-low/50 border-b border-outline-variant/20 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-secondary" /> 
                  <h3 className="text-sm font-bold uppercase tracking-wider text-on-surface">Location Data</h3>
               </div>
               <ReadOnlyMap lat={Number(ticket.latitude)} lng={Number(ticket.longitude)} height="200px" />
               <div className="px-4 py-3 bg-white text-xs font-medium text-on-surface-variant">
                 <span className="font-mono bg-surface-container px-2 py-1 rounded">
                   {Number(ticket.latitude).toFixed(6)}, {Number(ticket.longitude).toFixed(6)}
                 </span>
               </div>
            </div>
            
            {(ticket.status === 'RESOLVED' || ticket.resolutionImageUrl) && (
              <div className="mt-8 pt-8 border-t border-dashed border-outline-variant/30">
                <h3 className="text-lg font-display font-bold text-on-surface flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-emerald-600"/>
                  </div>
                  Resolution Proof
                </h3>
                {ticket.resolutionImageUrl && (
                  <div className="rounded-xl overflow-hidden border border-outline-variant/20 mb-4 h-64 bg-surface-container-lowest">
                    <img src={getImageUrl(ticket.resolutionImageUrl)} className="w-full h-full object-cover" alt="Resolution"/>
                  </div>
                )}
                {ticket.resolutionNotes && (
                  <div className="p-4 bg-emerald-50 text-emerald-900 text-sm rounded-xl border border-emerald-200">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 mb-1">Worker Notes</p>
                    <p className="font-medium italic">"{ticket.resolutionNotes}"</p>
                  </div>
                )}
              </div>
            )}

            {ticket.status === 'REJECTED' && (
              <div className="mt-8 pt-8 border-t border-dashed border-error/20">
                <h3 className="text-lg font-display font-bold text-error flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                    <Ban className="w-4 h-4 text-error"/>
                  </div>
                  Rejection Details
                </h3>
                <div className="p-4 bg-red-50 text-red-900 text-sm rounded-xl border border-red-200">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-red-700 mb-1">Admin Remarks</p>
                  <p className="font-medium">"{ticket.adminResolutionNotes || 'No specific reasoning provided.'}"</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Action Panel ── */}
        <div className="space-y-6">
          {ticket.status === 'PENDING_ADMIN' && (
            <div className="p-6 rounded-2xl border border-primary/20 bg-white shadow-ambient-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <UserCheck className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-xl font-bold font-display text-on-surface">Assign Ticket</h3>
              </div>

              {actionError && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold">
                  {actionError}
                </div>
              )}

              <form onSubmit={handleAssign} className="space-y-5">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-2">Department</label>
                  <select 
                    value={selectedDept} 
                    onChange={e => setSelectedDept(e.target.value)}
                    className="w-full rounded-xl border border-outline-variant/50 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-shadow"
                    required
                  >
                    <option value="">Select a department</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-2">Worker</label>
                  <select 
                    value={selectedWorker} 
                    onChange={e => setSelectedWorker(e.target.value)}
                    className="w-full rounded-xl border border-outline-variant/50 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-shadow disabled:bg-surface-container-lowest disabled:text-outline-variant"
                    required
                    disabled={!selectedDept || workers.length === 0}
                  >
                    <option value="">{workers.length === 0 && selectedDept ? 'No workers available' : 'Select worker'}</option>
                    {workers.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
                <Button type="submit" variant="civic" className="w-full mt-2" disabled={!selectedWorker || processing} loading={processing}>
                  Confirm Assignment
                </Button>
              </form>
            </div>
          )}

          {ticket.status === 'ESCALATED_TO_ADMIN' && (
            <div className="p-6 rounded-2xl border border-red-200 bg-white shadow-ambient-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="text-xl font-bold font-display text-on-surface">Escalated Review</h3>
              </div>
              
              <div className="p-4 bg-red-50 rounded-xl border border-red-100 mb-6">
                <p className="text-[10px] font-bold uppercase tracking-wider text-red-700 mb-1">Escalation Reason</p>
                <p className="text-sm text-red-900 font-medium italic">"{ticket.escalationReason}"</p>
              </div>

              {actionError && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold">
                  {actionError}
                </div>
              )}

              <div className="space-y-6">
                <Input 
                  label="Admin Notes"
                  value={adminNotes}
                  onChange={e => setAdminNotes(e.target.value)}
                  placeholder="Reasoning for rejection or re-assignment..."
                />
                
                <div className="space-y-3">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Option A: Reject</p>
                  <Button onClick={() => handleEscalation('reject')} variant="danger" className="w-full" disabled={processing} loading={processing && adminNotes}>
                    Reject as False Report
                  </Button>
                </div>

                <div className="flex items-center gap-3 py-2">
                  <div className="flex-1 border-b border-outline-variant/30" />
                  <span className="text-xs font-bold text-outline-variant uppercase">OR</span>
                  <div className="flex-1 border-b border-outline-variant/30" />
                </div>

                <div className="space-y-4">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Option B: Re-Assign</p>
                  <select 
                    value={selectedDept} 
                    onChange={e => setSelectedDept(e.target.value)} 
                    className="w-full rounded-xl border border-outline-variant/50 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-shadow"
                  >
                    <option value="">Select a department</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                  <select 
                    value={selectedWorker} 
                    onChange={e => setSelectedWorker(e.target.value)} 
                    className="w-full rounded-xl border border-outline-variant/50 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-shadow disabled:bg-surface-container-lowest"
                    disabled={!selectedDept || workers.length === 0}
                  >
                    <option value="">{workers.length === 0 && selectedDept ? 'No workers available' : 'Select worker'}</option>
                    {workers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                  <Button onClick={() => handleEscalation('reassign')} variant="primary" className="w-full" disabled={!selectedWorker || processing} loading={processing && !adminNotes}>
                    Re-Assign Ticket
                  </Button>
                </div>
              </div>
            </div>
          )}

          {ticket.status !== 'PENDING_ADMIN' && ticket.status !== 'ESCALATED_TO_ADMIN' && (
            <div className="p-8 rounded-2xl border border-outline-variant/25 bg-surface-container-lowest text-center h-full flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-surface-container-low flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-on-surface-variant/50" />
              </div>
              <h4 className="font-bold text-on-surface mb-1">No Actions Available</h4>
              <p className="text-sm text-on-surface-variant">
                This ticket is currently <span className="font-bold">{ticket.status.replace(/_/g, ' ')}</span>.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminTicketDetail;
