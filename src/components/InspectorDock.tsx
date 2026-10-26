import React, { useMemo } from 'react';
import {
  Activity,
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  HeartPulse,
  ShieldCheck
} from 'lucide-react';
import { BiophysicalTelemetry } from '../utils/biophysicsEngine';
import { MontageUrlState } from '../hooks/useUrlMontageState';
import { ClinicalPreset } from '../data/clinical_presets';
import { BRAIN_NODES } from '../data/brain_nodes';
import { EegWaveVisualizer } from './EegWaveVisualizer';
import { CellularMechanismWidget } from './CellularMechanismWidget';
import { HumanImpactSimulators } from './HumanImpactSimulators';
import { BiksonSafetyGauge } from './visuals/BiksonSafetyGauge';
import { CurrentPenetrationWaterfall } from './visuals/CurrentPenetrationWaterfall';
import { TissueConductivityStratum } from './visuals/TissueConductivityStratum';
import { ChargeDoseReservoir } from './visuals/ChargeDoseReservoir';
import { SensationMatrixGlyphs } from './visuals/SensationMatrixGlyphs';
import { SensationTolerabilityBars } from './visuals/SensationTolerabilityBars';
import { PatientPadGuide } from './visuals/PatientPadGuide';
import { PatientPrimerDiagram } from './visuals/PatientPrimerDiagram';
import { LobeFunctionalSilhouette } from './visuals/LobeFunctionalSilhouette';
import { MontageFocalityGraphic } from './visuals/MontageFocalityGraphic';
import { ClinicalEvidenceTimeline } from './visuals/ClinicalEvidenceTimeline';
import { EFieldThermalSpectrum } from './visuals/EFieldThermalSpectrum';

interface InspectorDockProps {
  telemetry: BiophysicalTelemetry;
  montageState: MontageUrlState;
  currentPreset?: ClinicalPreset;
  surroundNodes?: string[];
  onSelectMontageMode: (mode: 'sponge' | 'hd4x1') => void;
  tab: InspectorTabId;
}

export type InspectorTabId = 'biophysics' | 'eeg' | 'cellular' | 'outcomes';

const getPubMedUrl = (pmid: string) => `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`;

/**
 * Inspector content for one dashboard tab, ordered across tabs from physics
 * (what the current does) to people (what the patient experiences).
 */
export const InspectorDock: React.FC<InspectorDockProps> = ({
  telemetry,
  montageState,
  currentPreset,
  surroundNodes,
  onSelectMontageMode,
  tab
}) => {

  const anodeNode = BRAIN_NODES[montageState.anode] ?? BRAIN_NODES['F3'];

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      {tab === 'biophysics' && (
        <div className="custom-scrollbar min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
          <CorticalTelemetryCard telemetry={telemetry} anodeAreas={anodeNode.brodmannAreas} />
          <BiophysicsPanel
            telemetry={telemetry}
            montageState={montageState}
            currentPreset={currentPreset}
            onSelectMontageMode={onSelectMontageMode}
          />
        </div>
      )}

      {tab === 'eeg' && (
        <div className="flex min-h-0 flex-1 p-2">
          <EegWaveVisualizer
            anodeId={montageState.anode}
            cathodeId={montageState.cathode}
            currentMa={montageState.ma}
            telemetry={telemetry}
          />
        </div>
      )}

      {tab === 'cellular' && (
        <div className="flex min-h-0 flex-1 p-2">
          <CellularMechanismWidget
            anodeId={montageState.anode}
            cathodeId={montageState.cathode}
            currentMa={montageState.ma}
            durationMin={montageState.dur}
            padAreaCm2={montageState.pad}
            montageType={montageState.mode}
            surroundNodes={surroundNodes}
            footer={<PatientPrimerDiagram currentMa={montageState.ma} durationMin={montageState.dur} />}
          />
        </div>
      )}

      {tab === 'outcomes' && (
        <div className="flex min-h-0 flex-1 p-2">
          <HumanImpactSimulators
            anodeId={montageState.anode}
            cathodeId={montageState.cathode}
            currentMa={montageState.ma}
            telemetry={telemetry}
            footer={
              <>
                <SensationMatrixGlyphs
                  telemetry={telemetry}
                  anodeId={montageState.anode}
                  cathodeId={montageState.cathode}
                  currentMa={montageState.ma}
                  durationMin={montageState.dur}
                />
                <SensationTolerabilityBars telemetry={telemetry} />
                <SessionFeelTimeline />
                <PatientPadGuide
                  anodeId={montageState.anode}
                  cathodeId={montageState.cathode}
                  mode={montageState.mode}
                  padAreaCm2={montageState.pad}
                />
                <PrecautionsCard />
                <ClinicalEvidenceTimeline citations={anodeNode.keyCitations} />
              </>
            }
          />
        </div>
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Panel pieces                                                                */
/* -------------------------------------------------------------------------- */

/** Live cortical readout: E-field band, membrane shift, density and shunt. */
const CorticalTelemetryCard: React.FC<{ telemetry: BiophysicalTelemetry; anodeAreas: string[] }> = ({
  telemetry,
  anodeAreas
}) => {
  const shiftSign = telemetry.maxMembraneShiftMv >= 0 ? '+' : '';
  return (
    <section className="panel-card">
      <PanelHeader
        icon={<Activity className="h-4 w-4 text-cyan-300" />}
        tone="bg-cyan-500/10"
        title="Cortical telemetry"
        subtitle="What reaches the cortex under the active pad"
      />
      <div className="space-y-3 p-3">
        <EFieldThermalSpectrum peakEFieldVm={telemetry.peakEFieldVm} />
        <div className="rounded-lg border border-slate-800/60 bg-slate-900/70 p-2.5">
          <div className="flex justify-between text-[13.5px]">
            <span className="text-slate-400">Peak membrane shift (ΔVm)</span>
            <span className="font-mono font-semibold text-emerald-300">
              {shiftSign}
              {telemetry.maxMembraneShiftMv.toFixed(2)} mV
            </span>
          </div>
          <div className="relative mt-2 h-2.5 w-full overflow-hidden rounded-full border border-slate-800 bg-slate-950">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-300"
              style={{ width: `${Math.min(100, (Math.abs(telemetry.maxMembraneShiftMv) / 15) * 100)}%` }}
            />
          </div>
          <div className="mt-1.5 flex justify-between font-mono text-[12px] text-slate-500">
            <span>−70 mV rest</span>
            <span className="text-slate-400">share of the 15 mV gap</span>
            <span className="font-semibold text-rose-400">−55 mV</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Stat label="Current density J" value={telemetry.currentDensityMaCm2.toFixed(3)} unit="mA/cm²" tone="text-cyan-300" />
          <Stat label="Scalp shunt" value={`${telemetry.shuntPercentage.toFixed(1)}%`} unit="lost" tone="text-rose-300" />
          <Stat label="Peak E-field" value={telemetry.peakEFieldVm.toFixed(3)} unit="V/m" tone="text-amber-300" />
          <Stat label="Target areas" value={anodeAreas.join(', ')} unit="" tone="text-amber-200" />
        </div>
      </div>
    </section>
  );
};

const Stat: React.FC<{ label: string; value: string; unit: string; tone: string }> = ({ label, value, unit, tone }) => (
  <div className="rounded-lg border border-slate-800/60 bg-slate-900/60 px-2.5 py-2">
    <div className="text-[12.5px] text-slate-400">{label}</div>
    <div className={`mt-0.5 truncate font-mono text-[15px] font-semibold ${tone}`} title={`${value} ${unit}`}>
      {value} {unit && <span className="text-[12px] font-normal text-slate-400">{unit}</span>}
    </div>
  </div>
);

const PanelHeader: React.FC<{
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  tone: string;
}> = ({ icon, title, subtitle, right, tone }) => (
  <div className="panel-header">
    <div className="min-w-0">
      <h3 className="panel-title">
        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${tone}`}>{icon}</span>
        {title}
      </h3>
      {subtitle && <p className="panel-kicker">{subtitle}</p>}
    </div>
    {right}
  </div>
);

const CheckLine: React.FC<{ ok: boolean; children: React.ReactNode }> = ({ ok, children }) => (
  <li className="flex items-start gap-2 text-[13.5px] leading-relaxed text-slate-300">
    {ok ? (
      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
    ) : (
      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
    )}
    <span>{children}</span>
  </li>
);

const BiophysicsPanel: React.FC<{
  telemetry: BiophysicalTelemetry;
  montageState: MontageUrlState;
  currentPreset?: ClinicalPreset;
  onSelectMontageMode: (mode: 'sponge' | 'hd4x1') => void;
}> = ({ telemetry, montageState, currentPreset, onSelectMontageMode }) => {
  const densityOk = telemetry.currentDensityMaCm2 <= 0.25;
  const durationOk = montageState.dur <= 25;
  const activeNodes = useMemo(
    () => [...telemetry.activeAnodalNodes].sort((a, b) => b.eField - a.eField).slice(0, 5),
    [telemetry.activeAnodalNodes]
  );

  return (
    <>
      <BiksonSafetyGauge telemetry={telemetry} />

      <section className="panel-card overflow-hidden">
        <PanelHeader
          icon={<ShieldCheck className="h-3.5 w-3.5" />}
          title="Protocol check"
          subtitle="Against consensus practice (Bikson 2016)"
          tone="bg-emerald-500/10 text-emerald-300"
        />
        <ul className="space-y-1.5 p-3">
          <CheckLine ok={densityOk}>
            Current density <span className="font-mono">{telemetry.currentDensityMaCm2.toFixed(3)} mA/cm²</span>{' '}
            {densityOk ? '≤' : '>'} 0.25 ceiling
          </CheckLine>
          <CheckLine ok={durationOk}>
            <span className="font-mono">{montageState.dur} min</span> {durationOk ? '≤' : '>'} 25-minute routine window
          </CheckLine>
          <CheckLine ok>Hydrate sponges or gel and check the skin before starting</CheckLine>
        </ul>
        {currentPreset && (
          <a
            href={getPubMedUrl(currentPreset.referenceStudy.pmid)}
            target="_blank"
            rel="noreferrer"
            className="group flex items-center justify-between gap-2 border-t border-slate-800/70 px-3 py-2 text-[13px] text-slate-400 transition hover:text-cyan-300"
          >
            <span className="flex min-w-0 items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5 shrink-0 text-slate-500 group-hover:text-cyan-400" />
              <span className="truncate">
                {currentPreset.referenceStudy.authors} {currentPreset.referenceStudy.year} · {currentPreset.referenceStudy.journal}
              </span>
            </span>
            <span className="shrink-0 font-mono text-[12.5px] text-slate-500 group-hover:text-cyan-300">
              PMID {currentPreset.referenceStudy.pmid}
            </span>
          </a>
        )}
      </section>

      <CurrentPenetrationWaterfall telemetry={telemetry} montageType={montageState.mode} currentMa={montageState.ma} />
      <TissueConductivityStratum shuntPercentage={telemetry.shuntPercentage} />
      <ChargeDoseReservoir telemetry={telemetry} currentMa={montageState.ma} durationMin={montageState.dur} />
      <MontageFocalityGraphic mode={montageState.mode} onSelectMode={onSelectMontageMode} />

      <section className="panel-card overflow-hidden">
        <PanelHeader
          icon={<Activity className="h-3.5 w-3.5" />}
          title="Active cortical nodes"
          subtitle="Radial field and membrane shift per 10-20 site"
          tone="bg-amber-500/10 text-amber-300"
          right={<span className="font-mono text-[13px] text-slate-400">{telemetry.activeAnodalNodes.length}</span>}
        />
        <div className="space-y-2 p-3">
          {activeNodes.length === 0 && (
            <p className="text-[13.5px] text-slate-500">No cortical node reaches +0.08 V/m at this dose.</p>
          )}
          {activeNodes.map((node) => {
            const width = Math.min(100, Math.max(6, (node.eField / 0.8) * 100));
            return (
              <div key={node.id}>
                <div className="mb-1 flex items-center justify-between gap-2 text-[13px]">
                  <span className="flex min-w-0 items-center gap-1.5 text-slate-300">
                    <span className="rounded border border-orange-500/30 bg-orange-500/10 px-1 py-0.5 font-mono text-[12.5px] font-bold text-orange-300">
                      {node.id}
                    </span>
                    <span className="truncate text-slate-500">{node.name}</span>
                  </span>
                  <span className="shrink-0 font-mono text-slate-400">
                    <span className="text-amber-300">{node.eField.toFixed(2)}</span> V/m
                    <span className="ml-1.5 text-emerald-300">+{node.membraneShiftMv.toFixed(2)} mV</span>
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-950">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-600 to-amber-300 transition-all duration-500"
                    style={{ width: `${width}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <LobeFunctionalSilhouette anodeId={montageState.anode} cathodeId={montageState.cathode} />
    </>
  );
};

const PHASES = [
  { time: '0–30 s', title: 'Ramp up: gentle tingle', dot: 'bg-cyan-300', tone: 'text-cyan-300' },
  { time: 'Plateau', title: 'Tingle settles to warmth', dot: 'bg-emerald-300', tone: 'text-emerald-300' },
  { time: 'Last 30 s', title: 'Ramp down: fades away', dot: 'bg-amber-300', tone: 'text-amber-300' }
];

const SessionFeelTimeline: React.FC = () => (
  <section className="panel-card overflow-hidden">
    <PanelHeader
      icon={<HeartPulse className="h-3.5 w-3.5" />}
      title="How a session feels"
      subtitle="Most people feel the current only at the pad edges"
      tone="bg-rose-500/10 text-rose-300"
    />
    <ol className="flex items-start justify-between gap-2 p-3">
      {PHASES.map((phase, index) => (
        <li key={phase.time} className="relative flex flex-1 flex-col items-center text-center">
          {index < PHASES.length - 1 && <span className="absolute left-1/2 top-[5px] h-px w-full bg-slate-700" />}
          <span className={`relative h-2.5 w-2.5 rounded-full ring-4 ring-[#0C121E] ${phase.dot}`} />
          <span className={`mt-1.5 font-mono text-[12.5px] ${phase.tone}`}>{phase.time}</span>
          <span className="mt-0.5 text-[13px] leading-snug text-slate-300">{phase.title}</span>
        </li>
      ))}
    </ol>
  </section>
);

const PrecautionsCard: React.FC = () => (
  <section className="panel-card overflow-hidden">
    <PanelHeader
      icon={<ShieldCheck className="h-3.5 w-3.5" />}
      title="Stop and tell the clinician if…"
      tone="bg-amber-500/10 text-amber-300"
    />
    <ul className="space-y-1.5 p-3">
      <CheckLine ok={false}>Burning, sharp pain, or a strong headache</CheckLine>
      <CheckLine ok={false}>Pads over cuts, rashes, sunburn, or broken skin</CheckLine>
      <CheckLine ok={false}>Implanted pacemaker, neurostimulator, or metal in the head</CheckLine>
    </ul>
  </section>
);

export default InspectorDock;
