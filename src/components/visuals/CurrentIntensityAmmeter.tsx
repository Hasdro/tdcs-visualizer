import React, { useRef } from 'react';

interface CurrentIntensityAmmeterProps {
  currentMa: number;
  onChange: (ma: number) => void;
}

const MIN_MA = 0.5;
const MAX_MA = 2.5;
const SWEEP_START = -135; // degrees (from 12 o'clock, clockwise positive)
const SWEEP_END = 135;

const clampCurrent = (ma: number) =>
  parseFloat(Math.max(MIN_MA, Math.min(MAX_MA, ma)).toFixed(1));

/**
 * Polar → Cartesian helper for the ammeter arc geometry
 */
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

export const CurrentIntensityAmmeter: React.FC<CurrentIntensityAmmeterProps> = ({
  currentMa,
  onChange
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  const valueToAngle = (ma: number) =>
    SWEEP_START + ((Math.max(MIN_MA, Math.min(MAX_MA, ma)) - MIN_MA) / (MAX_MA - MIN_MA)) * (SWEEP_END - SWEEP_START);

  // Drag anywhere on the dial face to sweep the needle
  const handlePointer = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.buttons === 0 && e.type !== 'pointerdown') return;
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    let angle = (Math.atan2(dx, -dy) * 180) / Math.PI;
    angle = Math.max(SWEEP_START, Math.min(SWEEP_END, angle));
    const ma = MIN_MA + ((angle - SWEEP_START) / (SWEEP_END - SWEEP_START)) * (MAX_MA - MIN_MA);
    onChange(parseFloat(Math.max(MIN_MA, Math.min(MAX_MA, ma)).toFixed(1)));
  };

  const setCurrent = (ma: number) => {
    if (Number.isFinite(ma)) onChange(clampCurrent(ma));
  };

  const handleKeyDown = (e: React.KeyboardEvent<SVGSVGElement>) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      setCurrent(currentMa + 0.1);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      setCurrent(currentMa - 0.1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      setCurrent(MIN_MA);
    } else if (e.key === 'End') {
      e.preventDefault();
      setCurrent(MAX_MA);
    }
  };

  const needleAngle = valueToAngle(currentMa);
  // Safety color state: emerald conventional (≤1.0), amber standard research (≤2.0), rose peak (>2.0)
  const zoneColor = currentMa <= 1.0 ? '#10B981' : currentMa <= 2.0 ? '#F59E0B' : '#EF4444';
  const zoneLabel = currentMa <= 1.0 ? 'Conventional band' : currentMa <= 2.0 ? 'Standard research band' : 'High intensity · caution';

  const needleTip = polar(50, 50, 30, needleAngle);
  const needleTail = polar(50, 50, 7, needleAngle + 180);

  return (
    <div className="panel-card select-none p-3 text-xs">
      <div className="flex items-center justify-between border-b border-slate-800/70 pb-2">
        <span className="flex items-center gap-2 text-[14px] font-semibold tracking-tight text-slate-100">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
          Current intensity
        </span>
        <span className="font-mono text-[13px] text-slate-400">0.5–2.5 mA</span>
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
          aria-valuemin={MIN_MA}
          aria-valuemax={MAX_MA}
          aria-valuenow={currentMa}
          aria-valuetext={`${currentMa.toFixed(1)} milliamps`}
          aria-label="Current intensity in milliamps"
        >
          {/* Safety threshold zones: emerald 0.5–1.0 / amber 1.0–2.0 / red 2.0–2.5 */}
          <path d={arcPath(50, 50, 40, valueToAngle(0.5), valueToAngle(1.0))} stroke="#10B981" strokeWidth="7" fill="none" opacity="0.75" strokeLinecap="butt" />
          <path d={arcPath(50, 50, 40, valueToAngle(1.0), valueToAngle(2.0))} stroke="#F59E0B" strokeWidth="7" fill="none" opacity="0.75" />
          <path d={arcPath(50, 50, 40, valueToAngle(2.0), valueToAngle(2.5))} stroke="#EF4444" strokeWidth="7" fill="none" opacity="0.75" />

          {/* Fine tick scale */}
          {[0.5, 1.0, 1.5, 2.0, 2.5].map((t) => {
            const tickA = valueToAngle(t);
            const o = polar(50, 50, 34, tickA);
            const inn = polar(50, 50, 30, tickA);
            return (
              <g key={t}>
                <line x1={o.x} y1={o.y} x2={inn.x} y2={inn.y} stroke="#64748B" strokeWidth="1" />
                <text
                  x={polar(50, 50, 25, tickA).x}
                  y={polar(50, 50, 25, tickA).y + 2}
                  fill="#64748B"
                  fontSize="6.3"
                  fontFamily="'IBM Plex Mono', monospace"
                  textAnchor="middle"
                >
                  {t.toFixed(1)}
                </text>
              </g>
            );
          })}

          {/* Needle physics: tail + glow + hub */}
          <line
            x1={needleTail.x} y1={needleTail.y}
            x2={needleTip.x} y2={needleTip.y}
            stroke={zoneColor}
            strokeWidth="2.4"
            strokeLinecap="round"
            className="transition-all duration-150"
            style={{ filter: `drop-shadow(0 0 5px ${zoneColor})` }}
          />
          <circle cx="50" cy="50" r="4" fill="#1E293B" stroke={zoneColor} strokeWidth="1.5" />

          {/* Digital readout inside the dial face */}
          <text
            x="50"
            y="72"
            fill={zoneColor}
            fontSize="13"
            fontWeight="bold"
            fontFamily="'IBM Plex Mono', monospace"
            textAnchor="middle"
          >
            {currentMa.toFixed(1)}
          </text>
          <text x="50" y="79" fill="#64748B" fontSize="6.3" fontFamily="'IBM Plex Mono', monospace" textAnchor="middle">
            mA INJECTED
          </text>
        </svg>
      </div>

      {/* Precision stepper keeps the dial keyboard- and number-friendly */}
      <div className="mt-1 flex items-center justify-center gap-1.5">
        <button
          type="button"
          onClick={() => setCurrent(currentMa - 0.1)}
          className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-700 bg-slate-900 text-sm text-slate-300 transition hover:border-amber-500/50 hover:text-amber-300"
          aria-label="Decrease current by 0.1 milliamp"
        >
          −
        </button>
        <label className="flex items-center gap-1 rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1">
          <input
            type="number"
            min={MIN_MA}
            max={MAX_MA}
            step="0.1"
            value={currentMa}
            onChange={(e) => setCurrent(parseFloat(e.target.value))}
            className="no-spin w-10 bg-transparent text-center font-mono text-[14px] font-semibold text-amber-300 outline-none"
            aria-label="Current intensity value"
          />
          <span className="font-mono text-[12.5px] text-slate-500">mA</span>
        </label>
        <button
          type="button"
          onClick={() => setCurrent(currentMa + 0.1)}
          className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-700 bg-slate-900 text-sm text-slate-300 transition hover:border-amber-500/50 hover:text-amber-300"
          aria-label="Increase current by 0.1 milliamp"
        >
          +
        </button>
      </div>

      {/* Safety zone chips */}
      <div className="mt-2 flex items-center justify-between gap-1 border-t border-slate-800/60 pt-1.5 text-[12.5px]">
        <span className="flex items-center gap-1 text-emerald-400"><span className="h-2 w-2 rounded-sm bg-emerald-500" />≤1.0 mild</span>
        <span className="flex items-center gap-1 text-amber-400"><span className="h-2 w-2 rounded-sm bg-amber-500" />≤2.0 standard</span>
        <span className="flex items-center gap-1 text-rose-400"><span className="h-2 w-2 rounded-sm bg-rose-500" />&gt;2.0 caution</span>
      </div>
      <div
        className={`mt-1 rounded border px-2 py-0.5 text-center text-[12.5px] font-medium ${
          currentMa <= 1.0
            ? 'bg-emerald-950/50 text-emerald-300 border-emerald-800/60'
            : currentMa <= 2.0
            ? 'bg-amber-950/50 text-amber-300 border-amber-800/60'
            : 'bg-rose-950/50 text-rose-300 border-rose-800/60'
        }`}
      >
        {zoneLabel}
      </div>
    </div>
  );
};
