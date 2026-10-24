import React, { useState } from 'react';
import { BRAIN_NODES } from '../../data/brain_nodes';

interface ScalpTopomap1020Props {
  anodeId: string;
  cathodeId: string;
  montageType: 'sponge' | 'hd4x1';
  surroundNodes?: string[];
  onSelectNode: (nodeId: string, polarity: 'anode' | 'cathode') => void;
  onFlipPolarity: () => void;
}

// 2D Scalp Projected Coordinates (Center at 100, 100; Radius = 75)
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

  Oz: { x: 100, y: 168 },
  O1: { x: 76, y: 164 },
  O2: { x: 124, y: 164 }
};

export const ScalpTopomap1020: React.FC<ScalpTopomap1020Props> = ({
  anodeId,
  cathodeId,
  montageType,
  surroundNodes,
  onSelectNode,
  onFlipPolarity
}) => {
  const [activeMenuNode, setActiveMenuNode] = useState<string | null>(null);

  const isHD = montageType === 'hd4x1';

  return (
    <div className="panel-card select-none p-3 text-xs relative">
      <div className="flex items-start justify-between gap-2 border-b border-slate-800/70 pb-2">
        <span className="flex items-center gap-2 text-[12px] font-semibold leading-snug tracking-tight text-slate-100">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          Scalp compass · 10–20
        </span>
        <button
          onClick={onFlipPolarity}
          className="text-[11px] text-slate-400 hover:text-cyan-300 transition flex items-center gap-1 bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded cursor-pointer"
          title="Swap anode and cathode polarity"
        >
          <span aria-hidden="true">⇄</span> Swap
        </button>
      </div>

      {/* Top-down Azimuthal Calvarium Map */}
      <div className="relative flex justify-center items-center py-1">
        <svg viewBox="0 0 200 200" className="h-44 w-44 drop-shadow">
          {/* Calvarium Outline */}
          <circle cx="100" cy="100" r="76" fill="#070B12" stroke="#1E293B" strokeWidth="2" />

          {/* Anterior Nose Notch (Nasion ▲) */}
          <path d="M 94 24 L 100 12 L 106 24 Z" fill="#1E293B" stroke="#334155" strokeWidth="1.2" />
          <text x="100" y="9" fill="#64748B" fontSize="7.5" textAnchor="middle">Nasion ▲</text>

          {/* Left Ear (LPA) */}
          <path d="M 24 92 C 16 92, 16 108, 24 108" fill="none" stroke="#334155" strokeWidth="1.5" />
          <text x="15" y="103" fill="#64748B" fontSize="7.5" textAnchor="end">L</text>

          {/* Right Ear (RPA) */}
          <path d="M 176 92 C 184 92, 184 108, 176 108" fill="none" stroke="#334155" strokeWidth="1.5" />
          <text x="185" y="103" fill="#64748B" fontSize="7.5" textAnchor="start">R</text>

          {/* Posterior Inion Notch (Inion ▼) */}
          <text x="100" y="192" fill="#64748B" fontSize="7.5" textAnchor="middle">▼ Inion</text>

          {/* Meridian concentric alignment circles */}
          <circle cx="100" cy="100" r="54" fill="none" stroke="#0F172A" strokeWidth="1" strokeDasharray="3 3" />
          <line x1="100" y1="24" x2="100" y2="176" stroke="#0F172A" strokeWidth="1" strokeDasharray="3 3" />
          <line x1="24" y1="100" x2="176" y2="100" stroke="#0F172A" strokeWidth="1" strokeDasharray="3 3" />

          {/* HD 4x1 Return Circuit Lines */}
          {isHD && surroundNodes && (
            <g>
              {surroundNodes.map((sId) => {
                const aPos = TOPOMAP_COORDS[anodeId];
                const sPos = TOPOMAP_COORDS[sId];
                if (!aPos || !sPos) return null;
                return (
                  <line
                    key={sId}
                    x1={aPos.x}
                    y1={aPos.y}
                    x2={sPos.x}
                    y2={sPos.y}
                    stroke="#0EA5E9"
                    strokeWidth="1.2"
                    strokeDasharray="2 2"
                    opacity="0.8"
                  />
                );
              })}
            </g>
          )}

          {/* 10-20 Electrodes Nodes */}
          {Object.entries(TOPOMAP_COORDS).map(([id, pos]) => {
            const isAnode = id === anodeId;
            const isCathode = id === cathodeId || (isHD && surroundNodes?.includes(id));
            const isSurround = isHD && surroundNodes?.includes(id);

            return (
              <g
                key={id}
                className="group cursor-pointer"
                onClick={() => setActiveMenuNode(activeMenuNode === id ? null : id)}
              >
                {/* Static equipotential rings: a still "field ripple" texture
                    around each active electrode instead of a flashing pulse. */}
                {(isAnode || (isCathode && !isSurround)) &&
                  [10.5, 13.5, 16.5].map((r, ring) => (
                    <circle
                      key={r}
                      cx={pos.x}
                      cy={pos.y}
                      r={r}
                      fill="none"
                      stroke={isAnode ? '#F87171' : '#22D3EE'}
                      strokeWidth={1.1 - ring * 0.25}
                      strokeDasharray={ring === 0 ? undefined : '1.5 1.8'}
                      opacity={0.7 - ring * 0.22}
                      pointerEvents="none"
                    />
                  ))}

                {/* Base Node Circle */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r="7.5"
                  fill={
                    isAnode
                      ? '#EF4444'
                      : isCathode
                      ? isSurround
                        ? '#0284C7'
                        : '#06B6D4'
                      : '#1E293B'
                  }
                  stroke={
                    isAnode
                      ? '#FCA5A5'
                      : isCathode
                      ? '#67E8F9'
                      : '#475569'
                  }
                  strokeWidth="1.2"
                  className="transition-colors group-hover:stroke-cyan-300"
                />

                {/* Node Label Text */}
                <text
                  x={pos.x}
                  y={pos.y + 2.5}
                  fill={isAnode || isCathode ? '#FFFFFF' : '#94A3B8'}
                  fontSize="6.9"
                  fontWeight={isAnode || isCathode ? 'bold' : 'normal'}
                  textAnchor="middle"
                  pointerEvents="none"
                >
                  {id}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Tactile Radial Node Selection Flyout */}
        {activeMenuNode && (
          <div className="absolute inset-x-2 bottom-1 bg-slate-950/95 border border-cyan-500/60 rounded-lg p-2 shadow-2xl backdrop-blur-md flex items-center justify-between z-20 animate-in fade-in zoom-in-95">
            <div className="text-[12px]">
              <span className="font-bold text-white">{activeMenuNode}</span>
              <span className="text-[10.5px] text-slate-400 block">
                {BRAIN_NODES[activeMenuNode]?.shortName || 'Scalp Landmark'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  onSelectNode(activeMenuNode, 'anode');
                  setActiveMenuNode(null);
                }}
                className="px-2 py-1 rounded bg-red-600 hover:bg-red-500 text-white font-bold text-[11px] transition cursor-pointer shadow-sm"
              >
                + Anode
              </button>
              <button
                onClick={() => {
                  onSelectNode(activeMenuNode, 'cathode');
                  setActiveMenuNode(null);
                }}
                className="px-2 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[11px] transition cursor-pointer shadow-sm"
              >
                – Cathode
              </button>
              <button
                onClick={() => setActiveMenuNode(null)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Active Dipole Circuit Pill */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[11px]">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          <span className="font-mono font-semibold text-rose-300">{anodeId}</span>
          <span className="text-slate-500">→</span>
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          <span className="font-mono font-semibold text-cyan-300">
            {isHD ? 'HD 4×1 ring' : cathodeId}
          </span>
        </div>
        <span className="text-slate-400 text-[10.5px]">Click a node to assign</span>
      </div>
    </div>
  );
};
