import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Microscope } from 'lucide-react';
import { BRAIN_NODES } from '../../data/brain_nodes';
import { FIRING_NOISE_SIGMA_MV, membraneShiftAtNode } from '../../utils/biophysicsEngine';

interface NeuronalMagnifyingLensProps {
  anodeId: string;
  cathodeId: string;
  currentMa: number;
  padAreaCm2: number;
  montageType: 'sponge' | 'hd4x1';
  surroundNodes?: string[];
  /** Playback multiplier shared with the 3D stage (0 = paused). */
  simSpeed: number;
}

type LensTarget = 'anode' | 'cathode';

// Spontaneous rate at rest; tDCS scales it by exp(ΔVm / σ).
const BASE_RATE_HZ = 4;
const NOISE_SIGMA_MV = FIRING_NOISE_SIGMA_MV;
// Action potentials are drawn 400× slower than real axonal conduction so
// each spike can be followed by eye.
const AXON_TRANSIT_S = 0.7;

const CANVAS_W = 320;
const CANVAS_H = 300;

interface LensState {
  dVm: number;
  rateHz: number;
  eNormal: number;
  speed: number;
}

interface Spike {
  born: number;
}

interface Ion {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  kind: 'glu' | 'ca' | 'mg';
}

/**
 * Cellular microscope over the stimulated cortical patch, drawn at the width
 * of its dashboard tab. Shows the
 * sub-threshold mechanism of tDCS on one layer-V pyramidal neuron: the radial
 * field polarizes the soma (and oppositely the apical tuft), which changes the
 * probability of spontaneous firing and, downstream, NMDA-dependent plasticity.
 */
export const NeuronalMagnifyingLens: React.FC<NeuronalMagnifyingLensProps> = ({
  anodeId,
  cathodeId,
  currentMa,
  padAreaCm2,
  montageType,
  surroundNodes,
  simSpeed
}) => {
  const [target, setTarget] = useState<LensTarget>('anode');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  // The scene is authored at 320 × 300 and scaled to fill the tab.
  const [scale, setScale] = useState(1.4);
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const observer = new ResizeObserver(([entry]) => {
      const next = Math.max(1, entry.contentRect.width / CANVAS_W);
      setScale((prev) => (Math.abs(prev - next) > 0.01 ? next : prev));
    });
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  const returnId = montageType === 'hd4x1' ? surroundNodes?.[0] ?? cathodeId : cathodeId;
  const cathodeHasCortex = !returnId.startsWith('EX_') && Boolean(BRAIN_NODES[returnId]);
  const activeTarget: LensTarget = target === 'cathode' && !cathodeHasCortex ? 'anode' : target;
  const nodeId = activeTarget === 'anode' ? anodeId : returnId;
  const node = BRAIN_NODES[nodeId] ?? BRAIN_NODES['F3'];

  const physics = useMemo(() => {
    const shift = membraneShiftAtNode(node.id, {
      anodeId,
      cathodeId,
      currentMa,
      durationMin: 20,
      padAreaCm2,
      montageType,
      surroundNodeIds: surroundNodes
    }) ?? { eNormal: 0, dVm: 0, firingRatio: 1 };
    return { eNormal: shift.eNormal, dVm: shift.dVm, rateHz: BASE_RATE_HZ * shift.firingRatio };
  }, [node, anodeId, cathodeId, currentMa, padAreaCm2, montageType, surroundNodes]);

  // Animation reads live values through a ref so the loop is never restarted.
  const stateRef = useRef<LensState>({ ...physics, speed: simSpeed });
  stateRef.current = { ...physics, speed: simSpeed };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(CANVAS_W * scale * dpr);
    canvas.height = Math.round(CANVAS_H * scale * dpr);
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);

    let raf = 0;
    let last = performance.now();
    let t = 0;
    // Smoothed display values so a dose change ramps instead of jumping.
    let shownDVm = stateRef.current.dVm;
    let shownE = stateRef.current.eNormal;
    let nextSpikeAt = 0.3;
    let seed = 1234567;
    const rand = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };
    const spikes: Spike[] = [];
    const traceSpikes: number[] = [];
    const ions: Ion[] = [];
    const trace = new Float32Array(160);
    let traceHead = 0;
    let traceAcc = 0;
    let noise = 0;
    let mgBlocked = 1; // 1 = Mg²⁺ in the NMDA pore
    let ampa = 4;

    // Geometry (CSS px)
    const somaX = 92;
    const somaY = 150;
    const apicalTop = 38;
    const axonEndY = 236;
    const syn = { x: 176, y: 120, w: 136, h: 112 };
    const traceBox = { x: 8, y: 248, w: 304, h: 44 };

    const polarColor = (v: number, alpha = 1) => {
      // Coral for depolarization, electric cyan for hyperpolarization.
      const k = Math.min(1, Math.abs(v) / 1.0);
      return v >= 0
        ? `rgba(${Math.round(160 + 95 * k)}, ${Math.round(150 - 40 * k)}, ${Math.round(150 - 60 * k)}, ${alpha})`
        : `rgba(${Math.round(150 - 120 * k)}, ${Math.round(160 + 50 * k)}, ${Math.round(170 + 85 * k)}, ${alpha})`;
    };

    const spawnIon = (kind: Ion['kind'], x: number, y: number, vx: number, vy: number, life: number) => {
      if (ions.length < 120) ions.push({ x, y, vx, vy, life, kind });
    };

    const draw = (now: number) => {
      const s = stateRef.current;
      const realDt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const dt = realDt * s.speed;
      t += dt;

      const ramp = 1 - Math.exp(-realDt / 0.1);
      shownDVm += (s.dVm - shownDVm) * ramp;
      shownE += (s.eNormal - shownE) * ramp;
      const dVm = shownDVm;
      const rate = BASE_RATE_HZ * Math.exp(dVm / NOISE_SIGMA_MV);

      // Poisson spike train at the polarization-dependent rate.
      if (dt > 0) {
        while (t >= nextSpikeAt) {
          spikes.push({ born: nextSpikeAt });
          traceSpikes.push(nextSpikeAt);
          nextSpikeAt += -Math.log(1 - rand() * 0.999) / rate;
        }
      } else {
        nextSpikeAt = Math.max(nextSpikeAt, t);
      }

      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

      // ---- Cortical background with layer bands -------------------------
      const bg = ctx.createLinearGradient(0, 0, 0, 240);
      bg.addColorStop(0, '#1A1220');
      bg.addColorStop(1, '#0B0F19');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, CANVAS_W, 240);
      ctx.fillStyle = 'rgba(244, 114, 182, 0.18)';
      ctx.fillRect(0, 0, CANVAS_W, 10);
      ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
      ctx.font = '9.5px ui-monospace, monospace';
      ctx.fillText('PIA', 4, 8);
      ctx.fillText('L I', 4, 30);
      ctx.fillText('L II/III', 4, 90);
      ctx.fillText('L V', 4, 160);
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.08)';
      ctx.beginPath();
      [45, 120, 200].forEach((y) => {
        ctx.moveTo(0, y);
        ctx.lineTo(170, y);
      });
      ctx.stroke();

      // ---- Radial E-field drift arrows (direction and density from En) ----
      const eMag = Math.abs(shownE);
      const inward = shownE >= 0;
      const lanes = 3;
      const arrowSpeed = 18 + eMag * 50; // px/s, proportional to field
      ctx.lineWidth = 1.2;
      for (let lane = 0; lane < lanes; lane++) {
        const x = 30 + lane * 58;
        for (let k = 0; k < 4; k++) {
          const phase = ((t * arrowSpeed + k * 55) % 220) / 220;
          const y = inward ? 12 + phase * 220 : 232 - phase * 220;
          const alpha = Math.min(1, eMag * 1.6) * 0.55 * Math.sin(Math.PI * phase);
          ctx.strokeStyle = inward ? `rgba(251, 146, 60, ${alpha})` : `rgba(56, 189, 248, ${alpha})`;
          ctx.beginPath();
          ctx.moveTo(x, y - (inward ? 8 : -8));
          ctx.lineTo(x, y);
          ctx.moveTo(x - 3, y - (inward ? 3 : -3));
          ctx.lineTo(x, y);
          ctx.lineTo(x + 3, y - (inward ? 3 : -3));
          ctx.stroke();
        }
      }

      // ---- Pyramidal neuron ------------------------------------------------
      // Radial field polarizes the cell as a dipole: soma follows ΔVm, the
      // distal apical tuft takes the opposite sign (Radman 2009).
      const tuft = -dVm * 0.8;
      const dendGrad = ctx.createLinearGradient(0, apicalTop, 0, somaY);
      dendGrad.addColorStop(0, polarColor(tuft));
      dendGrad.addColorStop(1, polarColor(dVm));
      ctx.strokeStyle = dendGrad;
      ctx.lineCap = 'round';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(somaX, somaY - 12);
      ctx.lineTo(somaX, apicalTop);
      ctx.stroke();
      ctx.lineWidth = 1.4;
      ctx.strokeStyle = polarColor(tuft, 0.9);
      ctx.beginPath();
      [[-26, -14], [24, -12], [-14, -24], [12, -22]].forEach(([dx, dy]) => {
        ctx.moveTo(somaX, apicalTop + 6);
        ctx.quadraticCurveTo(somaX + dx * 0.4, apicalTop + dy * 0.3, somaX + dx, apicalTop + dy);
      });
      [[-18, 70], [18, 90]].forEach(([dx, y]) => {
        ctx.moveTo(somaX, y);
        ctx.lineTo(somaX + dx, y - 14);
      });
      ctx.stroke();
      // Basal dendrites
      ctx.strokeStyle = polarColor(dVm, 0.85);
      ctx.beginPath();
      [[-30, 16], [30, 14], [-20, 26], [22, 28]].forEach(([dx, dy]) => {
        ctx.moveTo(somaX, somaY + 4);
        ctx.quadraticCurveTo(somaX + dx * 0.5, somaY + dy * 0.2, somaX + dx, somaY + dy);
      });
      ctx.stroke();

      // Soma glow scales with |ΔVm|
      const glow = Math.min(1, Math.abs(dVm) / 1.2);
      const sg = ctx.createRadialGradient(somaX, somaY, 2, somaX, somaY, 26);
      sg.addColorStop(0, polarColor(dVm, 0.55 * glow + 0.1));
      sg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = sg;
      ctx.fillRect(somaX - 30, somaY - 30, 60, 60);
      ctx.fillStyle = polarColor(dVm);
      ctx.beginPath();
      ctx.moveTo(somaX, somaY - 14);
      ctx.lineTo(somaX + 11, somaY + 8);
      ctx.lineTo(somaX - 11, somaY + 8);
      ctx.closePath();
      ctx.fill();

      // Axon to the synaptic terminal
      ctx.strokeStyle = 'rgba(203, 213, 225, 0.55)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(somaX, somaY + 8);
      ctx.lineTo(somaX, axonEndY - 30);
      ctx.quadraticCurveTo(somaX, axonEndY - 4, somaX + 40, axonEndY - 6);
      ctx.lineTo(syn.x + 30, axonEndY - 6);
      ctx.lineTo(syn.x + 30, syn.y + 34);
      ctx.stroke();

      const axonPoint = (u: number) => {
        // Piecewise: vertical, then horizontal, then up into the bouton.
        const seg1 = axonEndY - 6 - (somaY + 8);
        const seg2 = syn.x + 30 - somaX;
        const seg3 = axonEndY - 6 - (syn.y + 34);
        const total = seg1 + seg2 + seg3;
        let d = u * total;
        if (d < seg1) return [somaX, somaY + 8 + d];
        d -= seg1;
        if (d < seg2) return [somaX + d, axonEndY - 6];
        d -= seg2;
        return [syn.x + 30, axonEndY - 6 - d];
      };

      // Action potentials travelling down the axon
      for (let i = spikes.length - 1; i >= 0; i--) {
        const u = (t - spikes[i].born) / AXON_TRANSIT_S;
        if (u >= 1) {
          spikes.splice(i, 1);
          // Vesicle fusion → glutamate into the cleft.
          for (let k = 0; k < 5; k++) {
            spawnIon('glu', syn.x + 36 + (k - 2) * 7, syn.y + 44, (k - 2) * 2, 30 + k * 4, 1.1);
          }
          // Depolarized spine expels Mg²⁺ and admits Ca²⁺ (NMDA coincidence).
          if (dVm > 0 && rand() < Math.min(0.9, 0.35 + dVm * 0.5)) {
            mgBlocked = 0;
            spawnIon('mg', syn.x + 92, syn.y + 74, 26, -10, 0.9);
          }
          if (mgBlocked === 0 || dVm > 0) {
            const n = Math.max(1, Math.round(2 + dVm * 4));
            for (let k = 0; k < n; k++) {
              spawnIon('ca', syn.x + 86 + k * 3, syn.y + 70, (rand() - 0.5) * 20, 22 + rand() * 18, 1.4);
            }
          }
          continue;
        }
        if (u < 0) continue;
        const [x, y] = axonPoint(u);
        const ag = ctx.createRadialGradient(x, y, 0, x, y, 7);
        ag.addColorStop(0, 'rgba(253, 230, 138, 0.95)');
        ag.addColorStop(1, 'rgba(253, 230, 138, 0)');
        ctx.fillStyle = ag;
        ctx.fillRect(x - 7, y - 7, 14, 14);
      }
      // Mg²⁺ re-blocks the pore after it is expelled.
      if (mgBlocked === 0 && rand() < dt * 1.2) mgBlocked = 1;

      // ---- Synapse inset ----------------------------------------------------
      ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
      ctx.strokeStyle = 'rgba(100, 116, 139, 0.6)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(syn.x, syn.y, syn.w, syn.h, 8);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = 'rgba(148, 163, 184, 0.75)';
      ctx.font = '9.5px ui-monospace, monospace';
      ctx.fillText('SYNAPSE ×20k', syn.x + 6, syn.y + 11);

      // Presynaptic bouton with glutamate vesicles
      ctx.fillStyle = 'rgba(71, 85, 105, 0.55)';
      ctx.beginPath();
      ctx.ellipse(syn.x + 36, syn.y + 36, 26, 18, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(167, 243, 208, 0.85)';
      for (let k = 0; k < 6; k++) {
        ctx.beginPath();
        ctx.arc(syn.x + 22 + (k % 3) * 12, syn.y + 30 + Math.floor(k / 3) * 9, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Postsynaptic spine head and density
      ctx.fillStyle = polarColor(dVm, 0.35);
      ctx.beginPath();
      ctx.ellipse(syn.x + 70, syn.y + 92, 52, 16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(148, 163, 184, 0.35)';
      ctx.fillRect(syn.x + 18, syn.y + 74, 104, 3);

      // AMPA receptor count follows the plasticity direction (LTP inserts, LTD removes).
      const ampaTarget = Math.max(1, Math.min(9, Math.round(4 + dVm * 3.5)));
      ampa += (ampaTarget - ampa) * Math.min(1, dt * 0.8);
      const ampaShown = Math.round(ampa);
      for (let k = 0; k < ampaShown; k++) {
        const x = syn.x + 24 + k * 10;
        ctx.fillStyle = 'rgba(129, 140, 248, 0.95)';
        ctx.fillRect(x, syn.y + 70, 4, 8);
      }
      // NMDA receptor with Mg²⁺ plug
      const nx = syn.x + 112;
      ctx.fillStyle = 'rgba(244, 114, 182, 0.9)';
      ctx.fillRect(nx - 5, syn.y + 68, 3, 10);
      ctx.fillRect(nx + 2, syn.y + 68, 3, 10);
      if (mgBlocked) {
        ctx.fillStyle = 'rgba(226, 232, 240, 0.95)';
        ctx.beginPath();
        ctx.arc(nx, syn.y + 72, 2.6, 0, Math.PI * 2);
        ctx.fill();
      }

      // Ions
      for (let i = ions.length - 1; i >= 0; i--) {
        const ion = ions[i];
        ion.life -= dt;
        if (ion.life <= 0) {
          ions.splice(i, 1);
          continue;
        }
        ion.x += ion.vx * dt;
        ion.y += ion.vy * dt;
        if (ion.kind === 'glu' && ion.y > syn.y + 70) ion.vy = 0;
        ctx.fillStyle =
          ion.kind === 'glu' ? 'rgba(167, 243, 208, 0.9)' : ion.kind === 'ca' ? 'rgba(74, 222, 128, 0.95)' : 'rgba(226, 232, 240, 0.9)';
        ctx.beginPath();
        ctx.arc(ion.x, ion.y, ion.kind === 'glu' ? 1.6 : 2.2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Inset legend glyphs
      ctx.font = '9px ui-sans-serif, system-ui';
      const legend: Array<[string, string]> = [
        ['rgba(167, 243, 208, 0.9)', 'Glu'],
        ['rgba(129, 140, 248, 0.95)', 'AMPA'],
        ['rgba(244, 114, 182, 0.9)', 'NMDA'],
        ['rgba(74, 222, 128, 0.95)', 'Ca²⁺'],
        ['rgba(226, 232, 240, 0.95)', 'Mg²⁺']
      ];
      legend.forEach(([color, label], k) => {
        const x = syn.x + 6 + k * 26;
        ctx.fillStyle = color;
        ctx.fillRect(x, syn.y + syn.h - 9, 4, 4);
        ctx.fillStyle = 'rgba(148, 163, 184, 0.85)';
        ctx.fillText(label, x + 6, syn.y + syn.h - 5);
      });

      // ---- Somatic Vm trace (zoomed −74…−50 mV) -----------------------------
      noise += (-noise * 0.15) + (rand() - 0.5) * 0.9;
      traceAcc += dt;
      const sample = -70 + dVm + noise;
      while (traceAcc > 1 / 60) {
        traceAcc -= 1 / 60;
        trace[traceHead] = sample;
        traceHead = (traceHead + 1) % trace.length;
      }
      const vy = (v: number) => traceBox.y + traceBox.h - ((v + 74) / 24) * traceBox.h;
      ctx.fillStyle = '#080C14';
      ctx.fillRect(traceBox.x, traceBox.y, traceBox.w, traceBox.h);
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = 'rgba(251, 113, 133, 0.6)';
      ctx.beginPath();
      ctx.moveTo(traceBox.x, vy(-55));
      ctx.lineTo(traceBox.x + traceBox.w, vy(-55));
      ctx.stroke();
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.45)';
      ctx.beginPath();
      ctx.moveTo(traceBox.x, vy(-70));
      ctx.lineTo(traceBox.x + traceBox.w, vy(-70));
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = polarColor(dVm);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let k = 0; k < trace.length; k++) {
        const v = trace[(traceHead + k) % trace.length] || -70;
        const x = traceBox.x + (k / (trace.length - 1)) * traceBox.w;
        if (k === 0) ctx.moveTo(x, vy(v));
        else ctx.lineTo(x, vy(v));
      }
      ctx.stroke();
      // Spikes in the trace window, drawn as clipped upstrokes.
      ctx.strokeStyle = 'rgba(253, 230, 138, 0.9)';
      ctx.beginPath();
      const windowS = trace.length / 60;
      while (traceSpikes.length && t - traceSpikes[0] > windowS) traceSpikes.shift();
      traceSpikes.forEach((born) => {
        const age = t - born;
        const x = traceBox.x + traceBox.w - (age / windowS) * traceBox.w;
        if (x > traceBox.x) {
          ctx.moveTo(x, vy(-70 + dVm));
          ctx.lineTo(x, traceBox.y + 1);
        }
      });
      ctx.stroke();
      ctx.fillStyle = 'rgba(148, 163, 184, 0.8)';
      ctx.font = '9px ui-monospace, monospace';
      ctx.fillText('threshold −55', traceBox.x + 3, vy(-55) - 2);
      ctx.fillText('rest −70', traceBox.x + 3, vy(-70) + 8);

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [scale]);

  const { dVm, rateHz, eNormal } = physics;
  const rateChangePct = (rateHz / BASE_RATE_HZ - 1) * 100;
  const depol = dVm >= 0;
  const plasticity = Math.abs(dVm) < 0.1 ? 'None' : depol ? 'LTP-like' : 'LTD-like';

  return (
    <div className="custom-scrollbar flex h-full min-h-0 flex-col gap-3 overflow-y-auto p-3 [&>*]:shrink-0">
      <div className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2">
          <Microscope className="h-5 w-5 shrink-0 text-emerald-300" />
          <span className="truncate text-[15px] font-semibold text-slate-100">
            Layer V pyramidal neuron · {node.shortName}
          </span>
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        <TargetButton
          active={activeTarget === 'anode'}
          onClick={() => setTarget('anode')}
          label={`${anodeId} +`}
          tone="anode"
        />
        <TargetButton
          active={activeTarget === 'cathode'}
          onClick={() => setTarget('cathode')}
          label={`${returnId} −`}
          tone="cathode"
          disabled={!cathodeHasCortex}
          title={cathodeHasCortex ? undefined : 'The return electrode is off the head: no cortex beneath it'}
        />
        <span className="ml-auto font-mono text-[13px] text-slate-500">
          E<sub>n</sub> <span className="text-slate-300">{eNormal >= 0 ? '+' : ''}{eNormal.toFixed(2)}</span> V/m
        </span>
      </div>

      <div
        ref={frameRef}
        className="shrink-0 overflow-hidden rounded-xl border border-slate-700/80 bg-[#05080F] shadow-inner"
      >
        <canvas
          ref={canvasRef}
          style={{ width: CANVAS_W * scale, height: CANVAS_H * scale }}
          className="block"
          aria-label={`Layer V pyramidal neuron under ${node.shortName}: membrane shift ${dVm.toFixed(2)} millivolts, firing ${rateChangePct >= 0 ? 'up' : 'down'} ${Math.abs(rateChangePct).toFixed(0)} percent`}
          role="img"
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Readout
          label="ΔVm soma"
          value={`${dVm >= 0 ? '+' : ''}${dVm.toFixed(2)}`}
          unit="mV"
          tone={depol ? 'text-orange-300' : 'text-cyan-300'}
        />
        <Readout
          label="Firing rate"
          value={`${rateChangePct >= 0 ? '▲' : '▼'} ${Math.abs(rateChangePct).toFixed(0)}`}
          unit="%"
          tone={rateChangePct >= 0 ? 'text-amber-300' : 'text-cyan-300'}
        />
        <Readout
          label="Plasticity"
          value={plasticity}
          unit=""
          tone={plasticity === 'LTP-like' ? 'text-emerald-300' : plasticity === 'LTD-like' ? 'text-violet-300' : 'text-slate-300'}
        />
      </div>

      <p className="text-[13px] leading-relaxed text-slate-400">
        The field shifts the resting membrane by a fraction of a millivolt. That small shift changes how often the neuron
        fires on its own: ×{(rateHz / BASE_RATE_HZ).toFixed(2)} at {rateHz.toFixed(1)} Hz versus {BASE_RATE_HZ} Hz at rest.
        Spikes travel down the axon to the synapse, where glutamate opens AMPA and, once Mg²⁺ leaves, NMDA channels.
      </p>
    </div>
  );
};

const Readout: React.FC<{ label: string; value: string; unit: string; tone: string }> = ({ label, value, unit, tone }) => (
  <div className="rounded-lg border border-slate-800 bg-slate-950/70 px-2.5 py-2">
    <div className="text-[12px] text-slate-500">{label}</div>
    <div className={`font-mono text-[14px] font-semibold ${tone}`}>
      {value}
      {unit && <span className="ml-0.5 text-[12px] font-normal text-slate-500">{unit}</span>}
    </div>
  </div>
);

const TargetButton: React.FC<{
  active: boolean;
  onClick: () => void;
  label: string;
  tone: 'anode' | 'cathode';
  disabled?: boolean;
  title?: string;
}> = ({ active, onClick, label, tone, disabled, title }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title ?? `Inspect cortex under ${label}`}
    aria-pressed={active}
    className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 font-mono text-[13.5px] transition disabled:cursor-not-allowed disabled:opacity-40 ${
      active
        ? tone === 'anode'
          ? 'border-orange-400/50 bg-orange-500/15 text-orange-200'
          : 'border-cyan-400/50 bg-cyan-500/15 text-cyan-200'
        : 'border-slate-700 bg-slate-900 text-slate-400 hover:text-slate-200'
    }`}
  >
    <span className={`h-2 w-2 rounded-full ${tone === 'anode' ? 'bg-orange-400' : 'bg-cyan-400'}`} />
    {label}
  </button>
);

export default NeuronalMagnifyingLens;
