# Visual-First UI/UX Redesign Instruction Specification
## NeuroFlow tDCS Visualizer: Transforming Dense Text & Raw Biophysics into Intuitive Visual Telemetry

---

## 1. Document Overview & Objective

This instruction document provides an exhaustive, production-ready blueprint for an autonomous coding agent or frontend engineer to redesign the outer layout and dashboard of the **NeuroFlow tDCS Visualizer**. 

### The Problem
The current application contains exceptional biophysical simulation calculations, 3D cortical models, and peer-reviewed safety equations. However, **the outer interface (header, left config dock, floating HUD, and right inspector dock) is heavily text-dominated and number-saturated**:
- Users are presented with dense columns of raw floating-point numbers (`0.0800 mA/cm²`, `2.40 C`, `0.0960 C/cm²`, `62.4% shunted`, `0.654 V/m`, `+0.82 mV`).
- Electrode selection relies on long, clinical dropdown text menus (`F3 — Left DLPFC`, `C3 — Left Motor`).
- Critical safety criteria, tissue shunting, and cellular mechanisms are rendered as multiple paragraphs of clinical prose, PubMed text blocks, and bullet-point symptom lists.
- Clinical presets and layer toggles are rendered as plain text pill buttons with zero visual hint of their anatomical location or physiological target.

### The Objective
Transform the outer layout from a **text-and-numbers spreadsheet** into a **visual-first, glanceable clinical neuro-observatory**. Every key metric, anatomical relationship, safety threshold, and behavioral consequence must be conveyed through **gauges, radar charts, flow diagrams, topomaps, visual spectrums, and interactive pictograms**, allowing a human viewer (clinician, researcher, student, or patient) to understand stimulation impact within 2 seconds.

> **Instruction to Implementing Agent:** 
> Do not alter the underlying simulation mathematics or biophysical engine (`biophysicsEngine.ts`). All calculated metrics remain mathematically grounded in Miranda 2006 and Bikson 2016. Your mission is purely UI/UX presentation: **replace plain text and tables with visual interactive representations.**

---

## 2. Global Design Language & Visual System

1. **Aesthetic Identity:** "Mission Control for the Human Connectome" — precision aerospace telemetry meets high-contrast medical diagnostics.
2. **Color Semantics:**
   - **Anode (+ Depolarization / Excitation):** Radiant Coral Red (`#EF4444`, glow: `rgba(239, 68, 68, 0.4)`).
   - **Cathode (– Hyperpolarization / Inhibition):** Electric Cyan (`#06B6D4`, glow: `rgba(6, 182, 212, 0.4)`).
   - **E-Field Energy & Dosimetry:** Bio-luminescent Amber (`#F59E0B`).
   - **Safety / Optimal Tolerance:** Emerald Green (`#10B981`).
   - **Caution / Boundary Warning:** Warm Tangerine (`#F97316`).
   - **Threshold Exceeded / Lesion Hazard:** Crimson Rose (`#F43F5E`).
   - **Scalp Shunt / Lost Current:** Translucent Magenta/Rose (`#FB7185`).
3. **Motion & Feedback Floor:**
   - Real-time animated SVG transitions (`duration-300 ease-out`).
   - Needle sweeps and arc fills must react smoothly to slider input without frame drops.
   - 60 FPS lightweight Canvas or SVG renderers; avoid heavy third-party charting libraries when pure SVG/Tailwind achieves the same fidelity.

---

## 3. Comprehensive Outer Layout Audit & Transformation Blueprints

```
+-----------------------------------------------------------------------------------------------------------------------+
| TOP BAR: [Logo] | [Visual Preset Badges (Mini Heads)] | [Active Circuit Wire] | [Isometric Layer Stack] | [Quick Actions] |
+---------------------------------+---------------------------------------------------+---------------------------------+
| LEFT DOCK (280px)               | CENTER 3D STAGE & FLOATING HUD                    | RIGHT DOCK (380px)              |
|                                 |                                                   |                                 |
| 1. 2D 10-20 Head Compass        | • 3D Calvarium & Cortical Mesh                    | Tabs: [EEG] [Impact] [Cellular] |
|    (Clickable Scalp Topomap)    | • E-Field Thermal Spectrum Milestone Bar          |                                 |
|                                 | • Delta Vm Membrane Shift Meter                   | TAB 1: EEG SPECTRUM             |
| 2. Montage Focality Visualizer  | • 3D Viewport Orientation Cube (Snap Views)       | • 6-Band FFT Power Bar Chart    |
|    (Sponge Wash vs HD Bullseye) | • Gesture / Interaction Pictograms                | • Arousal/Focus 2D Compass      |
|                                 |                                                   | • Visual Brain State Tags       |
| 3. Tissue Shunt Waterfall       |                                                   |                                 |
|    (Scalp -> Skull -> Cortex)   |                                                   | TAB 2: COGNITIVE IMPACT         |
|                                 |                                                   | • Hexagonal Radar Chart         |
| 4. Bikson Safety Arc Dial       |                                                   | • Reaction Time Speedometer     |
|    (Aviation Cockpit Meter)     |                                                   | • Somatotopic Human Avatar      |
|                                 |                                                   |                                 |
| 5. Charge Dose Cylinder         |                                                   | TAB 3: CELLULAR SYNAPSE         |
|    (Fluid Battery Reservoir)    |                                                   | • Molecular Synaptic Cleft      |
|                                 |                                                   | • Firing Probability Bell Curve |
| 6. Sensation Matrix Pictograms  |                                                   | • GABA / Glutamate Balance Scale|
+---------------------------------+---------------------------------------------------+---------------------------------+
```

---

### ZONE 1: Top Navigation Bar & Global Header Chrome

#### A. Current State
- Plain text buttons for 8 clinical presets (`Depression (L-DLPFC)`, `Motor Stroke`, etc.) that truncate or get hidden on laptops.
- Generic text pills for 7 rendering layers (`Face Overlay`, `Scalp 10-20`, `Skull Shunt Halo`, `E-Field`, `Streamlines`, `Point-Cloud`, `Labels`).
- Action buttons are text heavy (`Audio ASSR`, `HD Matrix`, `Export Protocol`).

#### B. Visual Transformation Blueprint

1. **Visual Clinical Preset Ribbons (Miniature Anatomical Badges)**:
   - **What to build:** Replace the text buttons with an overflow ribbon of **Visual Treatment Cards**.
   - **Visual Structure:**
     - A miniature 24x24px stylized top-down head glyph with two illuminated LED pins:
       - 🔴 Red pin at anode position (e.g., F3).
       - 🔵 Blue pin at cathode position (e.g., Fp2).
     - Target functional icon:
       - Depression/Mood: ☀️ Golden sunrise icon.
       - Focus/ADHD: 🎯 Target crosshair icon.
       - Motor Stroke: ⚡ Dynamic motor spark icon.
       - Pain Relief: 🛡️ Soothing shield icon.
       - Anxiety / Calming: 🌊 Ripple wave icon.
     - Short clinical code: `F3/Fp2`, `C3/Fp2`, `O1/Cz`.
     - **Hover Preview:** Hovering over a preset badge pops a micro 2D head silhouette displaying the dipole field gradient before clicking to apply!

2. **Active Circuit Live Wire Pulse**:
   - In the center of the header, replace empty space with an animated electrical schematic:
     ```
     [ 🔴 F3 Anode ] ─── ~ ~ (⚡ 2.0 mA @ 20m) ~ ~ ──► [ 🔵 Fp2 Cathode ]
     ```
     - An animated SVG particle pulse travels from Anode to Cathode at a velocity proportional to `currentMa`.
     - Gives the user immediate visual confirmation that the simulated stimulator circuit is active.

3. **Isometric Layer Visualizer Stack (CAD/Photoshop Style)**:
   - **What to build:** Replace the 7 text pills with an **Anatomical Depth Stack Widget**.
   - **Visual Structure:**
     - Render an isometric icon stack showing layered discs representing anatomical depth:
       1. `[Skin]` Face Contour (Anterior Landmark)
       2. `[Scalp]` 10-20 Meridian Straps & Electrodes
       3. `[Skull]` Bone Barrier & Shunt Ring
       4. `[Heatmap]` Cortical E-Field Gradients
       5. `[Current]` 3D Vector Streamlines
       6. `[Neurons]` Point-Cloud Cellular Density
       7. `[Labels]` Brodmann Area Callouts
     - Each layer has an illuminated toggle ring in its distinct signature color (Sky, Cyan, Rose, Amber, Purple, Emerald).
     - Provides a clear spatial metaphor: users see they are peeling back anatomical layers from skin down into cortical grey matter.

---

### ZONE 2: Left Dock — Electrode Selection & 10-20 Head Compass

#### A. Current State
- Two native HTML `<select>` dropdowns with 25+ entries each (`F3 — Left DLPFC`, `C3 — Left Motor`, etc.). The user must scroll and read text abbreviations without knowing where on the skull the node is located.
- Plain text for target lobe and Brodmann numbers (`Target: 9, 46 (Frontal)`).
- Montage focality is two text buttons (`Sponge Pad` vs `HD 4x1 Ring`).

#### B. Visual Transformation Blueprint

1. **Interactive 2D Scalp Topomap / Electrode Compass (Azimuthal 10-20 Widget)**:
   - **What to build:** An interactive circular top-down projection of the human calvarium (featuring a subtle anterior nose notch at the top and left/right ear auricle markers).
   - **Component Name:** `ScalpTopomap1020.tsx`
   - **Visual Structure:**
     ```
                     [Nasion ▲]
                    Fp1   Fpz   Fp2
                 F7    F3    Fz    F4    F8
           [◄L]  T7    C3    Cz    C4    T8  [R►]
                 P7    P3    Pz    P4    P8
                    O1    Oz    O2
                     [Inion ▼]
     ```
   - **Interactivity:**
     - Every standard 10-20 electrode is a tactile SVG node.
     - **Anode Node:** Glowing bright red badge (`+`) with pulsing ripple ring.
     - **Cathode Node:** Glowing electric cyan badge (`-`) with inward magnetic vortex ring.
     - **HD-tDCS 4x1 Mode:** Center anode glows red, and the 4 surround ring cathodes glow cyan with connected radial dotted return wires.
     - **Interaction:** Clicking any node brings up a quick two-button radial pie menu: `[Set Anode (+)]` or `[Set Cathode (-)]`, or dragging from one node to another immediately connects the circuit!
     - Completely eliminates the need to scroll through confusing dropdown menus.

2. **Anatomical Lobe & Functional Silhouette**:
   - Beneath the compass, replace `"Target: 9, 46 (Frontal)"` with a dual-hemisphere brain icon:
     - The targeted lobe (Frontal, Motor, Parietal, Temporal, or Occipital) illuminates in vibrant amber or cyan.
     - Brodmann areas render as interactive chips: hovering over `[BA 9]` shows a miniature visual tooltip: *"Dorsolateral Prefrontal Cortex: Working Memory & Cognitive Control"*.

3. **Montage Focality Comparison Graphic**:
   - Replace the two text toggle buttons with a visual cross-section diagram:
     - **Sponge Pad Mode:** An SVG graphic showing a broad 5×5 cm square with wide, diffuse current dispersion penetrating deep and spreading widely across multiple gyri.
     - **HD 4×1 Ring Mode:** An SVG graphic showing a central 12mm disc surrounded by a tight 4-point ring, illustrating a razor-sharp, focal electric field confined strictly to the target gyrus.

---

### ZONE 3: Left Dock — Dosimetry & Live Safety Telemetry

#### A. Current State
- Dosimetry sliders display raw numbers (`2.0 mA`, `20 min`, `25 cm²`).
- Safety telemetry is presented as a list of 4 raw number strings:
  - `Current Density J: 0.0800 mA/cm² (0.800 A/m²)`
  - `Total Charge Q: 2.40 C`
  - `Charge Density: 0.0960 C/cm²`
  - `Scalp/CSF Shunt: 62.4%`
- Safety status is a text pill (`OPTIMAL`) followed by a 2-line italic text quote.

#### B. Visual Transformation Blueprint

1. **Tissue Shunt & Current Penetration Waterfall (Sankey / Layer Flow)**:
   - **What it solves:** Users have no mental model of what "62.4% shunt" means. They need to see *where* the electricity goes.
   - **Component Name:** `CurrentPenetrationWaterfall.tsx`
   - **Visual Structure:**
     ```
     Applied Current (100% = 2.0 mA)
             │
             ├───► [Scalp Skin & Subcutaneous] ──► 62.4% Lost in Scalp (Rose Shunt Flow)
             │
             ▼ High Resistance Skull Bone (ρ ≈ 80 Ω·m)
             ├───► [CSF Shunt Channel] ──────────► 18.2% Shunted in Fluid
             │
             ▼
     [Target Cortical Grey Matter] ──────────────► 19.4% Effective Transcortical Delivery
     ```
   - Render as a dynamic vertical cross-section diagram with animated glowing fluid streamlines.
   - When the user changes from Sponge to HD-tDCS, the cortical penetration visibly narrows and sharpens, showing higher focality!

2. **Aviation-Style Cockpit Safety Arc Gauge (Bikson Consensus Envelope)**:
   - **What to build:** A semi-circular speedometer-style gauge measuring current density ($J$ in $\text{mA/cm}^2$) and charge density ($Q_{\text{density}}$ in $\text{C/cm}^2$).
   - **Component Name:** `BiksonSafetyGauge.tsx`
   - **Visual Structure:**
     - 180-degree sweep divided into 4 calibrated clinical zones:
       - **Green Zone (0.00 – 0.08 mA/cm²):** "Clinical Consensus Safe Zone" (Bikson 2016).
       - **Amber Zone (0.08 – 0.15 mA/cm²):** "Research Upper Bound / Mild Erythema".
       - **Orange Zone (0.15 – 0.25 mA/cm²):** "Caution Zone / Scalp Irritation Risk".
       - **Red Zone (> 0.25 mA/cm²):** "Threshold Exceeded / Lesion Hazard".
     - A polished needle indicator sweeps smoothly as the Current ($I$) or Pad Area ($A$) sliders are moved.
     - Center digital readout displays the exact **Safety Factor Multiple**: e.g., `3.1× Below Threshold` in bright emerald text, giving instant peace of mind.

3. **Total Charge Dose Reservoir (Battery / Fluid Cylinder)**:
   - **What to build:** Total Coulombs ($Q = I \times t$) visualized as a high-tech cylindrical charge cell.
   - **Visual Structure:**
     - A transparent vertical cylinder with glowing fluid level.
     - Milestone tick marks:
       - `1.2 C`: 10 min @ 2 mA (Standard Primer).
       - `2.4 C`: 20 min @ 2 mA (Typical Clinical Protocol).
       - `3.6 C`: 30 min @ 2 mA (Upper Research Session Ceiling).
     - As the duration slider is dragged from 5 to 30 min, the fluid column rises with an animated bubbling meniscus and a warm ambient glow.

4. **Human Sensation Matrix (Visual Sensory Glyphs)**:
   - Replace the text quote with 4 intuitive visual sensory indicator badges that update in real time based on active electrodes and intensity:
     - ⚡ **Scalp Tingling Level:** 5-bar vertical signal meter (calculated from $J$).
     - 🥄 **Metallic Taste Risk:** Stylized tongue/gustatory icon that illuminates amber when electrodes are over F7, F8, T7, or T8 with $I \ge 1.0\text{ mA}$.
     - 👁️ **Phosphene Visual Flash:** Optical retina flare icon that warns if montage is near the orbital/occipital axis (Fp1, Fp2, Oz).
     - 🔴 **Skin Erythema (Redness) Meter:** Thermal skin swatch previewing expected post-session epidermal coloration.

---

### ZONE 4: Center Viewport Overlays & 3D HUD

#### A. Current State
- Top-left floating HUD card has 4 text boxes with raw numbers (`PEAK |E| FIELD: 0.654 V/m`, `CURRENT DENSITY J: 0.08 mA/cm²`, `SCALP SHUNT: 62.4%`, `MEMBRANE ΔVm: +0.82 mV`).
- Bottom legend is a static text bar (`Rotate: Left Click + Drag • Zoom: Scroll`).

#### B. Visual Transformation Blueprint

1. **Cortical E-Field Thermal Spectrum with Physiological Milestones**:
   - **What to build:** A vertical or horizontal color-spectrum bar integrated into the HUD.
   - **Visual Structure:**
     ```
     0.0 V/m [───Deep Sulcal Silence───] (Violet)
     0.2 V/m [───Synaptic Modulation Threshold───] (Cyan) ── Francis 2003
     0.5 V/m [───Robust Action Potential Bias───] (Amber) ── Bikson 2016
     0.8 V/m+ [───Peak Non-Invasive Ceiling───] (Radiant White-Red)
     ```
     - A live indicator pip slides along this spectrum bar based on the current `telemetry.peakEFieldVm`.
     - A human instantly sees: *"Is this dose strong enough to modulate neurons?"* (Yes, it's above the 0.2 V/m milestone pip!).

2. **Membrane Potential Shift Micro-Gauge ($\Delta V_m$)**:
   - An intuitive cellular voltage meter inside the HUD:
     - Baseline line at `-70.0 mV`.
     - Action potential threshold at `-55.0 mV`.
     - A dynamic colored delta chevron showing the exact $+0.82\text{ mV}$ nudge toward threshold (Anode = depolarizing in amber/red) or downward away from threshold (Cathode = hyperpolarizing in cyan).

3. **3D Viewport Orientation Cube & Camera Presets**:
   - **What to build:** In the top-right of the 3D viewport, add an interactive 3D Orientation Cube / Gimbal.
   - **Visual Structure:**
     - A small 3D cube with labeled faces: `FRONT` (Anterior/Face), `TOP` (Superior/Vertex), `LEFT` (Sagittal Left DLPFC/Motor), `RIGHT` (Sagittal Right), `BACK` (Occipital).
     - Clicking any face smoothly animates OrbitControls camera to that exact anatomical perspective.
     - Add 4 one-click quick view buttons: `[Anterior Face]`, `[Left DLPFC]`, `[Top Vertex]`, `[Bilateral View]`.

4. **Gesture & Navigation HUD Pictograms**:
   - Replace the bottom text legend with animated micro-pictograms:
     - Left-click drag icon (360° rotate orbit).
     - Right-click drag icon (pan translation).
     - Mouse wheel icon (smooth zoom).

---

### ZONE 5: Right Dock — Tab 1: EEG Spectral Synthesizer

#### A. Current State
- The animated canvas oscilloscope is great, but the bottom half contains 6 expandable cards filled with large paragraphs of clinical text, bulleted symptom lists, and raw percentage badges (`+18%`).

#### B. Visual Transformation Blueprint

1. **6-Band Real-Time FFT Power Spectrum Bar Chart**:
   - **What to build:** A dynamic spectral bar chart directly under the oscilloscope.
   - **Component Name:** `EegSpectralBarChart.tsx`
   - **Visual Structure:**
     - 6 vertical column groups:
       1. **Delta (δ, 0.5–4 Hz):** Deep Sleep & Cellular Repair (Slate/Blue).
       2. **Theta (θ, 4–8 Hz):** Drowsiness, Memory Consolidation & Meditation (Purple).
       3. **Alpha (α, 8–12 Hz):** Calm Focus, Flow State & Attentive Relaxation (Cyan).
       4. **Low Beta (β1, 13–20 Hz):** Active Thinking & Cognitive Processing (Emerald).
       5. **High Beta (β2, 21–30 Hz):** Alertness, Vigilance & Stress Arousal (Amber).
       6. **Gamma (γ, >30 Hz):** Peak Mental Binding, Insight & Hyper-Focus (Rose).
     - Each band displays:
       - A dashed reference line for normal unstimulated baseline (100%).
       - A solid glowing colored bar rising (+%) or dipping (-%) based on lead-field stimulation.
       - A visual delta arrow and percentage tag.
     - Allows instant visual comparison of the entire brainwave distribution without reading cards!

2. **Neuro-Arousal & Mental State 2D Compass**:
   - **What to build:** A 2D quadrant scatter matrix:
     - **Horizontal X-Axis:** Calming / De-arousal (Delta/Theta dominance) ◄──► High Arousal / Vigilance (Beta/Gamma dominance).
     - **Vertical Y-Axis:** Internal Reflection / Daydreaming ◄──► External Focus & Executive Drive.
     - A luminous cursor dot maps where the current stimulation montage pushes the subject's brain state.
     - Example: F3 Anodal montage clearly shifts the dot into the top-right quadrant: *"Peak Flow State & Executive Drive"*.

3. **Visual Brain State & Symptom Tag Clouds**:
   - Replace the dense bullet-point text lists ("Cognitive fatigue, excessive rumination, depression") with **Visual Benefit/Symptom Chips**:
     - Green/Cyan badges for positive clinical outcomes: `[🎯 Deep Working Memory]`, `[☀️ Mood Elevation]`, `[🧘 Stress Dissipation]`.
     - Muted amber badges for over-arousal risks: `[⚠️ Jittery if >2.5mA]`.

---

### ZONE 6: Right Dock — Tab 2: Human Performance & Cognitive Impact

#### A. Current State
- Dynamic state banner is a plain text box with an emoji.
- Interactive canvas simulator is accompanied by a plain text caption.
- Cognitive outcomes are 6 stacked linear progress bars with text percentages.

#### B. Visual Transformation Blueprint

1. **Hexagonal Cognitive Performance Radar / Spider Chart**:
   - **What to build:** Replace the 6 separate vertical progress bars with an interactive **Hexagonal Spider Web Radar Chart**.
   - **Component Name:** `CognitiveImpactRadar.tsx`
   - **Visual Structure:**
     - 6 equidistant vertices:
       1. **Executive Focus & Working Memory** (DLPFC / Frontal)
       2. **Mood Valence & Motivation** (Left Frontal / Limbic Bias)
       3. **Motor Speed & Corticospinal Excitability** (M1 / Motor Strip)
       4. **Speech & Verbal Fluency** (Broca / Left Temporal)
       5. **Pain Tolerance & Sensory Threshold** (Somatosensory S1)
       6. **Visual Contrast Sensitivity & Acuity** (Occipital O1/O2)
     - **Baseline:** Muted grey circular/hexagonal outline in the center (representing 0% normative baseline).
     - **Active Montage:** A luminous glowing polygon (filled with translucent cyan/emerald gradient) that dynamically distorts and expands along the enhanced dimensions.
     - **Viewer Intuition:** A clinician or viewer immediately recognizes the "shape" of a protocol:
       - Depression montage produces a sharp anterior/mood bulge.
       - Motor stroke montage produces a strong lateral motor peak.

2. **Reaction Time Delta Speedometer & Visual Race Track**:
   - Replace the text `Reaction Time: 385 ms` with a visual comparison track:
     - Two horizontal race bars:
       - **Baseline:** 410 ms (Standard normative reaction).
       - **Stimulated:** 385 ms (tDCS accelerated reaction).
     - A visual delta marker highlighting: `[⚡ 25 ms Faster Action Initiation]`.

3. **Somatotopic Human Homunculus Avatar**:
   - A sleek stylized human anatomical silhouette in the panel:
     - When Motor M1 (C3/C4) is stimulated, the hands and arms on the avatar illuminate with an electrical current glow.
     - When DLPFC is stimulated, the forehead and eyes glow.
     - When Somatosensory S1 is stimulated, the sensory body map illuminates.
     - Connects abstract electrode positions directly to the user's own physical body!

---

### ZONE 7: Right Dock — Tab 3: Cellular Vm & Synaptic Plasticity

#### A. Current State
- Oscilloscope for somatic membrane potential is present.
- 3 stats cards show raw text numbers (`RESTING POTENTIAL: -69.18 mV`, `DIST. TO THRESHOLD: 14.18 mV`, `FIRING PROBABILITY: ↑ +34%`).
- Synaptic mechanisms and receptor dynamics (NMDA, Ca²⁺, BDNF, GABA) are 4 large text cards with dense molecular biology paragraphs.
- PubMed citations are long text cards.

#### B. Visual Transformation Blueprint

1. **Interactive Synaptic Cleft Molecular Schematic**:
   - **What to build:** Replace the 4 dense text cards with an animated **Synaptic Transmission Diagram**.
   - **Component Name:** `SynapticPlasticityDiagram.tsx`
   - **Visual Structure:**
     - **Presynaptic Axon Terminal:**
       - Neurotransmitter vesicles releasing Glutamate (green spheres) or GABA (cyan diamonds) into the synaptic gap.
     - **Postsynaptic Dendritic Spine Membrane:**
       - **NMDA Receptor Channel:**
         - *Under Anode:* The somatic depolarization visibly expels the red Magnesium ($\text{Mg}^{2+}$) blocker plug out of the channel pore, allowing a glowing cascade of $\text{Ca}^{2+}$ ions (golden particles) to flood into the spine!
         - *Under Cathode:* The $\text{Mg}^{2+}$ plug is locked tightly in the channel pore; $\text{Ca}^{2+}$ influx is reduced to a faint trickle.
       - **AMPA Receptor Insertion (LTP vs LTD):**
         - *Anodal LTP:* Show new AMPA receptor channels budding and inserting into the membrane, increasing future synaptic sensitivity.
         - *Cathodal LTD:* Show AMPA channels being internalized (endocytosis), illustrating synaptic down-scaling.
     - **Interactive Micro-Tooltips:** Clicking on the NMDA channel, $\text{Ca}^{2+}$ influx, or BDNF receptor reveals a concise 1-sentence plain English summary, eliminating walls of text!

2. **Spontaneous Action Potential Firing Probability Bell Curve**:
   - Replace the text line `FIRING PROBABILITY: ↑ +34% (Facilitated)` with a dynamic Gaussian probability distribution curve:
     - The curve represents the distribution of spontaneous synaptic inputs.
     - The Action Potential threshold line is marked in red at `-55 mV`.
     - The shaded area under the curve to the right of `-55 mV` represents the exact percentage of events that trigger an action potential.
     - When Anodal current is applied, the entire bell curve visibly shifts toward the right, expanding the firing zone with an animated green glow!

3. **GABA / Glutamate Neurochemical Balance Scale (Seesaw of Plasticity)**:
   - A stylized physical chemical balance scale:
     - Left pan: **GABA** (Inhibitory tone).
     - Right pan: **Glutamate** (Excitatory tone).
     - Under Anodal stimulation: The Glutamate pan dips with a golden glow, while the GABA pan rises, visually demonstrating localized GABA reduction.
     - Under Cathodal stimulation: The GABA pan dips with a deep blue calming glow.

---

### ZONE 8: Advanced Feature Modals

#### 1. Multi-Channel HD Matrix Modal (`MultiChannelMatrixModal.tsx`)
- **Current State:**
  - Table of text input fields and numerical sliders.
  - Text readout: `Kirchhoff Sum: 0.00 mA (Balanced)`.
- **Visual Transformation:**
  - **Kirchhoff Current Balance Scale:** A physical balance bar showing total positive current on the left pan and total negative return current on the right pan. When $\sum I = 0$, the bar levels out with an illuminated green "CIRCUIT BALANCED" seal.
  - **Mini Scalp Pin Array Map:** A 2D head diagram showing all active electrodes in the matrix, with arrows indicating the current flow vectors between anodes and surrounding return cathodes.

#### 2. Clinical Protocol Export Modal (`ProtocolExportModal.tsx`)
- **Current State:**
  - Text form fields and checklists.
- **Visual Transformation:**
  - **Live Protocol Summary Card:** A high-contrast graphic badge showing the electrode montage silhouette, safety meter, and dosimetric energy bars formatted like a printable medical passport badge.

---

## 4. Technical Architecture & Component Implementation Guide

To maintain clean architecture and code maintainability, the implementing agent should create modular, isolated visual components in a dedicated subdirectory: `src/components/visuals/`.

### Recommended File Structure
```
src/
├── components/
│   ├── visuals/
│   │   ├── ScalpTopomap1020.tsx          # 2D Interactive Scalp Compass & Electrode Selector
│   │   ├── BiksonSafetyGauge.tsx         # Aviation Cockpit Safety Arc Dial
│   │   ├── CurrentPenetrationWaterfall.tsx # Scalp/Skull/CSF Shunt Loss Flow Diagram
│   │   ├── ChargeDoseReservoir.tsx       # Total Coulombs (Q) Dynamic Battery Tube
│   │   ├── SensationMatrixGlyphs.tsx     # Tingling, Taste, Phosphene, Erythema Icons
│   │   ├── EFieldThermalSpectrum.tsx     # E-Field Milestone Gradient Bar
│   │   ├── ViewportOrientationCube.tsx   # 3D Snap View Gizmo Widget
│   │   ├── EegSpectralBarChart.tsx       # 6-Band FFT Power Distribution Chart
│   │   ├── CognitiveImpactRadar.tsx      # Hexagonal Spider Web Radar Chart
│   │   ├── SynapticPlasticityDiagram.tsx # Molecular Synaptic Cleft & Ion Flow
│   │   ├── FiringProbabilityCurve.tsx    # Gaussian Bell Curve Threshold Distribution
│   │   └── NeurochemicalSeesaw.tsx       # GABA vs Glutamate Balance Scale
│   ├── BrainViewport3D.tsx               # (Integrated with new visual overlays)
│   ├── EegWaveVisualizer.tsx             # (Integrated with EegSpectralBarChart)
│   ├── HumanImpactSimulators.tsx         # (Integrated with CognitiveImpactRadar)
│   └── CellularMechanismWidget.tsx       # (Integrated with SynapticPlasticityDiagram)
```

### Component Guidelines for the Implementing Agent
1. **Zero Unnecessary External Dependencies:** 
   - All gauges, radar charts, topomaps, and balance scales can be implemented using pure, semantic **SVG + Tailwind CSS** or **HTML5 Canvas**. Do not introduce heavy dependencies (like D3 or Chart.js) that would inflate bundle size when SVG achieves superior, crisp vector rendering on high-DPI displays.
2. **Reactivity & State Binding:**
   - Visuals must react synchronously to the existing state hooks (`montageState` from `useUrlMontageState` and `telemetry` from `calculateTelemetry`).
   - Sliders dragging in the left dock must smoothly animate the dials, radar charts, and waterfall streams in real time.
3. **Accessibility & Progressive Disclosure:**
   - Visual representations must be accompanied by tooltips on hover displaying the underlying exact mathematical value (e.g., hovering the Safety Arc Needle displays `J = 0.0800 mA/cm²`).
   - High contrast must be maintained (`text-slate-100`, dark blue backgrounds `#070B12`, `#0F1623`).

---

## 5. Step-by-Step Phased Implementation Roadmap for the Agent

When you begin building, follow this sequential execution plan:

### Phase 1: High-Impact Left Dock Visuals (Dosimetry & Safety)
- [ ] Build `BiksonSafetyGauge.tsx` and replace the raw text rows in the Safety Telemetry card.
- [ ] Build `CurrentPenetrationWaterfall.tsx` to visualize the 62.4% scalp shunt vs cortical penetration.
- [ ] Build `ChargeDoseReservoir.tsx` to visualize total Coulombs ($Q$).
- [ ] Build `SensationMatrixGlyphs.tsx` for tingling, metallic taste, phosphene, and erythema indicators.

### Phase 2: Interactive 2D Scalp Compass (Electrode Selection)
- [ ] Build `ScalpTopomap1020.tsx` with all standard 10-20 electrode positions.
- [ ] Replace the text `<select>` dropdowns for Anode and Cathode with clickable nodes on the 2D compass.
- [ ] Add the montage focality visual graphic (diffuse sponge vs focal bullseye ring).

### Phase 3: Right Dock Visual Transformations
- [ ] **Tab 1 (EEG):** Build `EegSpectralBarChart.tsx` under the oscilloscope, displaying the 6-band FFT distribution.
- [ ] **Tab 1 (EEG):** Add the Neuro-Arousal & Focus 2D compass and visual outcome tags.
- [ ] **Tab 2 (Impact):** Build `CognitiveImpactRadar.tsx` to replace the 6 stacked progress bars with an interactive hexagonal radar chart.
- [ ] **Tab 2 (Impact):** Add the Reaction Time speed comparison track and embodied human avatar.
- [ ] **Tab 3 (Cellular):** Build `SynapticPlasticityDiagram.tsx` to replace the dense text cards with the molecular synaptic cleft schematic.
- [ ] **Tab 3 (Cellular):** Build `FiringProbabilityCurve.tsx` and `NeurochemicalSeesaw.tsx`.

### Phase 4: Top Navigation & Viewport HUD Enhancements
- [ ] Replace text preset buttons with miniature visual head badges showing the target vector.
- [ ] Replace layer text pills with the isometric layered depth stack.
- [ ] Add the active circuit live wire pulse in the header.
- [ ] Integrate the E-Field thermal milestone spectrum and 3D orientation gizmo into `BrainViewport3D.tsx`.

### Phase 5: Verification & Quality Polish
- [ ] Verify that all animations run at smooth 60 FPS on both desktop and mobile viewports.
- [ ] Run `npm run build` and ensure zero TypeScript or bundling errors.
- [ ] Test edge cases: extreme slider inputs, HD-tDCS multi-channel array, polarity flips.

---

*This document serves as the complete, authoritative design specification for the visual-over-text transformation of NeuroFlow tDCS.*
