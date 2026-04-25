import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../api/client';
import TicketCard from '../../components/ui/TicketCard';
import { PageLoader } from '../../components/ui/Spinner';
import {
  FileText, CheckCircle2, Clock, Award,
  ThumbsUp, Users, Filter, SortDesc, Plus, MapPin, Sparkles, TrendingUp
} from 'lucide-react';
import { Link } from 'react-router-dom';

/* ── KPI Stat Card ── */
const StatCard = ({ icon: Icon, label, value, color, bgColor, delay = 0 }) => (
  <div
    className="relative group p-5 rounded-3xl bg-white border border-outline-variant/30 overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:shadow-ambient-lg stagger-item"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-[0.03] group-hover:scale-150 transition-transform duration-700 ${color}`} />
    
    <div className="flex items-start justify-between mb-4">
      <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center text-white shadow-lg`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="text-right">
        <p className="text-[10px] font-black text-on-surface-variant/40 uppercase tracking-[0.2em]">{label}</p>
        <p className="text-2xl font-display font-bold text-on-surface leading-none mt-1">{value}</p>
      </div>
    </div>
    
    <div className="flex items-center gap-2 mt-auto">
      <div className="flex-1 h-1 bg-surface-container rounded-full overflow-hidden">
        <div className={`h-full ${color} w-3/4 opacity-40`} />
      </div>
    </div>
  </div>
);

/* ── Community Feed Card ── */
const CommunityCard = ({ ticket, onUpvote, upvoting }) => {
  const departmentName = ticket.assignedDepartment?.name || ticket.recommendedDepartment?.name || 'Municipal Service';
  return (
    <div className="group relative glass-card rounded-3xl border border-outline-variant/30 p-5 bg-white/60 hover:bg-white/90 transition-all duration-300 shadow-ambient-sm hover:shadow-ambient-lg overflow-hidden">
      <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
        <TrendingUp className="w-12 h-12 text-primary" />
      </div>

      <div className="flex items-start gap-4 mb-4">
        <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
          <Users className="w-5 h-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold text-primary bg-primary/5 px-2 py-0.5 rounded-lg border border-primary/10 uppercase tracking-wider">Public Concern</span>
            <span className="text-[10px] font-mono text-on-surface-variant/40">#{ticket.id}</span>
          </div>
          <h3 className="font-display font-bold text-on-surface text-[15px] leading-tight line-clamp-1 group-hover:text-primary transition-colors">
            {ticket.description || 'Civic issue report'}
          </h3>
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-on-surface-variant/70 mb-5">
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5" />
          <span className="truncate max-w-[120px]">City Ward {Math.floor(ticket.latitude * 10) % 50}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          <span className="truncate">{departmentName}</span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 pt-4 border-t border-outline-variant/10">
        <div className="flex -space-x-2">
          {[...Array(Math.min(3, ticket.upvoteCount || 1))].map((_, i) => (
            <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[8px] font-bold text-slate-500">
              {String.fromCharCode(65 + i)}
            </div>
          ))}
          {ticket.upvoteCount > 3 && (
            <div className="w-6 h-6 rounded-full border-2 border-white bg-primary text-white flex items-center justify-center text-[8px] font-bold">
              +{ticket.upvoteCount - 3}
            </div>
          )}
          <span className="ml-4 text-[10px] font-bold text-on-surface-variant/60 flex items-center pl-2">
            Affected Citizens
          </span>
        </div>

        <button
          onClick={() => onUpvote(ticket)}
          disabled={upvoting}
          className={[
            'h-9 px-4 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-2',
            ticket.hasUpvoted
              ? 'bg-primary text-white shadow-glow-blue/40 scale-105'
              : 'bg-surface-container hover:bg-primary/10 hover:text-primary text-on-surface-variant hover:border-primary/20 border border-transparent',
          ].join(' ')}
        >
          <ThumbsUp className={`w-3.5 h-3.5 ${ticket.hasUpvoted ? 'fill-current' : ''}`} />
          {upvoting ? '...' : ticket.hasUpvoted ? 'Confirmed' : 'Impact?'}
        </button>
      </div>
    </div>
  );
};

const CitizenDashboard = () => {
  const { user, refreshUser } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [communityFeed, setCommunityFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedLoading, setFeedLoading] = useState(true);
  const [upvoteTicketId, setUpvoteTicketId] = useState(null);

  const fetchCitizenTickets = async () => {
    const response = await apiClient.get('/tickets');
    setTickets(response.data.data.tickets);
  };

  const fetchCommunityFeed = async () => {
    const response = await apiClient.get('/tickets/community-feed?limit=6');
    setCommunityFeed(response.data.data.feed || []);
  };

  useEffect(() => {
    const init = async () => {
      try {
        await Promise.all([refreshUser(), fetchCitizenTickets(), fetchCommunityFeed()]);
      } catch (err) {
        console.error('Dashboard init error:', err);
      } finally {
        setLoading(false);
        setFeedLoading(false);
      }
    };
    init();
  }, []);

  const handleUpvoteToggle = async (ticket) => {
    setUpvoteTicketId(ticket.id);
    try {
      if (ticket.hasUpvoted) {
        await apiClient.delete(`/tickets/${ticket.id}/upvote`);
      } else {
        await apiClient.post(`/tickets/${ticket.id}/upvote`);
      }
      await fetchCommunityFeed();
    } catch (err) {
      console.error('Upvote error:', err);
    } finally {
      setUpvoteTicketId(null);
    }
  };

  const pendingCount = tickets.filter(t => ['PENDING_AI', 'PENDING_ADMIN', 'ASSIGNED'].includes(t.status)).length;
  const resolvedCount = tickets.filter(t => t.status === 'RESOLVED').length;

  if (loading) return <PageLoader message="Initializing your workspace..." />;

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-12 animate-fade-in">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-[40px] bg-slate-900 p-8 lg:p-12 text-white">
        {/* Abstract shapes */}
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-primary/20 rounded-full blur-[100px]" />
        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-secondary/10 rounded-full blur-[80px]" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs font-bold text-white/80 uppercase tracking-widest mb-6">
              <Sparkles className="w-3.5 h-3.5 text-secondary" />
              Community Guardian Program
            </div>
            <h1 className="text-4xl lg:text-5xl font-display font-bold tracking-tight mb-4 !text-white">
              Hello, {user?.name?.split(' ')[0]}
            </h1>
            <p className="text-slate-200 text-lg leading-relaxed mb-0">
              You have <span className="text-white font-bold">{pendingCount} active reports</span> being processed by municipal departments. Your civic trust score is in the <span className="text-secondary font-bold">{user?.civicTrustScore > 50 ? 'top 5%' : 'healthy range'}</span>.
            </p>
          </div>
          <Link
            to="/citizen/tickets/new"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-slate-900 rounded-2xl font-bold hover:bg-secondary hover:text-white transition-all duration-300 shadow-xl active:scale-95 group"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
            Report Issue
          </Link>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={FileText}     label="Reports" value={tickets.length} color="bg-slate-800" delay={0} />
        <StatCard icon={CheckCircle2} label="Solved"  value={resolvedCount}  color="bg-emerald-500" delay={100} />
        <StatCard icon={Clock}        label="Active"  value={pendingCount}   color="bg-amber-500" delay={200} />
        <StatCard icon={Award}        label="Trust"   value={user?.civicTrustScore || 0} color="bg-secondary" delay={300} />
      </div>

      {/* Community Pulse */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-display font-bold text-on-surface">Community Pulse</h2>
            <p className="text-on-surface-variant text-sm">Issues gaining momentum in your city</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {communityFeed.map(ticket => (
            <CommunityCard 
              key={ticket.id} 
              ticket={ticket} 
              onUpvote={handleUpvoteToggle}
              upvoting={upvoteTicketId === ticket.id}
            />
          ))}
        </div>
      </section>

      {/* My Activity */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-display font-bold text-on-surface">Recent Activity</h2>
            <p className="text-on-surface-variant text-sm">Status of your personal reports</p>
          </div>
          <div className="flex gap-2">
            <button className="p-2.5 rounded-xl bg-surface-container border border-outline-variant/10 text-on-surface-variant">
              <Filter className="w-4 h-4" />
            </button>
            <button className="p-2.5 rounded-xl bg-surface-container border border-outline-variant/10 text-on-surface-variant">
              <SortDesc className="w-4 h-4" />
            </button>
          </div>
        </div>

        {tickets.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {tickets.map(ticket => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))}
          </div>
        ) : (
          <div className="glass-card rounded-[32px] p-16 text-center border border-dashed border-outline-variant/40">
            <div className="w-20 h-20 bg-surface-container rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Plus className="w-10 h-10 text-outline-variant" />
            </div>
            <h3 className="text-xl font-display font-bold text-on-surface mb-2">No reports yet</h3>
            <p className="text-on-surface-variant max-w-sm mx-auto mb-8 text-[15px]">
              You haven't contributed any reports to Urban Resolve yet. Start by identifying an issue in your area.
            </p>
            <Link to="/citizen/tickets/new" className="btn-civic px-8 py-3 rounded-2xl font-bold">
              Begin First Report
            </Link>
          </div>
        )}
      </section>
    </div>
  );
};

export default CitizenDashboard;
