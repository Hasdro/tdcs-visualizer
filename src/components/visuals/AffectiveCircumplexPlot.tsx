import React from 'react';

interface AffectiveCircumplexPlotProps {
  valenceScore: number;
  arousalScore: number;
}

// Clamp affective activation to the plotted ±60 dynamic range
const clampPlot = (v: number) => Math.max(-60, Math.min(60, v));

export const AffectiveCircumplexPlot: React.FC<AffectiveCircumplexPlotProps> = ({
  valenceScore,
  arousalScore
}) => {
  const v = clampPlot(valenceScore);
  const a = clampPlot(arousalScore);

  // Map scores to SVG [0..100] space: Valence → X axis, Arousal → Y axis (SVG Y inverted)
  const cursorX = 50 + (v / 60) * 36;
  const cursorY = 50 - (a / 60) * 36;

  // Active Russell's quadrant of affect
  const rightHalf = v >= 0;
  const topHalf = a >= 0;
  let quadrantLabel = 'Disengaged Baseline';
  let labelColor = 'text-slate-400';
  if (rightHalf && topHalf) {
    quadrantLabel = 'Excited · Motivated · Energized';
    labelColor = 'text-emerald-300';
  } else if (!rightHalf && topHalf) {
    quadrantLabel = 'Anxious · Tense · Hyper-Vigilant';
    labelColor = 'text-rose-300';
  } else if (!rightHalf && !topHalf) {
    quadrantLabel = 'Depressed · Fatigued · Gloomy';
    labelColor = 'text-indigo-300';
  } else {
    quadrantLabel = 'Serene · Content · Calm';
    labelColor = 'text-cyan-300';
  }

  return (
    <div className="panel-card select-none p-3 text-xs">
      <div className="flex items-start justify-between gap-2 border-b border-slate-800/70 pb-2">
        <span className="flex items-center gap-2 text-[12px] font-semibold leading-snug tracking-tight text-slate-100">
          <span className="w-2 h-2 rounded-full bg-fuchsia-400" />
          Affective state (Russell)
        </span>
        <span className={`text-[11px] font-semibold ${labelColor}`}>{quadrantLabel}</span>
      </div>

      <div className="flex items-center gap-2 mt-1">
        {/* 2D Valence-Arousal Coordinate Plane */}
        <svg viewBox="0 0 100 100" className="w-44 h-44 bg-slate-950/80 rounded-xl border border-slate-800 shrink-0">
          {/* Four colored psychological quadrant zones */}
          <rect x="50" y="5" width="45" height="45" fill="#10B981" opacity="0.10" rx="3" />
          <rect x="5" y="5" width="45" height="45" fill="#F43F5E" opacity="0.10" rx="3" />
          <rect x="5" y="50" width="45" height="45" fill="#6366F1" opacity="0.10" rx="3" />
          <rect x="50" y="50" width="45" height="45" fill="#38BDF8" opacity="0.10" rx="3" />

          {/* Normative activation rings */}
          <circle cx="50" cy="50" r="9" fill="none" stroke="#334155" strokeWidth="0.8" strokeDasharray="2 2" />
          <circle cx="50" cy="50" r="18" fill="none" stroke="#1E293B" strokeWidth="0.6" strokeDasharray="1.5 3" />

          {/* Cross axes */}
          <line x1="50" y1="5" x2="50" y2="95" stroke="#334155" strokeWidth="1" />
          <line x1="5" y1="50" x2="95" y2="50" stroke="#334155" strokeWidth="1" />

          {/* Axis end labels */}
          <text x="97" y="44" fill="#F59E0B" fontSize="4.6" textAnchor="end" fontWeight="bold">High arousal ▲</text>
          <text x="97" y="59" fill="#818CF8" fontSize="4.6" textAnchor="end">▼ Low arousal</text>
          <text x="6" y="46" fill="#94A3B8" fontSize="4.6">Unpleasant ◄</text>
          <text x="94" y="46" fill="#94A3B8" fontSize="4.6" textAnchor="end">► Pleasant</text>

          {/* Quadrant zone titles */}
          <text x="73" y="10" fill="#34D399" fontSize="4.1" textAnchor="middle">Energized · euphoric</text>
          <text x="73" y="16.5" fill="#6EE7B7" fontSize="3.4" textAnchor="middle" opacity="0.8">Anodal frontal / motor</text>
          <text x="27" y="10" fill="#FB7185" fontSize="4.1" textAnchor="middle">Tense · hyper-vigilant</text>
          <text x="27" y="16.5" fill="#FDA4AF" fontSize="3.4" textAnchor="middle" opacity="0.8">Excessive β/γ arousal</text>
          <text x="27" y="93" fill="#A5B4FC" fontSize="4.1" textAnchor="middle">Lethargic · gloomy</text>
          <text x="27" y="88" fill="#A5B4FC" fontSize="3.4" textAnchor="middle" opacity="0.8">Hypo-frontal state</text>
          <text x="73" y="93" fill="#38BDF8" fontSize="4.1" textAnchor="middle">Serene · relaxed</text>
          <text x="73" y="88" fill="#7DD3FC" fontSize="3.4" textAnchor="middle" opacity="0.8">Cathodal alpha enhancing</text>

          {/* Directional motion vector from normative baseline to current state */}
          <line
            x1="50" y1="50" x2={cursorX} y2={cursorY}
            stroke="#F0ABFC" strokeWidth="1" strokeDasharray="2 1.6" opacity="0.85"
          />
          {/* Arrowhead at cursor */}
          <circle cx={cursorX} cy={cursorY} r="6" fill="none" stroke="#F0ABFC" strokeWidth="0.8" opacity="0.5" className="animate-ping" />
          <circle
            cx={cursorX} cy={cursorY} r="3.6"
            fill={rightHalf ? (topHalf ? '#34D399' : '#38BDF8') : topHalf ? '#FB7185' : '#818CF8'}
            stroke="#FFFFFF" strokeWidth="1"
            className="transition-all duration-500 ease-out"
          />

          {/* Baseline notch */}
          <circle cx="50" cy="50" r="1.6" fill="#64748B" />
        </svg>

        {/* Numeric state telemetry */}
        <div className="flex-1 space-y-1.5 text-[11px] min-w-0">
          <div className="bg-slate-950/70 border border-slate-800/70 rounded px-2 py-1">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Valence</span>
              <span className="font-mono font-semibold text-emerald-300">
                {valenceScore >= 0 ? `+${valenceScore}` : valenceScore}
              </span>
            </div>
            <div className="h-1 bg-slate-900 rounded-full mt-1 relative overflow-hidden">
              <div
                className={`absolute top-0 h-full rounded transition-all duration-500 ${
                  valenceScore >= 0 ? 'bg-emerald-400 left-1/2' : 'bg-rose-400 right-1/2'
                }`}
                style={{ width: `${Math.min(50, Math.abs(valenceScore) * 0.75)}%` }}
              />
              <div className="absolute left-1/2 top-0 h-full w-px bg-slate-600" />
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/70 rounded px-2 py-1">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Arousal</span>
              <span className="font-mono font-semibold text-amber-300">
                {arousalScore >= 0 ? `+${arousalScore}` : arousalScore}
              </span>
            </div>
            <div className="h-1 bg-slate-900 rounded-full mt-1 relative overflow-hidden">
              <div
                className={`absolute top-0 h-full rounded transition-all duration-500 ${
                  arousalScore >= 0 ? 'bg-amber-400 left-1/2' : 'bg-indigo-400 right-1/2'
                }`}
                style={{ width: `${Math.min(50, Math.abs(arousalScore) * 0.75)}%` }}
              />
              <div className="absolute left-1/2 top-0 h-full w-px bg-slate-600" />
            </div>
          </div>

          {/* Cortical driver attribution of the quadrant shift */}
          {rightHalf && topHalf ? (
            <div className="text-[10px] text-emerald-400/90 leading-tight bg-emerald-950/30 border border-emerald-800/40 rounded px-1.5 py-1">
              Anodal frontal drive → positive approach vector
            </div>
          ) : !rightHalf && !topHalf ? (
            <div className="text-[10px] text-indigo-400/90 leading-tight bg-indigo-950/30 border border-indigo-800/40 rounded px-1.5 py-1">
              Hypo-frontal signature: restore with F3 anodal priming
            </div>
          ) : !rightHalf && topHalf ? (
            <div className="text-[10px] text-rose-400/90 leading-tight bg-rose-950/30 border border-rose-800/40 rounded px-1.5 py-1">
              Arousal surplus: watch β/γ excess under high current
            </div>
          ) : (
            <div className="text-[10px] text-cyan-400/90 leading-tight bg-cyan-950/30 border border-cyan-800/40 rounded px-1.5 py-1">
              De-aroused calm: alpha/idling enhancement zone
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
