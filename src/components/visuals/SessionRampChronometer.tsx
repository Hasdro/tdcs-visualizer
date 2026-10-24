import React, { useRef } from 'react';

interface SessionRampChronometerProps {
  durationMin: number;
  onChange: (dur: number) => void;
}

const MIN_MIN = 5;
const MAX_MIN = 30;
const SWEEP_START = -135;
const SWEEP_END = 135;

const clampDuration = (dur: number) =>
  Math.round(Math.max(MIN_MIN, Math.min(MAX_MIN, dur)));

const polar = (cx: number, cy: number, r: number, angleDeg: number) => {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
};

const arcPath = (cx: number, cy: number, r: number, a0: number, a1: number) => {
  const s = polar(cx, cy, r, a0);
  const e = polar(cx, cy, r, a1);
  const large = a1 - a0 > 180 ? 1 : 0;
  return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`;
};

/**
 * Circular 3-phase session progression arc:
 * [Ramp-Up 30 s] → [Steady-State plateau = durationMin] → [Ramp-Down 30 s]
 * Drag the ring to configure total session duration.
 */
export const SessionRampChronometer: React.FC<SessionRampChronometerProps> = ({
  durationMin,
  onChange
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  const valueToAngle = (d: number) =>
    SWEEP_START + ((Math.max(MIN_MIN, Math.min(MAX_MIN, d)) - MIN_MIN) / (MAX_MIN - MIN_MIN)) * (SWEEP_END - SWEEP_START);

  const handlePointer = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.buttons === 0 && e.type !== 'pointerdown') return;
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const dx = e.clientX - (rect.left + rect.width / 2);
    const dy = e.clientY - (rect.top + rect.height / 2);
    let angle = (Math.atan2(dx, -dy) * 180) / Math.PI;
    angle = Math.max(SWEEP_START, Math.min(SWEEP_END, angle));
    const d = MIN_MIN + ((angle - SWEEP_START) / (SWEEP_END - SWEEP_START)) * (MAX_MIN - MIN_MIN);
    onChange(Math.round(Math.max(MIN_MIN, Math.min(MAX_MIN, d))));
  };

  const setDuration = (dur: number) => {
    if (Number.isFinite(dur)) onChange(clampDuration(dur));
  };

  const handleKeyDown = (e: React.KeyboardEvent<SVGSVGElement>) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      setDuration(durationMin + 1);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      setDuration(durationMin - 1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      setDuration(MIN_MIN);
    } else if (e.key === 'End') {
      e.preventDefault();
      setDuration(MAX_MIN);
    }
  };

  const plateauAngle = valueToAngle(durationMin);
  const glowColor = '#38BDF8';

  // Fixed-width end-phase wedges riding on the sweep ends (ramp phases are ~30 s each)
  const rampUpA0 = SWEEP_START;
  const rampUpA1 = SWEEP_START + 12;
  const rampDownA0 = SWEEP_END - 12;
  const rampDownA1 = SWEEP_END;
  const plateausA0 = SWEEP_START + 12;

  const playheadTip = polar(50, 50, 43, valueToAngle(durationMin));

  return (
    <div className="panel-card select-none p-3 text-xs">
      <div className="flex items-center justify-between border-b border-slate-800/70 pb-2">
        <span className="flex items-center gap-2 text-[12px] font-semibold tracking-tight text-slate-100">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
          Session duration
        </span>
        <span className="font-mono text-[11px] text-slate-400">5–30 min + ramps</span>
      </div>

      <div className="relative flex justify-center items-center mt-1.5">
        <svg
          ref={svgRef}
          viewBox="0 0 100 100"
          className="w-44 h-44 cursor-pointer touch-none"
          onPointerDown={handlePointer}
          onPointerMove={handlePointer}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          role="slider"
          aria-valuemin={MIN_MIN}
          aria-valuemax={MAX_MIN}
          aria-valuenow={durationMin}
          aria-valuetext={`${durationMin} minutes of steady-state stimulation`}
          aria-label="Session duration in minutes"
        >
          {/* Track */}
          <path d={arcPath(50, 50, 40, SWEEP_START, SWEEP_END)} stroke="#1E293B" strokeWidth="8" fill="none" strokeLinecap="round" />

          {/* Phase 1: Ramp-Up wedge (gentle slope preventing sensory startle) */}
          <path d={arcPath(50, 50, 40, rampUpA0, rampUpA1)} stroke="#10B981" strokeWidth="8" fill="none" strokeLinecap="butt" />

          {/* Phase 2: Steady-state plateau proportional to duration */}
          <path
            d={arcPath(50, 50, 40, plateausA0, Math.max(plateausA0 + 0.5, plateauAngle))}
            stroke={glowColor}
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            className="transition-all duration-200"
            style={{ filter: `drop-shadow(0 0 5px ${glowColor})` }}
          />

          {/* Phase 3: Ramp-Down wedge (gradual decrease preventing phosphenes) */}
          <path d={arcPath(50, 50, 40, rampDownA0, rampDownA1)} stroke="#A78BFA" strokeWidth="8" fill="none" strokeLinecap="butt" />

          {/* Duration playhead */}
          <circle
            cx={playheadTip.x}
            cy={playheadTip.y}
            r="3.4"
            fill={glowColor}
            stroke="#F8FAFC"
            strokeWidth="1"
            className="transition-all duration-200"
          />

          {/* Center chronometer readout */}
          <text
            x="50"
            y="44"
            fill="#38BDF8"
            fontSize="17"
            fontWeight="bold"
            fontFamily="'IBM Plex Mono', monospace"
            textAnchor="middle"
          >
            {durationMin}
          </text>
          <text x="50" y="52" fill="#64748B" fontSize="6.9" fontFamily="'IBM Plex Mono', monospace" textAnchor="middle">
            MIN STEADY-STATE
          </text>
          <text x="50" y="66" fill="#94A3B8" fontSize="8" textAnchor="middle">+ 60 s ramps</text>
        </svg>
      </div>

      {/* Precision stepper */}
      <div className="mt-1 flex items-center justify-center gap-1.5">
        <button
          type="button"
          onClick={() => setDuration(durationMin - 1)}
          className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-700 bg-slate-900 text-sm text-slate-300 transition hover:border-cyan-500/50 hover:text-cyan-300"
          aria-label="Decrease duration by 1 minute"
        >
          −
        </button>
        <label className="flex items-center gap-1 rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1">
          <input
            type="number"
            min={MIN_MIN}
            max={MAX_MIN}
            step="1"
            value={durationMin}
            onChange={(e) => setDuration(parseInt(e.target.value, 10))}
            className="no-spin w-8 bg-transparent text-center font-mono text-[12px] font-semibold text-cyan-300 outline-none"
            aria-label="Session duration value"
          />
          <span className="font-mono text-[10.5px] text-slate-500">min</span>
        </label>
        <button
          type="button"
          onClick={() => setDuration(durationMin + 1)}
          className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-700 bg-slate-900 text-sm text-slate-300 transition hover:border-cyan-500/50 hover:text-cyan-300"
          aria-label="Increase duration by 1 minute"
        >
          +
        </button>
      </div>

      {/* Three-phase legend chips with real durations */}
      <div className="mt-2 grid grid-cols-3 gap-1 border-t border-slate-800/60 pt-1.5 text-[10px]">
        <div className="rounded border border-emerald-800/40 bg-emerald-950/40 px-1 py-1 text-center">
          <div className="font-medium text-emerald-300">Ramp up</div>
          <div className="font-mono text-slate-400">30 s</div>
        </div>
        <div className="rounded border border-sky-800/40 bg-sky-950/40 px-1 py-1 text-center">
          <div className="font-medium text-sky-300">Plateau</div>
          <div className="font-mono text-slate-400">{durationMin} min</div>
        </div>
        <div className="rounded border border-violet-800/40 bg-violet-950/40 px-1 py-1 text-center">
          <div className="font-medium text-violet-300">Ramp down</div>
          <div className="font-mono text-slate-400">30 s</div>
        </div>
      </div>
      <div className="mt-1 text-center text-[10px] leading-snug text-slate-500">
        Full runtime <span className="font-mono text-slate-400">{durationMin} min + 60 s</span> of ramp protection
      </div>
    </div>
  );
};
