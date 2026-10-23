import React, { useState } from 'react';
import { printProtocolReport, exportProtocolMarkdown, ProtocolReportData } from '../utils/protocolExport';
import { Printer, Download, X, FileText, CheckCircle2 } from 'lucide-react';

interface ProtocolExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: Omit<ProtocolReportData, 'investigatorName' | 'subjectId' | 'clinicalNotes'>;
}

export const ProtocolExportModal: React.FC<ProtocolExportModalProps> = ({
  isOpen,
  onClose,
  data,
}) => {
  const [subjectId, setSubjectId] = useState('TDCS-SUBJ-001');
  const [investigatorName, setInvestigatorName] = useState('Dr. Alex Morgan, MD/PhD');
  const [clinicalNotes, setClinicalNotes] = useState(
    'Stimulation protocol tolerated well. Impedance < 5 kΩ maintained throughout. No persistent erythema or phosphenes reported post-session.'
  );

  if (!isOpen) return null;

  const handlePrint = () => {
    printProtocolReport({
      ...data,
      subjectId,
      investigatorName,
      clinicalNotes,
    });
  };

  const handleDownloadMarkdown = () => {
    exportProtocolMarkdown({
      ...data,
      subjectId,
      investigatorName,
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
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-3.5">
          {/* Metadata preview card */}
          <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg flex items-center justify-between text-xs font-mono">
            <div>
              <div className="text-slate-400 text-[10px]">CURRENT MONTAGE</div>
              <div className="text-cyan-300 font-bold mt-0.5">
                {data.montageState.anode} (+) / {data.montageState.cathode} (-) @ {data.montageState.ma.toFixed(1)} mA
              </div>
            </div>
            <div className="text-right">
              <div className="text-slate-400 text-[10px]">CORTICAL PEAK E-FIELD</div>
              <div className="text-amber-400 font-bold mt-0.5">
                {data.telemetry.peakEFieldVm.toFixed(3)} V/m
              </div>
            </div>
          </div>

          {/* Subject ID & Investigator */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-mono text-slate-300 block mb-1">
                SUBJECT IDENTIFIER
              </label>
              <input
                type="text"
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full bg-[#070B12] border border-slate-700 text-slate-200 text-xs rounded-lg p-2 font-mono focus:border-cyan-500 focus:outline-none"
                placeholder="TDCS-SUBJ-001"
              />
            </div>
            <div>
              <label className="text-[11px] font-mono text-slate-300 block mb-1">
                INVESTIGATOR / CLINICIAN
              </label>
              <input
                type="text"
                value={investigatorName}
                onChange={(e) => setInvestigatorName(e.target.value)}
                className="w-full bg-[#070B12] border border-slate-700 text-slate-200 text-xs rounded-lg p-2 font-mono focus:border-cyan-500 focus:outline-none"
                placeholder="Dr. Investigator"
              />
            </div>
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
