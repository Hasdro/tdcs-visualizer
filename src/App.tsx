import { useState, useMemo, useEffect } from 'react';
import { useUrlMontageState } from './hooks/useUrlMontageState';
import { CLINICAL_PRESETS, ClinicalPreset } from './data/clinical_presets';
import { calculateTelemetry, MultiChannelChannel } from './utils/biophysicsEngine';
import { BrainViewport3D } from './components/BrainViewport3D';
import { EegWaveVisualizer } from './components/EegWaveVisualizer';
import { HumanImpactSimulators } from './components/HumanImpactSimulators';
import { CellularMechanismWidget } from './components/CellularMechanismWidget';
import { AudioSonificationModal } from './components/AudioSonificationModal';
import { ProtocolExportModal } from './components/ProtocolExportModal';
import { MultiChannelMatrixModal } from './components/MultiChannelMatrixModal';
import { VisualPresetRibbon } from './components/visuals/VisualPresetRibbon';
import { ActiveCircuitLiveWire } from './components/visuals/ActiveCircuitLiveWire';
import { IsometricLayerStack } from './components/visuals/IsometricLayerStack';
import { ScalpTopomap1020 } from './components/visuals/ScalpTopomap1020';
import { LobeFunctionalSilhouette } from './components/visuals/LobeFunctionalSilhouette';
import { MontageFocalityGraphic } from './components/visuals/MontageFocalityGraphic';
import { BiksonSafetyGauge } from './components/visuals/BiksonSafetyGauge';
import { CurrentPenetrationWaterfall } from './components/visuals/CurrentPenetrationWaterfall';
import { ChargeDoseReservoir } from './components/visuals/ChargeDoseReservoir';
import { SensationMatrixGlyphs } from './components/visuals/SensationMatrixGlyphs';
import {
  Brain,
  Zap,
  ArrowLeftRight,
  Share2,
  Check,
  Waves,
  Activity,
  Volume2,
  FileText,
  Grid,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen
} from 'lucide-react';

export function App() {
  const [montageState, updateMontageState] = useUrlMontageState();

  // Active Right Dock Tab: 'eeg' | 'impact' | 'cellular'
  const [rightTab, setRightTab] = useState<'eeg' | 'impact' | 'cellular'>('eeg');

  // Layer Visibility Toggles
  const [showScalpGrid, setShowScalpGrid] = useState(true);
  const [showShuntHalo, setShowShuntHalo] = useState(false);
  const [showHumanFace, setShowHumanFace] = useState(true);
  const [showEField, setShowEField] = useState(true);
  const [showStreamlines, setShowStreamlines] = useState(true);
  const [showPointCloud, setShowPointCloud] = useState(false);
  const [showBrodmannLabels, setShowBrodmannLabels] = useState(false);

  // Collapsible Docks (Video Feedback #9 & #10)
  const [isLeftDockCollapsed, setIsLeftDockCollapsed] = useState(false);
  const [isRightDockCollapsed, setIsRightDockCollapsed] = useState(false);

  // Track viewport width for responsive mobile elements (BUG-11)
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 1280);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1280);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Active 3D placement tool: null | 'anode' | 'cathode'
  const [activePlacementMode, setActivePlacementMode] = useState<'anode' | 'cathode' | null>(null);

  // Share link copied toast state
  const [copiedLink, setCopiedLink] = useState(false);

  // Advanced Feature Modals State
  const [isAudioOpen, setIsAudioOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isMatrixOpen, setIsMatrixOpen] = useState(false);
  const [activeChannels, setActiveChannels] = useState<MultiChannelChannel[] | undefined>(undefined);

  // HD-tDCS surround cathodes configuration
  const currentPreset = useMemo(() => {
    return CLINICAL_PRESETS.find(
      (p) => p.anode === montageState.anode && p.cathode === montageState.cathode
    );
  }, [montageState.anode, montageState.cathode]);

  const surroundNodes = useMemo(() => {
    if (activeChannels && activeChannels.length > 0) {
      return activeChannels.filter((c) => c.currentMa < 0).map((c) => c.nodeId);
    }
    if (montageState.mode === 'hd4x1') {
      if (currentPreset?.surroundNodes) return currentPreset.surroundNodes;
      return ['Fp1', 'Fz', 'C3', 'F7'];
    }
    return undefined;
  }, [montageState.mode, currentPreset, activeChannels]);

  // Real-Time Biophysical Telemetry Engine Calculation
  const telemetry = useMemo(() => {
    return calculateTelemetry({
      anodeId: montageState.anode,
      cathodeId: montageState.cathode,
      currentMa: montageState.ma,
      durationMin: montageState.dur,
      padAreaCm2: montageState.pad,
      montageType: montageState.mode,
      surroundNodeIds: surroundNodes,
    });
  }, [montageState, surroundNodes]);

  // Handle Preset Selection
  const handleSelectPreset = (preset: ClinicalPreset) => {
    setActiveChannels(undefined);
    updateMontageState({
      anode: preset.anode,
      cathode: preset.cathode,
      ma: preset.currentMa,
      dur: preset.durationMin,
      pad: preset.padAreaCm2,
      mode: preset.montageType,
    });
  };

  // Handle Multi-Channel HD Array Application
  const handleApplyMultiChannel = (channels: MultiChannelChannel[]) => {
    setActiveChannels(channels);
    const sortedAnodes = [...channels].filter((c) => c.currentMa > 0).sort((a, b) => b.currentMa - a.currentMa);
    const sortedCathodes = [...channels].filter((c) => c.currentMa < 0).sort((a, b) => a.currentMa - b.currentMa);

    if (sortedAnodes[0]) {
      const primaryAnode = sortedAnodes[0].nodeId;
      const primaryCathode = sortedCathodes[0]?.nodeId || 'Fp2';
      updateMontageState({
        anode: primaryAnode,
        cathode: primaryCathode,
        ma: sortedAnodes[0].currentMa,
        mode: 'hd4x1',
        pad: 3.14,
      });
    }
  };

  // Flip Polarity (Swap Anode and Cathode)
  const handleFlipPolarity = () => {
    updateMontageState({
      anode: montageState.cathode,
      cathode: montageState.anode,
    });
  };

  // Handle 3D node selection
  const handleSelectNode = (nodeId: string, polarity: 'anode' | 'cathode') => {
    if (polarity === 'anode') {
      if (nodeId === montageState.cathode) {
        // Swap if clicked cathode
        handleFlipPolarity();
      } else {
        updateMontageState({ anode: nodeId });
      }
    } else {
      if (nodeId === montageState.anode) {
        handleFlipPolarity();
      } else {
        updateMontageState({ cathode: nodeId });
      }
    }
  };

  // Copy shareable URL
  const handleCopyShareUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2200);
  };

  return (
    <div className="flex flex-col w-screen h-screen bg-[#070B12] text-slate-100 overflow-hidden font-sans">
      {/* TOP BAR: Header, 8 Clinical Presets, URL Share, Layer Pills */}
      <header className="h-14 bg-[#0A101D] border-b border-slate-800 flex items-center justify-between px-4 z-20 shrink-0">
        {/* Brand & Mode Title (Clean, vertically centered, non-overlapping - Video Feedback #6) */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-cyan-600 via-sky-500 to-amber-500 p-[1px] shadow-glow-cyan shrink-0">
            <div className="w-full h-full bg-[#0A101D] rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <h1 className="font-mono text-sm font-bold tracking-tight text-white whitespace-nowrap">
              NEUROFLOW <span className="text-cyan-400 font-extrabold">tDCS</span>
            </h1>
            <span className="text-[10px] font-mono font-bold bg-cyan-950/90 text-cyan-300 border border-cyan-700/80 px-2 py-0.5 rounded shadow-sm">
              CLINICAL 3D
            </span>
          </div>
        </div>

        {/* Visual Clinical Preset Ribbons (Miniature Anatomical Badges) */}
        <div className="hidden xl:flex items-center gap-1.5 overflow-x-auto py-1 max-w-xl">
          <VisualPresetRibbon
            activeAnode={montageState.anode}
            activeCathode={montageState.cathode}
            activeMode={montageState.mode}
            onSelectPreset={handleSelectPreset}
          />
        </div>

        {/* Center Live Active Circuit Wire Pulse */}
        <ActiveCircuitLiveWire
          anodeId={montageState.anode}
          cathodeId={montageState.cathode}
          currentMa={montageState.ma}
          durationMin={montageState.dur}
          mode={montageState.mode}
        />

        {/* Right Header Utilities: Isometric Layer Depth Stack & Actions */}
        <div className="flex items-center gap-2">
          {/* Isometric Layer Visualizer Stack (CAD/Photoshop Style) */}
          <IsometricLayerStack
            showHumanFace={showHumanFace}
            setShowHumanFace={setShowHumanFace}
            showScalpGrid={showScalpGrid}
            setShowScalpGrid={setShowScalpGrid}
            showShuntHalo={showShuntHalo}
            setShowShuntHalo={setShowShuntHalo}
            showEField={showEField}
            setShowEField={setShowEField}
            showStreamlines={showStreamlines}
            setShowStreamlines={setShowStreamlines}
            showPointCloud={showPointCloud}
            setShowPointCloud={setShowPointCloud}
            showBrodmannLabels={showBrodmannLabels}
            setShowBrodmannLabels={setShowBrodmannLabels}
          />

          {/* Audio Sonification Button */}
          <button
            onClick={() => setIsAudioOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border border-slate-700 hover:border-cyan-500/50 rounded-lg text-xs font-mono transition"
            title="Open Web Audio EEG Brain Wave Sonification (ASSR)"
          >
            <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden xl:inline">Audio ASSR</span>
          </button>

          {/* Multi-Channel Array Matrix Button */}
          <button
            onClick={() => setIsMatrixOpen(true)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono transition border ${
              activeChannels && activeChannels.length > 0
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/70 font-bold'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-amber-300 border-slate-700 hover:border-amber-500/50'
            }`}
            title="Configure Custom Multi-Channel Array Matrix (HD-tDCS)"
          >
            <Grid className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden xl:inline">HD Matrix</span>
          </button>

          {/* Export Protocol Report Button */}
          <button
            onClick={() => setIsExportOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-emerald-300 border border-slate-700 hover:border-emerald-500/50 rounded-lg text-xs font-mono transition"
            title="Export Clinical Protocol Record (Print/PDF)"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden xl:inline">Export Protocol</span>
          </button>

          {/* Polarity Flip Button */}
          <button
            onClick={handleFlipPolarity}
            className="flex items-center gap-1 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-lg text-xs font-mono transition"
            title="Invert Montage Polarity (Swap Anode and Cathode)"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Flip Polarity</span>
          </button>

          {/* Share URL Button */}
          <button
            onClick={handleCopyShareUrl}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono transition shadow ${
              copiedLink
                ? 'bg-emerald-600 text-white'
                : 'bg-cyan-600 hover:bg-cyan-500 text-white'
            }`}
            title="Copy shareable link with current montage configuration"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Copied!' : 'Share'}</span>
          </button>
        </div>
      </header>

      {/* MAIN VIEWPORT LAYOUT: Left Dock (280px) | Center Stage 3D | Right Dock (380px) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Dock Floating Expand Button (Video Feedback #9 & #10) */}
        {isLeftDockCollapsed && (
          <button
            onClick={() => setIsLeftDockCollapsed(false)}
            className="absolute top-4 left-4 z-20 flex items-center gap-1.5 bg-[#0F1623]/95 backdrop-blur-md border border-slate-700 hover:border-cyan-500 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg shadow-2xl text-xs font-mono transition-all group cursor-pointer"
            title="Expand Controls & Dosimetry Panel"
          >
            <PanelLeftOpen className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition" />
            <span>⚙️ Montage & Controls</span>
          </button>
        )}

        {/* LEFT DOCK (300px): Montage Selector, Dosimetry, Safety Telemetry (Collapsible) */}
        <aside
          className={`${
            isLeftDockCollapsed ? 'w-0 border-r-0 overflow-hidden opacity-0 pointer-events-none' : 'w-[300px] border-r overflow-y-auto opacity-100'
          } bg-[#0F1623] border-slate-800 flex flex-col shrink-0 custom-scrollbar z-10 select-none transition-all duration-300 ease-in-out relative`}
        >
          {/* Header Row with Collapse Button */}
          <div className="p-3 border-b border-slate-800/80 bg-[#0E1524] flex items-center justify-between shrink-0">
            <span className="text-[11px] font-mono font-bold text-slate-200 flex items-center gap-1.5">
              <span>⚙️</span> TELEMETRY & MONTAGE
            </span>
            <button
              onClick={() => setIsLeftDockCollapsed(true)}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Collapse Panel to see full 3D brain"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>

          {/* Preset Selector Dropdown (mobile/tablet fallback) */}
          {isMobile && (
            <div className="p-3 border-b border-slate-800/80 shrink-0">
              <label htmlFor="mobile-preset-select" className="text-[11px] font-mono font-semibold text-slate-400 block mb-1">
                CLINICAL MONTAGE PRESET
              </label>
              <select
                id="mobile-preset-select"
                value={currentPreset?.id || ''}
                onChange={(e) => {
                  const p = CLINICAL_PRESETS.find((cp) => cp.id === e.target.value);
                  if (p) handleSelectPreset(p);
                }}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg p-2 font-mono"
              >
                <option value="">Custom Montage</option>
                {CLINICAL_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 1. Interactive 2D Scalp Topomap / Electrode Compass */}
          <div className="p-3 border-b border-slate-800/80 space-y-3 shrink-0">
            <ScalpTopomap1020
              anodeId={montageState.anode}
              cathodeId={montageState.cathode}
              montageType={montageState.mode}
              surroundNodes={surroundNodes}
              onSelectNode={handleSelectNode}
              onFlipPolarity={handleFlipPolarity}
            />

            {/* Anatomical Lobe & Cytoarchitectonic Silhouette */}
            <LobeFunctionalSilhouette
              anodeId={montageState.anode}
              cathodeId={montageState.cathode}
            />

            {/* Montage Focality Comparison Graphic (Sponge vs HD Ring) */}
            <MontageFocalityGraphic
              mode={montageState.mode}
              onSelectMode={(mode) => updateMontageState({ mode, pad: mode === 'hd4x1' ? 3.14 : 25 })}
            />
          </div>

          {/* 2. Dosimetry Sliders */}
          <div className="p-3 border-b border-slate-800/80 space-y-3.5 shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold text-slate-200 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                DOSIMETRY CONTROLS
              </span>
              <span className="text-[10px] font-mono text-slate-400">BIKSON 2016</span>
            </div>

            {/* Current Intensity Slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-300 flex items-center gap-1">
                  <span>⚡</span> Current (I)
                </span>
                <span className="text-amber-300 font-bold bg-amber-950/60 border border-amber-800/50 px-1.5 py-0.5 rounded">
                  {montageState.ma.toFixed(1)} mA
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.5"
                step="0.1"
                value={montageState.ma}
                onChange={(e) => updateMontageState({ ma: parseFloat(e.target.value) })}
                className="w-full accent-amber-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
              <div className="flex justify-between text-[9px] font-mono text-slate-500">
                <span>0.5 mA</span>
                <span>1.0 mA</span>
                <span>2.0 mA</span>
                <span>2.5 mA</span>
              </div>
            </div>

            {/* Duration Slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-300 flex items-center gap-1">
                  <span>⏱️</span> Duration (t)
                </span>
                <span className="text-cyan-300 font-bold bg-cyan-950/60 border border-cyan-800/50 px-1.5 py-0.5 rounded">
                  {montageState.dur} min
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="30"
                step="1"
                value={montageState.dur}
                onChange={(e) => updateMontageState({ dur: parseInt(e.target.value, 10) })}
                className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
              <div className="flex justify-between text-[9px] font-mono text-slate-500">
                <span>5 min</span>
                <span>15 min</span>
                <span>20 min</span>
                <span>30 min</span>
              </div>
            </div>

            {/* Pad Area Slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-300 flex items-center gap-1">
                  <span>🔲</span> Pad Area (A)
                </span>
                <span className="text-purple-300 font-bold bg-purple-950/60 border border-purple-800/50 px-1.5 py-0.5 rounded">
                  {montageState.pad} cm²
                </span>
              </div>
              {montageState.mode === 'hd4x1' ? (
                <div className="flex items-center justify-between px-2.5 py-1.5 bg-slate-900/90 rounded border border-purple-900/40 text-xs font-mono text-purple-300">
                  <span>3.14 cm² (Focal HD 4×1 Ring)</span>
                  <span className="text-[10px] text-slate-400">Fixed</span>
                </div>
              ) : (
                <input
                  type="range"
                  min="10"
                  max="35"
                  step="1"
                  value={montageState.pad}
                  onChange={(e) => updateMontageState({ pad: parseInt(e.target.value, 10) })}
                  className="w-full accent-purple-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              )}
            </div>
          </div>

          {/* 3. Live Biophysical Visual Telemetry Suite */}
          <div className="p-3 space-y-3 flex-1 shrink-0">
            {/* Bikson Aviation Safety Arc Gauge */}
            <BiksonSafetyGauge telemetry={telemetry} />

            {/* Tissue Shunt & Current Penetration Waterfall */}
            <CurrentPenetrationWaterfall
              telemetry={telemetry}
              montageType={montageState.mode}
              currentMa={montageState.ma}
            />

            {/* Total Charge Dose Reservoir (Battery Cylinder) */}
            <ChargeDoseReservoir
              telemetry={telemetry}
              currentMa={montageState.ma}
              durationMin={montageState.dur}
            />

            {/* Human Sensation Matrix Glyphs */}
            <SensationMatrixGlyphs
              telemetry={telemetry}
              anodeId={montageState.anode}
              cathodeId={montageState.cathode}
              currentMa={montageState.ma}
              durationMin={montageState.dur}
            />
          </div>
        </aside>

        {/* CENTER STAGE: 3D WebGL Viewport */}
        <main className="flex-1 relative h-full">
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
            showScalpGrid={showScalpGrid}
            showShuntHalo={showShuntHalo}
            showHumanFace={showHumanFace}
            showEField={showEField}
            showStreamlines={showStreamlines}
            showPointCloud={showPointCloud}
            showBrodmannLabels={showBrodmannLabels}
            activePlacementMode={activePlacementMode}
            setActivePlacementMode={setActivePlacementMode}
            isLeftDockCollapsed={isLeftDockCollapsed}
          />
        </main>

        {/* Right Dock Floating Expand Button (Video Feedback #9 & #10) */}
        {isRightDockCollapsed && (
          <button
            onClick={() => setIsRightDockCollapsed(false)}
            className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-[#0F1623]/95 backdrop-blur-md border border-slate-700 hover:border-cyan-500 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg shadow-2xl text-xs font-mono transition-all group cursor-pointer"
            title="Expand Inspector & Impact Panel"
          >
            <span>📊 Inspector & Impact</span>
            <PanelRightOpen className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition" />
          </button>
        )}

        {/* RIGHT DOCK (380px): 3 Tabbed Inspector Panels (Collapsible) */}
        <aside
          className={`${
            isRightDockCollapsed ? 'w-0 border-l-0 overflow-hidden opacity-0 pointer-events-none' : 'w-[380px] border-l opacity-100'
          } bg-[#0F1623] border-slate-800 flex flex-col shrink-0 overflow-hidden z-10 select-none transition-all duration-300 ease-in-out relative`}
        >
          {/* Tab Selector Header */}
          <div className="flex items-center border-b border-slate-800 bg-[#0E1524] shrink-0">
            <button
              onClick={() => setRightTab('eeg')}
              className={`flex-1 py-2.5 px-2 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition border-b-2 ${
                rightTab === 'eeg'
                  ? 'text-cyan-400 border-cyan-400 bg-slate-900/60'
                  : 'text-slate-400 border-transparent hover:text-slate-200'
              }`}
            >
              <Waves className="w-3.5 h-3.5" />
              <span>EEG Waves</span>
            </button>

            <button
              onClick={() => setRightTab('impact')}
              className={`flex-1 py-2.5 px-2 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition border-b-2 ${
                rightTab === 'impact'
                  ? 'text-emerald-400 border-emerald-400 bg-slate-900/60'
                  : 'text-slate-400 border-transparent hover:text-slate-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Human Impact</span>
            </button>

            <button
              onClick={() => setRightTab('cellular')}
              className={`flex-1 py-2.5 px-2 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition border-b-2 ${
                rightTab === 'cellular'
                  ? 'text-amber-400 border-amber-400 bg-slate-900/60'
                  : 'text-slate-400 border-transparent hover:text-slate-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Cellular Vm</span>
            </button>

            {/* Collapse Right Dock Button */}
            <button
              onClick={() => setIsRightDockCollapsed(true)}
              className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-800 transition border-l border-slate-800/80 cursor-pointer"
              title="Collapse Inspector Panel to see full 3D brain"
            >
              <PanelRightClose className="w-4 h-4" />
            </button>
          </div>

          {/* Active Tab Panel Body */}
          <div className="flex-1 overflow-hidden p-2">
            {rightTab === 'eeg' && (
              <EegWaveVisualizer
                anodeId={montageState.anode}
                cathodeId={montageState.cathode}
                currentMa={montageState.ma}
                telemetry={telemetry}
              />
            )}

            {rightTab === 'impact' && (
              <HumanImpactSimulators
                anodeId={montageState.anode}
                cathodeId={montageState.cathode}
                currentMa={montageState.ma}
                telemetry={telemetry}
              />
            )}

            {rightTab === 'cellular' && (
              <CellularMechanismWidget
                anodeId={montageState.anode}
                cathodeId={montageState.cathode}
                currentMa={montageState.ma}
                telemetry={telemetry}
              />
            )}
          </div>
        </aside>
      </div>

      {/* Advanced Feature Modals */}
      <AudioSonificationModal
        isOpen={isAudioOpen}
        onClose={() => setIsAudioOpen(false)}
        activeBandRecommendation="alpha"
      />

      <ProtocolExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        data={{
          montageState,
          telemetry,
        }}
      />

      <MultiChannelMatrixModal
        isOpen={isMatrixOpen}
        onClose={() => setIsMatrixOpen(false)}
        initialChannels={activeChannels}
        onApplyChannels={handleApplyMultiChannel}
      />
    </div>
  );
}

export default App;
