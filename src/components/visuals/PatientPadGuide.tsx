import React from 'react';
import { CheckCircle2, MapPin } from 'lucide-react';

interface PatientPadGuideProps {
  anodeId: string;
  cathodeId: string;
  mode: 'sponge' | 'hd4x1';
  padAreaCm2: number;
}

// Front-of-head projection of the 10-20 sites used by the active presets.
const FRONT_COORDS: Record<string, { x: number; y: number }> = {
  Fp1: { x: 74, y: 42 },
  Fp2: { x: 126, y: 42 },
  Fpz: { x: 100, y: 36 },
  F7: { x: 50, y: 74 },
  F3: { x: 76, y: 58 },
  Fz: { x: 100, y: 60 },
  F4: { x: 124, y: 58 },
  F8: { x: 150, y: 74 },
  T7: { x: 42, y: 100 },
  C3: { x: 66, y: 98 },
  Cz: { x: 100, y: 96 },
  C4: { x: 134, y: 98 },
  T8: { x: 158, y: 100 },
  P7: { x: 50, y: 126 },
  P3: { x: 76, y: 130 },
  Pz: { x: 100, y: 132 },
  P4: { x: 124, y: 130 },
  P8: { x: 150, y: 126 },
  Oz: { x: 100, y: 158 },
  O1: { x: 78, y: 154 },
  O2: { x: 122, y: 154 }
};

const PLACEMENT: Record<string, string> = {
  Fp1: 'above the left eyebrow',
  Fp2: 'above the right eyebrow',
  Fpz: 'centre of the forehead',
  F3: 'left upper forehead',
  F4: 'right upper forehead',
  Fz: 'centre of the forehead',
  F7: 'left temple',
  F8: 'right temple',
  C3: 'left side of the crown',
  C4: 'right side of the crown',
  Cz: 'top centre of the head',
  T7: 'left side, above the ear',
  T8: 'right side, above the ear',
  P3: 'left back of the head',
  P4: 'right back of the head',
  Pz: 'centre back of the head',
  P7: 'left back side of the head',
  P8: 'right back side of the head',
  Oz: 'back of the head, above the neck',
  O1: 'left back of the head',
  O2: 'right back of the head'
};

const fallback = (id: string) => `the ${id} position marked on the head map`;
export const getPadPlacement = (id: string) => PLACEMENT[id] ?? fallback(id);
const placementFor = getPadPlacement;

const clampCoord = (id: string) => FRONT_COORDS[id] ?? { x: 100, y: 88 };

export const PatientPadGuide: React.FC<PatientPadGuideProps> = ({
  anodeId,
  cathodeId,
  mode,
  padAreaCm2
}) => {
  const anode = clampCoord(anodeId);
  const cathode = clampCoord(cathodeId);
  const isHD = mode === 'hd4x1';

  return (
    <section className="panel-card overflow-hidden">
      <div className="panel-header">
        <div>
          <h3 className="panel-title">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-300">
              <MapPin className="h-3.5 w-3.5" />
            </span>
            Where the pads go
          </h3>
          <p className="panel-kicker">Your placement guide for this session</p>
        </div>
        <div className="rounded-md border border-slate-700/80 bg-slate-950/70 px-2 py-1 font-mono text-[11px]">
          <span className="text-rose-300">{anodeId} +</span>
          <span className="mx-1 text-slate-600">/</span>
          <span className="text-cyan-300">{cathodeId} −</span>
        </div>
      </div>

      <div className="p-3">
        <div className="overflow-hidden rounded-xl border border-slate-800/80 bg-[#070B12]">
          <svg viewBox="0 0 200 176" className="h-auto w-full" role="img" aria-label={`Red pad at ${anodeId} and blue pad at ${cathodeId}`}>
            <defs>
              <radialGradient id="patientScalp" cx="50%" cy="42%" r="62%">
                <stop offset="0%" stopColor="#13243C" />
                <stop offset="100%" stopColor="#0A121F" />
              </radialGradient>
              <filter id="padGlow" x="-80%" y="-80%" width="260%" height="260%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Anterior head and neck silhouette */}
            <path d="M 77 148 L 77 168 L 123 168 L 123 148" fill="#0E1828" stroke="#1E293B" strokeWidth="1.2" />
            <ellipse cx="100" cy="82" rx="63" ry="72" fill="url(#patientScalp)" stroke="#334155" strokeWidth="1.6" />
            <path d="M 94 12 L 100 4 L 106 12 Z" fill="#1E293B" stroke="#475569" strokeWidth="1" />
            <path d="M 37 82 C 28 82, 28 100, 37 100" fill="none" stroke="#334155" strokeWidth="1.4" />
            <path d="M 163 82 C 172 82, 172 100, 163 100" fill="none" stroke="#334155" strokeWidth="1.4" />

            {/* Faint midline + orientation cue */}
            <line x1="100" y1="18" x2="100" y2="142" stroke="#1E293B" strokeWidth="0.8" strokeDasharray="3 4" />
            <text x="100" y="174" fill="#64748B" fontSize="6.9" textAnchor="middle" letterSpacing="0.8">
              FRONT OF HEAD · NASION
            </text>

            {/* Current path */}
            <path
              d={`M ${anode.x} ${anode.y} Q 100 22 ${cathode.x} ${cathode.y}`}
              fill="none"
              stroke="#F59E0B"
              strokeWidth="1.2"
              strokeDasharray="4 3"
              opacity="0.75"
            />

            {/* HD return ring */}
            {isHD && (
              <g>
                {[
                  { x: anode.x - 18, y: anode.y - 12 },
                  { x: anode.x + 18, y: anode.y - 12 },
                  { x: anode.x - 18, y: anode.y + 16 },
                  { x: anode.x + 18, y: anode.y + 16 }
                ].map((p, i) => (
                  <g key={i}>
                    <circle cx={p.x} cy={p.y} r="5" fill="#083344" stroke="#06B6D4" strokeWidth="1.1" />
                    <text x={p.x} y={p.y + 1.6} fill="#67E8F9" fontSize="6.3" textAnchor="middle">−</text>
                  </g>
                ))}
              </g>
            )}

            {/* Cathode pad */}
            <g filter="url(#padGlow)">
              <circle cx={cathode.x} cy={cathode.y} r="10.5" fill="#083344" fillOpacity="0.9" stroke="#22D3EE" strokeWidth="2" />
              <text x={cathode.x} y={cathode.y + 2.5} fill="#CFFAFE" fontSize="10" fontWeight="bold" textAnchor="middle">−</text>
            </g>
            <text x={cathode.x + (cathode.x > 100 ? 15 : -15)} y={cathode.y - 4} fill="#67E8F9" fontSize="8" fontWeight="bold" textAnchor={cathode.x > 100 ? 'start' : 'end'}>
              {cathodeId} · BLUE
            </text>

            {/* Anode pad */}
            <g filter="url(#padGlow)">
              <circle cx={anode.x} cy={anode.y} r="10.5" fill="#3B0A12" fillOpacity="0.9" stroke="#F87171" strokeWidth="2" />
              <text x={anode.x} y={anode.y + 3} fill="#FEE2E2" fontSize="10" fontWeight="bold" textAnchor="middle">+</text>
            </g>
            <text x={anode.x + (anode.x > 100 ? 15 : -15)} y={anode.y - 4} fill="#FCA5A5" fontSize="8" fontWeight="bold" textAnchor={anode.x > 100 ? 'start' : 'end'}>
              {anodeId} · RED
            </text>

            {/* Numbered callouts */}
            <circle cx={anode.x} cy={anode.y - 15} r="6" fill="#F8FAFC" />
            <text x={anode.x} y={anode.y - 13} fill="#450A0A" fontSize="8.6" fontWeight="bold" textAnchor="middle">1</text>
            <circle cx={cathode.x} cy={cathode.y - 15} r="6" fill="#F8FAFC" />
            <text x={cathode.x} y={cathode.y - 13} fill="#083344" fontSize="8.6" fontWeight="bold" textAnchor="middle">2</text>
          </svg>
        </div>

        <div className="mt-3 space-y-2.5">
          <Step
            index={1}
            tone="red"
            title={`Red pad (+) on ${anodeId}`}
            body={`Place it on the ${placementFor(anodeId)}. This is the active pad that gently increases activity under it.`}
          />
          <Step
            index={2}
            tone="cyan"
            title={`Blue pad (−) on ${cathodeId}`}
            body={`Place it ${placementFor(cathodeId)}. It completes the circuit and is the return pad.`}
          />
          <Step
            index={3}
            tone="emerald"
            title={isHD ? 'Seat the 4×1 ring' : `Seat the ${padAreaCm2} cm² sponges`}
            body={
              isHD
                ? 'The centre pad is active; the four small pads are returns. Press the whole ring down evenly.'
                : 'Damp — not dripping — with saline or gel, press down for full contact, and tighten the strap until snug.'
            }
          />
        </div>
      </div>
    </section>
  );
};

const Step: React.FC<{ index: number; tone: 'red' | 'cyan' | 'emerald'; title: string; body: string }> = ({
  index,
  tone,
  title,
  body
}) => {
  const toneClasses = {
    red: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
    cyan: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300',
    emerald: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
  }[tone];

  return (
    <div className="flex gap-2.5">
      <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border font-mono text-[11px] font-bold ${toneClasses}`}>
        {index}
      </span>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 text-[12.5px] font-semibold text-slate-100">
          <CheckCircle2 className="h-3 w-3 shrink-0 text-slate-500" />
          {title}
        </div>
        <p className="mt-0.5 text-[11.5px] leading-relaxed text-slate-400">{body}</p>
      </div>
    </div>
  );
};

export default PatientPadGuide;
