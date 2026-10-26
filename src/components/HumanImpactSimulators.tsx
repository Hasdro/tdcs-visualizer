import React from 'react';
import { BiophysicalTelemetry } from '../utils/biophysicsEngine';
import { BRAIN_NODES } from '../data/brain_nodes';
import { CognitiveImpactRadar } from './visuals/CognitiveImpactRadar';
import { ReactionTimeRaceTrack } from './visuals/ReactionTimeRaceTrack';
import { HomunculusAvatar } from './visuals/HomunculusAvatar';
import { AffectiveCircumplexPlot } from './visuals/AffectiveCircumplexPlot';
import { SomatosensorySensationMap } from './visuals/SomatosensorySensationMap';
import { Activity } from 'lucide-react';

interface HumanImpactSimulatorsProps {
  anodeId: string;
  cathodeId: string;
  currentMa: number;
  telemetry: BiophysicalTelemetry;
  /** Optionally hide the anatomical sensation map when it is shown elsewhere. */
  showSensationMap?: boolean;
  /** Extra panels appended to the scroll area. */
  footer?: React.ReactNode;
}

export const HumanImpactSimulators: React.FC<HumanImpactSimulatorsProps> = ({
  anodeId,
  cathodeId,
  currentMa,
  telemetry,
  showSensationMap = true,
  footer
}) => {
  const anodeNode = BRAIN_NODES[anodeId] || BRAIN_NODES['F3'];
  const cathodeNode = BRAIN_NODES[cathodeId] || BRAIN_NODES['Fp2'];

  // Metrics from telemetry
  const metrics = telemetry.compositeMetrics;

  // Russell's Circumplex of Affect: Valence = mood axis; Arousal = motor/executive activation blend
  const valenceScore = metrics.mood;
  const arousalScore = Math.round(metrics.motorSpeed * 0.6 + metrics.focus * 0.4);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-800 bg-ink-2 shadow-2xl">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-ink-3 px-3 py-2.5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Activity className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
            <h3 className="truncate text-[14.5px] font-semibold tracking-tight text-slate-100">
              Outcome &amp; performance profile
            </h3>
          </div>
          <p className="mt-0.5 text-[13px] text-slate-400">Projected cognitive, affective &amp; motor effects</p>
        </div>
        <div className="flex shrink-0 items-center gap-2 font-mono text-[13px] text-slate-400">
          <span className="text-amber-300">{currentMa.toFixed(1)} mA</span>
          <span className="text-slate-600">|</span>
          <span className="text-emerald-300">{anodeNode.id} / {cathodeNode.id}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3.5 custom-scrollbar">
        {/* Visual 1: Hexagonal Cognitive Performance Radar Chart */}
        <CognitiveImpactRadar telemetry={telemetry} />

        {/* Visual 1B: Russell's 2D Valence-Arousal Affective Circumplex (adjacent to radar) */}
        <AffectiveCircumplexPlot valenceScore={valenceScore} arousalScore={arousalScore} />

        {/* Visual 2: Somatotopic Homunculus Embodiment Avatar */}
        <HomunculusAvatar anodeId={anodeId} cathodeId={cathodeId} />

        {/* Visual 3: Reaction Time Speedometer & Visual Race Track */}
        <ReactionTimeRaceTrack motorScore={metrics.motorSpeed || metrics.focus} />

        {/* Section 2: Russell's circumplex replaced the 6 redundant stacked text gauges */}

        {/* Section 3: Anatomical sensory & adverse-effect heatmap (dedicated Sensations tab) */}
        {showSensationMap && (
          <SomatosensorySensationMap
            telemetry={telemetry}
            anodeId={anodeId}
            cathodeId={cathodeId}
          />
        )}

        {footer}
      </div>
    </div>
  );
};
