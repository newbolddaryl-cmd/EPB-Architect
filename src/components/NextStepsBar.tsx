import React from 'react';
import { ArrowRight, Sparkles, CheckCircle, Crosshair, Sliders, Zap } from 'lucide-react';
import { NextStepOption } from '../types';

interface NextStepsBarProps {
  steps: NextStepOption[];
  onSelectStep: (step: NextStepOption) => void;
  isLoading?: boolean;
}

export const NextStepsBar: React.FC<NextStepsBarProps> = ({
  steps,
  onSelectStep,
  isLoading = false
}) => {
  if (!steps || steps.length === 0) return null;

  const getStepIcon = (actionType: string) => {
    switch (actionType) {
      case 'tighten_chars':
        return <Sliders className="w-4 h-4 text-emerald-500" />;
      case 'inject_metrics':
        return <Zap className="w-4 h-4 text-[var(--theme-accent)]" />;
      case 'run_murderboard':
        return <Crosshair className="w-4 h-4 text-red-500" />;
      default:
        return <Sparkles className="w-4 h-4 text-[var(--theme-accent)]" />;
    }
  };

  return (
    <div id="next-steps-container" className="rounded-xl border theme-border theme-bg-card p-4 sm:p-5 space-y-3 shadow-sm">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <h3 className="font-military font-bold text-sm tracking-wider uppercase theme-text-main">
            Recommended Next Steps (Tap to Execute)
          </h3>
        </div>
        <span className="text-[10px] font-mono theme-text-subtle hidden sm:inline">
          Air Force Board Calibration Pipeline
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {steps.map((step) => (
          <button
            key={step.id}
            id={`next-step-btn-${step.id}`}
            type="button"
            onClick={() => onSelectStep(step)}
            disabled={isLoading}
            className="text-left p-3 rounded-lg theme-bg-subtle border theme-border-subtle hover:border-[var(--theme-accent)] theme-text-main transition-all flex items-start justify-between gap-3 group cursor-pointer"
          >
            <div className="flex items-start gap-2.5">
              <div className="p-1.5 rounded theme-bg-card border theme-border-subtle group-hover:border-[var(--theme-accent)] shrink-0 mt-0.5">
                {getStepIcon(step.actionType)}
              </div>
              <div className="space-y-0.5">
                <span className="text-xs font-military font-bold uppercase tracking-wide theme-text-main group-hover:text-[var(--theme-accent)]">
                  {step.label}
                </span>
                {step.description && (
                  <p className="text-[11px] font-mono theme-text-muted line-clamp-2 leading-relaxed">
                    {step.description}
                  </p>
                )}
              </div>
            </div>
            <ArrowRight className="w-4 h-4 opacity-50 group-hover:text-[var(--theme-accent)] group-hover:opacity-100 shrink-0 mt-1 transition-transform group-hover:translate-x-0.5" />
          </button>
        ))}
      </div>
    </div>
  );
};
