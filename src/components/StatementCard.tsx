import React, { useState } from 'react';
import { 
  Copy, 
  Check, 
  Edit3, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  Sliders, 
  Zap, 
  Maximize2,
  Trash2,
  CornerDownRight,
  ShieldCheck
} from 'lucide-react';
import { StatementItem } from '../types';

interface StatementCardProps {
  statement: StatementItem;
  charLimit: number;
  onUpdateStatement: (updated: StatementItem) => void;
  onRefineStatement: (statement: StatementItem, targetAction: string) => void;
  onOpenPlaceholderModal: (statement: StatementItem, placeholder: string) => void;
  onDeleteStatement?: (id: string) => void;
}

export const StatementCard: React.FC<StatementCardProps> = ({
  statement,
  charLimit,
  onUpdateStatement,
  onRefineStatement,
  onOpenPlaceholderModal,
  onDeleteStatement
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(statement.statement);
  const [copied, setCopied] = useState(false);
  const [showRefineMenu, setShowRefineMenu] = useState(false);

  const currentCount = isEditing ? editedText.length : statement.statement.length;
  const isOverLimit = currentCount > charLimit;
  
  // Calculate sweet spot (91% - 97% of limit, e.g., 320 - 340 for 350)
  const minSweetSpot = Math.round(charLimit * 0.914); // 320 for 350
  const maxSweetSpot = Math.round(charLimit * 0.971); // 340 for 350
  const isSweetSpot = currentCount >= minSweetSpot && currentCount <= maxSweetSpot;

  // Character gauge color
  let gaugeColor = 'bg-[var(--theme-accent)]';
  let badgeColor = 'theme-badge-accent';
  let gaugeText = 'Needs calibration';

  if (isOverLimit) {
    gaugeColor = 'bg-red-500';
    badgeColor = 'text-red-500 dark:text-red-400 bg-red-500/10 border-red-500/40';
    gaugeText = 'OVER LIMIT';
  } else if (isSweetSpot) {
    gaugeColor = 'bg-emerald-500';
    badgeColor = 'text-emerald-600 dark:text-emerald-300 bg-emerald-500/10 border-emerald-500/40 font-bold';
    gaugeText = `SWEET SPOT (${minSweetSpot}-${maxSweetSpot})`;
  } else if (currentCount < minSweetSpot) {
    gaugeColor = 'bg-[var(--theme-accent)]';
    badgeColor = 'theme-badge-accent';
    gaugeText = 'Under target';
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(statement.statement);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.warn('Copy failed:', e);
    }
  };

  const handleSaveEdit = () => {
    // Extract any new placeholders
    const detectedPlaceholders = editedText.match(/\[([A-Z\s_]+)\]/g) || [];
    onUpdateStatement({
      ...statement,
      statement: editedText,
      charCount: editedText.length,
      placeholders: detectedPlaceholders
    });
    setIsEditing(false);
  };

  // Helper to render statement text with interactive placeholder chips
  const renderInteractiveText = (text: string) => {
    const parts = text.split(/(\[[A-Z\s_]+\])/g);
    return parts.map((part, idx) => {
      if (part.startsWith('[') && part.endsWith(']')) {
        return (
          <button
            key={idx}
            type="button"
            onClick={() => onOpenPlaceholderModal(statement, part)}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 mx-0.5 rounded theme-badge-accent font-mono text-[11px] font-bold transition-all cursor-pointer shadow-sm hover:scale-[1.02]"
            title="Click to inject verified metric"
          >
            <span>{part}</span>
            <Zap className="w-3 h-3 text-[var(--theme-accent)]" />
          </button>
        );
      }
      return <span key={idx}>{part}</span>;
    });
  };

  return (
    <div
      id={`statement-card-${statement.id}`}
      className={`rounded-xl border theme-bg-card transition-all p-4 space-y-3.5 shadow-sm ${
        isOverLimit
          ? 'border-red-500/60 bg-red-500/5'
          : isSweetSpot
          ? 'border-emerald-500/40 hover:border-emerald-500/60'
          : 'theme-border hover:border-[var(--theme-accent)]'
      }`}
    >
      {/* Card Header: Causal Tag & Character Counter Gauge */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Causal Integrity Badge */}
          <span
            className={`text-[10px] font-mono px-2 py-0.5 rounded-md border flex items-center gap-1 ${
              statement.causalIntegrity === 'Strong'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-300'
                : statement.causalIntegrity === 'Weak' || statement.causalIntegrity === 'Caution'
                ? 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-300'
                : 'theme-bg-subtle theme-border-subtle theme-text-muted'
            }`}
          >
            <ShieldCheck className="w-3 h-3" />
            Causation: {statement.causalIntegrity || 'Validated'}
          </span>

          {statement.actionVerb && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md theme-bg-subtle border theme-border-subtle theme-text-muted">
              Verb: <strong className="theme-text-main">{statement.actionVerb}</strong>
            </span>
          )}

          {statement.placeholders?.length > 0 && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md theme-badge-accent flex items-center gap-1 font-semibold">
              <Zap className="w-3 h-3 text-[var(--theme-accent)]" />
              {statement.placeholders.length} Missing Metric{statement.placeholders.length > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Character Count Metric */}
        <div className="flex items-center gap-2">
          <div className="text-right">
            <span className={`font-mono text-xs px-2 py-0.5 rounded border ${badgeColor}`}>
              {currentCount} / {charLimit}
            </span>
          </div>
          <span className="text-[10px] font-mono theme-text-subtle hidden sm:inline">
            {gaugeText}
          </span>
        </div>
      </div>

      {/* Character Progress Bar */}
      <div className="w-full h-1.5 theme-bg-subtle rounded-full overflow-hidden border theme-border-subtle">
        <div
          className={`h-full transition-all duration-300 ${gaugeColor}`}
          style={{ width: `${Math.min(100, (currentCount / charLimit) * 100)}%` }}
        ></div>
      </div>

      {/* Statement Content / Inline Editor */}
      <div className="space-y-2">
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              id={`edit-statement-textarea-${statement.id}`}
              rows={3}
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              className="w-full p-3 theme-input border-[var(--theme-accent)] rounded-lg text-sm font-mono leading-relaxed resize-y"
              autoFocus
            />
            <div className="flex items-center justify-between text-xs font-mono">
              <span className={isOverLimit ? 'text-red-500' : 'theme-text-muted'}>
                {editedText.length} characters (Target: {minSweetSpot}–{maxSweetSpot})
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditedText(statement.statement);
                    setIsEditing(false);
                  }}
                  className="px-2.5 py-1 rounded theme-bg-subtle hover:theme-border theme-text-muted cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="px-3 py-1 rounded theme-btn-primary font-bold cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div
            id={`statement-text-${statement.id}`}
            className="text-sm sm:text-base theme-text-main font-mono leading-relaxed p-2.5 rounded-lg theme-bg-subtle border theme-border-subtle"
          >
            {renderInteractiveText(statement.statement)}
          </div>
        )}

        {/* Original Note Reference if exists */}
        {statement.originalNote && (
          <div className="flex items-start gap-1.5 text-[11px] font-mono theme-text-subtle pl-1">
            <CornerDownRight className="w-3 h-3 shrink-0 mt-0.5 opacity-60" />
            <span className="truncate">Source note: {statement.originalNote}</span>
          </div>
        )}

        {/* Coaching Note / Recommendation if provided */}
        {statement.notes && (
          <div className="text-[11px] font-mono theme-text-muted bg-[var(--theme-accent)]/10 border-l-2 border-[var(--theme-accent)] p-2 rounded-r">
            💡 {statement.notes}
          </div>
        )}
      </div>

      {/* Card Actions Bar */}
      <div className="flex items-center justify-between pt-1 border-t theme-border-subtle flex-wrap gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Quick Refine Triggers */}
          <div className="relative">
            <button
              id={`refine-btn-${statement.id}`}
              type="button"
              onClick={() => setShowRefineMenu(!showRefineMenu)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md theme-badge-accent text-xs font-mono transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[var(--theme-accent)]" />
              <span>Refine</span>
            </button>

            {showRefineMenu && (
              <div className="absolute left-0 bottom-full mb-1.5 w-56 theme-bg-card border theme-border rounded-lg p-1.5 shadow-2xl z-30 space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowRefineMenu(false);
                    onRefineStatement(statement, 'tighten');
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded text-xs font-mono theme-text-muted hover:theme-bg-subtle hover:theme-text-main flex items-center justify-between cursor-pointer"
                >
                  <span>Tighten to Sweet Spot</span>
                  <span className="text-[10px] theme-text-subtle">{minSweetSpot}–{maxSweetSpot}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowRefineMenu(false);
                    onRefineStatement(statement, 'strengthen_impact');
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded text-xs font-mono theme-text-muted hover:theme-bg-subtle hover:theme-text-main cursor-pointer"
                >
                  Strengthen Causality & Impact
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowRefineMenu(false);
                    onRefineStatement(statement, 'active_voice');
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded text-xs font-mono theme-text-muted hover:theme-bg-subtle hover:theme-text-main cursor-pointer"
                >
                  Anti-Inflation / Active Voice
                </button>
              </div>
            )}
          </div>

          <button
            id={`edit-toggle-btn-${statement.id}`}
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md theme-bg-subtle border theme-border-subtle hover:theme-border text-xs font-mono theme-text-muted hover:theme-text-main transition-colors cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{isEditing ? 'Close Edit' : 'Edit Text'}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {onDeleteStatement && (
            <button
              id={`delete-btn-${statement.id}`}
              type="button"
              onClick={() => onDeleteStatement(statement.id)}
              className="p-1.5 rounded-md theme-text-subtle hover:text-red-500 hover:theme-bg-subtle transition-colors cursor-pointer"
              title="Remove statement"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            id={`copy-statement-btn-${statement.id}`}
            type="button"
            onClick={handleCopy}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-bold transition-all cursor-pointer ${
              copied
                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/40'
                : 'theme-bg-subtle hover:theme-border theme-text-main border theme-border-subtle'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 opacity-70" />
                <span>Copy Statement</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
