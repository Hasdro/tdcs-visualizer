# QA & USER ACCEPTANCE AUDIT REPORT: NeuroFlow tDCS Simulator

**Target URL:** `https://tdcs-visualizer.vercel.app`  
**Audit Date:** October 23, 2026  
**Auditor Roles:** Senior QA Engineer & Neuroscience Computational Researcher  
**Browser Environment:** Brave Browser 155.1.97.59 / Chromium Engine (1920×1080 Viewport, WebGL 2.0 Enabled, ANGLE Metal Hardware Acceleration on Apple M1)  
**Reference Benchmark:** NeuroFlow tDCS Clinical & Biophysical Master Specification  

---

## 1. Summary Scorecard

| Evaluation Gate | Status | Key Metric / Verification Notes |
| :--- | :---: | :--- |
| **Gate 1: Console, Network & WebGL Health** | **FAIL** | Zero unhandled exceptions or shader crashes; WebGL 2.0 active. Failed due to 8 Troika-three-text OpenType debug warnings (`LookupType 8/5/6`). |
| **Gate 2: Layout & Viewport Integrity** | **PASS** | Fits strictly within `1920x1080` without scrollbars (`docScrollWidth: 1920`, `docScrollHeight: 1080`). Minor 4–8px width variances noted. |
| **Gate 3: URL Hash Sync & Deep-Linking** | **PASS** | Two-way hash synchronization functional (`#anode=F3&cathode=F4...`); deep-linking accurately rehydrates state and sliders on hard reload. |
| **Gate 4: 3D Anatomy & Visual Quality** | **FAIL** | Sculpted bi-hemispheric brain mesh verified; failed due to missing `[Skull Shunt Halo]` layer, missing electrode drag/snap, and rigid pad clipping. |
| **Gate 5: Biophysical Math & Telemetry** | **FAIL** | Current density readout offset by pad slider bug ($0.0796$ vs $0.0800\text{ mA/cm}^2$); Peak $|\vec{E}|$ hard-clamps at $1.25\text{ V/m}$ regardless of current; HD-tDCS collapses to $0.15\text{ V/m}$. |
| **Gate 6: Live Animations (EEG / Mini-Sims)** | **PASS** | 60 FPS Canvas oscilloscope active; all 6 bands modulated dynamically; Focus and Motor mini-simulators respond to F3/C3; citations verified. |
| **Gate 7: Performance & Frame Rate** | **PASS** | Measured Average FPS: **60.05 FPS** (p95: 59.88 FPS, p99: 59.52 FPS, 0 long frames) even under continuous slider scrubbing stress. |

---

## 2. Executive Assessment

NeuroFlow tDCS demonstrates impressive real-time rendering architecture: shader uniforms are updated cleanly during user interactions, maintaining a rock-solid 60 FPS on WebGL 2.0 without reallocating vertex buffers. The 6-band EEG synthesizer, interactive membrane potential oscilloscope, and behavioral mini-simulators reflect deep domain knowledge.

However, the application fails acceptance on **Biophysical Mathematical Integrity** (Gate 5) and **3D Layer / Interaction Completeness** (Gate 4). Specifically:
1. The biophysical E-field gradient calculation contains an analytical formula error that blows up cortical gradient magnitudes by $>20\times$, pinning the peak cortical electric field ($|\vec{E}|$) to a hard clamp ceiling of $1.25\text{ V/m}$ across all currents from $1.0\text{ mA}$ to $2.5\text{ mA}$, while HD-tDCS collapses to the floor clamp ($0.15\text{ V/m}$).
2. The pad area slider snaps to non-integer values ending in `.14` (e.g. `25.14 cm²`) due to combining `min="3.14"` with `step="1"`, corrupting clinical current density readouts.
3. The specification-mandated `[Skull Shunt Halo]` layer and interactive magnetic electrode dragging are completely missing from the implementation.

---

## 3. Prioritized Issue List

### Level 1: CRITICAL (Crashes, Blank Canvas, Broken Core Spec, Hallucinated Math)

---

#### `[BUG-01]` Peak Cortical Electric Field ($|\vec{E}|$) Permanently Clamped at $1.25\text{ V/m}$ Across All Current Intensities
- **Component / Area:** `src/utils/biophysicsEngine.ts` (`computeEFieldAtPoint` lines 95–97 & `calculateTelemetry` line 255)
- **Steps to Reproduce:**
  1. Open `https://tdcs-visualizer.vercel.app`.
  2. Set Montage to Anode `F3` and Cathode `Fp2` (Sponge pad).
  3. Drag Current slider from $0.5\text{ mA}$ to $1.0\text{ mA}$, $1.5\text{ mA}$, $2.0\text{ mA}$, and $2.5\text{ mA}$.
  4. Observe the `Peak |E|` readout badge in the Right Dock header.
- **Expected Behavior (Per Spec):**
  - Peak cortical electric field $|\vec{E}|$ must scale dynamically and linearly with current $I$.
  - At $2.0\text{ mA}$, peak $|\vec{E}|$ should read between $0.40$ and $0.90\text{ V/m}$ (typically $\sim 0.65\text{ V/m}$).
  - At $1.0\text{ mA}$, peak $|\vec{E}|$ should read between $0.20$ and $0.45\text{ V/m}$ (typically $\sim 0.33\text{ V/m}$).
- **Actual Behavior (Observed):**
  - In `computeEFieldAtPoint`, `gradAx` is calculated with an unweighted `(p[0] - pA[0]) / (sigma * sigma)` term without normalizing by distance. Because $\sigma^2 \approx 0.0484$, the gradient is amplified by $20.66\times$.
  - At node `Fpz`, unconstrained `eMagnitude` calculates to $3.906\text{ V/m}$ at $2.0\text{ mA}$ and $1.953\text{ V/m}$ at $1.0\text{ mA}$.
  - Line 255 executes `Math.min(1.25, Math.max(0.15, peakE * 1.15))`. Both values vastly exceed $1.25$, locking `peakEFieldVm` permanently at `1.25 V/m` for $1.0\text{ mA}$, $1.5\text{ mA}$, $2.0\text{ mA}$, and $2.5\text{ mA}$.
- **Suggested Fix for Dev Agent:**
  - Reformulate the E-field gradient in `computeEFieldAtPoint`:
    $$\vec{E} = -\nabla \Phi = \frac{kField \cdot e^{-r^2 / 2\sigma^2}}{(r^2 + d^2)^{3/2}} \vec{r} + \frac{kField \cdot e^{-r^2 / 2\sigma^2}}{\sigma^2 \sqrt{r^2 + d^2}} \vec{r}$$
  - Calibrate the scaling constant $kField$ such that at $I = 2.0\text{ mA}$ and $A = 25\text{ cm}^2$, the peak cortical gyral crown field evaluates to $\sim 0.65\text{ V/m}$, and removes the hard-coded `1.25` clamp.

---

#### `[BUG-02]` HD-tDCS 4×1 Ring Mode Peak Electric Field Collapses to Bottom Clamp ($0.15\text{ V/m}$)
- **Component / Area:** `src/utils/biophysicsEngine.ts` (`calculateTelemetry` lines 184–215)
- **Steps to Reproduce:**
  1. Click Preset #8 ("Focal HD-tDCS (4×1)") or switch Montage Focality to `HD 4×1 Ring`.
  2. Observe the `Peak |E|` readout badge in the Right Dock.
- **Expected Behavior (Per Spec):**
  - HD-tDCS 4×1 ring configuration confines the electric field tightly beneath the central active electrode ($F3$), producing a focal peak $|\vec{E}|$ between $0.50$ and $0.85\text{ V/m}$ with near-zero E-field outside the ring perimeter.
- **Actual Behavior (Observed):**
  - `calculateTelemetry` only samples $|\vec{E}|$ at the standard discrete 10-20 grid nodes.
  - Because the 4 surround ring cathodes ($Fp1, Fz, C3, F7$) surround $F3$ and enforce return cancellation outside the ring, and none of the sampled 10-20 nodes lie inside the focal 1.5 cm ring annulus, the sampled node values evaluate to near zero (`mean: 0.004 V/m`).
  - `Math.max(0.15, peakE * 1.15)` clamps the calculation at the bottom floor of `0.15 V/m`.
- **Suggested Fix for Dev Agent:**
  - In `calculateTelemetry`, explicitly sample the cortical electric field directly at `anodeNode.posCortical` (and at radial offsets of $0.02, 0.04$ units from the anode center) so the concentrated peak beneath the HD central electrode is captured.

---

#### `[BUG-03]` Pad Area Slider Cannot Select $25\text{ cm}^2$ Due to `min="3.14"` and `step="1"`
- **Component / Area:** `src/App.tsx` (Dosimetry Controls, lines 528–536)
- **Steps to Reproduce:**
  1. Drag the Pad Area (A) slider to the notch labeled `25 (5x5)`.
  2. Observe the badge readout and the Current Density $J$ readout below.
- **Expected Behavior (Per Spec):**
  - Slider should snap to standard clinical integer sizes ($16\text{ cm}^2$, $25\text{ cm}^2$, $35\text{ cm}^2$).
  - At $I = 2.0\text{ mA}$ and $A = 25\text{ cm}^2$, Current Density $J = I / A$ must equal exactly **$0.0800\text{ mA/cm}^2$**.
  - At $I = 1.0\text{ mA}$ and $A = 25\text{ cm}^2$, $J$ must equal exactly **$0.0400\text{ mA/cm}^2$**.
- **Actual Behavior (Observed):**
  - The HTML range input is defined as: `<input type="range" min="3.14" max="35" step="1" ... />`.
  - Because `min` is `3.14`, all slider step values are shifted by $+0.14$: `3.14, 4.14, ..., 16.14, ..., 25.14, ..., 35.14`.
  - The user is forced to select `25.14 cm²`, producing $J = 2.0 / 25.14 = \mathbf{0.0796\text{ mA/cm}^2}$ and at $1.0\text{ mA}$ producing $\mathbf{0.0398\text{ mA/cm}^2}$.
- **Suggested Fix for Dev Agent:**
  - Separate HD-tDCS pad handling from sponge pad range. For sponge mode, set `min="10"`, `max="35"`, `step="1"`. When the user toggles `HD 4×1 Ring`, programmatically assign `pad = 3.14` without constraining the range input minimum to a non-integer float.

---

### Level 2: HIGH (Missing Features, Broken Interactions, Static Components)

---

#### `[BUG-04]` Missing `[Skull Shunt Halo]` Layer Toggle & 3D Visual Mesh
- **Component / Area:** `src/App.tsx` (Header Pills, lines 208–254) & `src/components/BrainViewport3D.tsx`
- **Steps to Reproduce:**
  1. Inspect the top bar layer pills on desktop (`1920x1080`).
  2. Check the 3D scene rendering layers.
- **Expected Behavior (Per Spec):**
  - Top bar must provide pills for: `[Scalp & 10-20 Grid]`, `[Skull Shunt Halo]`, `[Cortical E-Field]`, `[Current Streamlines]`, `[Brodmann Labels]`, `[Point-Cloud Pulse]`.
  - Toggling `[Skull Shunt Halo]` toggles an outer translucent dielectric calvarium layer depicting the $62\%$ trans-cranial current shunting.
- **Actual Behavior (Observed):**
  - Only 5 pills exist: `Scalp 10-20`, `E-Field`, `Streamlines`, `Point-Cloud`, `Labels`.
  - `[Skull Shunt Halo]` is completely absent from the header UI.
  - No shunt halo mesh or shader exists in `BrainViewport3D.tsx`.
- **Suggested Fix for Dev Agent:**
  - Add state `showShuntHalo` in `App.tsx`.
  - Add the `Skull Shunt Halo` toggle pill in the header.
  - In `BrainViewport3D.tsx`, add a translucent glowing shell around the skull perimeter modulated by `telemetry.shuntPercentage`.

---

#### `[BUG-05]` Interactive Electrode Dragging Across Scalp with Magnetic Snapping Not Implemented
- **Component / Area:** `src/components/BrainViewport3D.tsx` (Electrode Placement System)
- **Steps to Reproduce:**
  1. Click `3D Click` (or `Place Anode (+)`) in the Left Dock.
  2. Click and drag the pointer across the scalp to move the electrode.
- **Expected Behavior (Per Spec):**
  - User can drag an electrode across the 3D head surface, with the pad magnetically snapping to the nearest 10-20 system coordinate node.
- **Actual Behavior (Observed):**
  - Pointer dragging on the canvas is captured by `OrbitControls`, rotating the camera.
  - Electrode pads have no pointer-down or drag listeners; only click-to-place on discrete node spheres is supported.
- **Suggested Fix for Dev Agent:**
  - Add Three.js raycasting on pointer-move over `headSilhouetteGeometry` when placement mode is active.
  - Temporarily disable `OrbitControls` while an electrode is held, calculate distance to nearest 10-20 node, and snap position when distance $< 0.15$ units.

---

#### `[BUG-06]` Extracephalic Reference Nodes (`EX_L` / `EX_R`) Float in Empty Void and Corrupt Streamlines
- **Component / Area:** `src/components/BrainViewport3D.tsx` (lines 542–585) & `src/components/StreamlineParticles.tsx` (lines 70–82)
- **Steps to Reproduce:**
  1. Select Cathode `EX_L` (Left Deltoid) or `EX_R` (Right Deltoid).
  2. Observe 3D center stage and streamline trajectories.
- **Expected Behavior (Per Spec):**
  - Extracephalic reference placement should render on a stylized shoulder/neck anatomical reference, with streamlines flowing continuously down through deep axial pathways into the deltoid.
- **Actual Behavior (Observed):**
  - The application does not crash, but the pad sits at `[-1.40, -1.20, 0.0]` floating in complete empty space with no body/shoulder geometry.
  - In `StreamlineParticles.tsx` (line 74), the midpoint calculation executes `midPoint.normalize().multiplyScalar(1.04)`. Normalizing a vector between head `[0, 0.95, 0]` and shoulder `[-1.4, -1.2, 0]` forces the curve midpoint back onto the spherical scalp, creating bizarre, contorted loop trajectories that pierce through the brain before diving into the void.
- **Suggested Fix for Dev Agent:**
  - Add a stylized neck and shoulder wireframe/silhouette mesh below the calvarium.
  - In `StreamlineParticles.tsx`, check if `targetC` is extracephalic; if so, generate downward bezier curves without unit sphere normalization.

---

### Level 3: MEDIUM (UI Overlap, Clipping, Visual Polish, Console Spam)

---

#### `[BUG-07]` Rigid Flat Electrode Pads Clip Inside Skull at `Oz` and Float at `T7`
- **Component / Area:** `src/components/BrainViewport3D.tsx` (lines 456–465, 520–528)
- **Steps to Reproduce:**
  1. Set Anode to `Oz` (Occipital Pole); rotate camera to view calvarium in profile.
  2. Set Anode to `T7` (Left Temporal); inspect pad-scalp contact.
- **Expected Behavior (Per Spec):**
  - Red (Anode) and blue (Cathode) pads must sit flush against the curved scalp surface without clipping inside the skull or hovering in air.
- **Actual Behavior (Observed):**
  - Pads are rigid flat boxes: `<boxGeometry args={[0.16, 0.16, 0.024]} />`.
  - At `Oz`, `pos3D` is `[0.0, 0.15, -0.95]`, while the scalp geometry radius is $z = -1.04$. The electrode pad is located inside the skull, partially clipping beneath the wireframe and obscuring label text.
  - At `T7`, `pos3D` is `[-0.92, 0.08, 0.0]`, while scalp lateral radius is $x = -0.88$, creating a visible $0.04$-unit floating gap.
- **Suggested Fix for Dev Agent:**
  - Re-align all node `pos3D` coordinates in `brain_nodes.ts` to lie exactly on the surface of `headSilhouetteGeometry`.
  - Curve the pad geometry using a curved cylindrical or decal mesh conforming to the local calvarium curvature.

---

#### `[BUG-08]` Secondary SI Unit ($A/m^2$) Missing from Current Density Telemetry Readout
- **Component / Area:** `src/App.tsx` (Safety Telemetry Card, line 569)
- **Steps to Reproduce:**
  1. Inspect the Left Dock `SAFETY TELEMETRY` card.
- **Expected Behavior (Per Spec):**
  - Gate 5.1 specifies: "Verify readout equals exactly 0.08 mA/cm² (0.8 A/m²)."
- **Actual Behavior (Observed):**
  - UI only displays `0.0796 mA/cm²`.
  - `telemetry.currentDensityAM2` is calculated in `biophysicsEngine.ts` but never rendered in the DOM.
- **Suggested Fix for Dev Agent:**
  - Update line 569 to display both units:
    ```tsx
    <span className="text-cyan-300 font-bold">
      {telemetry.currentDensityMaCm2} mA/cm² ({telemetry.currentDensityAM2} A/m²)
    </span>
    ```

---

#### `[BUG-09]` Left and Right Dock Widths and Backgrounds Deviate from Spec
- **Component / Area:** `src/App.tsx` (lines 319, 614)
- **Steps to Reproduce:**
  1. Inspect computed CSS metrics on desktop viewport (`1920x1080`).
- **Expected Behavior (Per Spec):**
  - Left Dock: 280px width, `#0F1623` panel background.
  - Right Dock: 380px width, `#0F1623` panel background.
- **Actual Behavior (Observed):**
  - Left Dock renders at $288\text{px}$ (`w-72`), Right Dock renders at $384\text{px}$ (`w-96`).
  - Both docks use `bg-[#0A101D]` instead of `#0F1623`.
- **Suggested Fix for Dev Agent:**
  - Replace `w-72` with `w-[280px]` and `w-96` with `w-[380px]`.
  - Update dock panel background classes from `bg-[#0A101D]` to `bg-[#0F1623]`.

---

#### `[BUG-10]` Troika-Three-Text OpenType Layout Warnings in Console
- **Component / Area:** Browser Console (`@react-three/drei` `<Text>` component)
- **Steps to Reproduce:**
  1. Open page and check developer tools console.
- **Expected Behavior (Per Spec):**
  - Gate 1 Zero-Error Policy: Zero console warnings or errors.
- **Actual Behavior (Observed):**
  - 8 debug messages logged:
    - `unsupported GPOS table LookupType 8 format 2`
    - `unsupported GPOS table LookupType 5 format 1`
    - `unsupported GSUB table LookupType 6 format 2`
    - `unsupported GSUB table LookupType 6 format 1`
- **Suggested Fix for Dev Agent:**
  - Troika font parser emits these when encountering complex OpenType tables in web fonts. Provide an explicit stripped `.woff` file without OpenType ligature tables to `<Text font="/fonts/IBMPlexMono-Regular.woff">`.

---

#### `[BUG-11]` Hidden Mobile Dropdown Sits as First `<select>` in Left Dock DOM
- **Component / Area:** `src/App.tsx` (line 321)
- **Steps to Reproduce:**
  1. Inspect `<select>` elements in DOM or use keyboard `Tab` navigation.
- **Expected Behavior (Per Spec):**
  - Primary Anode selector should be the first interactive form control in the electrode montage section.
- **Actual Behavior (Observed):**
  - A mobile fallback preset dropdown (`xl:hidden`) exists at line 321. On desktop screens, it is visually hidden with `display: none`, but remains at index 0 in the DOM, interfering with accessibility trees, screen readers, and automated QA scripts.
- **Suggested Fix for Dev Agent:**
  - Add `aria-hidden="true"` and `tabIndex={-1}` when hidden, or mount it conditionally based on viewport width hook.

---

## 4. Verification Screenshot Artifacts

All verification screenshots captured during this audit are archived in the repository scratch directory:
- `01_initial_dashboard_1920x1080.png` — Full initial instrument layout & contrast.
- `02_preset2_bifrontal.png` — Preset #2 activation and immediate URL hash update.
- `03_deeplink_c3_fp2.png` — Deep link navigation and slider rehydration verification.
- `04_brain_viewport_closeup.png` — 3D cortical geometry close-up (longitudinal fissure verified).
- `04_node_anode_F3.png`, `Cz.png`, `Oz.png`, `T7.png` — Electrode pad seating and normal alignment.
- `04_extracephalic_EX_L.png` — Deltoid reference pad placement in void space.
- `06_rightdock_tab1_eeg.png` — 60 FPS 6-band EEG synthesizer with live spectral shifts.
- `06_rightdock_tab2_impact.png` — Behavioral outcome gauges & Cognitive Focus mini-simulator.
- `06_rightdock_tab3_cellular.png` — Cellular membrane oscilloscope with verified PubMed citations.
