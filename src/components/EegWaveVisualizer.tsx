import React, { useEffect, useRef, useState } from 'react';
import { EEG_BANDS } from '../data/eeg_bands';
import { BRAIN_NODES } from '../data/brain_nodes';
import { BiophysicalTelemetry } from '../utils/biophysicsEngine';
import { ChevronDown, ChevronUp, Waves, ArrowUpRight, ArrowDownRight, Minus, Sparkles } from 'lucide-react';

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
  const [expandedBand, setExpandedBand] = useState<string | null>('alpha');
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
        const freqRad = band.centerFreq * Math.PI * 2;

        for (let x = 0; x < width; x += 2) {
          const t = elapsed + (x / width) * 2.0;
          // Harmonic wave equation
          const y = centerY + Math.sin(t * freqRad) * baseAmp * 0.75 +
            Math.sin(t * freqRad * 0.5 + 0.5) * baseAmp * 0.25;
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
          const t = elapsed + (x / width) * 2.0;
          // Phase shift and amplitude modulation
          const phaseJitter = (shiftPct > 0 ? 0.05 : -0.05) * Math.sin(t * 1.5);
          const y = centerY + Math.sin(t * freqRad + phaseJitter) * liveAmp * 0.75 +
            Math.sin(t * freqRad * 0.5 + 0.5) * liveAmp * 0.25;
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
    <div className="flex flex-col h-full bg-[#0F1623] border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Header Bar */}
      <div className="p-3 bg-[#131B2C] border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Waves className="w-4 h-4 text-cyan-400" />
          <h3 className="font-mono text-xs font-bold text-slate-100 tracking-wider uppercase">
            Live EEG Spectral Synthesizer
          </h3>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[10px]">
          <span className="text-slate-400">Peak |E|:</span>
          <span className="bg-slate-800 text-amber-300 font-bold px-1.5 py-0.5 rounded">
            {telemetry.peakEFieldVm} V/m
          </span>
          <span className="text-slate-600">|</span>
          <span className="bg-red-950/60 text-red-400 border border-red-800/60 px-1.5 py-0.5 rounded font-bold">
            {anodeNode.id} (+)
          </span>
          <span className="text-slate-600">→</span>
          <span className="bg-cyan-950/60 text-cyan-400 border border-cyan-800/60 px-1.5 py-0.5 rounded font-bold">
            {cathodeNode.id} (–)
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 px-3 py-2 bg-slate-900/50 border-b border-slate-800/80 text-[10px] font-mono overflow-x-auto">
        <button
          onClick={() => setSelectedBandFilter('all')}
          className={`px-2 py-0.5 rounded transition ${
            selectedBandFilter === 'all'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          All 6 Bands
        </button>
        {Object.values(EEG_BANDS).map((b) => (
          <button
            key={b.id}
            onClick={() => setSelectedBandFilter(b.id)}
            className={`px-2 py-0.5 rounded transition whitespace-nowrap ${
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
      <div className="relative w-full h-44 bg-[#070B12] border-b border-slate-800">
        <canvas ref={canvasRef} className="w-full h-full block" />
        <div className="absolute bottom-1 right-2 flex items-center gap-3 text-[9px] font-mono text-slate-500 pointer-events-none">
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
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar">
        <div className="text-[11px] font-mono font-semibold text-slate-400 flex items-center justify-between">
          <span>SPECTRAL POWER SHIFTS</span>
          <span className="text-[10px] text-cyan-400 font-normal">
            Ref: Koessler et al., Bikson 2016
          </span>
        </div>

        {Object.values(EEG_BANDS).map((band) => {
          const shift = bandShifts[band.id] || 0;
          const isExpanded = expandedBand === band.id;

          return (
            <div
              key={band.id}
              className={`border rounded-lg transition-all ${
                isExpanded
                  ? 'bg-slate-900/90 border-slate-700 shadow-md'
                  : 'bg-slate-900/40 border-slate-800 hover:border-slate-700/80'
              }`}
            >
              {/* Header Card Row */}
              <div
                onClick={() => setExpandedBand(isExpanded ? null : band.id)}
                className="p-2.5 flex items-center justify-between cursor-pointer select-none"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: band.color }}
                  />
                  <div>
                    <span className="font-mono text-xs font-bold text-slate-200">
                      {band.name} ({band.symbol})
                    </span>
                    <span className="text-[10px] text-slate-400 ml-1.5 font-mono">
                      {band.frequencyRange}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Shift Badge */}
                  <div
                    className={`font-mono text-xs px-2 py-0.5 rounded flex items-center gap-1 font-bold ${
                      shift > 0
                        ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800/60'
                        : shift < 0
                        ? 'bg-rose-950/70 text-rose-300 border border-rose-800/60'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {shift > 0 ? (
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    ) : shift < 0 ? (
                      <ArrowDownRight className="w-3.5 h-3.5" />
                    ) : (
                      <Minus className="w-3 h-3" />
                    )}
                    <span>{shift > 0 ? `+${shift}%` : `${shift}%`}</span>
                  </div>

                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </div>

              {/* Expanded Clinical Breakdown */}
              {isExpanded && (
                <div className="px-3 pb-3 pt-1 border-t border-slate-800 text-xs space-y-2 font-sans">
                  {/* Baseline Meaning */}
                  <div className="bg-slate-950/60 p-2 rounded border border-slate-800/60 text-[11px]">
                    <span className="text-slate-400 font-semibold">Baseline Norm: </span>
                    <span className="text-slate-300">{band.normalBaseline}</span>
                  </div>

                  {/* Why this montage changed it */}
                  <div className="bg-cyan-950/30 p-2 rounded border border-cyan-800/40 text-[11px]">
                    <div className="flex items-center gap-1 text-cyan-400 font-mono font-semibold mb-0.5">
                      <Sparkles className="w-3 h-3 text-cyan-400" />
                      <span>Montage Modulation Mechanism:</span>
                    </div>
                    <p className="text-slate-300">{band.tdcsModulation.anodalEffect}</p>
                  </div>

                  {/* Up vs Down Norms Grid */}
                  <div className="grid grid-cols-2 gap-2 text-[10px] pt-1">
                    <div className="bg-rose-950/20 border border-rose-900/40 rounded p-2">
                      <div className="font-mono font-bold text-rose-400 flex items-center gap-1 mb-1">
                        <span>↑ WHEN ELEVATED (UP)</span>
                      </div>
                      <p className="text-slate-300 mb-1">{band.whenElevated.clinicalMeaning}</p>
                      <ul className="text-slate-400 space-y-0.5 list-disc list-inside">
                        {band.whenElevated.symptoms.slice(0, 2).map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-sky-950/20 border border-sky-900/40 rounded p-2">
                      <div className="font-mono font-bold text-sky-400 flex items-center gap-1 mb-1">
                        <span>↓ WHEN SUPPRESSED (DOWN)</span>
                      </div>
                      <p className="text-slate-300 mb-1">{band.whenSuppressed.clinicalMeaning}</p>
                      <ul className="text-slate-400 space-y-0.5 list-disc list-inside">
                        {band.whenSuppressed.symptoms.slice(0, 2).map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
