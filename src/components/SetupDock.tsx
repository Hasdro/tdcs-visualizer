import React, { useMemo, useState } from 'react';
import {
  ArrowLeftRight,
  ChevronDown,
  BookOpen,
  Grid,
  MapPin,
  Sparkles,
  Target,
  Zap
} from 'lucide-react';
import { CLINICAL_PRESETS, ClinicalPreset } from '../data/clinical_presets';
import { BRAIN_NODES } from '../data/brain_nodes';
import { BiophysicalTelemetry } from '../utils/biophysicsEngine';
import { MontageUrlState } from '../hooks/useUrlMontageState';
import { EvidenceBadge } from './ui/EvidenceBadge';
import { ScalpTopomap1020 } from './visuals/ScalpTopomap1020';
import { ActiveCircuitLiveWire } from './visuals/ActiveCircuitLiveWire';
import { CurrentIntensityAmmeter } from './visuals/CurrentIntensityAmmeter';
import { SessionRampChronometer } from './visuals/SessionRampChronometer';
import { getPadPlacement } from './visuals/PatientPadGuide';

interface SetupDockProps {
  montageState: MontageUrlState;
  updateMontageState: (partial: Partial<MontageUrlState>) => void;
  currentPreset?: ClinicalPreset;
  telemetry: BiophysicalTelemetry;
  surroundNodes?: string[];
  onSelectPreset: (preset: ClinicalPreset) => void;
  onSelectNode: (nodeId: string, polarity: 'anode' | 'cathode') => void;
  onFlipPolarity: () => void;
  onOpenMatrix: () => void;
  /** Montage = indication and electrode sites; dose = current, time and pads. */
  view: 'montage' | 'dose';
}

type DockSectionId = 'preset' | 'compass' | 'dosage';

const CATEGORY_ORDER: ClinicalPreset['category'][] = [
  'Mood / Executive',
  'Cognitive / Attention',
  'Motor / Rehab',
  'Language / Speech',
  'Sensory / Visual',
  'HD-tDCS Focal'
];

export const SetupDock: React.FC<SetupDockProps> = ({
  montageState,
  updateMontageState,
  currentPreset,
  telemetry,
  surroundNodes,
  onSelectPreset,
  onSelectNode,
  onFlipPolarity,
  onOpenMatrix,
  view
}) => {
  const [openSections, setOpenSections] = useState<Record<DockSectionId, boolean>>({
    preset: true,
    compass: true,
    dosage: true
  });

  const toggleSection = (id: DockSectionId) =>
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));

  const groupedPresets = useMemo(() => {
    return CATEGORY_ORDER.map((category) => ({
      category,
      presets: CLINICAL_PRESETS.filter((preset) => preset.category === category)
    })).filter((group) => group.presets.length > 0);
  }, []);

  const protocolCopy = currentPreset
    ? currentPreset.clinicalPurpose
    : 'Custom electrode placement. Pick a clinical preset to load an evidence-backed protocol.';

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto">
        {view === 'montage' && (
        <>
        {/* 1 · Indication & preset */}
        <DockSection
          step="1"
          title="Indication & preset"
          subtitle="Evidence-backed starting point"
          open={openSections.preset}
          onToggle={() => toggleSection('preset')}
        >
          <>
              <div>
                <label htmlFor="preset-select" className="field-label">
                  Target indication
                </label>
                <select
                  id="preset-select"
                  value={currentPreset?.id ?? ''}
                  onChange={(event) => {
                    const preset = CLINICAL_PRESETS.find((item) => item.id === event.target.value);
                    if (preset) onSelectPreset(preset);
                  }}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-2 text-[14px] text-slate-200 outline-none transition focus:border-cyan-500/70"
                >
                  <option value="">Custom montage</option>
                  {groupedPresets.map((group) => (
                    <optgroup key={group.category} label={group.category}>
                      {group.presets.map((preset) => (
                        <option key={preset.id} value={preset.id}>
                          {preset.shortLabel.replace(/^[^\w]+\s*/, '')} · {preset.anode}/{preset.cathode}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 text-[14.5px] font-semibold leading-snug text-slate-100">
                    {currentPreset?.name ?? 'Custom montage'}
                  </div>
                  {currentPreset ? (
                    <EvidenceBadge level={currentPreset.evidenceLevel} />
                  ) : (
                    <span className="shrink-0 rounded-md border border-slate-700 bg-slate-900 px-1.5 py-0.5 text-[13px] text-slate-400">
                      Custom
                    </span>
                  )}
                </div>

                <div className="mt-2 flex items-center gap-1.5 font-mono text-[14px]">
                  <span className="rounded border border-rose-500/30 bg-rose-500/10 px-1.5 py-0.5 font-semibold text-rose-300">
                    {montageState.anode} +
                  </span>
                  <span className="text-slate-600">→</span>
                  <span className="rounded border border-cyan-500/30 bg-cyan-500/10 px-1.5 py-0.5 font-semibold text-cyan-300">
                    {montageState.mode === 'hd4x1' ? 'HD 4×1' : `${montageState.cathode} −`}
                  </span>
                </div>

                <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-mono text-[13px] text-slate-400">
                  <span><span className="text-amber-300">{montageState.ma.toFixed(1)}</span> mA</span>
                  <span className="text-slate-600">·</span>
                  <span><span className="text-cyan-300">{montageState.dur}</span> min</span>
                  <span className="text-slate-600">·</span>
                  <span><span className="text-violet-300">{montageState.pad}</span> cm²</span>
                </div>

                <div className="mt-2 flex items-start gap-1.5 border-t border-slate-800/70 pt-2 text-[13px] leading-snug text-slate-500">
                  <Target className="mt-0.5 h-3 w-3 shrink-0 text-slate-500" />
                  <span>
                    {currentPreset?.targetStructure ??
                      `${BRAIN_NODES[montageState.anode]?.shortName ?? montageState.anode} with ${BRAIN_NODES[montageState.cathode]?.shortName ?? montageState.cathode} return`}
                  </span>
                </div>

                <details className="group mt-2 rounded-lg border border-slate-800/80 bg-slate-900/30 px-2 py-1.5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-[13px] font-medium text-slate-400 marker:hidden">
                    Why this protocol?
                    <span className="text-slate-500 transition group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-slate-400">{protocolCopy}</p>
                  {currentPreset && (
                    <p className="mt-1.5 flex items-start gap-1.5 text-[13px] leading-relaxed text-slate-400">
                      <Zap className="mt-0.5 h-3 w-3 shrink-0 text-amber-400" />
                      {currentPreset.primaryMechanism}
                    </p>
                  )}
                  {currentPreset && (
                    <a
                      href={`https://pubmed.ncbi.nlm.nih.gov/${currentPreset.referenceStudy.pmid}/`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1.5 flex items-center gap-1 text-[12.5px] text-slate-500 transition hover:text-cyan-300"
                    >
                      <BookOpen className="h-3 w-3" />
                      {currentPreset.referenceStudy.authors.split(',')[0]} {currentPreset.referenceStudy.year} · PMID {currentPreset.referenceStudy.pmid}
                    </a>
                  )}
                </details>
              </div>
          </>
        </DockSection>

        {/* 2 · 10-20 scalp compass */}
        <DockSection
          step="2"
          title="10–20 scalp compass"
          subtitle="Montage geometry and polarity"
          open={openSections.compass}
          onToggle={() => toggleSection('compass')}
        >
          <ScalpTopomap1020
            anodeId={montageState.anode}
            cathodeId={montageState.cathode}
            montageType={montageState.mode}
            surroundNodes={surroundNodes}
            onSelectNode={onSelectNode}
            onFlipPolarity={onFlipPolarity}
          />

          <>
              <MontageModeSegment
                mode={montageState.mode}
                onSelectMode={(mode) =>
                  updateMontageState({ mode, pad: mode === 'hd4x1' ? 3.14 : 25 })
                }
              />

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={onFlipPolarity}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-2 py-2 text-[13.5px] font-medium text-slate-300 transition hover:border-cyan-500/50 hover:text-cyan-300"
                  title="Swap anode and cathode positions"
                >
                  <ArrowLeftRight className="h-3.5 w-3.5 text-cyan-400" />
                  Swap polarity
                </button>
                <button
                  type="button"
                  onClick={onOpenMatrix}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-2 py-2 text-[13.5px] font-medium text-slate-300 transition hover:border-amber-500/40 hover:text-amber-300"
                  title="Open the multi-channel HD array matrix"
                >
                  <Grid className="h-3.5 w-3.5 text-amber-400" />
                  HD matrix
                </button>
              </div>

                <div className="flex items-center justify-between rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-2.5 py-2">
                  <div className="flex items-center gap-1.5 text-[13.5px] text-cyan-200">
                    <Sparkles className="h-3.5 w-3.5" />
                    {montageState.mode === 'hd4x1'
                      ? `4×1 ring · ${surroundNodes?.length ?? 4} returns`
                      : 'Conventional sponge pair'}
                  </div>
                  <span className="font-mono text-[13px] text-slate-400">
                    <span className="text-cyan-300">{telemetry.peakEFieldVm.toFixed(3)}</span> V/m peak
                  </span>
                </div>

              <PatientPadSummary montageState={montageState} />
          </>
        </DockSection>

        </>
        )}

        {/* 3 · Dosage controls */}
        {view === 'dose' && (
        <DockSection
          step="3"
          title="Dosage controls"
          subtitle="Current × time = delivered charge"
          open={openSections.dosage}
          onToggle={() => toggleSection('dosage')}
        >
          <>
              <ActiveCircuitLiveWire
                anodeId={montageState.anode}
                cathodeId={montageState.cathode}
                currentMa={montageState.ma}
                durationMin={montageState.dur}
                mode={montageState.mode}
              />

              <CurrentIntensityAmmeter
                currentMa={montageState.ma}
                onChange={(ma) => updateMontageState({ ma })}
              />

              <SessionRampChronometer
                durationMin={montageState.dur}
                onChange={(dur) => updateMontageState({ dur })}
              />

              <PadAreaControl
                montageState={montageState}
                updateMontageState={updateMontageState}
              />

              <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/50 px-2.5 py-2">
                <span className="flex items-center gap-1.5 text-[13.5px] text-slate-400">
                  <Zap className="h-3.5 w-3.5 text-amber-400" />
                  Current density
                </span>
                <span className="font-mono text-[13px] text-slate-300">
                  <span className="font-semibold text-amber-300">{telemetry.currentDensityMaCm2.toFixed(3)}</span> mA/cm²
                </span>
              </div>
          </>
        </DockSection>
        )}
      </div>
    </div>
  );
};

const MontageModeSegment: React.FC<{
  mode: 'sponge' | 'hd4x1';
  onSelectMode: (mode: 'sponge' | 'hd4x1') => void;
}> = ({ mode, onSelectMode }) => (
  <div className="grid grid-cols-2 gap-1 rounded-xl border border-slate-800 bg-slate-950/50 p-1">
    <button
      type="button"
      onClick={() => onSelectMode('sponge')}
      aria-pressed={mode === 'sponge'}
      className={`rounded-lg px-2 py-1.5 text-left transition ${
        mode === 'sponge'
          ? 'border border-cyan-500/40 bg-cyan-500/10 text-cyan-100'
          : 'border border-transparent text-slate-400 hover:bg-slate-900 hover:text-slate-200'
      }`}
    >
      <span className="block text-[13.5px] font-semibold">Sponge</span>
      <span className="block font-mono text-[12.5px] text-slate-500">25 cm² · broad</span>
    </button>
    <button
      type="button"
      onClick={() => onSelectMode('hd4x1')}
      aria-pressed={mode === 'hd4x1'}
      className={`rounded-lg px-2 py-1.5 text-left transition ${
        mode === 'hd4x1'
          ? 'border border-cyan-500/40 bg-cyan-500/10 text-cyan-100'
          : 'border border-transparent text-slate-400 hover:bg-slate-900 hover:text-slate-200'
      }`}
    >
      <span className="block text-[13.5px] font-semibold">HD 4×1 ring</span>
      <span className="block font-mono text-[12.5px] text-slate-500">3.14 cm² · focal</span>
    </button>
  </div>
);

/* -------------------------------------------------------------------------- */
/* Dock primitives                                                            */
/* -------------------------------------------------------------------------- */

const DockSection: React.FC<{
  step: string;
  title: string;
  subtitle: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}> = ({ step, title, subtitle, open, onToggle, children }) => (
  <section className="border-b border-slate-800/80">
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      className="flex w-full items-start justify-between gap-2 px-3 py-2.5 text-left transition hover:bg-slate-900/40"
    >
      <div className="flex min-w-0 items-start gap-2.5">
        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-slate-700 bg-slate-900 font-mono text-[12.5px] font-semibold text-slate-400">
          {step}
        </span>
        <div className="min-w-0">
          <div className="truncate text-[14.5px] font-semibold tracking-tight text-slate-200">{title}</div>
          <div className="mt-0.5 truncate text-[13px] text-slate-500">{subtitle}</div>
        </div>
      </div>
      <ChevronDown className={`mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500 transition-transform ${open ? '' : '-rotate-90'}`} />
    </button>
    {open && <div className="space-y-3 px-3 pb-3">{children}</div>}
  </section>
);

const PatientPadSummary: React.FC<{ montageState: MontageUrlState }> = ({ montageState }) => (
  <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-2.5">
    <div className="mb-2 flex items-center justify-between">
      <span className="text-[14px] font-semibold text-slate-200">Your two pads</span>
      <span className="flex items-center gap-1 text-[12.5px] text-slate-500">
        <MapPin className="h-3 w-3" />
        {montageState.mode === 'hd4x1' ? 'HD 4×1 ring' : 'Sponge pads'}
      </span>
    </div>
    <div className="space-y-2">
      <PadRow
        tone="red"
        label="Red pad (+)"
        site={montageState.anode}
        placement={getPadPlacement(montageState.anode)}
      />
      <PadRow
        tone="cyan"
        label="Blue pad (−)"
        site={montageState.mode === 'hd4x1' ? 'HD ring' : montageState.cathode}
        placement={
          montageState.mode === 'hd4x1'
            ? 'four small return pads surround the red pad'
            : getPadPlacement(montageState.cathode)
        }
      />
    </div>
    <p className="mt-2 border-t border-slate-800/70 pt-2 text-[13px] leading-relaxed text-slate-500">
      Your clinician will place the pads. Sit comfortably and keep your head still so they stay in contact.
    </p>
  </div>
);

const PadRow: React.FC<{ tone: 'red' | 'cyan'; label: string; site: string; placement: string }> = ({
  tone,
  label,
  site,
  placement
}) => (
  <div className="flex items-start gap-2">
    <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${tone === 'red' ? 'bg-rose-400' : 'bg-cyan-400'}`} />
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[13.5px] font-medium text-slate-200">{label}</span>
        <span
          className={`rounded border px-1 py-0.5 font-mono text-[12.5px] ${
            tone === 'red'
              ? 'border-rose-500/30 bg-rose-500/10 text-rose-300'
              : 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300'
          }`}
        >
          {site}
        </span>
      </div>
      <p className="mt-0.5 text-[13px] leading-snug text-slate-500">{placement}</p>
    </div>
  </div>
);

const PadAreaControl: React.FC<{
  montageState: MontageUrlState;
  updateMontageState: (partial: Partial<MontageUrlState>) => void;
}> = ({ montageState, updateMontageState }) => (
  <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-2.5">
    <div className="flex items-center justify-between">
      <label htmlFor="pad-area" className="field-label flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
        Pad area
      </label>
      {montageState.mode === 'hd4x1' ? (
        <div className="flex items-baseline gap-1">
          <span className="font-mono text-[14px] font-semibold text-violet-300">3.14</span>
          <span className="metric-unit">cm² · fixed</span>
        </div>
      ) : (
        <div className="flex items-baseline gap-1">
          <input
            id="pad-area"
            type="number"
            min={10}
            max={35}
            step="1"
            value={montageState.pad}
            onChange={(event) => {
              const value = parseInt(event.target.value, 10);
              if (Number.isFinite(value)) {
                updateMontageState({ pad: Math.max(10, Math.min(35, value)) });
              }
            }}
            className="no-spin w-9 bg-transparent text-right font-mono text-[14px] font-semibold text-violet-300 outline-none"
            aria-label="Pad area in square centimetres"
          />
          <span className="metric-unit">cm²</span>
        </div>
      )}
    </div>

    {montageState.mode === 'sponge' ? (
      <>
        <input
          type="range"
          min="10"
          max="35"
          step="1"
          value={montageState.pad}
          onChange={(event) => updateMontageState({ pad: parseInt(event.target.value, 10) })}
          className="slider mt-2.5 w-full text-violet-400"
          aria-label="Pad area slider"
        />
        <div className="mt-1 flex justify-between font-mono text-[12px] text-slate-500">
          <span>10</span>
          <span className="text-violet-300">25 standard</span>
          <span>35</span>
        </div>
      </>
    ) : (
      <p className="mt-2 text-[13px] leading-snug text-slate-500">
        The 4×1 ring uses fixed 3.14 cm² gel electrodes; switching montage mode restores the sponge size.
      </p>
    )}
  </div>
);

export default SetupDock;
