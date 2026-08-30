import React, { useState } from 'react';
import { Zap, X, Check, Sparkles } from 'lucide-react';
import { StatementItem } from '../types';

interface PlaceholderModalProps {
  isOpen: boolean;
  statement: StatementItem | null;
  placeholder: string;
  onClose: () => void;
  onApplyMetric: (statement: StatementItem, placeholder: string, value: string, shouldRefine: boolean) => void;
}

export const PlaceholderModal: React.FC<PlaceholderModalProps> = ({
  isOpen,
  statement,
  placeholder,
  onClose,
  onApplyMetric
}) => {
  const [metricValue, setMetricValue] = useState('');
  const [shouldAiRefine, setShouldAiRefine] = useState(true);

  if (!isOpen || !statement) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!metricValue.trim()) return;
    onApplyMetric(statement, placeholder, metricValue.trim(), shouldAiRefine);
    setMetricValue('');
    onClose();
  };

  const sampleMetrics = [
    '$1.8M budget',
    '14 Airmen',
    '45% reduction',
    '380 flight sorties',
    '0 discrepancies / 100% QA pass',
    '42 combat sorties',
    '72 hours vs 24 days',
    '1.2k personnel'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        id="placeholder-modal-container"
        className="w-full max-w-lg theme-bg-card border theme-border rounded-xl p-5 space-y-4 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b theme-border-subtle pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md theme-badge-accent">
              <Zap className="w-4 h-4 text-[var(--theme-accent)]" />
            </div>
            <div>
              <h3 className="font-military font-bold text-sm theme-text-main uppercase tracking-wide">
                Inject Verified Metric / Impact
              </h3>
              <p className="text-[11px] font-mono theme-text-muted">
                Replace <span className="text-[var(--theme-accent)] font-bold">{placeholder}</span> with verified quantification
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="theme-text-muted hover:theme-text-main p-1 rounded transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Statement Preview */}
        <div className="p-3 theme-bg-subtle rounded-lg border theme-border-subtle text-xs font-mono theme-text-main leading-relaxed">
          {statement.statement}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="metric-input" className="block text-xs font-mono theme-text-main font-semibold uppercase">
              Actual Metric / Result Value:
            </label>
            <input
              id="metric-input"
              type="text"
              value={metricValue}
              onChange={(e) => setMetricValue(e.target.value)}
              placeholder="e.g. 14 aircraft, $2.4M assets, 98% pass rate, 45 hours saved"
              className="w-full h-11 px-3 theme-input rounded-lg text-sm font-mono"
              autoFocus
              required
            />
          </div>

          {/* Quick Suggestions Chips */}
          <div className="space-y-1">
            <span className="text-[10px] font-mono theme-text-subtle uppercase">Quick presets:</span>
            <div className="flex flex-wrap gap-1.5">
              {sampleMetrics.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMetricValue(m)}
                  className="text-[10px] font-mono px-2 py-1 rounded theme-bg-subtle border theme-border-subtle hover:border-[var(--theme-accent)] theme-text-muted hover:theme-text-main transition-colors cursor-pointer"
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Auto-rebalance toggle */}
          <label className="flex items-center gap-2 text-xs font-mono theme-text-muted cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={shouldAiRefine}
              onChange={(e) => setShouldAiRefine(e.target.checked)}
              className="w-4 h-4 rounded border-zinc-700 text-amber-500 focus:ring-amber-400 bg-zinc-950"
            />
            <span>Re-calibrate statement with engine to preserve exact character limit</span>
          </label>

          <div className="flex items-center justify-end gap-2 pt-2 border-t theme-border-subtle">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg theme-bg-subtle hover:theme-border theme-text-muted text-xs font-mono cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!metricValue.trim()}
              className="px-5 py-2 rounded-lg theme-btn-primary disabled:opacity-50 font-military font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Apply & Update
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
