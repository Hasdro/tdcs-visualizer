import { useMemo, useState } from 'react';
import { useUrlMontageState } from './hooks/useUrlMontageState';
import { CLINICAL_PRESETS, ClinicalPreset } from './data/clinical_presets';
import { calculateTelemetry, MultiChannelChannel } from './utils/biophysicsEngine';
import { BrainViewport3D } from './components/BrainViewport3D';
import { ProtocolExportModal } from './components/ProtocolExportModal';
import { MultiChannelMatrixModal } from './components/MultiChannelMatrixModal';
import { SafetyBeacon } from './components/SafetyBeacon';
import { SetupDock } from './components/SetupDock';
import { InspectorDock } from './components/InspectorDock';
import { EvidenceBadge } from './components/ui/EvidenceBadge';
import {
  IsometricLayerStack,
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
  PanelLeftOpen,
  PanelRightOpen,
  Share2,
  Bug
} from 'lucide-react';
import { DisclaimerModal } from './components/DisclaimerModal';
import { BugReportModal } from './components/BugReportModal';

// One unified stage: the E-field map and current flow are on by default so
// the stimulation is visible at first glance; everything else is one click away.
const DEFAULT_VISIBILITY: LayerVisibility = {
  face: false,
  scalp: false,
  shunt: false,
  efield: true,
  streamlines: true,
  pointCloud: false,
  brodmann: false
};

const DEFAULT_OPACITY: LayerOpacity = {
  face: 0.85,
  scalp: 0.7,
  shunt: 0.55,
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

  // Collapsible docks
  const [isLeftDockCollapsed, setIsLeftDockCollapsed] = useState(false);
  const [isRightDockCollapsed, setIsRightDockCollapsed] = useState(false);

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
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[#070B12] font-sans text-slate-100">
      {/* ------------------------------------------------------------------ */}
      {/* Top bar: brand · indication glyph ribbon · global safety beacon     */}
      {/* ------------------------------------------------------------------ */}
      <header className="z-20 flex shrink-0 flex-col border-b border-slate-800 bg-[#0A101D]">
        <div className="flex h-[54px] items-center gap-3 px-4">
          <div className="flex shrink-0 items-center gap-2.5">
            <div className="h-8 w-8 shrink-0 rounded-lg bg-gradient-to-tr from-cyan-600 via-sky-500 to-amber-500 p-[1px] shadow-glow-cyan">
              <div className="flex h-full w-full items-center justify-center rounded-lg bg-[#0A101D]">
                <Brain className="h-4 w-4 text-cyan-400" />
              </div>
            </div>
            <div className="hidden sm:block">
              <h1 className="whitespace-nowrap text-[13px] font-semibold tracking-tight text-white">
                NeuroFlow <span className="text-cyan-400">tDCS</span>
              </h1>
              <p className="text-[10.5px] font-medium uppercase tracking-[0.12em] text-slate-500">
                Clinical stimulation lab
              </p>
            </div>
          </div>

          <div className="flex min-w-0 flex-1 justify-center">
            <PresetGlyphRibbon activePresetId={currentPreset?.id} onSelectPreset={handleSelectPreset} />
          </div>

          <div className="flex shrink-0 items-center justify-end">
            <SafetyBeacon telemetry={telemetry} />
          </div>
        </div>

        {/* Secondary context/action bar */}
        <div className="flex h-10 items-center justify-between gap-3 border-t border-slate-800/60 bg-[#080E19] px-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="hidden text-[10.5px] font-medium uppercase tracking-[0.14em] text-slate-500 sm:inline">
              Session
            </span>
            <span className="truncate text-[12.5px] font-medium text-slate-200" title={protocolTitle}>
              {protocolTitle}
            </span>
            {currentPreset && (
              <span className="hidden shrink-0 sm:flex">
                <EvidenceBadge level={currentPreset.evidenceLevel} />
              </span>
            )}
            <div className="hidden shrink-0 items-center gap-1.5 border-l border-slate-800 pl-2.5 font-mono text-[11px] lg:flex">
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
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium shadow transition ${
                copiedLink
                  ? 'bg-emerald-600 text-white'
                  : 'bg-cyan-600 text-white hover:bg-cyan-500'
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
      {/* Main three-column lab bench                                        */}
      {/* ------------------------------------------------------------------ */}
      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        {isLeftDockCollapsed && (
          <button
            type="button"
            onClick={() => setIsLeftDockCollapsed(false)}
            className="absolute left-0 top-1/2 z-30 flex -translate-y-1/2 flex-col items-center gap-2 rounded-r-lg border border-l-0 border-slate-700 bg-[#0F1623]/95 px-1.5 py-3 text-[11.5px] font-medium text-slate-300 shadow-2xl backdrop-blur-md transition hover:border-cyan-500/60 hover:text-white"
            title="Expand setup panel"
            aria-label="Expand setup panel"
          >
            <PanelLeftOpen className="h-4 w-4 text-cyan-400" />
            <span className="[writing-mode:vertical-rl]">Setup</span>
          </button>
        )}

        {/* Left dock — three clean collapsible sections */}
        <aside
          className={`${
            isLeftDockCollapsed
              ? 'pointer-events-none w-0 overflow-hidden border-r-0 opacity-0'
              : 'w-[320px] border-r border-slate-800 opacity-100'
          } relative z-10 flex shrink-0 flex-col select-none bg-[#0C121E] transition-all duration-300 ease-in-out`}
        >
          <SetupDock
            montageState={montageState}
            updateMontageState={updateMontageState}
            currentPreset={currentPreset}
            telemetry={telemetry}
            surroundNodes={surroundNodes}
            onSelectPreset={handleSelectPreset}
            onSelectNode={handleSelectNode}
            onFlipPolarity={handleFlipPolarity}
            onOpenMatrix={() => setIsMatrixOpen(true)}
            onCollapse={() => setIsLeftDockCollapsed(true)}
          />
        </aside>

        {/* Center 3D stage */}
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
            isLeftDockCollapsed={isLeftDockCollapsed}
            layerOpacity={layerOpacity}
            onTissueOpacityChange={(value) => setOpacity('tissue', value)}
          />

          <div className="pointer-events-auto absolute bottom-4 left-4 z-20">
            <IsometricLayerStack
              visibility={layers}
              onToggle={toggleLayer}
              opacity={layerOpacity}
              onOpacityChange={setOpacity}
            />
          </div>
        </main>

        {isRightDockCollapsed && (
          <button
            type="button"
            onClick={() => setIsRightDockCollapsed(false)}
            className="absolute right-0 top-1/2 z-30 flex -translate-y-1/2 flex-col items-center gap-2 rounded-l-lg border border-r-0 border-slate-700 bg-[#0F1623]/95 px-1.5 py-3 text-[11.5px] font-medium text-slate-300 shadow-2xl backdrop-blur-md transition hover:border-cyan-500/60 hover:text-white"
            title="Expand inspector panel"
            aria-label="Expand inspector panel"
          >
            <PanelRightOpen className="h-4 w-4 text-cyan-400" />
            <span className="[writing-mode:vertical-rl]">Inspector</span>
          </button>
        )}

        {/* Right dock — dynamic inspector */}
        <aside
          className={`${
            isRightDockCollapsed
              ? 'pointer-events-none w-0 overflow-hidden border-l-0 opacity-0'
              : 'w-[380px] border-l border-slate-800 opacity-100'
          } relative z-10 flex shrink-0 flex-col select-none bg-[#0C121E] transition-all duration-300 ease-in-out`}
        >
          <InspectorDock
            telemetry={telemetry}
            montageState={montageState}
            currentPreset={currentPreset}
            surroundNodes={surroundNodes}
            onSelectMontageMode={handleSelectMontageMode}
            onCollapse={() => setIsRightDockCollapsed(true)}
          />
        </aside>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Footer: evidence, shunt summary, and live status                    */}
      {/* ------------------------------------------------------------------ */}
      <footer className="z-20 flex h-8 shrink-0 items-center justify-between gap-4 border-t border-slate-800 bg-[#0A101D] px-4 text-[11px] text-slate-500">
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
    className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[12px] font-medium transition ${
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
