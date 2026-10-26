import React from 'react';
import { BiophysicalTelemetry } from '../../utils/biophysicsEngine';

interface ChargeDoseReservoirProps {
  telemetry: BiophysicalTelemetry;
  currentMa: number;
  durationMin: number;
}

export const ChargeDoseReservoir: React.FC<ChargeDoseReservoirProps> = ({
  telemetry,
  currentMa,
  durationMin
}) => {
  const totalQ = telemetry.totalChargeCoulombs;
  // Maximum scale is 4.5 Coulombs
  const maxScaleQ = 4.5;
  const pctFill = Math.min(100, Math.max(8, (totalQ / maxScaleQ) * 100));

  return (
    <div className="panel-card select-none p-3 text-xs">
      <div className="flex items-start justify-between gap-2 border-b border-slate-800/70 pb-2">
        <span className="flex items-center gap-2 text-[14px] font-semibold leading-snug tracking-tight text-slate-100">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          Charge dose
        </span>
        <span className="rounded border border-cyan-800/60 bg-cyan-950/80 px-1.5 py-0.5 font-mono text-[13px] font-semibold text-cyan-300">
          {totalQ.toFixed(2)} C
        </span>
      </div>

      <div className="mt-2.5 flex items-center gap-3">
        {/* Transparent Cylindrical Cell */}
        <div className="relative w-12 h-28 bg-slate-950/80 rounded-xl border border-cyan-500/40 p-1 flex flex-col justify-end overflow-hidden shadow-inner">
          {/* Glass reflections */}
          <div className="absolute top-0 left-1 w-1.5 h-full bg-white/10 rounded-full pointer-events-none" />

          {/* Fluid Level */}
          <div
            className="w-full rounded-b-lg bg-gradient-to-t from-cyan-600 via-sky-400 to-cyan-300 transition-all duration-300 relative shadow-glow-cyan"
            style={{ height: `${pctFill}%` }}
          >
            {/* Animated Meniscus Wave */}
            <div className="absolute -top-1 left-0 w-full h-2 bg-cyan-200 rounded-full opacity-80 animate-pulse" />
          </div>

          {/* Milestone Tick Lines on Glass */}
          {/* 1.2 C Tick */}
          <div className="absolute left-0 w-full flex items-center justify-between pointer-events-none" style={{ bottom: `${(1.2 / maxScaleQ) * 100}%` }}>
            <span className="w-2 h-[1px] bg-slate-400" />
            <span className="w-2 h-[1px] bg-slate-400" />
          </div>
          {/* 2.4 C Tick */}
          <div className="absolute left-0 w-full flex items-center justify-between pointer-events-none" style={{ bottom: `${(2.4 / maxScaleQ) * 100}%` }}>
            <span className="w-2.5 h-[1.5px] bg-emerald-400" />
            <span className="w-2.5 h-[1.5px] bg-emerald-400" />
          </div>
          {/* 3.6 C Tick */}
          <div className="absolute left-0 w-full flex items-center justify-between pointer-events-none" style={{ bottom: `${(3.6 / maxScaleQ) * 100}%` }}>
            <span className="w-2 h-[1px] bg-amber-400" />
            <span className="w-2 h-[1px] bg-amber-400" />
          </div>
        </div>

        {/* Milestone Explanations & Density */}
        <div className="flex-1 space-y-1.5 text-[13px]">
          <div className="text-[12.5px] text-slate-400">
            Formula: <span className="font-mono">{currentMa.toFixed(1)} mA × {durationMin} min ({durationMin * 60} s)</span>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span>Charge density (Q/A)</span>
            <span className="font-mono font-semibold text-slate-100">{telemetry.chargeDensityCCm2} <span className="font-normal text-slate-400">C/cm²</span></span>
          </div>

          <div className="space-y-1 pt-1 border-t border-slate-800/60">
            <div className={`flex items-center justify-between px-1.5 py-0.5 rounded ${totalQ >= 1.2 && totalQ < 2.4 ? 'bg-cyan-950/60 text-cyan-300 font-bold' : 'text-slate-400'}`}>
              <span>• <span className="font-mono">1.2 C</span>: primer (<span className="font-mono">10m</span>)</span>
              {totalQ >= 1.2 && <span>✓</span>}
            </div>
            <div className={`flex items-center justify-between px-1.5 py-0.5 rounded ${totalQ >= 2.4 && totalQ < 3.6 ? 'bg-emerald-950/60 text-emerald-300 font-bold' : 'text-slate-400'}`}>
              <span>• <span className="font-mono">2.4 C</span>: clinical standard (<span className="font-mono">20m</span>)</span>
              {totalQ >= 2.4 && <span>✓</span>}
            </div>
            <div className={`flex items-center justify-between px-1.5 py-0.5 rounded ${totalQ >= 3.6 ? 'bg-amber-950/60 text-amber-300 font-bold' : 'text-slate-400'}`}>
              <span>• <span className="font-mono">3.6 C</span>: research maximum (<span className="font-mono">30m</span>)</span>
              {totalQ >= 3.6 && <span>⚠️</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
