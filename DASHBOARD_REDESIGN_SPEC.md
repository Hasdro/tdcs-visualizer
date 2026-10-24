# NeuroFlow tDCS Visualizer: Hybrid Polish & Multi-Mode Dashboard Specification

---

## 1. Executive Directive & Strategy

### 1.1 Guiding Philosophy: Hybrid Polish (Option B)
This specification outlines the architecture to transform the **NeuroFlow tDCS Visualizer** into a clean, human-understandable, and structured platform while preserving its high-performance **dark futuristic visual identity**, custom 3D WebGL brain shaders, and interactive SVG animations.

- **Retain:** Dark futuristic theme (`#070B12`), bio-luminescent neon accents (Anode Red `#EF4444`, Cathode Cyan `#06B6D4`, Field Amber `#F59E0B`, Safety Emerald `#10B981`), 60 FPS Canvas/WebGL renderers, and engaging visual graphics.
- **Transform:** Eliminate cognitive clutter, disorganized widget dumping, and ungrounded sci-fi naming. Establish a standardized clinical information hierarchy, readable UI typography (clean sans-serif for prose; tabular monospace reserved for numeric telemetry), and progressive disclosure.
- **New Core Feature:** **View Mode Switcher** (`Clinical`, `Research`, `Patient/Trainee`) dynamically filtering data density and UI complexity to match the user's specific mental model.

---

## 2. Global Layout Architecture & View Modes

### 2.1 View Mode Switcher Matrix

The interface introduces a prominent segmented control in the top bar:

```
[ 🩺 Clinical View ]   [ 🔬 Research & Biophysics ]   [ 👤 Patient & Trainee ]
```

| Feature / Widget | 🩺 Clinical View (Default) | 🔬 Research & Biophysics | 👤 Patient & Trainee |
| :--- | :--- | :--- | :--- |
| **Primary Focus** | Treatment efficacy, safety limits, pad positions, side effects, protocol export. | Vector fields ($E, E_n$), tissue dissipation, multi-channel matrices, MNI coordinates. | Plain-English explanations, pad placement guide, sensation preview, FAQ. |
| **Top Header** | Protocol Title, Evidence Grade, Safety Beacon, Mode Switcher. | Complete circuit specs, active array channels, dose telemetry. | Simplified treatment goal, step-by-step guidance, audio ASSR. |
| **Left Dock (Montage & Setup)** | 10-20 Scalp Map, Clinical Presets, Dosage Sliders (mA, min, cm²), Safety Gauge. | 10-20 Map, HD 4×1 Array Matrix, Multi-electrode current injector, Lead-field controls. | Visual 3D head placement guides, step-by-step electrode setup instructions. |
| **Center Viewport (3D Stage)** | 3D Cortex + Anode/Cathode Pads + Simple thermal $E$-field heatmap. | Full streamlines, Brodmann cytoarchitectural zones, vector normals, point clouds. | Guided camera focus on electrode sites, anatomical callouts, interactive pulse. |
| **Right Dock (Inspector)** | **Tab 1:** Clinical Indication & Evidence<br>**Tab 2:** Safety & Sensations<br>**Tab 3:** Expected Outcomes | **Tab 1:** Biophysics & Shunting<br>**Tab 2:** Quantitative EEG Spectrum<br>**Tab 3:** Synaptic Vm Dynamics | **Tab 1:** What Will I Feel?<br>**Tab 2:** How Does It Work?<br>**Tab 3:** Safety & Precautions |

---

## 3. Screen Layout & Wireframe

```
+------------------------------------------------------------------------------------------------------------------------+
| TOP BAR: [Logo & Brand] | [ View Mode Switcher: 🩺 Clinical | 🔬 Research | 👤 Patient ] | [Global Safety Beacon] | [Actions] |
+------------------------------------+---------------------------------------------------+-------------------------------+
| LEFT PANEL (Config & Setup: 320px) | CENTER 3D VIEWPORT (Anatomical Stage)             | RIGHT PANEL (Inspector: 380px)|
|                                    |                                                   |                               |
| [1] Clinical Indication & Preset   | • Interactive 3D Cranium & Cortical Mesh          | [Dynamic Tabs by View Mode]   |
|   • Grouped dropdown with evidence | • Dynamic E-Field Gradient (0 to 0.8 V/m)         |                               |
|   • Level A / B / C badges         | • Standard Camera Snaps (Front, Top, Left, Right) | CLINICAL MODE:                |
|                                    | • Calibrated Scientific Colorbar Legend           | 1. Safety & Dosimetry Status  |
| [2] Electrode Montage              | • Floating Measurement HUD (Peak V/m, ΔVm)        |    (Consensus Bullet Bar)     |
|   • 10-20 Scalp Compass Map        |                                                   | 2. Sensation & Side Effects   |
|   • Sponge vs. HD 4×1 Selector     |                                                   |    (Expectancy Scores)        |
|   • Instant Polarity Swap (⇄)      |                                                   | 3. Clinical Response Profile  |
|                                    |                                                   |    (Cognitive Domain Radar)   |
| [3] Dosage Controls                |                                                   |                               |
|   • Current Intensity: 0.5 - 2.5 mA|                                                   | RESEARCH / PATIENT MODES:     |
|   • Duration: 5 - 30 minutes       |                                                   | (Filtered accordingly per §2) |
|   • Pad Area: 10 - 35 cm²          |                                                   |                               |
+------------------------------------+---------------------------------------------------+-------------------------------+
| FOOTER: Active Literature Citations (PMID) | Tissue Shunt Summary | Export Protocol PDF | URL Share State            |
+------------------------------------------------------------------------------------------------------------------------+
```

---

## 4. Component Redesign & Standardization Blueprints

### 4.1 Top Clinical Telemetry & Mode Header
- **View Mode Switcher:** Modern segmented pill control:
  - Active tab highlighted in vibrant cyan/emerald with smooth transition.
- **Global Safety Beacon:** Prominent status badge:
  - `OPTIMAL`: Emerald pill with gentle pulse (`✓ Within Consensus Limits — 3.1x Safety Margin`).
  - `CAUTION`: Amber pill (`⚠ Prolonged Duration or Elevated Density`).
  - `THRESHOLD_EXCEEDED`: Crimson alert badge (`⛔ Exceeds 0.25 mA/cm²`).
- **Quick Actions:** Retain `Export Protocol`, `Audio ASSR`, and `Share URL` with clean icon-and-label buttons.

### 4.2 Left Panel: Setup & Parameters (320px)
Organized into three clean, collapsible sections:
1. **Target Indication & Preset Selector:**
   - Dropdown grouped by clinical domain (*Depression / Mood, Cognitive / ADHD, Motor Rehabilitation, Chronic Pain, Language*).
   - Each preset displays clinical code (e.g. `F3 / Fp2`), recommended dose (`2.0 mA @ 20m`), and evidence level (`Level A`).
2. **10-20 Scalp Compass & Montage Geometry:**
   - Retain the top-down 2D azimuthal head topomap (`ScalpTopomap1020.tsx`), but add clear anatomical orientation cues (*Nasion / Nose, Inion / Back, Left / Right ears*).
   - Montage Mode Segment: `[ 🔲 Standard Sponge (25 cm²) ]` vs. `[ 🎯 HD-tDCS 4×1 Ring (3.14 cm²) ]`.
   - Polarity Inversion button with clear icon and tooltip.
3. **Dosimetry Sliders:**
   - Clean sliders with high-contrast thumb grips, numeric inputs, and standard reference markers ($1.0\text{ mA}, 2.0\text{ mA}$; $20\text{ min}$; $25\text{ cm}^2$).

### 4.3 Center Stage: 3D Anatomical Viewport
- **Unobstructed View:** Clean background with floating camera orientation cube (Front, Top, Left Lateral, Right Lateral, Isometric).
- **Scientific Colorbar Legend:** Clear gradient bar at bottom showing $0.0\text{ V/m}$ (Deep Blue) to $0.8+\text{ V/m}$ (Bright Amber/White) with physical units and typical cortical thresholds.
- **Layer Visibility Toolbar:** Reorganize into a clean floating glass pill tray:
  - `Skin`, `10-20 Scalp`, `E-Field Heatmap`, `Streamlines`, `Brodmann Labels`.

### 4.4 Right Panel: Inspector Docks (Tailored by Mode)

#### A. In Clinical Mode:
1. **Consensus Safety & Dosimetry Card:**
   - **Stephen Few Linear Bullet Graph:** Current density $J$ ($0.080\text{ mA/cm}^2$) placed against color-coded consensus zones:
     - $0.00 - 0.08$: Optimal clinical dose.
     - $0.08 - 0.15$: Standard research dose.
     - $0.15 - 0.25$: High caution zone.
     - $> 0.25$: Threshold exceeded (lesion risk).
   - Clear charge summary ($Q = 2.40\text{ C}$, $0.096\text{ C/cm}^2$).
2. **Patient Sensation & Tolerability Barometer:**
   - Clean horizontal likelihood bars for expected side effects:
     - **Tingling / Itching:** Expected ($7/10$) — transient during ramp-up.
     - **Skin Erythema:** Mild ($4/10$) — resolving within 45 min.
     - **Phosphenes (Retinal Flashes):** Unlikely ($<5\%$).
     - **Metallic Taste:** Absent ($0\%$).
3. **Clinical Outcome Profile:**
   - Retain the hexagon radar (`CognitiveImpactRadar.tsx`) and the reaction time delta bar (`ReactionTimeRaceTrack.tsx`) with clean clinical labels: *Executive Focus, Mood Valence, Motor Speed, Speech Fluency, Pain Tolerance*.

#### B. In Research & Biophysics Mode:
1. **Tissue Conduction & Shunt Breakdown:**
   - Segmented horizontal current retention bar:
     - Total Injected: $2.00\text{ mA}$ ($100\%$).
     - Lost to Scalp Shunting: $1.25\text{ mA}$ ($62.4\%$).
     - Diverted by Skull & CSF: $0.35\text{ mA}$ ($17.6\%$).
     - Reaching Cortical Target: $0.40\text{ mA}$ ($20.0\%$).
2. **Quantitative EEG Spectral Shift:**
   - Clean 6-band bar chart comparing baseline against post-stimulation power ($\delta, \theta, \alpha, \beta, \gamma$).
   - Real-time 60 FPS oscilloscope waveform synthesizer.
3. **Cellular Membrane Dynamics:**
   - Linear resting membrane shift voltmeter ($-70.0\text{ mV} \rightarrow -69.18\text{ mV}$ towards $-55.0\text{ mV}$ threshold).
   - Retain the animated Synaptic Plasticity Diagram and Firing Probability Bell Curve.

#### C. In Patient & Trainee Mode:
1. **"Where Do the Pads Go?" (Step-by-Step Guide):**
   - High-contrast 3D camera snap to Anode and Cathode.
   - Plain English descriptions: e.g., *"Red pad goes on your left upper forehead; Blue pad goes above your right eyebrow."*
2. **"What Will I Feel?" (Sensation Walkthrough):**
   - Warm, reassuring explanations of the ramp-up tingling sensation.
   - Reassurance that tDCS uses gentle micro-currents ($<2.5\text{ mA}$) equivalent to a small fraction of a 9V battery.
3. **"How Does It Work?" (Cellular Primer):**
   - Interactive plain-English explainer illustrating that tDCS primes brain cells to make learning and therapy more effective, without triggering artificial seizures or shocks.

---

## 5. Typography, Color System & Code Guidelines

1. **Typography Hierarchy:**
   - Headings & Labels: High-readability sans-serif (`font-sans`, Inter / system-ui, semibold, tracking-tight).
   - Numeric Readouts & Physical Units: Tabular monospace (`font-mono font-bold text-amber-300`, etc.) for numbers like `2.0 mA`, `0.654 V/m`, `+0.82 mV`.
2. **Semantic Palette:**
   - **Anode (+):** Red/Coral (`#EF4444`, glow `rgba(239, 68, 68, 0.3)`).
   - **Cathode (–):** Cyan (`#06B6D4`, glow `rgba(6, 182, 212, 0.3)`).
   - **E-Field Energy:** Amber (`#F59E0B`).
   - **Safety / Optimal:** Emerald (`#10B981`).
   - **Caution / Elevated:** Orange (`#F97316`).
   - **Hazard / Exceeded:** Rose/Red (`#F43F5E`).
   - **Background Surfaces:** `#070B12` (Base), `#0A101D` (Header), `#0E1524` (Cards/Panels), `#1E293B` (Borders).

---

## 6. Implementation Action Plan for Implementing Agent

1. **Add View Mode State to `src/App.tsx`:**
   - State: `const [viewMode, setViewMode] = useState<'clinical' | 'research' | 'patient'>('clinical');`
2. **Render View Mode Segmented Control in Header:**
   - Add the 3-button switcher in the top bar.
3. **Refactor Left Dock into Categorized Sections:**
   - Group presets, 10-20 topomap, and dosage sliders with clear headings.
4. **Refactor Right Dock Tabs by Active View Mode:**
   - Dynamically display the appropriate telemetry suite based on `viewMode`.
5. **Standardize Card Headers & Typography:**
   - Replace cluttered uppercase headers with clear, standard clinical titles and human-readable tooltips.
6. **Verify Build & Visual Functionality:**
   - Run `npm run build` to ensure clean TypeScript compilation without errors.
