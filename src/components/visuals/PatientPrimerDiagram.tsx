import React from 'react';
import { Brain, Lightbulb, Sparkles, TrendingUp, Zap } from 'lucide-react';

interface PatientPrimerDiagramProps {
  currentMa: number;
  durationMin: number;
}

/**
 * Plain-language cellular primer: current primes the cell, the learning window
 * opens, and repeated practice consolidates the connection.
 */
export const PatientPrimerDiagram: React.FC<PatientPrimerDiagramProps> = ({ currentMa, durationMin }) => {
  return (
    <section className="panel-card overflow-hidden">
      <div className="panel-header">
        <div>
          <h3 className="panel-title">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-500/10 text-amber-300">
              <Lightbulb className="h-3.5 w-3.5" />
            </span>
            How tDCS works
          </h3>
          <p className="panel-kicker">Priming the brain — not shocking it</p>
        </div>
        <div className="flex items-center gap-1 font-mono text-[13px] text-slate-400">
          <span className="text-amber-300">{currentMa.toFixed(1)}</span> mA
          <span className="text-slate-600">·</span>
          <span className="text-cyan-300">{durationMin}</span> min
        </div>
      </div>

      <div className="p-3">
        <div className="grid grid-cols-3 gap-2">
          <PrimerStage
            icon={<Zap className="h-4 w-4" />}
            tone="text-cyan-300 bg-cyan-500/10 border-cyan-500/30"
            title="A gentle current"
            summary="A micro-current moves between two damp pads."
          >
            <svg viewBox="0 0 60 42" className="h-10 w-full">
              <path d="M 30 6 C 18 6 10 15 10 25 C 10 35 19 39 30 39 C 41 39 50 35 50 25 C 50 15 42 6 30 6 Z" fill="#0B1626" stroke="#334155" strokeWidth="1" />
              <circle cx="22" cy="23" r="3" fill="#F87171" opacity="0.9" />
              <circle cx="38" cy="23" r="3" fill="#22D3EE" opacity="0.9" />
              <path d="M 25 23 Q 30 15 35 23" fill="none" stroke="#FBBF24" strokeWidth="1" strokeDasharray="2 2" />
            </svg>
          </PrimerStage>

          <PrimerStage
            icon={<Brain className="h-4 w-4" />}
            tone="text-violet-300 bg-violet-500/10 border-violet-500/30"
            title="Cells get ready"
            summary="Resting neurons sit closer to their firing threshold."
          >
            <svg viewBox="0 0 60 42" className="h-10 w-full">
              <path d="M 12 21 Q 20 10 30 21 T 48 21" fill="none" stroke="#64748B" strokeWidth="1.4" />
              <path d="M 12 23 Q 20 31 30 23 T 48 23" fill="none" stroke="#64748B" strokeWidth="1.4" />
              <circle cx="30" cy="22" r="5" fill="#8B5CF6" opacity="0.25" />
              <circle cx="30" cy="22" r="2.4" fill="#A78BFA" />
              <circle cx="21" cy="22" r="8" fill="none" stroke="#A78BFA" strokeWidth="0.8" opacity="0.7" />
              <circle cx="39" cy="22" r="8" fill="none" stroke="#A78BFA" strokeWidth="0.8" opacity="0.7" />
            </svg>
          </PrimerStage>

          <PrimerStage
            icon={<TrendingUp className="h-4 w-4" />}
            tone="text-emerald-300 bg-emerald-500/10 border-emerald-500/30"
            title="Practice sticks"
            summary="Therapy or training during this window strengthens learning."
          >
            <svg viewBox="0 0 60 42" className="h-10 w-full">
              <path d="M 8 34 C 20 34 22 26 31 25 C 40 24 42 15 52 8" fill="none" stroke="#34D399" strokeWidth="2" strokeLinecap="round" />
              <circle cx="52" cy="8" r="2.6" fill="#6EE7B7" />
              <text x="10" y="12" fill="#64748B" fontSize="5.8">learning</text>
            </svg>
          </PrimerStage>
        </div>

        <div className="mt-3 rounded-lg border border-amber-500/25 bg-amber-500/5 px-3 py-2.5">
          <div className="flex items-start gap-2">
            <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300" />
            <p className="text-[13.5px] leading-relaxed text-slate-300">
              tDCS does not create thoughts or movement on its own. It makes brain cells more
              receptive while you practise a task or do therapy. That is why the session is paired
              with focused activity — the current opens a short window, and practice uses it.
            </p>
          </div>
        </div>

        <ul className="mt-3 space-y-1.5 text-[13.5px] leading-relaxed text-slate-400">
          <li className="flex gap-1.5">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-cyan-400" />
            The current is far too low to trigger a seizure or a shock — it is a gentle bias, not a signal generator.
          </li>
          <li className="flex gap-1.5">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-violet-400" />
            Effects build gradually during the session and can last up to an hour or more afterwards.
          </li>
          <li className="flex gap-1.5">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-emerald-400" />
            If you feel stinging or a burning sensation, ask your clinician — do not adjust the device yourself.
          </li>
        </ul>
      </div>
    </section>
  );
};

const PrimerStage: React.FC<{
  icon: React.ReactNode;
  tone: string;
  title: string;
  summary: string;
  children: React.ReactNode;
}> = ({ icon, tone, title, summary, children }) => (
  <div className={`rounded-lg border bg-slate-950/50 p-2 ${tone.split(' ').slice(1).join(' ')}`}>
    <div className={`mb-1 flex h-6 w-6 items-center justify-center rounded-md border ${tone}`}>{icon}</div>
    <div className="text-[13.5px] font-semibold leading-tight text-slate-100">{title}</div>
    <div className="mt-0.5 text-[12.5px] leading-snug text-slate-500">{summary}</div>
    <div className="mt-1">{children}</div>
  </div>
);

export default PatientPrimerDiagram;
