import React from 'react';
import { BiophysicalTelemetry } from '../../utils/biophysicsEngine';

interface SensationMatrixGlyphsProps {
  telemetry: BiophysicalTelemetry;
  anodeId: string;
  cathodeId: string;
  currentMa: number;
  durationMin: number;
}

export const SensationMatrixGlyphs: React.FC<SensationMatrixGlyphsProps> = ({
  telemetry,
  anodeId,
  cathodeId,
  currentMa,
  durationMin
}) => {
  const J = telemetry.currentDensityMaCm2;

  // 1. Scalp Tingling: 1 to 5 bars
  // J < 0.03 -> 1 bar, 0.03-0.06 -> 2 bars, 0.06-0.09 -> 3 bars, 0.09-0.14 -> 4 bars, >0.14 -> 5 bars
  const tinglingBars = J < 0.03 ? 1 : J < 0.06 ? 2 : J < 0.09 ? 3 : J < 0.14 ? 4 : 5;

  // 2. Metallic Taste: Near temporal/frontotemporal branch (F7, F8, T7, T8) and current >= 1.0 mA
  const gustatoryNodes = ['F7', 'F8', 'T7', 'T8', 'Fp1', 'Fp2'];
  const hasMetallicTaste = (gustatoryNodes.includes(anodeId) || gustatoryNodes.includes(cathodeId)) && currentMa >= 1.0;

  // 3. Phosphene Flash: Near orbital / frontopolar (Fp1, Fp2, Fpz) or occipital visual cortex (O1, O2, Oz)
  const opticNodes = ['Fp1', 'Fp2', 'Fpz', 'O1', 'O2', 'Oz'];
  const hasPhospheneRisk = (opticNodes.includes(anodeId) || opticNodes.includes(cathodeId)) && currentMa >= 1.2;

  // 4. Erythema (Skin Redness): Driven by current density and session length
  // Mild blush vs moderate pink vs distinct red
  const erythemaSeverity = J * durationMin;
  const erythemaLevel = erythemaSeverity < 1.2 ? 'mild' : erythemaSeverity < 2.5 ? 'moderate' : 'pronounced';

  return (
    <div className="panel-card select-none p-3 text-xs">
      <div className="flex items-start justify-between gap-2 border-b border-slate-800/70 pb-2">
        <span className="flex items-center gap-2 text-[14px] font-semibold leading-snug tracking-tight text-slate-100">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          Sensation matrix
        </span>
        <span className="text-[13px] text-slate-400">Human phenomena</span>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-2">
        {/* Glyph 1: Scalp Tingling */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-lg p-2 flex items-center justify-between">
          <div>
            <div className="text-[13px] text-slate-400 flex items-center gap-1">
              <span>⚡</span> Tingling
            </div>
            <div className="text-[14px] font-bold text-slate-200 mt-0.5">
              {tinglingBars <= 2 ? 'Subtle' : tinglingBars <= 4 ? 'Moderate' : 'Noticeable'}
            </div>
          </div>
          {/* 5-bar vertical signal meter */}
          <div className="flex items-end gap-1 h-5">
            {[1, 2, 3, 4, 5].map((bar) => (
              <span
                key={bar}
                className={`w-1 rounded-sm transition-all ${
                  bar <= tinglingBars
                    ? bar <= 2
                      ? 'bg-emerald-400'
                      : bar <= 4
                      ? 'bg-amber-400'
                      : 'bg-rose-500'
                    : 'bg-slate-800'
                }`}
                style={{ height: `${bar * 20}%` }}
              />
            ))}
          </div>
        </div>

        {/* Glyph 2: Metallic Taste */}
        <div className={`border rounded-lg p-2 transition flex items-center justify-between ${
          hasMetallicTaste
            ? 'bg-amber-950/40 border-amber-800/60 text-amber-300'
            : 'bg-slate-900/80 border-slate-800/80 text-slate-400'
        }`}>
          <div>
            <div className="text-[13px] flex items-center gap-1">
              <span>🥄</span> Metallic Taste
            </div>
            <div className={`text-[14px] font-bold mt-0.5 ${hasMetallicTaste ? 'text-amber-300' : 'text-slate-400'}`}>
              {hasMetallicTaste ? 'Possible (Chorda)' : 'None Detected'}
            </div>
          </div>
          <span className={`text-base ${hasMetallicTaste ? 'animate-bounce' : 'opacity-30'}`}>⚡</span>
        </div>

        {/* Glyph 3: Phosphene Flash */}
        <div className={`border rounded-lg p-2 transition flex items-center justify-between ${
          hasPhospheneRisk
            ? 'bg-cyan-950/40 border-cyan-800/60 text-cyan-300'
            : 'bg-slate-900/80 border-slate-800/80 text-slate-400'
        }`}>
          <div>
            <div className="text-[13px] flex items-center gap-1">
              <span>👁️</span> Phosphene Flash
            </div>
            <div className={`text-[14px] font-bold mt-0.5 ${hasPhospheneRisk ? 'text-cyan-300' : 'text-slate-400'}`}>
              {hasPhospheneRisk ? 'Retinal Flare' : 'Clear Vision'}
            </div>
          </div>
          <span className={`text-base ${hasPhospheneRisk ? 'animate-pulse text-cyan-300' : 'opacity-30'}`}>✨</span>
        </div>

        {/* Glyph 4: Skin Erythema Preview Swatch */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-lg p-2 flex items-center justify-between">
          <div>
            <div className="text-[13px] text-slate-400 flex items-center gap-1">
              <span>🔴</span> Skin Flushing
            </div>
            <div className="text-[14px] font-bold text-slate-200 mt-0.5 capitalize">
              {erythemaLevel} Flush
            </div>
          </div>
          {/* Epidermal Color Swatch */}
          <div
            className="w-5 h-5 rounded-full border border-slate-700 shadow-sm"
            style={{
              backgroundColor:
                erythemaLevel === 'mild'
                  ? '#FDA4AF'
                  : erythemaLevel === 'moderate'
                  ? '#FB7185'
                  : '#F43F5E'
            }}
            title="Expected localized skin erythema under electrode"
          />
        </div>
      </div>
    </div>
  );
};
