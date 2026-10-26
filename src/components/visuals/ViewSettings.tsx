import React, { useEffect, useRef, useState } from 'react';
import { Brain, ChevronUp, FastForward, Pause, Play, RotateCcw, Settings2, UserRound } from 'lucide-react';
import {
  LAYER_ROWS,
  TISSUE_OPACITY_MAX,
  TISSUE_OPACITY_MIN,
  type LayerOpacity,
  type LayerVisibility
} from './IsometricLayerStack';

interface ViewSettingsProps {
  visibility: LayerVisibility;
  onToggle: (key: keyof LayerVisibility) => void;
  opacity: LayerOpacity;
  onOpacityChange: (key: keyof LayerOpacity, value: number) => void;
  simSpeed: number;
  onSimSpeedChange: (speed: number) => void;
  onResetClock: () => void;
  fpsRef: React.RefObject<HTMLSpanElement>;
}

const SPEEDS = [
  { value: 0, label: 'Pause', icon: Pause },
  { value: 1, label: '1×', icon: Play },
  { value: 2, label: '2×', icon: FastForward }
];

/**
 * View settings for the 3D stage: skin and brain transparency, which layers
 * are drawn, and the simulation clock. Folds down to a single button.
 */
export const ViewSettings: React.FC<ViewSettingsProps> = ({
  visibility,
  onToggle,
  opacity,
  onOpacityChange,
  simSpeed,
  onSimSpeedChange,
  onResetClock,
  fpsRef
}) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false);
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="flex flex-col items-end gap-2">
      {open && (
        <div
          className="w-[380px] max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-700/80 bg-ink-3/95 p-4 shadow-2xl backdrop-blur-md"
          role="dialog"
          aria-label="View settings"
        >
          <h3 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-slate-400">Transparency</h3>
          <div className="mt-2 space-y-3">
            <OpacitySlider
              icon={<UserRound className="h-4 w-4 text-[#F4B8A0]" />}
              label="Skin"
              value={opacity.face}
              min={0}
              max={1}
              disabled={!visibility.face}
              onChange={(value) => onOpacityChange('face', value)}
            />
            <OpacitySlider
              icon={<Brain className="h-4 w-4 text-rose-300" />}
              label="Brain"
              value={opacity.tissue}
              min={TISSUE_OPACITY_MIN}
              max={TISSUE_OPACITY_MAX}
              onChange={(value) => onOpacityChange('tissue', value)}
            />
          </div>

          <h3 className="mt-4 text-[13px] font-semibold uppercase tracking-[0.12em] text-slate-400">Layers</h3>
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            {LAYER_ROWS.filter((row) => row.visibilityKey).map((row) => {
              const on = visibility[row.visibilityKey!];
              return (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => onToggle(row.visibilityKey!)}
                  aria-pressed={on}
                  title={row.tooltip}
                  className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-[13.5px] font-medium transition ${
                    on
                      ? 'border-slate-600 bg-slate-800/80 text-slate-100'
                      : 'border-slate-800 bg-transparent text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <row.Icon className="h-[18px] w-[18px] shrink-0" style={{ color: on ? row.color : '#64748B' }} />
                  <span className="truncate">{row.label}</span>
                  <span className={`ml-auto h-2 w-2 shrink-0 rounded-full ${on ? 'bg-cyan-400' : 'bg-slate-700'}`} />
                </button>
              );
            })}
          </div>

          <h3 className="mt-4 text-[13px] font-semibold uppercase tracking-[0.12em] text-slate-400">Simulation</h3>
          <div className="mt-2 flex items-center gap-1.5">
            {SPEEDS.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => onSimSpeedChange(value)}
                aria-pressed={simSpeed === value}
                title={value === 0 ? 'Pause the simulation' : `Play at ${label}`}
                className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[13px] font-medium transition ${
                  simSpeed === value
                    ? 'border-cyan-500/40 bg-cyan-500/15 text-cyan-200'
                    : 'border-slate-800 text-slate-400 hover:text-slate-100'
                }`}
              >
                <Icon className="h-4 w-4" />
                {value > 0 && <span className="font-mono">{label}</span>}
              </button>
            ))}
            <button
              type="button"
              onClick={onResetClock}
              title="Reset the session clock"
              aria-label="Reset the session clock"
              className="rounded-lg border border-slate-800 px-2.5 py-1.5 text-slate-400 transition hover:text-slate-100"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <span ref={fpsRef} className="ml-auto whitespace-nowrap font-mono text-[12.5px] text-slate-500" title="Measured frame rate">
              — FPS
            </span>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`flex items-center gap-2 rounded-full border px-4 py-2 text-[14px] font-medium shadow-2xl backdrop-blur-md transition ${
          open
            ? 'border-cyan-500/50 bg-ink-3/95 text-cyan-200'
            : 'border-slate-700/80 bg-ink-3/90 text-slate-200 hover:border-cyan-500/50 hover:text-cyan-200'
        }`}
        title="Layers, transparency and playback"
      >
        <Settings2 className="h-4 w-4 text-cyan-400" />
        Settings
        <ChevronUp className={`h-4 w-4 text-slate-500 transition-transform ${open ? '' : 'rotate-180'}`} />
      </button>
    </div>
  );
};

const OpacitySlider: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: number;
  min: number;
  max: number;
  disabled?: boolean;
  onChange: (value: number) => void;
}> = ({ icon, label, value, min, max, disabled, onChange }) => (
  <label className={`flex items-center gap-3 ${disabled ? 'opacity-40' : ''}`}>
    <span className="flex w-16 shrink-0 items-center gap-2 text-[14px] text-slate-200">
      {icon}
      {label}
    </span>
    <span className="text-[12px] text-slate-500">clear</span>
    <input
      type="range"
      min={min}
      max={max}
      step={0.01}
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(parseFloat(event.target.value))}
      className="slider min-w-0 flex-1 text-cyan-400"
      aria-label={`${label} opacity`}
    />
    <span className="text-[12px] text-slate-500">solid</span>
    <span className="w-10 shrink-0 text-right font-mono text-[12.5px] text-slate-400">
      {Math.round(((value - min) / (max - min)) * 100)}%
    </span>
  </label>
);

export default ViewSettings;
