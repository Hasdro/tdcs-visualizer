import React from 'react';

interface NeurochemicalSeesawProps {
  isAnode: boolean;
  currentMa: number;
}

export const NeurochemicalSeesaw: React.FC<NeurochemicalSeesawProps> = ({ isAnode, currentMa }) => {
  // Seesaw tilt angle in degrees:
  // Under Anode: Glutamate is heavier (dips right, angle = +12 deg)
  // Under Cathode: GABA is heavier (dips left, angle = -12 deg)
  const tiltAngle = isAnode ? 12 : -12;

  return (
    <div className="bg-[#0C121E]/95 border border-slate-800/90 rounded-xl p-3 shadow-xl select-none font-mono text-xs">
      <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/60 text-[11px]">
        <span className="font-bold text-slate-200 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          GABA / GLUTAMATE BALANCE SCALE
        </span>
        <span className="text-[10px] text-amber-300 font-semibold">
          {isAnode ? 'Glutamatergic Bias (LTP)' : 'GABAergic Influx (LTD)'}
        </span>
      </div>

      <div className="my-2 flex justify-center items-center">
        <svg viewBox="0 0 200 90" className="w-52 h-24 overflow-visible">
          {/* Fulcrum Base Triangle */}
          <polygon points="100,50 90,82 110,82" fill="#1E293B" stroke="#475569" strokeWidth="1.5" />
          <circle cx="100" cy="50" r="4" fill="#38BDF8" />

          {/* Tilting Lever Beam */}
          <g transform={`rotate(${tiltAngle}, 100, 50)`} className="transition-transform duration-500 ease-out">
            {/* Beam Bar */}
            <rect x="25" y="48" width="150" height="4" rx="2" fill="#334155" stroke="#475569" strokeWidth="1" />

            {/* Left Pan: GABA (Inhibitory) */}
            <g transform="translate(35, 52)">
              <line x1="0" y1="0" x2="-10" y2="20" stroke="#64748B" strokeWidth="1" />
              <line x1="0" y1="0" x2="10" y2="20" stroke="#64748B" strokeWidth="1" />
              <path d="M -16 20 C -16 28, 16 28, 16 20 Z" fill="#0284C7" stroke="#38BDF8" strokeWidth="1" />
              <text x="0" y="32" fill="#38BDF8" fontSize="7" textAnchor="middle" fontWeight="bold">GABA</text>
            </g>

            {/* Right Pan: Glutamate (Excitatory) */}
            <g transform="translate(165, 52)">
              <line x1="0" y1="0" x2="-10" y2="20" stroke="#64748B" strokeWidth="1" />
              <line x1="0" y1="0" x2="10" y2="20" stroke="#64748B" strokeWidth="1" />
              <path d="M -16 20 C -16 28, 16 28, 16 20 Z" fill="#D97706" stroke="#F59E0B" strokeWidth="1" />
              <text x="0" y="32" fill="#FBBF24" fontSize="7" textAnchor="middle" fontWeight="bold">GLUTAMATE</text>
            </g>
          </g>
        </svg>
      </div>

      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/60">
        <span>{isAnode ? `Localized GABA reduction @ ${currentMa.toFixed(1)}mA` : `Suppressed excitability @ ${currentMa.toFixed(1)}mA`}</span>
        <span className="text-amber-400 font-bold">{isAnode ? 'Excitation ↑' : 'Inhibition ↑'}</span>
      </div>
    </div>
  );
};
