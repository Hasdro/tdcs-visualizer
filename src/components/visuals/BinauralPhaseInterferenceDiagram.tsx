import React from 'react';

interface BinauralPhaseInterferenceDiagramProps {
  carrierHz: number;
  beatHz: number;
  isPlaying: boolean;
}

/**
 * Acoustic phase-interference schematic: two pure tones (left f₀, right f₀ + Δf)
 * converge via the cochlear nerves at the brainstem Superior Olivary Complex,
 * whose superimposition yields the amplitude-modulated beat envelope the auditory cortex entrains to.
 */
export const BinauralPhaseInterferenceDiagram: React.FC<BinauralPhaseInterferenceDiagramProps> = ({
  carrierHz,
  beatHz,
  isPlaying
}) => {
  const liveColor = isPlaying ? '#22D3EE' : '#475569';

  // Small pure-tone wavelet path for the ear chips (carrier vs detuned tone)
  const toneWave = (color: string, speed: string) => (
    <g>
      {[0, 1, 2].map((i) => (
        <circle
          key={i}
          r="1.8"
          fill="none"
          stroke={color}
          strokeWidth="1.4"
          className={isPlaying ? 'animate-ping' : ''}
          style={{ animationDuration: speed, animationDelay: `${i * 0.45}s` }}
        />
      ))}
    </g>
  );

  return (
    <div className="rounded-lg border border-slate-800/80 bg-slate-950/80 p-2.5">
      <div className="flex items-center justify-between text-[11px] mb-1.5">
        <span className="font-bold text-slate-300 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          Binaural phase-interference
        </span>
        <span className={isPlaying ? 'text-cyan-400 font-bold' : 'text-slate-500'}>
          Δf = <span className="font-mono">{beatHz.toFixed(1)} Hz</span> beat
        </span>
      </div>

      <svg viewBox="0 0 260 158" className="w-full">
        {/* ===== Head outline hint ===== */}
        <ellipse cx="130" cy="72" rx="92" ry="58" fill="#0A101D" stroke="#1E293B" strokeWidth="1.2" opacity="0.85" />

        {/* ===== L + R ear canal chips ===== */}
        <g>
          <rect x="10" y="18" width="46" height="30" rx="5" fill="#0E1729" stroke="#3B82F6" strokeWidth="1.2" />
          <text x="33" y="27" fill="#93C5FD" fontSize="8" fontWeight="bold" textAnchor="middle">Left ear</text>
          <text x="33" y="36" fill="#60A5FA" fontSize="8.6" textAnchor="middle" fontFamily="'IBM Plex Mono', monospace">{carrierHz} Hz f₀</text>
          <g transform="translate(33, 42)">
            {toneWave('#60A5FA', '1.6s')}
            <text x="16" y="3" fill="#475569" fontSize="6.3">sine</text>
          </g>
        </g>
        <g>
          <rect x="204" y="18" width="46" height="30" rx="5" fill="#0E1729" stroke="#06B6D4" strokeWidth="1.2" />
          <text x="227" y="27" fill="#67E8F9" fontSize="8" fontWeight="bold" textAnchor="middle">Right ear</text>
          <text x="227" y="36" fill="#22D3EE" fontSize="8.6" textAnchor="middle" fontFamily="'IBM Plex Mono', monospace">{(carrierHz + beatHz).toFixed(1)} Hz</text>
          <g transform="translate(227, 42)">
            {toneWave('#22D3EE', '1.15s')}
            <text x="16" y="3" fill="#475569" fontSize="6.3">detuned</text>
          </g>
        </g>

        {/* ===== Cochlear nerve tracts converging on the brainstem ===== */}
        <path
          d="M 56 46 C 70 62, 100 66, 122 80"
          fill="none"
          stroke="#3B82F6"
          strokeWidth="2"
          strokeDasharray="4 3"
          opacity={isPlaying ? 0.95 : 0.4}
        >
          <animate attributeName="stroke-dashoffset" from="14" to="0" dur="0.8s" repeatCount="indefinite" />
        </path>
        <path
          d="M 204 46 C 190 62, 160 66, 138 80"
          fill="none"
          stroke="#06B6D4"
          strokeWidth="2"
          strokeDasharray="4 3"
          opacity={isPlaying ? 0.95 : 0.4}
        >
          <animate attributeName="stroke-dashoffset" from="14" to="0" dur="0.8s" repeatCount="indefinite" />
        </path>

        {/* ===== Superior Olivary Complex collision node ===== */}
        <g className={isPlaying ? '' : 'opacity-50'}>
          <circle cx="130" cy="86" r="10" fill="#172554" stroke={liveColor} strokeWidth="1.4" className={isPlaying ? 'animate-pulse' : ''} />
          {/* Phase collision burst rays */}
          {isPlaying && [0, 60, 120, 180, 240, 300].map((deg) => {
            const rad = (deg * Math.PI) / 180;
            return (
              <line
                key={deg}
                x1={130 + Math.cos(rad) * 11}
                y1={86 + Math.sin(rad) * 11}
                x2={130 + Math.cos(rad) * 15}
                y2={86 + Math.sin(rad) * 15}
                stroke={liveColor}
                strokeWidth="1.2"
                opacity="0.8"
              />
            );
          })}
          <text x="130" y="103" fill="#93C5FD" fontSize="8.6" fontWeight="bold" textAnchor="middle">Superior olive (brainstem)</text>
          <text x="130" y="110" fill="#64748B" fontSize="6.9" textAnchor="middle">f₀ ⊕ (f₀+Δf) superimposition</text>
        </g>

        {/* ===== Resulting amplitude-modulated beat envelope ===== */}
        {/* Envelope: dashed |sin(Δf·t)| spanning probe band */}
        <path
          d="M 40 128 C 46 122, 52 122, 58 128 S 70 134, 76 128 S 88 122, 94 128 S 106 134, 112 128 S 124 122, 130 128 S 142 134, 148 128 S 160 122, 166 128 S 178 134, 184 128 S 196 122, 202 128"
          fill="none"
          stroke="#A78BFA"
          strokeWidth="1.3"
          strokeDasharray="3 2"
          opacity={isPlaying ? 0.9 : 0.4}
          className={isPlaying ? 'animate-pulse' : ''}
        />
        {/* Carrier micro-sine riding the envelope axis */}
        <line x1="40" y1="128" x2="202" y2="128" stroke="#334155" strokeWidth="0.8" />
        {isPlaying ? (
          <path
            d="M 40 128 l 3 -5 l 6 10 l 6 -10 l 6 10 l 6 -10 l 6 10 l 6 -10 l 6 10 l 6 -10 l 6 10 l 6 -10 l 6 10 l 6 -10 l 6 10 l 6 -10 l 6 10 l 6 -10 l 6 10 l 6 -10 l 6 10 l 6 -10 l 6 10 l 6 -10 l 6 10 l 6 -10 l 3 -2"
            fill="none"
            stroke="#C4B5FD"
            strokeWidth="1.1"
            opacity="0.85"
          />
        ) : null}

        {/* Auditory cortex entrainment target */}
        <rect x="92" y="136" width="76" height="16" rx="4" fill={isPlaying ? '#1E1B4B' : '#0E1729'} stroke="#A78BFA" strokeWidth="1.1" />
        <text x="130" y="147" fill={isPlaying ? '#C4B5FD' : '#64748B'} fontSize="8.6" fontWeight="bold" textAnchor="middle">
          Auditory cortex ⇄ <tspan fontFamily="'IBM Plex Mono', monospace">{beatHz.toFixed(0)} Hz</tspan>
        </text>
      </svg>

      {/* Compact caption replaces the previous headphones paragraph */}
      <div className="flex items-center justify-between text-[10.5px] pt-1.5 border-t border-slate-800/60">
        <span className="text-slate-400">
          🎧 Headphones required — the beat exists only as <span className="text-cyan-300">neurological phase interference</span>
        </span>
        <span className={isPlaying ? 'text-cyan-400' : 'text-slate-500'}>
          {isPlaying ? '● LIVE ENTRAINMENT' : '○ STANDBY'}
        </span>
      </div>
    </div>
  );
};
