import React, { useEffect, useRef, useState } from 'react';
import { BiophysicalTelemetry } from '../utils/biophysicsEngine';
import { BRAIN_NODES } from '../data/brain_nodes';
import { CognitiveImpactRadar } from './visuals/CognitiveImpactRadar';
import { ReactionTimeRaceTrack } from './visuals/ReactionTimeRaceTrack';
import { HomunculusAvatar } from './visuals/HomunculusAvatar';

interface HumanImpactSimulatorsProps {
  anodeId: string;
  cathodeId: string;
  currentMa: number;
  telemetry: BiophysicalTelemetry;
}

export const HumanImpactSimulators: React.FC<HumanImpactSimulatorsProps> = ({
  anodeId,
  cathodeId,
  currentMa,
  telemetry
}) => {
  const [activeSimTab, setActiveSimTab] = useState<'focus' | 'motor'>('focus');

  // Canvas refs for the 2 interactive 60 FPS simulations
  const focusCanvasRef = useRef<HTMLCanvasElement>(null);
  const motorCanvasRef = useRef<HTMLCanvasElement>(null);

  const anodeNode = BRAIN_NODES[anodeId] || BRAIN_NODES['F3'];
  const cathodeNode = BRAIN_NODES[cathodeId] || BRAIN_NODES['Fp2'];

  // Metrics from telemetry
  const metrics = telemetry.compositeMetrics;

  // Mini-Sim 1: Cognitive Focus & Signal-to-Noise Simulator Animation Loop
  useEffect(() => {
    if (activeSimTab !== 'focus') return;
    const canvas = focusCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let time = 0;

    // Distractor particles
    const numParticles = 45;
    const particles = Array.from({ length: numParticles }, () => ({
      angle: Math.random() * Math.PI * 2,
      radius: 35 + Math.random() * 65,
      speed: (Math.random() - 0.5) * 0.04,
      size: 1.5 + Math.random() * 2.0,
      jitter: Math.random() * 8
    }));

    const render = () => {
      time += 0.02;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      // Focus level determines how tight & stable the lock is (0 to 1)
      // Positive focus metric shrinks target ring and dampens chaotic jitter
      const focusLevel = Math.max(0.1, Math.min(1.0, 0.45 + (metrics.focus / 100.0) * 0.45));
      const targetRadius = 24 + (1.0 - focusLevel) * 22;

      // 1. Draw Central Neural Target Lock Ring
      ctx.beginPath();
      ctx.arc(cx, cy, targetRadius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(56, 189, 248, ${0.4 + focusLevel * 0.5})`;
      ctx.lineWidth = 2.0;
      ctx.stroke();

      // Outer target reticle brackets
      const bracketLen = 8;
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 1.5;

      // Top bracket
      ctx.beginPath();
      ctx.moveTo(cx - bracketLen, cy - targetRadius - 4);
      ctx.lineTo(cx + bracketLen, cy - targetRadius - 4);
      ctx.stroke();

      // Bottom bracket
      ctx.beginPath();
      ctx.moveTo(cx - bracketLen, cy + targetRadius + 4);
      ctx.lineTo(cx + bracketLen, cy + targetRadius + 4);
      ctx.stroke();

      // Reticle center pulse
      const centerPulse = 3.5 + Math.sin(time * 6.0) * 1.5 * focusLevel;
      ctx.beginPath();
      ctx.arc(cx, cy, centerPulse, 0, Math.PI * 2);
      ctx.fillStyle = focusLevel > 0.6 ? '#34D399' : '#38BDF8';
      ctx.fill();

      // 2. Draw Distractor Noise Particles (chaotic mind-wandering)
      particles.forEach((p, i) => {
        // High focus forces particles into coherent orbital streams
        // Low focus causes random Brownian scattering
        const chaos = (1.0 - focusLevel) * 14.0;
        p.angle += p.speed * (0.8 + focusLevel * 1.2);

        const currentRadius = p.radius + Math.sin(time * 3.0 + i) * chaos;
        const px = cx + Math.cos(p.angle) * currentRadius;
        const py = cy + Math.sin(p.angle) * currentRadius;

        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        if (focusLevel > 0.6) {
          ctx.fillStyle = `rgba(148, 163, 184, ${0.25 + 0.25 * Math.sin(time * 4.0 + i)})`;
        } else {
          // Distractor noise lights up reddish when focus is low
          ctx.fillStyle = `rgba(244, 63, 94, ${0.5 + 0.3 * Math.sin(time * 5.0 + i)})`;
        }
        ctx.fill();
      });

      // Target coherence ring glow
      ctx.beginPath();
      ctx.arc(cx, cy, targetRadius * 1.35, 0, Math.PI * 2);
      ctx.strokeStyle = focusLevel > 0.6 ? 'rgba(52, 211, 153, 0.22)' : 'rgba(56, 189, 248, 0.12)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 6]);
      ctx.stroke();
      ctx.setLineDash([]);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [activeSimTab, metrics.focus]);

  // Mini-Sim 2: Motor Cortex Reflex & Action Execution Simulator Animation Loop
  useEffect(() => {
    if (activeSimTab !== 'motor') return;
    const canvas = motorCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let time = 0;

    // Nerve impulse wave packet
    let impulseProgress = 0;
    const tapEvents: Array<{ x: number; life: number }> = [];

    const render = () => {
      time += 0.02;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      ctx.clearRect(0, 0, width, height);

      // Motor speed factor: higher motor speed metric accelerates nerve conduction
      const motorSpeedFactor = Math.max(0.3, Math.min(1.8, 1.0 + (metrics.motorSpeed / 100.0) * 0.7));

      // Update impulse progress (from M1 origin at left to neuromuscular effector at right)
      impulseProgress += 0.016 * motorSpeedFactor;
      if (impulseProgress > 1.0) {
        impulseProgress = 0;
        // Trigger tap event
        tapEvents.push({ x: width - 35, life: 1.0 });
      }

      const startX = 35;
      const endX = width - 35;
      const lineY = height / 2;

      // 1. Draw Corticospinal Tract Axonal Highway
      ctx.beginPath();
      ctx.moveTo(startX, lineY);
      ctx.lineTo(endX, lineY);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 3;
      ctx.stroke();

      // M1 Motor Origin Node
      ctx.beginPath();
      ctx.arc(startX, lineY, 8, 0, Math.PI * 2);
      ctx.fillStyle = '#EF4444';
      ctx.fill();
      ctx.font = '9px "IBM Plex Mono", monospace';
      ctx.fillStyle = '#CBD5E1';
      ctx.fillText('M1 CORTEX', startX - 24, lineY - 14);

      // Neuromuscular Hand Effector Node
      ctx.beginPath();
      ctx.arc(endX, lineY, 8, 0, Math.PI * 2);
      ctx.fillStyle = '#06B6D4';
      ctx.fill();
      ctx.fillText('HAND TAP', endX - 18, lineY - 14);

      // 2. Flowing Action Potential Spike Packet
      const spikeX = startX + (endX - startX) * impulseProgress;
      ctx.beginPath();
      ctx.arc(spikeX, lineY, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#F59E0B';
      ctx.shadowColor = '#F59E0B';
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Spike ripple waveform along axon
      ctx.beginPath();
      ctx.strokeStyle = '#FBBF24';
      ctx.lineWidth = 2;
      for (let x = startX; x <= endX; x += 4) {
        const dist = Math.abs(x - spikeX);
        const wave = dist < 25 ? Math.sin((x - spikeX) * 0.25) * 8 * Math.exp(-dist * 0.1) : 0;
        if (x === startX) ctx.moveTo(x, lineY + wave);
        else ctx.lineTo(x, lineY + wave);
      }
      ctx.stroke();

      // 3. Render Tap Impact Rings
      for (let i = tapEvents.length - 1; i >= 0; i--) {
        const ev = tapEvents[i];
        ev.life -= 0.04;
        if (ev.life <= 0) {
          tapEvents.splice(i, 1);
          continue;
        }

        const ringR = (1.0 - ev.life) * 25;
        ctx.beginPath();
        ctx.arc(ev.x, lineY, ringR, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(6, 182, 212, ${ev.life * 0.8})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [activeSimTab, metrics.motorSpeed]);

  // Derived real-world performance metrics
  const simulatedRT = Math.round(410 - (metrics.focus * 0.9 + metrics.motorSpeed * 0.6));
  const simulatedFilterEfficiency = Math.round(62 + metrics.focus * 0.32);
  const motorJitterMs = Math.max(6, Math.round(28 - metrics.motorSpeed * 0.18));

  // Dynamic protocol impact summary & state emoji badge (Video Feedback #7 & #8)
  const dynamicStateBadge = React.useMemo(() => {
    if (metrics.focus >= 25) return { emoji: '🎯', label: 'Deep Focus & Executive Drive', color: 'text-emerald-400 bg-emerald-950/60 border-emerald-800' };
    if (metrics.mood >= 25) return { emoji: '😄', label: 'High Mood Uplift & Motivation', color: 'text-amber-400 bg-amber-950/60 border-amber-800' };
    if (metrics.motorSpeed >= 18) return { emoji: '⚡', label: 'Corticospinal Motor Priming', color: 'text-cyan-400 bg-cyan-950/60 border-cyan-800' };
    if (metrics.focus <= -15) return { emoji: '🧘', label: 'Cortical De-arousal & Calming', color: 'text-purple-400 bg-purple-950/60 border-purple-800' };
    return { emoji: '🌟', label: 'Normative Balanced Modulation', color: 'text-sky-400 bg-sky-950/60 border-sky-800' };
  }, [metrics]);

  const moodEmoji = metrics.mood >= 25 ? '😄' : metrics.mood > 0 ? '😊' : metrics.mood === 0 ? '😐' : '😔';

  return (
    <div className="flex flex-col h-full bg-[#0F1623] border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Header Bar */}
      <div className="p-3 bg-[#131B2C] border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base">🧠</span>
          <h3 className="font-mono text-xs font-bold text-slate-100 tracking-wider uppercase">
            Human Performance & Biophysical Impact
          </h3>
        </div>
        <div className="flex items-center gap-2 font-mono text-[10px] text-slate-400">
          <span>{currentMa.toFixed(1)} mA</span>
          <span className="text-slate-600">|</span>
          <span className="text-emerald-400 font-semibold">{anodeNode.id} / {cathodeNode.id}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3.5 custom-scrollbar">
        {/* Dynamic State Banner with Emojis */}
        <div className={`p-2.5 rounded-lg border flex items-center justify-between text-xs font-mono ${dynamicStateBadge.color}`}>
          <div className="flex items-center gap-2">
            <span className="text-lg">{dynamicStateBadge.emoji}</span>
            <span className="font-bold tracking-tight">{dynamicStateBadge.label}</span>
          </div>
          <span className="text-[10px] opacity-80 uppercase tracking-wider font-semibold">Active Mode</span>
        </div>

        {/* Visual 1: Hexagonal Cognitive Performance Radar Chart */}
        <CognitiveImpactRadar telemetry={telemetry} />

        {/* Visual 2: Somatotopic Homunculus Embodiment Avatar */}
        <HomunculusAvatar anodeId={anodeId} cathodeId={cathodeId} />

        {/* Visual 3: Reaction Time Speedometer & Visual Race Track */}
        <ReactionTimeRaceTrack motorScore={metrics.motorSpeed || metrics.focus} />

        {/* Section 1: Live Interactive Mini-Simulation Suite */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2.5 shadow-md">
          {/* Simulation Selector Tabs */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-[11px] font-mono font-bold text-cyan-400 flex items-center gap-1.5">
              <span>🎮</span>
              LIVE TASK MINI-SIMULATOR
            </span>
            <div className="flex items-center gap-1 font-mono text-[10px]">
              <button
                onClick={() => setActiveSimTab('focus')}
                className={`px-2 py-0.5 rounded transition ${
                  activeSimTab === 'focus'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🎯 1. Focus / S-N Ratio
              </button>
              <button
                onClick={() => setActiveSimTab('motor')}
                className={`px-2 py-0.5 rounded transition ${
                  activeSimTab === 'motor'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                ⚡ 2. Motor Tap Reflex
              </button>
            </div>
          </div>

          {/* Active Canvas Mini-Simulation View */}
          {activeSimTab === 'focus' ? (
            <div className="mt-2.5">
              <div className="relative w-full h-36 bg-[#070B12] rounded-lg border border-slate-800/80 overflow-hidden">
                <canvas ref={focusCanvasRef} className="w-full h-full block" />
                <div className="absolute top-2 left-2 text-[9px] font-mono text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
                  🎯 Target Lock Coherence
                </div>
                <div className="absolute bottom-2 right-2 text-[9px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                  Filtering: {simulatedFilterEfficiency}%
                </div>
              </div>

              {/* Explanatory Caption */}
              <div className="mt-2 flex items-center justify-between text-[11px] font-mono bg-slate-950/60 p-2 rounded border border-slate-800/50">
                <span className="text-slate-400">⏱️ Reaction Time:</span>
                <span className="text-amber-300 font-bold">{simulatedRT} ms</span>
                <span className="text-slate-600">|</span>
                <span className="text-slate-400">🛡️ Distractor Rejection:</span>
                <span className="text-emerald-300 font-bold">+{metrics.focus}%</span>
              </div>
            </div>
          ) : (
            <div className="mt-2.5">
              <div className="relative w-full h-36 bg-[#070B12] rounded-lg border border-slate-800/80 overflow-hidden">
                <canvas ref={motorCanvasRef} className="w-full h-full block" />
                <div className="absolute top-2 left-2 text-[9px] font-mono text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
                  ⚡ Conduction Velocity
                </div>
                <div className="absolute bottom-2 right-2 text-[9px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/60">
                  Jitter: ±{motorJitterMs} ms
                </div>
              </div>

              <div className="mt-2 flex items-center justify-between text-[11px] font-mono bg-slate-950/60 p-2 rounded border border-slate-800/50">
                <span className="text-slate-400">⚡ Excitability:</span>
                <span className="text-cyan-300 font-bold">+{metrics.motorSpeed}%</span>
                <span className="text-slate-600">|</span>
                <span className="text-slate-400">🩹 Pain Modulation:</span>
                <span className="text-amber-300 font-bold">+{metrics.painThreshold}%</span>
              </div>
            </div>
          )}
        </div>

        {/* Section 2: Six Bidirectional Behavioral Gauges with Emojis */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3 shadow-md space-y-3">
          <div className="flex items-center justify-between text-slate-400 pb-1.5 border-b border-slate-800">
            <span className="font-mono text-[11px] font-bold text-slate-200 flex items-center gap-1.5">
              <span>📊</span>
              COGNITIVE & MOTOR OUTCOME GAUGES
            </span>
            <span className="text-[10px] font-mono text-slate-400">vs Baseline Norm (0%)</span>
          </div>

          {/* 1. Executive Focus */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 flex items-center gap-1.5 font-medium">
                <span>🎯</span> Executive Focus & Working Memory
              </span>
              <span className={`font-mono font-bold ${metrics.focus >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {metrics.focus >= 0 ? `+${metrics.focus}%` : `${metrics.focus}%`}
              </span>
            </div>
            <div className="h-2 bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
              <div
                className={`h-full transition-all duration-300 ${
                  metrics.focus >= 0 ? 'bg-gradient-to-r from-emerald-600 to-emerald-400' : 'bg-rose-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(4, Math.abs(metrics.focus)))}%` }}
              />
            </div>
          </div>

          {/* 2. Mood Valence */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 flex items-center gap-1.5 font-medium">
                <span>{moodEmoji}</span> Mood Valence & Approach Motivation
              </span>
              <span className={`font-mono font-bold ${metrics.mood >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {metrics.mood >= 0 ? `+${metrics.mood}%` : `${metrics.mood}%`}
              </span>
            </div>
            <div className="h-2 bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
              <div
                className={`h-full transition-all duration-300 ${
                  metrics.mood >= 0 ? 'bg-gradient-to-r from-amber-600 to-amber-400' : 'bg-rose-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(4, Math.abs(metrics.mood)))}%` }}
              />
            </div>
          </div>

          {/* 3. Motor Reaction Speed */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 flex items-center gap-1.5 font-medium">
                <span>⚡</span> Motor Speed & Corticospinal Excitability
              </span>
              <span className={`font-mono font-bold ${metrics.motorSpeed >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {metrics.motorSpeed >= 0 ? `+${metrics.motorSpeed}%` : `${metrics.motorSpeed}%`}
              </span>
            </div>
            <div className="h-2 bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
              <div
                className={`h-full transition-all duration-300 ${
                  metrics.motorSpeed >= 0 ? 'bg-gradient-to-r from-rose-600 to-rose-400' : 'bg-rose-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(4, Math.abs(metrics.motorSpeed)))}%` }}
              />
            </div>
          </div>

          {/* 4. Speech & Verbal Fluency */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 flex items-center gap-1.5 font-medium">
                <span>💬</span> Speech & Verbal Fluency
              </span>
              <span className={`font-mono font-bold ${metrics.language >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {metrics.language >= 0 ? `+${metrics.language}%` : `${metrics.language}%`}
              </span>
            </div>
            <div className="h-2 bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
              <div
                className={`h-full transition-all duration-300 ${
                  metrics.language >= 0 ? 'bg-gradient-to-r from-purple-600 to-purple-400' : 'bg-rose-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(4, Math.abs(metrics.language)))}%` }}
              />
            </div>
          </div>

          {/* 5. Pain Threshold */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 flex items-center gap-1.5 font-medium">
                <span>🛡️</span> Pain Tolerance / Descending Analgesia
              </span>
              <span className={`font-mono font-bold ${metrics.painThreshold >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {metrics.painThreshold >= 0 ? `+${metrics.painThreshold}%` : `${metrics.painThreshold}%`}
              </span>
            </div>
            <div className="h-2 bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
              <div
                className={`h-full transition-all duration-300 ${
                  metrics.painThreshold >= 0 ? 'bg-gradient-to-r from-sky-600 to-sky-400' : 'bg-rose-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(4, Math.abs(metrics.painThreshold)))}%` }}
              />
            </div>
          </div>

          {/* 6. Visual Contrast Sensitivity */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 flex items-center gap-1.5 font-medium">
                <span>👁️</span> Visual Contrast Sensitivity
              </span>
              <span className={`font-mono font-bold ${metrics.visualAcuity >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {metrics.visualAcuity >= 0 ? `+${metrics.visualAcuity}%` : `${metrics.visualAcuity}%`}
              </span>
            </div>
            <div className="h-2 bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
              <div
                className={`h-full transition-all duration-300 ${
                  metrics.visualAcuity >= 0 ? 'bg-gradient-to-r from-indigo-600 to-indigo-400' : 'bg-rose-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(4, Math.abs(metrics.visualAcuity)))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Section 3: Physical Sensations & Adverse Effect Monitor with Emojis */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3 shadow-md space-y-2.5">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
            <span className="font-mono text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
              <span>⚠️</span>
              SENSORY & SIDE-EFFECT MONITOR
            </span>
            <span className="text-[10px] font-mono text-slate-400">Real-Time Telemetry</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            {/* Scalp Tingling */}
            <div className="bg-slate-950/60 p-2 rounded border border-slate-800/60">
              <div className="text-[10px] text-slate-400 flex items-center gap-1">
                <span>🐜</span> Scalp Tingling / Itching
              </div>
              <div className="text-sm font-bold text-amber-300 mt-0.5">
                {telemetry.sideEffectProfile.tinglingScore} / 10
              </div>
            </div>

            {/* Erythema */}
            <div className="bg-slate-950/60 p-2 rounded border border-slate-800/60">
              <div className="text-[10px] text-slate-400 flex items-center gap-1">
                <span>🔴</span> Skin Erythema (Redness)
              </div>
              <div className="text-sm font-bold text-rose-300 mt-0.5">
                {telemetry.sideEffectProfile.skinErythemaRisk} / 10
              </div>
            </div>

            {/* Metallic Taste */}
            <div className="bg-slate-950/60 p-2 rounded border border-slate-800/60 col-span-2 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-slate-400 flex items-center gap-1">
                  <span>👅</span> Metallic Taste (Lingual Nerve)
                </div>
                <div className="text-[11px] text-slate-300">
                  {telemetry.sideEffectProfile.metallicTaste
                    ? 'Active (electrode near frontotemporal branch)'
                    : 'Unlikely in current montage'}
                </div>
              </div>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  telemetry.sideEffectProfile.metallicTaste
                    ? 'bg-amber-950 text-amber-400 border border-amber-800'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {telemetry.sideEffectProfile.metallicTaste ? 'DETECTED' : 'ABSENT'}
              </span>
            </div>

            {/* Phosphenes */}
            {telemetry.sideEffectProfile.phospheneRisk && (
              <div className="bg-rose-950/30 p-2 rounded border border-rose-800/50 col-span-2 flex items-start gap-2">
                <span className="text-base shrink-0 mt-0.5">💡</span>
                <div className="text-[11px] text-slate-200">
                  <span className="font-bold text-rose-300">Retinal Phosphene Risk: </span>
                  Electrode proximity to frontopolar / supraorbital sites may trigger mild visual flashes during current ramp-up/down.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
