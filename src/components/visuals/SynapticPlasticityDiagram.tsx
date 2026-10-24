import React, { useState } from 'react';

interface SynapticPlasticityDiagramProps {
  isAnode: boolean;
  currentMa: number;
}

export const SynapticPlasticityDiagram: React.FC<SynapticPlasticityDiagramProps> = ({
  isAnode,
  currentMa
}) => {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  return (
    <div className="panel-card select-none p-3 text-xs relative">
      <div className="flex items-start justify-between gap-2 border-b border-slate-800/70 pb-2">
        <span className="flex items-center gap-2 text-[12px] font-semibold leading-snug tracking-tight text-slate-100">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          Synaptic dynamics
        </span>
        <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded border ${
          isAnode
            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
            : 'bg-cyan-950/80 text-cyan-300 border-cyan-800'
        }`}>
          {isAnode ? 'LTP-like plasticity · NMDA/Ca²⁺' : 'LTD-like plasticity · endocytosis'}
        </span>
      </div>

      {/* Interactive Molecular Synaptic Diagram */}
      <div className="my-2 bg-slate-950/80 rounded-xl border border-slate-800 p-2 flex justify-center relative">
        <svg viewBox="0 0 240 140" className="w-full h-36">
          <defs>
            <linearGradient id="axonGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1E293B" />
              <stop offset="100%" stopColor="#334155" />
            </linearGradient>
            <linearGradient id="dendriteGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="100%" stopColor="#1E293B" />
            </linearGradient>
          </defs>

          {/* 1. Presynaptic Axon Terminal (Top membrane) */}
          <path
            d="M 20 5 L 220 5 C 220 28, 190 35, 120 35 C 50 35, 20 28, 20 5 Z"
            fill="url(#axonGrad)"
            stroke="#475569"
            strokeWidth="1.2"
          />
          <text x="30" y="20" fill="#94A3B8" fontSize="8">Presynaptic terminal</text>

          {/* Neurotransmitter Vesicles (Glutamate spheres) */}
          <circle cx="80" cy="22" r="4" fill="#10B981" />
          <circle cx="105" cy="25" r="4.5" fill="#10B981" />
          <circle cx="135" cy="24" r="4" fill="#10B981" />
          <circle cx="160" cy="20" r="4" fill="#10B981" />

          {/* Released Neurotransmitters floating in Synaptic Cleft */}
          <circle cx="95" cy="48" r="2.5" fill="#34D399" className="animate-pulse" />
          <circle cx="115" cy="52" r="2.5" fill="#34D399" className="animate-pulse" />
          <circle cx="140" cy="46" r="2.5" fill="#34D399" className="animate-pulse" />

          {/* Synaptic Cleft Label */}
          <text x="215" y="52" fill="#64748B" fontSize="6.9" textAnchor="end">~20nm Cleft</text>

          {/* 2. Postsynaptic Dendritic Spine Membrane (Bottom) */}
          <path
            d="M 20 68 C 60 65, 180 65, 220 68 L 220 135 L 20 135 Z"
            fill="url(#dendriteGrad)"
            stroke="#475569"
            strokeWidth="1.2"
          />
          <text x="30" y="128" fill="#94A3B8" fontSize="8">Postsynaptic dendritic spine</text>

          {/* 3. NMDA Receptor Channel (Center Pore) */}
          <g
            className="cursor-pointer"
            onClick={() => setActiveTooltip(
              isAnode
                ? 'NMDA Opening: Depolarization expels Mg2+ plug, allowing massive Ca2+ influx that triggers LTP.'
                : 'NMDA Blocked: Hyperpolarization keeps Mg2+ plug firmly seated, suppressing Ca2+ entry.'
            )}
          >
            {/* Receptor Walls */}
            <rect x="95" y="64" width="8" height="24" rx="2" fill="#38BDF8" stroke="#0284C7" strokeWidth="1" />
            <rect x="125" y="64" width="8" height="24" rx="2" fill="#38BDF8" stroke="#0284C7" strokeWidth="1" />
            <text x="114" y="62" fill="#38BDF8" fontSize="7.5" textAnchor="middle" fontWeight="bold">NMDA</text>

            {/* Mg2+ Magnesium Plug */}
            {isAnode ? (
              /* Expelled Mg2+ floating out */
              <g className="animate-bounce">
                <circle cx="114" cy="45" r="4.5" fill="#EF4444" stroke="#FCA5A5" strokeWidth="1" />
                <text x="114" y="47" fill="#FFFFFF" fontSize="5.8" textAnchor="middle" fontWeight="bold">Mg²⁺</text>
              </g>
            ) : (
              /* Mg2+ plugged inside pore */
              <g>
                <circle cx="114" cy="74" r="5" fill="#EF4444" stroke="#FCA5A5" strokeWidth="1" />
                <text x="114" y="76" fill="#FFFFFF" fontSize="5.8" textAnchor="middle" fontWeight="bold">Mg²⁺</text>
              </g>
            )}

            {/* Ca2+ Ion Cascade (Golden particles rushing in when unblocked) */}
            {isAnode ? (
              <g className="animate-pulse">
                <circle cx="114" cy="94" r="3" fill="#F59E0B" />
                <circle cx="110" cy="104" r="3.5" fill="#F59E0B" />
                <circle cx="118" cy="112" r="3" fill="#F59E0B" />
                <text x="135" y="106" fill="#FBBF24" fontSize="8" fontWeight="bold">Ca²⁺ Influx ⚡</text>
              </g>
            ) : (
              <text x="135" y="106" fill="#64748B" fontSize="6.9">Ca²⁺ Blocked</text>
            )}
          </g>

          {/* 4. AMPA Receptor Channels (Insertion vs Internalization) */}
          <g
            className="cursor-pointer"
            onClick={() => setActiveTooltip(
              isAnode
                ? 'AMPA Insertion: Ca2+ cascade recruits intracellular AMPA receptors to the membrane surface.'
                : 'AMPA Endocytosis: Internalization of AMPA receptors weakens synaptic sensitivity (LTD).'
            )}
          >
            {/* AMPA Channel 1 */}
            <rect x="55" y="64" width="7" height="20" rx="1.5" fill="#10B981" />
            <rect x="65" y="64" width="7" height="20" rx="1.5" fill="#10B981" />
            <text x="63" y="62" fill="#34D399" fontSize="7.5" textAnchor="middle">AMPA</text>

            {/* AMPA Channel 2 (Budding if Anode, Internalized if Cathode) */}
            {isAnode ? (
              <g>
                <rect x="165" y="64" width="7" height="20" rx="1.5" fill="#10B981" className="animate-pulse" />
                <rect x="175" y="64" width="7" height="20" rx="1.5" fill="#10B981" className="animate-pulse" />
                <text x="173" y="62" fill="#34D399" fontSize="7.5" textAnchor="middle">+AMPA</text>
              </g>
            ) : (
              <g opacity="0.4">
                <rect x="170" y="88" width="10" height="10" rx="3" fill="#64748B" stroke="#475569" />
                <text x="175" y="106" fill="#94A3B8" fontSize="6.3" textAnchor="middle">Endocytosis</text>
              </g>
            )}
          </g>
        </svg>

        {/* Micro-Tooltip Popup */}
        {activeTooltip && (
          <div className="absolute inset-x-2 bottom-2 bg-slate-900/95 border border-amber-500/60 p-2 rounded-lg shadow-2xl text-[11px] text-slate-200 backdrop-blur-md flex items-center justify-between z-20">
            <span>{activeTooltip}</span>
            <button
              onClick={() => setActiveTooltip(null)}
              className="ml-2 text-slate-400 hover:text-white font-bold"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
        <span>At {currentMa.toFixed(1)} mA — Click channels to inspect</span>
        <span className="text-amber-400 font-bold">{isAnode ? '↑ BDNF Facilitated' : '↓ BDNF Resting'}</span>
      </div>
    </div>
  );
};
