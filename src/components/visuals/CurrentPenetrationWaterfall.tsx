import React from 'react';
import { BiophysicalTelemetry } from '../../utils/biophysicsEngine';

interface CurrentPenetrationWaterfallProps {
  telemetry: BiophysicalTelemetry;
  montageType: 'sponge' | 'hd4x1';
  currentMa: number;
}

export const CurrentPenetrationWaterfall: React.FC<CurrentPenetrationWaterfallProps> = ({
  telemetry,
  montageType,
  currentMa
}) => {
  // Biophysical breakdown percentages (Miranda et al. 2006 & Bikson 2016)
  const isHD = montageType === 'hd4x1';
  // HD-tDCS reduces scalp loss due to short inter-electrode ring distance and higher normal current density
  const scalpShunt = isHD ? Math.max(38, telemetry.shuntPercentage - 18) : telemetry.shuntPercentage;
  const csfShunt = isHD ? 14.2 : 18.4;
  const corticalDelivery = Math.max(5.0, 100 - scalpShunt - csfShunt);

  const effCorticalCurrent = ((currentMa * corticalDelivery) / 100).toFixed(2);
  const lostScalpCurrent = ((currentMa * scalpShunt) / 100).toFixed(2);

  return (
    <div className="panel-card select-none p-3 text-xs">
      <div className="flex items-start justify-between gap-2 border-b border-slate-800/70 pb-2">
        <span className="flex items-center gap-2 text-[12px] font-semibold leading-snug tracking-tight text-slate-100">
          <span className="w-2 h-2 rounded-full bg-rose-400" />
          Current shunt breakdown
        </span>
        <span className="text-[11px] text-slate-400">
          {isHD ? 'HD 4×1 focused' : 'Broad dispersion'}
        </span>
      </div>

      {/* SVG Layer Flow Diagram */}
      <div className="mt-2.5 space-y-2">
        {/* Stage 1: Applied Current Input */}
        <div className="flex items-center justify-between bg-slate-900/70 px-2 py-1.5 rounded border border-slate-800">
          <div className="flex items-center gap-2">
            <span className="font-medium text-amber-300">Applied input</span>
            <span className="font-mono text-[11px] text-slate-400">(100%)</span>
          </div>
          <span className="font-mono font-semibold text-amber-300">{currentMa.toFixed(1)} <span className="font-normal text-slate-400">mA</span></span>
        </div>

        {/* Dynamic Branching SVG */}
        <div className="relative py-1 px-1">
          <svg viewBox="0 0 240 100" className="w-full h-24 overflow-visible">
            <defs>
              <linearGradient id="shuntGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FB7185" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#F43F5E" stopOpacity="0.3" />
              </linearGradient>
              <linearGradient id="csfGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#0284C7" stopOpacity="0.3" />
              </linearGradient>
              <linearGradient id="cortexGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10B981" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#34D399" stopOpacity="0.4" />
              </linearGradient>
            </defs>

            {/* Inflow trunk */}
            <path d="M 20 6 L 50 6" stroke="#F59E0B" strokeWidth="6" strokeLinecap="round" />

            {/* Branch 1: Scalp Shunt (Rose flow curling away) */}
            <path
              d="M 50 6 C 80 6, 100 24, 150 24 L 230 24"
              fill="none"
              stroke="url(#shuntGrad)"
              strokeWidth={Math.max(3, scalpShunt * 0.12)}
              strokeDasharray="4 2"
              className="animate-pulse"
            />

            {/* Skull bone high impedance barrier (Dotted resistive line) */}
            <line x1="85" y1="36" x2="85" y2="95" stroke="#64748B" strokeWidth="2" strokeDasharray="2 2" />
            <text x="88" y="44" fill="#94A3B8" fontSize="8" fontFamily="monospace">Skull Bone (ρ≈80 Ω·m)</text>

            {/* Branch 2: CSF fluid diversion */}
            <path
              d="M 50 6 C 70 6, 90 60, 150 60 L 230 60"
              fill="none"
              stroke="url(#csfGrad)"
              strokeWidth={Math.max(2, csfShunt * 0.12)}
              strokeDasharray="3 3"
            />

            {/* Branch 3: Deep Transcortical Delivery */}
            <path
              d="M 50 6 C 70 6, 110 88, 150 88 L 230 88"
              fill="none"
              stroke="url(#cortexGrad)"
              strokeWidth={Math.max(2, corticalDelivery * 0.14)}
            />
          </svg>
        </div>

        {/* Telemetry Breakdown Rows */}
        <div className="space-y-1.5 text-[11px]">
          {/* Scalp loss */}
          <div className="flex items-center justify-between bg-rose-950/30 border border-rose-900/40 px-2 py-1 rounded">
            <span className="flex items-center gap-1.5 text-rose-300">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              Scalp Loss (Lateral Shunt)
            </span>
            <span className="font-mono font-semibold text-rose-300">
              {scalpShunt.toFixed(1)}% <span className="font-normal text-rose-300/70">({lostScalpCurrent} mA)</span>
            </span>
          </div>

          {/* CSF loss */}
          <div className="flex items-center justify-between bg-sky-950/30 border border-sky-900/40 px-2 py-1 rounded">
            <span className="flex items-center gap-1.5 text-sky-300">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
              CSF dissipation
            </span>
            <span className="font-mono font-semibold text-sky-300">{csfShunt.toFixed(1)}%</span>
          </div>

          {/* Cortical delivery */}
          <div className="flex items-center justify-between bg-emerald-950/40 border border-emerald-800/60 px-2 py-1 rounded shadow-sm">
            <span className="flex items-center gap-1.5 font-medium text-emerald-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-glow-cyan" />
              Cortical delivery
            </span>
            <span className="font-mono font-semibold text-emerald-300">
              {corticalDelivery.toFixed(1)}% <span className="font-normal text-emerald-300/70">(~{effCorticalCurrent} mA)</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
