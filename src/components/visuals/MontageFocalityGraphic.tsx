import React from 'react';

interface MontageFocalityGraphicProps {
  mode: 'sponge' | 'hd4x1';
  onSelectMode: (mode: 'sponge' | 'hd4x1') => void;
}

export const MontageFocalityGraphic: React.FC<MontageFocalityGraphicProps> = ({
  mode,
  onSelectMode
}) => {
  const isHD = mode === 'hd4x1';

  return (
    <div className="panel-card select-none p-3 text-xs">
      <div className="flex items-start justify-between gap-2 border-b border-slate-800/70 pb-2">
        <span className="flex items-center gap-2 text-[14px] font-semibold leading-snug tracking-tight text-slate-100">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          Montage geometry
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-2">
        {/* Sponge pad Option Card */}
        <button
          onClick={() => onSelectMode('sponge')}
          className={`p-2 rounded-lg border text-left transition cursor-pointer flex flex-col justify-between ${
            !isHD
              ? 'bg-cyan-950/30 border-cyan-500/60 shadow-glow-cyan'
              : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700 opacity-60 hover:opacity-100'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[14px] font-bold ${!isHD ? 'text-cyan-300' : 'text-slate-400'}`}>
              Sponge pad
            </span>
            <span className="font-mono text-[12.5px] text-slate-500">25–35 cm²</span>
          </div>

          {/* SVG Diagram: Broad Diffuse Wash */}
          <div className="my-2 flex justify-center">
            <svg viewBox="0 0 70 45" className="w-16 h-10">
              {/* Diffuse Current Wash */}
              <defs>
                <radialGradient id="diffuseWash" cx="50%" cy="0%" r="90%">
                  <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.8" />
                  <stop offset="60%" stopColor="#38BDF8" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#0B132B" stopOpacity="0" />
                </radialGradient>
              </defs>
              {/* Scalp & Pad */}
              <rect x="15" y="4" width="40" height="6" rx="2" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1" />
              {/* Diffuse wash spreading wide into gyri */}
              <path d="M 15 10 C 15 35, 5 42, 0 44 L 70 44 C 65 42, 55 35, 55 10 Z" fill="url(#diffuseWash)" />
            </svg>
          </div>

          <p className="text-[12.5px] text-slate-400 leading-tight">
            Broad hemispheric flow with deep penetration and diffuse current dispersion.
          </p>
        </button>

        {/* HD 4x1 Ring Option Card */}
        <button
          onClick={() => onSelectMode('hd4x1')}
          className={`p-2 rounded-lg border text-left transition cursor-pointer flex flex-col justify-between ${
            isHD
              ? 'bg-cyan-950/40 border-cyan-400 shadow-glow-cyan'
              : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700 opacity-60 hover:opacity-100'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[14px] font-bold ${isHD ? 'text-cyan-300' : 'text-slate-400'}`}>
              HD 4×1 ring
            </span>
            <span className="font-mono text-[12.5px] font-semibold text-cyan-400">3.14 cm² focal</span>
          </div>

          {/* SVG Diagram: Focal Bullseye Ring */}
          <div className="my-2 flex justify-center">
            <svg viewBox="0 0 70 45" className="w-16 h-10">
              <defs>
                <radialGradient id="focalWash" cx="50%" cy="0%" r="50%">
                  <stop offset="0%" stopColor="#EF4444" stopOpacity="0.9" />
                  <stop offset="70%" stopColor="#06B6D4" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="#0B132B" stopOpacity="0" />
                </radialGradient>
              </defs>
              {/* Central Anode Disc */}
              <circle cx="35" cy="8" r="4" fill="#EF4444" stroke="#FCA5A5" strokeWidth="1" />
              {/* Surround Return Cathodes */}
              <circle cx="15" cy="8" r="2.5" fill="#0284C7" />
              <circle cx="55" cy="8" r="2.5" fill="#0284C7" />
              {/* Razor-sharp focal cone */}
              <path d="M 31 12 C 32 30, 33 42, 35 44 C 37 42, 38 30, 39 12 Z" fill="url(#focalWash)" />
            </svg>
          </div>

          <p className="text-[12.5px] text-slate-400 leading-tight">
            Focal targeting with the field confined near the target gyrus.
          </p>
        </button>
      </div>
    </div>
  );
};
