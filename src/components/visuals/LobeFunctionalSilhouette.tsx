import React from 'react';
import { BRAIN_NODES } from '../../data/brain_nodes';

interface LobeFunctionalSilhouetteProps {
  anodeId: string;
  cathodeId: string;
}

const BRODMANN_DESCRIPTIONS: Record<number, string> = {
  4: 'Primary Motor Cortex (M1) — voluntary motor execution & finger speed',
  6: 'Premotor & Supplementary Motor Area — motor sequencing & planning',
  9: 'Dorsolateral Prefrontal Cortex (DLPFC) — executive focus & working memory',
  10: 'Anterior Frontopolar Cortex — strategic branching & multi-tasking',
  11: 'Orbitofrontal Cortex — reward valuation & decision-making',
  19: 'Secondary Visual Cortex — visual contrast & motion analysis',
  21: 'Middle Temporal Gyrus — semantic memory & language processing',
  37: 'Fusiform Gyrus — face processing & visual word recognition',
  40: 'Supramarginal Gyrus (Inferior Parietal) — phonological processing',
  46: 'Dorsolateral Prefrontal Cortex (DLPFC) — cognitive control & sustained attention'
};

export const LobeFunctionalSilhouette: React.FC<LobeFunctionalSilhouetteProps> = ({
  anodeId,
  cathodeId
}) => {
  const anodeNode = BRAIN_NODES[anodeId] || BRAIN_NODES['F3'];
  const cathodeNode = BRAIN_NODES[cathodeId] || BRAIN_NODES['Fp2'];

  const targetLobe = anodeNode.lobe;
  const returnLobe = cathodeNode.lobe;

  return (
    <div className="panel-card select-none p-3 text-xs">
      <div className="flex items-start justify-between gap-2 border-b border-slate-800/70 pb-2">
        <span className="flex items-center gap-2 text-[12px] font-semibold leading-snug tracking-tight text-slate-100">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          Anatomical target
        </span>
        <span className="text-[11px] text-amber-300 font-semibold">{targetLobe} cortex</span>
      </div>

      {/* Stylized Dual-Hemisphere Lobe Map */}
      <div className="my-2 p-2 bg-slate-950/60 rounded-lg border border-slate-800/60 flex items-center gap-3">
        <svg viewBox="0 0 100 80" className="w-16 h-14 shrink-0">
          {/* Frontal Lobe */}
          <path
            d="M 50 15 C 32 15, 20 28, 22 42 C 34 44, 48 40, 50 40 C 52 40, 66 44, 78 42 C 80 28, 68 15, 50 15 Z"
            fill={targetLobe.includes('Frontal') ? '#F59E0B' : '#1E293B'}
            opacity={targetLobe.includes('Frontal') ? '0.9' : '0.4'}
            stroke="#475569"
            strokeWidth="0.8"
          />
          {/* Motor / Sensorimotor Strip */}
          <path
            d="M 22 42 C 35 44, 48 40, 50 40 C 52 40, 65 44, 78 42 C 77 48, 65 50, 50 50 C 35 50, 23 48, 22 42 Z"
            fill={targetLobe.includes('Motor') ? '#EF4444' : '#1E293B'}
            opacity={targetLobe.includes('Motor') ? '0.9' : '0.4'}
            stroke="#475569"
            strokeWidth="0.8"
          />
          {/* Parietal Lobe */}
          <path
            d="M 23 48 C 35 50, 50 50, 50 50 C 50 50, 65 50, 77 48 C 74 60, 62 65, 50 65 C 38 65, 26 60, 23 48 Z"
            fill={targetLobe.includes('Parietal') ? '#06B6D4' : '#1E293B'}
            opacity={targetLobe.includes('Parietal') ? '0.9' : '0.4'}
            stroke="#475569"
            strokeWidth="0.8"
          />
          {/* Occipital Lobe */}
          <path
            d="M 38 65 C 50 65, 62 65, 62 65 C 58 74, 54 77, 50 77 C 46 77, 42 74, 38 65 Z"
            fill={targetLobe.includes('Occipital') ? '#8B5CF6' : '#1E293B'}
            opacity={targetLobe.includes('Occipital') ? '0.9' : '0.4'}
            stroke="#475569"
            strokeWidth="0.8"
          />
          {/* Longitudinal Fissure Center Line */}
          <line x1="50" y1="14" x2="50" y2="76" stroke="#0F172A" strokeWidth="1.5" />
        </svg>

        {/* Lobe Text Summary */}
        <div className="flex-1 text-[11px] space-y-1">
          <div className="text-slate-300">
            <span className="font-medium text-rose-300">Anode (+)</span> · {anodeNode.shortName}
          </div>
          <div className="text-slate-400">
            <span className="font-medium text-cyan-300">Cathode (–)</span> · {cathodeNode.shortName}
          </div>
          <div className="text-[10.5px] text-slate-500 pt-0.5 border-t border-slate-800">
            Dipole vector: {targetLobe} → {returnLobe}
          </div>
        </div>
      </div>

      {/* Brodmann Area Interactive Chips */}
      <div className="space-y-1 pt-1">
        <span className="text-[11px] text-slate-400 block">Target Brodmann areas:</span>
        <div className="flex flex-wrap gap-1.5">
          {anodeNode.brodmannAreas.map((ba) => (
            <div
              key={ba}
              className="group relative cursor-help bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border border-amber-800/60 px-2 py-0.5 rounded text-[11px] font-bold transition flex items-center gap-1"
            >
              <span className="font-mono">BA {ba}</span>
              {/* Tooltip */}
              <div className="absolute left-0 bottom-full mb-1.5 w-48 hidden group-hover:block bg-slate-900 text-slate-200 border border-amber-500/50 p-2 rounded-lg shadow-2xl text-[10.5px] leading-tight z-30 font-normal pointer-events-none">
                <span className="mb-0.5 block font-semibold text-amber-300">Brodmann area {ba}</span>
                {BRODMANN_DESCRIPTIONS[Number(ba)] || 'Cortical processing sub-region'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
