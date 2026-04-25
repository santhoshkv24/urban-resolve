import React, { useEffect, useState, useCallback } from 'react';
import { AlertTriangle, Siren } from 'lucide-react';
import apiClient from '../../api/client';
import { formatDateTime } from '../../utils/dateUtils';

const EmergencyBanner = () => {
  const [emergencyState, setEmergencyState] = useState(null);

  const fetchEmergencyState = useCallback(async () => {
    try {
      const res = await apiClient.get('/officer/emergency-state');
      setEmergencyState(res.data?.data?.emergencyState || null);
    } catch {
      setEmergencyState(null);
    }
  }, []);

  useEffect(() => {
    fetchEmergencyState();
    const interval = setInterval(fetchEmergencyState, 30_000);
    return () => clearInterval(interval);
  }, [fetchEmergencyState]);

  if (!emergencyState?.isActive) return null;

  return (
    <div className="relative bg-gradient-to-r from-red-700 to-red-900 text-white border-b border-red-500/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0 mt-0.5">
            <Siren className="w-4 h-4" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border bg-red-300/20 text-red-100 border-red-300/30">
                Emergency State Active
              </span>
              <span className="text-[10px] text-red-100/80">
                Target: {emergencyState.targetDepartment?.name}
              </span>
              <span className="text-[10px] text-red-100/80">
                Activated {formatDateTime(emergencyState.activatedAt)}
              </span>
            </div>

            <p className="text-sm font-semibold leading-relaxed text-white/95 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              {emergencyState.message}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmergencyBanner;
