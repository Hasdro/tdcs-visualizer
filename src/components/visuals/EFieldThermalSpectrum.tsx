import React from 'react';

interface EFieldThermalSpectrumProps {
  peakEFieldVm: number;
}

export const EFieldThermalSpectrum: React.FC<EFieldThermalSpectrumProps> = ({ peakEFieldVm }) => {
  // Peak field scale: 0.0 to 1.0 V/m
  const maxScale = 1.0;
  const clamped = Math.max(0, Math.min(maxScale, peakEFieldVm));
  const markerPct = (clamped / maxScale) * 100;

  return (
    <div className="w-full rounded-lg border border-slate-800/80 bg-[#0A111C] p-2.5 text-xs shadow-lg">
      <div className="flex items-center justify-between pb-1 mb-1 text-[11px]">
        <span className="flex items-center gap-1 font-medium text-slate-400">
          Cortical E-field spectrum
        </span>
        <span className="font-mono font-semibold text-amber-300">{peakEFieldVm.toFixed(3)} <span className="font-normal text-slate-500">V/m</span></span>
      </div>

      {/* Horizontal Spectrum Gradient Bar */}
      <div className="relative w-full h-3.5 rounded-full overflow-visible my-1.5 border border-slate-700/80">
        {/* Gradient fill */}
        <div className="w-full h-full rounded-full bg-gradient-to-r from-indigo-900 via-cyan-500 via-amber-400 to-rose-500" />

        {/* Milestone Indicator Lines */}
        {/* 0.2 V/m: Synaptic Modulation Threshold (Francis 2003) */}
        <div className="absolute top-0 bottom-0 w-[1px] bg-white/80 pointer-events-none" style={{ left: '20%' }} />
        {/* 0.5 V/m: Robust Action Potential Bias (Bikson 2016) */}
        <div className="absolute top-0 bottom-0 w-[1px] bg-white/80 pointer-events-none" style={{ left: '50%' }} />
        {/* 0.8 V/m: Non-Invasive Ceiling */}
        <div className="absolute top-0 bottom-0 w-[1px] bg-white/80 pointer-events-none" style={{ left: '80%' }} />

        {/* Live Indicator Needle Pip */}
        <div
          className="absolute -top-1 w-2.5 h-5 -translate-x-1/2 bg-white rounded-sm border border-slate-900 shadow-md transition-all duration-300 pointer-events-none"
          style={{ left: `${markerPct}%` }}
        />
      </div>

      {/* Physiological Milestones Legend */}
      <div className="flex justify-between text-[10px] text-slate-400 mt-1">
        <span><span className="font-mono">0.0</span> sulcal silence</span>
        <span className="text-cyan-300"><span className="font-mono">0.2</span> V/m synaptic</span>
        <span className="text-amber-300"><span className="font-mono">0.5</span> V/m action bias</span>
        <span className="text-rose-400"><span className="font-mono">0.8+</span> V/m peak</span>
      </div>
    </div>
  );
};
