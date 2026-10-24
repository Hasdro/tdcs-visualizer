import React from 'react';
import { EEG_BANDS, EegBandInfo } from '../../data/eeg_bands';

interface EegSpectralBarChartProps {
  bandShifts: Record<string, number>;
}

export const EegSpectralBarChart: React.FC<EegSpectralBarChartProps> = ({ bandShifts }) => {
  const bands = Object.values(EEG_BANDS);

  return (
    <div className="panel-card select-none p-3 text-xs">
      <div className="flex items-start justify-between gap-2 border-b border-slate-800/70 pb-2">
        <span className="flex items-center gap-2 text-[12px] font-semibold leading-snug tracking-tight text-slate-100">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          6-band FFT power
        </span>
        <span className="text-[11px] text-slate-400">Relative to baseline</span>
      </div>

      {/* 6-Column Spectral Bar Chart */}
      <div className="grid grid-cols-6 gap-2 mt-3 pt-2 pb-1 items-end h-28 border-b border-slate-800/60 relative">
        {/* 100% Baseline Dashed Reference Line */}
        <div className="absolute left-0 w-full border-t border-dashed border-slate-600/60 top-1/2 pointer-events-none z-0">
          <span className="absolute -top-3.5 right-1 font-mono text-[9.5px] text-slate-500">100% baseline</span>
        </div>

        {bands.map((band: EegBandInfo) => {
          const shiftPct = bandShifts[band.id] || 0;
          const isUp = shiftPct >= 0;
          // Baseline is at 50% height (y=50%). Bar height goes up or down by shiftPct
          // Max deviation clamped at +-40%
          const clampedShift = Math.max(-40, Math.min(40, shiftPct));
          const barHeightPct = Math.abs(clampedShift) * 1.1;

          return (
            <div key={band.id} className="flex flex-col items-center justify-end h-full z-10 group relative">
              {/* Tooltip on hover */}
              <div className="absolute bottom-full mb-1 hidden group-hover:block bg-slate-900 border border-slate-700 text-slate-200 p-1.5 rounded shadow-xl text-[10.5px] whitespace-nowrap z-30">
                <span className="font-bold block" style={{ color: band.color }}>
                  {band.name} ({band.frequencyRange})
                </span>
                <span className="font-mono">Power: {shiftPct > 0 ? `+${shiftPct}%` : `${shiftPct}%`}</span>
              </div>

              {/* Bar Container */}
              <div className="relative w-full h-full flex flex-col justify-center items-center">
                {/* Positive (upward) bar */}
                {isUp ? (
                  <div
                    className="w-3.5 rounded-t transition-all duration-300 drop-shadow"
                    style={{
                      backgroundColor: band.color,
                      height: `${barHeightPct}%`,
                      marginBottom: 'auto'
                    }}
                  />
                ) : (
                  /* Negative (downward) bar */
                  <div
                    className="w-3.5 rounded-b opacity-80 transition-all duration-300 drop-shadow"
                    style={{
                      backgroundColor: band.color,
                      height: `${barHeightPct}%`,
                      marginTop: 'auto'
                    }}
                  />
                )}
              </div>

              {/* Shift Delta Percentage Badge */}
              <div
                className={`mt-1 font-mono text-[10.5px] font-semibold ${
                  isUp ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {shiftPct > 0 ? `+${shiftPct}%` : `${shiftPct}%`}
              </div>

              {/* Band Greek Symbol & Name */}
              <div className="text-[11px] font-bold text-slate-300 mt-0.5">
                {band.symbol}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
