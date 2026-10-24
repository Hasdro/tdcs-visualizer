import React from 'react';
import { BiophysicalTelemetry } from '../../utils/biophysicsEngine';

interface CognitiveImpactRadarProps {
  telemetry: BiophysicalTelemetry;
}

export const CognitiveImpactRadar: React.FC<CognitiveImpactRadarProps> = ({ telemetry }) => {
  const m = telemetry.compositeMetrics;

  // 6 Cognitive Dimensions
  const metrics = [
    { label: 'Executive Focus', value: Math.max(0, m.focus) },
    { label: 'Mood Valence', value: Math.max(0, m.mood) },
    { label: 'Motor Speed', value: Math.max(0, m.motorSpeed) },
    { label: 'Speech Fluency', value: Math.max(0, m.language) },
    { label: 'Pain Tolerance', value: Math.max(0, m.painThreshold) },
    { label: 'Visual Contrast', value: Math.max(0, m.visualAcuity) }
  ];

  // Hexagon geometry
  const cx = 110;
  const cy = 95;
  const maxR = 68;
  const numAxes = 6;

  const getCoordinates = (index: number, radius: number) => {
    // Top vertex at index 0 (angle = -90 deg)
    const angle = ((index * (360 / numAxes) - 90) * Math.PI) / 180;
    return {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle)
    };
  };

  // Generate web concentric rings (25%, 50%, 75%, 100%)
  const rings = [0.25, 0.50, 0.75, 1.0];

  // Active polygon path
  const activePoints = metrics.map((m, i) => {
    // Value is 0 to 100%. Normalize radius
    const r = Math.max(12, Math.min(maxR, 14 + (m.value / 100) * (maxR - 14)));
    return getCoordinates(i, r);
  });
  const activePolygonPath = activePoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

  // Baseline polygon path (at 30% baseline)
  const baselinePoints = metrics.map((_, i) => getCoordinates(i, maxR * 0.35));
  const baselinePolygonPath = baselinePoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

  return (
    <div className="bg-[#0C121E]/95 border border-slate-800/90 rounded-xl p-3 shadow-xl select-none font-mono text-xs">
      <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/60 text-[11px]">
        <span className="font-bold text-slate-200 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          COGNITIVE PERFORMANCE RADAR
        </span>
        <span className="text-[10px] text-emerald-300 font-semibold">HEXAGONAL PROJECTION</span>
      </div>

      <div className="relative flex justify-center items-center py-1">
        <svg viewBox="0 0 220 190" className="w-56 h-auto drop-shadow-md overflow-visible">
          <defs>
            <linearGradient id="radarFill" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.35" />
            </linearGradient>
          </defs>

          {/* Web Concentric Hexagonal Rings */}
          {rings.map((factor, rIdx) => {
            const pts = Array.from({ length: numAxes }, (_, i) => getCoordinates(i, maxR * factor));
            const pathStr = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
            return (
              <path
                key={rIdx}
                d={pathStr}
                fill="none"
                stroke="#1E293B"
                strokeWidth="1"
                strokeDasharray={rIdx === rings.length - 1 ? 'none' : '2 2'}
              />
            );
          })}

          {/* Radial Spokes */}
          {Array.from({ length: numAxes }, (_, i) => {
            const end = getCoordinates(i, maxR);
            return (
              <line
                key={i}
                x1={cx}
                y1={cy}
                x2={end.x}
                y2={end.y}
                stroke="#1E293B"
                strokeWidth="1"
              />
            );
          })}

          {/* Normative Baseline Polygon (Muted dashed line) */}
          <path
            d={baselinePolygonPath}
            fill="none"
            stroke="#475569"
            strokeWidth="1.2"
            strokeDasharray="3 3"
          />

          {/* Active Stimulation Footprint Polygon */}
          <path
            d={activePolygonPath}
            fill="url(#radarFill)"
            stroke="#10B981"
            strokeWidth="2"
            className="transition-all duration-300 ease-out"
          />

          {/* Vertex Glowing Pips & Labels */}
          {activePoints.map((p, i) => {
            const m = metrics[i];
            const labelCoord = getCoordinates(i, maxR + 15);
            return (
              <g key={i}>
                <circle cx={p.x} cy={p.y} r="3" fill="#10B981" stroke="#FFFFFF" strokeWidth="1" />
                <text
                  x={labelCoord.x}
                  y={labelCoord.y + (i === 0 ? -2 : i === 3 ? 6 : 2)}
                  fill={m.value > 15 ? '#34D399' : '#94A3B8'}
                  fontSize="7.5"
                  fontWeight={m.value > 15 ? 'bold' : 'normal'}
                  textAnchor={i === 0 || i === 3 ? 'middle' : i < 3 ? 'start' : 'end'}
                >
                  {m.label} ({m.value > 0 ? `+${m.value}%` : `${m.value}%`})
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend Footprint Guide */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-[10px]">
        <div className="flex items-center gap-1.5 text-slate-400">
          <span className="w-2 h-0.5 bg-slate-500 border-dashed" />
          <span>Normative Baseline</span>
        </div>
        <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
          <span className="w-2 h-0.5 bg-emerald-400" />
          <span>Stimulation Footprint</span>
        </div>
      </div>
    </div>
  );
};
