import React from 'react';
import { 
  ShieldAlert, 
  Flame, 
  CheckCircle2, 
  AlertTriangle, 
  Crosshair, 
  TrendingUp, 
  UserCheck, 
  Award,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { MurderboardReview } from '../types';

interface MurderboardViewProps {
  murderboard?: MurderboardReview;
  murderboardRisks?: string[];
  onTriggerMurderboard?: () => void;
  isLoading?: boolean;
}

export const MurderboardView: React.FC<MurderboardViewProps> = ({
  murderboard,
  murderboardRisks,
  onTriggerMurderboard,
  isLoading = false
}) => {
  if (!murderboard) {
    return (
      <div id="murderboard-placeholder" className="rounded-xl border theme-border theme-bg-card p-6 text-center space-y-4 shadow-sm">
        <div className="w-12 h-12 rounded-full theme-badge-accent flex items-center justify-center mx-auto text-[var(--theme-accent)]">
          <Crosshair className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="font-military font-bold text-lg theme-text-main uppercase tracking-wide">
            4-Chief Murderboard Review
          </h3>
          <p className="text-xs sm:text-sm theme-text-muted max-w-md mx-auto leading-relaxed">
            Run a simulation with 4 Chief Master Sergeants (Functional, Operations, Personnel, and Cynical MAJCOM) to stress-test claims before submission.
          </p>
        </div>

        {murderboardRisks && murderboardRisks.length > 0 && (
          <div className="max-w-lg mx-auto text-left theme-bg-subtle p-4 rounded-lg border theme-border-subtle space-y-2">
            <span className="text-xs font-mono font-bold text-[var(--theme-accent)] uppercase flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" /> Initial Board Vulnerabilities
            </span>
            <ul className="text-xs font-mono theme-text-muted space-y-1 list-disc list-inside">
              {murderboardRisks.map((risk, idx) => (
                <li key={idx}>{risk}</li>
              ))}
            </ul>
          </div>
        )}

        {onTriggerMurderboard && (
          <button
            id="run-full-murderboard-btn"
            type="button"
            onClick={onTriggerMurderboard}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl theme-btn-primary font-military font-bold text-xs sm:text-sm tracking-wider uppercase transition-all shadow-md cursor-pointer hover:opacity-95"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Simulating 4-Chief Murderboard...</span>
              </>
            ) : (
              <>
                <Flame className="w-4 h-4" />
                <span>Execute 4-Chief Murderboard</span>
              </>
            )}
          </button>
        )}
      </div>
    );
  }

  const score = murderboard.verdictScore || 7.5;
  const scorePercent = Math.min(100, Math.max(0, (score / 10) * 100));

  return (
    <div id="murderboard-view-container" className="space-y-6">
      {/* Top Banner & Score Card */}
      <div id="murderboard-verdict-card" className="rounded-xl border theme-border theme-bg-card p-4 sm:p-6 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b theme-border-subtle pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded theme-badge-accent">
                <Flame className="w-4 h-4 text-[var(--theme-accent)]" />
              </span>
              <h2 className="font-military font-bold text-base sm:text-lg theme-text-main uppercase tracking-wider">
                4-Chief Murderboard Verdict
              </h2>
            </div>
            <p className="text-xs theme-text-muted font-mono">
              Simulated senior board review across Functional, Operations, Personnel & MAJCOM evaluators.
            </p>
          </div>

          {/* Verdict Score Badge */}
          <div className="flex items-center gap-3 theme-bg-subtle px-4 py-3 rounded-xl border theme-border-subtle shrink-0">
            <div className="text-right">
              <div className="text-[10px] font-mono uppercase theme-text-subtle">Package Score</div>
              <div className="font-military font-bold text-2xl text-[var(--theme-accent)] leading-none">
                {score.toFixed(1)} <span className="text-xs theme-text-subtle font-normal">/ 10</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-full border-4 theme-border flex items-center justify-center font-mono font-bold text-xs theme-text-main">
              {Math.round(scorePercent)}%
            </div>
          </div>
        </div>

        {/* Verdict Summary */}
        <div className="p-3.5 rounded-lg theme-bg-subtle border theme-border-subtle text-xs sm:text-sm font-mono theme-text-main leading-relaxed">
          {murderboard.verdictSummary}
        </div>

        {/* Path to 10/10 Checklist */}
        {murderboard.pathToTen && murderboard.pathToTen.length > 0 && (
          <div id="path-to-ten-checklist" className="space-y-2 pt-1">
            <div className="flex items-center gap-1.5 text-xs font-military font-bold tracking-wider text-emerald-600 dark:text-emerald-400 uppercase">
              <TrendingUp className="w-4 h-4" />
              <span>Path to 10/10 (High-Impact Upgrades)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {murderboard.pathToTen.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 p-2.5 rounded-lg theme-bg-subtle border border-emerald-500/20 text-xs font-mono theme-text-main"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="leading-snug">{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* The 4 Chiefs Cards Grid */}
      <div id="four-chiefs-grid" className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. Functional Chief */}
        <ChiefCard
          id="chief-card-functional"
          title="Functional Chief"
          badge="Grade & AFSC Caliber"
          icon={<UserCheck className="w-4 h-4 text-blue-500" />}
          item={murderboard.functionalChief}
          borderColor="theme-border"
          accentColor="text-blue-500"
        />

        {/* 2. Operations Chief */}
        <ChiefCard
          id="chief-card-operations"
          title="Operations Chief"
          badge="Mission & Readiness Impact"
          icon={<Crosshair className="w-4 h-4 text-emerald-500" />}
          item={murderboard.operationsChief}
          borderColor="theme-border"
          accentColor="text-emerald-500"
        />

        {/* 3. Personnel Chief */}
        <ChiefCard
          id="chief-card-personnel"
          title="Personnel Chief"
          badge="Promotion & Leadership Scope"
          icon={<Award className="w-4 h-4 text-amber-500" />}
          item={murderboard.personnelChief}
          borderColor="theme-border"
          accentColor="text-amber-500"
        />

        {/* 4. Cynical MAJCOM Chief */}
        <ChiefCard
          id="chief-card-majcom"
          title="Cynical MAJCOM Chief"
          badge="Attack Vectors & Fluff Slayer"
          icon={<ShieldAlert className="w-4 h-4 text-red-500" />}
          item={murderboard.cynicalMajcomChief}
          borderColor="theme-border"
          accentColor="text-red-500"
        />
      </div>
    </div>
  );
};

interface ChiefCardProps {
  id: string;
  title: string;
  badge: string;
  icon: React.ReactNode;
  item: any;
  borderColor: string;
  accentColor: string;
}

const ChiefCard: React.FC<ChiefCardProps> = ({
  id,
  title,
  badge,
  icon,
  item,
  borderColor,
  accentColor
}) => {
  if (!item) return null;

  return (
    <div
      id={id}
      className={`rounded-xl border ${borderColor} theme-bg-card p-4 sm:p-5 space-y-3.5 shadow-sm flex flex-col justify-between`}
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2 border-b theme-border-subtle pb-2.5">
          <div className="flex items-center gap-2">
            {icon}
            <span className="font-military font-bold text-xs sm:text-sm theme-text-main uppercase tracking-wider">
              {title}
            </span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded theme-badge-neutral">
            {badge}
          </span>
        </div>

        <p className="text-xs theme-text-main font-mono leading-relaxed theme-bg-subtle p-3 rounded-lg border theme-border-subtle">
          "{item.analysis}"
        </p>
      </div>

      <div className="space-y-2 pt-1">
        {item.strengths && item.strengths.length > 0 && (
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase text-emerald-600 dark:text-emerald-400 font-bold block">
              + Strengths Noted
            </span>
            <ul className="text-[11px] font-mono theme-text-main space-y-0.5 list-disc list-inside">
              {item.strengths.map((st: string, idx: number) => (
                <li key={idx} className="leading-snug">{st}</li>
              ))}
            </ul>
          </div>
        )}

        {item.weaknesses && item.weaknesses.length > 0 && (
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase text-red-500 font-bold block">
              ⚠️ Vulnerabilities / Board Flags
            </span>
            <ul className="text-[11px] font-mono theme-text-muted space-y-0.5 list-disc list-inside">
              {item.weaknesses.map((w: string, idx: number) => (
                <li key={idx} className="leading-snug">{w}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
