import React, { useState, useEffect } from 'react';
import { FolderArchive, X, Trash2, ArrowRight, Download, Upload, Clock, Plus, Check } from 'lucide-react';
import { SavedDraft, getAllSavedDrafts, deleteDraftFromList, saveDraftToList } from '../utils/localStorage';
import { FormData, EngineResult } from '../types';

interface SavedDraftsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadDraft: (draft: SavedDraft) => void;
  currentFormData: FormData;
  currentResult: EngineResult | null;
}

export const SavedDraftsModal: React.FC<SavedDraftsModalProps> = ({
  isOpen,
  onClose,
  onLoadDraft,
  currentFormData,
  currentResult
}) => {
  const [drafts, setDrafts] = useState<SavedDraft[]>([]);
  const [saveTitle, setSaveTitle] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const refreshDrafts = () => {
    setDrafts(getAllSavedDrafts());
  };

  useEffect(() => {
    if (isOpen) {
      refreshDrafts();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveCurrent = (e: React.FormEvent) => {
    e.preventDefault();
    const title = saveTitle.trim() || `${currentFormData.productType} - ${currentFormData.rankGrade || 'Draft'} (${currentFormData.afsc || 'General'})`;
    saveDraftToList(currentFormData, currentResult, title);
    setSaveTitle('');
    setSaveSuccess(true);
    refreshDrafts();
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteDraftFromList(id);
    refreshDrafts();
  };

  // Export drafts as JSON file
  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(drafts, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `epb_architect_drafts_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        id="saved-drafts-modal-container"
        className="w-full max-w-2xl theme-bg-card border theme-border rounded-xl p-5 space-y-5 shadow-2xl max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b theme-border-subtle pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md theme-badge-accent">
              <FolderArchive className="w-5 h-5 text-[var(--theme-accent)]" />
            </div>
            <div>
              <h3 className="font-military font-bold text-base theme-text-main uppercase tracking-wide">
                Device-Local Saved Drafts
              </h3>
              <p className="text-[11px] font-mono theme-text-muted">
                Encrypted in browser storage on this device. No remote servers or login.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="theme-text-muted hover:theme-text-main p-1 rounded transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Save Current Draft Sub-form */}
        <form onSubmit={handleSaveCurrent} className="theme-bg-subtle p-3.5 rounded-lg border theme-border-subtle space-y-2 shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-xs font-military font-bold uppercase theme-text-main flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-[var(--theme-accent)]" /> Save Current Session
            </span>
            {saveSuccess && (
              <span className="text-[11px] font-mono text-emerald-500 font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Saved to browser storage!
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={saveTitle}
              onChange={(e) => setSaveTitle(e.target.value)}
              placeholder={`e.g. ${currentFormData.productType || 'EPB'} - ${currentFormData.name || currentFormData.rankGrade || 'My Draft'}`}
              className="flex-1 h-10 px-3 theme-input rounded-lg text-xs font-mono"
            />
            <button
              type="submit"
              className="h-10 px-4 rounded-lg theme-btn-primary font-military font-bold text-xs uppercase tracking-wider transition-colors shrink-0 cursor-pointer"
            >
              Save Draft
            </button>
          </div>
        </form>

        {/* Drafts List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[160px]">
          {drafts.length === 0 ? (
            <div className="text-center py-8 theme-text-subtle space-y-1">
              <FolderArchive className="w-8 h-8 mx-auto opacity-50 mb-2" />
              <p className="text-xs font-mono">No saved drafts yet on this device.</p>
              <p className="text-[11px] opacity-75">Use the box above to bookmark your current evaluation.</p>
            </div>
          ) : (
            drafts.map((draft) => (
              <div
                key={draft.id}
                id={`saved-draft-item-${draft.id}`}
                onClick={() => {
                  onLoadDraft(draft);
                  onClose();
                }}
                className="p-3 rounded-lg theme-bg-subtle border theme-border-subtle hover:border-[var(--theme-accent)] text-left transition-all cursor-pointer flex items-center justify-between gap-3 group"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold font-military uppercase theme-text-main group-hover:text-[var(--theme-accent)] truncate">
                      {draft.title}
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded theme-badge-neutral">
                      {draft.formData.productType} • {draft.formData.rankGrade || 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] font-mono theme-text-subtle">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(draft.updatedAt).toLocaleDateString()} {new Date(draft.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span>•</span>
                    <span>{draft.formData.charLimit || 350} char limit</span>
                    {draft.engineResult && (
                      <span className="text-emerald-500 font-semibold">• Generated</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => handleDelete(draft.id, e)}
                    className="p-1.5 rounded theme-text-subtle hover:text-red-500 hover:theme-bg-card transition-colors cursor-pointer"
                    title="Delete draft"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="p-1.5 rounded theme-bg-card group-hover:bg-[var(--theme-accent)] group-hover:text-black transition-colors">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer with Export Action */}
        <div className="flex items-center justify-between pt-3 border-t theme-border-subtle shrink-0">
          <button
            type="button"
            onClick={handleExportJson}
            disabled={drafts.length === 0}
            className="inline-flex items-center gap-1.5 text-xs font-mono theme-text-muted hover:theme-text-main disabled:opacity-40 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Backup Drafts (JSON)</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg theme-bg-subtle hover:theme-border theme-text-main font-mono text-xs cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
