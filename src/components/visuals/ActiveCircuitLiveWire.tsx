import React from 'react';

interface ActiveCircuitLiveWireProps {
  anodeId: string;
  cathodeId: string;
  currentMa: number;
  durationMin: number;
  mode: 'sponge' | 'hd4x1';
}

export const ActiveCircuitLiveWire: React.FC<ActiveCircuitLiveWireProps> = ({
  anodeId,
  cathodeId,
  currentMa,
  durationMin,
  mode
}) => {
  return (
    <div className="hidden 2xl:flex items-center gap-2 px-3 py-1 bg-slate-950/80 border border-slate-800 rounded-xl font-mono text-[10px] select-none">
      {/* Anode Badge */}
      <div className="flex items-center gap-1 text-red-400 font-bold">
        <span className="w-2 h-2 rounded-full bg-red-500 shadow-glow-anode animate-pulse" />
        <span>{anodeId} (+)</span>
      </div>

      {/* Animated Circuit Wire with Flowing Particles */}
      <div className="relative w-28 h-5 flex items-center justify-center">
        <svg viewBox="0 0 100 20" className="w-full h-full overflow-visible">
          {/* Wire path */}
          <line x1="5" y1="10" x2="95" y2="10" stroke="#334155" strokeWidth="1.5" strokeDasharray="3 2" />

          {/* Flowing Electron Particles */}
          <circle cx="20" cy="10" r="2" fill="#F59E0B" className="animate-ping" style={{ animationDuration: `${2.5 / currentMa}s` }} />
          <circle cx="50" cy="10" r="2.5" fill="#38BDF8" className="animate-pulse" />
          <circle cx="80" cy="10" r="2" fill="#06B6D4" />

          {/* Voltage Spark */}
          <text x="50" y="7" fill="#FBBF24" fontSize="6.5" textAnchor="middle" fontWeight="bold">
            ⚡ {currentMa.toFixed(1)}mA @ {durationMin}m
          </text>
        </svg>
      </div>

      {/* Cathode Badge */}
      <div className="flex items-center gap-1 text-cyan-400 font-bold">
        <span>{mode === 'hd4x1' ? 'HD 4×1' : `${cathodeId} (–)`}</span>
        <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-glow-cathode animate-pulse" />
      </div>
    </div>
  );
};
