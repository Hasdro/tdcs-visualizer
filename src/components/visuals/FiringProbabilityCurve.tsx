import React from 'react';

interface FiringProbabilityCurveProps {
  isAnode: boolean;
  currentMa: number;
  maxMembraneShiftMv: number;
}

export const FiringProbabilityCurve: React.FC<FiringProbabilityCurveProps> = ({
  isAnode,
  currentMa,
  maxMembraneShiftMv
}) => {
  // Baseline resting potential is -70 mV, threshold is -55 mV
  // Shift moves curve center: Anode (+0.8 mV -> +1.5 mV), Cathode (-0.8 mV -> -1.5 mV)
  const dVm = isAnode ? maxMembraneShiftMv : -maxMembraneShiftMv;
  const firingProbPct = isAnode
    ? Math.round(25 + (maxMembraneShiftMv / 1.5) * 35)
    : Math.round(Math.max(6, 25 - (maxMembraneShiftMv / 1.5) * 16));

  // Gaussian Curve generation on a 200x80 canvas
  // Center mu shifts with dVm. Baseline mu = 90
  const mu = 90 + dVm * 18;
  const sigma = 22;

  const points: { x: number; y: number }[] = [];
  for (let x = 20; x <= 180; x += 2) {
    const exponent = -Math.pow(x - mu, 2) / (2 * Math.pow(sigma, 2));
    const yVal = Math.exp(exponent) * 58;
    points.push({ x, y: 72 - yVal });
  }

  const curvePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  // Threshold line is at x = 115 (-55 mV)
  const thresholdX = 115;
  // Shaded firing zone: points where x >= thresholdX
  const firingPoints = points.filter((p) => p.x >= thresholdX);
  const firingAreaPath = firingPoints.length > 0
    ? `M ${thresholdX} 72 L ${thresholdX} ${firingPoints[0].y} ` +
      firingPoints.map((p) => `L ${p.x} ${p.y}`).join(' ') +
      ` L ${firingPoints[firingPoints.length - 1].x} 72 Z`
    : '';

  return (
    <div className="bg-[#0C121E]/95 border border-slate-800/90 rounded-xl p-3 shadow-xl select-none font-mono text-xs">
      <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/60 text-[11px]">
        <span className="font-bold text-slate-200 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          ACTION POTENTIAL FIRING PROBABILITY
        </span>
        <span className={`text-[10px] font-bold ${isAnode ? 'text-emerald-400' : 'text-cyan-400'}`}>
          {isAnode ? `↑ +${firingProbPct}% (Facilitated)` : `↓ -${25 - firingProbPct}% (Depressed)`}
        </span>
      </div>

      <div className="my-2 flex justify-center">
        <svg viewBox="0 0 200 85" className="w-full h-24 overflow-visible">
          {/* Base Voltage Axis */}
          <line x1="15" y1="72" x2="185" y2="72" stroke="#1E293B" strokeWidth="1.2" />

          {/* Action Potential Threshold Line (-55 mV) */}
          <line x1={thresholdX} y1="8" x2={thresholdX} y2="72" stroke="#EF4444" strokeWidth="1.2" strokeDasharray="3 3" />
          <text x={thresholdX} y="6" fill="#EF4444" fontSize="6.5" textAnchor="middle" fontWeight="bold">-55mV THRESHOLD</text>

          {/* Shaded Firing Zone (Area under curve above threshold) */}
          {firingAreaPath && (
            <path
              d={firingAreaPath}
              fill={isAnode ? '#10B981' : '#06B6D4'}
              opacity="0.45"
              className="animate-pulse"
            />
          )}

          {/* Gaussian Bell Curve */}
          <path
            d={curvePath}
            fill="none"
            stroke={isAnode ? '#34D399' : '#38BDF8'}
            strokeWidth="2"
            className="transition-all duration-300"
          />

          {/* Resting Potential Marker */}
          <circle cx={mu} cy="14" r="3" fill="#F59E0B" />
          <text x={mu} y="22" fill="#FBBF24" fontSize="6" textAnchor="middle">Vrest</text>
        </svg>
      </div>

      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/60">
        <span>At {currentMa.toFixed(1)} mA — Synaptic Noise Distribution</span>
        <span className="text-emerald-300 font-bold">{firingProbPct}% Firing Pool</span>
      </div>
    </div>
  );
};
