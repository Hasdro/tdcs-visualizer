import React, { useEffect, useRef, useState } from 'react';
import { membraneShiftAtNode } from '../utils/biophysicsEngine';
import { BRAIN_NODES } from '../data/brain_nodes';
import { Activity, Zap } from 'lucide-react';
import { SynapticPlasticityDiagram } from './visuals/SynapticPlasticityDiagram';
import { FiringProbabilityCurve } from './visuals/FiringProbabilityCurve';
import { NeurochemicalSeesaw } from './visuals/NeurochemicalSeesaw';
import { IntracellularSignalingCascade } from './visuals/IntracellularSignalingCascade';
import { NeuroplasticityDecayCurve } from './visuals/NeuroplasticityDecayCurve';

interface CellularMechanismWidgetProps {
  anodeId: string;
  cathodeId: string;
  currentMa: number;
  durationMin: number;
  padAreaCm2: number;
  montageType: 'sponge' | 'hd4x1';
  surroundNodes?: string[];
  /** Extra panels appended to the scroll area. */
  footer?: React.ReactNode;
}

export const CellularMechanismWidget: React.FC<CellularMechanismWidgetProps> = ({
  anodeId,
  cathodeId,
  currentMa,
  durationMin,
  padAreaCm2,
  montageType,
  surroundNodes,
  footer
}) => {
  const [selectedElectrodeView, setSelectedElectrodeView] = useState<'anode' | 'cathode'>('anode');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const anodeNode = BRAIN_NODES[anodeId] || BRAIN_NODES['F3'];
  const cathodeNode = BRAIN_NODES[cathodeId] || BRAIN_NODES['Fp2'];

  const activeNode = selectedElectrodeView === 'anode' ? anodeNode : cathodeNode;
  const isAnode = selectedElectrodeView === 'anode';

  // Membrane shift calculation
  // Baseline Vrest is -70.0 mV; Action potential threshold is -55.0 mV
  const baseVrest = -70.0;
  const thresholdVm = -55.0;

  // Local radial field beneath the inspected electrode sets ΔVm and the
  // relative spontaneous firing rate (exp(ΔVm / σ) escape model).
  const shift = membraneShiftAtNode(activeNode.id, {
    anodeId,
    cathodeId,
    currentMa,
    durationMin,
    padAreaCm2,
    montageType,
    surroundNodeIds: surroundNodes
  });
  const dVm = shift ? Math.max(-1.8, Math.min(1.8, shift.dVm)) : 0;
  const firingRatio = shift?.firingRatio ?? 1;
  const firingChangePct = Math.round((firingRatio - 1) * 100);

  const currentVrest = parseFloat((baseVrest + dVm).toFixed(2));
  const distanceToThreshold = Math.abs(thresholdVm - currentVrest).toFixed(2);

  // 60 FPS Neurophysiology Membrane Potential Oscilloscope
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let time = 0;

    // Buffer of membrane potential values across time
    const bufferLen = 220;
    const vmHistory: number[] = new Array(bufferLen).fill(baseVrest);

    // Spontaneous synaptic event timers
    let nextSpikeTime = 15;
    let actionPotentialPhase = 0; // 0: resting, >0: firing action potential curve

    const render = () => {
      time++;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      ctx.clearRect(0, 0, width, height);

      // Voltage range mapping: -80 mV (bottom) to +40 mV (top)
      const vMin = -82.0;
      const vMax = +45.0;
      const mapVtoY = (v: number) => height - ((v - vMin) / (vMax - vMin)) * height;

      // 1. Grid Lines & Voltage Markings
      ctx.strokeStyle = '#1E293B';
      ctx.lineWidth = 1;

      // Action Potential Threshold Line (-55 mV)
      const yThreshold = mapVtoY(thresholdVm);
      ctx.beginPath();
      ctx.strokeStyle = '#EF4444';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 4]);
      ctx.moveTo(0, yThreshold);
      ctx.lineTo(width, yThreshold);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.font = '10px "IBM Plex Mono", monospace';
      ctx.fillStyle = '#EF4444';
      ctx.fillText('THRESHOLD (-55 mV)', width - 130, yThreshold - 5);

      // Resting Baseline (-70 mV)
      const yBase70 = mapVtoY(baseVrest);
      ctx.beginPath();
      ctx.strokeStyle = '#64748B';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 4]);
      ctx.moveTo(0, yBase70);
      ctx.lineTo(width, yBase70);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#64748B';
      ctx.fillText('UNSTIMULATED BASELINE (-70 mV)', 10, yBase70 + 13);

      // Current Shifted Resting Potential Line
      const yCurrentRest = mapVtoY(currentVrest);
      ctx.beginPath();
      ctx.strokeStyle = isAnode ? '#F59E0B' : '#00D2FF';
      ctx.lineWidth = 1.2;
      ctx.moveTo(0, yCurrentRest);
      ctx.lineTo(width, yCurrentRest);
      ctx.stroke();

      ctx.fillStyle = isAnode ? '#F59E0B' : '#00D2FF';
      ctx.fillText(
        `tDCS RESTING Vm (${currentVrest > 0 ? `+${currentVrest}` : currentVrest} mV, ΔVm = ${dVm > 0 ? `+${dVm.toFixed(2)}` : dVm.toFixed(2)} mV)`,
        10,
        yCurrentRest - 5
      );

      // 2. Synaptic Event Simulator: Spontaneous EPSPs crossing threshold
      // Depolarization (higher Vm) makes EPSPs far more likely to cross -55mV and trigger action potentials!
      let newSample = currentVrest;

      if (actionPotentialPhase > 0) {
        // In the middle of an action potential spike
        if (actionPotentialPhase === 1) newSample = -35.0;
        else if (actionPotentialPhase === 2) newSample = +35.0; // Overshoot peak
        else if (actionPotentialPhase === 3) newSample = -20.0;
        else if (actionPotentialPhase === 4) newSample = -76.0; // After-hyperpolarization (AHP)
        else if (actionPotentialPhase === 5) newSample = -74.0;
        else actionPotentialPhase = 0;

        if (actionPotentialPhase > 0) actionPotentialPhase++;
      } else {
        // Spontaneous miniature excitatory postsynaptic potential (EPSP) noise
        const noise = (Math.random() - 0.5) * 1.4;
        newSample = currentVrest + noise;

        nextSpikeTime--;
        if (nextSpikeTime <= 0) {
          // EPSP amplitude is 12-14 mV. If Vrest is -68.5 mV, -68.5 + 14 = -54.5 mV -> CROSSES THRESHOLD!
          const epspAmp = 11.5 + Math.random() * 4.5;
          const peakV = currentVrest + epspAmp;

          if (peakV >= thresholdVm) {
            // Fires action potential!
            actionPotentialPhase = 1;
            // Shorter interval between spontaneous spikes when depolarized
            nextSpikeTime = Math.round((32 / firingRatio) * (0.7 + Math.random() * 0.6));
          } else {
            newSample = peakV;
            nextSpikeTime = Math.round((32 / firingRatio) * (0.7 + Math.random() * 0.6));
          }
        }
      }

      // Push to history buffer
      vmHistory.push(newSample);
      vmHistory.shift();

      // 3. Render Live Oscilloscope Trace
      ctx.beginPath();
      ctx.strokeStyle = isAnode ? '#FBBF24' : '#38BDF8';
      ctx.lineWidth = 2.2;
      ctx.shadowColor = isAnode ? '#F59E0B' : '#0284C7';
      ctx.shadowBlur = 8;

      for (let i = 0; i < bufferLen; i++) {
        const x = (i / (bufferLen - 1)) * width;
        const y = mapVtoY(vmHistory[i]);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [currentVrest, dVm, isAnode, baseVrest, thresholdVm, firingRatio]);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-800 bg-ink-2 shadow-2xl">
      {/* Header Bar */}
      <div className="border-b border-slate-800 bg-ink-3 px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <Activity className="h-3.5 w-3.5 shrink-0 text-amber-400" />
            <div className="min-w-0">
              <h3 className="truncate text-[14.5px] font-semibold tracking-tight text-slate-100">Cellular membrane</h3>
              <p className="text-[13px] text-slate-500">Synaptic polarization &amp; plasticity</p>
            </div>
          </div>
          <span className="shrink-0 rounded-md bg-slate-800 px-1.5 py-0.5 font-mono text-[13px] font-semibold text-amber-300">
            {currentMa.toFixed(1)} <span className="font-normal text-slate-400">mA</span>
          </span>
        </div>

        {/* Polarity Scope Toggle */}
        <div className="mt-2 flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900/60 p-0.5 text-[13px]">
          <button
            onClick={() => setSelectedElectrodeView('anode')}
            className={`flex-1 rounded px-2 py-1 font-medium transition ${
              isAnode
                ? 'bg-rose-500/15 text-rose-200'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Anode · <span className="font-mono">{anodeNode.id}</span>
          </button>
          <button
            onClick={() => setSelectedElectrodeView('cathode')}
            className={`flex-1 rounded px-2 py-1 font-medium transition ${
              !isAnode
                ? 'bg-cyan-500/15 text-cyan-200'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Cathode · <span className="font-mono">{cathodeNode.id}</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3.5 custom-scrollbar">
        {/* Real-Time Oscilloscope Canvas */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-2.5 shadow-md">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 text-[14px] font-mono">
            <span className="text-slate-300 font-semibold flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Somatic membrane potential <span className="font-mono text-slate-500">· {currentMa.toFixed(1)} mA</span>
            </span>
            <span className="text-cyan-400 text-[13px]">
              Sub-threshold · Nitsche 2000
            </span>
          </div>

          <div className="relative w-full h-44 bg-ink-0 rounded-lg border border-slate-800/80 overflow-hidden mt-2">
            <canvas ref={canvasRef} className="w-full h-full block" />
            <div className="absolute top-2 right-2 bg-slate-900/90 border border-slate-800 px-2 py-1 rounded text-[13px] font-mono text-slate-300 shadow">
              ΔVm: <span className={isAnode ? 'text-amber-400 font-bold' : 'text-cyan-400 font-bold'}>
                {dVm > 0 ? `+${dVm.toFixed(2)}` : dVm.toFixed(2)} mV
              </span>
            </div>
          </div>

          <div className="mt-2 grid grid-cols-3 gap-2 font-mono text-xs">
            <div className="bg-slate-950/60 p-2 rounded border border-slate-800/50">
              <div className="text-[13px] text-slate-400">Resting potential</div>
              <div className="text-sm font-bold text-slate-200 mt-0.5">
                {currentVrest} <span className="text-[13px] font-normal text-slate-400">mV</span>
              </div>
            </div>

            <div className="bg-slate-950/60 p-2 rounded border border-slate-800/50">
              <div className="text-[13px] text-slate-400">Distance to threshold</div>
              <div className="text-sm font-bold text-amber-300 mt-0.5">
                {distanceToThreshold} <span className="text-[13px] font-normal text-slate-400">mV</span>
              </div>
            </div>

            <div className="bg-slate-950/60 p-2 rounded border border-slate-800/50">
              <div className="text-[13px] text-slate-400">Firing probability</div>
              <div className="text-sm font-bold text-emerald-300 mt-0.5">
                {firingChangePct >= 0 ? `↑ +${firingChangePct}%` : `↓ ${firingChangePct}%`}
              </div>
            </div>
          </div>
        </div>

        {/* Visual 1: Gaussian Bell Curve Action Potential Firing Probability */}
        <FiringProbabilityCurve
          isAnode={isAnode}
          currentMa={currentMa}
          maxMembraneShiftMv={Math.abs(dVm)}
          firingRatio={firingRatio}
        />

        {/* Visual 2: Molecular Synaptic Cleft NMDA/AMPA & Ca2+ Ion Cascade */}
        <SynapticPlasticityDiagram
          isAnode={isAnode}
          currentMa={currentMa}
        />

        {/* Visual 3: GABA vs Glutamate Physical Neurochemical Balance Scale */}
        <NeurochemicalSeesaw
          isAnode={isAnode}
          currentMa={currentMa}
        />

        {/* Visual 4: Molecular Intracellular Signaling Cascade (replaces 4 dense text cards) */}
        <IntracellularSignalingCascade isAnode={isAnode} currentMa={currentMa} />

        {/* Visual 5: Post-Session Neuroplasticity Decay Timeline */}
        <NeuroplasticityDecayCurve
          durationMin={durationMin}
          currentMa={currentMa}
          isAnode={isAnode}
        />

        {footer}
      </div>
    </div>
  );
};
