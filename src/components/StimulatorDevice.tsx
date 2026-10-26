import React, { useEffect, useRef, useState } from 'react';
import { BatteryMedium, ChevronDown, ChevronUp, Droplets, Play, Pause, RotateCcw, Square } from 'lucide-react';

interface StimulatorDeviceProps {
  anodeId: string;
  cathodeId: string;
  currentMa: number;
  durationMin: number;
  padAreaCm2: number;
  montageType: 'sponge' | 'hd4x1';
  onChangeMa: (ma: number) => void;
}

type Phase = 'ready' | 'rampUp' | 'stim' | 'rampDown' | 'done' | 'aborted';

// Device constants, typical of research DC stimulators.
const RAMP_S = 30;
const COMPLIANCE_V = 26;
const BODY_KOHM = 1.1; // scalp, skull and brain bulk path
const SALINE_KOHM_CM2 = 55; // sponge–skin contact, specific impedance
const GEL_KOHM_CM2 = 18; // HD gel electrode contact
const SPEEDS = [1, 10, 60];

const PHASE_LABEL: Record<Phase, string> = {
  ready: 'READY',
  rampUp: 'RAMP UP',
  stim: 'STIMULATING',
  rampDown: 'RAMP DOWN',
  done: 'SESSION COMPLETE',
  aborted: 'STOPPED'
};

interface SimState {
  phase: Phase;
  t: number; // session seconds
  rampDownFrom: number; // mA at the start of an early ramp-down
  rampDownAt: number;
  ma: number; // delivered current
  z: number; // kΩ
  volts: number;
  chargeC: number;
  limited: boolean;
  trace: Array<[number, number]>;
}

const fresh = (): SimState => ({
  phase: 'ready',
  t: 0,
  rampDownFrom: 0,
  rampDownAt: 0,
  ma: 0,
  z: 0,
  volts: 0,
  chargeC: 0,
  limited: false,
  trace: []
});

/** Total electrode–body impedance in kΩ (contact settles as saline soaks in). */
function impedanceKohm(padAreaCm2: number, montageType: 'sponge' | 'hd4x1', t: number, dry: boolean) {
  const contact =
    montageType === 'hd4x1'
      ? GEL_KOHM_CM2 / 3.14 + GEL_KOHM_CM2 / 3.14 / 4 // centre + four returns in parallel
      : (2 * SALINE_KOHM_CM2) / Math.max(4, padAreaCm2);
  const settling = 1 + 0.4 * Math.exp(-t / 120);
  return BODY_KOHM + contact * settling * (dry ? 5 : 1);
}

const fmtTime = (s: number) => {
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
};

/**
 * A DC stimulator front panel driven by the session's dose: 30 s ramps, a
 * constant-current plateau, Ohm's-law electrode voltage against a 26 V
 * compliance limit, impedance settling, and integrated charge.
 */
export const StimulatorDevice: React.FC<StimulatorDeviceProps> = ({
  anodeId,
  cathodeId,
  currentMa,
  durationMin,
  padAreaCm2,
  montageType,
  onChangeMa
}) => {
  const sim = useRef<SimState>(fresh());
  const [view, setView] = useState<SimState>(fresh());
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(10);
  const [dry, setDry] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const totalS = RAMP_S + durationMin * 60 + RAMP_S;
  const live = useRef({ currentMa, durationMin, padAreaCm2, montageType, running, speed, dry, totalS });
  live.current = { currentMa, durationMin, padAreaCm2, montageType, running, speed, dry, totalS };

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let sinceView = 0;

    const step = (now: number) => {
      const dtReal = Math.min(0.1, (now - last) / 1000);
      last = now;
      const L = live.current;
      const s = sim.current;
      const active = L.running && (s.phase === 'rampUp' || s.phase === 'stim' || s.phase === 'rampDown');
      const dt = active ? dtReal * L.speed : 0;

      if (active) {
        s.t += dt;
        const plateauEnd = RAMP_S + L.durationMin * 60;
        if (s.phase !== 'rampDown' && s.t >= plateauEnd) {
          s.phase = 'rampDown';
          s.rampDownAt = plateauEnd;
          s.rampDownFrom = L.currentMa;
        } else if (s.phase === 'rampUp' && s.t >= RAMP_S) {
          s.phase = 'stim';
        }
      }

      let target = 0;
      if (s.phase === 'rampUp') target = L.currentMa * Math.min(1, s.t / RAMP_S);
      else if (s.phase === 'stim') target = L.currentMa;
      else if (s.phase === 'rampDown') {
        target = s.rampDownFrom * Math.max(0, 1 - (s.t - s.rampDownAt) / RAMP_S);
        if (target <= 0) {
          s.phase = s.rampDownAt < RAMP_S + L.durationMin * 60 - 1 ? 'aborted' : 'done';
          setRunning(false);
        }
      }

      s.z = impedanceKohm(L.padAreaCm2, L.montageType, s.t, L.dry);
      // Constant-current source until the electrode voltage hits compliance.
      const maxMa = COMPLIANCE_V / s.z;
      s.limited = target > maxMa + 1e-6;
      s.ma = Math.min(target, maxMa);
      s.volts = s.ma * s.z;
      s.chargeC += (s.ma / 1000) * dt;
      if (active) {
        const lastPoint = s.trace[s.trace.length - 1];
        if (!lastPoint || s.t - lastPoint[0] >= L.totalS / 600) s.trace.push([s.t, s.ma]);
      }

      drawTrace(canvasRef.current, s, L.currentMa, L.durationMin, L.totalS);

      sinceView += dtReal;
      if (sinceView > 0.08) {
        sinceView = 0;
        setView({ ...s });
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);

  const start = () => {
    const s = sim.current;
    if (s.phase === 'ready' || s.phase === 'done' || s.phase === 'aborted') {
      sim.current = { ...fresh(), phase: 'rampUp' };
    }
    setRunning(true);
  };
  const abort = () => {
    const s = sim.current;
    if (s.phase === 'rampUp' || s.phase === 'stim') {
      s.phase = 'rampDown';
      s.rampDownAt = s.t;
      s.rampDownFrom = s.ma;
      setRunning(true);
    }
  };
  const reset = () => {
    sim.current = fresh();
    setRunning(false);
  };

  const { phase } = view;
  const isActive = phase === 'rampUp' || phase === 'stim' || phase === 'rampDown';
  const remaining = Math.max(0, totalS - view.t);
  const zTone = view.z < 10 ? 'text-emerald-300' : view.z < 20 ? 'text-amber-300' : 'text-rose-300';
  const contactOk = view.z < 20;
  const returnLabel = montageType === 'hd4x1' ? 'HD ring' : cathodeId;
  const screenAccent = view.limited ? '#FB7185' : phase === 'stim' ? '#5EEAD4' : '#7DD3FC';

  return (
    <div className="custom-scrollbar flex h-full min-h-0 flex-col gap-4 overflow-y-auto p-3 [&>*]:shrink-0">
      {/* Device body */}
      <div
        className="relative rounded-[22px] p-4 shadow-[0_18px_40px_-12px_rgba(0,0,0,0.65)]"
        style={{
          background: 'linear-gradient(160deg, #3A4049 0%, #252A31 38%, #1A1E24 100%)',
          boxShadow:
            'inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -2px 0 rgba(0,0,0,0.5), 0 18px 40px -12px rgba(0,0,0,0.6)'
        }}
      >
        {[
          'left-2.5 top-2.5',
          'right-2.5 top-2.5',
          'left-2.5 bottom-2.5',
          'right-2.5 bottom-2.5'
        ].map((pos) => (
          <span
            key={pos}
            className={`absolute ${pos} h-2.5 w-2.5 rounded-full`}
            style={{ background: 'radial-gradient(circle at 35% 35%, #8B95A3, #3B424C 70%)' }}
          />
        ))}

        <div className="mb-3 flex items-center justify-between px-1">
          <div>
            <div className="text-[13px] font-semibold tracking-[0.18em] text-[#C9D1DB]">NEUROFLOW</div>
            <div className="text-[11px] tracking-[0.2em] text-[#8B95A3]">DC STIMULATOR · CH 1</div>
          </div>
          <div className="flex items-center gap-3">
            <Led on color="#34D399" label="PWR" />
            <Led on={isActive} color="#FBBF24" label="STIM" />
            <Led on color={contactOk ? '#34D399' : '#F43F5E'} label="CONTACT" />
          </div>
        </div>

        {/* Screen */}
        <div
          className="relative overflow-hidden rounded-xl border-[3px] border-[#0B0D10] p-3 font-mono"
          style={{
            background: 'radial-gradient(ellipse at 30% 0%, #0E1B24 0%, #071017 55%, #04080C 100%)',
            boxShadow: 'inset 0 0 24px rgba(0,0,0,0.9)'
          }}
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: 'linear-gradient(115deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0) 38%)' }}
          />
          <div className="flex items-center justify-between text-[12px]">
            <span
              className="rounded px-1.5 py-0.5 font-semibold tracking-wider"
              style={{ color: screenAccent, background: `${screenAccent}1F` }}
            >
              {view.limited ? 'COMPLIANCE LIMIT' : PHASE_LABEL[phase]}
            </span>
            <span className="flex items-center gap-1.5 text-[#6B8A99]">
              <BatteryMedium className="h-4 w-4" />
              86%
            </span>
          </div>

          <div className="mt-2 flex items-end justify-between">
            <div>
              <div
                className="text-[46px] font-semibold leading-none tracking-tight"
                style={{ color: screenAccent, textShadow: `0 0 18px ${screenAccent}88` }}
              >
                {view.ma.toFixed(3)}
              </div>
              <div className="mt-1 text-[12px] text-[#6B8A99]">
                mA delivered · set <span className="text-[#B6D4E0]">{currentMa.toFixed(1)} mA</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[24px] leading-none text-[#D7E6EE]">{fmtTime(isActive || phase === 'done' ? remaining : totalS)}</div>
              <div className="mt-1 text-[12px] text-[#6B8A99]">remaining · {fmtTime(view.t)} elapsed</div>
            </div>
          </div>

          <canvas ref={canvasRef} className="mt-3 block h-[92px] w-full" aria-label="Delivered current over the session" />

          <div className="mt-2 grid grid-cols-3 gap-2 text-[12px]">
            <ScreenStat label="Impedance" value={`${view.z.toFixed(1)} kΩ`} tone={zTone} />
            <ScreenStat
              label={`Voltage / ${COMPLIANCE_V} V`}
              value={`${view.volts.toFixed(1)} V`}
              tone={view.limited ? 'text-rose-300' : 'text-sky-200'}
            />
            <ScreenStat label="Charge" value={`${(view.chargeC * 1000).toFixed(0)} mC`} tone="text-violet-200" />
          </div>
        </div>

        {/* Controls */}
        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <DeviceKey
              title="Lower the set current by 0.1 mA"
              onClick={() => onChangeMa(Math.max(0.5, Math.round((currentMa - 0.1) * 10) / 10))}
            >
              <ChevronDown className="h-5 w-5" />
            </DeviceKey>
            <DeviceKey
              title="Raise the set current by 0.1 mA"
              onClick={() => onChangeMa(Math.min(4, Math.round((currentMa + 0.1) * 10) / 10))}
            >
              <ChevronUp className="h-5 w-5" />
            </DeviceKey>
          </div>

          <button
            type="button"
            onClick={isActive && running ? () => setRunning(false) : start}
            title={isActive && running ? 'Pause the session clock' : 'Start or resume stimulation'}
            className="flex h-16 w-16 items-center justify-center rounded-full text-[#fff] transition active:scale-95"
            style={{
              background: isActive && running
                ? 'radial-gradient(circle at 35% 30%, #FCD34D, #D97706 70%)'
                : 'radial-gradient(circle at 35% 30%, #6EE7B7, #059669 70%)',
              boxShadow: '0 0 0 4px #14171C, 0 0 0 6px #3A4049, 0 6px 16px rgba(0,0,0,0.5)'
            }}
          >
            {isActive && running ? <Pause className="h-7 w-7" /> : <Play className="h-7 w-7 translate-x-0.5" />}
          </button>

          <div className="flex items-center gap-2">
            <DeviceKey title="Stop: ramp the current down over 30 s" onClick={abort} tone="stop">
              <Square className="h-4 w-4" />
            </DeviceKey>
            <DeviceKey title="Reset the session" onClick={reset}>
              <RotateCcw className="h-4 w-4" />
            </DeviceKey>
          </div>
        </div>

        {/* Output jacks and leads */}
        <div className="mt-4 flex items-end justify-center gap-10">
          <Jack color="#EF4444" sign="+" label={`Anode · ${anodeId}`} />
          <Jack color="#1F2937" ring="#9CA3AF" sign="−" label={`Return · ${returnLabel}`} />
        </div>
      </div>

      {/* Bench controls */}
      <div className="panel-card space-y-3 p-3">
        <div className="flex items-center justify-between">
          <span className="text-[13.5px] font-medium text-slate-300">Clock speed</span>
          <div className="flex gap-1 rounded-lg border border-slate-800 bg-slate-950/50 p-1">
            {SPEEDS.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setSpeed(value)}
                aria-pressed={speed === value}
                className={`rounded-md px-2.5 py-1 font-mono text-[13px] transition ${
                  speed === value ? 'bg-cyan-500/15 text-cyan-200' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {value}×
              </button>
            ))}
          </div>
        </div>
        <label className="flex cursor-pointer items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-[13.5px] text-slate-300">
            <Droplets className="h-4 w-4 text-sky-300" />
            Simulate a dry sponge
          </span>
          <input type="checkbox" checked={dry} onChange={(e) => setDry(e.target.checked)} className="h-4 w-4 accent-cyan-500" />
        </label>
        <p className="text-[13px] leading-relaxed text-slate-400">
          The device holds the current constant, so the voltage it needs follows Ohm&apos;s law (V = I × R). A dry or
          poorly wetted pad raises the resistance until the voltage hits the {COMPLIANCE_V} V ceiling, and the device can no
          longer deliver the set current.
        </p>
      </div>
    </div>
  );
};

function drawTrace(canvas: HTMLCanvasElement | null, s: SimState, setMa: number, durationMin: number, totalS: number) {
  if (!canvas) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (canvas.width !== Math.round(w * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  const maxMa = Math.max(2.5, setMa * 1.15);
  const x = (t: number) => (t / totalS) * w;
  const y = (ma: number) => h - 6 - (ma / maxMa) * (h - 14);

  // Grid
  ctx.strokeStyle = 'rgba(125, 211, 252, 0.08)';
  ctx.lineWidth = 1;
  for (let k = 1; k < 4; k++) {
    ctx.beginPath();
    ctx.moveTo(0, (h / 4) * k);
    ctx.lineTo(w, (h / 4) * k);
    ctx.stroke();
  }

  // Planned trapezoid
  const plateauEnd = RAMP_S + durationMin * 60;
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.45)';
  ctx.beginPath();
  ctx.moveTo(x(0), y(0));
  ctx.lineTo(x(RAMP_S), y(setMa));
  ctx.lineTo(x(plateauEnd), y(setMa));
  ctx.lineTo(x(totalS), y(0));
  ctx.stroke();
  ctx.setLineDash([]);

  // Delivered current
  if (s.trace.length > 1) {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, 'rgba(94, 234, 212, 0.35)');
    grad.addColorStop(1, 'rgba(94, 234, 212, 0)');
    ctx.beginPath();
    ctx.moveTo(x(s.trace[0][0]), y(0));
    s.trace.forEach(([t, ma]) => ctx.lineTo(x(t), y(ma)));
    ctx.lineTo(x(s.trace[s.trace.length - 1][0]), y(0));
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.beginPath();
    s.trace.forEach(([t, ma], i) => (i ? ctx.lineTo(x(t), y(ma)) : ctx.moveTo(x(t), y(ma))));
    ctx.strokeStyle = s.limited ? '#FB7185' : '#5EEAD4';
    ctx.lineWidth = 2;
    ctx.shadowColor = ctx.strokeStyle;
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // Playhead
  if (s.t > 0) {
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.moveTo(x(s.t), 0);
    ctx.lineTo(x(s.t), h);
    ctx.stroke();
  }

  ctx.fillStyle = 'rgba(107, 138, 153, 0.9)';
  ctx.font = '10px "IBM Plex Mono", monospace';
  ctx.fillText(`${maxMa.toFixed(1)} mA`, 4, 10);
  ctx.fillText('0', 4, h - 8);
}

const Led: React.FC<{ on: boolean; color: string; label: string }> = ({ on, color, label }) => (
  <span className="flex flex-col items-center gap-1">
    <span
      className="h-2.5 w-2.5 rounded-full"
      style={{
        background: on ? color : '#2B3038',
        boxShadow: on ? `0 0 8px ${color}, 0 0 2px ${color}` : 'inset 0 1px 1px rgba(0,0,0,0.6)'
      }}
    />
    <span className="text-[9.5px] tracking-wider text-[#8B95A3]">{label}</span>
  </span>
);

const ScreenStat: React.FC<{ label: string; value: string; tone: string }> = ({ label, value, tone }) => (
  <div className="rounded-md border border-[#12222C] bg-[#08131A] px-2 py-1.5">
    <div className="text-[10.5px] uppercase tracking-wider text-[#56717F]">{label}</div>
    <div className={`mt-0.5 text-[14px] font-semibold ${tone}`}>{value}</div>
  </div>
);

const DeviceKey: React.FC<{ title: string; onClick: () => void; tone?: 'stop'; children: React.ReactNode }> = ({
  title,
  onClick,
  tone,
  children
}) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    aria-label={title}
    className="flex h-11 w-11 items-center justify-center rounded-xl transition active:translate-y-px"
    style={{
      color: tone === 'stop' ? '#FDA4AF' : '#C9D1DB',
      background: 'linear-gradient(180deg, #3A414B 0%, #2A2F37 100%)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12), 0 2px 0 #0F1216, 0 4px 8px rgba(0,0,0,0.35)'
    }}
  >
    {children}
  </button>
);

const Jack: React.FC<{ color: string; ring?: string; sign: string; label: string }> = ({ color, ring, sign, label }) => (
  <div className="flex flex-col items-center gap-1.5">
    <span className="text-[13px] font-bold text-[#C9D1DB]">{sign}</span>
    <span
      className="flex h-9 w-9 items-center justify-center rounded-full"
      style={{ background: color, boxShadow: `0 0 0 3px ${ring ?? '#7F1D1D'}, inset 0 2px 4px rgba(0,0,0,0.5)` }}
    >
      <span className="h-3 w-3 rounded-full bg-[#0B0D10]" />
    </span>
    <svg width="14" height="26" viewBox="0 0 14 26" aria-hidden>
      <path d="M7 0 C7 10, 2 14, 7 26" stroke={color === '#1F2937' ? '#6B7280' : color} strokeWidth="3" fill="none" />
    </svg>
    <span className="font-mono text-[11.5px] text-[#9AA4B1]">{label}</span>
  </div>
);

export default StimulatorDevice;
