import React, { useState } from 'react';
import { Copy, Check, Edit3, ShieldAlert, CheckCircle2, UserX } from 'lucide-react';

interface DutyDescriptionCardProps {
  dutyDescription: string;
  charCount?: number;
  onUpdateDutyDescription: (newText: string) => void;
}

export const DutyDescriptionCard: React.FC<DutyDescriptionCardProps> = ({
  dutyDescription,
  charCount,
  onUpdateDutyDescription
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(dutyDescription);
  const [copied, setCopied] = useState(false);

  const length = isEditing ? text.length : (charCount || dutyDescription.length);

  // Check if text violates "no direct reference to member" rule
  const hasDirectReference = /\b(MSgt|TSgt|SSgt|SrA|A1C|Capt|Maj|Lt Col|Col|Chief)\s+[A-Z][a-z]+|\b(He\s+is|She\s+is|Member\s+is)\b/i.test(
    isEditing ? text : dutyDescription
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(dutyDescription);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.warn('Copy failed:', e);
    }
  };

  const handleSave = () => {
    onUpdateDutyDescription(text);
    setIsEditing(false);
  };

  return (
    <div id="duty-description-card" className="rounded-xl border theme-border theme-bg-card p-4 sm:p-5 space-y-4 shadow-sm">
      <div className="flex items-center justify-between flex-wrap gap-2 border-b theme-border-subtle pb-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[var(--theme-accent)]"></span>
          <h3 className="font-military font-bold text-sm tracking-wider uppercase theme-text-main">
            Duty Description
          </h3>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded theme-badge-neutral">
            Scope & Mission Impact
          </span>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="px-2 py-0.5 rounded theme-bg-subtle theme-text-main border theme-border-subtle font-semibold">
            {length} characters
          </span>
          <span className="text-[11px] theme-text-subtle hidden sm:inline">
            (Target: ~300-450)
          </span>
        </div>
      </div>

      {/* Voice rule reminder badge */}
      <div className="flex items-center gap-2 text-[11px] font-mono theme-text-muted theme-bg-subtle p-2.5 rounded-lg border theme-border-subtle">
        <UserX className="w-4 h-4 text-[var(--theme-accent)] shrink-0" />
        <span>
          <strong>Rule:</strong> No direct reference to the member. Focus on scope, fiscal authority, personnel supervised, and operational mission relevance.
        </span>
      </div>

      {hasDirectReference && (
        <div className="flex items-center gap-2 text-[11px] font-mono text-red-500 bg-red-500/10 p-2.5 rounded-lg border border-red-500/30">
          <ShieldAlert className="w-4 h-4 text-red-500 shrink-0" />
          <span>
            Direct reference detected. Rewrite to define organizational scope rather than describing the individual.
          </span>
        </div>
      )}

      {/* Content / Editor */}
      {isEditing ? (
        <div className="space-y-2">
          <textarea
            id="duty-description-edit-textarea"
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full p-3 theme-input border-[var(--theme-accent)] rounded-lg text-xs sm:text-sm font-mono leading-relaxed resize-y"
          />
          <div className="flex justify-end gap-2 text-xs font-mono">
            <button
              type="button"
              onClick={() => {
                setText(dutyDescription);
                setIsEditing(false);
              }}
              className="px-3 py-1.5 rounded theme-bg-subtle hover:theme-border theme-text-muted cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-3.5 py-1.5 rounded theme-btn-primary font-bold cursor-pointer"
            >
              Save Duty Description
            </button>
          </div>
        </div>
      ) : (
        <div
          id="duty-description-text"
          className="text-xs sm:text-sm theme-text-main font-mono leading-relaxed p-3.5 rounded-lg theme-bg-subtle border theme-border-subtle"
        >
          {dutyDescription || 'No duty description generated. Please supply duty title or raw duties.'}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-1 border-t theme-border-subtle">
        <button
          id="edit-duty-description-btn"
          type="button"
          onClick={() => setIsEditing(!isEditing)}
          className="inline-flex items-center gap-1.5 text-xs font-mono theme-text-muted hover:theme-text-main cursor-pointer"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>{isEditing ? 'Close Edit' : 'Edit Description'}</span>
        </button>

        <button
          id="copy-duty-description-btn"
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
              <span>Copy Section</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
