import React, { useEffect, useRef, useState } from 'react';
import { EEG_BANDS } from '../data/eeg_bands';
import { BRAIN_NODES } from '../data/brain_nodes';
import { BiophysicalTelemetry } from '../utils/biophysicsEngine';
import { Waves } from 'lucide-react';
import { EegSpectralBarChart } from './visuals/EegSpectralBarChart';
import { NeuroArousalCompass } from './visuals/NeuroArousalCompass';
import { EegBandSymptomMatrix } from './visuals/EegBandSymptomMatrix';

interface EegWaveVisualizerProps {
  anodeId: string;
  cathodeId: string;
  currentMa: number;
  telemetry: BiophysicalTelemetry;
}

export const EegWaveVisualizer: React.FC<EegWaveVisualizerProps> = ({
  anodeId,
  cathodeId,
  currentMa,
  telemetry
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedBandFilter, setSelectedBandFilter] = useState<string>('all');

  const anodeNode = BRAIN_NODES[anodeId] || BRAIN_NODES['F3'];
  const cathodeNode = BRAIN_NODES[cathodeId] || BRAIN_NODES['Fp2'];

  // Calculate actual percentage shift per band based on lead-field stimulation
  const bandShifts = React.useMemo(() => {
    const shifts: Record<string, number> = {
      delta: 0,
      theta: 0,
      alpha: 0,
      lowBeta: 0,
      highBeta: 0,
      gamma: 0
    };

    const anodeShift = anodeNode.anodalEffects.eegShifts;
    const cathodeShift = cathodeNode.cathodalEffects.eegShifts;

    const scale = Math.min(1.5, currentMa / 2.0);

    shifts.delta = Math.round((anodeShift.delta * 0.7 + cathodeShift.delta * 0.3) * scale);
    shifts.theta = Math.round((anodeShift.theta * 0.7 + cathodeShift.theta * 0.3) * scale);
    shifts.alpha = Math.round((anodeShift.alpha * 0.7 + cathodeShift.alpha * 0.3) * scale);
    shifts.lowBeta = Math.round((anodeShift.beta * 0.5 + cathodeShift.beta * 0.2) * scale);
    shifts.highBeta = Math.round((anodeShift.beta * 0.7 + cathodeShift.beta * 0.3) * scale);
    shifts.gamma = Math.round((anodeShift.gamma * 0.8 + cathodeShift.gamma * 0.2) * scale);

    return shifts;
  }, [anodeNode, cathodeNode, currentMa]);

  // 60 FPS Canvas Oscilloscope Wave Synthesizer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let startTime = performance.now();

    const render = (time: number) => {
      const elapsed = (time - startTime) * 0.001; // elapsed seconds

      // Resize canvas buffer to match display width
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      ctx.clearRect(0, 0, width, height);

      // Background oscilloscope grid lines
      ctx.strokeStyle = '#131D2E';
      ctx.lineWidth = 1;
      const gridStepX = 30;
      for (let x = 0; x < width; x += gridStepX) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      const bands = Object.values(EEG_BANDS);
      const activeBands = selectedBandFilter === 'all'
        ? bands
        : bands.filter(b => b.id === selectedBandFilter);

      const channelHeight = height / activeBands.length;

      activeBands.forEach((band, idx) => {
        const centerY = channelHeight * idx + channelHeight / 2;
        const shiftPct = bandShifts[band.id] || 0;
        const amplitudeMod = 1.0 + (shiftPct / 100.0);

        // Horizontal channel baseline divider
        ctx.strokeStyle = '#1E293B';
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(width, centerY);
        ctx.stroke();

        // Channel Tag
        ctx.font = '10px "IBM Plex Mono", monospace';
        ctx.fillStyle = '#64748B';
        ctx.fillText(`${band.name} (${band.frequencyRange})`, 8, centerY - channelHeight * 0.32);

        // 1. Draw Normative Baseline Wave (Ghost Gray Dashed)
        ctx.beginPath();
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([3, 3]);

        const baseAmp = Math.min(channelHeight * 0.28, 16);

        // Distinct physiological spatial cycles across the display width (Video Feedback #12)
        const spatialCyclesMap: Record<string, number> = {
          delta: 2.5,
          theta: 4.8,
          alpha: 8.2,
          lowBeta: 12.5,
          highBeta: 16.5,
          gamma: 21.0
        };
        const cycles = spatialCyclesMap[band.id] || (band.centerFreq * 0.55);

        // Calibrated smooth clinical oscilloscope sweep speed (slow and legible)
        const sweepSpeed = 0.45 + (cycles / 22.0) * 0.35;
        const phase = elapsed * sweepSpeed * Math.PI * 2;

        for (let x = 0; x < width; x += 2) {
          const normX = x / width;
          const spatialAngle = normX * cycles * Math.PI * 2 - phase;
          // Harmonic wave equation
          const y = centerY + Math.sin(spatialAngle) * baseAmp * 0.75 +
            Math.sin(spatialAngle * 0.5 + 0.5) * baseAmp * 0.25;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // 2. Draw Live tDCS-Modulated Waveform (Glowing Solid Color)
        ctx.beginPath();
        ctx.strokeStyle = band.color;
        ctx.lineWidth = 2.0;
        ctx.setLineDash([]);
        ctx.shadowColor = band.color;
        ctx.shadowBlur = 8;

        const liveAmp = baseAmp * Math.max(0.2, amplitudeMod);

        for (let x = 0; x < width; x += 2) {
          const normX = x / width;
          const phaseJitter = (shiftPct > 0 ? 0.08 : -0.08) * Math.sin(elapsed * 1.5 + normX * 3.0);
          const spatialAngle = normX * cycles * Math.PI * 2 - phase + phaseJitter;
          const y = centerY + Math.sin(spatialAngle) * liveAmp * 0.75 +
            Math.sin(spatialAngle * 0.5 + 0.5) * liveAmp * 0.25;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Reset shadow
        ctx.shadowBlur = 0;
      });

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [bandShifts, selectedBandFilter]);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-800 bg-ink-2 shadow-2xl">
      {/* Header Bar */}
      <div className="border-b border-slate-800 bg-ink-3 px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <Waves className="h-3.5 w-3.5 shrink-0 text-cyan-400" />
            <h3 className="truncate text-[14.5px] font-semibold tracking-tight text-slate-100">
              EEG spectral synthesizer
            </h3>
          </div>
          <span className="shrink-0 rounded-md bg-slate-800 px-1.5 py-0.5 font-mono text-[13px] font-semibold text-amber-300">
            {telemetry.peakEFieldVm} <span className="font-normal text-slate-400">V/m</span>
          </span>
        </div>
        <div className="mt-1 flex items-center justify-between gap-2">
          <span className="text-[13px] text-slate-500">Live 6-band cortical monitor</span>
          <div className="flex shrink-0 items-center gap-1 font-mono text-[13px]">
            <span className="rounded border border-red-800/60 bg-red-950/60 px-1.5 py-0.5 font-semibold text-red-300">
              {anodeNode.id} +
            </span>
            <span className="text-slate-600">→</span>
            <span className="rounded border border-cyan-800/60 bg-cyan-950/60 px-1.5 py-0.5 font-semibold text-cyan-300">
              {cathodeNode.id} –
            </span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="custom-scrollbar flex items-center gap-1 overflow-x-auto border-b border-slate-800/80 bg-slate-900/40 px-3 py-2 text-[13px] font-medium">
        <button
          onClick={() => setSelectedBandFilter('all')}
          className={`shrink-0 rounded px-2 py-0.5 transition ${
            selectedBandFilter === 'all'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          All 6 bands
        </button>
        {Object.values(EEG_BANDS).map((b) => (
          <button
            key={b.id}
            onClick={() => setSelectedBandFilter(b.id)}
            className={`shrink-0 whitespace-nowrap rounded px-2 py-0.5 transition ${
              selectedBandFilter === b.id
                ? 'bg-slate-800 text-white border border-slate-600 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {b.symbol} {b.name}
          </button>
        ))}
      </div>

      {/* Real-Time Canvas Multi-Channel Oscilloscope */}
      <div className="relative w-full h-44 bg-ink-0 border-b border-slate-800">
        <canvas ref={canvasRef} className="w-full h-full block" />
        <div className="absolute bottom-1 right-2 flex items-center gap-3 text-[12.5px] font-mono text-slate-500 pointer-events-none">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-0.5 bg-slate-500 border-dashed" />
            <span>Normative Baseline</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-0.5 bg-cyan-400" />
            <span>tDCS Modulated</span>
          </div>
        </div>
      </div>

      {/* Quantitative Shift Cards & Up/Down Reference Guide */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
        {/* Real-Time 6-Band FFT Power Distribution Visualizer */}
        <EegSpectralBarChart bandShifts={bandShifts} />

        {/* 2D Neuro-Arousal & Executive Drive Compass */}
        <NeuroArousalCompass bandShifts={bandShifts} anodeId={anodeId} />

        {/* Glanceable Deficit vs Excess Symptom Matrix (replaces expandable text accordions) */}
        <EegBandSymptomMatrix bandShifts={bandShifts} selectedBandFilter={selectedBandFilter} />
      </div>
    </div>
  );
};
