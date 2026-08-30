import React from 'react';
import { AlertTriangle, ShieldAlert, Zap, BookOpen, CheckCircle, ArrowRight } from 'lucide-react';
import { KeyIssue } from '../types';

interface KeyIssuesViewProps {
  issues: KeyIssue[];
}

export const KeyIssuesView: React.FC<KeyIssuesViewProps> = ({ issues }) => {
  if (!issues || issues.length === 0) {
    return (
      <div id="key-issues-empty" className="rounded-xl border theme-border theme-bg-card p-6 text-center space-y-2">
        <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto" />
        <h3 className="font-military font-bold text-sm theme-text-main uppercase tracking-wider">
          Zero Critical Issues Flagged
        </h3>
        <p className="text-xs theme-text-muted font-mono">
          All statements pass causal integrity, scope, and metric validation tests.
        </p>
      </div>
    );
  }

  const categoryIcons: Record<string, React.ReactNode> = {
    Causation: <ShieldAlert className="w-4 h-4 text-red-500" />,
    Inflation: <AlertTriangle className="w-4 h-4 text-amber-500" />,
    Metrics: <Zap className="w-4 h-4 text-[var(--theme-accent)]" />,
    Scope: <BookOpen className="w-4 h-4 text-blue-500" />,
    Acronym: <BookOpen className="w-4 h-4 text-zinc-400" />,
    Placement: <ArrowRight className="w-4 h-4 text-purple-500" />,
  };

  return (
    <div id="key-issues-container" className="space-y-3">
      <div className="flex items-center justify-between pb-1 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500"></span>
          <h3 className="font-military font-bold text-sm tracking-wider uppercase theme-text-main">
            Key Issues & Red-Team Recommendations ({issues.length})
          </h3>
        </div>
        <span className="text-[11px] font-mono theme-text-subtle">
          Anti-Inflation & Causality Audit
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {issues.map((item) => {
          const isHigh = item.severity === 'high';
          const isMedium = item.severity === 'medium';

          return (
            <div
              key={item.id}
              id={`key-issue-card-${item.id}`}
              className={`p-4 rounded-xl border theme-bg-card space-y-2.5 shadow-sm flex flex-col justify-between ${
                isHigh
                  ? 'border-red-500/40 bg-red-500/5'
                  : isMedium
                  ? 'border-amber-500/30'
                  : 'theme-border'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {categoryIcons[item.category] || <AlertTriangle className="w-4 h-4 text-amber-500" />}
                    <span className="font-military font-bold text-xs uppercase theme-text-main">
                      {item.category} Vulnerability
                    </span>
                  </div>
                  <span
                    className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded font-bold border ${
                      isHigh
                        ? 'bg-red-500/10 text-red-500 dark:text-red-300 border-red-500/30'
                        : isMedium
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-500/30'
                        : 'theme-bg-subtle theme-text-muted theme-border-subtle'
                    }`}
                  >
                    {item.severity} severity
                  </span>
                </div>

                <p className="text-xs font-mono theme-text-main leading-snug">
                  {item.issue}
                </p>
              </div>

              {/* Recommendation Box */}
              <div className="theme-bg-subtle p-2.5 rounded-lg border theme-border-subtle space-y-1">
                <span className="text-[10px] font-mono uppercase text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Fix / Recommendation:
                </span>
                <p className="text-[11px] font-mono theme-text-muted leading-relaxed">
                  {item.recommendation}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
