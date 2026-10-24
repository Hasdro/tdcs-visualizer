# NeuroFlow tDCS: Complete Visual Transformation Blueprint & AI Agent Instructions
## Comprehensive Review: Converting Remaining Dense Text, Tables, and Numerical Lists into Intuitive Visual Telemetry

---

## Executive Summary & Codebase Audit Findings

Following an in-depth architectural and UX audit of the **NeuroFlow tDCS Visualizer** codebase, this document identifies every remaining location where clinical information, biophysical calculations, user controls, and neurophysiological mechanisms are currently represented as text, numbers, or bullet points.

While previous updates introduced foundational visual components (such as `ScalpTopomap1020`, `BiksonSafetyGauge`, `CurrentPenetrationWaterfall`, and `CognitiveImpactRadar`), **critical areas of the application still rely heavily on dense text, un-visualized clinical prose, and raw floating-point numbers**:

1. **EEG Inspector (Tab 1):** Six expandable cards contain dense clinical paragraphs and bulleted symptom lists (`normalBaseline`, `whenElevated`, `whenSuppressed`, and modulation mechanisms) that require deep reading instead of glanceable visual inspection.
2. **Cognitive & Motor Impact (Tab 2):** Below the new radar chart, the interface still renders six redundant stacked text progress bars, along with text-only side-effect scores (`7.2 / 10`, metallic taste paragraphs, and phosphene warnings).
3. **Cellular Vm & Synaptic Plasticity (Tab 3):** Four dense biological prose cards (NMDA, Ca²⁺, BDNF, GABA/Glu) and bibliographic PubMed text citations lack visual biochemical pathways, spine morphometry, and neuroplastic decay timelines.
4. **Dosimetry & Session Controls (Left Dock):** Sliders rely on static text ticks; session progression (ramp-up, steady-state, ramp-down) has no visual chronometer; electrode pad footprint and current crowding are not visually illustrated.
5. **Head Tissue Conductivity & Biophysics:** The fundamental biophysical mechanism explaining *why* 62.4% of current shunts (tissue conductivities $\sigma$ of scalp, bone, CSF, grey matter) is hidden in mathematical formulas rather than shown as a comparative conductivity stratum.
6. **Clinical Presets & Network Targeting:** High-value clinical trial data (Level A/B evidence grades, 4-week treatment course schedules, and large-scale brain networks like CEN, DMN, SN) are formatted as hidden text properties in data objects without visual representation.
7. **Modals & Clinical Export:** The Audio Sonification modal lacks a binaural acoustic phase interference schematic; the HD Matrix modal lacks 2D isopotential field contours; the exported clinical report is a text table document lacking embedded visual diagrams.

Below is the complete inventory of text-to-visual transformations, followed by exhaustive, step-by-step instructions for an autonomous AI agent to implement the changes.

---

## Part 1: Comprehensive Information Visualization Matrix

| Application Area | Current Text / Numerical Representation | Proposed Visual Component | Clinical & Intuitive Benefit |
| :--- | :--- | :--- | :--- |
| **EEG Waves (Tab 1)** | 6 expandable accordion cards with 24 paragraphs of text and symptom bullet lists (`normalBaseline`, `symptoms`) | **`EegBandSymptomMatrix.tsx`** & **`NeuroEntrainmentCoupler.tsx`**: Dual-sided Deficit vs Excess symptom spectrum meters with state pictograms and cross-frequency phase-amplitude coupling (PAC) rings. | Clinician instantly sees whether the frequency band is pushed into deficit, optimal homeostasis, or hyperarousal without reading prose. |
| **Cognitive Impact (Tab 2)** | 6 stacked horizontal progress bars (`+18% Executive Focus`, `+12% Mood`, etc.) duplicating the radar chart. | **`AffectiveCircumplexPlot.tsx`** (Russell's 2D Valence-Arousal Model) & **`WorkingMemoryGridSimulator.tsx`**: Interactive 2D psychological quadrant scatter plot and n-back cognitive grid. | Replaces redundant text bars with a standardized psychological state quadrant and interactive cognitive challenge. |
| **Sensory Side-Effects (Tab 2)** | Text scores (`7.2/10`, `4.1/10`) and paragraphs for metallic taste and retinal phosphenes. | **`SomatosensorySensationMap.tsx`**: 2D anatomical head/cranial silhouette with localized sensation heat zones (scalp itch, lingual nerve taste path, retinal visual flash flare). | Connects abstract risk numbers directly to the user's physical anatomical sensory locations. |
| **Cellular Plasticity (Tab 3)** | 4 text cards explaining NMDA unblocking, Ca²⁺ influx, BDNF synthesis, and GABA/Glu shift. | **`IntracellularSignalingCascade.tsx`** & **`DendriticSpineMorphology.tsx`**: Animated biochemical flow diagram (Ca²⁺ $\to$ CaMKII $\to$ CREB $\to$ BDNF $\to$ AMPA) and before/after spine enlargement graphic. | Shows the molecular chain reaction of neuroplasticity dynamically; active nodes illuminate in sequence. |
| **Neuroplastic After-Effects (Tab 3)** | Text citation notes and raw $\Delta V_m$ numbers. | **`NeuroplasticityDecayCurve.tsx`**: Exponential after-effects duration curve (0 to 120 min post-session) calibrated by session duration and intensity ($I \times t$). | Clinicians and patients clearly see how long the cognitive facilitation window lasts after the stimulator turns off. |
| **PubMed Citations (Tab 3)** | Long bibliographic text cards with author lists, journal titles, and study findings. | **`ClinicalEvidenceTimeline.tsx`**: Interactive chronological roadmap (2000 Nitsche $\to$ 2003 Bikson $\to$ 2020 Lefaucheur) with study design badges (RCT, Double-Blind, fMRI, N=120). | Transforms a dry bibliography into a high-credibility scientific discovery timeline. |
| **Dosimetry Controls (Left Dock)** | Plain HTML range sliders with text numbers (`2.0 mA`, `20 min`, `25 cm²`). | **`CurrentIntensityAmmeter.tsx`**, **`SessionRampChronometer.tsx`**, and **`ElectrodeFootprintCrowding.tsx`**: Visual ammeter dial with safety zones, 3-phase ramp timeline arc, and 2D pad edge-crowding heat diagram. | Visualizes electrical current danger zones, clinical ramp phases (to avoid phosphenes), and electrode contact physics. |
| **Head Tissue Biophysics** | Abstract percentage string (`62.4% lost in scalp`) with zero explanation of physical causes. | **`TissueConductivityStratum.tsx`**: Stratified geological-style cross-section comparing conductivities ($\sigma$ in S/m) of Scalp ($0.465$), Skull ($0.010$), CSF ($1.650$), and Cortex ($0.276$). | Instantly demonstrates *why* electricity bypasses the brain via the super-conductive CSF layer ($\rho$ 80× lower than bone). |
| **Clinical Presets (Header/Mobile)** | Text descriptions, schedule notes, and network targets in data files. | **`BrainNetworkConnectomeGlyphs.tsx`** & **`TreatmentScheduleRoadmap.tsx`**: Visual network topology chips (CEN, DMN, SN, SMN) and 4-week calendar course roadmap. | Shows which large-scale functional brain network is engaged and outlines the multi-week therapy trajectory. |
| **Audio Sonification Modal** | Text explanations of binaural beats and headphones requirement. | **`BinauralPhaseInterferenceDiagram.tsx`**: Acoustic waveform collision schematic showing left and right tones converging at the brainstem superior olivary nucleus. | Explains the biophysics of acoustic brainwave entrainment visually in 2 seconds. |
| **Multi-Channel HD Matrix** | Text lists of channels and numbers; simple balance bar. | **`ScalpLeadFieldContourMap.tsx`**: 2D azimuthal head topomap with calculated isopotential voltage contours and current vector streamlines between all 8 electrodes. | Turns raw channel sliders into a true clinical lead-field electroencephalographic map. |
| **Clinical Protocol Export** | Printable text tables and checklist bullets. | **`VisualPassportReportTemplate.tsx`**: Embedded SVG montage head map, Bikson safety seal badge, cortical E-field spectrum, and a 1-page visual patient infographic card. | Produces an institutional, publication-grade clinical trial record and patient take-home badge. |

---

## Part 2: Detailed Architectural & Component Specifications

### 1. EEG Frequency & Symptom Visualizer (`EegBandSymptomMatrix.tsx`)
- **Target File:** `src/components/visuals/EegBandSymptomMatrix.tsx`
- **Replaces:** Expandable text cards in `src/components/EegWaveVisualizer.tsx` (lines 265–375).
- **Visual Design:**
  - Render an interactive 6-row or 3x2 grid of **Frequency Power Tiles**.
  - Each tile displays:
    1. Band Icon & Signature Color:
       - Delta ($\delta$): 🌙 Deep Sleep / Cellular Regeneration (Indigo/Slate).
       - Theta ($\theta$): 🧘 Meditation / Memory Consolidation (Violet).
       - Alpha ($\alpha$): 🌊 Calm Flow / Attentive Relaxation (Cyan).
       - Low Beta ($\beta_1$): 💡 Cognitive Processing / Analytical Focus (Emerald).
       - High Beta ($\beta_2$): ⚡ Alertness / Executive Arousal (Amber).
       - Gamma ($\gamma$): 💎 Mental Binding / High-Order Insight (Rose).
    2. **Dual-Sided Deficit vs Excess Symptom Meter:**
       - Center notch represents normative baseline (0%).
       - A glowing marker sweeps left (negative shift) or right (positive shift).
       - Left Zone (Deficit): Displays visual icon chips for deficiency symptoms (e.g., Theta deficit = *"Memory fragmentation"*; Alpha deficit = *"Restless anxiety"*).
       - Right Zone (Excess): Displays visual icon chips for hyperarousal symptoms (e.g., High Beta excess = *"Jittery tension"*).
    3. **Phase-Amplitude Coupling (PAC) Micro-Ring:** A small concentric orbiting ring indicating cross-frequency synchronization with slower carrier waves.

### 2. Affective State Circumplex Model (`AffectiveCircumplexPlot.tsx`)
- **Target File:** `src/components/visuals/AffectiveCircumplexPlot.tsx`
- **Replaces:** Redundant stacked linear progress bars in `src/components/HumanImpactSimulators.tsx` (lines 382–511).
- **Visual Design:**
  - Implements **James Russell's Circumplex Model of Affect** as an SVG 2D coordinate plane:
    - **X-Axis (Valence):** Unpleasant / Negative Affect ($\leftarrow$) to Pleasant / Positive Approach ($\rightarrow$).
    - **Y-Axis (Arousal):** De-aroused / Low Energy ($\downarrow$) to High Arousal / Vigilant ($\uparrow$).
  - Four distinct psychological quadrant zones:
    - **Top-Right:** Excited, Energized, Euphoric, Motivated (Anodal Frontal / Motor Priming).
    - **Bottom-Right:** Serene, Content, Calm, Relaxed (Cathodal Frontal / Alpha Enhancing).
    - **Bottom-Left:** Depressed, Fatigued, Lethargic, Gloomy (Hypo-frontal State).
    - **Top-Left:** Anxious, Tense, Frustrated, Hyper-Vigilant (Excessive Beta/Gamma).
  - An illuminated cursor dot with a directional motion vector tracks how the active montage and current intensity nudge the emotional state from baseline.

### 3. Somatosensory Side-Effect Heatmap (`SomatosensorySensationMap.tsx`)
- **Target File:** `src/components/visuals/SomatosensorySensationMap.tsx`
- **Replaces:** Text scores and paragraphs in `src/components/HumanImpactSimulators.tsx` (lines 514–578).
- **Visual Design:**
  - A stylized 2D human head and torso anatomical silhouette.
  - Three real-time animated sensory indicators:
    1. **Scalp Tingling / Prickling:** A localized concentric ripple wave centered over the active anode and cathode coordinates, with ripple intensity and frequency proportional to current density $J$.
    2. **Lingual Nerve Metallic Taste:** An illuminated path running from the frontotemporal branches (F7/F8/T7/T8) down to a stylized tongue icon in the mouth cavity, lighting up amber when current exceeds 1.0 mA near temporal sites.
    3. **Retinal Phosphene Flare:** Glowing optical diffraction rings radiating from the orbit (eyes) when frontopolar electrodes (Fp1, Fp2, Fpz) are active during ramp transitions.
    4. **Skin Erythema (Redness) Swatch:** A circular dermal patch showing predicted post-session skin flushing based on cumulative charge density ($Q_{\text{density}}$).

### 4. Intracellular Plasticity Signaling Cascade (`IntracellularSignalingCascade.tsx`)
- **Target File:** `src/components/visuals/IntracellularSignalingCascade.tsx`
- **Replaces:** 4 dense text cards in `src/components/CellularMechanismWidget.tsx` (lines 300–380).
- **Visual Design:**
  - Render an interactive molecular pathway flowchart inside a neuronal dendritic spine:
    ```
    [Somatic Depolarization (ΔVm)] 
             │
             ▼
    [NMDA Pore Unblock (Mg²⁺ Extruded)]
             │
             ▼
    [Ca²⁺ Influx Spike (Golden Cascade)]
             │
             ├───► [CaMKII Enzyme Activation] ──► [AMPA Insertion into Membrane (LTP)]
             │
             └───► [CREB Transcription Factor] ──► [BDNF Gene Expression & TrkB Growth]
    ```
  - Under **Anodal** stimulation: The entire cascade flows smoothly downwards with glowing particles; NMDA channel unblocks, and AMPA receptors physically dock into the postsynaptic membrane.
  - Under **Cathodal** stimulation: The cascade is blocked at NMDA; Calcineurin phosphatases are highlighted in blue, causing AMPA receptor endocytosis (LTD / synaptic depression).
  - Hovering over any molecular node presents an instant 1-sentence tooltip.

### 5. Neuroplastic After-Effects Decay Curve (`NeuroplasticityDecayCurve.tsx`)
- **Target File:** `src/components/visuals/NeuroplasticityDecayCurve.tsx`
- **Location:** Integrated into `src/components/CellularMechanismWidget.tsx`.
- **Visual Design:**
  - Based on empirical neurophysiology data from **Nitsche & Paulus 2000, 2001** and **Monte-Silva 2013**.
  - Displays a clean line chart showing **Corticospinal Excitability (% of Baseline)** across time:
    - **T = 0 to 20 min (Active Stimulation):** Excitability rises steeply to +35% (anode) or drops to -28% (cathode).
    - **T = 20 to 120 min (Post-Session Plasticity Window):** Exponential decay curve showing the prolonged after-effect.
  - Interactive slider or indicator demonstrating how increasing session duration from 10 min to 20 min dramatically extends the biological plasticity window from 30 minutes to over 90 minutes.

### 6. Clinical Discovery Roadmap & Evidence Badges (`ClinicalEvidenceTimeline.tsx`)
- **Target File:** `src/components/visuals/ClinicalEvidenceTimeline.tsx`
- **Replaces:** Static text citation cards in `src/components/CellularMechanismWidget.tsx` (lines 382–416).
- **Visual Design:**
  - An interactive horizontal chronological timeline with node cards:
    - **2000 (Nitsche & Paulus):** Discovery of Motor Excitability Modulation via tDCS.
    - **2003 (Bikson / Francis):** Sub-threshold Somatic Polarization Biophysics.
    - **2006 (Miranda et al.):** Scalp & CSF Current Shunting 3D FEA Modeling.
    - **2016 (Bikson Consensus):** Comprehensive Safety Guidelines & Non-Lesional Limits.
    - **2020 (Lefaucheur Guidelines):** European Class A/B Evidence for Major Depression & Fibromyalgia.
  - Each milestone displays visual trial design badges: `[RCT Double-Blind]`, `[MRS Spectroscopy]`, `[fMRI Functional]`, `[N=120 Subjects]`, with a one-click PubMed link.

### 7. Head Tissue Conductivity Stratum (`TissueConductivityStratum.tsx`)
- **Target File:** `src/components/visuals/TissueConductivityStratum.tsx`
- **Location:** Integrated into Left Dock beneath `CurrentPenetrationWaterfall.tsx`.
- **Visual Design:**
  - A stratified anatomical cross-section showing why current shunts:
    - **Layer 1: Scalp & Subcutaneous Tissue** ($\sigma = 0.465\text{ S/m}$, Conductive).
    - **Layer 2: Calvarium (Skull Bone)** ($\sigma = 0.010\text{ S/m}$, Extreme Resistor, $\rho = 100\,\Omega\cdot\text{m}$).
    - **Layer 3: Cerebrospinal Fluid (CSF)** ($\sigma = 1.650\text{ S/m}$, Super-Highway Shunt).
    - **Layer 4: Cortical Grey Matter** ($\sigma = 0.276\text{ S/m}$, Target Pyramidal Cells).
    - **Layer 5: Axonal White Matter** ($\sigma = 0.126\text{ S/m}$, Deep Fasciculi).
  - Animated current arrows visually demonstrate why current spreads horizontally across the scalp and CSF, leaving ~19% to reach cortical neurons.

### 8. Session Ramp Chronometer & Pad Crowding (`SessionRampChronometer.tsx` & `CurrentIntensityAmmeter.tsx`)
- **Target File:** `src/components/visuals/SessionRampChronometer.tsx` & `src/components/visuals/CurrentIntensityAmmeter.tsx`
- **Replaces:** Standard plain sliders in `src/App.tsx` (lines 387–468).
- **Visual Design:**
  - **Intensity Ammeter:** A circular dial measuring 0.5 to 2.5 mA, with green/amber/red warning zones and needle physics.
  - **Session Ramp Arc:** A 3-phase circular progression arc showing:
    1. **Ramp-Up (0–30s):** Gentle slope preventing sensory startle.
    2. **Plateau (e.g., 20 min):** Constant current state.
    3. **Ramp-Down (last 30s):** Gradual decrease preventing phosphenes.
  - **Pad Edge-Crowding Heatmap:** A visual diagram showing how current gathers densely at the perimeter corners of rectangular sponge pads, demonstrating why HD-tDCS circular rings eliminate edge irritation.

### 9. Binaural Beat Acoustic Phase Interference (`BinauralPhaseInterferenceDiagram.tsx`)
- **Target File:** `src/components/visuals/BinauralPhaseInterferenceDiagram.tsx`
- **Replaces:** Text paragraphs in `src/components/AudioSonificationModal.tsx` (lines 278–285).
- **Visual Design:**
  - Shows left and right auditory ear pathways:
    - Left Ear: Pure sine wave at Carrier frequency $f_0$ (e.g., 216 Hz, blue).
    - Right Ear: Pure sine wave at $f_0 + \Delta f$ (e.g., 226 Hz, cyan).
  - The two signals travel down cochlear nerve tracts into the brainstem **Superior Olivary Complex**, where they superimpose.
  - Displays the resulting amplitude-modulated **Envelope Beat Waveform** ($10\text{ Hz}$ Alpha pulse) with glowing auditory cortex entrainment ripples.

### 10. Multi-Channel Scalp Lead-Field Contour Map (`ScalpLeadFieldContourMap.tsx`)
- **Target File:** `src/components/visuals/ScalpLeadFieldContourMap.tsx`
- **Replaces:** Simple text channel rows in `src/components/MultiChannelMatrixModal.tsx`.
- **Visual Design:**
  - Interactive top-down scalp canvas map showing all 8 potential channel sites.
  - Calculates and renders real-time **Isopotential Electric Contours** (colored heat gradients from red $+V$ to blue $-V$).
  - Animated vector streamlines flowing from multiple anodes into surrounding return cathodes.
  - Kirchhoff balance scale updates live with visual current conservation confirmation.

---

## Part 3: Step-by-Step Instructions for the AI Implementation Agent

Follow this phased checklist sequentially. After completing each step, ensure `npm run build` passes with zero TypeScript errors.

```
+-----------------------------------------------------------------------------+
|                     AI IMPLEMENTATION AGENT ROADMAP                         |
+-----------------------------------------------------------------------------+
| Phase 1: Tab 1 Visuals — EEG Symptom Matrix & Cross-Frequency Coupler       |
| Phase 2: Tab 2 Visuals — Circumplex Mood Plot & Sensory Body Map            |
| Phase 3: Tab 3 Visuals — Molecular Plasticity Cascade & Decay Curve         |
| Phase 4: Left Dock Controls — Ammeter Dial, Ramp Arc & Tissue Stratum       |
| Phase 5: Modal & Export Visuals — Acoustic Entrainment & Lead-Field Contours|
| Phase 6: Code Cleanup, Redundancy Elimination & Final Verification          |
+-----------------------------------------------------------------------------+
```

### Phase 1: Tab 1 (EEG Waves) — Eliminate Text Accordion
1. **Create `src/components/visuals/EegBandSymptomMatrix.tsx`**:
   - Accept props: `bandShifts: Record<string, number>`, `selectedBandFilter: string`.
   - Render a 6-tile grid or interactive carousel for Delta, Theta, Alpha, Low Beta, High Beta, Gamma.
   - For each band, render:
     - Band icon, Hz range, and functional category.
     - A bidirectional deficit vs excess spectrum gauge showing where the current montage shifts power.
     - Visual symptom chips with color codes (emerald for positive outcomes, amber for excess/deficit warnings).
2. **Update `src/components/EegWaveVisualizer.tsx`**:
   - Import `EegBandSymptomMatrix`.
   - Remove the dense expandable text loop (lines 265–375).
   - Place `EegBandSymptomMatrix` directly below the existing `EegSpectralBarChart` and `NeuroArousalCompass`.
   - Verify that all frequency band shifts are visually interpretable without clicking expand buttons.

### Phase 2: Tab 2 (Human Impact) — Replace Redundant Progress Bars
1. **Create `src/components/visuals/AffectiveCircumplexPlot.tsx`**:
   - Accept props: `valenceScore: number`, `arousalScore: number`.
   - Render the 2D SVG coordinate plane with 4 colored quadrant zones (Energized, Calm, Lethargic, Anxious).
   - Plot an animated cursor dot mapping the subject's affective state.
2. **Create `src/components/visuals/SomatosensorySensationMap.tsx`**:
   - Accept props: `telemetry: BiophysicalTelemetry`, `anodeId: string`, `cathodeId: string`.
   - Render an anatomical head silhouette with:
     - Localized scalp tingling concentric ripples.
     - Lingual nerve metallic taste glow path.
     - Retinal phosphene optical flare rings.
     - Post-session skin erythema preview swatch.
3. **Update `src/components/HumanImpactSimulators.tsx`**:
   - Import `AffectiveCircumplexPlot` and `SomatosensorySensationMap`.
   - Remove the 6 redundant progress bars in Section 2 (lines 382–511).
   - Replace the text scores in Section 3 (lines 514–578) with `SomatosensorySensationMap`.
   - Embed `AffectiveCircumplexPlot` adjacent to the cognitive radar chart.

### Phase 3: Tab 3 (Cellular Vm) — Molecular Cascade & Decay Curves
1. **Create `src/components/visuals/IntracellularSignalingCascade.tsx`**:
   - Accept props: `isAnode: boolean`, `currentMa: number`.
   - Render an animated SVG molecular pathway inside a dendritic spine:
     - Somatic $\Delta V_m \to$ NMDA unblock $\to \text{Ca}^{2+}$ influx $\to$ CaMKII $\to$ AMPA receptor insertion.
     - Render active glowing particles flowing through the pathway under anodal excitation; show pathway inhibition under cathodal hyperpolarization.
2. **Create `src/components/visuals/NeuroplasticityDecayCurve.tsx`**:
   - Accept props: `durationMin: number`, `currentMa: number`, `isAnode: boolean`.
   - Render an SVG line chart showing corticospinal excitability across 120 minutes post-stimulation, demonstrating after-effects duration.
3. **Create `src/components/visuals/ClinicalEvidenceTimeline.tsx`**:
   - Accept props: `citations: Citation[]`.
   - Render an interactive milestone roadmap with study design badges and PubMed links.
4. **Update `src/components/CellularMechanismWidget.tsx`**:
   - Replace the 4 dense text cards (lines 300–380) with `IntracellularSignalingCascade` and `NeuroplasticityDecayCurve`.
   - Replace the bibliographic text list (lines 382–416) with `ClinicalEvidenceTimeline`.

### Phase 4: Left Dock Controls — Ammeter Dial, Ramp Arc & Tissue Stratum
1. **Create `src/components/visuals/CurrentIntensityAmmeter.tsx`**:
   - Accept props: `currentMa: number`, `onChange: (ma: number) => void`.
   - Render a cockpit ammeter dial with needle sweep, digital readout, and safety threshold zones.
2. **Create `src/components/visuals/SessionRampChronometer.tsx`**:
   - Accept props: `durationMin: number`, `onChange: (dur: number) => void`.
   - Render a circular duration arc detailing the 30-second ramp-up, steady-state plateau, and 30-second ramp-down phases.
3. **Create `src/components/visuals/TissueConductivityStratum.tsx`**:
   - Accept props: `shuntPercentage: number`.
   - Render a 5-layer biological tissue cross-section comparing conductivities ($\sigma$) of Scalp, Skull, CSF, Grey Matter, and White Matter.
4. **Update `src/App.tsx`**:
   - Integrate `CurrentIntensityAmmeter` and `SessionRampChronometer` into the Dosimetry Controls card.
   - Embed `TissueConductivityStratum` under `CurrentPenetrationWaterfall`.

### Phase 5: Modal & Export Visualizations
1. **Create `src/components/visuals/BinauralPhaseInterferenceDiagram.tsx`**:
   - Integrate into `src/components/AudioSonificationModal.tsx` to visually illustrate acoustic beat entrainment in the superior olive.
2. **Create `src/components/visuals/ScalpLeadFieldContourMap.tsx`**:
   - Integrate into `src/components/MultiChannelMatrixModal.tsx` to display real-time isopotential electric contours and current vector streamlines.
3. **Enhance `src/utils/protocolExport.ts`**:
   - Embed standalone SVG graphics in the generated printable HTML report:
     - 2D 10-20 Head Montage Map graphic.
     - Bikson Safety Consensus Seal and Arc Dial.
     - Cortical E-field spectrum bar and cognitive outcome radar chart.
     - 1-page visual Patient Infographic Passport.

### Phase 6: Code Cleanup, Redundancy Elimination & Verification
1. Remove all unused CSS classes, orphaned text cards, and commented-out code.
2. Run `npm run build` and ensure zero TypeScript errors or compilation warnings.
3. Test all interactions:
   - Moving sliders smoothly animates all dials, waterfalls, radar charts, and cascades.
   - Toggling presets updates the 2D head compass, active circuit wire, and cognitive radar simultaneously.
   - Modals open smoothly and render responsive visual diagrams on desktop and laptop screens.

---

*This blueprint provides the definitive roadmap for completing the visual-first clinical transformation of the NeuroFlow tDCS platform.*
