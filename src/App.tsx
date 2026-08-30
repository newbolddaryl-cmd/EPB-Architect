import React, { useState, useEffect, useCallback } from 'react';
import { 
  ShieldAlert, 
  FolderArchive, 
  Sparkles, 
  ArrowLeft, 
  RotateCcw, 
  Flame, 
  CheckCircle2, 
  Layers, 
  AlertTriangle 
} from 'lucide-react';
import { FormData, EngineResult, StatementItem, NextStepOption } from './types';
import { SecurityBanner } from './components/SecurityBanner';
import { SetupScreen } from './components/SetupScreen';
import { WorkspaceScreen } from './components/WorkspaceScreen';
import { SavedDraftsModal } from './components/SavedDraftsModal';
import { ThemeSelector } from './components/ThemeSelector';
import { useTheme } from './utils/themeContext';
import { detectSensitiveData } from './utils/sanitizer';
import { 
  loadCurrentState, 
  saveCurrentState, 
  clearCurrentState, 
  saveDraftToList 
} from './utils/localStorage';

const DEFAULT_FORM_DATA: FormData = {
  productType: 'EPB',
  rankGrade: 'TSgt / E-6',
  afsc: '1D771Q (Cyber Operations)',
  charLimit: 350,
  workMode: 'full',
  name: '',
  dutyTitle: '',
  unit: '',
  ratingPeriod: '',
  priorEvaluations: '',
  rawNotes: ''
};

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'setup' | 'workspace'>('setup');
  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM_DATA);
  const [engineResult, setEngineResult] = useState<EngineResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSavedDraftsOpen, setIsSavedDraftsOpen] = useState(false);
  const [detectedWarning, setDetectedWarning] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Load initial draft from browser storage
  useEffect(() => {
    const { formData: savedForm, engineResult: savedResult } = loadCurrentState();
    if (savedForm) {
      setFormData(savedForm);
    }
    if (savedResult) {
      setEngineResult(savedResult);
      // If we already have a generated result, we can stay on workspace if user previously was there
    }
  }, []);

  // Save current state on changes
  useEffect(() => {
    saveCurrentState(formData, engineResult);
  }, [formData, engineResult]);

  const handleFormChange = (updates: Partial<FormData>) => {
    setFormData((prev) => {
      const next = { ...prev, ...updates };
      // Check for sensitive data
      const check = detectSensitiveData((next.rawNotes || '') + ' ' + (next.priorEvaluations || ''));
      if (check.isSensitive) {
        setDetectedWarning(check.warningMessage);
      } else {
        setDetectedWarning('');
      }
      return next;
    });
  };

  const handleClearForm = () => {
    if (window.confirm('Clear all form fields and start fresh?')) {
      setFormData(DEFAULT_FORM_DATA);
      setEngineResult(null);
      clearCurrentState();
      setDetectedWarning('');
      setErrorMessage('');
      setCurrentScreen('setup');
    }
  };

  // Main Generation Handler
  const handleStartGeneration = async () => {
    // 1. Check for sensitive data
    const check = detectSensitiveData((formData.rawNotes || '') + ' ' + (formData.priorEvaluations || ''));
    if (check.isSensitive) {
      setDetectedWarning(check.warningMessage);
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setDetectedWarning('');

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        if (errData.error === 'SENSITIVE_DATA_DETECTED') {
          setDetectedWarning(errData.message);
          setIsLoading(false);
          return;
        }
        throw new Error(errData.message || `Server responded with ${response.status}`);
      }

      const result: EngineResult = await response.json();
      setEngineResult(result);
      // Auto-save this version to local drafts list
      saveDraftToList(formData, result);
      setCurrentScreen('workspace');
    } catch (err: any) {
      console.error('Generation failed:', err);
      setErrorMessage(err?.message || 'Failed to communicate with the writing engine. Please check your network or try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Refine single statement
  const handleRefineSingleStatement = async (
    statement: StatementItem,
    targetAction: string,
    replacementMetric?: string
  ) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/refine-statement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          statement: statement.statement,
          charLimit: formData.charLimit || 350,
          targetAction,
          replacementMetric,
          rankGrade: formData.rankGrade,
          afsc: formData.afsc
        })
      });

      if (!response.ok) {
        throw new Error('Failed to refine statement');
      }

      const refined = await response.json();
      if (engineResult && refined.refinedStatement) {
        const updatedSections = engineResult.sections.map((sec) => ({
          ...sec,
          statements: sec.statements.map((st) => {
            if (st.id === statement.id) {
              return {
                ...st,
                statement: refined.refinedStatement,
                charCount: refined.charCount || refined.refinedStatement.length,
                actionVerb: refined.actionVerb || st.actionVerb,
                placeholders: refined.placeholders || [],
                causalIntegrity: (refined.causalIntegrity as any) || st.causalIntegrity,
                notes: refined.coachingNote || st.notes
              };
            }
            return st;
          })
        }));

        const updatedResult: EngineResult = {
          ...engineResult,
          sections: updatedSections
        };
        setEngineResult(updatedResult);
        saveDraftToList(formData, updatedResult);
      }
    } catch (err: any) {
      console.error('Refine failed:', err);
      alert('Failed to refine statement: ' + (err.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  // Run On-Demand 4-Chief Murderboard
  const handleTriggerMurderboard = async () => {
    if (!engineResult) return;
    setIsLoading(true);

    try {
      const allStatements = engineResult.sections.flatMap((s) => s.statements);
      const response = await fetch('/api/murderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productType: formData.productType,
          rankGrade: formData.rankGrade,
          afsc: formData.afsc,
          dutyDescription: engineResult.dutyDescription,
          statements: allStatements,
          priorEvaluations: formData.priorEvaluations
        })
      });

      if (!response.ok) {
        throw new Error('Murderboard simulation failed');
      }

      const mbReview = await response.json();
      const updatedResult: EngineResult = {
        ...engineResult,
        murderboardReview: mbReview
      };
      setEngineResult(updatedResult);
      saveDraftToList(formData, updatedResult);
    } catch (err: any) {
      console.error('Murderboard trigger failed:', err);
      alert('Failed to execute Murderboard: ' + (err.message || 'Server error'));
    } finally {
      setIsLoading(false);
    }
  };

  // Interactive Next Step Execution
  const handleExecuteNextStep = (step: NextStepOption) => {
    if (step.actionType === 'run_murderboard') {
      handleTriggerMurderboard();
    } else if (step.actionType === 'tighten_chars' || step.actionType === 'fix_causality' || step.actionType === 'refine_statement') {
      // Find candidate statement or rerun generation with focused refinement
      handleStartGeneration();
    } else {
      handleStartGeneration();
    }
  };

  // Load a saved draft from local modal
  const handleLoadDraft = (draft: any) => {
    setFormData(draft.formData);
    if (draft.engineResult) {
      setEngineResult(draft.engineResult);
      setCurrentScreen('workspace');
    } else {
      setCurrentScreen('setup');
    }
  };

  return (
    <div id="epb-architect-app" className="min-h-screen theme-bg-main theme-text-main tactical-grid flex flex-col justify-between transition-colors duration-200">
      {/* Top Header / App Brand */}
      <header id="main-header" className="border-b theme-border-subtle theme-bg-header backdrop-blur-md sticky top-0 z-50 transition-colors duration-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          {/* Logo / Badge */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentScreen('setup')}>
            <div className="w-9 h-9 rounded-lg theme-badge-accent flex items-center justify-center font-military font-bold text-base shadow-sm">
              EPB
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-military font-bold text-base sm:text-lg tracking-wider uppercase theme-text-main">
                  EPB Architect
                </span>
                <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded theme-badge-neutral">
                  v1.0
                </span>
              </div>
              <p className="text-[10px] font-mono theme-text-muted hidden sm:block">
                Board-Calibrated Military Writing Engine
              </p>
            </div>
          </div>

          {/* Quick Header Tools & Theme Switcher */}
          <div className="flex items-center gap-2">
            {/* Theme Selector */}
            <ThemeSelector />

            {currentScreen === 'workspace' ? (
              <button
                id="header-back-setup-btn"
                type="button"
                onClick={() => setCurrentScreen('setup')}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg theme-bg-card border theme-border hover:border-[var(--theme-accent)] text-xs font-mono theme-text-muted hover:theme-text-main transition-colors shadow-sm"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Setup</span>
              </button>
            ) : engineResult ? (
              <button
                id="header-view-workspace-btn"
                type="button"
                onClick={() => setCurrentScreen('workspace')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg theme-badge-accent text-xs font-mono hover:opacity-90 transition-opacity shadow-sm"
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Workspace</span>
              </button>
            ) : null}

            <button
              id="header-saved-drafts-btn"
              type="button"
              onClick={() => setIsSavedDraftsOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg theme-bg-card border theme-border hover:border-[var(--theme-accent)] text-xs font-mono theme-text-muted hover:theme-text-main transition-colors shadow-sm"
              title="Saved browser drafts"
            >
              <FolderArchive className="w-3.5 h-3.5 opacity-70" />
              <span className="hidden sm:inline">Drafts</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-4 space-y-4">
        {/* Security & OPSEC Banner */}
        <SecurityBanner
          detectedWarning={detectedWarning}
          onDismissWarning={() => setDetectedWarning('')}
        />

        {/* Global Error Banner if any */}
        {errorMessage && (
          <div
            role="alert"
            className="p-4 rounded-xl border border-red-500/50 bg-red-950/40 text-red-200 text-xs sm:text-sm font-mono flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg"
          >
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <strong className="font-military font-bold uppercase text-red-300 block mb-0.5">
                  Writing Engine Notice
                </strong>
                <p>{errorMessage}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              <button
                type="button"
                onClick={handleStartGeneration}
                disabled={isLoading}
                className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-military font-bold uppercase text-xs transition-colors shadow-sm cursor-pointer disabled:opacity-50"
              >
                Retry Now
              </button>
              <button
                type="button"
                onClick={() => setErrorMessage('')}
                className="px-2.5 py-1.5 rounded-lg border border-red-500/30 text-red-300 hover:text-white hover:bg-red-900/40 text-xs transition-colors cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Screen Switcher */}
        {currentScreen === 'setup' ? (
          <SetupScreen
            formData={formData}
            onChange={handleFormChange}
            onStart={handleStartGeneration}
            onClear={handleClearForm}
            onOpenSavedDrafts={() => setIsSavedDraftsOpen(true)}
            isLoading={isLoading}
          />
        ) : engineResult ? (
          <WorkspaceScreen
            result={engineResult}
            formData={formData}
            onBackToSetup={() => setCurrentScreen('setup')}
            onImproveOrRegenerate={handleStartGeneration}
            onTriggerMurderboard={handleTriggerMurderboard}
            onRefineSingleStatement={handleRefineSingleStatement}
            onUpdateResult={setEngineResult}
            onExecuteNextStep={handleExecuteNextStep}
            isLoading={isLoading}
          />
        ) : (
          <div className="text-center py-12">
            <button
              onClick={() => setCurrentScreen('setup')}
              className="px-6 py-3 rounded-xl theme-btn-primary font-military font-bold uppercase text-sm shadow-md"
            >
              Go to Setup Screen
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t theme-border-subtle theme-bg-card/70 py-4 px-4 text-center text-[11px] font-mono theme-text-subtle transition-colors duration-200">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>EPB Architect • Air Force Writing Engine v1.0 • Client-side local storage</span>
          <span className="opacity-70">Validate all metrics, causal claims, and external facts before submission.</span>
        </div>
      </footer>

      {/* Saved Drafts Modal */}
      <SavedDraftsModal
        isOpen={isSavedDraftsOpen}
        onClose={() => setIsSavedDraftsOpen(false)}
        onLoadDraft={handleLoadDraft}
        currentFormData={formData}
        currentResult={engineResult}
      />
    </div>
  );
}
