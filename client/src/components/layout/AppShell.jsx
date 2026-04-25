import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  LogOut, Menu, X, ChevronRight, Sparkles,
  Home, Ticket, Users, Building2, AlertTriangle, User, History, CheckSquare, BarChart3, MapPin, ShieldAlert
} from 'lucide-react';
import { NotificationBell } from '../shared/NotificationsDrawer';

// ─── Nav Configs ──────────────────────────────────────────
const ROLE_NAV = {
  CITIZEN: [
    { path: '/citizen',         icon: Home,          label: 'My Reports',    exact: true },
    { path: '/citizen/profile', icon: User,          label: 'Profile' },
  ],
  ADMIN: [
    { path: '/admin',              icon: Home,          label: 'Dashboard',    exact: true },
    { path: '/admin/map',          icon: MapPin,        label: 'Global Map' },
    { path: '/admin/tickets',      icon: Ticket,        label: 'Tickets' },
    { path: '/admin/escalations',  icon: AlertTriangle, label: 'Escalations' },
    { path: '/admin/departments',  icon: Building2,     label: 'Departments' },
    { path: '/admin/users',        icon: Users,         label: 'Users' },
    { path: '/admin/profile',      icon: User,          label: 'Profile' },
  ],
  DEPT_WORKER: [
    { path: '/worker',         icon: CheckSquare, label: 'My Tasks', exact: true },
    { path: '/worker/history', icon: History,     label: 'History' },
    { path: '/worker/profile', icon: User,        label: 'Profile' },
  ],
  OFFICER: [
    { path: '/officer', icon: BarChart3, label: 'Command Center', exact: true },
    { path: '/officer/interventions', icon: ShieldAlert, label: 'Interventions' },
    { path: '/officer/profile', icon: User,       label: 'Profile' },
  ],
};

const ROLE_LABELS = {
  CITIZEN:     'Citizen Portal',
  DEPT_WORKER: 'Worker Portal',
  OFFICER:     'Officer Console',
  ADMIN:       'Admin Console',
};

const ROLE_CONFIG = {
  CITIZEN:     { bg: 'bg-emerald-100 text-emerald-700',  dot: 'bg-emerald-500' },
  DEPT_WORKER: { bg: 'bg-sky-100 text-sky-700',          dot: 'bg-sky-500'     },
  OFFICER:     { bg: 'bg-violet-100 text-violet-700',    dot: 'bg-violet-500'  },
  ADMIN:       { bg: 'bg-amber-100 text-amber-700',      dot: 'bg-amber-500'   },
};

/**
 * AppShell — Unified responsive layout replacing separate TopNav/Sidebar layouts.
 */
const AppShell = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) return null;

  const navItems = ROLE_NAV[user.role] || [];
  const subtitle = ROLE_LABELS[user.role] || 'Portal';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (item) =>
    item.exact
      ? location.pathname === item.path
      : location.pathname === item.path ||
        (item.path !== '/' && location.pathname.startsWith(item.path));

  const initials = user?.name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() ?? '??';
  const roleConfig = ROLE_CONFIG[user?.role] ?? { bg: 'bg-surface-container text-on-surface-variant', dot: 'bg-outline' };

  const NavItem = ({ item }) => {
    const active = isActive(item);
    const Icon = item.icon;
    return (
      <Link
        to={item.path}
        onClick={() => setMobileOpen(false)}
        className={[
          'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group relative',
          active
            ? 'bg-gradient-to-r from-primary/10 to-secondary/10 text-primary shadow-sm'
            : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container',
        ].join(' ')}
      >
        {active && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-secondary rounded-r-full" />
        )}
        <Icon className={`w-4 h-4 flex-shrink-0 transition-all duration-200 ${active ? 'text-secondary' : 'group-hover:scale-110'}`} />
        <span className="flex-1">{item.label}</span>
        {active && <ChevronRight className="w-3.5 h-3.5 opacity-40" />}
      </Link>
    );
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="flex items-center gap-3 px-1 mb-8 mt-2">
        <div className="shrink-0 group-hover:scale-105 transition-transform duration-300">
          <img src="/logo.png" alt="Urban Resolve" className="h-10 w-auto" />
        </div>
        <div>
          <h2 className="font-display font-bold text-on-surface text-base leading-tight tracking-tight">
            Urban<span className="text-secondary">Resolve</span>
          </h2>
          <p className="text-[10px] text-on-surface-variant font-black uppercase tracking-[0.2em] mt-0.5 opacity-60">
            {subtitle}
          </p>
        </div>
      </div>

      {/* Nav section label */}
      <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/50 px-3 mb-2">
        Navigation
      </p>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5">
        {navItems.map((item) => (
          <NavItem key={item.path} item={item} />
        ))}
      </nav>

      {/* Divider */}
      <div className="mt-4 h-px bg-gradient-to-r from-transparent via-outline-variant/40 to-transparent" />

      {/* User block */}
      <div className="mt-4 space-y-2">
        <div className="px-1">
          <NotificationBell />
        </div>
        
        <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-container-low border border-outline-variant/20 shadow-inner-soft group hover:border-outline-variant/50 transition-colors">
          <div className="w-9 h-9 rounded-lg bg-white border border-outline-variant/30 flex items-center justify-center shrink-0 shadow-sm relative">
            <span className="text-xs font-bold text-secondary">{initials}</span>
            <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${roleConfig.dot}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-on-surface truncate leading-tight group-hover:text-primary transition-colors">
              {user?.name}
            </p>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-semibold truncate mt-0.5">
              {user?.role?.replace('_', ' ')}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors shrink-0"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* ── Desktop Sidebar ── */}
      <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 left-0 z-40 bg-white/80 backdrop-blur-xl border-r border-outline-variant/30 px-4 py-6 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        <SidebarContent />
      </aside>

      {/* ── Mobile Drawer ── */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-72 max-w-[calc(100%-3rem)] bg-white/95 backdrop-blur-xl border-r border-outline-variant/20 px-4 py-6 shadow-ambient-lg animate-slide-in-left flex flex-col">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-on-surface-variant hover:bg-surface-container transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* ── Main Content ── */}
      <main className="flex-1 lg:pl-64 flex flex-col min-w-0 transition-all duration-300">
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-outline-variant/30 px-4 h-16 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Urban Resolve" className="h-8 w-auto" />
            <span className="font-display font-bold text-on-surface">Urban<span className="text-secondary">Resolve</span></span>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell compact />
            <button
              onClick={() => setMobileOpen(true)}
              className="p-2 -mr-2 rounded-xl text-on-surface hover:bg-surface-container transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 relative">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AppShell;
