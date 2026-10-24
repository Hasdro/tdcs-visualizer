import React, { useEffect, useState } from 'react';
import { Bug, CheckCircle2, ExternalLink, Loader2, X } from 'lucide-react';

export const GITHUB_REPO = 'Hasdro/tdcs-visualizer';

interface BugReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Status =
  | { kind: 'idle' }
  | { kind: 'sending' }
  | { kind: 'sent'; issueUrl: string }
  | { kind: 'fallback'; githubUrl: string; reason: string };

const MAX_TITLE = 120;
const MAX_TEXT = 4000;

/** Technical context attached to every report so bugs can be reproduced. */
const collectContext = () => ({
  url: window.location.href,
  userAgent: navigator.userAgent,
  viewport: `${window.innerWidth}×${window.innerHeight} @${window.devicePixelRatio}x`,
  reportedAt: new Date().toISOString()
});

const buildIssueBody = (description: string, steps: string, context: ReturnType<typeof collectContext>) =>
  [
    '### What happened',
    description || '_No description_',
    '',
    '### Steps to reproduce',
    steps || '_Not provided_',
    '',
    '### Context',
    `- Page: ${context.url}`,
    `- Browser: ${context.userAgent}`,
    `- Viewport: ${context.viewport}`,
    `- Reported: ${context.reportedAt}`,
    '',
    '_Submitted from the in-app bug reporter._'
  ].join('\n');

const prefilledIssueUrl = (title: string, body: string) =>
  `https://github.com/${GITHUB_REPO}/issues/new?labels=bug&title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;

/**
 * In-app bug reporter. Sends the report to /api/report-bug, which files a
 * GitHub issue; if that service is unavailable it falls back to a prefilled
 * GitHub "new issue" page so the report is never lost.
 */
export const BugReportModal: React.FC<BugReportModalProps> = ({ isOpen, onClose }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState('');
  const [website, setWebsite] = useState(''); // honeypot: real users never see it
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const reset = () => {
    setTitle('');
    setDescription('');
    setSteps('');
    setStatus({ kind: 'idle' });
  };

  const handleClose = () => {
    if (status.kind === 'sent') reset();
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !description.trim()) return;
    setStatus({ kind: 'sending' });
    const context = collectContext();
    const fallback = (reason: string) =>
      setStatus({
        kind: 'fallback',
        reason,
        githubUrl: prefilledIssueUrl(title.trim(), buildIssueBody(description.trim(), steps.trim(), context))
      });

    try {
      const response = await fetch('/api/report-bug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), description: description.trim(), steps: steps.trim(), context, website })
      });
      const data = (await response.json().catch(() => ({}))) as { issueUrl?: string; error?: string };
      if (response.ok && data.issueUrl) {
        setStatus({ kind: 'sent', issueUrl: data.issueUrl });
      } else {
        fallback(data.error ?? 'The reporting service is unavailable right now.');
      }
    } catch {
      fallback('Could not reach the reporting service.');
    }
  };

  const inputClass =
    'mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-[13px] text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-500/70';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bug-report-title"
      onClick={(event) => event.target === event.currentTarget && handleClose()}
    >
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-700 bg-[#0C121E] shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3.5">
          <h2 id="bug-report-title" className="flex items-center gap-2 text-[15px] font-semibold text-slate-100">
            <Bug className="h-4 w-4 text-rose-300" />
            Report a bug
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="rounded p-1 text-slate-400 transition hover:bg-slate-800 hover:text-white"
            aria-label="Close bug report"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {status.kind === 'sent' ? (
          <div className="space-y-3 px-5 py-6 text-center">
            <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-400" />
            <p className="text-[14px] font-semibold text-slate-100">Thanks — your report was filed.</p>
            <a
              href={status.issueUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-[13px] text-cyan-300 hover:text-cyan-200"
            >
              View the issue on GitHub <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        ) : status.kind === 'fallback' ? (
          <div className="space-y-3 px-5 py-5">
            <p className="text-[13px] leading-relaxed text-slate-300">
              {status.reason} Your report is ready on GitHub instead — open it and press{' '}
              <span className="font-semibold text-slate-100">Submit new issue</span>. A free GitHub account is needed.
            </p>
            <a
              href={status.githubUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-600 px-3.5 py-2 text-[13px] font-semibold text-white transition hover:bg-cyan-500"
            >
              Open prefilled issue <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3 px-5 py-4">
            <label className="block text-[12px] font-medium text-slate-300">
              Short title
              <input
                className={inputClass}
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, MAX_TITLE))}
                placeholder="e.g. Microscope stays blank after switching to Fp2"
                required
              />
            </label>
            <label className="block text-[12px] font-medium text-slate-300">
              What happened?
              <textarea
                className={`${inputClass} h-24 resize-none`}
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, MAX_TEXT))}
                placeholder="What did you expect, and what did you see instead?"
                required
              />
            </label>
            <label className="block text-[12px] font-medium text-slate-300">
              Steps to reproduce <span className="font-normal text-slate-500">(optional)</span>
              <textarea
                className={`${inputClass} h-20 resize-none`}
                value={steps}
                onChange={(e) => setSteps(e.target.value.slice(0, MAX_TEXT))}
                placeholder={'1. Choose the Speech preset\n2. Click Fp2 in the microscope'}
              />
            </label>
            <input
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="hidden"
              aria-hidden="true"
            />
            <p className="text-[11px] leading-snug text-slate-500">
              Reports are posted publicly as GitHub issues, with your current montage link, browser and screen size. Please
              don&apos;t include personal or medical information.
            </p>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg border border-slate-700 px-3.5 py-2 text-[13px] text-slate-300 transition hover:border-slate-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={status.kind === 'sending' || !title.trim() || !description.trim()}
                className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-3.5 py-2 text-[13px] font-semibold text-white transition hover:bg-rose-500 disabled:opacity-50"
              >
                {status.kind === 'sending' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Send report
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default BugReportModal;
