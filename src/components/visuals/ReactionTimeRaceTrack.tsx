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
    <div className="bg-[#0C121E]/95 border border-slate-800/90 rounded-xl p-3 shadow-xl select-none font-mono text-xs">
      <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/60 text-[11px]">
        <span className="font-bold text-slate-200 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          REACTION TIME VISUAL TRACK
        </span>
        <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-800/60 px-1.5 py-0.5 rounded">
          ⚡ {deltaMs} ms Faster Initiation
        </span>
      </div>

      <div className="space-y-2 mt-2.5">
        {/* Track 1: Baseline */}
        <div>
          <div className="flex justify-between text-[10px] text-slate-400 mb-1">
            <span>Normative Baseline</span>
            <span>{baselineMs} ms</span>
          </div>
          <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800 p-0.5">
            <div className="h-full bg-slate-500/70 rounded-full" style={{ width: '100%' }} />
          </div>
        </div>

        {/* Track 2: tDCS Accelerated */}
        <div>
          <div className="flex justify-between text-[10px] mb-1">
            <span className="text-emerald-300 font-bold flex items-center gap-1">
              <span>⚡</span> tDCS Facilitated
            </span>
            <span className="text-emerald-300 font-bold">{stimulatedMs} ms</span>
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
