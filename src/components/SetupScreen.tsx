import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Award, 
  Sparkles, 
  RotateCcw, 
  FolderArchive, 
  ShieldAlert, 
  AlertCircle, 
  BookOpen, 
  ChevronDown, 
  ChevronUp, 
  Check, 
  SlidersHorizontal,
  Flame,
  Shield,
  Layers,
  HelpCircle
} from 'lucide-react';
import { FormData, ProductType, WorkMode } from '../types';
import { SAMPLE_PRESETS, SamplePreset } from '../utils/sampleData';
import { detectSensitiveData } from '../utils/sanitizer';

interface SetupScreenProps {
  formData: FormData;
  onChange: (data: Partial<FormData>) => void;
  onStart: () => void;
  onClear: () => void;
  onOpenSavedDrafts: () => void;
  isLoading?: boolean;
}

const COMMON_RANKS = [
  'A1C / E-3',
  'SrA / E-4',
  'SSgt / E-5',
  'TSgt / E-6',
  'MSgt / E-7',
  'SMSgt / E-8',
  'CMSgt / E-9',
  '2d Lt / O-1',
  '1st Lt / O-2',
  'Capt / O-3',
  'Maj / O-4',
  'Lt Col / O-5',
  'Col / O-6',
];

const COMMON_AFSCS = [
  '1D771Q / Cyber Defense Ops',
  '2A373 / Tactical Aircraft Maint',
  '3F071 / Personnel',
  '14N / Intelligence',
  '3P071 / Security Forces',
  '4N071 / Aerospace Medical',
  '2S071 / Materiel Management',
  '1N071 / All-Source Intel',
  '2W171 / Aircraft Armament',
  '1C371 / Command Post',
];

export const SetupScreen: React.FC<SetupScreenProps> = ({
  formData,
  onChange,
  onStart,
  onClear,
  onOpenSavedDrafts,
  isLoading = false
}) => {
  const [showOptionalFields, setShowOptionalFields] = useState(
    Boolean(formData.name || formData.dutyTitle || formData.unit || formData.ratingPeriod)
  );
  const [showPriorRecords, setShowPriorRecords] = useState(Boolean(formData.priorEvaluations));
  const [showSamplePicker, setShowSamplePicker] = useState(false);

  // Check required validation
  const validationGaps = useMemo(() => {
    const gaps: string[] = [];
    if (!formData.productType) gaps.push('Product type');
    if (!formData.rankGrade?.trim()) gaps.push('Rank/grade');
    if (!formData.afsc?.trim()) gaps.push('AFSC or duty area');
    if (!formData.charLimit || formData.charLimit <= 0) gaps.push('Character limit');
    return gaps;
  }, [formData.productType, formData.rankGrade, formData.afsc, formData.charLimit]);

  const hasRequiredFields = validationGaps.length === 0;

  // Sensitive data check on raw notes
  const notesCheck = useMemo(() => {
    return detectSensitiveData(formData.rawNotes + ' ' + (formData.priorEvaluations || ''));
  }, [formData.rawNotes, formData.priorEvaluations]);

  const handleProductTypeChange = (type: ProductType) => {
    let defaultLimit = 350;
    if (type === '1206') defaultLimit = 250;
    onChange({ productType: type, charLimit: defaultLimit });
  };

  const handleLoadSample = (sample: SamplePreset) => {
    onChange(sample.data);
    setShowSamplePicker(false);
    if (sample.data.priorEvaluations) {
      setShowPriorRecords(true);
    }
    if (sample.data.name || sample.data.dutyTitle) {
      setShowOptionalFields(true);
    }
  };

  return (
    <div id="setup-screen" className="space-y-6 max-w-4xl mx-auto pb-12 transition-colors duration-200">
      {/* App Headline / Introduction */}
      <div id="setup-header" className="space-y-2 text-center sm:text-left">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="theme-badge-accent px-2.5 py-0.5 rounded text-xs font-mono font-bold tracking-wider uppercase">
              USAF Evaluation Engine
            </span>
            <span className="theme-text-subtle text-xs font-mono">
              DAF Form 910 / 911 / 1206
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="load-sample-toggle-btn"
              type="button"
              onClick={() => setShowSamplePicker(!showSamplePicker)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg theme-bg-card border theme-border hover:border-[var(--theme-accent)] text-xs theme-text-muted hover:theme-text-main transition-all font-mono shadow-sm cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[var(--theme-accent)]" />
              <span>Load Preset Sample</span>
            </button>

            <button
              id="open-saved-drafts-btn"
              type="button"
              onClick={onOpenSavedDrafts}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg theme-bg-card border theme-border hover:border-[var(--theme-accent)] text-xs theme-text-muted hover:theme-text-main transition-all font-mono shadow-sm cursor-pointer"
            >
              <FolderArchive className="w-3.5 h-3.5 opacity-70" />
              <span>Saved Drafts</span>
            </button>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-military font-bold tracking-wide theme-text-main uppercase pt-1">
          EPB / OPB / 1206 Architect
        </h1>
        <p className="theme-text-muted text-xs sm:text-sm leading-relaxed max-w-2xl">
          Transform raw accomplishment notes into board-calibrated evaluation statements tightened to strict character windows with integrated 4-Chief murderboard simulation.
        </p>
      </div>

      {/* Sample Picker Drawer */}
      {showSamplePicker && (
        <div id="sample-presets-drawer" className="theme-bg-card border theme-border rounded-xl p-4 space-y-3 shadow-xl animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <span className="font-military font-bold text-[var(--theme-accent)] text-sm tracking-wider uppercase flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" /> Select Sample Evaluation Package
            </span>
            <button
              id="close-sample-picker-btn"
              type="button"
              onClick={() => setShowSamplePicker(false)}
              className="theme-text-muted hover:theme-text-main text-xs font-mono cursor-pointer"
            >
              Close
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {SAMPLE_PRESETS.map((sample) => (
              <button
                key={sample.id}
                id={`sample-btn-${sample.id}`}
                type="button"
                onClick={() => handleLoadSample(sample)}
                className="text-left p-3 rounded-lg theme-bg-subtle border theme-border-subtle hover:border-[var(--theme-accent)] transition-all group cursor-pointer"
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-bold text-xs theme-text-main group-hover:text-[var(--theme-accent)]">
                    {sample.name}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded theme-badge-neutral">
                    {sample.badge}
                  </span>
                </div>
                <p className="text-[11px] theme-text-muted line-clamp-2">
                  {sample.description}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Form Container */}
      <form
        id="epb-setup-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (!notesCheck.isSensitive) {
            onStart();
          }
        }}
        className="space-y-5"
      >
        {/* 1. REQUIRED FIELDS SECTION */}
        <div id="required-fields-section" className="theme-bg-card border theme-border rounded-xl p-4 sm:p-5 space-y-5 shadow-sm">
          <div className="flex items-center justify-between border-b theme-border-subtle pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--theme-accent)]"></span>
              <h2 className="font-military font-bold text-sm tracking-wider uppercase theme-text-main">
                1. Required Evaluation Criteria
              </h2>
            </div>
            <span className="text-[11px] font-mono theme-text-subtle">
              * Required for statement calibration
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Product Type */}
            <div id="field-product-type" className="space-y-1.5">
              <label className="block text-xs font-mono font-semibold uppercase theme-text-muted">
                Product Type <span className="text-[var(--theme-accent)]">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['EPB', 'OPB', '1206'] as ProductType[]).map((type) => {
                  const isSelected = formData.productType === type;
                  return (
                    <button
                      key={type}
                      id={`product-type-btn-${type.toLowerCase()}`}
                      type="button"
                      onClick={() => handleProductTypeChange(type)}
                      className={`h-11 rounded-lg border text-xs font-military font-bold tracking-wider uppercase transition-all flex flex-col items-center justify-center cursor-pointer ${
                        isSelected
                          ? 'theme-badge-accent shadow-sm border-[var(--theme-accent)]'
                          : 'theme-bg-subtle theme-border-subtle theme-text-muted hover:theme-text-main hover:border-[var(--theme-border)]'
                      }`}
                    >
                      <span>{type}</span>
                      <span className="text-[9px] font-mono font-normal opacity-75">
                        {type === 'EPB' ? 'Enlisted' : type === 'OPB' ? 'Officer' : 'Award'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Rank / Grade */}
            <div id="field-rank-grade" className="space-y-1.5">
              <label htmlFor="rank-grade-input" className="block text-xs font-mono font-semibold uppercase theme-text-muted">
                Rank / Grade <span className="text-[var(--theme-accent)]">*</span>
              </label>
              <input
                id="rank-grade-input"
                type="text"
                value={formData.rankGrade}
                onChange={(e) => onChange({ rankGrade: e.target.value })}
                placeholder="e.g. TSgt / E-6, Capt / O-3, SSgt"
                list="rank-presets"
                required
                className="w-full h-11 px-3 theme-input rounded-lg text-sm font-mono"
              />
              <datalist id="rank-presets">
                {COMMON_RANKS.map((r) => (
                  <option key={r} value={r} />
                ))}
              </datalist>
              <div className="flex gap-1.5 flex-wrap pt-0.5">
                {['SrA', 'SSgt', 'TSgt', 'MSgt', 'Capt', 'Maj'].map((quickRank) => (
                  <button
                    key={quickRank}
                    id={`quick-rank-${quickRank.toLowerCase()}`}
                    type="button"
                    onClick={() => onChange({ rankGrade: quickRank })}
                    className="text-[10px] font-mono px-2 py-0.5 rounded theme-bg-subtle border theme-border-subtle theme-text-muted hover:theme-text-main hover:border-[var(--theme-accent)] transition-colors cursor-pointer"
                  >
                    {quickRank}
                  </button>
                ))}
              </div>
            </div>

            {/* AFSC or Duty Area */}
            <div id="field-afsc" className="space-y-1.5">
              <label htmlFor="afsc-input" className="block text-xs font-mono font-semibold uppercase theme-text-muted">
                AFSC or Duty Area <span className="text-[var(--theme-accent)]">*</span>
              </label>
              <input
                id="afsc-input"
                type="text"
                value={formData.afsc}
                onChange={(e) => onChange({ afsc: e.target.value })}
                placeholder="e.g. 1D771Q (Cyber), 2A373 (Maint), 14N (Intel)"
                list="afsc-presets"
                required
                className="w-full h-11 px-3 theme-input rounded-lg text-sm font-mono"
              />
              <datalist id="afsc-presets">
                {COMMON_AFSCS.map((a) => (
                  <option key={a} value={a} />
                ))}
              </datalist>
            </div>

            {/* Character Limit */}
            <div id="field-char-limit" className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="char-limit-input" className="block text-xs font-mono font-semibold uppercase theme-text-muted">
                  Character Limit (Hard) <span className="text-[var(--theme-accent)]">*</span>
                </label>
                <span className="text-[10px] font-mono text-[var(--theme-accent)] font-semibold">
                  Target: {Math.round(formData.charLimit * 0.92)}–{Math.round(formData.charLimit * 0.98)} chars
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="char-limit-input"
                  type="number"
                  min="50"
                  max="1000"
                  value={formData.charLimit}
                  onChange={(e) => onChange({ charLimit: parseInt(e.target.value) || 350 })}
                  required
                  className="w-28 h-11 px-3 theme-input rounded-lg text-sm font-mono"
                />
                <div className="flex gap-1.5 flex-1">
                  {[350, 250, 450].map((limit) => (
                    <button
                      key={limit}
                      id={`preset-limit-${limit}`}
                      type="button"
                      onClick={() => onChange({ charLimit: limit })}
                      className={`flex-1 h-11 rounded-lg border text-xs font-mono transition-all cursor-pointer ${
                        formData.charLimit === limit
                          ? 'theme-badge-accent font-bold border-[var(--theme-accent)]'
                          : 'theme-bg-subtle theme-border-subtle theme-text-muted hover:theme-text-main'
                      }`}
                    >
                      {limit} <span className="text-[9px] block opacity-70">{limit === 350 ? 'EPB/OPB' : limit === 250 ? '1206' : 'Duty'}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Work Mode */}
          <div id="field-work-mode" className="space-y-2 pt-2 border-t theme-border-subtle">
            <label className="block text-xs font-mono font-semibold uppercase theme-text-muted">
              Work Mode <span className="text-[var(--theme-accent)]">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'full', label: 'Full EPB / Form', desc: 'All 4 MGAs + Duty Description' },
                { id: 'individual', label: 'Individual Statements', desc: 'Focus & calibrate single bullets' },
                { id: 'organize', label: 'Organize Only', desc: 'Map raw notes to sections' },
                { id: 'murderboard', label: 'Murderboard Review', desc: '4-Chief critical red-team' },
              ].map((mode) => {
                const isSelected = formData.workMode === mode.id;
                return (
                  <button
                    key={mode.id}
                    id={`work-mode-btn-${mode.id}`}
                    type="button"
                    onClick={() => onChange({ workMode: mode.id as WorkMode })}
                    className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'theme-badge-accent border-[var(--theme-accent)] shadow-sm'
                        : 'theme-bg-subtle theme-border-subtle theme-text-muted hover:theme-text-main hover:border-[var(--theme-border)]'
                    }`}
                  >
                    <div className="font-military font-bold text-xs uppercase flex items-center justify-between mb-0.5">
                      <span>{mode.label}</span>
                      {isSelected && <Check className="w-3 h-3 text-[var(--theme-accent)]" />}
                    </div>
                    <p className="text-[10px] theme-text-subtle leading-tight">
                      {mode.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 2. OPTIONAL MEMBER CONTEXT (COLLAPSIBLE) */}
        <div id="optional-fields-accordion" className="theme-bg-card border theme-border rounded-xl p-4 sm:p-5 space-y-4 shadow-sm">
          <button
            id="toggle-optional-fields-btn"
            type="button"
            onClick={() => setShowOptionalFields(!showOptionalFields)}
            className="w-full flex items-center justify-between text-left cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full theme-text-subtle opacity-50 bg-current"></span>
              <h2 className="font-military font-bold text-sm tracking-wider uppercase theme-text-main">
                2. Member & Unit Details <span className="theme-text-subtle font-normal text-xs">(Optional)</span>
              </h2>
            </div>
            <div className="flex items-center gap-1.5 text-xs theme-text-muted font-mono">
              <span>{showOptionalFields ? 'Hide' : 'Expand'}</span>
              {showOptionalFields ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>

          {showOptionalFields && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t theme-border-subtle">
              <div className="space-y-1.5">
                <label htmlFor="member-name-input" className="block text-xs font-mono theme-text-muted">
                  Member Name
                </label>
                <input
                  id="member-name-input"
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => onChange({ name: e.target.value })}
                  placeholder="e.g. TSgt Marcus Vance"
                  className="w-full h-10 px-3 theme-input rounded-lg text-sm font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="duty-title-input" className="block text-xs font-mono theme-text-muted">
                  Duty Title
                </label>
                <input
                  id="duty-title-input"
                  type="text"
                  value={formData.dutyTitle || ''}
                  onChange={(e) => onChange({ dutyTitle: e.target.value })}
                  placeholder="e.g. Section Chief, Cyber Defense Operations"
                  className="w-full h-10 px-3 theme-input rounded-lg text-sm font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="unit-input" className="block text-xs font-mono theme-text-muted">
                  Unit / Organization
                </label>
                <input
                  id="unit-input"
                  type="text"
                  value={formData.unit || ''}
                  onChange={(e) => onChange({ unit: e.target.value })}
                  placeholder="e.g. 38th Cyberspace Squadron / 16th AF"
                  className="w-full h-10 px-3 theme-input rounded-lg text-sm font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="rating-period-input" className="block text-xs font-mono theme-text-muted">
                  Rating Period
                </label>
                <input
                  id="rating-period-input"
                  type="text"
                  value={formData.ratingPeriod || ''}
                  onChange={(e) => onChange({ ratingPeriod: e.target.value })}
                  placeholder="e.g. 1 Apr 2025 – 31 Mar 2026"
                  className="w-full h-10 px-3 theme-input rounded-lg text-sm font-mono"
                />
              </div>
            </div>
          )}
        </div>

        {/* 3. PRIOR EVALUATIONS SECTION */}
        <div id="prior-evaluations-section" className="theme-bg-card border theme-border rounded-xl p-4 sm:p-5 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${formData.priorEvaluations?.trim() ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              <h2 className="font-military font-bold text-sm tracking-wider uppercase theme-text-main">
                3. Prior Evaluations & Progression Benchmark
              </h2>
            </div>
            <button
              id="toggle-prior-records-btn"
              type="button"
              onClick={() => setShowPriorRecords(!showPriorRecords)}
              className="text-xs font-mono theme-text-muted hover:theme-text-main flex items-center gap-1 cursor-pointer"
            >
              <span>{showPriorRecords ? 'Collapse' : 'Add Prior Records'}</span>
              {showPriorRecords ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {/* Warning when no prior records exist */}
          {!formData.priorEvaluations?.trim() && (
            <div
              id="progression-degraded-warning"
              className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-300 text-xs flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold font-military tracking-wide uppercase text-[11px]">
                  Progression Calibration Alert
                </p>
                <p className="theme-text-muted leading-relaxed text-xs">
                  Progression assessment is degraded without prior records. Providing your last 1–2 evaluations allows the engine to highlight career growth.
                </p>
              </div>
            </div>
          )}

          {showPriorRecords && (
            <div className="space-y-1.5 pt-2">
              <label htmlFor="prior-evals-textarea" className="block text-xs font-mono theme-text-muted">
                Paste excerpts from previous EPRs / EPBs / OPRs to benchmark growth and avoid recycled impacts:
              </label>
              <textarea
                id="prior-evals-textarea"
                rows={3}
                value={formData.priorEvaluations || ''}
                onChange={(e) => onChange({ priorEvaluations: e.target.value })}
                placeholder="e.g. EPR 2024: Led 5-member team on firewall upgrade. Resolved 420 tickets, awarded Wing NCO of Quarter Q3. Scope was limited to local base."
                className="w-full p-3 theme-input rounded-lg text-xs font-mono leading-relaxed resize-y"
              />
            </div>
          )}
        </div>

        {/* 4. RAW NOTES & ACCOMPLISHMENTS SECTION */}
        <div id="raw-notes-section" className="theme-bg-card border theme-border rounded-xl p-4 sm:p-5 space-y-3 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--theme-accent)]"></span>
              <h2 className="font-military font-bold text-sm tracking-wider uppercase theme-text-main">
                4. Raw Accomplishments / Brag Sheet
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono theme-text-muted">
              <span>{formData.rawNotes?.length || 0} chars</span>
              <span>•</span>
              <span>{formData.rawNotes ? formData.rawNotes.trim().split(/\s+/).filter(Boolean).length : 0} words</span>
            </div>
          </div>

          <p className="text-xs theme-text-muted">
            Paste rough bullets, statistics, mission impact, or unformatted logs. The engine will structure them into board-ready statements and identify missing metrics with <span className="font-mono text-[var(--theme-accent)] font-semibold">[INSERT METRIC]</span> placeholders.
          </p>

          <textarea
            id="raw-notes-textarea"
            rows={8}
            value={formData.rawNotes || ''}
            onChange={(e) => onChange({ rawNotes: e.target.value })}
            placeholder="Paste your unformatted accomplishment notes, statistics, awards, and duties here...

Example:
- Led response to major zero-day cyber attack across 3 wings, isolated 14 hosts in 2 hours
- Wrote python automation tool that saved 40% daily triage time for 12 crew members
- Supervised 8 Airmen, 2 finished CCAF degrees
- Managed $1.8M equipment account with 0 discrepancies on IG inspection"
            className="w-full p-3.5 theme-input rounded-xl text-xs sm:text-sm font-mono leading-relaxed resize-y"
          />

          {/* Hard Gate Guidance Notice */}
          {!hasRequiredFields && (
            <div id="hard-gate-notice" className="p-3 rounded-lg theme-bg-subtle border theme-border text-xs flex items-start gap-2">
              <SlidersHorizontal className="w-4 h-4 text-[var(--theme-accent)] shrink-0 mt-0.5" />
              <div>
                <p className="font-military font-bold uppercase text-[var(--theme-accent)] text-[11px]">
                  Hard Gate Status (Missing: {validationGaps.join(', ')})
                </p>
                <p className="theme-text-muted text-[11px]">
                  If critical fields are omitted, the engine will organize raw notes and identify gaps rather than finalizing board statements.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 5. ACTION BUTTONS */}
        <div id="setup-action-buttons" className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          <button
            id="clear-form-btn"
            type="button"
            onClick={onClear}
            className="h-12 px-5 rounded-xl theme-bg-card border theme-border hover:border-red-500/50 text-zinc-400 hover:text-red-400 transition-colors text-xs font-mono font-bold flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Clear Form</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              id="start-drafting-btn"
              type="submit"
              disabled={isLoading || notesCheck.isSensitive}
              className={`w-full sm:w-auto h-12 px-8 rounded-xl font-military font-bold text-sm tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-2.5 cursor-pointer ${
                notesCheck.isSensitive
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-red-500/40'
                  : 'theme-btn-primary hover:opacity-95 active:scale-[0.99]'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  <span>Calibrating Board Package...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Start Drafting & Calibrate</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
