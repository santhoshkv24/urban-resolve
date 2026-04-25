import React, { useState, useEffect, useCallback } from 'react';
import { Search, ShieldAlert, Flag, X, Loader2, AlertTriangle, RefreshCw, MapPin, CheckCircle } from 'lucide-react';
import apiClient from '../../api/client';
import { getImageUrl } from '../../utils/imageUrl';
import { formatDate, formatDateTime } from '../../utils/dateUtils';
import StatusBadge from '../../components/ui/StatusBadge';
import SlaChip from '../../components/ui/SlaChip';

// ---- Sub-components ----

const PriorityBadge = ({ priority }) => {
  const cfg =
    priority === 'critical'
      ? 'bg-red-100 text-red-700 border-red-300'
      : 'bg-amber-100 text-amber-700 border-amber-300';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide border ${cfg}`}>
      <ShieldAlert className="w-2.5 h-2.5" />
      {priority === 'critical' ? 'Critical' : 'High Priority'}
    </span>
  );
};

const ActiveInterventionRow = ({ intervention, onRemove }) => {
  const { ticket, officer, priority, note, createdAt, id } = intervention;
  const imageUrl = getImageUrl(ticket.imageUrl);

  return (
    <div className="flex items-start gap-4 p-4 bg-surface-container-lowest rounded-2xl border border-amber-200/60 hover:border-amber-300 transition-colors">
      {/* Thumbnail */}
      <div className="w-16 h-16 rounded-xl overflow-hidden bg-surface-container shrink-0">
        {imageUrl ? (
          <img src={imageUrl} alt="Ticket" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-on-surface-variant/20">
            <MapPin className="w-5 h-5" />
          </div>
        )}
      </div>
      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <PriorityBadge priority={priority} />
          <StatusBadge status={ticket.status} size="xs" />
          <span className="text-[10px] text-on-surface-variant">Ticket #{ticket.id}</span>
        </div>
        <p className="text-sm font-semibold text-on-surface line-clamp-1 mb-1">
          {ticket.description || 'Civic Issue'}
        </p>
        <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-1.5 mb-2">
          <p className="text-xs text-amber-900 font-medium leading-relaxed">
            <Flag className="w-3 h-3 inline mr-1 text-amber-600" />
            {note}
          </p>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-on-surface-variant">
          <span>Flagged by {officer.name}</span>
          <span>·</span>
          <span>{formatDateTime(createdAt)}</span>
          {ticket.assignedDepartment && <span>· {ticket.assignedDepartment.name}</span>}
        </div>
        <div className="mt-2">
          <SlaChip ticket={ticket} />
        </div>
      </div>
      {/* Remove */}
      <button
        onClick={() => onRemove(id)}
        className="p-2 rounded-xl text-on-surface-variant hover:bg-error/10 hover:text-error transition-colors shrink-0"
        title="Remove intervention"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

// ---- Main Page ----

const InterventionQueue = () => {
  const [tickets, setTickets] = useState([]);
  const [interventions, setInterventions] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [loadingInterventions, setLoadingInterventions] = useState(true);

  const [search, setSearch] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [note, setNote] = useState('');
  const [priority, setPriority] = useState('high');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  const fetchTickets = useCallback(async () => {
    setLoadingTickets(true);
    try {
      const res = await apiClient.get('/tickets?limit=50');
      const all = res.data.data.tickets || [];
      // Only show open tickets
      setTickets(all.filter((t) => !['RESOLVED', 'REJECTED'].includes(t.status)));
    } catch {
      setTickets([]);
    } finally {
      setLoadingTickets(false);
    }
  }, []);

  const fetchInterventions = useCallback(async () => {
    setLoadingInterventions(true);
    try {
      const res = await apiClient.get('/officer/interventions');
      setInterventions(res.data.data.interventions || []);
    } catch {
      setInterventions([]);
    } finally {
      setLoadingInterventions(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
    fetchInterventions();
  }, [fetchTickets, fetchInterventions]);

  const handleFlag = async (e) => {
    e.preventDefault();
    if (!selectedTicket) return;
    if (!note.trim()) {
      setSubmitError('Please provide an intervention note.');
      return;
    }

    setSubmitting(true);
    setSubmitError('');
    setSubmitSuccess('');
    try {
      await apiClient.post('/officer/interventions', {
        ticketId: selectedTicket.id,
        note: note.trim(),
        priority,
      });
      setSubmitSuccess(`Ticket #${selectedTicket.id} flagged as ${priority === 'critical' ? 'Critical' : 'High Priority'}.`);
      setSelectedTicket(null);
      setNote('');
      setPriority('high');
      await fetchInterventions();
    } catch (err) {
      setSubmitError(err.response?.data?.error?.message || 'Failed to flag ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (id) => {
    try {
      await apiClient.delete(`/officer/interventions/${id}`);
      setInterventions((prev) => prev.filter((i) => i.id !== id));
    } catch {
      // silent
    }
  };

  const filteredTickets = tickets.filter((t) => {
    const q = search.toLowerCase();
    return (
      !q ||
      String(t.id).includes(q) ||
      t.description?.toLowerCase().includes(q) ||
      t.assignedDepartment?.name?.toLowerCase().includes(q)
    );
  });

  // IDs already flagged (active)
  const flaggedIds = new Set(interventions.map((i) => i.ticketId));

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <header>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5 text-amber-700" />
          </div>
          <h1 className="text-2xl font-extrabold font-display text-on-surface tracking-tight">
            Intervention Queue
          </h1>
        </div>
        <p className="text-on-surface-variant text-sm max-w-2xl">
          Flag high-risk tickets to surface them at the top of admin and worker queues. Provide a clear intervention note explaining the urgency.
        </p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">

        {/* Left: Ticket search + flag form */}
        <div className="xl:col-span-2 space-y-5">
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 overflow-hidden">
            <div className="px-5 py-4 border-b border-outline-variant/20">
              <h2 className="font-bold text-on-surface text-sm font-display">Flag a Ticket</h2>
              <p className="text-xs text-on-surface-variant mt-0.5">Search and select an open ticket to flag for priority intervention.</p>
            </div>
            <div className="p-5 space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/50" />
                <input
                  type="text"
                  placeholder="Search by ID, description, or department…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-surface-container-low rounded-xl border border-outline-variant/30 text-sm focus:ring-2 focus:ring-primary focus:outline-none transition-shadow"
                />
              </div>

              {/* Ticket list */}
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {loadingTickets ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                  </div>
                ) : filteredTickets.length === 0 ? (
                  <p className="text-xs text-on-surface-variant text-center py-6">No open tickets found.</p>
                ) : (
                  filteredTickets.map((ticket) => {
                    const isSelected = selectedTicket?.id === ticket.id;
                    const isAlreadyFlagged = flaggedIds.has(ticket.id);
                    return (
                      <button
                        key={ticket.id}
                        onClick={() => !isAlreadyFlagged && setSelectedTicket(isSelected ? null : ticket)}
                        disabled={isAlreadyFlagged}
                        className={`w-full text-left p-3 rounded-xl border transition-all ${
                          isAlreadyFlagged
                            ? 'border-amber-200 bg-amber-50/50 opacity-60 cursor-not-allowed'
                            : isSelected
                            ? 'border-primary bg-primary/5 ring-1 ring-primary'
                            : 'border-outline-variant/20 bg-surface-container-low hover:border-primary/30 hover:bg-surface-container'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-md">#{ticket.id}</span>
                          <StatusBadge status={ticket.status} size="xs" />
                          {isAlreadyFlagged && (
                            <span className="text-[9px] font-bold text-amber-600 uppercase">Flagged</span>
                          )}
                        </div>
                        <p className="text-xs font-medium text-on-surface line-clamp-1">{ticket.description || 'Civic Issue'}</p>
                        {ticket.assignedDepartment && (
                          <p className="text-[10px] text-on-surface-variant mt-0.5">{ticket.assignedDepartment.name}</p>
                        )}
                      </button>
                    );
                  })
                )}
              </div>

              {/* Flag form */}
              {selectedTicket && (
                <form onSubmit={handleFlag} className="pt-3 border-t border-outline-variant/20 space-y-3">
                  <p className="text-xs font-semibold text-on-surface">
                    Flagging: <span className="text-primary">Ticket #{selectedTicket.id}</span>
                  </p>

                  {/* Priority */}
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-2">Priority</label>
                    <div className="flex gap-2">
                      {[
                        { value: 'high', label: 'High', color: 'border-amber-400 bg-amber-50 text-amber-700' },
                        { value: 'critical', label: 'Critical', color: 'border-red-400 bg-red-50 text-red-700' },
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setPriority(opt.value)}
                          className={`flex-1 py-2 text-xs font-bold rounded-xl border-2 transition-all ${
                            priority === opt.value ? opt.color : 'border-outline-variant/30 text-on-surface-variant'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Note */}
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-2">Intervention Note</label>
                    <textarea
                      rows={3}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Explain why this ticket requires immediate attention…"
                      className="w-full bg-surface-container-low rounded-xl border border-outline-variant/30 p-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none transition-shadow resize-none"
                    />
                  </div>

                  {submitError && (
                    <div className="flex items-center gap-2 text-error text-xs font-semibold">
                      <AlertTriangle className="w-3.5 h-3.5" /> {submitError}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedTicket(null)}
                      className="flex-1 py-2.5 text-sm font-bold rounded-xl border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 py-2.5 text-sm font-bold rounded-xl bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Flag className="w-4 h-4" />}
                      {submitting ? 'Flagging…' : 'Flag Ticket'}
                    </button>
                  </div>
                </form>
              )}

              {submitSuccess && !selectedTicket && (
                <div className="flex items-center gap-2 text-emerald-700 text-sm font-semibold p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <CheckCircle className="w-4 h-4" /> {submitSuccess}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Active interventions list */}
        <div className="xl:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-on-surface text-sm font-display">
              Active Interventions
              <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-black border border-amber-200">
                {interventions.length}
              </span>
            </h2>
            <button
              onClick={fetchInterventions}
              className="p-2 rounded-xl text-on-surface-variant hover:bg-surface-container transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loadingInterventions ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {loadingInterventions ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          ) : interventions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center bg-surface-container-lowest rounded-2xl border border-outline-variant/20">
              <ShieldAlert className="w-10 h-10 text-on-surface-variant/20 mb-3" />
              <h3 className="font-bold text-on-surface text-sm">No Active Interventions</h3>
              <p className="text-xs text-on-surface-variant mt-1 max-w-xs">
                Flag a ticket on the left to escalate it to the top of admin and worker queues.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {interventions.map((i) => (
                <ActiveInterventionRow key={i.id} intervention={i} onRemove={handleRemove} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InterventionQueue;
