import React from 'react';

interface EvidenceBadgeProps {
  level: string;
  className?: string;
}

interface EvidenceStyle {
  short: string;
  description: string;
  className: string;
}

const STYLES: Record<string, EvidenceStyle> = {
  'Level A (Definite)': {
    short: 'Level A',
    description: 'Definite evidence · guideline-endorsed indication',
    className: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
  },
  'Level B (Probable)': {
    short: 'Level B',
    description: 'Probable evidence · supported by controlled trials',
    className: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300'
  },
  'Level C (Possible)': {
    short: 'Level C',
    description: 'Possible evidence · exploratory indication',
    className: 'border-amber-500/40 bg-amber-500/10 text-amber-300'
  },
  'Translational Research': {
    short: 'Translational',
    description: 'Early translational research · not yet guideline-level',
    className: 'border-violet-500/40 bg-violet-500/10 text-violet-300'
  }
};

export const EvidenceBadge: React.FC<EvidenceBadgeProps> = ({ level, className = '' }) => {
  const style = STYLES[level] ?? {
    short: level,
    description: level,
    className: 'border-slate-600 bg-slate-800/70 text-slate-300'
  };

  return (
    <span
      title={style.description}
      className={`inline-flex shrink-0 items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-semibold tracking-tight ${style.className} ${className}`}
    >
      <span className="h-1 w-1 rounded-full bg-current" />
      {style.short}
    </span>
  );
};

export default EvidenceBadge;
