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
    <div className="bg-[#0C121E]/95 border border-slate-800/90 rounded-xl p-2.5 shadow-xl select-none font-mono text-xs w-full">
      <div className="flex items-center justify-between pb-1 mb-1 text-[10px]">
        <span className="text-slate-400 font-semibold flex items-center gap-1">
          <span>🌡️</span> CORTICAL E-FIELD MILESTONE SPECTRUM
        </span>
        <span className="text-amber-300 font-bold">{peakEFieldVm.toFixed(3)} V/m</span>
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
      <div className="flex justify-between text-[8.5px] text-slate-400 mt-1">
        <span>0.0 Sulcal Silence</span>
        <span className="text-cyan-300">0.2 V/m Synaptic</span>
        <span className="text-amber-300">0.5 V/m Action Bias</span>
        <span className="text-rose-400">0.8+ V/m Peak</span>
      </div>
    </div>
  );
};
