import React from 'react';
import { Crosshair, Eye, Footprints, MessageSquareText, Scale, Shapes, Sun, Zap } from 'lucide-react';
import { CLINICAL_PRESETS, ClinicalPreset } from '../../data/clinical_presets';

interface PresetGlyphRibbonProps {
  activePresetId?: string;
  onSelectPreset: (preset: ClinicalPreset) => void;
}

// One standard glyph per indication, shared with the rest of the interface.
const PRESET_GLYPH: Record<string, { Icon: React.ComponentType<{ className?: string }>; tone: string; label: string }> = {
  'classic-dlpfc': { Icon: Sun, tone: 'text-amber-300', label: 'Mood' },
  'bifrontal-anti-rumination': { Icon: Scale, tone: 'text-sky-300', label: 'Rumination' },
  'm1-so-motor-learning': { Icon: Footprints, tone: 'text-emerald-300', label: 'Motor / pain' },
  'stroke-bihemispheric': { Icon: Zap, tone: 'text-yellow-300', label: 'Stroke' },
  'broca-fluency': { Icon: MessageSquareText, tone: 'text-violet-300', label: 'Speech' },
  'parietal-spatial-math': { Icon: Shapes, tone: 'text-teal-300', label: 'Attention' },
  'v1-contrast-plasticity': { Icon: Eye, tone: 'text-cyan-300', label: 'Vision' },
  'hd-tdcs-focal-dlpfc': { Icon: Crosshair, tone: 'text-rose-300', label: 'Focal HD' }
};

/**
 * Header ribbon of indication glyphs. Each chip loads its evidence-backed
 * preset; labels appear on wide screens, the glyph alone carries meaning below.
 */
export const PresetGlyphRibbon: React.FC<PresetGlyphRibbonProps> = ({ activePresetId, onSelectPreset }) => (
  <div className="flex min-w-0 items-center gap-1 overflow-x-auto custom-scrollbar" role="toolbar" aria-label="Clinical presets">
    {CLINICAL_PRESETS.map((preset) => {
      const glyph = PRESET_GLYPH[preset.id] ?? { Icon: Zap, tone: 'text-slate-300', label: preset.shortLabel };
      const { Icon } = glyph;
      const active = preset.id === activePresetId;
      return (
        <button
          key={preset.id}
          type="button"
          onClick={() => onSelectPreset(preset)}
          aria-pressed={active}
          title={`${preset.name} · ${preset.anode} → ${preset.montageType === 'hd4x1' ? 'HD ring' : preset.cathode} · ${preset.currentMa} mA`}
          className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-2 py-1.5 text-[13.5px] font-medium transition ${
            active
              ? 'border-cyan-400/60 bg-cyan-500/15 text-cyan-100'
              : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-600 hover:text-slate-200'
          }`}
        >
          <Icon className={`h-3.5 w-3.5 ${glyph.tone}`} />
          <span className="hidden whitespace-nowrap 2xl:inline">{glyph.label}</span>
        </button>
      );
    })}
  </div>
);

export default PresetGlyphRibbon;
