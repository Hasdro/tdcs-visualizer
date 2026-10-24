import React from 'react';
import { Droplets, Eye, Flame, Sparkles, Utensils, Zap } from 'lucide-react';
import { BiophysicalTelemetry } from '../../utils/biophysicsEngine';

interface SensationTolerabilityBarsProps {
  telemetry: BiophysicalTelemetry;
}

interface SensationRow {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  name: string;
  likelihood: number;
  reading: string;
  note: string;
  tone: string;
  bar: string;
}

const likelihoodWord = (pct: number) => {
  if (pct <= 0) return 'Absent';
  if (pct < 15) return 'Unlikely';
  if (pct < 45) return 'Possible';
  if (pct < 70) return 'Likely';
  return 'Expected';
};

export const SensationTolerabilityBars: React.FC<SensationTolerabilityBarsProps> = ({ telemetry }) => {
  const effects = telemetry.sideEffectProfile;
  const tinglingLikelihood = Math.min(100, effects.tinglingScore * 10);
  const erythemaLikelihood = Math.min(100, effects.skinErythemaRisk * 10);
  const phospheneLikelihood = effects.phospheneRisk ? 18 : 4;
  const metallicLikelihood = effects.metallicTaste ? 28 : 0;

  const rows: SensationRow[] = [
    {
      id: 'tingling',
      icon: Zap,
      name: 'Tingling / itching',
      likelihood: tinglingLikelihood,
      reading: `${effects.tinglingScore}/10`,
      note: 'Expected during ramp-up; fades as the current stabilises.',
      tone: 'text-amber-300',
      bar: 'from-amber-500 to-amber-300'
    },
    {
      id: 'erythema',
      icon: Flame,
      name: 'Skin erythema',
      likelihood: erythemaLikelihood,
      reading: `${effects.skinErythemaRisk}/10`,
      note: 'Mild redness under the pad; resolves within about 45 minutes.',
      tone: 'text-rose-300',
      bar: 'from-rose-500 to-rose-300'
    },
    {
      id: 'phosphene',
      icon: Eye,
      name: 'Phosphenes (retinal flashes)',
      likelihood: phospheneLikelihood,
      reading: effects.phospheneRisk ? '~18%' : '<5%',
      note: 'Brief visual shimmer during ramp transitions near orbital sites.',
      tone: 'text-cyan-300',
      bar: 'from-cyan-500 to-cyan-300'
    },
    {
      id: 'taste',
      icon: Utensils,
      name: 'Metallic taste',
      likelihood: metallicLikelihood,
      reading: effects.metallicTaste ? '~28%' : '0%',
      note: 'Lingual-nerve involvement only when temporal sites carry current.',
      tone: 'text-violet-300',
      bar: 'from-violet-500 to-violet-300'
    }
  ];

  return (
    <section className="panel-card overflow-hidden">
      <div className="panel-header">
        <div>
          <h3 className="panel-title">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-rose-500/10 text-rose-300">
              <Sparkles className="h-3.5 w-3.5" />
            </span>
            Sensation &amp; tolerability
          </h3>
          <p className="panel-kicker">Expected sensory profile for this dose</p>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-slate-400">
          <Droplets className="h-3 w-3 text-cyan-400" />
          Hydration matters
        </div>
      </div>

      <div className="space-y-3 p-3">
        {rows.map((row) => {
          const Icon = row.icon;
          return (
            <div key={row.id}>
              <div className="mb-1 flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-1.5">
                  <Icon className={`h-3.5 w-3.5 shrink-0 ${row.tone}`} />
                  <span className="truncate text-[12.5px] font-medium text-slate-200">{row.name}</span>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className={`text-[11px] font-medium ${row.tone}`}>{likelihoodWord(row.likelihood)}</span>
                  <span className="font-mono text-[11px] text-slate-400">{row.reading}</span>
                </div>
              </div>

              <div className="h-1.5 overflow-hidden rounded-full border border-slate-800/70 bg-slate-950">
                <div
                  className={`h-full rounded-full bg-gradient-to-r transition-all duration-500 ${row.bar}`}
                  style={{ width: `${Math.max(2, row.likelihood)}%` }}
                />
              </div>
              <p className="mt-1 text-[11px] leading-snug text-slate-500">{row.note}</p>
            </div>
          );
        })}

        <p className="border-t border-slate-800/70 pt-2 text-[11px] leading-relaxed text-slate-500">
          Sensations are individual. Slow ramp-up, well-hydrated sponges, and intact skin reduce
          discomfort. Stop if burning or pain occurs.
        </p>
      </div>
    </section>
  );
};

export default SensationTolerabilityBars;
