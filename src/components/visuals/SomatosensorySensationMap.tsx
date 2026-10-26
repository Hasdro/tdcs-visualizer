import React from 'react';
import { BiophysicalTelemetry } from '../../utils/biophysicsEngine';

interface SomatosensorySensationMapProps {
  telemetry: BiophysicalTelemetry;
  anodeId: string;
  cathodeId: string;
}

// Front-view anatomical projection of the 10-20 sites onto a stylized head silhouette
// (SVG coordinate space 200 x 235; head ellipse center 100,80)
const FRONTVIEW_COORDS: Record<string, { x: number; y: number; posterior?: boolean }> = {
  Fp1: { x: 74, y: 40 },
  Fp2: { x: 126, y: 40 },
  Fz: { x: 100, y: 32 },
  F3: { x: 76, y: 54 },
  F4: { x: 124, y: 54 },
  F7: { x: 48, y: 74 },
  F8: { x: 152, y: 74 },
  T7: { x: 42, y: 100 },
  T8: { x: 158, y: 100 },
  Cz: { x: 100, y: 16, posterior: true },
  C3: { x: 64, y: 22, posterior: true },
  C4: { x: 136, y: 22, posterior: true },
  Pz: { x: 100, y: 10, posterior: true },
  P3: { x: 78, y: 14, posterior: true },
  P4: { x: 122, y: 14, posterior: true },
  P7: { x: 40, y: 62, posterior: true },
  P8: { x: 160, y: 62, posterior: true },
  O1: { x: 84, y: 6, posterior: true },
  O2: { x: 116, y: 6, posterior: true },
  Oz: { x: 100, y: 4, posterior: true }
};

const TEMPORAL_SITES = ['F7', 'F8', 'T7', 'T8'];

// Extracephalic shoulder-mounted return pads project below the lateral head edges
const EXTRACEPHALIC_COORDS: Record<string, { x: number; y: number }> = {
  EX_L: { x: 26, y: 190 },
  EX_R: { x: 174, y: 190 }
};

export const SomatosensorySensationMap: React.FC<SomatosensorySensationMapProps> = ({
  telemetry,
  anodeId,
  cathodeId
}) => {
  const effects = telemetry.sideEffectProfile;

  // Ripple intensity scales with real current density J (0.08 mA/cm² = clinical standard)
  const tingleStrength = Math.max(0.25, Math.min(1, telemetry.currentDensityMaCm2 / 0.12));

  const anodePos = FRONTVIEW_COORDS[anodeId] || EXTRACEPHALIC_COORDS[anodeId] || { x: 76, y: 54 };
  const cathodePos = FRONTVIEW_COORDS[cathodeId] || EXTRACEPHALIC_COORDS[cathodeId] || { x: 126, y: 40 };

  // Lingual nerve metallic taste: pick the stimulated frontotemporal branch nearest the oral cavity
  const temporalActive = [anodeId, cathodeId].find((id) => TEMPORAL_SITES.includes(id)) || 'F8';
  const tasteOrigin = FRONTVIEW_COORDS[temporalActive];

  return (
    <div className="panel-card select-none p-3 text-xs">
      <div className="flex items-start justify-between gap-2 border-b border-slate-800/70 pb-2">
        <span className="flex items-center gap-2 text-[14px] font-semibold leading-snug tracking-tight text-slate-100">
          <span className="w-2 h-2 rounded-full bg-rose-400" />
          Somatosensory map
        </span>
        <span className="text-[13px] text-slate-400">Real-time body telemetry</span>
      </div>

      <div className="flex gap-2 mt-1.5">
        {/* Anatomical head & shoulders silhouette with live sensory indicators */}
        <svg viewBox="0 0 200 235" className="w-40 h-[235px] shrink-0">
          {/* Faded posterior calvarium arc (occipital sites projected onto crown rim) */}
          <ellipse cx="100" cy="80" rx="66" ry="74" fill="none" stroke="#1E293B" strokeWidth="1" strokeDasharray="2 3" opacity="0.7" />

          {/* Shoulders / torso hint */}
          <path d="M 18 235 C 30 195, 62 172, 100 172 C 138 172, 170 195, 182 235 Z" fill="#0E1524" stroke="#1E293B" strokeWidth="1.2" />
          <path d="M 100 150 L 100 172" stroke="#1E293B" strokeWidth="12" strokeLinecap="round" />

          {/* Head silhouette */}
          <ellipse cx="100" cy="80" rx="60" ry="68" fill="#101A2C" stroke="#334155" strokeWidth="1.6" />
          {/* Neck */}
          <rect x="88" y="136" width="24" height="26" rx="8" fill="#101A2C" stroke="#334155" strokeWidth="1.2" />

          {/* Face anchor points */}
          {/* Eyes (retinal phosphene origin) */}
          <circle cx="78" cy="78" r="4.5" fill="#050A14" stroke="#475569" strokeWidth="1" />
          <circle cx="122" cy="78" r="4.5" fill="#050A14" stroke="#475569" strokeWidth="1" />
          {/* Nose */}
          <path d="M 100 84 L 96 98 L 104 98 Z" fill="none" stroke="#334155" strokeWidth="1" />
          {/* Mouth cavity + stylized tongue (lingual nerve terminus) */}
          <path d="M 88 108 Q 100 114 112 108" fill="none" stroke="#334155" strokeWidth="1.2" />
          <ellipse cx="100" cy="112" rx="6" ry="3.4" fill={effects.metallicTaste ? '#92400E' : '#1E293B'} stroke={effects.metallicTaste ? '#FBBF24' : '#334155'} strokeWidth="0.9" className={effects.metallicTaste ? 'animate-pulse' : ''} />

          {/* ===== 1. Scalp Tingling ripples at active pad coordinates ===== */}
          {[anodePos, cathodePos].map((pos, i) => (
            <g key={i} className={telemetry.currentDensityMaCm2 > 0.02 ? '' : 'opacity-20'}>
              <circle
                cx={pos.x}
                cy={pos.y}
                r={7 + tingleStrength * 9}
                fill="none"
                stroke="#FBBF24"
                strokeWidth="1"
                opacity={0.55 * tingleStrength}
                className="animate-ping"
                style={{ animationDuration: '1.6s' }}
              />
              <circle
                cx={pos.x}
                cy={pos.y}
                r={3}
                fill={i === 0 ? '#EF4444' : '#06B6D4'}
                stroke="#F8FAFC"
                strokeWidth="1"
              />
            </g>
          ))}

          {/* ===== 2. Lingual Nerve metallic-taste pathway (temporal branch → tongue) ===== */}
          {effects.metallicTaste && tasteOrigin && (
            <g>
              <path
                d={`M ${tasteOrigin.x} ${tasteOrigin.y} C ${tasteOrigin.x * 0.55 + 45} ${tasteOrigin.y + 28}, 92 ${tasteOrigin.y + 34}, 100 108`}
                fill="none"
                stroke="#FBBF24"
                strokeWidth="2"
                strokeDasharray="4 2.5"
                className="animate-pulse"
              />
              <circle cx={tasteOrigin.x} cy={tasteOrigin.y + 8} r="2" fill="#FBBF24" className="animate-ping" style={{ animationDuration: '1.2s' }} />
              <text x={tasteOrigin.x < 100 ? 20 : 118} y="128" fill="#FBBF24" fontSize="7.5" fontWeight="bold">Taste ⚡</text>
            </g>
          )}

          {/* ===== 3. Retinal phosphene optical diffraction flare ===== */}
          {effects.phospheneRisk && (
            <g>
              {[78, 122].map((ex) => (
                <g key={ex}>
                  {[4.5, 9, 14].map((r, i) => (
                    <circle
                      key={r}
                      cx={ex}
                      cy="78"
                      r={r}
                      fill="none"
                      stroke="#F472B6"
                      strokeWidth="0.9"
                      opacity={0.8 - i * 0.22}
                      className="animate-ping"
                      style={{ animationDuration: `${1.1 + i * 0.5}s` }}
                    />
                  ))}
                </g>
              ))}
              <text x="100" y="66" fill="#F472B6" fontSize="7.5" fontWeight="bold" textAnchor="middle">Phosphene ✦</text>
            </g>
          )}

          {/* ===== 4. Electrode ID pins (posterior sites dimmed) ===== */}
          {Object.entries(FRONTVIEW_COORDS).map(([id, pos]) => {
            const isActive = id === anodeId || id === cathodeId;
            return (
              <g key={id} opacity={pos.posterior && !isActive ? 0.35 : isActive ? 1 : 0.7}>
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={isActive ? 2.4 : 1.4}
                  fill={id === anodeId ? '#EF4444' : id === cathodeId ? '#06B6D4' : '#475569'}
                  stroke={isActive ? '#F8FAFC' : 'none'}
                  strokeWidth="0.7"
                />
                {isActive && (
                  <text
                    x={pos.x}
                    y={pos.y - 3.5}
                    fill={id === anodeId ? '#FCA5A5' : '#7DD3FC'}
                    fontSize="6.9"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {id}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Sensation telemetry readouts */}
        <div className="flex-1 min-w-0 space-y-2 text-[13px]">
          {/* Post-session skin erythema dermal swatch */}
          <div className="bg-slate-950/70 border border-slate-800/70 rounded p-2 flex items-center gap-2">
            <div className="relative shrink-0">
              <div
                className="w-9 h-9 rounded-full border transition-all duration-500"
                style={{
                  backgroundColor: effects.skinErythemaRisk > 6 ? '#DC2626' : effects.skinErythemaRisk > 3 ? '#F87171' : effects.skinErythemaRisk > 1 ? '#FCA5A5' : '#FECACA',
                  borderColor: '#7F1D1D',
                  boxShadow: effects.skinErythemaRisk > 3 ? '0 0 10px rgba(220,38,38,0.5)' : 'none',
                  opacity: 0.4 + Math.min(0.6, effects.skinErythemaRisk / 10)
                }}
              />
            </div>
            <div className="min-w-0">
              <div className="text-slate-400 flex items-center gap-1">🔴 Skin erythema (redness)</div>
              <div className="font-bold text-rose-300">{effects.skinErythemaRisk} / 10</div>
              <div className="truncate font-mono text-[11.5px] text-slate-500">Q = {telemetry.chargeDensityCCm2} C/cm²</div>
            </div>
          </div>

          {/* Scalp tingling meter */}
          <div className="bg-slate-950/70 border border-slate-800/70 rounded p-2">
            <div className="text-slate-400 flex items-center gap-1">🐜 Scalp tingling / itching</div>
            <div className="flex items-center justify-between">
              <span className="font-mono font-semibold text-amber-300">{effects.tinglingScore} / 10</span>
              <span className="font-mono text-[11.5px] text-slate-500">J = {telemetry.currentDensityMaCm2} mA/cm²</span>
            </div>
            <div className="h-1 bg-slate-900 rounded-full mt-1 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-600 to-amber-300 rounded transition-all duration-500"
                style={{ width: `${Math.max(4, effects.tinglingScore * 10)}%` }}
              />
            </div>
          </div>

          {/* Lingual nerve metallic taste */}
          <div className="bg-slate-950/70 border border-slate-800/70 rounded p-2">
            <div className="text-slate-400 flex items-center gap-1">👅 Metallic taste (lingual nerve)</div>
            <div className="flex items-center justify-between mt-0.5">
              <span className={`font-bold ${effects.metallicTaste ? 'text-amber-300' : 'text-slate-500'}`}>
                {effects.metallicTaste ? 'DETECTED' : 'ABSENT'}
              </span>
              <span
                className={`px-1.5 py-0.5 rounded text-[11.5px] font-bold border ${
                  effects.metallicTaste
                    ? 'bg-amber-950 text-amber-400 border-amber-800 animate-pulse'
                    : 'bg-slate-800 text-slate-500 border-slate-700'
                }`}
              >
                {temporalActive} BRANCH
              </span>
            </div>
          </div>

          {/* Retinal phosphene flare */}
          {effects.phospheneRisk ? (
            <div className="bg-rose-950/30 border border-rose-800/50 rounded p-2 text-[12.5px] text-slate-200 flex items-start gap-1.5">
              <span className="shrink-0">💡</span>
              <div>
                <span className="font-bold text-rose-300">Retinal phosphene flare: </span>
                <span className="text-slate-300">frontopolar/orbital current triggers visual flashes during ramps</span>
              </div>
            </div>
          ) : (
            <div className="bg-slate-950/70 border border-slate-800/70 rounded p-2 text-[12.5px] text-slate-500 flex items-start gap-1.5">
              <span className="shrink-0">👁️</span>
              <div>Optic pathway clear — no frontopolar or orbital stimulation</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
