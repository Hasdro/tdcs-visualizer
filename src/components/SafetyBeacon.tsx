import React from 'react';
import { AlertTriangle, ShieldAlert, ShieldCheck } from 'lucide-react';
import { BiophysicalTelemetry } from '../utils/biophysicsEngine';

interface SafetyBeaconProps {
  telemetry: BiophysicalTelemetry;
}

interface BeaconStyle {
  icon: React.ComponentType<{ className?: string }>;
  shell: string;
  iconShell: string;
  dot: string;
  label: string;
}

const STYLES: Record<BiophysicalTelemetry['safetyIndex'], BeaconStyle> = {
  OPTIMAL: {
    icon: ShieldCheck,
    shell: 'border-emerald-500/40 bg-emerald-950/45 text-emerald-100',
    iconShell: 'bg-emerald-500/15 text-emerald-300',
    dot: 'bg-emerald-400',
    label: 'Within consensus limits'
  },
  MODERATE: {
    icon: ShieldCheck,
    shell: 'border-amber-500/40 bg-amber-950/35 text-amber-100',
    iconShell: 'bg-amber-500/15 text-amber-300',
    dot: 'bg-amber-400',
    label: 'Standard research dose'
  },
  CAUTION: {
    icon: AlertTriangle,
    shell: 'border-orange-500/45 bg-orange-950/35 text-orange-100',
    iconShell: 'bg-orange-500/15 text-orange-300',
    dot: 'bg-orange-400',
    label: 'Caution — monitor skin'
  },
  THRESHOLD_EXCEEDED: {
    icon: ShieldAlert,
    shell: 'border-rose-500/50 bg-rose-950/45 text-rose-100',
    iconShell: 'bg-rose-500/15 text-rose-300',
    dot: 'bg-rose-400',
    label: 'Exceeds 0.25 mA/cm²'
  }
};

/**
 * Global safety beacon. The consensus limit (0.25 mA/cm²) is the anchor for
 * every label, so the status reads the same for clinicians, researchers, and patients.
 */
export const SafetyBeacon: React.FC<SafetyBeaconProps> = ({ telemetry }) => {
  const style = STYLES[telemetry.safetyIndex];
  const Icon = style.icon;
  const j = telemetry.currentDensityMaCm2;
  const margin = j > 0 ? 0.25 / j : Infinity;
  const marginLabel = Number.isFinite(margin) ? `${margin.toFixed(1)}×` : '—';
  const label = style.label;
  const isElevated = telemetry.safetyIndex === 'CAUTION' || telemetry.safetyIndex === 'THRESHOLD_EXCEEDED';

  return (
    <div
      className={`flex min-w-0 items-center gap-2.5 rounded-full border py-1.5 pl-1.5 pr-3.5 shadow-lg ${style.shell}`}
      title={telemetry.safetyMessage}
      role="status"
      aria-live="polite"
    >
      <span className={`relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${style.iconShell}`}>
        <Icon className="h-4 w-4" />
        {!isElevated && (
          <span className={`absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full ${style.dot} ring-2 ring-[#0A101D]`} />
        )}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[14.5px] font-semibold leading-tight">{label}</span>
        <span className="mt-0.5 flex items-center gap-1.5 text-[13px] leading-tight text-slate-400">
          <span className="font-mono font-medium text-slate-300">{marginLabel}</span>
          <span>margin</span>
          <span className="text-slate-600">·</span>
          <span className="font-mono text-slate-300">{j.toFixed(3)}</span>
          <span>mA/cm²</span>
        </span>
      </span>
    </div>
  );
};

export default SafetyBeacon;
