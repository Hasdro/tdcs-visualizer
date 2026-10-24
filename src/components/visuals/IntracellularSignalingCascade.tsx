import React from 'react';

interface IntracellularSignalingCascadeProps {
  isAnode: boolean;
  currentMa: number;
}

/**
 * Interactive molecular pathway flowchart inside a dendritic spine.
 * Anodal: ΔVm → NMDA unblock → Ca²⁺ influx → { CaMKII → AMPA insertion (LTP) | CREB → BDNF/TrkB }
 * Cathodal: cascade stalls at the strengthened Mg²⁺ block; calcineurin drives AMPA endocytosis (LTD).
 */
export const IntracellularSignalingCascade: React.FC<IntracellularSignalingCascadeProps> = ({
  isAnode,
  currentMa
}) => {
  // Cascade flow velocity scales with the applied current (0.5 -> slow bleed, 2.5 -> rapid cascade)
  const flowDur = (2.6 / Math.max(0.4, Math.min(1.4, currentMa / 1.4))).toFixed(2);

  const NODE_ACTIVE = isAnode ? undefined : 'opacity-30';
  const trunkColor = isAnode ? '#34D399' : '#38BDF8';
  const spineBg = isAnode ? 'rgba(245, 158, 11, 0.05)' : 'rgba(56, 189, 248, 0.05)';

  return (
    <div className="panel-card select-none p-3 text-xs">
      <div className="flex items-start justify-between gap-2 border-b border-slate-800/70 pb-2">
        <span className="flex items-center gap-2 text-[12px] font-semibold leading-snug tracking-tight text-slate-100">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          Intracellular cascade
        </span>
        <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded border ${
          isAnode
            ? 'text-emerald-300 bg-emerald-950/60 border-emerald-800/60'
            : 'text-sky-300 bg-sky-950/60 border-sky-800/60'
        }`}>
          {isAnode ? 'LTP-like potentiation' : 'LTD-like depression'}
        </span>
      </div>

      <svg viewBox="0 0 260 208" className="w-full mt-1.5">
        {/* Dendritic spine silhouette backdrop */}
        <path
          d="M 118 208 L 118 190 C 60 190, 18 170, 18 120 C 18 62, 62 10, 130 10 C 198 10, 242 62, 242 120 C 242 170, 200 190, 142 190 L 142 208 Z"
          fill={spineBg}
          stroke={isAnode ? '#78350F' : '#0C4A6E'}
          strokeWidth="1.4"
          opacity="0.9"
        />
        <text x="130" y="204" fill="#475569" fontSize="8" textAnchor="middle" fontStyle="italic">
          Dendritic spine head — postsynaptic terminal
        </text>

        {/* ===== Inter-node connector trunks ===== */}
        <path d="M 130 34 L 130 48" stroke={trunkColor} strokeWidth="2.4" opacity={isAnode ? 0.85 : 0.35} />
        <path d="M 130 76 L 130 90" stroke={trunkColor} strokeWidth="2.4" opacity={isAnode ? 0.85 : 0.3} />
        {/* Branch split to CaMKII (left) and CREB (right) */}
        <path d="M 122 94 C 70 100, 52 106, 45 118" stroke="#FBBF24" strokeWidth="2" fill="none" opacity={isAnode ? 0.8 : 0.2} />
        <path d="M 138 94 C 190 100, 208 106, 215 118" stroke="#A78BFA" strokeWidth="2" fill="none" opacity={isAnode ? 0.8 : 0.2} />
        {/* Left arm: CaMKII → AMPA insertion */}
        <line x1="45" y1="142" x2="45" y2="156" stroke="#FBBF24" strokeWidth="2" opacity={isAnode ? 0.8 : 0.2} />
        {/* Right arm: CREB → BDNF */}
        <line x1="215" y1="142" x2="215" y2="156" stroke="#A78BFA" strokeWidth="2" opacity={isAnode ? 0.8 : 0.2} />

        {/* Cathodal lateral inhibition arm: Calcineurin → AMPA endocytosis */}
        {!isAnode && (
          <>
            <path d="M 122 94 C 90 104, 78 106, 66 114" stroke="#38BDF8" strokeWidth="2" fill="none" strokeDasharray="3 2" />
            <line x1="66" y1="142" x2="66" y2="156" stroke="#38BDF8" strokeWidth="2" strokeDasharray="3 2" />
          </>
        )}

        {/* ===== Animated glowing second-messenger particles along the cascade ===== */}
        {isAnode && currentMa > 0.4 && (
          <g>
            {/* δVm → NMDA */}
            <circle r="2.6" fill="#F8FAFC">
              <animateMotion dur={`${flowDur}s`} repeatCount="indefinite" path="M 130 34 L 130 48" />
            </circle>
            {/* NMDA → Ca²⁺ */}
            <circle r="2.6" fill="#FBBF24">
              <animateMotion dur={`${flowDur}s`} repeatCount="indefinite" path="M 130 76 L 130 90" begin={`${(parseFloat(flowDur) * 0.4).toFixed(2)}s`} />
            </circle>
            {/* Ca²⁺ → CaMKII */}
            <circle r="2.2" fill="#FBBF24" opacity="0.9">
              <animateMotion dur={`${(parseFloat(flowDur) * 1.1).toFixed(2)}s`} repeatCount="indefinite" path="M 122 94 C 70 100, 52 106, 45 118" begin={`${(parseFloat(flowDur) * 0.8).toFixed(2)}s`} />
            </circle>
            {/* Ca²⁺ → CREB */}
            <circle r="2.2" fill="#A78BFA" opacity="0.9">
              <animateMotion dur={`${(parseFloat(flowDur) * 1.1).toFixed(2)}s`} repeatCount="indefinite" path="M 138 94 C 190 100, 208 106, 215 118" begin={`${(parseFloat(flowDur) * 0.8).toFixed(2)}s`} />
            </circle>
            {/* CaMKII → AMPA docking */}
            <circle r="2.2" fill="#FBBF24">
              <animateMotion dur={`${(parseFloat(flowDur) * 0.9).toFixed(2)}s`} repeatCount="indefinite" path="M 45 142 L 45 156" begin={`${(parseFloat(flowDur) * 1.3).toFixed(2)}s`} />
            </circle>
            {/* CREB → BDNF */}
            <circle r="2.2" fill="#C4B5FD">
              <animateMotion dur={`${(parseFloat(flowDur) * 0.9).toFixed(2)}s`} repeatCount="indefinite" path="M 215 142 L 215 156" begin={`${(parseFloat(flowDur) * 1.3).toFixed(2)}s`} />
            </circle>
          </g>
        )}

        {/* ===== Node 1: Somatic Depolarization ΔVm ===== */}
        <g className={NODE_ACTIVE}>
          <title>Somatic membrane depolarization: tDCS shifts the resting Vm by +0.2 to +1.6 mV — sub-threshold but decisive (Nitsche 2000).</title>
          <rect x="72" y="12" width="116" height="22" rx="6" fill="#1E293B" stroke={isAnode ? '#F59E0B' : '#0EA5E9'} strokeWidth="1.2" className={isAnode ? 'animate-pulse' : ''} style={{ animationDelay: '0s' }} />
          <text x="130" y="21" fill="#FDE68A" fontSize="9.8" fontWeight="bold" textAnchor="middle">Somatic ΔVm</text>
          <text x="130" y="30" fill="#94A3B8" fontSize="7.5" textAnchor="middle">{isAnode ? `DEPOLARIZATION +${(currentMa * 0.62).toFixed(2)} mV` : `HYPERPOLARIZATION −${(currentMa * 0.62).toFixed(2)} mV`}</text>
        </g>

        {/* ===== Node 2: NMDA pore unblock / block ===== */}
        <g className={NODE_ACTIVE}>
          <title>Anodal depolarization partially extrudes the Mg²⁺ plug blocking the NMDA channel pore, raising Ca²⁺ conductance.</title>
          <rect x="66" y="48" width="128" height="28" rx="6" fill="#1E293B" stroke={isAnode ? '#10B981' : '#EF4444'} strokeWidth="1.3" className={isAnode ? 'animate-pulse' : ''} style={{ animationDelay: '0.35s' }} />
          <text x="130" y="59" fill={isAnode ? '#6EE7B7' : '#FCA5A5'} fontSize="9.8" fontWeight="bold" textAnchor="middle">NMDA Pore</text>
          <text x="130" y="70" fill="#94A3B8" fontSize="7.5" textAnchor="middle">
            {isAnode ? 'Mg²⁺ EXTRUDED → OPEN' : 'Mg²⁺ BLOCK STRENGTHENED'}
          </text>
        </g>

        {/* ===== Node 3: Ca²⁺ influx spike ===== */}
        <g className={NODE_ACTIVE}>
          <title>Peak intracellular Ca²⁺ is the master switch: high Ca²⁺ activates kinases (LTP), low basal Ca²⁺ recruits phosphatases (LTD).</title>
          <rect x="84" y="90" width="92" height="20" rx="6" fill={isAnode ? '#78350F' : '#1E293B'} stroke={isAnode ? '#FBBF24' : '#334155'} strokeWidth="1.3" className={isAnode ? 'animate-pulse' : ''} style={{ animationDelay: '0.7s' }} />
          <text x="130" y="104" fill={isAnode ? '#FBBF24' : '#64748B'} fontSize="9.8" fontWeight="bold" textAnchor="middle">Ca²⁺ Influx Spike</text>
        </g>

        {/* ===== Left arm: CaMKII → AMPA Insertion (LTP) ===== */}
        <g className={NODE_ACTIVE}>
          <title>CaMKII autophosphorylation is the molecular memory switch that anchors GluA1-containing AMPA receptors in the postsynaptic density.</title>
          <rect x="16" y="118" width="60" height="24" rx="6" fill="#1E293B" stroke="#F59E0B" strokeWidth="1.2" className={isAnode ? 'animate-pulse' : ''} style={{ animationDelay: '1s' }} />
          <text x="46" y="130" fill="#FBBF24" fontSize="8.6" fontWeight="bold" textAnchor="middle">CaMKII</text>
          <text x="46" y="138" fontSize="6.9" fill="#94A3B8" textAnchor="middle">kinase</text>

          <rect x="14" y="156" width="64" height="26" rx="6" fill={isAnode ? '#064E3B' : '#1E293B'} stroke={isAnode ? '#10B981' : '#334155'} strokeWidth="1.2" />
          <text x="46" y="166" fill={isAnode ? '#6EE7B7' : '#475569'} fontSize="8.6" fontWeight="bold" textAnchor="middle">AMPA Docked</text>
          <text x="46" y="175" fontSize="6.9" fill={isAnode ? '#A7F3D0' : '#475569'} textAnchor="middle">LTP ↑ inserted</text>
        </g>

        {/* ===== Cathodal alternative arm: Calcineurin → AMPA endocytosis (LTD) ===== */}
        {!isAnode && (
          <g>
            <title>Under hyperpolarization, low Ca²⁺ activates calcineurin phosphatases — the molecular LTD trigger.</title>
            <rect x="38" y="118" width="60" height="24" rx="6" fill="#0C4A6E" stroke="#38BDF8" strokeWidth="1.4" className="animate-pulse" style={{ animationDelay: '0.9s' }} />
            <text x="68" y="130" fill="#7DD3FC" fontSize="8.6" fontWeight="bold" textAnchor="middle">Calcineurin</text>
            <text x="68" y="138" fontSize="6.9" fill="#7DD3FC" textAnchor="middle">phosphatase</text>

            <rect x="34" y="156" width="66" height="26" rx="6" fill="#172554" stroke="#38BDF8" strokeWidth="1.2" />
            <text x="67" y="166" fill="#93C5FD" fontSize="8.6" fontWeight="bold" textAnchor="middle">AMPA Internalized</text>
            <text x="67" y="175" fontSize="6.9" fill="#93C5FD" textAnchor="middle">LTP → LTD ↓</text>
          </g>
        )}

        {/* ===== Right arm: CREB → BDNF gene expression ======================== */}
        <g className={NODE_ACTIVE}>
          <title>CREB transcription factor phosphorylation drives BDNF gene expression — the plasticity growth signal.</title>
          <rect x="184" y="118" width="62" height="24" rx="6" fill="#1E293B" stroke="#8B5CF6" strokeWidth="1.2" className={isAnode ? 'animate-pulse' : ''} style={{ animationDelay: '1.1s' }} />
          <text x="215" y="130" fill="#C4B5FD" fontSize="8.6" fontWeight="bold" textAnchor="middle">CREB</text>
          <text x="215" y="138" fontSize="6.9" fill="#94A3B8" textAnchor="middle">transcription</text>

          <title>BDNF secretion activates TrkB receptors, promoting dendritic arborization and synaptogenesis.</title>
          <rect x="182" y="156" width="66" height="26" rx="6" fill={isAnode ? '#4C1D95' : '#1E293B'} stroke={isAnode ? '#A78BFA' : '#334155'} strokeWidth="1.2" />
          <text x="215" y="166" fill={isAnode ? '#DDD6FE' : '#475569'} fontSize="8.6" fontWeight="bold" textAnchor="middle">BDNF / TrkB</text>
          <text x="215" y="175" fontSize="6.9" fill={isAnode ? '#C4B5FD' : '#475569'} textAnchor="middle">synaptogenesis</text>
        </g>
      </svg>

      {/* Legend / state footnote */}
      <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/60 text-[10.5px]">
        {isAnode ? (
          <span className="text-emerald-400/90">⚡ Ca²⁺→CaMKII→AMPA docking drives LTP — hover nodes for detail</span>
        ) : (
          <span className="text-sky-400/90">❄ Mg²⁺ block stalls cascade — calcineurin clears AMPA (LTD)</span>
        )}
        <span className="text-slate-500">{currentMa.toFixed(1)} mA drive</span>
      </div>
    </div>
  );
};
