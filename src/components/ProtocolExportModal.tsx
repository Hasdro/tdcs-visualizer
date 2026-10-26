import React, { useState } from 'react';
import { printProtocolReport, exportProtocolMarkdown, ProtocolReportData } from '../utils/protocolExport';
import { Printer, Download, X, FileText, CheckCircle2 } from 'lucide-react';

interface ProtocolExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: Omit<ProtocolReportData, 'subjectId' | 'clinicalNotes'>;
}

export const ProtocolExportModal: React.FC<ProtocolExportModalProps> = ({
  isOpen,
  onClose,
  data,
}) => {
  const [subjectId, setSubjectId] = useState('TDCS-SUBJ-001');
  const [clinicalNotes, setClinicalNotes] = useState(
    'Stimulation protocol tolerated well. Impedance < 5 kΩ maintained throughout. No persistent erythema or phosphenes reported post-session.'
  );

  if (!isOpen) return null;

  const handlePrint = () => {
    printProtocolReport({
      ...data,
      subjectId,
      clinicalNotes,
    });
  };

  const handleDownloadMarkdown = () => {
    exportProtocolMarkdown({
      ...data,
      subjectId,
      clinicalNotes,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-ink-2 border border-cyan-500/40 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden font-sans text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-ink-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-700/60 flex items-center justify-center text-cyan-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="flex items-center gap-2 text-sm font-semibold tracking-tight text-white">
                Clinical protocol export
                <span className="rounded bg-emerald-900/60 px-1.5 py-0.5 text-[13px] font-normal text-emerald-300">
                  Print &amp; PDF ready
                </span>
              </h2>
              <p className="text-[14px] text-slate-400">
                Institutional trial record-keeping conforming to Bikson et al. 2016
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-3.5">
          {/* Live Protocol Summary Card: High-contrast Medical Passport Badge */}
          <div className="relative overflow-hidden rounded-xl border border-cyan-500/50 bg-gradient-to-r from-slate-900 via-ink-3 to-slate-900 p-3.5 text-xs shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-400 shadow-glow-cyan" />
                <span className="text-[14px] font-semibold tracking-tight text-white">Clinical dosimetry passport</span>
              </div>
              <span className="rounded border border-emerald-800/80 bg-emerald-950/80 px-2 py-0.5 font-mono text-[13px] font-semibold text-emerald-300">
                {data.telemetry.safetyIndex}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5 my-2.5">
              <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
                <span className="text-[12.5px] text-slate-400 block">Active montage</span>
                <span className="text-red-400 font-bold">{data.montageState.anode} (+)</span>
                <span className="text-slate-500 mx-1">→</span>
                <span className="text-cyan-400 font-bold">{data.montageState.cathode} (–)</span>
              </div>
              <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
                <span className="text-[12.5px] text-slate-400 block">Current & duration</span>
                <span className="font-mono font-semibold text-amber-300">{data.montageState.ma.toFixed(1)} mA</span>
                <span className="text-slate-400 text-[13px] ml-1">@ {data.montageState.dur}m</span>
              </div>
              <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
                <span className="text-[12.5px] text-slate-400 block">Total energy Q</span>
                <span className="font-mono font-semibold text-emerald-300">{data.telemetry.totalChargeCoulombs.toFixed(2)} C</span>
                <span className="text-slate-500 text-[12.5px] block">{data.telemetry.chargeDensityCCm2} C/cm²</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/60 text-[13px] text-slate-400">
              <span>Peak cortical E-field: <strong className="font-mono text-amber-400">{data.telemetry.peakEFieldVm.toFixed(3)} V/m</strong></span>
              <span>Density J: <strong className="text-cyan-300">{data.telemetry.currentDensityMaCm2} mA/cm²</strong></span>
            </div>
          </div>

          {/* Subject ID (Video Feedback #10: Doctor name removed) */}
          <div>
            <label className="text-[14px] font-mono text-slate-300 block mb-1">
              Subject / trial identifier
            </label>
            <input
              type="text"
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="w-full bg-ink-0 border border-slate-700 text-slate-200 text-xs rounded-lg p-2.5 font-mono focus:border-cyan-500 focus:outline-none"
              placeholder="TDCS-SUBJ-001"
            />
          </div>

          {/* Clinical Notes */}
          <div>
            <label className="text-[14px] font-mono text-slate-300 block mb-1">
              Clinical observations & compliance notes
            </label>
            <textarea
              rows={3}
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              className="w-full bg-ink-0 border border-slate-700 text-slate-200 text-xs rounded-lg p-2 font-mono focus:border-cyan-500 focus:outline-none resize-none"
            />
          </div>

          {/* Checklist */}
          <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-800/40 text-[14px] text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Includes full dosimetry, charge calculations, Bikson consensus criteria, and PubMed citations.
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-ink-1 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={handleDownloadMarkdown}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 hover:border-slate-600 bg-slate-900 text-slate-300 text-xs font-mono transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Markdown</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-[#fff] text-xs font-mono font-bold transition shadow-glow-cyan"
          >
            <Printer className="w-4 h-4" />
            <span>Generate PDF / print</span>
          </button>
        </div>
      </div>
    </div>
  );
};
