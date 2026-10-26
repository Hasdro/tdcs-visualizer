import React from 'react';
import {
  Activity,
  Cable,
  ClipboardList,
  FlaskConical,
  Gauge,
  Layers,
  MapPin,
  Microscope,
  PanelLeftClose,
  Waves
} from 'lucide-react';

export type DashboardTabId =
  | 'montage'
  | 'dose'
  | 'device'
  | 'neuron'
  | 'field'
  | 'eeg'
  | 'cells'
  | 'outcomes'
  | 'layers';

export const DASHBOARD_TABS: Array<{
  id: DashboardTabId;
  label: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: string;
}> = [
  { id: 'montage', label: 'Montage', title: 'Montage', subtitle: 'Indication, preset and electrode sites', icon: MapPin, tone: 'text-rose-300' },
  { id: 'dose', label: 'Dose', title: 'Dose', subtitle: 'Current × time = delivered charge', icon: Gauge, tone: 'text-amber-300' },
  { id: 'device', label: 'Device', title: 'Stimulator', subtitle: 'The device generating the current', icon: Cable, tone: 'text-teal-300' },
  { id: 'neuron', label: 'Neuron', title: 'Neuron view', subtitle: 'One cortical neuron under the pad', icon: Microscope, tone: 'text-emerald-300' },
  { id: 'field', label: 'Field', title: 'Field & safety', subtitle: 'What reaches the cortex, and how safely', icon: Activity, tone: 'text-cyan-300' },
  { id: 'eeg', label: 'EEG', title: 'Brain waves', subtitle: 'Expected EEG band changes', icon: Waves, tone: 'text-sky-300' },
  { id: 'cells', label: 'Cells', title: 'Cellular mechanism', subtitle: 'From membrane shift to plasticity', icon: FlaskConical, tone: 'text-violet-300' },
  { id: 'outcomes', label: 'Outcomes', title: 'Outcomes', subtitle: 'What the person may notice', icon: ClipboardList, tone: 'text-orange-300' },
  { id: 'layers', label: 'Layers', title: 'Layers', subtitle: 'What the 3D view shows', icon: Layers, tone: 'text-cyan-300' }
];

interface DashboardDockProps {
  activeTab: DashboardTabId;
  open: boolean;
  onSelectTab: (tab: DashboardTabId) => void;
  onClose: () => void;
  children: React.ReactNode;
}

/**
 * The single left dashboard: a labelled icon rail and one wide panel.
 * Clicking the open tab again folds the panel away to give the 3D view room.
 */
export const DashboardDock: React.FC<DashboardDockProps> = ({ activeTab, open, onSelectTab, onClose, children }) => {
  const tab = DASHBOARD_TABS.find((t) => t.id === activeTab) ?? DASHBOARD_TABS[0];
  const TabIcon = tab.icon;

  return (
    <div className="relative z-10 flex h-full shrink-0 select-none">
      <nav
        className="custom-scrollbar flex w-[84px] shrink-0 flex-col gap-1 overflow-y-auto border-r border-slate-800 bg-ink-1 px-1.5 py-2"
        role="tablist"
        aria-label="Dashboard"
        aria-orientation="vertical"
      >
        {DASHBOARD_TABS.map(({ id, label, icon: Icon, tone }) => {
          const selected = open && id === activeTab;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => (selected ? onClose() : onSelectTab(id))}
              title={selected ? `Fold the ${label} panel` : label}
              className={`relative flex flex-col items-center gap-1 rounded-xl px-1 py-2.5 text-[12px] font-medium transition ${
                selected
                  ? 'bg-slate-800/80 text-slate-50'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'
              }`}
            >
              {selected && <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r bg-cyan-400" />}
              <Icon className={`h-[22px] w-[22px] ${selected ? tone : ''}`} />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>

      <aside
        className={`flex flex-col overflow-hidden border-r border-slate-800 bg-ink-2 transition-[width,opacity] duration-300 ease-in-out ${
          open ? 'w-[480px] opacity-100' : 'pointer-events-none w-0 border-r-0 opacity-0'
        }`}
        aria-hidden={!open}
      >
        <div className="flex w-[480px] shrink-0 items-center justify-between gap-3 border-b border-slate-800 bg-ink-1 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-700 bg-slate-900">
              <TabIcon className={`h-5 w-5 ${tab.tone}`} />
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-[17px] font-semibold tracking-tight text-slate-50">{tab.title}</h2>
              <p className="truncate text-[13px] text-slate-400">{tab.subtitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-slate-50"
            title="Fold the dashboard to see the full 3D view"
            aria-label="Fold the dashboard"
          >
            <PanelLeftClose className="h-5 w-5" />
          </button>
        </div>
        <div className="flex min-h-0 w-[480px] flex-1 flex-col" role="tabpanel">
          {children}
        </div>
      </aside>
    </div>
  );
};

export default DashboardDock;
