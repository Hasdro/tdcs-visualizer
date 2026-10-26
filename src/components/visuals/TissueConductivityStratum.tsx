import React from 'react';
import { Layers } from 'lucide-react';

interface TissueConductivityStratumProps {
  shuntPercentage: number;
}

interface StratumLayer {
  id: string;
  label: string;
  sigma: number;
  fill: string;
  stroke: string;
  note: string;
}

// Empirical layered conductivities (Miranda et al. 2006; Bikson et al. 2016)
const LAYERS: StratumLayer[] = [
  { id: 'scalp', label: 'Scalp + galea', sigma: 0.465, fill: '#2A1E14', stroke: '#B45309', note: 'conductive entry · lateral spread' },
  { id: 'skull', label: 'Calvarium (skull)', sigma: 0.010, fill: '#181D28', stroke: '#64748B', note: 'highest-impedance barrier' },
  { id: 'csf', label: 'Cerebrospinal fluid', sigma: 1.650, fill: '#062E44', stroke: '#0EA5E9', note: 'super-conductive highway · shunt' },
  { id: 'grey', label: 'Cortical grey matter', sigma: 0.276, fill: '#3B1230', stroke: '#F472B6', note: 'target pyramidal somata' },
  { id: 'white', label: 'Axonal white matter', sigma: 0.126, fill: '#221A38', stroke: '#818CF8', note: 'deep white-matter tracts' }
];

const bandX = 50;
const bandW = 204;
const bandH = 38;
const bandGap = 4;
const topY = 28;

// Relative conductivity width (log-scaled, normalized to CSF = full width)
const sigmaWidth = (sigma: number) => {
  const maxLog = Math.log10(1.65 / 0.004);
  return Math.max(0.05, Math.log10(sigma / 0.004) / maxLog);
};

/**
 * Stratified anatomical cross-section explaining why current shunts before it
 * reaches cortex: a super-conductive CSF highway sits beneath a near-insulating
 * skull. Values match the biophysics engine's Miranda/Bikson constants.
 */
export const TissueConductivityStratum: React.FC<TissueConductivityStratumProps> = ({
  shuntPercentage
}) => {
  const corticalFraction = Math.max(0, 100 - shuntPercentage);

  return (
    <section className="panel-card overflow-hidden">
      <div className="panel-header">
        <div>
          <h3 className="panel-title">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-orange-500/10 text-orange-300">
              <Layers className="h-3.5 w-3.5" />
            </span>
            Tissue conductivity
          </h3>
          <p className="panel-kicker">Why ~60% of current never reaches cortex</p>
        </div>
        <span className="shrink-0 rounded-md border border-slate-700 bg-slate-950/60 px-1.5 py-0.5 text-[12.5px] font-medium text-slate-400">
          σ · <span className="font-mono">S/m</span>
        </span>
      </div>

      <div className="p-3">
        <div className="overflow-hidden rounded-lg border border-slate-800/80 bg-ink-0">
          <svg viewBox="0 0 300 244" className="h-auto w-full" role="img" aria-label="Layered scalp, skull, CSF, grey and white matter conductivity cross-section">
            <defs>
              <marker id="shuntArrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                <path d="M 0 0 L 6 3 L 0 6 Z" fill="#FBBF24" />
              </marker>
            </defs>

            {/* Injection pad sitting on the scalp */}
            <rect x={bandX + 78} y="2" width="48" height="7" rx="2" fill="#EF4444" opacity="0.9" />
            <text x={bandX + 102} y="8" fill="#FEE2E2" fontSize="5.8" textAnchor="middle" fontWeight="bold">
              PAD +
            </text>
            <line x1={bandX + 102} y1="9" x2={bandX + 102} y2={topY} stroke="#F87171" strokeWidth="1.4" />

            {LAYERS.map((layer, index) => {
              const y = topY + index * (bandH + bandGap);
              const barW = Math.max(3, (bandW - 12) * sigmaWidth(layer.sigma));
              return (
                <g key={layer.id}>
                  <rect
                    x={bandX}
                    y={y}
                    width={bandW}
                    height={bandH}
                    rx="3"
                    fill={layer.fill}
                    stroke={layer.stroke}
                    strokeWidth="1"
                  />
                  <text x={bandX + 6} y={y + 11} fill="#E2E8F0" fontSize="8" fontWeight="bold">
                    {layer.label}
                  </text>
                  <text x={bandX + 6} y={y + 20} fill="#94A3B8" fontSize="6.2">
                    {layer.note}
                  </text>
                  <text x={bandX + bandW - 6} y={y + 11} fill={layer.stroke} fontSize="7.8" textAnchor="end" fontFamily="'IBM Plex Mono', monospace">
                    σ {layer.sigma.toFixed(3)}
                  </text>

                  {/* Conductivity comparison bar */}
                  <rect x={bandX + 6} y={y + 27} width={bandW - 12} height="2.6" rx="1.3" fill="#070B12" stroke="#334155" strokeWidth="0.4" />
                  <rect x={bandX + 6} y={y + 27} width={barW} height="2.6" rx="1.3" fill={layer.stroke} opacity="0.9" />
                </g>
              );
            })}

            {/* Lateral scalp shunt escape */}
            <path d="M 258 44 H 291" stroke="#FBBF24" strokeWidth="1.3" strokeDasharray="4 3" markerEnd="url(#shuntArrow)">
              <animate attributeName="stroke-dashoffset" from="14" to="0" dur="1.1s" repeatCount="indefinite" />
            </path>
            <text x="258" y="39" fill="#FBBF24" fontSize="6">
              lateral shunt
            </text>

            {/* CSF lateral superhighway */}
            <path d="M 258 108 H 291" stroke="#38BDF8" strokeWidth="1.4" strokeDasharray="4 3" markerEnd="url(#shuntArrow)">
              <animate attributeName="stroke-dashoffset" from="14" to="0" dur="0.7s" repeatCount="indefinite" />
            </path>
            <text x="258" y="103" fill="#38BDF8" fontSize="6">
              CSF shunt
            </text>

            {/* Attenuated transcortical delivery */}
            <line x1={bandX + 102} y1={topY + 20} x2={bandX + 102} y2={topY + 4 * (bandH + bandGap) + 22} stroke="#34D399" strokeWidth="1.1" strokeDasharray="3 4" opacity="0.55">
              <animate attributeName="stroke-dashoffset" from="10" to="0" dur="1.6s" repeatCount="indefinite" />
            </line>
            <circle cx={bandX + 102} cy={topY + 4 * (bandH + bandGap) + 22} r="2" fill="#34D399" />

            {/* Orientation cue */}
            <text x={bandX} y="240" fill="#475569" fontSize="5.8">
              SURFACE
            </text>
            <text x={bandX + bandW} y="240" fill="#475569" fontSize="5.8" textAnchor="end">
              DEEP CORTEX ↓
            </text>
          </svg>
        </div>

        <div className="mt-1.5 flex items-center justify-between text-[12px] text-slate-500">
          <span className="flex items-center gap-1">
            <span className="h-1 w-3 rounded bg-amber-400" /> lateral shunt
          </span>
          <span className="flex items-center gap-1">
            <span className="h-1 w-3 rounded bg-emerald-400" /> cortical delivery
          </span>
          <span className="font-mono">ρ = 1/σ</span>
        </div>

        {/* Bottom verdict strip */}
        <div className="mt-2 flex items-center gap-2 border-t border-slate-800/70 pt-2">
          <span className="text-[12.5px] text-slate-400">CSF + scalp shunt</span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full border border-slate-800 bg-slate-950">
            <div
              className="h-full bg-gradient-to-r from-rose-500 to-rose-300 transition-all duration-500"
              style={{ width: `${shuntPercentage}%` }}
            />
          </div>
          <span className="text-[13px] font-semibold text-rose-300">{shuntPercentage.toFixed(1)}%</span>
          <span
            className="rounded border border-emerald-800/50 bg-emerald-950/50 px-1.5 py-0.5 text-[13px] font-semibold text-emerald-300"
            title="Fraction of applied current penetrating the skull toward cortex"
          >
            {corticalFraction.toFixed(1)}% → cortex
          </span>
        </div>

        <p className="mt-2 text-[13px] leading-relaxed text-slate-500">
          Current follows the path of least resistance. The CSF layer conducts roughly 165× better
          than bone, so most charge spreads sideways before the cortex sees it.
        </p>
      </div>
    </section>
  );
};

export default TissueConductivityStratum;
