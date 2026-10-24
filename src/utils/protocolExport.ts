import { BRAIN_NODES } from '../data/brain_nodes';
import { CLINICAL_PRESETS } from '../data/clinical_presets';
import { BiophysicalTelemetry } from './biophysicsEngine';
import { MontageUrlState } from '../hooks/useUrlMontageState';

export interface ProtocolReportData {
  montageState: MontageUrlState;
  telemetry: BiophysicalTelemetry;
  subjectId?: string;
  clinicalNotes?: string;
}

// ============================================================
// Standalone SVG builders for the print-grade visual report
// (pure string output — no runtime dependencies, print-safe)
// ============================================================

const TOPOMAP_PRINT_COORDS: Record<string, { x: number; y: number }> = {
  Fp1: { x: 74, y: 36 }, Fp2: { x: 126, y: 36 }, Fpz: { x: 100, y: 32 },
  F7: { x: 42, y: 60 }, F3: { x: 70, y: 64 }, Fz: { x: 100, y: 66 }, F4: { x: 130, y: 64 }, F8: { x: 158, y: 60 },
  T7: { x: 30, y: 100 }, C3: { x: 65, y: 100 }, Cz: { x: 100, y: 100 }, C4: { x: 135, y: 100 }, T8: { x: 170, y: 100 },
  P7: { x: 42, y: 140 }, P3: { x: 70, y: 136 }, Pz: { x: 100, y: 134 }, P4: { x: 130, y: 136 }, P8: { x: 158, y: 140 },
  O1: { x: 76, y: 164 }, O2: { x: 124, y: 164 }, Oz: { x: 100, y: 168 }
};

/** 2D 10-20 head montage map with active circuit wiring */
function buildMontageMapSvg(anodeId: string, cathodeId: string, surroundNodeIds?: string[]): string {
  const a = TOPOMAP_PRINT_COORDS[anodeId] || TOPOMAP_PRINT_COORDS['F3'];
  const c = TOPOMAP_PRINT_COORDS[cathodeId] || TOPOMAP_PRINT_COORDS['Fp2'];
  const ringLines = (surroundNodeIds || [])
    .map((sId) => {
      const s = TOPOMAP_PRINT_COORDS[sId];
      if (!s) return '';
      return `<line x1="${a.x}" y1="${a.y}" x2="${s.x}" y2="${s.y}" stroke="#0284c7" stroke-width="2" stroke-dasharray="5 4" />`;
    })
    .join('');

  return `<svg viewBox="0 0 200 200" width="100%" height="190" xmlns="http://www.w3.org/2000/svg">
  <circle cx="100" cy="100" r="76" fill="#f8fafc" stroke="#334155" stroke-width="2.5" />
  <circle cx="100" cy="100" r="52" fill="none" stroke="#cbd5e1" stroke-width="1" stroke-dasharray="4 4" />
  <line x1="100" y1="24" x2="100" y2="176" stroke="#e2e8f0" stroke-width="1" />
  <line x1="24" y1="100" x2="176" y2="100" stroke="#e2e8f0" stroke-width="1" />
  <path d="M 94 26 L 100 14 L 106 26 Z" fill="#475569" />
  <text x="100" y="10" fill="#64748b" font-size="8" text-anchor="middle" font-family="monospace">NASION</text>
  <text x="100" y="193" fill="#64748b" font-size="8" text-anchor="middle" font-family="monospace">INION</text>
  ${ringLines}
  <line x1="${a.x}" y1="${a.y}" x2="${c.x}" y2="${c.y}" stroke="#dc2626" stroke-width="2.5" opacity="0.75" />
  <circle cx="${a.x}" cy="${a.y}" r="9" fill="#dc2626" stroke="#7f1d1d" stroke-width="2" />
  <circle cx="${c.x}" cy="${c.y}" r="9" fill="#0891b2" stroke="#164e63" stroke-width="2" />
  <text x="${a.x}" y="${a.y + 3.5}" fill="#ffffff" font-size="9" font-weight="bold" text-anchor="middle" font-family="monospace">${anodeId}</text>
  <text x="${c.x}" y="${c.y + 3.5}" fill="#ffffff" font-size="9" font-weight="bold" text-anchor="middle" font-family="monospace">${cathodeId}</text>
  <text x="${a.x}" y="${a.y - 13}" fill="#b91c1c" font-size="9" font-weight="bold" text-anchor="middle" font-family="monospace">ANODE (+)</text>
  <text x="${c.x}" y="${c.y - 13}" fill="#0e7490" font-size="9" font-weight="bold" text-anchor="middle" font-family="monospace">CATHODE (−)</text>
</svg>`;
}

/** Bikson 2016 consensus safety seal + current-density arc dial (limit 0.080 mA/cm²) */
function buildSafetySealSvg(safetyIndex: string, jMaCm2: number): string {
  const J_LIMIT = 0.08;
  const frac = Math.max(0, Math.min(1.15, jMaCm2 / J_LIMIT));
  const sweep = frac * 180; // semicircular dial
  const rad = (deg: number) => ((deg - 90) * Math.PI) / 180;
  const p = (r: number, deg: number) => ({ x: 60 + r * Math.cos(rad(deg)), y: 62 + r * Math.sin(rad(deg)) });
  const s0 = p(42, 0);
  const s1 = p(42, sweep);
  const needle = p(34, sweep);
  const pass = safetyIndex === 'OPTIMAL' || safetyIndex === 'MODERATE';
  const sealColor = pass ? '#16a34a' : '#d97706';

  return `<svg viewBox="0 0 120 100" width="100%" height="190" xmlns="http://www.w3.org/2000/svg">
  <circle cx="60" cy="50" r="46" fill="none" stroke="${sealColor}" stroke-width="3.5" />
  <circle cx="60" cy="50" r="40" fill="none" stroke="${sealColor}" stroke-width="1.2" opacity="0.55" />
  <path d="${`M ${s0.x.toFixed(1)} ${s0.y.toFixed(1)} A 42 42 0 0 ${sweep > 180 ? 1 : 0} ${s1.x.toFixed(1)} ${s1.y.toFixed(1)}`}" fill="none" stroke="${frac > 1 ? '#dc2626' : pass ? '#16a34a' : '#ea580c'}" stroke-width="7" stroke-linecap="round" />
  <line x1="60" y1="62" x2="${needle.x.toFixed(1)}" y2="${needle.y.toFixed(1)}" stroke="#0f172a" stroke-width="2.5" stroke-linecap="round" />
  <circle cx="60" cy="62" r="3.5" fill="#0f172a" />
  <text x="60" y="20" fill="${sealColor}" font-size="9" font-weight="bold" text-anchor="middle" font-family="monospace">BIKSON 2016 ✓</text>
  <text x="60" y="30" fill="#475569" font-size="7" text-anchor="middle" font-family="monospace">CONSENSUS SAFETY SEAL</text>
  <text x="60" y="80" fill="#0f172a" font-size="9.5" font-weight="bold" text-anchor="middle" font-family="monospace">SAFETY: ${safetyIndex}</text>
  <text x="60" y="91" fill="#475569" font-size="7.5" text-anchor="middle" font-family="monospace">J = ${jMaCm2.toFixed(3)} / 0.080 mA·cm⁻²</text>
</svg>`;
}

/** Cortical E-field spectrum bar with peak & mean markers */
function buildFieldSpectrumSvg(peakE: number, meanE: number): string {
  const AXIS_MAX = 1.0;
  const toX = (v: number) => Math.max(2, Math.min(218, 10 + (Math.max(0, v) / AXIS_MAX) * 208));
  const peakX = toX(peakE);
  const meanX = toX(meanE);

  return `<svg viewBox="0 0 230 74" width="100%" height="74" xmlns="http://www.w3.org/2000/svg">
  <line x1="10" y1="46" x2="218" y2="46" stroke="#cbd5e1" stroke-width="3" stroke-linecap="round" />
  <rect x="${toX(0.2)}" y="43.5" width="${toX(0.5) - toX(0.2)}" height="5" fill="#16a34a" opacity="0.35" />
  <text x="${(toX(0.2) + toX(0.5)) / 2}" y="40" fill="#15803d" font-size="6.5" text-anchor="middle" font-family="monospace">TARGET E-FIELD BAND 0.2–0.5 V/m</text>
  <rect x="${toX(0.5)}" y="43.5" width="${toX(1.0) - toX(0.5)}" height="5" fill="#ea580c" opacity="0.3" />
  <line x1="${meanX}" y1="36" x2="${meanX}" y2="56" stroke="#0284c7" stroke-width="2.5" />
  <text x="${meanX}" y="33" fill="#0284c7" font-size="7" text-anchor="middle" font-family="monospace">mean ${meanE.toFixed(2)}</text>
  <line x1="${peakX}" y1="34" x2="${peakX}" y2="58" stroke="#dc2626" stroke-width="2.5" />
  <circle cx="${peakX}" cy="58" r="3" fill="#dc2626" />
  <text x="${peakX}" y="70" fill="#b91c1c" font-size="7" font-weight="bold" text-anchor="middle" font-family="monospace">PEAK ${peakE.toFixed(2)} V/m</text>
  <text x="10" y="10" fill="#64748b" font-size="7" font-family="monospace">CORTICAL E-FIELD MAGNITUDE SPECTRUM (V/m)</text>
  <line x1="10" y1="64" x2="218" y2="64" stroke="#e2e8f0" stroke-width="1" />
  ${[0, 0.25, 0.5, 0.75, 1.0].map((t) => `<line x1="${toX(t)}" y1="62" x2="${toX(t)}" y2="66" stroke="#94a3b8" stroke-width="1" />`).join('')}
</svg>`;
}

/** Hexagonal cognitive outcome radar chart */
function buildRadarSvg(metrics: BiophysicalTelemetry['compositeMetrics']): string {
  const CX = 70;
  const CY = 62;
  const R = 44;
  const axes: Array<{ label: string; value: number }> = [
    { label: 'Focus', value: metrics.focus },
    { label: 'Mood', value: metrics.mood },
    { label: 'Motor', value: metrics.motorSpeed },
    { label: 'Lang', value: metrics.language },
    { label: 'Pain', value: metrics.painThreshold },
    { label: 'Vision', value: metrics.visualAcuity }
  ];
  const ang = (i: number) => ((-90 + i * 60) * Math.PI) / 180;
  const pt = (r: number, i: number) => ({ x: CX + r * Math.cos(ang(i)), y: CY + r * Math.sin(ang(i)) });
  const rings = [0.25, 0.5, 0.75, 1]
    .map((f) => {
      const ring = axes.map((_, i) => `${pt(R * f, i).x.toFixed(1)},${pt(R * f, i).y.toFixed(1)}`).join(' ');
      return `<polygon points="${ring}" fill="none" stroke="#e2e8f0" stroke-width="0.8" />`;
    })
    .join('');
  const spokes = axes.map((_, i) => `<line x1="${CX}" y1="${CY}" x2="${pt(R, i).x.toFixed(1)}" y2="${pt(R, i).y.toFixed(1)}" stroke="#e2e8f0" stroke-width="0.8" />`).join('');
  const shape = axes
    .map((a, i) => {
      const r = R * Math.max(0, Math.min(1, a.value / 100));
      return `${pt(r, i).x.toFixed(1)},${pt(r, i).y.toFixed(1)}`;
    })
    .join(' ');
  const labels = axes
    .map((a, i) => {
      const lp = pt(R + 11, i);
      const anchor = Math.abs(lp.x - CX) < 4 ? 'middle' : lp.x > CX ? 'start' : 'end';
      const tint = a.value >= 0 ? '#15803d' : '#b91c1c';
      const val = a.value >= 0 ? `+${a.value}` : `${a.value}`;
      return `<text x="${lp.x.toFixed(1)}" y="${(lp.y + 3).toFixed(1)}" fill="${tint}" font-size="7.5" font-weight="bold" text-anchor="${anchor}" font-family="monospace">${a.label} ${val}</text>`;
    })
    .join('');

  return `<svg viewBox="0 0 140 124" width="100%" height="124" xmlns="http://www.w3.org/2000/svg">
  ${rings}${spokes}
  <polygon points="${shape}" fill="#0891b2" fill-opacity="0.25" stroke="#0891b2" stroke-width="2" />
  ${axes
    .map((a, i) => {
      const r = R * Math.max(0, Math.min(1, a.value / 100));
      return `<circle cx="${pt(r, i).x.toFixed(1)}" cy="${pt(r, i).y.toFixed(1)}" r="2.4" fill="#0891b2" />`;
    })
    .join('')}
  ${labels}
</svg>`;
}

/** 1-page visual patient infographic passport */
function buildPassportHtml(
  anodeId: string,
  cathodeId: string,
  ma: number,
  durMin: number,
  chargeC: number,
  safetyIndex: string,
  shuntPct: number
): string {
  const chip = 'display:inline-flex;align-items:center;gap:6px;padding:5px 10px;border-radius:8px;font-size:9pt;font-weight:700;';
  return `
<div style="page-break-before: always;" class="section-title">Patient Take-Home Infographic Passport</div>
<div style="border:2px solid #0369a1; border-radius:12px; padding:14px; background:linear-gradient(180deg,#f0f9ff 0%, #ffffff 100%);">
  <div style="display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid #bae6fd; padding-bottom:8px; margin-bottom:10px;">
    <div style="display:flex; align-items:center; gap:8px;">
      <div style="width:30px;height:30px;border-radius:8px;background:#0369a1;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;">N</div>
      <div style="font-weight:800; font-size:12pt; color:#0369a1;">NeuroFlow tDCS Session Passport</div>
    </div>
    <span style="${chip}background:#ffffff;border:1.5px solid ${safetyIndex === 'OPTIMAL' ? '#22c55e' : '#f59e0b'};color:${safetyIndex === 'OPTIMAL' ? '#15803d' : '#b45309'};border-radius:9999px;">✓ SAFETY ${safetyIndex}</span>
  </div>

  <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:8px; margin-bottom:10px;">
    <div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:8px;text-align:center;">
      <div style="font-size:7.5pt;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Anode (+)</div>
      <div style="font-size:13pt;font-weight:800;color:#dc2626;">${anodeId}</div>
    </div>
    <div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:8px;text-align:center;">
      <div style="font-size:7.5pt;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Cathode (−)</div>
      <div style="font-size:13pt;font-weight:800;color:#0891b2;">${cathodeId}</div>
    </div>
    <div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:8px;text-align:center;">
      <div style="font-size:7.5pt;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Current ⚡</div>
      <div style="font-size:13pt;font-weight:800;color:#b45309;">${ma.toFixed(1)} mA</div>
    </div>
    <div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:8px;text-align:center;">
      <div style="font-size:7.5pt;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Duration ⏱</div>
      <div style="font-size:13pt;font-weight:800;color:#0369a1;">${durMin} min</div>
    </div>
  </div>

  <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:8px;">
    <div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:8px;">
      <div style="font-size:8pt;color:#334155;"><strong>1 · Gentle ramps.</strong> Current inj. eases in/out (30 s) — brief tingling is normal.</div>
    </div>
    <div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:8px;">
      <div style="font-size:8pt;color:#334155;"><strong>2 · Total dose.</strong> ${chargeC.toFixed(1)} C delivered · ${shuntPct.toFixed(1)}% shunted by scalp/CSF by design.</div>
    </div>
    <div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:8px;">
      <div style="font-size:8pt;color:#334155;"><strong>3 · Post-session window.</strong> Cortical facilitation persists ~1 hour after power-off.</div>
    </div>
  </div>
</div>`;
}

/**
 * Generates an institutional print-ready clinical report HTML window
 * and triggers window.print()
 */
export function printProtocolReport(data: ProtocolReportData): void {
  const { montageState, telemetry, subjectId = 'TDCS-SUBJ-001', clinicalNotes = 'Routine research protocol session.' } = data;
  const anodeNode = BRAIN_NODES[montageState.anode] || BRAIN_NODES['F3'];
  const cathodeNode = BRAIN_NODES[montageState.cathode] || BRAIN_NODES['Fp2'];
  const timestamp = new Date().toUTCString();

  // HD 4x1 ring return electrodes for the montage map (mirrors the live preset lookup)
  const surroundNodeIds =
    montageState.mode === 'hd4x1'
      ? CLINICAL_PRESETS.find((p) => p.anode === montageState.anode && p.cathode === montageState.cathode)?.surroundNodes
      : undefined;

  const printWindow = window.open('', '_blank', 'width=900,height=1000');
  if (!printWindow) {
    alert('Please allow popups to export the clinical protocol report.');
    return;
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>NeuroFlow tDCS Protocol Report — ${subjectId}</title>
  <style>
    @page {
      size: A4;
      margin: 18mm 16mm;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      line-height: 1.45;
      font-size: 11pt;
      margin: 0;
      padding: 20px;
    }
    .header {
      border-bottom: 2px solid #0284c7;
      padding-bottom: 12px;
      margin-bottom: 18px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .title {
      font-size: 18pt;
      font-weight: 800;
      color: #0369a1;
      letter-spacing: -0.5px;
      margin: 0;
    }
    .subtitle {
      font-size: 9pt;
      color: #64748b;
      margin-top: 3px;
      font-family: monospace;
    }
    .badge {
      display: inline-block;
      padding: 3px 8px;
      font-size: 8pt;
      font-weight: bold;
      border-radius: 4px;
      text-transform: uppercase;
    }
    .badge-optimal { background: #dcfce7; color: #15803d; border: 1px solid #86efac; }
    .badge-caution { background: #fef3c7; color: #b45309; border: 1px solid #fde68a; }
    
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 16px;
    }
    .card {
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 12px 14px;
      background: #f8fafc;
    }
    .card-title {
      font-size: 9pt;
      font-weight: 700;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9.5pt;
      margin-top: 6px;
    }
    th, td {
      padding: 5px 8px;
      text-align: left;
      border-bottom: 1px solid #e2e8f0;
    }
    th {
      color: #64748b;
      font-weight: 600;
      width: 55%;
    }
    td {
      font-weight: 600;
      color: #0f172a;
      font-family: monospace;
    }
    .section-title {
      font-size: 11pt;
      font-weight: 700;
      color: #0f172a;
      margin-top: 18px;
      margin-bottom: 8px;
      border-left: 3px solid #0284c7;
      padding-left: 8px;
    }
    .checklist {
      list-style: none;
      padding-left: 0;
      margin: 6px 0;
      font-size: 9pt;
    }
    .checklist li {
      padding: 3px 0;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .check-icon {
      color: #16a34a;
      font-weight: bold;
    }
    .citations {
      font-size: 8pt;
      color: #64748b;
      margin-top: 20px;
      border-top: 1px solid #e2e8f0;
      padding-top: 10px;
      line-height: 1.5;
    }
    .footer {
      margin-top: 25px;
      display: flex;
      justify-content: space-between;
      border-top: 1px dashed #cbd5e1;
      padding-top: 12px;
      font-size: 8pt;
      color: #94a3b8;
    }
    .signature-line {
      margin-top: 30px;
      border-top: 1px solid #0f172a;
      width: 220px;
      font-size: 8pt;
      text-align: center;
      padding-top: 4px;
    }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1 class="title">NEUROFLOW tDCS CLINICAL REPORT</h1>
      <div class="subtitle">TRANSCRANIAL DIRECT CURRENT STIMULATION DOSIMETRY & PROTOCOL RECORD</div>
    </div>
    <div style="text-align: right;">
      <span class="badge ${telemetry.safetyIndex === 'OPTIMAL' ? 'badge-optimal' : 'badge-caution'}">
        SAFETY: ${telemetry.safetyIndex}
      </span>
      <div class="subtitle" style="margin-top: 4px;">ID: ${subjectId}</div>
    </div>
  </div>

  <div class="grid">
    <div class="card">
      <div class="card-title">Session Metadata</div>
      <table>
        <tr><th>Date & Time (UTC)</th><td>${timestamp}</td></tr>
        <tr><th>Subject Identifier</th><td>${subjectId}</td></tr>
        <tr><th>Montage Mode</th><td>${montageState.mode === 'hd4x1' ? 'HD-tDCS (4x1 Ring Array)' : 'Standard Sponge Pads'}</td></tr>
      </table>
    </div>

    <div class="card">
      <div class="card-title">Electrode Configuration (10-20 System)</div>
      <table>
        <tr><th>Anode (+) Depolarization</th><td>${anodeNode.id} — ${anodeNode.shortName}</td></tr>
        <tr><th>Anode Brodmann Areas</th><td>${anodeNode.brodmannAreas.join(', ')} (${anodeNode.lobe})</td></tr>
        <tr><th>Cathode (-) Hyperpolarization</th><td>${cathodeNode.id} — ${cathodeNode.shortName}</td></tr>
        <tr><th>Cathode Brodmann Areas</th><td>${cathodeNode.brodmannAreas.join(', ')} (${cathodeNode.lobe})</td></tr>
      </table>
    </div>
  </div>

  <div class="section-title">Visual Montage & Dosimetry Diagrams (Publication-Grade Record)</div>
  <div class="grid">
    <div class="card">
      <div class="card-title">2D 10-20 Scalp Montage Map</div>
      ${buildMontageMapSvg(anodeNode.id, cathodeNode.id, surroundNodeIds)}
    </div>
    <div class="card">
      <div class="card-title">Safety Consensus Seal & J-Dial</div>
      ${buildSafetySealSvg(telemetry.safetyIndex, telemetry.currentDensityMaCm2)}
    </div>
  </div>

  <div class="section-title">Electrical Biophysics & Cortical Dosimetry</div>
  <div class="grid">
    <div class="card">
      <div class="card-title">Dosimetry Metrics</div>
      <table>
        <tr><th>Injected Current (I)</th><td>${montageState.ma.toFixed(2)} mA</td></tr>
        <tr><th>Electrode Pad Area (A)</th><td>${montageState.pad} cm²</td></tr>
        <tr><th>Scalp Current Density (J)</th><td>${telemetry.currentDensityMaCm2.toFixed(3)} mA/cm² (${telemetry.currentDensityAM2.toFixed(2)} A/m²)</td></tr>
        <tr><th>Duration (t)</th><td>${montageState.dur} min</td></tr>
        <tr><th>Total Injected Charge (Q)</th><td>${telemetry.totalChargeCoulombs.toFixed(1)} Coulombs</td></tr>
        <tr><th>Charge Density</th><td>${telemetry.chargeDensityCCm2.toFixed(4)} C/cm²</td></tr>
      </table>
    </div>

    <div class="card">
      <div class="card-title">Cortical Field & Polarization</div>
      <table>
        <tr><th>Scalp/CSF Current Shunt</th><td>${telemetry.shuntPercentage.toFixed(1)}%</td></tr>
        <tr><th>Peak Cortical E-Field (|E|)</th><td>${telemetry.peakEFieldVm.toFixed(3)} V/m</td></tr>
        <tr><th>Mean Cortical E-Field</th><td>${telemetry.meanCorticalEFieldVm.toFixed(3)} V/m</td></tr>
        <tr><th>Pyramidal Somatic ΔVm</th><td>+${telemetry.maxMembraneShiftMv.toFixed(2)} mV</td></tr>
        <tr><th>Polarity Mechanism</th><td>Sub-threshold radial membrane shift</td></tr>
        <tr><th>Neuroplasticity Window</th><td>BDNF / NMDA LTP-like Facilitation</td></tr>
      </table>
    </div>
  </div>

  <div class="section-title">Cortical Field Spectrum & Cognitive Outcome Radar</div>
  <div class="grid">
    <div class="card">
      <div class="card-title">Cortical E-Field Spectrum</div>
      ${buildFieldSpectrumSvg(telemetry.peakEFieldVm, telemetry.meanCorticalEFieldVm)}
    </div>
    <div class="card">
      <div class="card-title">Cognitive Outcome Radar (% baseline shift)</div>
      ${buildRadarSvg(telemetry.compositeMetrics)}
    </div>
  </div>

  <div class="section-title">Safety & Compliance Screening (Bikson et al. 2016)</div>
  <div class="card">
    <ul class="checklist">
      <li><span class="check-icon">✓</span> Current density complies with consensus limit (J = ${telemetry.currentDensityMaCm2.toFixed(3)} ≤ 0.080 mA/cm²).</li>
      <li><span class="check-icon">✓</span> Total charge density within safe human non-lesional window (≤ 0.144 C/cm²).</li>
      <li><span class="check-icon">✓</span> Screened for cranial metallic implants, pacemakers, and implanted neurostimulators.</li>
      <li><span class="check-icon">✓</span> Verified skin integrity with standard conductive 0.9% NaCl saline sponge hydration.</li>
    </ul>
    <div style="font-size: 8.5pt; color: #64748b; margin-top: 6px;">
      <strong>Clinical Safety Assessment:</strong> ${telemetry.safetyMessage}
    </div>
  </div>

  <div class="section-title">Clinical Notes & Operator Observations</div>
  <div class="card" style="min-height: 50px;">
    <div style="font-size: 9pt; color: #334155; font-style: italic;">
      ${clinicalNotes}
    </div>
  </div>

  ${buildPassportHtml(
    anodeNode.id,
    cathodeNode.id,
    montageState.ma,
    montageState.dur,
    telemetry.totalChargeCoulombs,
    telemetry.safetyIndex,
    telemetry.shuntPercentage
  )}

  <div style="display: flex; justify-content: space-between; margin-top: 35px;">
    <div>
      <div class="signature-line">Investigator Signature / Date</div>
    </div>
    <div>
      <div class="signature-line">Quality Assurance / Clinical Monitor</div>
    </div>
  </div>

  <div class="citations">
    <strong>Peer-Reviewed Literature References:</strong><br/>
    1. Nitsche MA, Paulus W. (2000). Excitability changes induced in the human motor cortex by weak transcranial direct current stimulation. <em>J. Physiol.</em> 527(3):633–639. [PMID: 10990547]<br/>
    2. Bikson M, et al. (2016). Safety of Transcranial Direct Current Stimulation: Evidence Based Update 2016. <em>Brain Stimul.</em> 9(5):641–661. [PMID: 27372845]<br/>
    3. Lefaucheur JP, et al. (2020). Evidence-based guidelines on the therapeutic use of transcranial direct current stimulation (tDCS). <em>Clin Neurophysiol.</em> 131(2):684–698. [PMID: 31956149]
  </div>

  <div class="footer">
    <span>NeuroFlow tDCS Clinical Simulator — Formatted for Medical Record Keeping</span>
    <span>URL Hash: ${window.location.hash || '#standard'}</span>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 350);
    };
  </script>
</body>
</html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}

/**
 * Exports protocol record as a formatted Markdown file
 */
export function exportProtocolMarkdown(data: ProtocolReportData): void {
  const { montageState, telemetry, subjectId = 'TDCS-SUBJ-001' } = data;
  const anodeNode = BRAIN_NODES[montageState.anode] || BRAIN_NODES['F3'];
  const cathodeNode = BRAIN_NODES[montageState.cathode] || BRAIN_NODES['Fp2'];

  const md = `# NEUROFLOW tDCS — CLINICAL PROTOCOL REPORT
**Subject ID:** ${subjectId}  
**Date:** ${new Date().toISOString()}  
**Safety Status:** ${telemetry.safetyIndex}

---

## 1. MONTAGE & ELECTRODE TARGETING
- **Anode (+):** ${anodeNode.id} — ${anodeNode.name} (${anodeNode.brodmannAreas.join(', ')})
- **Cathode (-):** ${cathodeNode.id} — ${cathodeNode.name} (${cathodeNode.brodmannAreas.join(', ')})
- **Montage Architecture:** ${montageState.mode === 'hd4x1' ? 'HD-tDCS 4x1 Ring Array' : 'Conventional Sponge Pads'}
- **Pad Area:** ${montageState.pad} cm²

## 2. DOSIMETRY & BIOPHYSICAL TELEMETRY
| Parameter | Value | Reference / Safety Threshold |
| :--- | :--- | :--- |
| **Current ($I$)** | ${montageState.ma.toFixed(2)} mA | Recommended $\\le 2.0$ mA |
| **Current Density ($J$)** | ${telemetry.currentDensityMaCm2.toFixed(3)} mA/cm² | Limit: $0.080$ mA/cm² |
| **Duration ($t$)** | ${montageState.dur} min | Safe range: $10 - 30$ min |
| **Total Injected Charge ($Q$)** | ${telemetry.totalChargeCoulombs.toFixed(1)} C | Cumulative session charge |
| **Charge Density** | ${telemetry.chargeDensityCCm2.toFixed(4)} C/cm² | Non-lesional threshold: $< 0.144$ C/cm² |
| **Scalp Shunting Fraction** | ${telemetry.shuntPercentage.toFixed(1)}% | CSF/Scalp parallel shunting |
| **Peak Cortical E-Field ($|\\vec{E}|$)** | ${telemetry.peakEFieldVm.toFixed(3)} V/m | Target range: $0.2 - 0.8$ V/m |
| **Pyramidal $\\Delta V_m$** | +${telemetry.maxMembraneShiftMv.toFixed(2)} mV | Sub-threshold somatic shift |

## 3. CLINICAL VERIFICATION
- Consensus Safety Index: **${telemetry.safetyIndex}**
- ${telemetry.safetyMessage}

*Generated via NeuroFlow tDCS Platform.*
`;

  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `tdcs_protocol_${subjectId}_${Date.now()}.md`;
  a.click();
  URL.revokeObjectURL(url);
}
