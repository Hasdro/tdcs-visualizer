import React from 'react';
import { CLINICAL_PRESETS, ClinicalPreset } from '../../data/clinical_presets';

interface VisualPresetRibbonProps {
  activeAnode: string;
  activeCathode: string;
  activeMode: string;
  onSelectPreset: (preset: ClinicalPreset) => void;
}

const PRESET_ICONS: Record<string, string> = {
  depression_ldlpfc: '☀️',
  focus_adhd: '🎯',
  motor_stroke: '⚡',
  chronic_pain_m1: '🛡️',
  bifrontal_anxiety: '🌊',
  verbal_memory: '📖',
  visual_enhancement: '👁️',
  auditory_tinnitus: '👂'
};

export const VisualPresetRibbon: React.FC<VisualPresetRibbonProps> = ({
  activeAnode,
  activeCathode,
  activeMode,
  onSelectPreset
}) => {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-2xl custom-scrollbar font-mono text-xs select-none">
      {CLINICAL_PRESETS.map((preset) => {
        const isSelected =
          activeAnode === preset.anode &&
          activeCathode === preset.cathode &&
          activeMode === preset.montageType;

        const icon = PRESET_ICONS[preset.id] || '⚡';

        return (
          <div key={preset.id} className="relative group shrink-0">
            <button
              onClick={() => onSelectPreset(preset)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 font-bold shadow-glow-cyan'
                  : 'bg-slate-900/70 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              {/* Miniature Head Glyph (20x20 SVG) */}
              <svg viewBox="0 0 20 20" className="w-4 h-4 shrink-0">
                <circle cx="10" cy="10" r="8" fill="#0F172A" stroke="#334155" strokeWidth="1" />
                {/* Nose notch */}
                <path d="M 9 2 L 10 0.5 L 11 2 Z" fill="#475569" />
                {/* Red Pin (Anode) */}
                <circle cx="7" cy="7" r="1.8" fill="#EF4444" />
                {/* Blue Pin (Cathode) */}
                <circle cx="13" cy="7" r="1.8" fill="#06B6D4" />
              </svg>

              <span className="text-sm">{icon}</span>
              <span className="text-[10px] whitespace-nowrap">{preset.shortLabel}</span>
            </button>

            {/* Hover Popover Preview */}
            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-52 hidden group-hover:block bg-[#0F1623]/95 border border-cyan-500/60 p-2.5 rounded-xl shadow-2xl backdrop-blur-md z-40 text-[10px] pointer-events-none animate-in fade-in zoom-in-95">
              <div className="font-bold text-white flex items-center justify-between pb-1 border-b border-slate-800">
                <span>{preset.name}</span>
                <span className="text-amber-400">{preset.evidenceLevel}</span>
              </div>
              <div className="flex items-center justify-between my-1.5 text-slate-300">
                <span className="text-red-400 font-bold">🔴 {preset.anode} (+)</span>
                <span className="text-slate-500">──►</span>
                <span className="text-cyan-400 font-bold">🔵 {preset.cathode} (–)</span>
              </div>
              <div className="text-[9px] text-slate-400">
                {preset.currentMa} mA • {preset.durationMin} min • {preset.montageType === 'hd4x1' ? 'HD 4×1 Ring' : `${preset.padAreaCm2} cm² Pad`}
              </div>
              <div className="text-[9px] text-emerald-400 mt-1 italic">
                {preset.primaryMechanism}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
