import React, { useState } from 'react';
import { MultiChannelChannel, MultiChannelTelemetry, calculateMultiChannelTelemetry } from '../utils/biophysicsEngine';
import { BRAIN_NODES } from '../data/brain_nodes';
import { Grid, Plus, Trash2, Scale, Zap, CheckCircle, AlertTriangle, X, Sparkles } from 'lucide-react';
import { ScalpLeadFieldContourMap } from './visuals/ScalpLeadFieldContourMap';

interface MultiChannelMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialChannels?: MultiChannelChannel[];
  onApplyChannels: (channels: MultiChannelChannel[]) => void;
}

const DEFAULT_ARRAY_PRESETS: Array<{
  name: string;
  description: string;
  channels: MultiChannelChannel[];
}> = [
  {
    name: '4x1 HD-tDCS Left DLPFC',
    description: 'High-focality cognitive array: F3 anode (+2.0 mA) with 4 surrounding ring return cathodes (-0.5 mA each).',
    channels: [
      { nodeId: 'F3', currentMa: 2.0 },
      { nodeId: 'Fp1', currentMa: -0.5 },
      { nodeId: 'Fz', currentMa: -0.5 },
      { nodeId: 'C3', currentMa: -0.5 },
      { nodeId: 'F7', currentMa: -0.5 },
    ]
  },
  {
    name: '4x1 HD-tDCS Motor M1',
    description: 'Targeted motor cortex array: C3 anode (+2.0 mA) with surrounding ring returns.',
    channels: [
      { nodeId: 'C3', currentMa: 2.0 },
      { nodeId: 'Cz', currentMa: -0.66 },
      { nodeId: 'T7', currentMa: -0.67 },
      { nodeId: 'P3', currentMa: -0.67 },
    ]
  },
  {
    name: 'Bilateral Frontal Dual-Anode',
    description: 'Dual excitatory anodes over F3 (+1.0 mA) and F4 (+1.0 mA) with central Cz return (-2.0 mA).',
    channels: [
      { nodeId: 'F3', currentMa: 1.0 },
      { nodeId: 'F4', currentMa: 1.0 },
      { nodeId: 'Cz', currentMa: -2.0 },
    ]
  },
  {
    name: 'Frontoparietal Working Memory',
    description: 'Coupled network stimulation: F3 (+1.5 mA) and P3 (-1.5 mA) dipole alignment.',
    channels: [
      { nodeId: 'F3', currentMa: 1.5 },
      { nodeId: 'P3', currentMa: -1.5 },
    ]
  }
];

export const MultiChannelMatrixModal: React.FC<MultiChannelMatrixModalProps> = ({
  isOpen,
  onClose,
  initialChannels = DEFAULT_ARRAY_PRESETS[0].channels,
  onApplyChannels,
}) => {
  const [channels, setChannels] = useState<MultiChannelChannel[]>(initialChannels);

  // Compute live multi-channel biophysics
  const telemetry: MultiChannelTelemetry = React.useMemo(() => {
    return calculateMultiChannelTelemetry(channels, 20, 3.14);
  }, [channels]);

  if (!isOpen) return null;

  const handleCurrentChange = (index: number, newMa: number) => {
    const updated = [...channels];
    updated[index].currentMa = parseFloat(newMa.toFixed(2));
    setChannels(updated);
  };

  const handleNodeChange = (index: number, newNodeId: string) => {
    const updated = [...channels];
    updated[index].nodeId = newNodeId;
    setChannels(updated);
  };

  const handleAddChannel = () => {
    if (channels.length >= 8) return;
    // pick first unused node
    const used = new Set(channels.map((c) => c.nodeId));
    const available = Object.keys(BRAIN_NODES).filter((k) => !k.startsWith('EX_') && !used.has(k));
    const nextNode = available[0] || 'Cz';
    setChannels([...channels, { nodeId: nextNode, currentMa: -0.5 }]);
  };

  const handleRemoveChannel = (index: number) => {
    if (channels.length <= 2) return;
    setChannels(channels.filter((_, i) => i !== index));
  };

  const handleAutoBalance = () => {
    // Kirchhoff Law: sum(I) = 0
    let totalAnodal = 0;
    const cathodalIndices: number[] = [];

    channels.forEach((ch, idx) => {
      if (ch.currentMa > 0) {
        totalAnodal += ch.currentMa;
      } else {
        cathodalIndices.push(idx);
      }
    });

    if (cathodalIndices.length === 0) {
      // Add a return electrode
      const used = new Set(channels.map((c) => c.nodeId));
      const available = Object.keys(BRAIN_NODES).filter((k) => !k.startsWith('EX_') && !used.has(k));
      const returnNode = available[0] || 'Cz';
      setChannels([...channels, { nodeId: returnNode, currentMa: -totalAnodal }]);
      return;
    }

    const distributedCathode = -parseFloat((totalAnodal / cathodalIndices.length).toFixed(2));
    const updated = [...channels];
    cathodalIndices.forEach((idx) => {
      updated[idx].currentMa = distributedCathode;
    });
    setChannels(updated);
  };

  const handleApplyPreset = (preset: typeof DEFAULT_ARRAY_PRESETS[0]) => {
    setChannels(preset.channels);
  };

  const handleSaveAndApply = () => {
    onApplyChannels(channels);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-[#0B1322] border border-cyan-500/40 rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden font-sans text-slate-100 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-[#0E1729] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-700/60 flex items-center justify-center text-cyan-400">
              <Grid className="w-4 h-4" />
            </div>
            <div>
              <h2 className="flex items-center gap-2 text-sm font-semibold tracking-tight text-white">
                Multi-channel array
                <span className="rounded bg-cyan-900/60 px-1.5 py-0.5 text-[11px] font-normal text-cyan-300">
                  HD-tDCS · Kirchhoff solver
                </span>
              </h2>
              <p className="text-[12px] text-slate-400">
                Arbitrary cortical lead-field superposition across up to 8 independent channels
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 custom-scrollbar flex-1">
          {/* Quick Presets Carousel */}
          <div>
            <div className="mb-2 flex items-center gap-1 text-[12px] font-medium text-slate-400">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Array presets</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {DEFAULT_ARRAY_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => handleApplyPreset(preset)}
                  className="p-2.5 rounded-lg text-left bg-slate-900/80 border border-slate-800 hover:border-cyan-500/60 transition group"
                >
                  <div className="text-xs font-mono font-bold text-cyan-300 group-hover:text-cyan-200">
                    {preset.name}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                    {preset.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Kirchhoff's Current Law Status Banner & Physical Balance Scale */}
          <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold font-mono text-xs ${
                    telemetry.isKirchhoffBalanced
                      ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-700/60 shadow-glow-cyan'
                      : 'bg-amber-950/80 text-amber-400 border border-amber-700/60'
                  }`}
                >
                  <Scale className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-200">
                      Kirchhoff current balance
                    </span>
                    <span
                      className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded ${
                        telemetry.isKirchhoffBalanced
                          ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/60'
                          : 'bg-amber-900/60 text-amber-300 border border-amber-700/60'
                      }`}
                    >
                      Σ I = {telemetry.kirchhoffSumMa > 0 ? `+${telemetry.kirchhoffSumMa}` : telemetry.kirchhoffSumMa} mA
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                    Source: +{telemetry.totalAnodalMa} mA | Sink: -{telemetry.totalCathodalMa} mA
                  </div>
                </div>
              </div>

              <button
                onClick={handleAutoBalance}
                disabled={telemetry.isKirchhoffBalanced}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition border ${
                  telemetry.isKirchhoffBalanced
                    ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/80 cursor-default font-bold'
                    : 'bg-amber-600/30 text-amber-300 border-amber-500/70 hover:bg-amber-600/40 cursor-pointer'
                }`}
              >
                {telemetry.isKirchhoffBalanced ? '✓ Circuit balanced' : 'Auto-balance (Σ I = 0)'}
              </button>
            </div>

            {/* Kirchhoff Visual Balance Scale & Lead-Field Isopotential Contour Map */}
            <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-800/80">
              {/* Balance Scale SVG */}
              <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800/60 flex flex-col items-center justify-center">
                <span className="text-[10.5px] font-mono text-slate-400 mb-1">Current conservation scale</span>
                <svg viewBox="0 0 160 55" className="w-40 h-14">
                  {/* Fulcrum */}
                  <polygon points="80,28 72,50 88,50" fill="#1E293B" stroke="#475569" strokeWidth="1" />
                  <circle cx="80" cy="28" r="3" fill={telemetry.isKirchhoffBalanced ? '#10B981' : '#F59E0B'} />
                  {/* Lever */}
                  <g
                    transform={`rotate(${telemetry.isKirchhoffBalanced ? 0 : Math.max(-12, Math.min(12, telemetry.kirchhoffSumMa * 10))}, 80, 28)`}
                    className="transition-transform duration-300"
                  >
                    <line x1="20" y1="28" x2="140" y2="28" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" />
                    {/* Left pan: Anodes Source */}
                    <circle cx="28" cy="28" r="6" fill="#EF4444" />
                    <text x="28" y="44" fill="#F87171" fontSize="6.9" textAnchor="middle" fontFamily="monospace">+{telemetry.totalAnodalMa}mA</text>
                    {/* Right pan: Cathodes Sink */}
                    <circle cx="132" cy="28" r="6" fill="#06B6D4" />
                    <text x="132" y="44" fill="#38BDF8" fontSize="6.9" textAnchor="middle" fontFamily="monospace">-{telemetry.totalCathodalMa}mA</text>
                  </g>
                </svg>
              </div>

              {/* Lead-Field Isopotential Contour Map */}
              <div className="col-span-2">
                <ScalpLeadFieldContourMap channels={channels} />
              </div>
            </div>
          </div>

          {/* Active Electrodes List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-slate-300">
              <span>Array channels ({channels.length}/8)</span>
              <button
                onClick={handleAddChannel}
                disabled={channels.length >= 8}
                className="flex items-center gap-1 text-[12px] text-cyan-400 hover:text-cyan-300 disabled:text-slate-600 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add electrode</span>
              </button>
            </div>

            {channels.map((channel, idx) => {
              const isAnode = channel.currentMa > 0;
              const isCathode = channel.currentMa < 0;

              return (
                <div
                  key={idx}
                  className="p-3 bg-[#070B12] border border-slate-800 rounded-lg flex items-center gap-3 font-mono"
                >
                  {/* Channel Number */}
                  <span className="text-slate-500 text-xs w-5 font-bold">#{idx + 1}</span>

                  {/* Polarity Tag */}
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded w-16 text-center ${
                      isAnode
                        ? 'bg-red-950 text-red-300 border border-red-800/60'
                        : isCathode
                        ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/60'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isAnode ? 'Anode' : isCathode ? 'Cathode' : 'Neutral'}
                  </span>

                  {/* Node Selector */}
                  <select
                    value={channel.nodeId}
                    onChange={(e) => handleNodeChange(idx, e.target.value)}
                    className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded p-1.5 flex-1 max-w-[140px]"
                  >
                    {Object.values(BRAIN_NODES)
                      .filter((n) => !n.id.startsWith('EX_'))
                      .map((n) => (
                        <option key={n.id} value={n.id}>
                          {n.id} ({n.shortName})
                        </option>
                      ))}
                  </select>

                  {/* Slider & mA value */}
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="range"
                      min="-2.0"
                      max="2.0"
                      step="0.05"
                      value={channel.currentMa}
                      onChange={(e) => handleCurrentChange(idx, parseFloat(e.target.value))}
                      className="flex-1 accent-cyan-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                    />
                    <span className="w-16 text-right text-xs font-bold text-slate-200">
                      {channel.currentMa > 0 ? `+${channel.currentMa.toFixed(2)}` : channel.currentMa.toFixed(2)} mA
                    </span>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => handleRemoveChannel(idx)}
                    disabled={channels.length <= 2}
                    className="p-1.5 text-slate-500 hover:text-red-400 disabled:text-slate-700 transition"
                    title="Remove electrode"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Telemetry Summary */}
          <div className="grid grid-cols-3 gap-2 p-3 bg-slate-950/60 border border-slate-800 rounded-lg text-xs font-mono">
            <div>
              <span className="text-slate-500 text-[11px] block">Peak cortical E-field</span>
              <span className="text-amber-300 font-bold">{telemetry.peakEFieldVm.toFixed(3)} V/m</span>
            </div>
            <div>
              <span className="text-slate-500 text-[11px] block">Somatic polarization</span>
              <span className="text-red-300 font-bold">+{telemetry.maxMembraneShiftMv.toFixed(2)} mV</span>
            </div>
            <div>
              <span className="text-slate-500 text-[11px] block">Safety profile</span>
              <span className="text-emerald-400 font-bold">{telemetry.safetyIndex}</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-[#0A101D] border-t border-slate-800 flex items-center justify-between shrink-0">
          <div className="text-[12px] font-mono text-slate-400 flex items-center gap-1.5">
            {telemetry.isKirchhoffBalanced ? (
              <>
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Kirchhoff safe · no net scalp charge</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-amber-400">Unbalanced currents</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 text-xs font-mono hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAndApply}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-bold transition shadow-glow-cyan"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Apply array</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
