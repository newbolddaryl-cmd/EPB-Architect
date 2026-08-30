import React, { useState } from 'react';
import { ShieldAlert, Info, AlertTriangle, X } from 'lucide-react';

interface SecurityBannerProps {
  detectedWarning?: string;
  onDismissWarning?: () => void;
}

export const SecurityBanner: React.FC<SecurityBannerProps> = ({
  detectedWarning,
  onDismissWarning
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div id="security-banner-container" className="w-full space-y-2">
      {/* Primary Mandated Banner */}
      <div
        id="opsec-compliance-banner"
        className="border theme-border theme-bg-card backdrop-blur-md rounded-xl p-3 sm:p-4 text-xs sm:text-sm theme-text-main shadow-sm flex items-start justify-between gap-3"
      >
        <div className="flex items-start gap-2.5">
          <ShieldAlert className="w-5 h-5 text-[var(--theme-accent)] shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-military font-bold tracking-wider text-[var(--theme-accent)] uppercase text-[11px] sm:text-xs">
                OPSEC & Privacy Mandatory Notice
              </span>
              <span className="theme-badge-accent text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold">
                DEVICE-LOCAL ONLY
              </span>
            </div>
            <p className="theme-text-main leading-relaxed">
              Do not enter classified information, CUI, SSN, DOD ID, PHI, or personal financial data. Sanitize notes first.
            </p>
            {!isCollapsed && (
              <p className="theme-text-muted text-[11px] pt-1">
                Drafts are preserved strictly in your browser storage on this device. No login credentials or remote user profiles required.
              </p>
            )}
          </div>
        </div>
        <button
          id="toggle-banner-details-btn"
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="theme-text-muted hover:theme-text-main p-1 rounded transition-colors text-xs font-mono shrink-0 cursor-pointer"
          title={isCollapsed ? "Show details" : "Collapse details"}
        >
          {isCollapsed ? <Info className="w-4 h-4" /> : <span className="text-[11px]">Hide</span>}
        </button>
      </div>

      {/* Dynamic Sensitive Data Warning Alert */}
      {detectedWarning && (
        <div
          id="sensitive-data-detected-alert"
          role="alert"
          className="border-2 border-red-500 bg-red-950/70 dark:bg-red-950/80 text-red-200 rounded-xl p-3 sm:p-4 text-xs sm:text-sm shadow-lg flex items-start justify-between gap-3 animate-pulse"
        >
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-military font-bold uppercase tracking-wider text-red-400">
                Action Blocked: Potential Sensitive Data Detected
              </p>
              <p className="text-red-200 leading-relaxed font-mono text-[12px]">
                {detectedWarning}
              </p>
              <p className="text-red-300 text-[11px]">
                For security compliance, remove any PII, SSN, DoD IDs, PHI, or classification markings before proceeding.
              </p>
            </div>
          </div>
          {onDismissWarning && (
            <button
              id="dismiss-sensitive-warning-btn"
              type="button"
              onClick={onDismissWarning}
              className="text-red-400 hover:text-red-200 p-1 rounded transition-colors shrink-0 cursor-pointer"
              aria-label="Dismiss warning"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
