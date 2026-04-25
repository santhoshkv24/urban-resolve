import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Bell, X, CheckCheck, Loader2, Mail, ExternalLink, RefreshCw } from 'lucide-react';
import apiClient from '../../api/client';

/**
 * NotificationsDrawer — Real notification center wired to the DB.
 * Fetches notifications for the authenticated user, shows unread count,
 * and supports per-notification and bulk "mark as read".
 */
const NotificationsDrawer = ({ open, onClose }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const ticketPath = (() => {
    switch (user?.role) {
      case 'CITIZEN': return '/citizen/tickets';
      case 'ADMIN': return '/admin/tickets';
      case 'DEPT_WORKER': return '/worker/tickets';
      case 'OFFICER': return '/officer/tickets';
      default: return '/';
    }
  })();

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/notifications?limit=30');
      setNotifications(res.data.data.notifications || []);
      setUnreadCount(res.data.data.unreadCount || 0);
    } catch (err) {
      setError('Could not load notifications.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch when drawer opens
  useEffect(() => {
    if (open) fetchNotifications();
  }, [open, fetchNotifications]);

  const handleMarkRead = async (id) => {
    try {
      await apiClient.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // silent fail — UI is optimistic
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await apiClient.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // silent fail
    }
  };

  const handleNotifClick = (notif) => {
    if (!notif.isRead) handleMarkRead(notif.id);
    onClose();

    if (notif.deepLink) {
      navigate(notif.deepLink);
      return;
    }

    if (notif.ticket?.id) {
      navigate(`${ticketPath}/${notif.ticket.id}`);
    }
  };

  const timeAgo = (dateStr) => {
    const diff = (Date.now() - new Date(dateStr)) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  // Status-to-color mapping
  const statusColor = (status) => {
    const m = { SENT: 'text-emerald-600', FAILED: 'text-rose-600', MOCKED: 'text-zinc-400' };
    return m[status] || 'text-zinc-400';
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[2px]" onClick={onClose} />

      {/* Drawer panel */}
      <div className="fixed top-0 right-0 h-full z-50 w-full max-w-md flex flex-col bg-white shadow-2xl border-l border-outline-variant/20 animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/20 bg-surface-container-low">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Bell className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-on-surface text-sm font-display">Notifications</h2>
              {unreadCount > 0 && (
                <p className="text-[10px] text-primary font-semibold">{unreadCount} unread</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchNotifications}
              className="p-2 rounded-xl text-on-surface-variant hover:bg-surface-container transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-on-surface-variant hover:bg-surface-container transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mark all read bar */}
        {unreadCount > 0 && (
          <div className="px-5 py-2 bg-primary/5 border-b border-primary/10 flex items-center justify-between">
            <span className="text-xs text-primary font-medium">{unreadCount} unread message{unreadCount > 1 ? 's' : ''}</span>
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary-hover transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all read
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading && notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-sm text-on-surface-variant">Loading notifications…</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center">
              <Mail className="w-10 h-10 text-on-surface-variant/30" />
              <p className="text-sm text-error font-semibold">{error}</p>
              <button onClick={fetchNotifications} className="text-xs text-primary font-bold hover:underline">
                Try again
              </button>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mb-2">
                <Bell className="w-7 h-7 text-on-surface-variant/30" />
              </div>
              <h3 className="font-bold text-on-surface text-sm">All caught up!</h3>
              <p className="text-xs text-on-surface-variant max-w-xs">
                You have no notifications yet. Updates on your tickets will appear here.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-outline-variant/10">
              {notifications.map((notif) => (
                <li
                  key={notif.id}
                  className={`group relative flex gap-3 px-5 py-4 cursor-pointer transition-colors hover:bg-surface-container-low ${
                    !notif.isRead ? 'bg-primary/3' : ''
                  }`}
                  onClick={() => handleNotifClick(notif)}
                >
                  {/* Unread dot */}
                  {!notif.isRead && (
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary" />
                  )}

                  {/* Icon */}
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      notif.isRead ? 'bg-surface-container' : 'bg-primary/10'
                    }`}
                  >
                    <Mail className={`w-4 h-4 ${notif.isRead ? 'text-on-surface-variant/50' : 'text-primary'}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold leading-snug mb-0.5 ${notif.isRead ? 'text-on-surface-variant' : 'text-on-surface'}`}>
                      {notif.subject}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-on-surface-variant/60">{timeAgo(notif.sentAt)}</span>
                      {notif.ticket && (
                        <>
                          <span className="w-0.5 h-0.5 rounded-full bg-on-surface-variant/30" />
                          <span className="text-[10px] text-primary font-semibold flex items-center gap-0.5">
                            Ticket #{notif.ticket.id} <ExternalLink className="w-2.5 h-2.5" />
                          </span>
                        </>
                      )}
                      <span className={`ml-auto text-[9px] uppercase font-bold tracking-wide ${statusColor(notif.status)}`}>
                        {notif.status}
                      </span>
                    </div>
                  </div>

                  {/* Mark as read on hover */}
                  {!notif.isRead && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleMarkRead(notif.id); }}
                      className="opacity-0 group-hover:opacity-100 shrink-0 p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-all"
                      title="Mark as read"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-outline-variant/20 bg-surface-container-low">
          <p className="text-[10px] text-center text-on-surface-variant/60">
            Notifications are generated by ticket status changes and system events.
          </p>
        </div>
      </div>
    </>
  );
};

export { NotificationsDrawer };

/**
 * NotificationBell — Bell icon button that shows the unread count badge.
 * Manages the drawer open/close state itself for easy drop-in use.
 */
export const NotificationBell = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await apiClient.get('/notifications?limit=1');
      setUnreadCount(res.data.data.unreadCount || 0);
    } catch {
      // silent — don't break layout on network failure
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    // Poll every 60s for new notifications
    const interval = setInterval(fetchUnreadCount, 60_000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  const handleClose = () => {
    setDrawerOpen(false);
    // Refresh count after closing (user may have read some)
    fetchUnreadCount();
  };

  return (
    <>
      <button
        id="notifications-bell-btn"
        onClick={() => setDrawerOpen(true)}
        className="relative p-2 rounded-xl text-on-surface-variant hover:bg-surface-container transition-colors"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary text-white text-[9px] font-black flex items-center justify-center leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      <NotificationsDrawer open={drawerOpen} onClose={handleClose} />
    </>
  );
};

export default NotificationsDrawer;
