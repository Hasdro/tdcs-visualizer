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
      <div className="bg-[#0B1322] border border-cyan-500/40 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden font-sans text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-[#0E1729]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-700/60 flex items-center justify-center text-cyan-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-mono font-bold tracking-tight text-white flex items-center gap-2">
                CLINICAL PROTOCOL RECORD EXPORT
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-900/60 text-emerald-300 font-normal">
                  PRINT & PDF READY
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
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
          <div className="p-3.5 bg-gradient-to-r from-slate-900 via-[#0E1729] to-slate-900 border border-cyan-500/50 rounded-xl shadow-lg text-xs font-mono relative overflow-hidden">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-glow-cyan animate-pulse" />
                <span className="font-bold text-white text-[11px] tracking-wider uppercase">CLINICAL DOSIMETRY PASSPORT</span>
              </div>
              <span className="text-[10px] bg-emerald-950/80 text-emerald-300 border border-emerald-800/80 px-2 py-0.5 rounded font-bold">
                {data.telemetry.safetyIndex}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5 my-2.5">
              <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
                <span className="text-[9px] text-slate-400 block">ACTIVE MONTAGE</span>
                <span className="text-red-400 font-bold">{data.montageState.anode} (+)</span>
                <span className="text-slate-500 mx-1">→</span>
                <span className="text-cyan-400 font-bold">{data.montageState.cathode} (–)</span>
              </div>
              <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
                <span className="text-[9px] text-slate-400 block">CURRENT & DURATION</span>
                <span className="text-amber-300 font-bold">{data.montageState.ma.toFixed(1)} mA</span>
                <span className="text-slate-400 text-[10px] ml-1">@ {data.montageState.dur}m</span>
              </div>
              <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
                <span className="text-[9px] text-slate-400 block">TOTAL ENERGY Q</span>
                <span className="text-emerald-300 font-bold">{data.telemetry.totalChargeCoulombs.toFixed(2)} C</span>
                <span className="text-slate-500 text-[9px] block">{data.telemetry.chargeDensityCCm2} C/cm²</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/60 text-[10px] text-slate-400">
              <span>Peak Cortical |E|: <strong className="text-amber-400">{data.telemetry.peakEFieldVm.toFixed(3)} V/m</strong></span>
              <span>Density J: <strong className="text-cyan-300">{data.telemetry.currentDensityMaCm2} mA/cm²</strong></span>
            </div>
          </div>

          {/* Subject ID (Video Feedback #10: Doctor name removed) */}
          <div>
            <label className="text-[11px] font-mono text-slate-300 block mb-1">
              SUBJECT / TRIAL IDENTIFIER
            </label>
            <input
              type="text"
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="w-full bg-[#070B12] border border-slate-700 text-slate-200 text-xs rounded-lg p-2.5 font-mono focus:border-cyan-500 focus:outline-none"
              placeholder="TDCS-SUBJ-001"
            />
          </div>

          {/* Clinical Notes */}
          <div>
            <label className="text-[11px] font-mono text-slate-300 block mb-1">
              CLINICAL OBSERVATIONS & COMPLIANCE NOTES
            </label>
            <textarea
              rows={3}
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              className="w-full bg-[#070B12] border border-slate-700 text-slate-200 text-xs rounded-lg p-2 font-mono focus:border-cyan-500 focus:outline-none resize-none"
            />
          </div>

          {/* Checklist */}
          <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-800/40 text-[11px] text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Includes full dosimetry, charge calculations, Bikson consensus criteria, and PubMed citations.
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-[#0A101D] border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={handleDownloadMarkdown}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 hover:border-slate-600 bg-slate-900 text-slate-300 text-xs font-mono transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Markdown</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-bold transition shadow-glow-cyan"
          >
            <Printer className="w-4 h-4" />
            <span>GENERATE PDF / PRINT</span>
          </button>
        </div>
      </div>
    </div>
  );
};
