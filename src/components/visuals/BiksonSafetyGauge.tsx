import React from 'react';
import { BiophysicalTelemetry } from '../../utils/biophysicsEngine';

interface BiksonSafetyGaugeProps {
  telemetry: BiophysicalTelemetry;
}

export const BiksonSafetyGauge: React.FC<BiksonSafetyGaugeProps> = ({ telemetry }) => {
  const J = telemetry.currentDensityMaCm2;
  // Maximum gauge scale at 0.30 mA/cm²
  const maxJ = 0.30;
  const clampedJ = Math.max(0, Math.min(maxJ, J));

  // Needle angle: 180 degree semi-circle from -90 deg (left, 0.0) to +90 deg (right, 0.30)
  const angleDeg = -90 + (clampedJ / maxJ) * 180;
  const angleRad = (angleDeg * Math.PI) / 180;

  // Gauge dimensions
  const cx = 110;
  const cy = 100;
  const rOuter = 82;
  const rInner = 68;
  const needleLength = 65;

  // Arc path generator helper (angles in degrees: -90 = left, 0 = top, 90 = right)
  const describeArc = (startAngleDeg: number, endAngleDeg: number, rOut: number, rIn: number) => {
    const toRad = (d: number) => ((d - 90) * Math.PI) / 180;
    const a1 = toRad(startAngleDeg);
    const a2 = toRad(endAngleDeg);

    const x1Out = cx + rOut * Math.cos(a1);
    const y1Out = cy + rOut * Math.sin(a1);
    const x2Out = cx + rOut * Math.cos(a2);
    const y2Out = cy + rOut * Math.sin(a2);

    const x1In = cx + rIn * Math.cos(a2);
    const y1In = cy + rIn * Math.sin(a2);
    const x2In = cx + rIn * Math.cos(a1);
    const y2In = cy + rIn * Math.sin(a1);

    const largeArcFlag = endAngleDeg - startAngleDeg <= 180 ? 0 : 1;

    return `M ${x1Out} ${y1Out} A ${rOut} ${rOut} 0 ${largeArcFlag} 1 ${x2Out} ${y2Out} L ${x1In} ${y1In} A ${rIn} ${rIn} 0 ${largeArcFlag} 0 ${x2In} ${y2In} Z`;
  };

  // Bikson 2016 safety factor: upper lesion threshold consensus is ~0.25 mA/cm²
  const consensusCeiling = 0.25;
  const safetyMultiple = J > 0 ? (consensusCeiling / J).toFixed(1) : '∞';

  // Zone percentages mapped to 180 degrees (from 0 to 180):
  // Green: 0.00 to 0.08 -> 0 to (0.08/0.30)*180 = 48°
  // Amber: 0.08 to 0.15 -> 48° to 90°
  // Orange: 0.15 to 0.25 -> 90° to 150°
  // Red: 0.25 to 0.30 -> 150° to 180°
  const greenArc = describeArc(0, 48, rOuter, rInner);
  const amberArc = describeArc(49, 90, rOuter, rInner);
  const orangeArc = describeArc(91, 150, rOuter, rInner);
  const redArc = describeArc(151, 180, rOuter, rInner);

  // Needle tip
  const needleTipX = cx + needleLength * Math.sin(angleRad);
  const needleTipY = cy - needleLength * Math.cos(angleRad);

  return (
    <div className="panel-card relative overflow-hidden">
      {/* Top Header */}
      <div className="flex items-start justify-between gap-2 border-b border-slate-800/70 px-3 py-2.5">
        <span className="flex items-center gap-2 text-[14px] font-semibold leading-snug tracking-tight text-slate-100">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Safety gauge
        </span>
        <span
          className={`shrink-0 rounded border px-1.5 py-0.5 text-[13px] font-semibold transition ${
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

      {/* SVG Arc Gauge */}
      <div className="relative flex items-center justify-center py-1">
        <svg viewBox="0 0 220 120" className="w-56 h-auto drop-shadow-md">
          {/* Subtle Outer Track */}
          <path d={describeArc(0, 180, rOuter + 2, rInner - 2)} fill="#111827" />

          {/* Calibrated Clinical Zones */}
          <path d={greenArc} fill="#10B981" opacity="0.85" className="transition hover:opacity-100" />
          <path d={amberArc} fill="#F59E0B" opacity="0.85" className="transition hover:opacity-100" />
          <path d={orangeArc} fill="#F97316" opacity="0.85" className="transition hover:opacity-100" />
          <path d={redArc} fill="#EF4444" opacity="0.85" className="transition hover:opacity-100" />

          {/* Tick Marks & Scale Numbers */}
          <text x="24" y="104" fill="#94A3B8" fontSize="9.2" fontFamily="monospace" textAnchor="middle">0</text>
          <text x="56" y="44" fill="#10B981" fontSize="9.2" fontFamily="monospace" textAnchor="middle">0.08</text>
          <text x="110" y="24" fill="#F59E0B" fontSize="9.2" fontFamily="monospace" textAnchor="middle">0.15</text>
          <text x="166" y="44" fill="#F97316" fontSize="9.2" fontFamily="monospace" textAnchor="middle">0.25</text>
          <text x="198" y="104" fill="#EF4444" fontSize="9.2" fontFamily="monospace" textAnchor="middle">0.3+</text>

          {/* Needle Indicator */}
          <line
            x1={cx}
            y1={cy}
            x2={needleTipX}
            y2={needleTipY}
            stroke="#F8FAFC"
            strokeWidth="2.5"
            strokeLinecap="round"
            className="transition-all duration-300 ease-out drop-shadow"
          />
          {/* Needle Center Hub */}
          <circle cx={cx} cy={cy} r="6" fill="#0F172A" stroke="#38BDF8" strokeWidth="2" />
          <circle cx={cx} cy={cy} r="2.5" fill="#38BDF8" />
        </svg>

        {/* Digital Readout In Center Hub */}
        <div className="absolute bottom-1 text-center">
          <div className="text-sm font-bold text-slate-100">
            {J.toFixed(4)} <span className="text-[13px] text-slate-400 font-normal">mA/cm²</span>
          </div>
          <div className="text-[13px] text-emerald-400 font-semibold mt-0.5">
            {Number(safetyMultiple) > 1 ? `${safetyMultiple}× below threshold` : '⚠️ Boundary limit'}
          </div>
        </div>
      </div>

      {/* Legend & Safety Consensus Details */}
      <div className="grid grid-cols-2 gap-1.5 border-t border-slate-800/60 px-3 pb-3 pt-2 text-[13px]">
        <div className="flex items-center gap-1.5 text-slate-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>Consensus safe</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-400">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          <span>Erythema limit</span>
        </div>
      </div>
    </div>
  );
};
