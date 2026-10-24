import React from 'react';

interface ReactionTimeRaceTrackProps {
  motorScore: number;
}

export const ReactionTimeRaceTrack: React.FC<ReactionTimeRaceTrackProps> = ({ motorScore }) => {
  // Baseline reaction time is 410 ms
  const baselineMs = 410;
  // Motor stimulation accelerates initiation by up to 35 ms
  const deltaMs = Math.round(Math.min(38, Math.max(0, (motorScore / 100) * 35)));
  const stimulatedMs = baselineMs - deltaMs;

  return (
    <div className="panel-card select-none p-3 text-xs">
      <div className="flex items-start justify-between gap-2 border-b border-slate-800/70 pb-2">
        <span className="flex items-center gap-2 text-[12px] font-semibold leading-snug tracking-tight text-slate-100">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          Reaction time
        </span>
        <span className="text-[11px] text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-800/60 px-1.5 py-0.5 rounded">
          ⚡ <span className="font-mono">{deltaMs}</span> ms faster initiation
        </span>
      </div>

      <div className="space-y-2 mt-2.5">
        {/* Track 1: Baseline */}
        <div>
          <div className="flex justify-between text-[11px] text-slate-400 mb-1">
            <span>Normative baseline</span>
            <span className="font-mono">{baselineMs} ms</span>
          </div>
          <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800 p-0.5">
            <div className="h-full bg-slate-500/70 rounded-full" style={{ width: '100%' }} />
          </div>
        </div>

        {/* Track 2: tDCS Accelerated */}
        <div>
          <div className="flex justify-between text-[11px] mb-1">
            <span className="flex items-center gap-1 font-medium text-emerald-300">
              <span>⚡</span> tDCS facilitated
            </span>
            <span className="font-mono font-semibold text-emerald-300">{stimulatedMs} ms</span>
          </div>
          <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-emerald-900/40 p-0.5">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full transition-all duration-300 shadow-glow-cyan"
              style={{ width: `${(stimulatedMs / baselineMs) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
