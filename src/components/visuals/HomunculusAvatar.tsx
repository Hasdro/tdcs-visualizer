import React from 'react';
import { BRAIN_NODES } from '../../data/brain_nodes';

interface HomunculusAvatarProps {
  anodeId: string;
  cathodeId: string;
}

export const HomunculusAvatar: React.FC<HomunculusAvatarProps> = ({ anodeId, cathodeId }) => {
  const anodeNode = BRAIN_NODES[anodeId] || BRAIN_NODES['F3'];
  const targetLobe = anodeNode.lobe;

  const isMotor = targetLobe.includes('Motor') || ['C3', 'C4', 'Cz'].includes(anodeId);
  const isFrontal = targetLobe.includes('Frontal') || ['F3', 'F4', 'Fz', 'Fp1', 'Fp2'].includes(anodeId);
  const isSensory = ['P3', 'P4', 'Pz', 'CP1', 'CP2'].includes(anodeId);
  const isVisual = targetLobe.includes('Occipital') || ['O1', 'O2', 'Oz'].includes(anodeId);

  return (
    <div className="bg-[#0C121E]/95 border border-slate-800/90 rounded-xl p-3 shadow-xl select-none font-mono text-xs">
      <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/60 text-[11px]">
        <span className="font-bold text-slate-200 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          SOMATOTOPIC EMBODIMENT AVATAR
        </span>
        <span className="text-[10px] text-slate-400">PHYSICAL BODY MAP ({anodeId} → {cathodeId})</span>
      </div>

      <div className="my-2 flex items-center justify-center gap-4">
        {/* Human Silhouette SVG */}
        <svg viewBox="0 0 100 120" className="w-20 h-24">
          {/* Head & Forehead */}
          <circle
            cx="50"
            cy="18"
            r="12"
            fill={isFrontal ? '#F59E0B' : '#1E293B'}
            opacity={isFrontal ? '0.9' : '0.5'}
            stroke={isFrontal ? '#FCD34D' : '#475569'}
            strokeWidth="1.2"
            className={isFrontal ? 'animate-pulse' : ''}
          />

          {/* Neck */}
          <rect x="47" y="30" width="6" height="6" fill="#1E293B" opacity="0.5" />

          {/* Torso / Body Core */}
          <path
            d="M 38 36 L 62 36 L 58 75 L 42 75 Z"
            fill={isSensory ? '#06B6D4' : '#1E293B'}
            opacity={isSensory ? '0.9' : '0.5'}
            stroke={isSensory ? '#67E8F9' : '#475569'}
            strokeWidth="1.2"
          />

          {/* Left & Right Arms & Motor Hands */}
          <path
            d="M 38 38 L 22 65 L 18 82"
            fill="none"
            stroke={isMotor ? '#EF4444' : '#334155'}
            strokeWidth={isMotor ? '3.5' : '2'}
            strokeLinecap="round"
            className={isMotor ? 'animate-pulse' : ''}
          />
          <path
            d="M 62 38 L 78 65 L 82 82"
            fill="none"
            stroke={isMotor ? '#EF4444' : '#334155'}
            strokeWidth={isMotor ? '3.5' : '2'}
            strokeLinecap="round"
            className={isMotor ? 'animate-pulse' : ''}
          />

          {/* Hands Glowing Halo */}
          {isMotor && (
            <>
              <circle cx="18" cy="82" r="5" fill="#EF4444" className="animate-ping opacity-75" />
              <circle cx="82" cy="82" r="5" fill="#EF4444" className="animate-ping opacity-75" />
            </>
          )}

          {/* Legs */}
          <path d="M 44 75 L 40 115" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 56 75 L 60 115" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" />

          {/* Eyes / Occipital Retinal Vector */}
          {isVisual && (
            <circle cx="50" cy="18" r="6" fill="#8B5CF6" className="animate-pulse" />
          )}
        </svg>

        {/* Embodied Effect Description */}
        <div className="flex-1 text-[10px] space-y-1">
          <div className="font-bold text-slate-200">
            {isMotor
              ? '⚡ Contralateral Motor Hand Strip'
              : isFrontal
              ? '🧠 Prefrontal Executive Focus'
              : isSensory
              ? '🛡️ Somatosensory Pain Map'
              : isVisual
              ? '👁️ Primary Visual Cortical Field'
              : 'Whole-Head Neuromodulation'}
          </div>
          <p className="text-slate-400 leading-tight">
            {isMotor
              ? 'Facilitates finger tap velocity, pinch grip force, and motor skill consolidation.'
              : isFrontal
              ? 'Directs cognitive control, working memory gating, and mood valence circuits.'
              : isSensory
              ? 'Elevates peripheral thermal and mechanical sensory pain thresholds.'
              : 'Modulates ocular contrast sensitivity and spatial visual acuity.'}
          </p>
        </div>
      </div>
    </div>
  );
};
