import React from 'react';

interface NeuroplasticityDecayCurveProps {
  durationMin: number;
  currentMa: number;
  isAnode: boolean;
}

/**
 * Post-session corticospinal excitability decay model (Nitsche & Paulus 2000/2001, Monte-Silva 2013).
 * [Stimulation] excitability ramps toward polarity-dependent peak.
 * [After-effect] exponential decay whose persistence scales super-linearly with duration & intensity:
 *   10 min @ 2.0 mA → ~30 min window; 20 min @ 2.0 mA → ~90 min window.
 */
export const NeuroplasticityDecayCurve: React.FC<NeuroplasticityDecayCurveProps> = ({
  durationMin,
  currentMa,
  isAnode
}) => {
  const X_MAX = 120; // minutes
  const W = 260;
  const H = 150;
  const PAD_L = 26;
  const PAD_R = 8;
  const PAD_T = 10;
  const PAD_B = 22;

  const plotW = W - PAD_L - PAD_R;
  const plotH = H - PAD_T - PAD_B;
  const yMin = -32;
  const yMax = 42;

  const xToPx = (t: number) => PAD_L + (t / X_MAX) * plotW;
  const yToPx = (v: number) => PAD_T + ((yMax - v) / (yMax - yMin)) * plotH;

  // Intensity factor: 2.0 mA unlocks full empirical effect size, 1.0 mA reaches ~77%
  const intensityFactor = 0.55 + 0.45 * (currentMa / 2.0);
  const peak = isAnode ? 35 * intensityFactor : -28 * intensityFactor;

  // Super-linear duration multiplier: 10 min → ×3, 20 min → ×4.5, 30 min → ×6
  const durationMultiplier = 3 + (durationMin - 10) / 10 * 1.5;
  const afterEffectMin = Math.max(10, Math.min(X_MAX, Math.round(durationMultiplier * durationMin * intensityFactor)));

  // Build polyline: stimulation ramp (0 → dur) + exponential after-effect decay
  const points: string[] = [];
  for (let t = 0; t <= durationMin; t += 1) {
    const v = peak * Math.pow(t / Math.max(durationMin, 1), 1.6); // progressive build-up
    points.push(`${xToPx(t).toFixed(1)},${yToPx(v).toFixed(1)}`);
  }
  for (let t = durationMin; t <= Math.min(X_MAX, Math.max(afterEffectMin, durationMin + 5)); t += 2) {
    const tau = Math.max((afterEffectMin - durationMin) / 3, 4); // decay time constant
    const v = peak * Math.exp(-(t - durationMin) / tau);
    points.push(`${xToPx(t).toFixed(1)},${yToPx(v).toFixed(1)}`);
  }

  // Shaded plasticity-window area bleeds into the plan
  const windowEndX = xToPx(Math.min(X_MAX, afterEffectMin));
  const windowStartX = xToPx(durationMin);
  const zeroY = yToPx(0);

  const strokeColor = isAnode ? '#FBBF24' : '#38BDF8';

  return (
    <div className="panel-card select-none p-3 text-xs">
      <div className="flex items-start justify-between gap-2 border-b border-slate-800/70 pb-2">
        <span className="flex items-center gap-2 text-[14px] font-semibold leading-snug tracking-tight text-slate-100">
          <span className="w-2 h-2 rounded-full bg-lime-400" />
          Plasticity after-effect
        </span>
        <span className="font-mono text-[12.5px] text-slate-500">Nitsche 2000 · Monte-Silva 2013</span>
      </div>

      {/* Window readout chips */}
      <div className="flex items-center gap-1.5 mt-1.5 text-[12.5px]">
        <span className="bg-slate-950/70 border border-slate-800/70 rounded px-1.5 py-0.5 text-slate-300">
          Stimulation: <strong style={{ color: strokeColor }}>{durationMin} min</strong>
        </span>
        <span className="bg-emerald-950/40 border border-emerald-800/50 rounded px-1.5 py-0.5 text-emerald-300">
          ⏳ Plasticity window: <strong>{afterEffectMin} min post-session</strong>
        </span>
        <span className={`rounded px-1.5 py-0.5 border ${isAnode ? 'bg-amber-950/50 text-amber-300 border-amber-800/50' : 'bg-sky-950/50 text-sky-300 border-sky-800/50'}`}>
          Peak: {peak > 0 ? '+' : ''}{isAnode ? peak.toFixed(0) : peak.toFixed(0)}% MEP
        </span>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full mt-1">
        <defs>
          <linearGradient id="decayWindowGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isAnode ? '#FBBF24' : '#38BDF8'} stopOpacity="0.22" />
            <stop offset="100%" stopColor={isAnode ? '#FBBF24' : '#38BDF8'} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Post-session plasticity window shading */}
        <rect
          x={windowStartX}
          y={PAD_T}
          width={Math.max(2, windowEndX - windowStartX)}
          height={plotH}
          fill="url(#decayWindowGrad)"
        />
        {/* Window boundary markers */}
        <line x1={windowStartX} y1={PAD_T} x2={windowStartX} y2={PAD_T + plotH} stroke="#475569" strokeWidth="1" strokeDasharray="3 3" />
        <line x1={windowEndX} y1={PAD_T} x2={windowEndX} y2={PAD_T + plotH} stroke="#10B981" strokeWidth="1" strokeDasharray="3 3" opacity="0.8" />

        {/* Y grid: +35% / 0% / −28% reference lines */}
        <line x1={PAD_L} y1={yToPx(35)} x2={W - PAD_R} y2={yToPx(35)} stroke="#1E293B" strokeWidth="0.8" strokeDasharray="2 3" />
        <text x={PAD_L - 3} y={yToPx(35) + 3} fill="#64748B" fontSize="8" textAnchor="end">+35%</text>
        <line x1={PAD_L} y1={zeroY} x2={W - PAD_R} y2={zeroY} stroke="#475569" strokeWidth="1" />
        <text x={PAD_L - 3} y={zeroY + 3} fill="#94A3B8" fontSize="8" textAnchor="end">0</text>
        <line x1={PAD_L} y1={yToPx(-28)} x2={W - PAD_R} y2={yToPx(-28)} stroke="#1E293B" strokeWidth="0.8" strokeDasharray="2 3" />
        <text x={PAD_L - 3} y={yToPx(-28) + 3} fill="#64748B" fontSize="8" textAnchor="end">−28%</text>

        {/* X axis time ticks */}
        {[0, 30, 60, 90, 120].map((t) => (
          <g key={t}>
            <line x1={xToPx(t)} y1={PAD_T + plotH} x2={xToPx(t)} y2={PAD_T + plotH + 3} stroke="#475569" strokeWidth="1" />
            <text x={xToPx(t)} y={H - 8} fill="#64748B" fontSize="8.6" textAnchor="middle">{t}</text>
          </g>
        ))}
        <text x={W / 2} y={H - 1} fill="#475569" fontSize="7.5" textAnchor="middle">Time from session start (min)</text>
        <text x="3" y="8" fill="#475569" fontSize="7.5">Corticospinal excitability (% baseline)</text>

        {/* "Stimulator OFF" marker */}
        <text x={windowStartX + 2} y={PAD_T + 8} fill="#94A3B8" fontSize="7.5">POWER OFF ▸ decay</text>

        {/* Excitability trace */}
        <polyline
          points={points.join(' ')}
          fill="none"
          stroke={strokeColor}
          strokeWidth="2.2"
          strokeLinejoin="round"
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 4px ${strokeColor})` }}
          className="transition-all duration-500"
        />

        {/* Peak marker dot */}
        <circle
          cx={xToPx(durationMin)}
          cy={yToPx(peak)}
          r="3"
          fill={strokeColor}
          stroke="#FFFFFF"
          strokeWidth="1"
          className="transition-all duration-500"
        />
      </svg>

      <div className="flex items-center gap-2 pt-1 border-t border-slate-800/60 text-[12.5px] text-slate-400">
        <span className="flex items-center gap-1"><span className="w-2.5 h-0.5 rounded" style={{ backgroundColor: strokeColor }} /> Excitability trace</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: `${isAnode ? '#FBBF24' : '#38BDF8'}22`, border: `1px solid ${strokeColor}` }} /> Plasticity window</span>
        <span className="ml-auto text-emerald-400">↑ Raise Duration in Dosimetry to extend the window</span>
      </div>
    </div>
  );
};
