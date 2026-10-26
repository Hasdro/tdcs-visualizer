import React, { useState } from 'react';
import { ExternalLink } from 'lucide-react';

interface Citation {
  authors: string;
  year: number;
  journal: string;
  pmid: string;
  finding: string;
}

interface ClinicalEvidenceTimelineProps {
  citations?: Citation[];
}

interface Milestone {
  year: number;
  authors: string;
  discovery: string;
  badges: string[];
  /** Verified PMID; when absent a PubMed search URL is used */
  pmid?: string;
  searchQuery: string;
}

// Canonical history of the tDCS field (Nitsche 2000 → Lefaucheur 2020)
const MILESTONES: Milestone[] = [
  {
    year: 2000,
    authors: 'Nitsche & Paulus',
    discovery: 'First causal proof that weak direct current reliably modulates human motor cortex excitability — the founding observation of tDCS.',
    badges: ['RCT Double-Blind', 'J Physiol'],
    pmid: '10990547',
    searchQuery: 'Nitsche Paulus 2000 excitability transcranial direct current'
  },
  {
    year: 2003,
    authors: 'Bikson / Francis',
    discovery: 'Sub-threshold somatic polarization biophysics: layer V pyramidal neurons show ordered membrane shift gradients under uniform fields.',
    badges: ['In-Vitro Electrophysiology'],
    searchQuery: 'Bikson 2003 polarization uniform electric field neurons'
  },
  {
    year: 2006,
    authors: 'Miranda et al.',
    discovery: '3-D finite-element modeling quantifies scalp & CSF current shunting, explaining why <40% of injected current reaches cortex.',
    badges: ['3D FEA Modeling'],
    searchQuery: 'Miranda 2006 modeling current distribution transcranial direct current stimulation'
  },
  {
    year: 2016,
    authors: 'Bikson Consensus',
    discovery: 'Comprehensive safety update: non-lesional limits for current density, charge, and duration validated across 33,200+ sessions / 1000+ subjects.',
    badges: ['Safety Consensus'],
    pmid: '27372845',
    searchQuery: 'Bikson 2016 safety transcranial direct current stimulation'
  },
  {
    year: 2020,
    authors: 'Lefaucheur Guidelines',
    discovery: 'European evidence-based guidelines: Class A/B therapeutic evidence for major depression and fibromyalgia pain.',
    badges: ['Evidence Class A/B', 'RCT Double-Blind'],
    pmid: '31956149',
    searchQuery: 'Lefaucheur 2020 evidence-based guidelines therapeutic tDCS'
  }
];

const pubmedUrl = (m: Milestone) =>
  m.pmid
    ? `https://pubmed.ncbi.nlm.nih.gov/${m.pmid}/`
    : `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(m.searchQuery)}`;

export const ClinicalEvidenceTimeline: React.FC<ClinicalEvidenceTimelineProps> = ({
  citations = []
}) => {
  const [activeYear, setActiveYear] = useState<number | null>(2020);

  // Live montage citations merge onto the timeline: matching years highlight their milestone node
  const citationYears = new Set(citations.map((c) => c.year));
  const extraCitations = citations.filter((c) => !MILESTONES.some((m) => m.year === c.year));

  return (
    <div className="panel-card select-none p-3 text-xs">
      <div className="flex items-start justify-between gap-2 border-b border-slate-800/70 pb-2">
        <span className="flex items-center gap-2 text-[14px] font-semibold leading-snug tracking-tight text-slate-100">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          Clinical evidence timeline
        </span>
        <span className="font-mono text-[13px] text-slate-400">{MILESTONES[0].year} → {MILESTONES[MILESTONES.length - 1].year}</span>
      </div>

      {/* Interactive horizontal milestone spine */}
      <div className="relative mt-3 mb-2 flex items-center">
        <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-slate-800 via-cyan-900/60 to-cyan-400/70 rounded-full" />
        {MILESTONES.map((m) => (
          <button
            key={m.year}
            onClick={() => setActiveYear(activeYear === m.year ? null : m.year)}
            aria-label={`Milestone ${m.year}: ${m.authors}`}
            className="relative flex-1 flex flex-col items-center cursor-pointer group"
          >
            {/* Year node */}
            <span
              className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-300 ${
                activeYear === m.year
                  ? 'bg-cyan-400 border-cyan-200 shadow-glow-cyan scale-125'
                  : citationYears.has(m.year)
                  ? 'bg-amber-400 border-amber-200'
                  : 'bg-slate-900 border-slate-600 group-hover:border-cyan-500'
              }`}
            />
            <span className={`mt-1 font-mono text-[12.5px] font-semibold ${activeYear === m.year ? 'text-cyan-300' : 'text-slate-400'}`}>
              {m.year}
            </span>
          </button>
        ))}
      </div>

      {/* Expanded milestone evidence card */}
      {(() => {
        const m = MILESTONES.find((x) => x.year === activeYear);
        if (!m) {
          return (
            <div className="text-[13px] text-slate-500 text-center py-1.5 border border-dashed border-slate-800 rounded">
              Select a timeline node to view the landmark study
            </div>
          );
        }
        return (
          <div className="bg-slate-950/70 border border-slate-800/70 rounded-lg p-2 text-[13px] space-y-1.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              {m.badges.map((b) => (
                <span key={b} className="px-1.5 py-0.5 rounded bg-cyan-950/70 text-cyan-300 border border-cyan-800/50 text-[11.5px] font-medium">
                  {b}
                </span>
              ))}
              {citationYears.has(m.year) && (
                <span className="px-1.5 py-0.5 rounded bg-amber-950/70 text-amber-300 border border-amber-800/50 text-[11.5px] font-bold">
                  Active target
                </span>
              )}
            </div>
            <div className="text-cyan-300 font-bold">{m.authors} ({m.year})</div>
            <p className="text-slate-300 leading-snug">{m.discovery}</p>
            <a
              href={pubmedUrl(m)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 underline text-[12.5px]"
            >
              <span>{m.pmid ? `PubMed: ${m.pmid}` : 'Search PubMed'}</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        );
      })()}

      {/* Additional site-specific evidence merged from the active node profile */}
      {extraCitations.length > 0 && (
        <div className="mt-2 pt-2 border-t border-slate-800/60">
          <div className="text-[12.5px] text-slate-500 mb-1">Active electrode profile · supplementary evidence</div>
          <div className="flex flex-wrap gap-1.5">
            {extraCitations.slice(0, 4).map((c) => (
              <a
                key={c.pmid}
                href={`https://pubmed.ncbi.nlm.nih.gov/${c.pmid}/`}
                target="_blank"
                rel="noopener noreferrer"
                title={c.finding}
                className="px-1.5 py-0.5 rounded bg-slate-950/80 border border-slate-800 text-[12px] text-slate-300 hover:border-cyan-600 transition"
              >
                <span className="text-cyan-300 font-bold">{c.year}</span> · {c.authors.split(',')[0]} · <span className="text-amber-400">PMID {c.pmid}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
