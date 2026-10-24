import React from 'react';
import { EEG_BANDS } from '../../data/eeg_bands';

interface EegBandSymptomMatrixProps {
  bandShifts: Record<string, number>;
  selectedBandFilter: string;
}

// Per-band signature pictogram, functional category & therapeutic-benefit direction
const BAND_META: Record<string, { icon: string; category: string; beneficialWhenElevated: boolean }> = {
  delta: { icon: '🌙', category: 'Deep Sleep · Cellular Regeneration', beneficialWhenElevated: false },
  theta: { icon: '🧘', category: 'Meditation · Memory Consolidation', beneficialWhenElevated: false },
  alpha: { icon: '🌊', category: 'Calm Flow · Attentive Relaxation', beneficialWhenElevated: false },
  lowBeta: { icon: '💡', category: 'Motor Stillness · SMR Readiness', beneficialWhenElevated: true },
  highBeta: { icon: '⚡', category: 'Analytical Focus · Vigilance', beneficialWhenElevated: false },
  gamma: { icon: '💎', category: 'Mental Binding · High-Order Insight', beneficialWhenElevated: true }
};

// Clamp power shift to the visible ±40% window of the spectrum gauge
const clampShift = (v: number) => Math.max(-40, Math.min(40, v));

export const EegBandSymptomMatrix: React.FC<EegBandSymptomMatrixProps> = ({
  bandShifts,
  selectedBandFilter
}) => {
  return (
    <div className="panel-card select-none p-3 text-xs">
      <div className="flex items-start justify-between gap-2 border-b border-slate-800/70 pb-2">
        <span className="flex items-center gap-2 text-[12px] font-semibold leading-snug tracking-tight text-slate-100">
          <span className="w-2 h-2 rounded-full bg-violet-400" />
          Frequency-band symptoms
        </span>
        <span className="text-[11px] text-slate-400">
          Deficit ◂──┤├──▸ excess
        </span>
      </div>

      {/* 3 x 2 Power Tile Grid */}
      <div className="grid grid-cols-2 gap-2 mt-2.5">
        {Object.values(EEG_BANDS).map((band) => {
          const meta = BAND_META[band.id];
          const shift = bandShifts[band.id] || 0;
          const clamped = clampShift(shift);
          const isDimmed = selectedBandFilter !== 'all' && selectedBandFilter !== band.id;

          // Symptom chips follow the direction of the induced shift
          const deficitMode = shift < 0;
          const symptomList = deficitMode ? band.whenSuppressed.symptoms.slice(0, 2) : band.whenElevated.symptoms.slice(0, 2);
          // Emerald chips = clinically desirable outcome; amber chips = excess / deficit warning
          const chipPositive = !deficitMode && meta.beneficialWhenElevated;

          return (
            <div
              key={band.id}
              title={`${band.id.toUpperCase()} — Montage modulation: ${band.tdcsModulation.anodalEffect}`}
              className={`p-2 rounded-lg border bg-slate-950/60 transition-all duration-300 ${
                isDimmed
                  ? 'opacity-30 border-slate-800/40 scale-[0.97]'
                  : selectedBandFilter === band.id
                  ? 'border-cyan-500/70 shadow-glow-cyan'
                  : 'border-slate-800/70'
              }`}
            >
              {/* Tile Header: pictogram, name, Hz range */}
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-sm leading-none shrink-0">{meta.icon}</span>
                  <span
                    className="text-[12px] font-bold truncate"
                    style={{ color: band.color }}
                  >
                    {band.name}
                  </span>
                </div>
                <span className="text-[10.5px] text-slate-500 shrink-0">{band.frequencyRange}</span>
              </div>
              <div className="text-[10.5px] text-slate-400 mt-0.5 leading-tight">{meta.category}</div>

              {/* Bidirectional Deficit vs Excess Spectrum Gauge */}
              <div className="mt-1.5 relative h-8 px-3.5">
                <div className="absolute top-3 left-0 right-0 h-2 rounded-full border border-slate-800 overflow-hidden flex">
                  <div className="h-full w-1/2 bg-rose-950/50" />
                  <div className="h-full w-1/2 bg-slate-900/40" style={{ backgroundColor: `${band.color}14` }} />
                </div>

                {/* Normative center notch */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-px h-4 bg-slate-300/90" />

                {/* Glow-tracked marker sweeping left (deficit) / right (excess) */}
                <div
                  className="absolute top-[7px] -ml-1 transition-all duration-500 ease-out"
                  style={{
                    left: `${50 + (clamped / 40) * 45}%`
                  }}
                >
                  <div
                    className="w-2 h-2 rounded-full border border-white/70"
                    style={{
                      backgroundColor: band.color,
                      boxShadow: `0 0 8px ${band.color}, 0 0 3px ${band.color}`
                    }}
                  />
                </div>

                {/* Zone labels */}
                <span className="absolute bottom-0 left-0 text-[9px] font-medium text-rose-400/80">Deficit</span>
                <span className="absolute bottom-0 right-0 text-[9px] font-medium text-slate-500">Excess</span>
                <span
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[9.5px] font-bold"
                  style={{ color: Math.abs(shift) < 3 ? '#64748B' : band.color }}
                >
                  {shift > 0 ? `+${shift}` : `${shift}`}%
                </span>
              </div>

              {/* Symptom chips on the active side */}
              <div className="mt-0.5 min-h-[16px]">
                {Math.abs(shift) < 3 ? (
                  <div className="text-[10px] text-slate-500 flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-slate-600" />
                    Normative homeostasis — no induced shift
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    {symptomList.map((s, i) => (
                      <div
                        key={i}
                        className={`text-[10px] leading-tight px-1.5 py-0.5 rounded flex items-start gap-1 ${
                          chipPositive
                            ? 'bg-emerald-950/50 text-emerald-300 border border-emerald-800/50'
                            : 'bg-amber-950/40 text-amber-300 border border-amber-800/40'
                        }`}
                      >
                        <span className="shrink-0">{chipPositive ? '✓' : deficitMode ? '▼' : '▲'}</span>
                        <span className="truncate">{s}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Phase-Amplitude Coupling (PAC) Micro-Ring: cross-frequency synchrony orbit */}
              <div className="flex items-center justify-end gap-1 mt-0.5">
                <svg viewBox="0 0 18 18" className="w-[18px] h-[18px]" style={{ opacity: Math.min(1, Math.abs(shift) / 25 + 0.25) }}>
                  <circle cx="9" cy="9" r="7" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="2 2" />
                  <circle cx="9" cy="9" r="2" fill={band.color} opacity="0.85" />
                  {/* Orbiting carrier-coupled satellite */}
                  <g
                    className="animate-spin"
                    style={{ animationDuration: `${Math.max(1.6, 5.4 - band.centerFreq * 0.07).toFixed(1)}s`, transformOrigin: '9px 9px' }}
                  >
                    <circle cx="9" cy="2" r="1.5" fill="#F8FAFC" opacity="0.9" />
                  </g>
                </svg>
                <span className="text-[9px] text-slate-500">PAC</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
