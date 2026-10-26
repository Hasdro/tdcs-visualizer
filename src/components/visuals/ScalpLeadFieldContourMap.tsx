import React from 'react';
import { MultiChannelChannel } from '../../utils/biophysicsEngine';

interface ScalpLeadFieldContourMapProps {
  channels: MultiChannelChannel[];
}

// Top-down azimuthal coordinates (same 10-20 projection language as the Scalp Compass)
const TOPOMAP_COORDS: Record<string, { x: number; y: number }> = {
  Fpz: { x: 100, y: 32 },
  Fp1: { x: 74, y: 36 },
  Fp2: { x: 126, y: 36 },
  F7: { x: 42, y: 60 },
  F3: { x: 70, y: 64 },
  Fz: { x: 100, y: 66 },
  F4: { x: 130, y: 64 },
  F8: { x: 158, y: 60 },
  T7: { x: 30, y: 100 },
  C3: { x: 65, y: 100 },
  Cz: { x: 100, y: 100 },
  C4: { x: 135, y: 100 },
  T8: { x: 170, y: 100 },
  P7: { x: 42, y: 140 },
  P3: { x: 70, y: 136 },
  Pz: { x: 100, y: 134 },
  P4: { x: 130, y: 136 },
  P8: { x: 158, y: 140 },
  O1: { x: 76, y: 164 },
  O2: { x: 124, y: 164 },
  Oz: { x: 100, y: 168 }
};

interface ElectrodeVisual {
  id: string;
  x: number;
  y: number;
  ma: number;
  polarity: 'anode' | 'cathode' | 'neutral';
  weight: number; // |I| relative to strongest channel
}

/**
 * Real-time scalp lead-field visualizer:
 * isopotential voltage contours (red +V anodal – blue −V cathodal) and animated
 * current streamlines flowing from the strongest anode into the surrounding return sinks.
 */
export const ScalpLeadFieldContourMap: React.FC<ScalpLeadFieldContourMapProps> = ({
  channels
}) => {
  const maxMa = Math.max(...channels.map((c) => Math.abs(c.currentMa)), 0.01);
  const SKULL_SIGMA = 30; // spatial spread (px) of the injected potential on the scalp plane

  const electrodes: ElectrodeVisual[] = channels
    .map((ch) => {
      const pos = TOPOMAP_COORDS[ch.nodeId];
      if (!pos) return null;
      return {
        id: ch.nodeId,
        x: pos.x,
        y: pos.y,
        ma: ch.currentMa,
        polarity: ch.currentMa > 0 ? 'anode' : ch.currentMa < 0 ? 'cathode' : 'neutral',
        weight: Math.abs(ch.currentMa) / maxMa
      } as ElectrodeVisual;
    })
    .filter((e): e is ElectrodeVisual => e !== null);

  const anodes = electrodes.filter((e) => e.polarity === 'anode');
  const cathodes = electrodes.filter((e) => e.polarity === 'cathode');

  // Dominant streamlines: strongest anode → two nearest cathodes (avoids ribbon spaghetti)
  const source = anodes.slice().sort((a, b) => b.weight - a.weight)[0];
  const sinks = cathodes
    .slice()
    .sort(
      (a, b) =>
        (a.x - source?.x) ** 2 + (a.y - source?.y) ** 2 -
        ((b.x - source?.x) ** 2 + (b.y - source?.y) ** 2)
    )
    .slice(0, 2);

  return (
    <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800/60 flex flex-col items-center">
      <div className="flex items-center justify-between w-full text-[12.5px] font-mono text-slate-400 mb-1">
        <span>Lead-field isopotential map</span>
        <span>
          <span className="text-red-400">+V anodal</span> · <span className="text-cyan-400">−V cathodal</span>
        </span>
      </div>

      <svg viewBox="0 0 200 200" className="w-40 h-40">
        {/* Calvarium */}
        <circle cx="100" cy="100" r="76" fill="#070B12" stroke="#1E293B" strokeWidth="2" />
        <path d="M 94 24 L 100 12 L 106 24 Z" fill="#1E293B" />
        <circle cx="100" cy="100" r="54" fill="none" stroke="#0F172A" strokeWidth="1" strokeDasharray="3 3" />

        <defs>
          {electrodes.map((e, i) => {
            const color = e.polarity === 'anode' ? '#EF4444' : '#06B6D4';
            const uid = `lf${i}`;
            return (
              <radialGradient key={uid} id={uid} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={color} stopOpacity={0.55 * e.weight + 0.1} />
                <stop offset="55%" stopColor={color} stopOpacity={0.18 * e.weight} />
                <stop offset="100%" stopColor={color} stopOpacity="0" />
              </radialGradient>
            );
          })}
        </defs>

        {/* Isopotential halos: red positive potential wells under anodes, blue sinks under cathodes */}
        {electrodes.map((e, i) => (
          <circle
            key={e.id}
            cx={e.x}
            cy={e.y}
            r={SKULL_SIGMA * (0.65 + e.weight * 0.75)}
            fill={`url(#lf${i})`}
          />
        ))}

        {/* Isopotential contour rings (dashed equipotentials) */}
        {electrodes.map((e) => (
          <g key={`ring-${e.id}`} opacity={0.4 + 0.5 * e.weight}>
            {[0.55, 1.0].map((f) => (
              <circle
                key={f}
                cx={e.x}
                cy={e.y}
                r={SKULL_SIGMA * f * (0.6 + e.weight * 0.8)}
                fill="none"
                stroke={e.polarity === 'anode' ? '#FCA5A5' : '#7DD3FC'}
                strokeWidth="0.7"
                strokeDasharray="2 2.5"
                opacity={0.45 * e.weight + 0.2}
              />
            ))}
          </g>
        ))}

        {/* Animated current streamlines: anodal source → nearest return sinks */}
        {source && sinks.map((sink) => (
          <path
            key={`flow-${sink.id}`}
            d={`M ${source.x} ${source.y} C ${(source.x + sink.x) / 2 + 14}, ${(source.y + sink.y) / 2 - 14}, ${(source.x + sink.x) / 2 + 14}, ${(source.y + sink.y) / 2 + 14}, ${sink.x} ${sink.y}`}
            fill="none"
            stroke="#FBBF24"
            strokeWidth={Math.max(1, source.weight * 2.2)}
            strokeDasharray="5 4"
            opacity="0.8"
          >
            <animate attributeName="stroke-dashoffset" from="18" to="0" dur="0.9s" repeatCount="indefinite" />
          </path>
        ))}

        {/* Electrode pins + labels */}
        {electrodes.map((e) => (
          <g key={e.id}>
            <circle
              cx={e.x}
              cy={e.y}
              r={3 + e.weight * 2.5}
              fill={e.polarity === 'anode' ? '#EF4444' : '#06B6D4'}
              stroke="#F8FAFC"
              strokeWidth="0.9"
            />
            <text
              x={e.x}
              y={e.y - 5.5}
              fill={e.polarity === 'anode' ? '#FCA5A5' : '#7DD3FC'}
              fontSize="6.9"
              fontWeight="bold"
              textAnchor="middle"
            >
              {e.id}
            </text>
            <text x={e.x} y={e.y + 9} fill="#94A3B8" fontSize="6" textAnchor="middle">
              {e.polarity === 'anode' ? '+' : '−'}{Math.abs(e.ma).toFixed(2)}
            </text>
          </g>
        ))}
      </svg>

      {/* Live Kirchhoff confirmation strip */}
      <div className="w-full flex items-center justify-between text-[12px] font-mono mt-1 pt-1 border-t border-slate-800/60">
        <span className="text-red-400 font-bold">{anodes.length} A · {anodes.reduce((s, e) => s + e.ma, 0).toFixed(2)}mA</span>
        <span className="text-slate-500">ΣI conservation →</span>
        <span className="text-cyan-400 font-bold">{cathodes.length} S · {Math.abs(cathodes.reduce((s, e) => s + e.ma, 0)).toFixed(2)}mA</span>
      </div>
    </div>
  );
};
