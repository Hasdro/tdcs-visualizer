import { useEffect, useMemo, useState } from 'react';
import { useUrlMontageState } from './hooks/useUrlMontageState';
import { CLINICAL_PRESETS, ClinicalPreset } from './data/clinical_presets';
import { calculateTelemetry, MultiChannelChannel } from './utils/biophysicsEngine';
import { BrainViewport3D } from './components/BrainViewport3D';
import { ProtocolExportModal } from './components/ProtocolExportModal';
import { MultiChannelMatrixModal } from './components/MultiChannelMatrixModal';
import { SafetyBeacon } from './components/SafetyBeacon';
import { SetupDock } from './components/SetupDock';
import { InspectorDock, type InspectorTabId } from './components/InspectorDock';
import { DashboardDock, type DashboardTabId } from './components/DashboardDock';
import { StimulatorDevice } from './components/StimulatorDevice';
import { NeuronalMagnifyingLens } from './components/visuals/NeuronalMagnifyingLens';
import { EvidenceBadge } from './components/ui/EvidenceBadge';
import {
  LayerControlsPanel,
  type LayerOpacity,
  type LayerVisibility
} from './components/visuals/IsometricLayerStack';
import { PresetGlyphRibbon } from './components/visuals/PresetGlyphRibbon';
import {
  BookOpen,
  Brain,
  Check,
  FileText,
  Grid,
  Moon,
  Share2,
  Sun,
  Bug
} from 'lucide-react';
import { DisclaimerModal } from './components/DisclaimerModal';
import { BugReportModal } from './components/BugReportModal';

// Every layer starts on: skin, scalp grid, skull, field, current and neurons.
const DEFAULT_VISIBILITY: LayerVisibility = {
  face: true,
  scalp: true,
  shunt: true,
  efield: true,
  streamlines: true,
  pointCloud: true,
  brodmann: true
};

const DEFAULT_OPACITY: LayerOpacity = {
  face: 0.8,
  scalp: 0.7,
  shunt: 0.12,
  tissue: 0.6,
  efield: 1,
  streamlines: 1,
  pointCloud: 1
};

export function App() {
  const [montageState, updateMontageState] = useUrlMontageState();

  // Layer visibility and opacity
  const [layers, setLayers] = useState<LayerVisibility>(DEFAULT_VISIBILITY);
  const [layerOpacity, setLayerOpacity] = useState<LayerOpacity>(DEFAULT_OPACITY);
  const toggleLayer = (key: keyof LayerVisibility) => setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  const setOpacity = (key: keyof LayerOpacity, value: number) =>
    setLayerOpacity((prev) => ({ ...prev, [key]: value }));

  // One left dashboard: the active tab and whether its panel is unfolded.
  const [activeTab, setActiveTab] = useState<DashboardTabId>('montage');
  const [isDashboardOpen, setIsDashboardOpen] = useState(true);

  // Simulation playback shared by the 3D stage and the neuron view.
  const [simSpeed, setSimSpeed] = useState(1);

  // Theme: dark by default, remembered per browser (applied before paint in index.html).
  const [theme, setTheme] = useState<'dark' | 'light'>(() =>
    document.documentElement.classList.contains('light') ? 'light' : 'dark'
  );
  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light');
    try {
      localStorage.setItem('neuroflow-theme', theme);
    } catch {
      // Storage can be unavailable (private mode); the toggle still works.
    }
  }, [theme]);

  // Active 3D placement tool
  const [activePlacementMode, setActivePlacementMode] = useState<'anode' | 'cathode' | null>(null);

  // Share-link feedback
  const [copiedLink, setCopiedLink] = useState(false);

  // Modals
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isMatrixOpen, setIsMatrixOpen] = useState(false);
  // Educational-use notice: shown on every page load, not remembered.
  const [isDisclaimerOpen, setIsDisclaimerOpen] = useState(true);
  const [isBugReportOpen, setIsBugReportOpen] = useState(false);
  const [activeChannels, setActiveChannels] = useState<MultiChannelChannel[] | undefined>(undefined);

  const currentPreset = useMemo(() => {
    return CLINICAL_PRESETS.find(
      (preset) =>
        preset.anode === montageState.anode &&
        preset.cathode === montageState.cathode &&
        preset.montageType === montageState.mode
    );
  }, [montageState.anode, montageState.cathode, montageState.mode]);

  const surroundNodes = useMemo(() => {
    if (activeChannels && activeChannels.length > 0) {
      return activeChannels.filter((channel) => channel.currentMa < 0).map((channel) => channel.nodeId);
    }
    if (montageState.mode === 'hd4x1') {
      if (currentPreset?.surroundNodes) return currentPreset.surroundNodes;
      return ['Fp1', 'Fz', 'C3', 'F7'];
    }
    return undefined;
  }, [montageState.mode, currentPreset, activeChannels]);

  const telemetry = useMemo(() => {
    return calculateTelemetry({
      anodeId: montageState.anode,
      cathodeId: montageState.cathode,
      currentMa: montageState.ma,
      durationMin: montageState.dur,
      padAreaCm2: montageState.pad,
      montageType: montageState.mode,
      surroundNodeIds: surroundNodes
    });
  }, [montageState, surroundNodes]);

  const handleSelectPreset = (preset: ClinicalPreset) => {
    setActiveChannels(undefined);
    updateMontageState({
      anode: preset.anode,
      cathode: preset.cathode,
      ma: preset.currentMa,
      dur: preset.durationMin,
      pad: preset.padAreaCm2,
      mode: preset.montageType
    });
  };

  const handleApplyMultiChannel = (channels: MultiChannelChannel[]) => {
    setActiveChannels(channels);
    const sortedAnodes = [...channels].filter((channel) => channel.currentMa > 0).sort((a, b) => b.currentMa - a.currentMa);
    const sortedCathodes = [...channels].filter((channel) => channel.currentMa < 0).sort((a, b) => a.currentMa - b.currentMa);

    if (sortedAnodes[0]) {
      updateMontageState({
        anode: sortedAnodes[0].nodeId,
        cathode: sortedCathodes[0]?.nodeId || 'Fp2',
        ma: sortedAnodes[0].currentMa,
        mode: 'hd4x1',
        pad: 3.14
      });
    }
  };

  const handleSelectMontageMode = (mode: 'sponge' | 'hd4x1') => {
    updateMontageState({ mode, pad: mode === 'hd4x1' ? 3.14 : 25 });
  };

  const handleFlipPolarity = () => {
    updateMontageState({
      anode: montageState.cathode,
      cathode: montageState.anode
    });
  };

  const handleSelectNode = (nodeId: string, polarity: 'anode' | 'cathode') => {
    if (polarity === 'anode') {
      if (nodeId === montageState.cathode) handleFlipPolarity();
      else updateMontageState({ anode: nodeId });
    } else if (nodeId === montageState.anode) {
      handleFlipPolarity();
    } else {
      updateMontageState({ cathode: nodeId });
    }
  };

  const handleCopyShareUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2200);
  };

  const protocolTitle = currentPreset?.name ?? `Custom montage · ${montageState.anode} → ${montageState.cathode}`;

  const citation = currentPreset
    ? `${currentPreset.referenceStudy.authors} ${currentPreset.referenceStudy.year} · ${currentPreset.referenceStudy.journal} · PMID ${currentPreset.referenceStudy.pmid}`
    : 'No evidence preset attached to this custom montage.';

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-ink-0 font-sans text-slate-100">
      {/* ------------------------------------------------------------------ */}
      {/* Top bar: brand · indication glyph ribbon · global safety beacon     */}
      {/* ------------------------------------------------------------------ */}
      <header className="z-20 flex shrink-0 flex-col border-b border-slate-800 bg-ink-1">
        <div className="flex h-[54px] items-center gap-3 px-4">
          <div className="flex shrink-0 items-center gap-2.5">
            <div className="h-8 w-8 shrink-0 rounded-lg bg-gradient-to-tr from-cyan-600 via-sky-500 to-amber-500 p-[1px] shadow-glow-cyan">
              <div className="flex h-full w-full items-center justify-center rounded-lg bg-ink-1">
                <Brain className="h-4 w-4 text-cyan-400" />
              </div>
            </div>
            <div className="hidden sm:block">
              <h1 className="whitespace-nowrap text-[15px] font-semibold tracking-tight text-white">
                NeuroFlow <span className="text-cyan-400">tDCS</span>
              </h1>
              <p className="text-[12.5px] font-medium uppercase tracking-[0.12em] text-slate-500">
                Clinical stimulation lab
              </p>
            </div>
          </div>

          <div className="flex min-w-0 flex-1 justify-center">
            <PresetGlyphRibbon activePresetId={currentPreset?.id} onSelectPreset={handleSelectPreset} />
          </div>

          <div className="flex shrink-0 items-center justify-end gap-2">
            <SafetyBeacon telemetry={telemetry} />
            <button
              type="button"
              onClick={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
              className="flex h-9 items-center gap-2 rounded-lg border border-slate-700/80 bg-slate-900/80 px-2.5 text-[13px] font-medium text-slate-300 transition hover:border-cyan-500/50 hover:text-cyan-200"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-300" /> : <Moon className="h-4 w-4 text-indigo-400" />}
              <span className="hidden lg:inline">{theme === 'dark' ? 'Light' : 'Dark'}</span>
            </button>
          </div>
        </div>

        {/* Secondary context/action bar */}
        <div className="flex h-10 items-center justify-between gap-3 border-t border-slate-800/60 bg-ink-1 px-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="hidden text-[12.5px] font-medium uppercase tracking-[0.14em] text-slate-500 sm:inline">
              Session
            </span>
            <span className="truncate text-[14.5px] font-medium text-slate-200" title={protocolTitle}>
              {protocolTitle}
            </span>
            {currentPreset && (
              <span className="hidden shrink-0 sm:flex">
                <EvidenceBadge level={currentPreset.evidenceLevel} />
              </span>
            )}
            <div className="hidden shrink-0 items-center gap-1.5 border-l border-slate-800 pl-2.5 font-mono text-[13px] lg:flex">
              <span className="text-rose-300">{montageState.anode} +</span>
              <span className="text-slate-600">→</span>
              <span className="text-cyan-300">
                {montageState.mode === 'hd4x1' ? 'HD 4×1' : `${montageState.cathode} −`}
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-amber-300">{montageState.ma.toFixed(1)}</span>
              <span className="text-slate-400">mA</span>
              <span className="text-slate-600">·</span>
              <span className="text-cyan-300">{montageState.dur}</span>
              <span className="text-slate-400">min</span>
              <span className="text-slate-600">·</span>
              <span className="text-violet-300">{montageState.pad}</span>
              <span className="text-slate-400">cm²</span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <HeaderAction
              icon={<Grid className="h-3.5 w-3.5 text-amber-400" />}
              label="HD Matrix"
              title="Configure a custom multi-channel HD array"
              onClick={() => setIsMatrixOpen(true)}
              hideLabelBelow="xl"
              active={Boolean(activeChannels && activeChannels.length > 0)}
            />
            <HeaderAction
              icon={<Bug className="h-3.5 w-3.5 text-rose-400" />}
              label="Report bug"
              title="Report a bug (files a GitHub issue)"
              onClick={() => setIsBugReportOpen(true)}
              hideLabelBelow="xl"
            />
            <HeaderAction
              icon={<FileText className="h-3.5 w-3.5 text-emerald-400" />}
              label="Export"
              title="Export the clinical protocol record (print / PDF)"
              onClick={() => setIsExportOpen(true)}
              hideLabelBelow="md"
            />
            <button
              type="button"
              onClick={handleCopyShareUrl}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[14px] font-medium shadow transition ${
                copiedLink
                  ? 'bg-emerald-600 text-[#fff]'
                  : 'bg-cyan-600 text-[#fff] hover:bg-cyan-500'
              }`}
              title="Copy a shareable link to this exact montage"
            >
              {copiedLink ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
              <span>{copiedLink ? 'Copied' : 'Share'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------------------ */}
      {/* One left dashboard · 3D stage                                       */}
      {/* ------------------------------------------------------------------ */}
      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        <DashboardDock
          activeTab={activeTab}
          open={isDashboardOpen}
          onSelectTab={(tab) => {
            setActiveTab(tab);
            setIsDashboardOpen(true);
          }}
          onClose={() => setIsDashboardOpen(false)}
        >
          {(activeTab === 'montage' || activeTab === 'dose') && (
            <SetupDock
              view={activeTab}
              montageState={montageState}
              updateMontageState={updateMontageState}
              currentPreset={currentPreset}
              telemetry={telemetry}
              surroundNodes={surroundNodes}
              onSelectPreset={handleSelectPreset}
              onSelectNode={handleSelectNode}
              onFlipPolarity={handleFlipPolarity}
              onOpenMatrix={() => setIsMatrixOpen(true)}
            />
          )}
          {activeTab === 'device' && (
            <StimulatorDevice
              anodeId={montageState.anode}
              cathodeId={montageState.cathode}
              currentMa={montageState.ma}
              durationMin={montageState.dur}
              padAreaCm2={montageState.pad}
              montageType={montageState.mode}
              onChangeMa={(ma) => updateMontageState({ ma })}
            />
          )}
          {activeTab === 'neuron' && (
            <NeuronalMagnifyingLens
              anodeId={montageState.anode}
              cathodeId={montageState.cathode}
              currentMa={montageState.ma}
              padAreaCm2={montageState.pad}
              montageType={montageState.mode}
              surroundNodes={surroundNodes}
              simSpeed={simSpeed}
            />
          )}
          {INSPECTOR_TABS[activeTab] && (
            <InspectorDock
              tab={INSPECTOR_TABS[activeTab]!}
              telemetry={telemetry}
              montageState={montageState}
              currentPreset={currentPreset}
              surroundNodes={surroundNodes}
              onSelectMontageMode={handleSelectMontageMode}
            />
          )}
          {activeTab === 'layers' && (
            <LayerControlsPanel
              visibility={layers}
              onToggle={toggleLayer}
              opacity={layerOpacity}
              onOpacityChange={setOpacity}
            />
          )}
        </DashboardDock>

        {/* 3D stage */}
        <main className="relative min-w-0 flex-1 overflow-hidden">
          <BrainViewport3D
            anodeId={montageState.anode}
            cathodeId={montageState.cathode}
            currentMa={montageState.ma}
            durationMin={montageState.dur}
            padAreaCm2={montageState.pad}
            montageType={montageState.mode}
            surroundNodes={surroundNodes}
            telemetry={telemetry}
            onSelectNode={handleSelectNode}
            showScalpGrid={layers.scalp}
            showShuntHalo={layers.shunt}
            showHumanFace={layers.face}
            showEField={layers.efield}
            showStreamlines={layers.streamlines}
            showPointCloud={layers.pointCloud}
            showBrodmannLabels={layers.brodmann}
            activePlacementMode={activePlacementMode}
            setActivePlacementMode={setActivePlacementMode}
            layerOpacity={layerOpacity}
            layers={layers}
            onToggleLayer={toggleLayer}
            onOpacityChange={setOpacity}
            simSpeed={simSpeed}
            onSimSpeedChange={setSimSpeed}
            lightStage={theme === 'light'}
          />
        </main>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Footer: evidence, shunt summary, and live status                    */}
      {/* ------------------------------------------------------------------ */}
      <footer className="z-20 flex h-8 shrink-0 items-center justify-between gap-4 border-t border-slate-800 bg-ink-1 px-4 text-[13px] text-slate-500">
        <div className="flex min-w-0 items-center gap-1.5">
          <BookOpen className="h-3 w-3 shrink-0 text-slate-500" />
          {currentPreset ? (
            <a
              href={`https://pubmed.ncbi.nlm.nih.gov/${currentPreset.referenceStudy.pmid}/`}
              target="_blank"
              rel="noreferrer"
              className="truncate transition hover:text-cyan-300"
              title={citation}
            >
              Evidence: {currentPreset.referenceStudy.authors} {currentPreset.referenceStudy.year} ·{' '}
              {currentPreset.referenceStudy.journal} · <span className="font-mono">PMID {currentPreset.referenceStudy.pmid}</span>
            </a>
          ) : (
            <span className="truncate" title={citation}>
              Custom montage · Miranda 2006 FEA shunt model · Bikson 2016 safety consensus
            </span>
          )}
        </div>

        <div className="hidden shrink-0 items-center gap-4 md:flex">
          <span>
            Scalp shunt <span className="font-mono text-slate-300">{telemetry.shuntPercentage.toFixed(1)}%</span>
          </span>
          <span>
            Cortical delivery{' '}
            <span className="font-mono text-emerald-300">{(100 - telemetry.shuntPercentage).toFixed(1)}%</span>
          </span>
          <span>
            Peak E-field <span className="font-mono text-amber-300">{telemetry.peakEFieldVm.toFixed(3)} V/m</span>
          </span>
          <a
            href="https://3d.nih.gov/entries/3DPX-021161"
            target="_blank"
            rel="noreferrer"
            className="hidden transition hover:text-cyan-300 min-[1500px]:inline"
            title="Cortical surface: Detailed Human Brain Model, NIH 3D entry 3DPX-021161, CC BY 4.0"
          >
            Mesh: NIH 3D · CC BY
          </a>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Simulation live
          </span>
        </div>
      </footer>

      {/* Modals */}
      <ProtocolExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        data={{
          montageState,
          telemetry
        }}
      />

      <MultiChannelMatrixModal
        isOpen={isMatrixOpen}
        onClose={() => setIsMatrixOpen(false)}
        initialChannels={activeChannels}
        onApplyChannels={handleApplyMultiChannel}
      />

      <BugReportModal isOpen={isBugReportOpen} onClose={() => setIsBugReportOpen(false)} />
      <DisclaimerModal isOpen={isDisclaimerOpen} onAccept={() => setIsDisclaimerOpen(false)} />
    </div>
  );
}

// Dashboard tabs served by the inspector, mapped to its content ids.
const INSPECTOR_TABS: Partial<Record<DashboardTabId, InspectorTabId>> = {
  field: 'biophysics',
  eeg: 'eeg',
  cells: 'cellular',
  outcomes: 'outcomes'
};

const HeaderAction: React.FC<{
  icon: React.ReactNode;
  label: string;
  title: string;
  onClick: () => void;
  hideLabelBelow?: 'md' | 'xl';
  active?: boolean;
}> = ({ icon, label, title, onClick, hideLabelBelow = 'xl', active = false }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[14px] font-medium transition ${
      active
        ? 'border-amber-500/50 bg-amber-500/10 text-amber-200'
        : 'border-slate-700/80 bg-slate-900/80 text-slate-300 hover:border-cyan-500/50 hover:text-cyan-200'
    }`}
  >
    {icon}
    <span className={hideLabelBelow === 'md' ? 'hidden md:inline' : 'hidden xl:inline'}>{label}</span>
  </button>
);

export default App;
