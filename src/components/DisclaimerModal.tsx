import React, { useEffect, useRef } from 'react';
import { BookOpenCheck, GraduationCap, ShieldAlert, Stethoscope } from 'lucide-react';

interface DisclaimerModalProps {
  isOpen: boolean;
  onAccept: () => void;
}

const POINTS: Array<{ icon: React.ComponentType<{ className?: string }>; title: string; body: string }> = [
  {
    icon: GraduationCap,
    title: 'For learning only',
    body: 'Fields, membrane shifts, EEG changes and outcomes shown here come from simplified models, not from measurements of any real person.'
  },
  {
    icon: ShieldAlert,
    title: 'Not a medical device',
    body: 'Do not use it to plan, prescribe, or deliver stimulation, and never self-administer tDCS.'
  },
  {
    icon: BookOpenCheck,
    title: 'Check every figure against trusted sources',
    body: 'Confirm doses, montages and claims with peer-reviewed literature and established guidelines, such as the Bikson et al. 2016 safety review and the Lefaucheur et al. 2017 evidence guidelines.'
  },
  {
    icon: Stethoscope,
    title: 'Clinical decisions need a professional',
    body: 'Any real treatment must be decided and supervised by a qualified clinician.'
  }
];

/**
 * Educational-use notice shown on every visit before the simulator can be used.
 */
export const DisclaimerModal: React.FC<DisclaimerModalProps> = ({ isOpen, onAccept }) => {
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) buttonRef.current?.focus();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="disclaimer-title"
    >
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-amber-500/30 bg-ink-2 shadow-2xl">
        <div className="border-b border-slate-800 bg-amber-500/5 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-300">
              <GraduationCap className="h-5 w-5" />
            </span>
            <div>
              <h2 id="disclaimer-title" className="text-[18px] font-semibold text-slate-100">
                An educational simulator
              </h2>
              <p className="text-[14px] text-slate-400">Please read before you continue</p>
            </div>
          </div>
        </div>

        <ul className="space-y-3 px-5 py-4">
          {POINTS.map(({ icon: Icon, title, body }) => (
            <li key={title} className="flex items-start gap-3">
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
              <div>
                <div className="text-[15px] font-semibold text-slate-100">{title}</div>
                <p className="mt-0.5 text-[14.5px] leading-relaxed text-slate-400">{body}</p>
              </div>
            </li>
          ))}
        </ul>

        <div className="flex items-center justify-between gap-3 border-t border-slate-800 bg-ink-1 px-5 py-3">
          <p className="text-[13px] leading-snug text-slate-500">This notice appears on every visit.</p>
          <button
            ref={buttonRef}
            type="button"
            onClick={onAccept}
            className="shrink-0 rounded-lg bg-amber-500 px-4 py-2 text-[15px] font-semibold text-slate-950 transition hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-300"
          >
            I understand
          </button>
        </div>
      </div>
    </div>
  );
};

export default DisclaimerModal;
