import React from 'react';

interface NeuroArousalCompassProps {
  bandShifts: Record<string, number>;
  anodeId: string;
}

export const NeuroArousalCompass: React.FC<NeuroArousalCompassProps> = ({ bandShifts, anodeId }) => {
  // Compute X axis: Arousal level
  // De-arousal: delta + theta; High arousal: highBeta + gamma
  const deArousal = ((bandShifts.delta || 0) + (bandShifts.theta || 0)) * 0.5;
  const highArousal = ((bandShifts.highBeta || 0) + (bandShifts.gamma || 0)) * 0.5;
  const netArousal = highArousal - deArousal; // [-40, +40]

  // Compute Y axis: Focus vs Reflection
  // External Focus: lowBeta + alpha suppression/modulation; Internal: theta + alpha
  const externalFocus = (bandShifts.lowBeta || 0) * 1.2 - (bandShifts.alpha || 0) * 0.4; // [-40, +40]

  // Map to 2D SVG [0, 100] coordinates (Center at 50, 50)
  const cursorX = Math.max(12, Math.min(88, 50 + (netArousal / 35) * 38));
  const cursorY = Math.max(12, Math.min(88, 50 - (externalFocus / 35) * 38));

  // Determine active quadrant label
  let quadrantLabel = 'Normative Balance';
  if (cursorX > 50 && cursorY < 50) {
    quadrantLabel = 'Peak Flow State & Executive Drive';
  } else if (cursorX <= 50 && cursorY < 50) {
    quadrantLabel = 'Meditative Focus & Insight';
  } else if (cursorX <= 50 && cursorY >= 50) {
    quadrantLabel = 'Deep Somatic Calm & Sleep Prep';
  } else {
    quadrantLabel = 'High Vigilance / Sympathetic Surge';
  }

  return (
    <div className="bg-[#0C121E]/95 border border-slate-800/90 rounded-xl p-3 shadow-xl select-none font-mono text-xs">
      <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/60 text-[11px]">
        <span className="font-bold text-slate-200 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          NEURO-AROUSAL COMPASS ({anodeId})
        </span>
        <span className="text-[10px] text-cyan-300 font-semibold">{quadrantLabel}</span>
      </div>

      <div className="relative flex justify-center py-2">
        <svg viewBox="0 0 100 100" className="w-48 h-48 bg-slate-950/80 rounded-xl border border-slate-800 p-1">
          {/* Quadrant Grid Lines */}
          <line x1="50" y1="5" x2="50" y2="95" stroke="#1E293B" strokeWidth="1.2" strokeDasharray="2 2" />
          <line x1="5" y1="50" x2="95" y2="50" stroke="#1E293B" strokeWidth="1.2" strokeDasharray="2 2" />

          {/* Quadrant Soft Tint Areas */}
          <rect x="50" y="5" width="45" height="45" fill="#0284C7" opacity="0.08" rx="4" />
          <rect x="5" y="5" width="45" height="45" fill="#10B981" opacity="0.08" rx="4" />
          <rect x="5" y="50" width="45" height="45" fill="#6366F1" opacity="0.08" rx="4" />
          <rect x="50" y="50" width="45" height="45" fill="#F59E0B" opacity="0.08" rx="4" />

          {/* Axis Labels */}
          <text x="50" y="10" fill="#38BDF8" fontSize="4.5" textAnchor="middle" fontWeight="bold">▲ EXTERNAL FOCUS</text>
          <text x="50" y="94" fill="#818CF8" fontSize="4.5" textAnchor="middle">▼ INTERNAL CALM</text>
          <text x="7" y="52" fill="#34D399" fontSize="4.5" textAnchor="start">◄ RELAXED</text>
          <text x="93" y="52" fill="#F59E0B" fontSize="4.5" textAnchor="end">VIGILANT ►</text>

          {/* Normative Center Ring */}
          <circle cx="50" cy="50" r="10" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="2 2" />

          {/* Active Stimulation State Cursor Dot with Ripple */}
          <circle cx={cursorX} cy={cursorY} r="7" fill="none" stroke="#38BDF8" strokeWidth="1" className="animate-ping opacity-60" />
          <circle cx={cursorX} cy={cursorY} r="4" fill="#38BDF8" stroke="#FFFFFF" strokeWidth="1.5" className="transition-all duration-300" />
        </svg>
      </div>

      {/* Outcome Benefit Chips */}
      <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-800/60 text-[10px]">
        {cursorX > 50 && cursorY < 50 && (
          <>
            <span className="bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 px-2 py-0.5 rounded">
              🎯 Deep Working Memory
            </span>
            <span className="bg-cyan-950/60 text-cyan-300 border border-cyan-800/60 px-2 py-0.5 rounded">
              ☀️ Mood Elevation
            </span>
          </>
        )}
        {cursorX <= 50 && cursorY < 50 && (
          <>
            <span className="bg-sky-950/60 text-sky-300 border border-sky-800/60 px-2 py-0.5 rounded">
              🧘 Meditative Alpha Flow
            </span>
            <span className="bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 px-2 py-0.5 rounded">
              ✨ Creative Synthesis
            </span>
          </>
        )}
        {cursorX <= 50 && cursorY >= 50 && (
          <>
            <span className="bg-indigo-950/60 text-indigo-300 border border-indigo-800/60 px-2 py-0.5 rounded">
              🌊 Somatic Calming
            </span>
            <span className="bg-purple-950/60 text-purple-300 border border-purple-800/60 px-2 py-0.5 rounded">
              💤 Sleep Consolidation
            </span>
          </>
        )}
        {cursorX > 50 && cursorY >= 50 && (
          <>
            <span className="bg-amber-950/60 text-amber-300 border border-amber-800/60 px-2 py-0.5 rounded">
              ⚡ Motor Priming
            </span>
            <span className="bg-rose-950/60 text-rose-300 border border-rose-800/60 px-2 py-0.5 rounded">
              ⚠️ Monitor Over-Arousal
            </span>
          </>
        )}
      </div>
    </div>
  );
};
