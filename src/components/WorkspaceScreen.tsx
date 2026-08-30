import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, 
  Sparkles, 
  Copy, 
  Check, 
  Flame, 
  AlertTriangle, 
  SlidersHorizontal, 
  Layers, 
  ShieldCheck, 
  Download, 
  FileText, 
  ChevronRight, 
  ExternalLink,
  PlusCircle,
  RefreshCw,
  Target
} from 'lucide-react';
import { EngineResult, StatementItem, FormData, NextStepOption } from '../types';
import { StatementCard } from './StatementCard';
import { DutyDescriptionCard } from './DutyDescriptionCard';
import { MurderboardView } from './MurderboardView';
import { KeyIssuesView } from './KeyIssuesView';
import { NextStepsBar } from './NextStepsBar';
import { PlaceholderModal } from './PlaceholderModal';

interface WorkspaceScreenProps {
  result: EngineResult;
  formData: FormData;
  onBackToSetup: () => void;
  onImproveOrRegenerate: () => void;
  onTriggerMurderboard: () => void;
  onRefineSingleStatement: (statement: StatementItem, targetAction: string, replacementMetric?: string) => Promise<void>;
  onUpdateResult: (updated: EngineResult) => void;
  onExecuteNextStep: (step: NextStepOption) => void;
  isLoading?: boolean;
}

export const WorkspaceScreen: React.FC<WorkspaceScreenProps> = ({
  result,
  formData,
  onBackToSetup,
  onImproveOrRegenerate,
  onTriggerMurderboard,
  onRefineSingleStatement,
  onUpdateResult,
  onExecuteNextStep,
  isLoading = false
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'statements' | 'duty' | 'murderboard' | 'issues'>(
    formData.workMode === 'murderboard' ? 'murderboard' : 'all'
  );
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedSectionName, setCopiedSectionName] = useState<string | null>(null);

  // Placeholder modal state
  const [activePlaceholderTarget, setActivePlaceholderTarget] = useState<{
    statement: StatementItem | null;
    placeholder: string;
  }>({ statement: null, placeholder: '' });

  // Total statement counts and sweet spot stats
  const allStatements = useMemo(() => {
    const list: StatementItem[] = [];
    result.sections?.forEach((sec) => {
      sec.statements?.forEach((st) => list.push(st));
    });
    return list;
  }, [result.sections]);

  const sweetSpotCount = useMemo(() => {
    const min = Math.round(result.charLimit * 0.914);
    const max = Math.round(result.charLimit * 0.971);
    return allStatements.filter((st) => st.charCount >= min && st.charCount <= max).length;
  }, [allStatements, result.charLimit]);

  const totalPlaceholders = useMemo(() => {
    return allStatements.reduce((acc, st) => acc + (st.placeholders?.length || 0), 0);
  }, [allStatements]);

  // Copy whole package formatted
  const handleCopyAll = async () => {
    let output = `=== ${result.productType} PACKAGE: ${result.rankGrade} (${result.afsc}) ===\n`;
    if (formData.name) output += `MEMBER: ${formData.name}\n`;
    if (formData.dutyTitle) output += `DUTY TITLE: ${formData.dutyTitle}\n`;
    if (formData.unit) output += `UNIT: ${formData.unit}\n`;
    if (formData.ratingPeriod) output += `PERIOD: ${formData.ratingPeriod}\n`;
    output += `\n--- BLUF SUMMARY ---\n${result.blufSummary}\n\n`;

    if (result.dutyDescription) {
      output += `--- DUTY DESCRIPTION (${result.dutyDescription.length} chars) ---\n${result.dutyDescription}\n\n`;
    }

    result.sections?.forEach((sec) => {
      output += `--- SECTION: ${sec.name.toUpperCase()} ---\n`;
      sec.statements?.forEach((st, idx) => {
        output += `[${idx + 1}] (${st.charCount} chars) ${st.statement}\n`;
      });
      output += `\n`;
    });

    if (result.additionalComments) {
      output += `--- ADDITIONAL COMMENTS ---\n${result.additionalComments}\n\n`;
    }

    output += `DISCLAIMER: ${result.redTeamDisclaimer}\n`;

    try {
      await navigator.clipboard.writeText(output);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2500);
    } catch (e) {
      console.warn('Copy failed:', e);
    }
  };

  // Copy single section
  const handleCopySection = async (sectionName: string) => {
    const sec = result.sections?.find((s) => s.name === sectionName);
    if (!sec) return;

    let output = `--- ${sec.name.toUpperCase()} ---\n`;
    sec.statements?.forEach((st, idx) => {
      output += `• (${st.charCount} chars) ${st.statement}\n`;
    });

    try {
      await navigator.clipboard.writeText(output);
      setCopiedSectionName(sectionName);
      setTimeout(() => setCopiedSectionName(null), 2000);
    } catch (e) {
      console.warn('Section copy failed:', e);
    }
  };

  // Update a single statement
  const handleUpdateStatement = (updatedStatement: StatementItem) => {
    const updatedSections = result.sections.map((sec) => ({
      ...sec,
      statements: sec.statements.map((st) => (st.id === updatedStatement.id ? updatedStatement : st))
    }));
    onUpdateResult({ ...result, sections: updatedSections });
  };

  // Delete a statement
  const handleDeleteStatement = (id: string) => {
    const updatedSections = result.sections.map((sec) => ({
      ...sec,
      statements: sec.statements.filter((st) => st.id !== id)
    }));
    onUpdateResult({ ...result, sections: updatedSections });
  };

  // Update duty description
  const handleUpdateDutyDescription = (newText: string) => {
    onUpdateResult({
      ...result,
      dutyDescription: newText,
      dutyDescriptionCharCount: newText.length
    });
  };

  // Apply metric replacement from modal
  const handleApplyMetric = async (
    statement: StatementItem,
    placeholder: string,
    value: string,
    shouldRefine: boolean
  ) => {
    if (shouldRefine) {
      await onRefineSingleStatement(statement, 'replace_placeholder', value);
    } else {
      const newText = statement.statement.replace(placeholder, value);
      const remainingPlaceholders = statement.placeholders.filter((p) => p !== placeholder);
      handleUpdateStatement({
        ...statement,
        statement: newText,
        charCount: newText.length,
        placeholders: remainingPlaceholders
      });
    }
  };

  return (
    <div id="workspace-screen" className="space-y-6 max-w-5xl mx-auto pb-20 transition-colors duration-200">
      {/* Quick Action Navigation Bar */}
      <div id="workspace-top-bar" className="sticky top-0 z-40 theme-bg-header backdrop-blur-md border-b theme-border-subtle py-3 -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex items-center justify-between flex-wrap gap-2">
          {/* Back & Title */}
          <div className="flex items-center gap-2">
            <button
              id="back-to-setup-btn"
              type="button"
              onClick={onBackToSetup}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg theme-bg-card border theme-border hover:border-[var(--theme-accent)] text-xs font-mono theme-text-muted hover:theme-text-main transition-colors cursor-pointer shadow-sm"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Setup</span>
            </button>

            <div className="hidden sm:flex items-center gap-2">
              <span className="font-military font-bold text-xs uppercase px-2 py-0.5 rounded theme-badge-accent">
                {result.productType}
              </span>
              <span className="text-xs font-mono theme-text-muted">
                {result.rankGrade} • {result.afsc}
              </span>
            </div>
          </div>

          {/* Quick Buttons */}
          <div className="flex items-center gap-2">
            <button
              id="murderboard-review-top-btn"
              type="button"
              onClick={() => {
                setActiveTab('murderboard');
                if (!result.murderboardReview) {
                  onTriggerMurderboard();
                }
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-military font-bold uppercase tracking-wider border transition-all cursor-pointer shadow-sm ${
                activeTab === 'murderboard'
                  ? 'bg-red-500/20 border-red-500 text-red-500 dark:text-red-300'
                  : 'theme-bg-card theme-border hover:border-red-500/50 theme-text-muted hover:text-red-500'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-red-500" />
              <span>Murderboard Review</span>
            </button>

            <button
              id="improve-regenerate-top-btn"
              type="button"
              onClick={onImproveOrRegenerate}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg theme-btn-primary text-xs font-military font-bold uppercase tracking-wider transition-all shadow-sm cursor-pointer hover:opacity-95"
            >
              {isLoading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              <span>Regenerate</span>
            </button>

            <button
              id="copy-all-package-btn"
              type="button"
              onClick={handleCopyAll}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all border cursor-pointer shadow-sm ${
                copiedAll
                  ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-emerald-500/50'
                  : 'theme-bg-card theme-border hover:border-[var(--theme-accent)] theme-text-main'
              }`}
            >
              {copiedAll ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Copied All</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 opacity-70" />
                  <span>Copy All</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Partial / Hard-Gate Warning if critical fields were omitted */}
      {result.isPartialOrganizationOnly && (
        <div id="partial-org-warning" className="p-4 rounded-xl border border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-200 text-xs space-y-1">
          <div className="flex items-center gap-2 font-military font-bold text-sm uppercase text-amber-600 dark:text-amber-300">
            <AlertTriangle className="w-4 h-4" />
            <span>Hard Gate: Preliminary Organization Mode</span>
          </div>
          <p className="theme-text-muted leading-relaxed font-mono">
            Critical evaluation fields were missing ({result.missingRequiredFields?.join(', ')}). The engine has structured raw notes and identified gaps without finalizing board-ready statements. Provide all required fields on Setup to finalize.
          </p>
        </div>
      )}

      {/* Prior Evaluations Warning if missing */}
      {result.priorRecordsWarningMessage && (
        <div id="progression-warning-box" className="p-3 rounded-lg border theme-border theme-bg-card text-xs theme-text-muted flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <span className="font-mono text-[11px] leading-relaxed">
            {result.priorRecordsWarningMessage}
          </span>
        </div>
      )}

      {/* 1. BLUF & CALIBRATION SUMMARY CARD */}
      <div id="workspace-bluf-card" className="rounded-xl border theme-border theme-bg-card p-4 sm:p-5 space-y-3 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-2 border-b theme-border-subtle pb-2.5">
          <div className="flex items-center gap-2">
            <span className="font-military font-bold text-sm theme-text-main uppercase tracking-wide flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--theme-accent)]"></span>
              1. BLUF / Calibration Summary
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="theme-text-muted">{allStatements.length} statements</span>
            <span className="theme-text-subtle">•</span>
            <span className="text-emerald-500 font-semibold">{sweetSpotCount} sweet-spot</span>
            {totalPlaceholders > 0 && (
              <>
                <span className="theme-text-subtle">•</span>
                <span className="text-[var(--theme-accent)] font-bold">{totalPlaceholders} metrics needed</span>
              </>
            )}
          </div>
        </div>

        <p className="text-xs sm:text-sm theme-text-main font-mono leading-relaxed theme-bg-subtle p-3.5 rounded-lg border theme-border-subtle">
          {result.blufSummary}
        </p>

        {/* Member Context strip if present */}
        {(formData.name || formData.dutyTitle || formData.unit || formData.ratingPeriod) && (
          <div className="flex flex-wrap gap-2 pt-1 text-[11px] font-mono theme-text-muted">
            {formData.name && <span className="theme-bg-subtle px-2 py-0.5 rounded border theme-border-subtle">Member: <strong className="theme-text-main">{formData.name}</strong></span>}
            {formData.dutyTitle && <span className="theme-bg-subtle px-2 py-0.5 rounded border theme-border-subtle">Duty: <strong className="theme-text-main">{formData.dutyTitle}</strong></span>}
            {formData.unit && <span className="theme-bg-subtle px-2 py-0.5 rounded border theme-border-subtle">Unit: <strong className="theme-text-main">{formData.unit}</strong></span>}
            {formData.ratingPeriod && <span className="theme-bg-subtle px-2 py-0.5 rounded border theme-border-subtle">Period: <strong className="theme-text-main">{formData.ratingPeriod}</strong></span>}
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div id="workspace-tabs-container" className="flex items-center gap-1.5 border-b theme-border-subtle pb-2 overflow-x-auto">
        {[
          { id: 'all', label: 'Full Package', count: allStatements.length },
          { id: 'statements', label: 'Statements by MGA', count: allStatements.length },
          { id: 'duty', label: 'Duty Description', count: result.dutyDescription ? 1 : 0 },
          { id: 'issues', label: 'Key Issues & Audit', count: result.keyIssues?.length || 0 },
          { id: 'murderboard', label: '4-Chief Murderboard', count: result.murderboardReview ? '10/10' : 'Sim' },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`tab-btn-${tab.id}`}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-2 rounded-lg text-xs font-military font-bold uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                isActive
                  ? 'theme-badge-accent border-[var(--theme-accent)] shadow-sm'
                  : 'theme-bg-card theme-text-muted hover:theme-text-main hover:border-[var(--theme-border-subtle)] border border-transparent'
              }`}
            >
              <span>{tab.label}</span>
              <span className="text-[10px] font-mono opacity-80 px-1 py-0.2 rounded theme-bg-subtle">
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT: ALL OR STATEMENTS */}
      {(activeTab === 'all' || activeTab === 'statements') && (
        <div className="space-y-6">
          {/* Duty Description on 'all' view */}
          {activeTab === 'all' && result.dutyDescription && (
            <div className="space-y-2">
              <DutyDescriptionCard
                dutyDescription={result.dutyDescription}
                charCount={result.dutyDescriptionCharCount}
                onUpdateDutyDescription={handleUpdateDutyDescription}
              />
            </div>
          )}

          {/* Section Statements */}
          <div className="space-y-6">
            {result.sections?.map((section, sIdx) => {
              const isSectionCopied = copiedSectionName === section.name;

              return (
                <div
                  key={section.name || sIdx}
                  id={`section-block-${sIdx}`}
                  className="space-y-3 pt-2"
                >
                  {/* Section Header */}
                  <div className="flex items-center justify-between flex-wrap gap-2 border-b theme-border-subtle pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[var(--theme-accent)]"></span>
                      <h3 className="font-military font-bold text-sm sm:text-base theme-text-main uppercase tracking-wider">
                        {section.name}
                      </h3>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded theme-badge-neutral">
                        {section.statements?.length || 0} statement{section.statements?.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    <button
                      id={`copy-section-btn-${sIdx}`}
                      type="button"
                      onClick={() => handleCopySection(section.name)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-mono font-semibold transition-all border cursor-pointer ${
                        isSectionCopied
                          ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-emerald-500/40'
                          : 'theme-bg-card theme-border hover:border-[var(--theme-accent)] theme-text-muted hover:theme-text-main'
                      }`}
                    >
                      {isSectionCopied ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-500" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 opacity-70" />
                          <span>Copy Section</span>
                        </>
                      )}
                    </button>
                  </div>

                  {section.description && (
                    <p className="text-xs theme-text-muted font-mono">
                      {section.description}
                    </p>
                  )}

                  {/* Statement Cards */}
                  <div className="space-y-3">
                    {section.statements?.map((statement) => (
                      <StatementCard
                        key={statement.id}
                        statement={statement}
                        charLimit={result.charLimit}
                        onUpdateStatement={handleUpdateStatement}
                        onRefineStatement={(st, action) => onRefineSingleStatement(st, action)}
                        onOpenPlaceholderModal={(st, placeholder) =>
                          setActivePlaceholderTarget({ statement: st, placeholder })
                        }
                        onDeleteStatement={handleDeleteStatement}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Additional Comments if present */}
          {result.additionalComments && (
            <div id="additional-comments-box" className="p-4 rounded-xl border theme-border theme-bg-card space-y-1.5">
              <span className="text-xs font-military font-bold uppercase theme-text-main">
                Board Advisor / Additional Comments:
              </span>
              <p className="text-xs font-mono theme-text-muted leading-relaxed">
                {result.additionalComments}
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: DUTY DESCRIPTION ONLY */}
      {activeTab === 'duty' && (
        <div className="space-y-4">
          <DutyDescriptionCard
            dutyDescription={result.dutyDescription || ''}
            charCount={result.dutyDescriptionCharCount}
            onUpdateDutyDescription={handleUpdateDutyDescription}
          />
        </div>
      )}

      {/* TAB CONTENT: KEY ISSUES & RED-TEAM AUDIT */}
      {(activeTab === 'all' || activeTab === 'issues') && (
        <div className="pt-4 border-t theme-border-subtle">
          <KeyIssuesView issues={result.keyIssues} />
        </div>
      )}

      {/* TAB CONTENT: 4-CHIEF MURDERBOARD */}
      {(activeTab === 'all' || activeTab === 'murderboard') && (
        <div className="pt-4 border-t theme-border-subtle">
          <MurderboardView
            murderboard={result.murderboardReview}
            murderboardRisks={result.murderboardRisks}
            onTriggerMurderboard={onTriggerMurderboard}
            isLoading={isLoading}
          />
        </div>
      )}

      {/* INTERACTIVE NEXT STEPS BAR */}
      {result.nextSteps && result.nextSteps.length > 0 && (
        <div className="pt-4 border-t theme-border-subtle">
          <NextStepsBar
            steps={result.nextSteps}
            onSelectStep={onExecuteNextStep}
            isLoading={isLoading}
          />
        </div>
      )}

      {/* RED-TEAM MANDATORY DISCLAIMER FOOTER */}
      <div id="red-team-disclaimer-footer" className="p-4 rounded-xl border theme-border theme-bg-card text-center space-y-1">
        <span className="text-[10px] font-mono uppercase tracking-widest theme-text-subtle font-bold block">
          Board Red-Team Directive
        </span>
        <p className="text-xs font-mono text-[var(--theme-accent)] font-semibold">
          "{result.redTeamDisclaimer || 'Validate all metrics, causal claims, and external facts before submission.'}"
        </p>
      </div>

      {/* Placeholder replacement modal */}
      <PlaceholderModal
        isOpen={Boolean(activePlaceholderTarget.statement)}
        statement={activePlaceholderTarget.statement}
        placeholder={activePlaceholderTarget.placeholder}
        onClose={() => setActivePlaceholderTarget({ statement: null, placeholder: '' })}
        onApplyMetric={handleApplyMetric}
      />
    </div>
  );
};
