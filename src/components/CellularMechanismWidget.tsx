import React, { useEffect, useRef, useState } from 'react';
import { BiophysicalTelemetry } from '../utils/biophysicsEngine';
import { BRAIN_NODES } from '../data/brain_nodes';
import {
  Activity,
  Layers,
  ExternalLink,
  Zap,
  TrendingUp,
  TrendingDown,
  Info
} from 'lucide-react';

interface CellularMechanismWidgetProps {
  anodeId: string;
  cathodeId: string;
  currentMa: number;
  telemetry: BiophysicalTelemetry;
}

export const CellularMechanismWidget: React.FC<CellularMechanismWidgetProps> = ({
  anodeId,
  cathodeId,
  currentMa,
  telemetry
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

  // dVm shift: positive under anode (+0.2 to +1.6 mV), negative under cathode (-0.2 to -1.6 mV)
  const dVm = isAnode
    ? Math.min(1.8, telemetry.maxMembraneShiftMv)
    : -Math.min(1.8, telemetry.maxMembraneShiftMv);

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
            nextSpikeTime = isAnode ? 25 + Math.floor(Math.random() * 30) : 90 + Math.floor(Math.random() * 60);
          } else {
            newSample = peakV;
            nextSpikeTime = isAnode ? 30 : 65;
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
  }, [currentVrest, dVm, isAnode, baseVrest, thresholdVm]);

  return (
    <div className="flex flex-col h-full bg-[#0F1623] border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Header Bar */}
      <div className="p-3 bg-[#131B2C] border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-amber-400" />
          <h3 className="font-mono text-xs font-bold text-slate-100 tracking-wider uppercase">
            Cellular Membrane & Synaptic Scope
          </h3>
        </div>

        {/* Polarity Scope Toggle */}
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-0.5 rounded-lg text-[10px] font-mono">
          <button
            onClick={() => setSelectedElectrodeView('anode')}
            className={`px-2 py-0.5 rounded transition ${
              isAnode
                ? 'bg-red-500/20 text-red-400 border border-red-500/40 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Under Anode ({anodeNode.id} +)
          </button>
          <button
            onClick={() => setSelectedElectrodeView('cathode')}
            className={`px-2 py-0.5 rounded transition ${
              !isAnode
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Under Cathode ({cathodeNode.id} –)
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3.5 custom-scrollbar">
        {/* Real-Time Oscilloscope Canvas */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-2.5 shadow-md">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 text-[11px] font-mono">
            <span className="text-slate-300 font-semibold flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Somatic Membrane Potential (mV) — {currentMa.toFixed(1)} mA Applied
            </span>
            <span className="text-cyan-400 text-[10px]">
              Sub-Threshold Modulator (Nitsche 2000)
            </span>
          </div>

          <div className="relative w-full h-44 bg-[#070B12] rounded-lg border border-slate-800/80 overflow-hidden mt-2">
            <canvas ref={canvasRef} className="w-full h-full block" />
            <div className="absolute top-2 right-2 bg-slate-900/90 border border-slate-800 px-2 py-1 rounded text-[10px] font-mono text-slate-300 shadow">
              ΔVm: <span className={isAnode ? 'text-amber-400 font-bold' : 'text-cyan-400 font-bold'}>
                {dVm > 0 ? `+${dVm.toFixed(2)}` : dVm.toFixed(2)} mV
              </span>
            </div>
          </div>

          <div className="mt-2 grid grid-cols-3 gap-2 font-mono text-xs">
            <div className="bg-slate-950/60 p-2 rounded border border-slate-800/50">
              <div className="text-[10px] text-slate-400">RESTING POTENTIAL</div>
              <div className="text-sm font-bold text-slate-200 mt-0.5">
                {currentVrest} <span className="text-[10px] font-normal text-slate-400">mV</span>
              </div>
            </div>

            <div className="bg-slate-950/60 p-2 rounded border border-slate-800/50">
              <div className="text-[10px] text-slate-400">DIST. TO THRESHOLD</div>
              <div className="text-sm font-bold text-amber-300 mt-0.5">
                {distanceToThreshold} <span className="text-[10px] font-normal text-slate-400">mV</span>
              </div>
            </div>

            <div className="bg-slate-950/60 p-2 rounded border border-slate-800/50">
              <div className="text-[10px] text-slate-400">FIRING PROBABILITY</div>
              <div className="text-sm font-bold text-emerald-300 mt-0.5">
                {isAnode ? '↑ +34% (Facilitated)' : '↓ -28% (Depressed)'}
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Four Core Molecular / Synaptic Indicators */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3 shadow-md space-y-2.5">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
            <span className="font-mono text-[11px] font-bold text-slate-200 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              SYNAPTIC PLASTICITY & RECEPTOR DYNAMICS
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              {isAnode ? 'LTP-Like State' : 'LTD-Like State'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {/* NMDA Receptor */}
            <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800/60">
              <div className="flex items-center justify-between text-slate-300 font-semibold mb-1">
                <span>NMDA Receptor Opening</span>
                {isAnode ? (
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                )}
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                {isAnode
                  ? 'Partial Mg2+ pore unblock via somatic depolarization enhances glutamate sensitivity.'
                  : 'Sustained hyperpolarization strengthens Mg2+ block, attenuating Ca2+ conductance.'}
              </p>
            </div>

            {/* Intracellular Ca2+ */}
            <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800/60">
              <div className="flex items-center justify-between text-slate-300 font-semibold mb-1">
                <span>Intracellular Ca²⁺ Influx</span>
                {isAnode ? (
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                )}
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                {isAnode
                  ? 'Elevated Ca²⁺ activates CaMKII cascades, driving AMPA receptor insertion into dendritic spines.'
                  : 'Low basal Ca²⁺ recruits calcineurin phosphatases, inducing AMPA endocytosis (LTD).'}
              </p>
            </div>

            {/* BDNF Expression */}
            <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800/60">
              <div className="flex items-center justify-between text-slate-300 font-semibold mb-1">
                <span>BDNF Neuroplasticity</span>
                {isAnode ? (
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                )}
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                {isAnode
                  ? 'TrkB receptor phosphorylation promotes structural synaptogenesis and dendritic arborization.'
                  : 'Downregulated local neurotrophic factor secretion during extended inhibitory states.'}
              </p>
            </div>

            {/* GABA / Glutamate Balance */}
            <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800/60">
              <div className="flex items-center justify-between text-slate-300 font-semibold mb-1">
                <span>GABA / Glu Balance</span>
                {isAnode ? (
                  <span className="text-[10px] font-mono text-amber-400 font-bold">Glutamate ↑</span>
                ) : (
                  <span className="text-[10px] font-mono text-cyan-400 font-bold">GABA ↑</span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                {isAnode
                  ? 'Magnetic Resonance Spectroscopy (MRS) demonstrates localized reduction in GABA and rise in Glutamate.'
                  : 'Relative GABAergic tone increases; suppresses focal hyper-excitability.'}
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: Verified PubMed Citations */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3 shadow-md space-y-2">
          <div className="flex items-center justify-between pb-1 border-b border-slate-800">
            <span className="font-mono text-[11px] font-bold text-slate-200 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-cyan-400" />
              PEER-REVIEWED EVIDENCE & CITATIONS
            </span>
            <span className="text-[10px] font-mono text-slate-400">{activeNode.id} Profile</span>
          </div>

          <div className="space-y-2">
            {activeNode.keyCitations.map((cit, idx) => (
              <div key={idx} className="bg-slate-950/60 p-2 rounded border border-slate-800/60 text-xs">
                <div className="flex items-center justify-between font-mono text-[11px] text-cyan-300">
                  <span className="font-bold">{cit.authors} ({cit.year})</span>
                  <a
                    href={`https://pubmed.ncbi.nlm.nih.gov/${cit.pmid}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[10px] text-amber-400 hover:text-amber-300 underline"
                  >
                    <span>PMID: {cit.pmid}</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
                <div className="text-[10px] text-slate-400 font-mono italic mt-0.5">
                  {cit.journal}
                </div>
                <p className="text-[11px] text-slate-300 mt-1 leading-normal">
                  {cit.finding}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
