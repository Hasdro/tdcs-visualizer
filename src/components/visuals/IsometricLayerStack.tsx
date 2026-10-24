import React, { useState } from 'react';
import { Brain, ChevronDown, ChevronUp, Layers, Map as MapIcon, Skull } from 'lucide-react';

export interface LayerVisibility {
  face: boolean;
  scalp: boolean;
  shunt: boolean;
  efield: boolean;
  streamlines: boolean;
  pointCloud: boolean;
  brodmann: boolean;
}

export interface LayerOpacity {
  face: number;
  scalp: number;
  shunt: number;
  tissue: number;
  efield: number;
  streamlines: number;
  pointCloud: number;
}

export const TISSUE_OPACITY_MIN = 0.15;
export const TISSUE_OPACITY_MAX = 0.9;

interface IsometricLayerStackProps {
  visibility: LayerVisibility;
  onToggle: (key: keyof LayerVisibility) => void;
  opacity: LayerOpacity;
  onOpacityChange: (key: keyof LayerOpacity, value: number) => void;
}

interface LayerRow {
  id: string;
  label: string;
  color: string;
  Icon: React.ComponentType<IconProps>;
  tooltip: string;
  visibilityKey?: keyof LayerVisibility;
  opacityKey?: keyof LayerOpacity;
  min?: number;
  max?: number;
}

type IconProps = { className?: string; style?: React.CSSProperties };
const svgBase = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true
};

// Head in profile with eye, nose and lips: the skin surface.
const FaceIcon: React.FC<IconProps> = (p) => (
  <svg {...svgBase} {...p}>
    <path d="M15 21v-3.2c2-.8 3.4-2.7 3.4-5.2C18.4 7 15.2 3 10.6 3 6.4 3 3.6 6.2 3.6 10c0 1.5.4 2.8 1.2 3.9L3.5 16.6h2.1v1.8c0 1.1.9 2 2 2H10V21" />
    <circle cx="13.2" cy="9.6" r="0.9" fill="currentColor" />
  </svg>
);
// Scalp dome with the 10-20 electrode lattice.
const GridHeadIcon: React.FC<IconProps> = (p) => (
  <svg {...svgBase} {...p}>
    <path d="M3 16a9 9 0 0 1 18 0" />
    <path d="M12 7v9M7 9.5c1.2 2 1.6 4 1.6 6.5M17 9.5c-1.2 2-1.6 4-1.6 6.5M4.6 12.5h14.8" strokeWidth="1.1" />
    {[[12, 7], [7, 9.5], [17, 9.5], [8.6, 12.5], [15.4, 12.5], [12, 12.5]].map(([x, y]) => (
      <circle key={`${x}-${y}`} cx={x} cy={y} r="1.3" fill="currentColor" stroke="none" />
    ))}
    <path d="M3 16h18" />
  </svg>
);
// Anode and cathode with curved field lines between them.
const FieldIcon: React.FC<IconProps> = (p) => (
  <svg {...svgBase} {...p}>
    <circle cx="5" cy="12" r="2.6" />
    <circle cx="19" cy="12" r="2.6" />
    <path d="M4 12h2M5 11v2M18 12h2" strokeWidth="1.3" />
    <path d="M7.6 12h8.8M7.2 10.4c2.6-3 7-3 9.6 0M7.2 13.6c2.6 3 7 3 9.6 0M6.4 9.2c3-5 8.2-5 11.2 0M6.4 14.8c3 5 8.2 5 11.2 0" strokeWidth="1.1" />
  </svg>
);
// Current streamline with drift arrows.
const CurrentIcon: React.FC<IconProps> = (p) => (
  <svg {...svgBase} {...p}>
    <path d="M3 17c4-9 8 2 12-5s5-6 6-6" />
    <path d="M17.5 5.5 21 6l-.6 3.4" />
    <circle cx="7" cy="12.6" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="13" cy="13.6" r="1.1" fill="currentColor" stroke="none" />
  </svg>
);
// Pyramidal neuron: apical dendrite, triangular soma, basal dendrites, axon.
const NeuronIcon: React.FC<IconProps> = (p) => (
  <svg {...svgBase} {...p}>
    <path d="M12 3v8M12 5.5 9 3M12 6.5l3-2.5M12 8.5l-2.5-1.2" />
    <path d="M12 11 9.4 15.5h5.2Z" fill="currentColor" fillOpacity="0.35" />
    <path d="M9.6 15.2 6 17M14.4 15.2 18 17M12 15.5V21M12 21l-1.6 1M12 21l1.6 1" />
  </svg>
);

// Ordered outside-in, the way current crosses the head.
const ROWS: LayerRow[] = [
  { id: 'face', Icon: FaceIcon, label: 'Skin & face', color: '#38BDF8', tooltip: 'Anterior face and neck contour', visibilityKey: 'face', opacityKey: 'face' },
  { id: 'scalp', Icon: GridHeadIcon, label: '10–20 grid', color: '#06B6D4', tooltip: '10–20 calvarium grid and electrode sites', visibilityKey: 'scalp', opacityKey: 'scalp' },
  { id: 'shunt', Icon: Skull, label: 'Skull shunt', color: '#FB7185', tooltip: 'Skull barrier and lateral shunt shell', visibilityKey: 'shunt', opacityKey: 'shunt' },
  {
    id: 'tissue',
    Icon: Brain,
    label: 'Cortex tissue',
    color: '#F9A8A0',
    tooltip: 'Cortical tissue translucency: low to see inside, high for an anatomical specimen',
    opacityKey: 'tissue',
    min: TISSUE_OPACITY_MIN,
    max: TISSUE_OPACITY_MAX
  },
  { id: 'efield', Icon: FieldIcon, label: 'E-field map', color: '#F59E0B', tooltip: 'Cortical E-field tint and isopotential contours', visibilityKey: 'efield', opacityKey: 'efield' },
  { id: 'streamlines', Icon: CurrentIcon, label: 'Current flow', color: '#38BDF8', tooltip: '3D current streamlines with drift-velocity charges', visibilityKey: 'streamlines', opacityKey: 'streamlines' },
  { id: 'neurons', Icon: NeuronIcon, label: 'Neurons', color: '#A855F7', tooltip: 'Cortical neurons flashing at their field-modulated firing rate', visibilityKey: 'pointCloud', opacityKey: 'pointCloud' },
  { id: 'brodmann', Icon: MapIcon, label: 'Brodmann', color: '#10B981', tooltip: 'Brodmann cytoarchitectonic labels', visibilityKey: 'brodmann' }
];

/**
 * Layer drawer for the 3D stage: a compact toggle strip that expands into
 * per-layer visibility checkboxes and opacity sliders.
 */
export const IsometricLayerStack: React.FC<IsometricLayerStackProps> = ({
  visibility,
  onToggle,
  opacity,
  onOpacityChange
}) => {
  const [expanded, setExpanded] = useState(false);

  if (!expanded) {
    return (
      <div className="flex items-center gap-1 rounded-xl border border-slate-800/80 bg-[#0E1524]/90 p-1 shadow-2xl backdrop-blur-md">
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="flex items-center gap-1.5 rounded-lg px-1.5 py-1.5 text-[11px] font-medium text-slate-300 transition hover:bg-slate-800/80"
          title="Open the layer drawer (visibility and opacity)"
          aria-expanded={false}
        >
          <Layers className="h-3.5 w-3.5 text-cyan-400" />
          <span className="hidden min-[1440px]:inline">Layers</span>
          <ChevronUp className="h-3 w-3 text-slate-500" />
        </button>
        <div className="flex items-center gap-0.5 border-l border-slate-800 pl-1">
          {ROWS.filter((row) => row.visibilityKey).map((row) => {
            const active = visibility[row.visibilityKey!];
            return (
              <button
                key={row.id}
                type="button"
                onClick={() => onToggle(row.visibilityKey!)}
                className={`flex items-center gap-1.5 rounded-lg border px-1.5 py-1.5 text-[11px] font-medium transition ${
                  active ? 'border-slate-700 bg-slate-800/80 text-slate-100' : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
                title={`${row.tooltip} (${active ? 'on' : 'off'})`}
                aria-pressed={active}
              >
                <row.Icon className="h-[18px] w-[18px]" style={{ color: active ? row.color : '#64748B' }} />
                <span className="hidden whitespace-nowrap min-[1600px]:inline">{row.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="w-[300px] rounded-xl border border-slate-800/80 bg-[#0E1524]/95 shadow-2xl backdrop-blur-md">
      <button
        type="button"
        onClick={() => setExpanded(false)}
        className="flex w-full items-center justify-between border-b border-slate-800 px-2.5 py-2 text-[11.5px] font-semibold text-slate-200"
        aria-expanded
      >
        <span className="flex items-center gap-1.5">
          <Layers className="h-3.5 w-3.5 text-cyan-400" />
          Layers · scalp to cortex
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
      </button>
      <ul className="space-y-1 p-2">
        {ROWS.map((row) => {
          const visible = row.visibilityKey ? visibility[row.visibilityKey] : true;
          const value = row.opacityKey ? opacity[row.opacityKey] : 1;
          const min = row.min ?? 0;
          const max = row.max ?? 1;
          return (
            <li key={row.id} className="flex items-center gap-2" title={row.tooltip}>
              <label className="flex w-[124px] shrink-0 cursor-pointer items-center gap-1.5 text-[11px] text-slate-300">
                {row.visibilityKey ? (
                  <input
                    type="checkbox"
                    checked={visible}
                    onChange={() => onToggle(row.visibilityKey!)}
                    className="h-3 w-3 accent-cyan-500"
                  />
                ) : (
                  <span className="h-3 w-3" />
                )}
                <row.Icon className="h-4 w-4 shrink-0" style={{ color: row.color }} />
                <span className="truncate">{row.label}</span>
              </label>
              {row.opacityKey ? (
                <>
                  <input
                    type="range"
                    min={min}
                    max={max}
                    step={0.01}
                    value={value}
                    disabled={!visible}
                    onChange={(event) => onOpacityChange(row.opacityKey!, parseFloat(event.target.value))}
                    className="slider min-w-0 flex-1 text-cyan-400 disabled:opacity-30"
                    aria-label={`${row.label} opacity`}
                  />
                  <span className="w-8 shrink-0 text-right font-mono text-[10.5px] text-slate-400">{Math.round(value * 100)}%</span>
                </>
              ) : (
                <span className="flex-1 text-[10.5px] text-slate-600">on / off</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default IsometricLayerStack;
