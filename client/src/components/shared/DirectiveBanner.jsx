import React, { useState, useEffect, useCallback } from 'react';
import { Megaphone, X, Loader2, ChevronDown, ChevronUp, AlertTriangle, Clock } from 'lucide-react';
import apiClient from '../../api/client';
import { formatDateTime } from '../../utils/dateUtils';

const PRIORITY_CONFIG = {
  normal: {
    bg: 'from-sky-600 to-blue-700',
    badge: 'bg-sky-400/20 text-sky-100 border-sky-400/30',
    label: 'Directive',
  },
  urgent: {
    bg: 'from-amber-500 to-orange-600',
    badge: 'bg-amber-300/20 text-amber-100 border-amber-300/30',
    label: 'Urgent',
  },
  critical: {
    bg: 'from-rose-600 to-red-700',
    badge: 'bg-rose-300/20 text-rose-100 border-rose-300/30',
    label: 'Critical',
  },
};

/**
 * DirectiveBanner — Displays the latest active officer directive.
 * Fetches from /api/directives/active and shows a full-width gradient banner.
 * Dismissible per-session using localStorage.
 */
const DirectiveBanner = () => {
  const [directive, setDirective] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const fetchDirective = useCallback(async () => {
    try {
      const res = await apiClient.get('/directives/active');
      const d = res.data.data.directive;
      if (d) {
        // Check session-dismissed list
        const dismissedIds = JSON.parse(sessionStorage.getItem('dismissedDirectives') || '[]');
        if (!dismissedIds.includes(d.id)) {
          setDirective(d);
        }
      }
    } catch {
      // silent — banner is non-critical
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDirective();
  }, [fetchDirective]);

  const handleDismiss = () => {
    if (directive) {
      const dismissedIds = JSON.parse(sessionStorage.getItem('dismissedDirectives') || '[]');
      dismissedIds.push(directive.id);
      sessionStorage.setItem('dismissedDirectives', JSON.stringify(dismissedIds));
    }
    setDismissed(true);
  };

  if (loading || dismissed || !directive) return null;

  const cfg = PRIORITY_CONFIG[directive.priority] || PRIORITY_CONFIG.normal;
  const isLong = directive.message.length > 100;

  return (
    <div className={`relative bg-gradient-to-r ${cfg.bg} text-white ${directive.priority === 'critical' ? 'animate-pulse-slow' : ''}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0 mt-0.5">
            {directive.priority === 'critical' ? (
              <AlertTriangle className="w-4 h-4" />
            ) : (
              <Megaphone className="w-4 h-4" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${cfg.badge}`}>
                {cfg.label}
              </span>
              <span className="text-[10px] text-white/70">
                by {directive.author?.name} · {formatDateTime(directive.createdAt)}
              </span>
              {directive.expiresAt && (
                <span className="text-[10px] text-white/70 flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  Expires {formatDateTime(directive.expiresAt)}
                </span>
              )}
            </div>
            <p className={`text-sm font-medium leading-relaxed text-white/95 ${isLong && !expanded ? 'line-clamp-1' : ''}`}>
              {directive.message}
            </p>
            {isLong && (
              <button
                onClick={() => setExpanded((e) => !e)}
                className="flex items-center gap-1 text-[10px] text-white/70 hover:text-white font-semibold mt-1 transition-colors"
              >
                {expanded ? <><ChevronUp className="w-3 h-3" />Show less</> : <><ChevronDown className="w-3 h-3" />Read more</>}
              </button>
            )}
          </div>

          {/* Dismiss */}
          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors shrink-0"
            title="Dismiss for this session"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DirectiveBanner;
