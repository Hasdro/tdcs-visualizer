import { useState, useMemo } from 'react';
import { useUrlMontageState } from './hooks/useUrlMontageState';
import { BRAIN_NODES } from './data/brain_nodes';
import { CLINICAL_PRESETS, ClinicalPreset } from './data/clinical_presets';
import { calculateTelemetry } from './utils/biophysicsEngine';
import { BrainViewport3D } from './components/BrainViewport3D';
import { EegWaveVisualizer } from './components/EegWaveVisualizer';
import { HumanImpactSimulators } from './components/HumanImpactSimulators';
import { CellularMechanismWidget } from './components/CellularMechanismWidget';
import {
  Brain,
  Zap,
  Clock,
  Square,
  ArrowLeftRight,
  Share2,
  Check,
  ShieldCheck,
  Waves,
  Activity,
  Sliders
} from 'lucide-react';

export function App() {
  const [montageState, updateMontageState] = useUrlMontageState();

  // Active Right Dock Tab: 'eeg' | 'impact' | 'cellular'
  const [rightTab, setRightTab] = useState<'eeg' | 'impact' | 'cellular'>('eeg');

  // Layer Visibility Toggles
  const [showScalpGrid, setShowScalpGrid] = useState(true);
  const [showEField, setShowEField] = useState(true);
  const [showStreamlines, setShowStreamlines] = useState(true);
  const [showPointCloud, setShowPointCloud] = useState(true);
  const [showBrodmannLabels, setShowBrodmannLabels] = useState(false);

  // Active 3D placement tool: null | 'anode' | 'cathode'
  const [activePlacementMode, setActivePlacementMode] = useState<'anode' | 'cathode' | null>(null);

  // Share link copied toast state
  const [copiedLink, setCopiedLink] = useState(false);

  // HD-tDCS surround cathodes configuration
  const currentPreset = useMemo(() => {
    return CLINICAL_PRESETS.find(
      (p) => p.anode === montageState.anode && p.cathode === montageState.cathode
    );
  }, [montageState.anode, montageState.cathode]);

  const surroundNodes = useMemo(() => {
    if (montageState.mode === 'hd4x1') {
      if (currentPreset?.surroundNodes) return currentPreset.surroundNodes;
      return ['Fp1', 'Fz', 'C3', 'F7'];
    }
    return undefined;
  }, [montageState.mode, currentPreset]);

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
    updateMontageState({
      anode: preset.anode,
      cathode: preset.cathode,
      ma: preset.currentMa,
      dur: preset.durationMin,
      pad: preset.padAreaCm2,
      mode: preset.montageType,
    });
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

  const anodeNode = BRAIN_NODES[montageState.anode] || BRAIN_NODES['F3'];
  const cathodeNode = BRAIN_NODES[montageState.cathode] || BRAIN_NODES['Fp2'];

  return (
    <div className="flex flex-col w-screen h-screen bg-[#070B12] text-slate-100 overflow-hidden font-sans">
      {/* TOP BAR: Header, 8 Clinical Presets, URL Share, Layer Pills */}
      <header className="h-14 bg-[#0A101D] border-b border-slate-800 flex items-center justify-between px-4 z-20 shrink-0">
        {/* Brand & Mode Title */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-cyan-600 via-sky-500 to-amber-500 p-[1px] shadow-glow-cyan">
            <div className="w-full h-full bg-[#0A101D] rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-mono text-sm font-bold tracking-tight text-white">
                NEUROFLOW <span className="text-cyan-400 font-extrabold">tDCS</span>
              </h1>
              <span className="text-[10px] font-mono bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 px-1.5 py-0.5 rounded">
                CLINICAL 3D
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono hidden md:block">
              Electrode Biophysics → Cortical E-Field (V/m) → EEG Wave Synth → Human Impact
            </p>
          </div>
        </div>

        {/* 8 One-Click Clinical Presets (AngioView style buttons) */}
        <div className="hidden xl:flex items-center gap-1.5 overflow-x-auto py-1 max-w-3xl">
          {CLINICAL_PRESETS.map((preset) => {
            const isSelected =
              montageState.anode === preset.anode &&
              montageState.cathode === preset.cathode &&
              montageState.mode === preset.montageType;

            return (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-mono whitespace-nowrap transition-all border ${
                  isSelected
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/70 font-bold shadow-glow-cyan'
                    : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                }`}
                title={`${preset.name} (${preset.evidenceLevel})`}
              >
                {preset.shortLabel}
              </button>
            );
          })}
        </div>

        {/* Right Header Utilities: Layer Pills & Share Button */}
        <div className="flex items-center gap-2">
          {/* Layer Pills */}
          <div className="hidden lg:flex items-center gap-1 bg-slate-900/80 p-0.5 rounded-lg border border-slate-800 text-[10px] font-mono">
            <button
              onClick={() => setShowScalpGrid(!showScalpGrid)}
              className={`px-2 py-1 rounded transition ${
                showScalpGrid ? 'bg-slate-800 text-cyan-300 font-bold' : 'text-slate-500'
              }`}
              title="Toggle Scalp Shell & 10-20 Meridian Straps"
            >
              Scalp 10-20
            </button>
            <button
              onClick={() => setShowEField(!showEField)}
              className={`px-2 py-1 rounded transition ${
                showEField ? 'bg-slate-800 text-amber-300 font-bold' : 'text-slate-500'
              }`}
              title="Toggle Cortical E-Field Heatmap"
            >
              E-Field
            </button>
            <button
              onClick={() => setShowStreamlines(!showStreamlines)}
              className={`px-2 py-1 rounded transition ${
                showStreamlines ? 'bg-slate-800 text-cyan-300 font-bold' : 'text-slate-500'
              }`}
              title="Toggle 3D Current Streamlines"
            >
              Streamlines
            </button>
            <button
              onClick={() => setShowPointCloud(!showPointCloud)}
              className={`px-2 py-1 rounded transition ${
                showPointCloud ? 'bg-slate-800 text-purple-300 font-bold' : 'text-slate-500'
              }`}
              title="Toggle Neural Point-Cloud"
            >
              Point-Cloud
            </button>
            <button
              onClick={() => setShowBrodmannLabels(!showBrodmannLabels)}
              className={`px-2 py-1 rounded transition ${
                showBrodmannLabels ? 'bg-slate-800 text-emerald-300 font-bold' : 'text-slate-500'
              }`}
              title="Toggle All Brodmann Area Labels"
            >
              Labels
            </button>
          </div>

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

      {/* MAIN VIEWPORT LAYOUT: Left Dock (280px) | Center Stage 3D | Right Dock (400px) */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT DOCK (280px): Montage Selector, Dosimetry, Safety Telemetry */}
        <aside className="w-72 bg-[#0A101D] border-r border-slate-800 flex flex-col shrink-0 overflow-y-auto custom-scrollbar z-10 select-none">
          {/* Preset Selector Dropdown (mobile/tablet fallback) */}
          <div className="p-3 border-b border-slate-800/80 xl:hidden">
            <label className="text-[11px] font-mono font-semibold text-slate-400 block mb-1">
              CLINICAL MONTAGE PRESET
            </label>
            <select
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

          {/* Montage Configuration */}
          <div className="p-3 border-b border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold text-slate-200 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                ELECTRODE MONTAGE
              </span>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded">
                10-20 SYSTEM
              </span>
            </div>

            {/* Anode Selection Card */}
            <div className="bg-slate-900/80 border border-red-900/40 rounded-lg p-2.5 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-red-400 font-bold flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-glow-anode" />
                  ANODE (+ DEP.)
                </span>
                <button
                  onClick={() => setActivePlacementMode(activePlacementMode === 'anode' ? null : 'anode')}
                  className={`text-[10px] px-1.5 py-0.5 rounded border transition ${
                    activePlacementMode === 'anode'
                      ? 'bg-red-500 text-white border-red-400 font-bold'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                  }`}
                >
                  {activePlacementMode === 'anode' ? 'Placing...' : '3D Click'}
                </button>
              </div>

              <select
                value={montageState.anode}
                onChange={(e) => updateMontageState({ anode: e.target.value })}
                className="w-full bg-[#070B12] border border-slate-700 text-slate-100 text-xs rounded p-1.5 font-mono"
              >
                {Object.values(BRAIN_NODES).map((node) => (
                  <option key={node.id} value={node.id}>
                    {node.id} — {node.shortName}
                  </option>
                ))}
              </select>

              <div className="text-[10px] text-slate-400 font-mono">
                Target: <span className="text-slate-200">{anodeNode.brodmannAreas.join(', ')}</span> ({anodeNode.lobe})
              </div>
            </div>

            {/* Cathode Selection Card */}
            <div className="bg-slate-900/80 border border-cyan-900/40 rounded-lg p-2.5 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-cyan-400 font-bold flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-glow-cathode" />
                  CATHODE (– HYP.)
                </span>
                <button
                  onClick={() => setActivePlacementMode(activePlacementMode === 'cathode' ? null : 'cathode')}
                  className={`text-[10px] px-1.5 py-0.5 rounded border transition ${
                    activePlacementMode === 'cathode'
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                  }`}
                >
                  {activePlacementMode === 'cathode' ? 'Placing...' : '3D Click'}
                </button>
              </div>

              <select
                value={montageState.cathode}
                onChange={(e) => updateMontageState({ cathode: e.target.value })}
                className="w-full bg-[#070B12] border border-slate-700 text-slate-100 text-xs rounded p-1.5 font-mono"
              >
                {Object.values(BRAIN_NODES).map((node) => (
                  <option key={node.id} value={node.id}>
                    {node.id} — {node.shortName}
                  </option>
                ))}
              </select>

              <div className="text-[10px] text-slate-400 font-mono">
                Return: <span className="text-slate-200">{cathodeNode.brodmannAreas.join(', ')}</span> ({cathodeNode.lobe})
              </div>
            </div>

            {/* Montage Mode Toggle: Sponge vs HD-tDCS 4x1 */}
            <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">Montage Focality</span>
              <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded border border-slate-800 text-[10px] font-mono">
                <button
                  onClick={() => updateMontageState({ mode: 'sponge', pad: 25 })}
                  className={`px-2 py-0.5 rounded transition ${
                    montageState.mode === 'sponge'
                      ? 'bg-slate-800 text-cyan-300 font-bold'
                      : 'text-slate-500'
                  }`}
                >
                  Sponge Pad
                </button>
                <button
                  onClick={() => updateMontageState({ mode: 'hd4x1', pad: 3.14 })}
                  className={`px-2 py-0.5 rounded transition ${
                    montageState.mode === 'hd4x1'
                      ? 'bg-cyan-500/20 text-cyan-400 font-bold border border-cyan-500/40'
                      : 'text-slate-500'
                  }`}
                >
                  HD 4×1 Ring
                </button>
              </div>
            </div>
          </div>

          {/* Dosimetry Sliders */}
          <div className="p-3 border-b border-slate-800/80 space-y-3.5">
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
                  <Zap className="w-3 h-3 text-amber-400" /> Current (I)
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
                  <Clock className="w-3 h-3 text-cyan-400" /> Duration (t)
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
                  <Square className="w-3 h-3 text-purple-400" /> Pad Area (A)
                </span>
                <span className="text-purple-300 font-bold bg-purple-950/60 border border-purple-800/50 px-1.5 py-0.5 rounded">
                  {montageState.pad} cm²
                </span>
              </div>
              <input
                type="range"
                min="3.14"
                max="35"
                step="1"
                value={montageState.pad}
                onChange={(e) => updateMontageState({ pad: parseFloat(e.target.value) })}
                className="w-full accent-purple-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
              <div className="flex justify-between text-[9px] font-mono text-slate-500">
                <span>3.14 (HD)</span>
                <span>16 (4x4)</span>
                <span>25 (5x5)</span>
                <span>35 (5x7)</span>
              </div>
            </div>
          </div>

          {/* Live Biophysical Safety Telemetry Card */}
          <div className="p-3 space-y-2.5 flex-1">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                SAFETY TELEMETRY
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                  telemetry.safetyIndex === 'OPTIMAL'
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                    : telemetry.safetyIndex === 'MODERATE'
                    ? 'bg-amber-950/80 text-amber-300 border-amber-800'
                    : 'bg-rose-950/80 text-rose-300 border-rose-800'
                }`}
              >
                {telemetry.safetyIndex}
              </span>
            </div>

            <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 space-y-1.5 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Current Density J:</span>
                <span className="text-cyan-300 font-bold">{telemetry.currentDensityMaCm2} mA/cm²</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Charge Q:</span>
                <span className="text-slate-200">{telemetry.totalChargeCoulombs} C</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Charge Density:</span>
                <span className="text-slate-200">{telemetry.chargeDensityCCm2} C/cm²</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Scalp/CSF Shunt:</span>
                <span className="text-rose-300 font-bold">{telemetry.shuntPercentage}%</span>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 leading-normal italic bg-slate-950/40 p-2 rounded border border-slate-800/60">
              "{telemetry.safetyMessage}"
            </p>
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
            showEField={showEField}
            showStreamlines={showStreamlines}
            showPointCloud={showPointCloud}
            showBrodmannLabels={showBrodmannLabels}
            activePlacementMode={activePlacementMode}
            setActivePlacementMode={setActivePlacementMode}
          />
        </main>

        {/* RIGHT DOCK (390px): 3 Tabbed Inspector Panels */}
        <aside className="w-96 bg-[#0A101D] border-l border-slate-800 flex flex-col shrink-0 overflow-hidden z-10 select-none">
          {/* Tab Selector Header */}
          <div className="flex items-center border-b border-slate-800 bg-[#0E1524]">
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
    </div>
  );
}

export default App;
