import React, { useMemo, useRef, useState, useEffect, Component, ErrorInfo, ReactNode, Suspense } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, Text, Html } from '@react-three/drei';
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import {
  createHumanFaceGeometry,
  createCurvedPadGeometry,
  createNeckAndShoulderGeometry
} from '../utils/brainGeometry';
import { BRAIN_NODES } from '../data/brain_nodes';
import { StreamlineParticles } from './StreamlineParticles';
import { BiophysicalTelemetry } from '../utils/biophysicsEngine';
import { Activity, AlertTriangle, ChevronDown, Pause, Play, FastForward, RotateCcw, Droplet } from 'lucide-react';
import { EFieldThermalSpectrum } from './visuals/EFieldThermalSpectrum';
import { ViewportOrientationCube, type CameraView } from './visuals/ViewportOrientationCube';
import { NeuronalMagnifyingLens } from './visuals/NeuronalMagnifyingLens';
import type { LayerOpacity } from './visuals/IsometricLayerStack';

interface BrainViewport3DProps {
  anodeId: string;
  cathodeId: string;
  currentMa: number;
  durationMin: number;
  padAreaCm2: number;
  montageType: 'sponge' | 'hd4x1';
  surroundNodes?: string[];
  telemetry: BiophysicalTelemetry;
  onSelectNode: (nodeId: string, polarity: 'anode' | 'cathode') => void;
  showScalpGrid: boolean;
  showShuntHalo: boolean;
  showHumanFace: boolean;
  showEField: boolean;
  showStreamlines: boolean;
  showPointCloud: boolean;
  showBrodmannLabels: boolean;
  activePlacementMode: 'anode' | 'cathode' | null;
  setActivePlacementMode: (mode: 'anode' | 'cathode' | null) => void;
  isLeftDockCollapsed?: boolean;
  layerOpacity: LayerOpacity;
  onTissueOpacityChange: (value: number) => void;
}

/** Shared per-frame simulation state (read inside useFrame, never via React state). */
interface SimClock {
  time: number;
  ma: number;
  speed: number;
}

// Camera snap targets: [camera position, orbit target]. Positions are relative
// to the head centre so the brain stays framed in every clinical view.
const CAMERA_VIEWS: Record<CameraView, { position: [number, number, number]; target: [number, number, number] }> = {
  anterior: { position: [0, 0.22, 3.3], target: [0, 0.06, 0] },
  left: { position: [-3.3, 0.35, 0.15], target: [0, 0.06, 0] },
  right: { position: [3.3, 0.35, 0.15], target: [0, 0.06, 0] },
  vertex: { position: [0, 3.4, 0.05], target: [0, 0.06, 0] },
  occipital: { position: [0, 0.3, -3.3], target: [0, 0.06, 0] },
  reset: { position: [-1.32, 0.48, 3.72], target: [-0.2, 0.08, 0] }
};

// Error Boundary for WebGL Canvas
interface ErrorBoundaryProps {
  children: ReactNode;
}
interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

class CanvasErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('Canvas Error Caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-[#070B12]">
          <AlertTriangle className="w-12 h-12 text-amber-400 mb-3 animate-pulse" />
          <h3 className="text-sm font-semibold tracking-tight text-slate-200">
            WebGL context notice
          </h3>
          <p className="mt-2 max-w-md text-xs leading-relaxed text-slate-400">
            3D Hardware Acceleration is not active in this headless environment. Full 60 FPS WebGL rendering is available in standard Chrome, Edge, Brave, Firefox, and Safari with GPU enabled.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

// Custom Cortical E-field Shader Material with Realistic Biological Living Brain Tissue Shading
const CorticalHeatmapShader = {
  uniforms: {
    uAnodePos: { value: new THREE.Vector3() },
    uCathodePos: { value: new THREE.Vector3() },
    uCurrentMa: { value: 2.0 },
    uPadArea: { value: 25.0 },
    uTime: { value: 0.0 },
    uShowEField: { value: 1.0 },
    uMontageType: { value: 0 },
    uSurroundPos0: { value: new THREE.Vector3() },
    uSurroundPos1: { value: new THREE.Vector3() },
    uSurroundPos2: { value: new THREE.Vector3() },
    uSurroundPos3: { value: new THREE.Vector3() },
    uTissueOpacity: { value: 0.6 },
    uSubsurfaceGlow: { value: 0.7 },
    uFieldStrength: { value: 1.0 },
  },
  vertexShader: `
    attribute vec3 color;
    varying vec3 vWorldNormal;
    varying vec3 vWorldPosition;
    varying float vCurvature;

    void main() {
      // Curvature is baked into COLOR_0 by the mesh preprocessing step:
      // concave sulci dark, convex gyral crowns light.
      vCurvature = color.r;
      vWorldNormal = normalize(mat3(modelMatrix) * normal);
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPos.xyz;
      gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
  `,
  fragmentShader: `
    uniform vec3 uAnodePos;
    uniform vec3 uCathodePos;
    uniform float uCurrentMa;
    uniform float uPadArea;
    uniform float uTime;
    uniform float uShowEField;
    uniform int uMontageType;
    uniform vec3 uSurroundPos0;
    uniform vec3 uSurroundPos1;
    uniform vec3 uSurroundPos2;
    uniform vec3 uSurroundPos3;
    uniform float uTissueOpacity;   // 0.15 (glass) .. 0.90 (anatomical specimen)
    uniform float uSubsurfaceGlow;  // internal scatter intensity
    uniform float uFieldStrength;   // E-field overlay strength (layer slider)

    varying vec3 vWorldNormal;
    varying vec3 vWorldPosition;
    varying float vCurvature;

    float hash31(vec3 p) {
      p = fract(p * 0.1031);
      p += dot(p, p.yzx + 33.33);
      return fract((p.x + p.y) * p.z);
    }

    float vnoise(vec3 x) {
      vec3 i = floor(x);
      vec3 f = fract(x);
      f = f * f * (3.0 - 2.0 * f);
      float n000 = hash31(i);
      float n100 = hash31(i + vec3(1.0, 0.0, 0.0));
      float n010 = hash31(i + vec3(0.0, 1.0, 0.0));
      float n110 = hash31(i + vec3(1.0, 1.0, 0.0));
      float n001 = hash31(i + vec3(0.0, 0.0, 1.0));
      float n101 = hash31(i + vec3(1.0, 0.0, 1.0));
      float n011 = hash31(i + vec3(0.0, 1.0, 1.0));
      float n111 = hash31(i + vec3(1.0, 1.0, 1.0));
      return mix(
        mix(mix(n000, n100, f.x), mix(n010, n110, f.x), f.y),
        mix(mix(n001, n101, f.x), mix(n011, n111, f.x), f.y),
        f.z
      );
    }

    void main() {
      float c = clamp(vCurvature, 0.0, 1.0);

      // ---------------------------------------------------------------------
      // 1. Living cortical tissue palette: warm rose gyri, dusky plum sulci.
      //    Values are deliberately light and low-saturation so the surface
      //    reads as pale pink brain tissue, not paint or clay.
      // ---------------------------------------------------------------------
      vec3 sulcusDeep = vec3(0.295, 0.120, 0.135);
      vec3 sulcusWall = vec3(0.560, 0.280, 0.285);
      vec3 cortexBase = vec3(0.900, 0.560, 0.535);
      vec3 gyralCrown = vec3(1.090, 0.765, 0.735);

      vec3 base = mix(sulcusDeep, sulcusWall, smoothstep(0.015, 0.14, c));
      base = mix(base, cortexBase, smoothstep(0.12, 0.36, c));
      base = mix(base, gyralCrown, smoothstep(0.36, 0.82, c));

      // Gentle per-gyrus tonal variation so the cortex does not read as plastic.
      float toneNoise = 0.5 + 0.5 * sin(vWorldPosition.x * 17.0 + sin(vWorldPosition.z * 13.0));
      float toneNoise2 = 0.5 + 0.5 * cos(vWorldPosition.y * 19.0 - vWorldPosition.z * 11.0);
      base *= 0.955 + 0.038 * toneNoise + 0.022 * toneNoise2;

      // Fine pial mottling: the organic grain of fixed cortical tissue. Fades
      // with distance so the far silhouette stays clean and calm.
      float detailFade = smoothstep(4.6, 2.5, distance(cameraPosition, vWorldPosition));
      float grain = vnoise(vWorldPosition * 44.0);
      float grain2 = vnoise(vWorldPosition * 97.0 + 7.3);
      base *= 0.945 + 0.090 * grain + 0.040 * grain2 * detailFade;
      base = mix(base, vec3(0.94, 0.80, 0.75), smoothstep(0.58, 0.92, grain) * 0.07 * detailFade);

      // Fine pial vasculature: sparse meandering capillary lines in the
      // subarachnoid space, strongest on the gyral crowns.
      float veinField = vnoise(vWorldPosition * 13.0 + 4.0);
      float veinField2 = vnoise(vWorldPosition * 21.0 + 9.0);
      float vein = smoothstep(0.90, 0.985, 1.0 - abs(veinField * 2.0 - 1.0));
      float vein2 = smoothstep(0.935, 0.995, 1.0 - abs(veinField2 * 2.0 - 1.0));
      base = mix(base, vec3(0.52, 0.16, 0.15), (vein * 0.55 + vein2 * 0.35) * 0.26 * detailFade * smoothstep(0.30, 0.80, c));

      // Pale arachnoid mottling: a few patches drift toward warm off-white,
      // the way fixed cortical tissue is never one flat colour.
      float mottle = 0.5 + 0.5 * sin(vWorldPosition.x * 6.1 + vWorldPosition.y * 4.7 + sin(vWorldPosition.z * 5.3));
      base = mix(base, vec3(0.96, 0.84, 0.79), mottle * 0.055 * smoothstep(0.28, 0.85, c));
      float blush = 0.5 + 0.5 * sin(vWorldPosition.z * 4.3 + vWorldPosition.y * 6.7 + 2.1);
      base = mix(base, vec3(0.97, 0.70, 0.69), blush * 0.06 * smoothstep(0.30, 0.88, c));

      // A gentle vertical falloff gives the organ weight: the superior crowns
      // catch more light, the inferior surface settles into shadow.
      base *= mix(0.90, 1.03, smoothstep(-0.55, 0.55, vWorldPosition.y));

      // Sulcal occlusion: only the true crevices stay shadowed; the broad gyral
      // crowns lift into the light.
      float occlusion = mix(0.84, 1.0, smoothstep(0.0, 0.34, c));
      base *= occlusion;

      // Faint rose capillary wash in the depths of the folds.
      float capillary = smoothstep(0.82, 1.0, sin(vWorldPosition.x * 44.0 + sin(vWorldPosition.z * 31.0)) *
                                                      cos(vWorldPosition.y * 39.0 - vWorldPosition.z * 27.0));
      base = mix(base, vec3(0.255, 0.070, 0.078), capillary * (1.0 - smoothstep(0.15, 0.52, c)) * 0.08);

      // ---------------------------------------------------------------------
      // 2. Soft studio tissue lighting (no hard plastic highlight).
      // ---------------------------------------------------------------------
      vec3 N = normalize(vWorldNormal);
      // Back faces are the inner wall of the far hemisphere seen through the
      // translucent near wall: flip the normal so they light consistently.
      if (!gl_FrontFacing) N = -N;
      vec3 V = normalize(cameraPosition - vWorldPosition);
      float nDotV = max(dot(N, V), 0.0);

      // Faint pial undulation. The scanned anatomy already carries the fine
      // relief, so this only softens the analytical normals.
      vec3 pia = vec3(
        sin(vWorldPosition.y * 23.0 + vWorldPosition.z * 17.0),
        cos(vWorldPosition.x * 21.0 + vWorldPosition.z * 19.0),
        sin(vWorldPosition.x * 19.0 + vWorldPosition.y * 15.0)
      ) * 0.010;
      N = normalize(N + pia * (0.30 + 0.70 * (1.0 - c)));

      // Micro-relief: a two-scale value-noise bump that gives the pia a living
      // surface under the studio light instead of a moulded-plastic finish.
      vec3 mp = vWorldPosition * 26.0;
      float h0 = vnoise(mp);
      vec3 grad = vec3(
        vnoise(mp + vec3(0.42, 0.0, 0.0)) - h0,
        vnoise(mp + vec3(0.0, 0.42, 0.0)) - h0,
        vnoise(mp + vec3(0.0, 0.0, 0.42)) - h0
      );
      N = normalize(N + grad * (2.0 + 1.4 * (1.0 - c)) * detailFade);

      vec3 keyDir = normalize(vec3(-0.62, 0.70, 0.80));
      vec3 fillDir = normalize(vec3(0.92, 0.10, 0.34));
      vec3 rimDir = normalize(vec3(0.12, 0.38, -1.0));

      float keyWrap = max((dot(N, keyDir) + 0.20) / 1.20, 0.0);
      float fillWrap = max((dot(N, fillDir) + 0.26) / 1.26, 0.0);
      float rimWrap = max((dot(N, rimDir) + 0.12) / 1.12, 0.0);

      // Warm rose bounce in the shadows keeps the tissue pink rather than grey.
      vec3 hemi = mix(vec3(0.085, 0.052, 0.056), vec3(0.190, 0.142, 0.145), N.y * 0.5 + 0.5);
      vec3 light = hemi;
      light += vec3(1.00, 0.940, 0.890) * pow(keyWrap, 1.38) * 1.46;
      light += vec3(0.60, 0.60, 0.72) * pow(fillWrap, 1.05) * 0.26;
      light += vec3(0.95, 0.56, 0.49) * pow(rimWrap, 1.7) * 0.42;

      vec3 color = base * light;

      // Translucent subsurface glow in thin gyral walls.
      float sss = pow(max(dot(-N, keyDir), 0.0), 1.4) * 0.11;
      color += vec3(0.82, 0.26, 0.21) * sss * (0.30 + 0.70 * c);

      // Wet pia: a broad soft sheen plus a tighter highlight that catches the
      // gyral crowns without turning the cortex into glossy plastic.
      vec3 H = normalize(keyDir + V);
      float ndh = max(dot(N, H), 0.0);
      float sheen = pow(ndh, 9.0);
      float wet = pow(ndh, 68.0);
      color += vec3(1.0, 0.915, 0.875) * sheen * 0.42;
      color += vec3(1.0, 0.975, 0.945) * wet * (0.24 + 0.30 * smoothstep(0.45, 0.92, c));

      // Fleshy warm Fresnel at grazing angles.
      float fresnel = pow(1.0 - max(dot(N, V), 0.0), 3.0);
      color += vec3(0.90, 0.48, 0.42) * fresnel * 0.09;

      // Keep the longitudinal fissure in shadow; the narrow groove must never
      // read as a bright seam. A slight warp avoids a mechanically straight line.
      float fissureCenter = 0.006 * sin(vWorldPosition.z * 9.0 + 0.7);
      float medialFissure = exp(-pow((vWorldPosition.x - fissureCenter) / 0.034, 2.0));
      color *= 1.0 - 0.24 * medialFissure;

      // ---------------------------------------------------------------------
      // 3. Scientific E-field overlay: tint + contours, never a plastic paint.
      // ---------------------------------------------------------------------
      float sigma = (uMontageType == 1) ? 0.16 : (0.22 * sqrt(max(uPadArea, 9.0) / 25.0));
      float twoSigmaSq = 2.0 * sigma * sigma;
      float dSkullSq = 0.028;

      float distAnodeSq = dot(vWorldPosition - uAnodePos, vWorldPosition - uAnodePos);
      float effAnodeDist = sqrt(distAnodeSq + dSkullSq);
      float weightAnode = exp(-distAnodeSq / twoSigmaSq);
      float phiA = (uCurrentMa * 0.35 * weightAnode) / effAnodeDist;

      float phiC = 0.0;
      if (uMontageType == 1) {
        vec3 ring[4];
        ring[0] = uSurroundPos0;
        ring[1] = uSurroundPos1;
        ring[2] = uSurroundPos2;
        ring[3] = uSurroundPos3;
        for (int i = 0; i < 4; i++) {
          float dSq = dot(vWorldPosition - ring[i], vWorldPosition - ring[i]);
          float effDist = sqrt(dSq + dSkullSq);
          float w = exp(-dSq / (twoSigmaSq * 0.85));
          phiC += (uCurrentMa * 0.35 * 0.25 * w) / effDist;
        }
      } else {
        float distCathodeSq = dot(vWorldPosition - uCathodePos, vWorldPosition - uCathodePos);
        float effCathodeDist = sqrt(distCathodeSq + dSkullSq);
        float weightCathode = exp(-distCathodeSq / twoSigmaSq);
        phiC = (uCurrentMa * 0.35 * weightCathode) / effCathodeDist;
      }

      float gyralDepth = 0.68 + 0.32 * c;
      float field = (phiA - phiC) * gyralDepth;

      if (uShowEField > 0.5) {
        float intensity = smoothstep(0.012, 0.30, abs(field));
        float anodal = smoothstep(0.0, 0.10, field);
        float cathodal = smoothstep(0.0, 0.10, -field);

        // Display-referred field hues: warm amber for anodal, cool cyan for
        // cathodal. Both stay close to white so the overlay reads as a gentle
        // physiological tint, never a flat grey/blue heatmap.
        vec3 anodalTint = vec3(1.10, 0.94, 0.78);
        vec3 cathodalTint = vec3(0.82, 0.93, 1.10);
        vec3 tint = anodalTint * anodal + cathodalTint * cathodal;

        float k = uFieldStrength;
        // Multiplicative tint preserves the gyral shading and the pink base.
        color = mix(color, color * tint, intensity * 0.20 * k);
        color += tint * intensity * 0.014 * k;

        // Static isopotential contours: a DC field does not move, so neither do they.
        float contour = smoothstep(0.88, 0.985, sin(field * 72.0));
        color += tint * contour * intensity * 0.095 * k;

        // A restrained glow at peak field only.
        color += tint * pow(intensity, 2.6) * 0.016 * k;
      }

      // ---------------------------------------------------------------------
      // 4. Volumetric translucency: deep-tissue scatter + Fresnel optical density.
      // ---------------------------------------------------------------------
      float fresnelRim = pow(1.0 - nDotV, 2.5);
      // Soft reddish internal scatter from the vascularised grey matter.
      vec3 internalScatter = vec3(0.85, 0.22, 0.20) * (1.0 - nDotV) * 0.25;
      color += internalScatter * uSubsurfaceGlow;

      // Back faces read as deeper, denser white-matter interior.
      if (!gl_FrontFacing) {
        color = mix(color, color * vec3(0.78, 0.60, 0.62), 0.55);
      }

      // ---------------------------------------------------------------------
      // 5. Finishing: soft filmic contrast, no clipping to flat neon.
      // ---------------------------------------------------------------------
      color = color / (color + vec3(0.80));
      color = pow(color, vec3(0.95));

      // Restore a touch of chroma lost in the filmic shoulder so the gyri stay
      // a warm living pink rather than fading to putty.
      float finalLuma = dot(color, vec3(0.2126, 0.7152, 0.0722));
      color = mix(vec3(finalLuma), color, 1.28);

      // Sulcal crevices keep more optical density; thin gyral crowns transmit.
      float baseAlpha = mix(uTissueOpacity * 0.85, uTissueOpacity, smoothstep(0.1, 0.6, c));
      float finalAlpha = clamp(baseAlpha + fresnelRim * 0.35, 0.15, 0.97);
      if (!gl_FrontFacing) finalAlpha = clamp(finalAlpha * 0.75 + 0.1, 0.12, 0.92);
      if (uTissueOpacity > 0.89) finalAlpha = 1.0;

      gl_FragColor = vec4(color, finalAlpha);
    }
  `
};

// Depth-only pre-pass; nudged back by polygon offset so the colour pass over
// the same surface never z-fights.
const DEPTH_ONLY_FRAGMENT = `void main() { gl_FragColor = vec4(0.0); }`;

// Holographic Medical Face Shader with Fresnel Silhouette Rim Lighting
const HolographicFaceShader = {
  uniforms: {
    uColor: { value: new THREE.Color('#38BDF8') },
    uTime: { value: 0.0 },
    uOpacity: { value: 0.85 },
  },
  vertexShader: `
    varying vec3 vWorldNormal;
    varying vec3 vWorldPosition;
    varying vec2 vUv;
    void main() {
      vUv = uv;
      vWorldNormal = normalize(normalMatrix * normal);
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPos.xyz;
      gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
  `,
  fragmentShader: `
    uniform vec3 uColor;
    uniform float uTime;
    uniform float uOpacity;
    varying vec3 vWorldNormal;
    varying vec3 vWorldPosition;
    varying vec2 vUv;

    void main() {
      vec3 viewDir = normalize(cameraPosition - vWorldPosition);
      float nDotV = max(dot(vWorldNormal, viewDir), 0.0);
      // Fresnel silhouette rim glow
      float fresnel = pow(1.0 - nDotV, 2.8);

      // Soft holographic cyan glow on contours (profile, nose, lips, chin, ears)
      vec3 glowColor = mix(vec3(0.04, 0.20, 0.36), uColor, fresnel);
      glowColor += vec3(0.5, 0.85, 1.0) * pow(fresnel, 4.0) * 0.5;

      // Optical transparency: high clarity when facing camera (0.05), luminous glow at edges (0.80)
      float alpha = clamp(0.04 + fresnel * 0.72, 0.0, 0.88) * uOpacity;

      gl_FragColor = vec4(glowColor, alpha);
    }
  `
};

// Custom Neural Point-Cloud Shader
const NeuralPointCloudShader = {
  uniforms: {
    uAnodePos: { value: new THREE.Vector3() },
    uCathodePos: { value: new THREE.Vector3() },
    uTime: { value: 0.0 },
    uCurrentMa: { value: 2.0 },
    uPadArea: { value: 25.0 },
    uOpacity: { value: 1.0 },
  },
  vertexShader: `
    attribute float aPhase;
    uniform vec3 uAnodePos;
    uniform vec3 uCathodePos;
    uniform float uTime;
    uniform float uCurrentMa;
    uniform float uOpacity;

    varying vec3 vColor;
    varying float vAlpha;

    void main() {
      float distA = length(position - uAnodePos);
      float distC = length(position - uCathodePos);

      // Local membrane polarization proxy (mV): anodal near the anode,
      // cathodal near the return, decaying with cortical distance.
      float pol = uCurrentMa * 0.42 * (exp(-distA * distA / 0.06) - exp(-distC * distC / 0.06));

      // Spontaneous firing rate rises exponentially with depolarization
      // (membrane-noise escape model): r = r0 * exp(dVm / 2 mV), r0 = 0.6 Hz.
      float rate = 0.6 * exp(pol / 2.0);
      float cycle = fract(uTime * rate + aPhase * 0.159);
      float spike = smoothstep(0.93, 0.985, cycle) * (1.0 - smoothstep(0.985, 1.0, cycle));

      vec3 rest = vec3(0.22, 0.48, 0.78);
      vec3 depol = vec3(1.0, 0.52, 0.28);
      vec3 hyper = vec3(0.10, 0.78, 1.0);
      vec3 ptColor = mix(rest, pol > 0.0 ? depol : hyper, clamp(abs(pol) * 1.2, 0.0, 1.0));
      float size = 1.5 + clamp(abs(pol), 0.0, 1.0) * 1.2 + spike * 1.6;
      float alpha = 0.08 + clamp(abs(pol), 0.0, 1.0) * 0.18 + spike * 0.45;
      ptColor = mix(ptColor, vec3(1.0, 0.95, 0.8), spike * 0.6);
      alpha *= uOpacity;

      vColor = ptColor;
      vAlpha = alpha;

      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = size * (65.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    varying vec3 vColor;
    varying float vAlpha;

    void main() {
      vec2 coord = gl_PointCoord - vec2(0.5);
      float dist = length(coord);
      if (dist > 0.5) discard;
      float glow = exp(-dist * 4.5);
      gl_FragColor = vec4(vColor, vAlpha * glow);
    }
  `
};

const ShuntShellShader = {
  uniforms: {
    uColor: { value: new THREE.Color('#38BDF8') },
    uOpacity: { value: 0.55 }
  },
  vertexShader: `
    varying vec3 vViewNormal;
    varying vec3 vViewPosition;
    void main() {
      vViewNormal = normalize(normalMatrix * normal);
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vViewPosition = -mvPosition.xyz;
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    uniform vec3 uColor;
    uniform float uOpacity;
    varying vec3 vViewNormal;
    varying vec3 vViewPosition;
    void main() {
      float fresnel = pow(1.0 - abs(dot(normalize(vViewNormal), normalize(vViewPosition))), 3.0);
      gl_FragColor = vec4(uColor, fresnel * uOpacity);
    }
  `
};

interface BrainSceneProps {
  anodeId: string;
  cathodeId: string;
  currentMa: number;
  padAreaCm2: number;
  montageType: 'sponge' | 'hd4x1';
  surroundNodes?: string[];
  onSelectNode: (nodeId: string, polarity: 'anode' | 'cathode') => void;
  showScalpGrid: boolean;
  showShuntHalo: boolean;
  showHumanFace: boolean;
  showEField: boolean;
  showStreamlines: boolean;
  showPointCloud: boolean;
  showBrodmannLabels: boolean;
  activePlacementMode: 'anode' | 'cathode' | null;
  setActivePlacementMode: (mode: 'anode' | 'cathode' | null) => void;
  cameraRequest: { view: CameraView; nonce: number } | null;
  layerOpacity: LayerOpacity;
  simSpeed: number;
  resetNonce: number;
}

/**
 * Derives the research-mode neural point cloud and synaptic lattice from the
 * real cortical surface, so every sampled point sits on the actual gyri.
 */
function buildNeuralLattice(source: THREE.BufferGeometry) {
  const position = source.getAttribute('position');
  const normal = source.getAttribute('normal');
  const color = source.getAttribute('color');
  const index = source.getIndex();

  const colorScale = color && color.normalized
    ? (color.array instanceof Uint8Array ? 1 / 255 : color.array instanceof Uint16Array ? 1 / 65535 : 1)
    : 1;

  const ptPositions: number[] = [];
  const ptNormals: number[] = [];
  const ptPhases: number[] = [];
  const linePositions: number[] = [];

  const px = (i: number) => position.getX(i);
  const py = (i: number) => position.getY(i);
  const pz = (i: number) => position.getZ(i);

  for (let i = 0; i < position.count; i += 31) {
    const c = color ? color.getX(i) * colorScale : 1;
    if (c < 0.32) continue;
    const nx = normal.getX(i);
    const ny = normal.getY(i);
    const nz = normal.getZ(i);
    ptPositions.push(px(i) + nx * 0.012, py(i) + ny * 0.012, pz(i) + nz * 0.012);
    ptNormals.push(nx, ny, nz);
    ptPhases.push(Math.random() * Math.PI * 2);
  }

  if (index) {
    for (let t = 0; t < index.count; t += 3 * 113) {
      const a = index.getX(t);
      const b = index.getX(t + 1);
      const c = index.getX(t + 2);
      const lift = 0.008;
      linePositions.push(
        px(a) + normal.getX(a) * lift, py(a) + normal.getY(a) * lift, pz(a) + normal.getZ(a) * lift,
        px(b) + normal.getX(b) * lift, py(b) + normal.getY(b) * lift, pz(b) + normal.getZ(b) * lift,
        px(b) + normal.getX(b) * lift, py(b) + normal.getY(b) * lift, pz(b) + normal.getZ(b) * lift,
        px(c) + normal.getX(c) * lift, py(c) + normal.getY(c) * lift, pz(c) + normal.getZ(c) * lift
      );
    }
  }

  const pointCloudGeometry = new THREE.BufferGeometry();
  pointCloudGeometry.setAttribute('position', new THREE.Float32BufferAttribute(ptPositions, 3));
  pointCloudGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(ptNormals, 3));
  pointCloudGeometry.setAttribute('aPhase', new THREE.Float32BufferAttribute(ptPhases, 1));

  const wireframeGeometry = new THREE.BufferGeometry();
  wireframeGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));

  return { pointCloudGeometry, wireframeGeometry };
}

const BrainScene: React.FC<BrainSceneProps> = ({
  anodeId,
  cathodeId,
  currentMa,
  padAreaCm2,
  montageType,
  surroundNodes,
  onSelectNode,
  showScalpGrid,
  showShuntHalo,
  showHumanFace,
  showEField,
  showStreamlines,
  showPointCloud,
  showBrodmannLabels,
  activePlacementMode,
  setActivePlacementMode,
  cameraRequest,
  layerOpacity,
  simSpeed,
  resetNonce
}) => {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [draggingElectrode, setDraggingElectrode] = useState<'anode' | 'cathode' | null>(null);
  const orbitRef = useRef<any>(null);

  // Smooth camera snap: tween position and orbit target over ~0.6 s.
  const cameraTween = useRef<{ active: boolean; pos: THREE.Vector3; target: THREE.Vector3 }>({
    active: false,
    pos: new THREE.Vector3(),
    target: new THREE.Vector3()
  });
  useEffect(() => {
    if (!cameraRequest) return;
    const view = CAMERA_VIEWS[cameraRequest.view];
    cameraTween.current.pos.set(...view.position);
    cameraTween.current.target.set(...view.target);
    cameraTween.current.active = true;
  }, [cameraRequest]);

  // Simulation clock: paused/1×/2× playback and a 300 ms current ramp so a
  // dose change never jumps (devices ramp current; so does the picture).
  const sim = useRef<SimClock>({ time: 0, ma: currentMa, speed: simSpeed });
  useEffect(() => {
    sim.current.speed = simSpeed;
  }, [simSpeed]);
  useEffect(() => {
    sim.current.time = 0;
  }, [resetNonce]);
  const [magneticCandidateNode, setMagneticCandidateNode] = useState<string | null>(null);

  // The cortical surface is a real anatomical mesh (Detailed Human Brain
  // Model, NIH 3D entry 3DPX-021161, CC BY 4.0). It is pre-normalised into the
  // same coordinate frame as the 10-20 head model, with per-vertex curvature
  // baked into COLOR_0 for the tissue shader and the neural lattice.
  const gltf = useLoader(GLTFLoader, '/models/brain.glb') as GLTF;
  const cortexGeometry = useMemo(() => {
    let geometry: THREE.BufferGeometry | null = null;
    gltf.scene.traverse((object) => {
      const mesh = object as THREE.Mesh;
      if (mesh.isMesh && !geometry) geometry = mesh.geometry as THREE.BufferGeometry;
    });
    if (!geometry) throw new Error('Cortical mesh missing from brain model');
    return geometry;
  }, [gltf]);

  const { pointCloudGeometry, wireframeGeometry } = useMemo(
    () => buildNeuralLattice(cortexGeometry),
    [cortexGeometry]
  );

  const headSilhouetteGeometry = useMemo(
    () => new THREE.SphereGeometry(1.035, 48, 36),
    []
  );

  // Per-instance uniforms shared by the back-face and front-face tissue passes.
  const cortexUniforms = useMemo(() => THREE.UniformsUtils.clone(CorticalHeatmapShader.uniforms), []);
  const pointCloudUniforms = useMemo(() => THREE.UniformsUtils.clone(NeuralPointCloudShader.uniforms), []);
  const faceUniforms = useMemo(() => THREE.UniformsUtils.clone(HolographicFaceShader.uniforms), []);
  const shuntUniforms = useMemo(() => THREE.UniformsUtils.clone(ShuntShellShader.uniforms), []);

  const { facialContoursGeometry, facialMaskGeometry, orientationRingGeometry } = useMemo(
    () => createHumanFaceGeometry(),
    []
  );


  // Dynamically scale curved pad geometry with padAreaCm2 slider
  const padScale = useMemo(() => {
    return Math.sqrt(Math.max(4.0, padAreaCm2) / 25.0);
  }, [padAreaCm2]);

  const curvedPadGeo = useMemo(() => {
    const w = 0.16 * padScale;
    const h = 0.16 * padScale;
    return createCurvedPadGeometry(w, h, 0.024, 1.0);
  }, [padScale]);

  const neckShouldersGeo = useMemo(() => createNeckAndShoulderGeometry(), []);

  // Geometries passed as props are not owned by R3F, so release them here.
  useEffect(() => () => {
    pointCloudGeometry.dispose();
    wireframeGeometry.dispose();
  }, [pointCloudGeometry, wireframeGeometry]);
  useEffect(() => () => headSilhouetteGeometry.dispose(), [headSilhouetteGeometry]);
  useEffect(() => () => {
    facialContoursGeometry.dispose();
    facialMaskGeometry.dispose();
    orientationRingGeometry.dispose();
  }, [facialContoursGeometry, facialMaskGeometry, orientationRingGeometry]);
  useEffect(() => () => curvedPadGeo.dispose(), [curvedPadGeo]);
  useEffect(() => () => neckShouldersGeo.dispose(), [neckShouldersGeo]);

  const anodeNode = BRAIN_NODES[anodeId] || BRAIN_NODES['F3'];
  const cathodeNode = BRAIN_NODES[cathodeId] || BRAIN_NODES['Fp2'];

  useFrame(({ camera }, delta) => {
    const dt = Math.min(delta, 0.1);
    const clock = sim.current;
    clock.time += dt * clock.speed;
    // Exponential approach with τ ≈ 75 ms settles within ~300 ms.
    clock.ma += (currentMa - clock.ma) * (1 - Math.exp(-dt / 0.075));

    const tween = cameraTween.current;
    const controls = orbitRef.current;
    if (tween.active && controls) {
      const k = 1 - Math.exp(-dt / 0.12);
      camera.position.lerp(tween.pos, k);
      controls.target.lerp(tween.target, k);
      controls.update();
      if (camera.position.distanceToSquared(tween.pos) < 1e-5) tween.active = false;
    }

    const u = cortexUniforms;
    u.uTime.value = clock.time;
    u.uCurrentMa.value = clock.ma;
    u.uPadArea.value = padAreaCm2;
    u.uShowEField.value = showEField ? 1.0 : 0.0;
    u.uMontageType.value = montageType === 'hd4x1' ? 1 : 0;
    u.uTissueOpacity.value = layerOpacity.tissue;
    u.uFieldStrength.value = layerOpacity.efield;
    u.uAnodePos.value.set(...anodeNode.posCortical);
    u.uCathodePos.value.set(...cathodeNode.posCortical);
    if (montageType === 'hd4x1' && surroundNodes) {
      const ring = [u.uSurroundPos0, u.uSurroundPos1, u.uSurroundPos2, u.uSurroundPos3];
      for (let i = 0; i < 4; i++) {
        const node = BRAIN_NODES[surroundNodes[i]];
        if (node) ring[i].value.set(...node.posCortical);
      }
    }

    const pc = pointCloudUniforms;
    pc.uTime.value = clock.time;
    pc.uCurrentMa.value = clock.ma;
    pc.uPadArea.value = padAreaCm2;
    pc.uOpacity.value = layerOpacity.pointCloud;
    pc.uAnodePos.value.set(...anodeNode.posCortical);
    pc.uCathodePos.value.set(...cathodeNode.posCortical);

    faceUniforms.uOpacity.value = layerOpacity.face;
    shuntUniforms.uOpacity.value = layerOpacity.shunt;
  });

  const anodeQuat = useMemo(() => {
    const norm = new THREE.Vector3(...anodeNode.normal).normalize();
    return new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), norm);
  }, [anodeNode]);

  const cathodeQuat = useMemo(() => {
    const norm = new THREE.Vector3(...cathodeNode.normal).normalize();
    return new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), norm);
  }, [cathodeNode]);

  // Scaled label font size proportional to pad
  const padLabelFontSize = useMemo(() => {
    return Math.min(0.055, 0.045 * Math.sqrt(Math.max(4.0, padAreaCm2) / 25.0));
  }, [padAreaCm2]);

  return (
    <>
      <ambientLight intensity={0.42} />
      <directionalLight position={[3, 4, 2.5]} intensity={1.05} color="#fff6ee" />
      <directionalLight position={[-3, -1.5, -2]} intensity={0.30} color="#cfe0ff" />

      <OrbitControls
        ref={orbitRef}
        enableDamping
        dampingFactor={0.06}
        minDistance={1.4}
        maxDistance={4.8}
        target={[-0.20, 0.08, 0]}
        enabled={!draggingElectrode && activePlacementMode === null}
      />

      {/* Layer 1: Anatomical cortex as living translucent tissue, drawn in two
          passes (inner/back wall first, outer pial surface last) so internal
          streamlines and deep structures composite between them. */}
      {/* Each pass is preceded by a cheap depth-only pre-pass, so only the
          nearest surface of that wall is shaded and blended once; without it
          the stacked sulcal folds compound into an opaque surface. */}
      <mesh geometry={cortexGeometry} renderOrder={-3}>
        <shaderMaterial
          vertexShader={CorticalHeatmapShader.vertexShader}
          fragmentShader={DEPTH_ONLY_FRAGMENT}
          side={THREE.BackSide}
          colorWrite={false}
          transparent
          depthWrite
          polygonOffset
          polygonOffsetFactor={1}
          polygonOffsetUnits={1}
        />
      </mesh>
      <mesh geometry={cortexGeometry} renderOrder={-2}>
        <shaderMaterial
          vertexShader={CorticalHeatmapShader.vertexShader}
          fragmentShader={CorticalHeatmapShader.fragmentShader}
          uniforms={cortexUniforms}
          side={THREE.BackSide}
          transparent
          depthWrite
          depthTest
          depthFunc={THREE.LessEqualDepth}
          blending={THREE.NormalBlending}
        />
      </mesh>
      <mesh geometry={cortexGeometry} renderOrder={1}>
        <shaderMaterial
          vertexShader={CorticalHeatmapShader.vertexShader}
          fragmentShader={DEPTH_ONLY_FRAGMENT}
          side={THREE.FrontSide}
          colorWrite={false}
          transparent
          depthWrite
          polygonOffset
          polygonOffsetFactor={1}
          polygonOffsetUnits={1}
        />
      </mesh>
      <mesh geometry={cortexGeometry} renderOrder={2}>
        <shaderMaterial
          vertexShader={CorticalHeatmapShader.vertexShader}
          fragmentShader={CorticalHeatmapShader.fragmentShader}
          uniforms={cortexUniforms}
          side={THREE.FrontSide}
          transparent
          depthWrite
          depthTest
          depthFunc={THREE.LessEqualDepth}
          blending={THREE.NormalBlending}
        />
      </mesh>

      {/* Deep subcortical nuclei, visible through translucent cortex */}
      <SubcorticalNuclei opacity={0.55 * (1 - layerOpacity.tissue)} />

      {/* Layer 2: High-Tech Neural Point-Cloud */}
      {showPointCloud && (
        <group>
          <points geometry={pointCloudGeometry}>
            <shaderMaterial
              vertexShader={NeuralPointCloudShader.vertexShader}
              fragmentShader={NeuralPointCloudShader.fragmentShader}
              uniforms={pointCloudUniforms}
              transparent
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </points>

          <lineSegments geometry={wireframeGeometry}>
            <lineBasicMaterial
              color="#38BDF8"
              transparent
              opacity={0.05}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </lineSegments>
        </group>
      )}

      {/* Layer 3: Outer Translucent Scalp & 10-20 Coordinate Cage */}
      {showScalpGrid && (
        <group>
          <mesh
            geometry={headSilhouetteGeometry}
            rotation={[0, Math.PI, 0]}
            onPointerMove={(e) => {
              if (draggingElectrode || activePlacementMode) {
                e.stopPropagation();
                const hit = e.point;
                let closest: string | null = null;
                let minDist = Infinity;
                for (const [id, node] of Object.entries(BRAIN_NODES)) {
                  const nodeVec = new THREE.Vector3(...node.pos3D);
                  const d = hit.distanceTo(nodeVec);
                  if (d < minDist) {
                    minDist = d;
                    closest = id;
                  }
                }
                if (closest && minDist < 0.45) {
                  setMagneticCandidateNode(closest);
                  setHoveredNode(closest);
                } else {
                  setMagneticCandidateNode(null);
                }
              }
            }}
            onPointerUp={(e) => {
              if (draggingElectrode && magneticCandidateNode) {
                e.stopPropagation();
                onSelectNode(magneticCandidateNode, draggingElectrode);
                setDraggingElectrode(null);
                setMagneticCandidateNode(null);
                document.body.style.cursor = 'auto';
              } else if (draggingElectrode) {
                setDraggingElectrode(null);
                setMagneticCandidateNode(null);
                document.body.style.cursor = 'auto';
              }
            }}
            onClick={(e) => {
              if (activePlacementMode && magneticCandidateNode) {
                e.stopPropagation();
                onSelectNode(magneticCandidateNode, activePlacementMode);
                setActivePlacementMode(null);
                setMagneticCandidateNode(null);
              }
            }}
          >
            <meshBasicMaterial
              color="#38BDF8"
              wireframe
              transparent
              opacity={0.1 * layerOpacity.scalp}
              depthWrite={false}
            />
          </mesh>

        </group>
      )}

      {/* Layer 3.2: Human Face Overlay (Anterior Orientation Landmark - Video Feedback #1) */}
      {showHumanFace && (
        <group>
          {/* Facial feature landmark wireframe contours */}
          <lineSegments geometry={facialContoursGeometry}>
            <lineBasicMaterial
              color="#38BDF8"
              transparent
              opacity={0.80 * layerOpacity.face}
              depthWrite={false}
            />
          </lineSegments>

          {/* Continuous 3D Holographic Head and Face Mesh */}
          <mesh geometry={facialMaskGeometry}>
            <shaderMaterial
              vertexShader={HolographicFaceShader.vertexShader}
              fragmentShader={HolographicFaceShader.fragmentShader}
              uniforms={faceUniforms}
              transparent
              depthWrite={false}
              side={THREE.FrontSide}
            />
          </mesh>

          {/* Skull Base Orientation Compass Ring */}
          <lineSegments geometry={orientationRingGeometry}>
            <lineBasicMaterial
              color="#38BDF8"
              transparent
              opacity={0.50 * layerOpacity.face}
              depthWrite={false}
            />
          </lineSegments>

          {/* Anterior orientation indicator text */}
          <Text
            position={[0, -0.66, 1.22]}
            fontSize={0.040}
            color="#38BDF8"
            anchorX="center"
            anchorY="top"
          >
            ▲ Front (face)
          </Text>
        </group>
      )}

      {/* Layer 3.5: Skull shunt rim — a subtle Fresnel shell, never a bubble */}
      {showShuntHalo && (
        <mesh geometry={headSilhouetteGeometry} scale={[1.028, 1.028, 1.028]}>
          <shaderMaterial
            vertexShader={ShuntShellShader.vertexShader}
            fragmentShader={ShuntShellShader.fragmentShader}
            uniforms={shuntUniforms}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Stylized Neck and Shoulder Wireframe Anatomy for Extracephalic Nodes (BUG-06) */}
      <lineSegments geometry={neckShouldersGeo}>
        <lineBasicMaterial
          color="#38BDF8"
          transparent
          opacity={0.25}
          depthWrite={false}
        />
      </lineSegments>

      {/* Magnetic Snapping Candidate Ring Visual Indicator (BUG-05) */}
      {(draggingElectrode || activePlacementMode) && magneticCandidateNode && BRAIN_NODES[magneticCandidateNode] && (
        <group
          position={[
            BRAIN_NODES[magneticCandidateNode].pos3D[0] + BRAIN_NODES[magneticCandidateNode].normal[0] * 0.016,
            BRAIN_NODES[magneticCandidateNode].pos3D[1] + BRAIN_NODES[magneticCandidateNode].normal[1] * 0.016,
            BRAIN_NODES[magneticCandidateNode].pos3D[2] + BRAIN_NODES[magneticCandidateNode].normal[2] * 0.016
          ]}
        >
          <mesh>
            <sphereGeometry args={[0.048, 16, 16]} />
            <meshBasicMaterial
              color={draggingElectrode === 'anode' || activePlacementMode === 'anode' ? '#FF4D4D' : '#00D2FF'}
              wireframe
              transparent
              opacity={0.85}
            />
          </mesh>
        </group>
      )}

      {/* Animated 3D Current Streamlines */}
      <StreamlineParticles
        anodeId={anodeId}
        cathodeId={cathodeId}
        currentMa={currentMa}
        montageType={montageType}
        surroundNodes={surroundNodes}
        visible={showStreamlines}
        simRef={sim}
        opacity={layerOpacity.streamlines}
      />

      {/* Anode Assembly: Sponge Sleeve, Conductive Core, Silicone Rim, Gold Rivet, Lead Wire, and Clinical Status Badge */}
      <group
        position={[
          anodeNode.pos3D[0] + anodeNode.normal[0] * 0.012,
          anodeNode.pos3D[1] + anodeNode.normal[1] * 0.012,
          anodeNode.pos3D[2] + anodeNode.normal[2] * 0.012
        ]}
        quaternion={anodeQuat}
      >
        {/* 1. Colored rubber backing — a thin clinical rim around the sponge */}
        <mesh geometry={curvedPadGeo} position={[0, 0, 0.006]} scale={[1.045, 1.045, 0.55]} raycast={() => null}>
          <meshStandardMaterial color="#991B1B" roughness={0.55} metalness={0.02} />
        </mesh>

        {/* 2. Saline sponge face — warm, matte, and comfortable */}
        <mesh
          geometry={curvedPadGeo}
          position={[0, 0, 0.014]}
          onPointerDown={(e) => {
            e.stopPropagation();
            setDraggingElectrode('anode');
            document.body.style.cursor = 'grabbing';
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            if (!draggingElectrode) document.body.style.cursor = 'grab';
          }}
          onPointerOut={() => {
            if (!draggingElectrode) document.body.style.cursor = 'auto';
          }}
        >
          <meshStandardMaterial color="#D8CEBE" roughness={0.92} metalness={0.01} />
        </mesh>

        {/* 3. Red conductive gel electrode */}
        <mesh position={[0, 0, 0.031]} rotation={[Math.PI / 2, 0, 0]} raycast={() => null}>
          <cylinderGeometry args={[0.060 * padScale, 0.060 * padScale, 0.006, 32]} />
          <meshStandardMaterial
            color="#7F1D1D"
            roughness={0.42}
            metalness={0.12}
            emissive="#450A0A"
            emissiveIntensity={0.25}
          />
        </mesh>

        {/* 4. Polished retaining ring */}
        <mesh position={[0, 0, 0.035]} raycast={() => null}>
          <torusGeometry args={[0.060 * padScale, 0.006, 12, 36]} />
          <meshStandardMaterial color="#CBD5E1" metalness={0.9} roughness={0.22} />
        </mesh>

        {/* 5. Center Machined Gold Snap Connector Stud */}
        <mesh position={[0, 0, 0.036]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.018, 0.018, 0.014, 20]} />
          <meshStandardMaterial
            color="#F59E0B"
            metalness={0.92}
            roughness={0.18}
            emissive="#D97706"
            emissiveIntensity={0.35}
          />
        </mesh>

        {/* 6. Strain-Relief Boot Collar */}
        <mesh position={[0, 0, 0.046]} rotation={[Math.PI / 2, 0, 0]} raycast={() => null}>
          <cylinderGeometry args={[0.012, 0.016, 0.012, 16]} />
          <meshStandardMaterial color="#334155" roughness={0.5} />
        </mesh>

        {/* 7. Clinical status badge */}
        <group position={[0, 0.088 * padScale + 0.095, 0.03]}>
          <Text
            position={[0, 0, 0.005]}
            fontSize={padLabelFontSize * 0.58}
            color="#FCA5A5"
            anchorX="center"
            anchorY="middle"
            fontWeight="bold"
            outlineWidth={0.0035}
            outlineColor="#070B12"
          >
            {`+ ANODE (${anodeNode.id})`}
          </Text>
        </group>
      </group>

      {/* Cathode Assembly or HD 4x1 Rings */}
      {montageType === 'hd4x1' && surroundNodes ? (
        surroundNodes.map((sId) => {
          const sNode = BRAIN_NODES[sId];
          if (!sNode) return null;
          const q = new THREE.Quaternion().setFromUnitVectors(
            new THREE.Vector3(0, 0, 1),
            new THREE.Vector3(...sNode.normal).normalize()
          );
          return (
            <group
              key={sId}
              position={[
                sNode.pos3D[0] + sNode.normal[0] * 0.012,
                sNode.pos3D[1] + sNode.normal[1] * 0.012,
                sNode.pos3D[2] + sNode.normal[2] * 0.012
              ]}
              quaternion={q}
            >
              {/* Soterix Ag/AgCl Delrin collar ring */}
              <mesh position={[0, 0, 0.012]}>
                <torusGeometry args={[0.048, 0.010, 16, 28]} />
                <meshStandardMaterial color="#F1F5F9" roughness={0.3} metalness={0.1} />
              </mesh>
              {/* Inner conductive Ag/AgCl ring */}
              <mesh position={[0, 0, 0.012]}>
                <ringGeometry args={[0.034, 0.046, 24]} />
                <meshStandardMaterial color="#CBD5E1" metalness={0.85} roughness={0.2} side={THREE.DoubleSide} />
              </mesh>
              {/* Central conductive electrolyte gel */}
              <mesh position={[0, 0, 0.010]}>
                <circleGeometry args={[0.034, 24]} />
                <meshStandardMaterial color="#00D2FF" transparent opacity={0.65} side={THREE.DoubleSide} />
              </mesh>
              <Text
                position={[0, 0, 0.026]}
                fontSize={0.032}
                color="#38BDF8"
                anchorX="center"
                anchorY="middle"
              >
                {`- ${sNode.id}`}
              </Text>
            </group>
          );
        })
      ) : (
        <>
          <group
            position={[
              cathodeNode.pos3D[0] + cathodeNode.normal[0] * 0.012,
              cathodeNode.pos3D[1] + cathodeNode.normal[1] * 0.012,
              cathodeNode.pos3D[2] + cathodeNode.normal[2] * 0.012
            ]}
            quaternion={cathodeQuat}
          >
            {/* 1. Colored rubber backing — a thin clinical rim around the sponge */}
            <mesh geometry={curvedPadGeo} position={[0, 0, 0.006]} scale={[1.045, 1.045, 0.55]} raycast={() => null}>
              <meshStandardMaterial color="#0E7490" roughness={0.55} metalness={0.02} />
            </mesh>

            {/* 2. Saline sponge face */}
            <mesh
              geometry={curvedPadGeo}
              position={[0, 0, 0.014]}
              onPointerDown={(e) => {
                e.stopPropagation();
                setDraggingElectrode('cathode');
                document.body.style.cursor = 'grabbing';
              }}
              onPointerOver={(e) => {
                e.stopPropagation();
                if (!draggingElectrode) document.body.style.cursor = 'grab';
              }}
              onPointerOut={() => {
                if (!draggingElectrode) document.body.style.cursor = 'auto';
              }}
            >
              <meshStandardMaterial color="#D8CEBE" roughness={0.92} metalness={0.01} />
            </mesh>

            {/* 3. Cyan conductive gel electrode */}
            <mesh position={[0, 0, 0.031]} rotation={[Math.PI / 2, 0, 0]} raycast={() => null}>
              <cylinderGeometry args={[0.060 * padScale, 0.060 * padScale, 0.006, 32]} />
              <meshStandardMaterial
                color="#0E4F63"
                roughness={0.42}
                metalness={0.12}
                emissive="#083344"
                emissiveIntensity={0.25}
              />
            </mesh>

            {/* 4. Polished retaining ring */}
            <mesh position={[0, 0, 0.035]} raycast={() => null}>
              <torusGeometry args={[0.060 * padScale, 0.006, 12, 36]} />
              <meshStandardMaterial color="#CBD5E1" metalness={0.9} roughness={0.22} />
            </mesh>

            {/* 5. Center Machined Chrome Snap Connector Stud */}
            <mesh position={[0, 0, 0.036]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.018, 0.018, 0.014, 20]} />
              <meshStandardMaterial
                color="#E2E8F0"
                metalness={0.95}
                roughness={0.15}
                emissive="#38BDF8"
                emissiveIntensity={0.25}
              />
            </mesh>

            {/* 6. Strain-Relief Boot Collar */}
            <mesh position={[0, 0, 0.046]} rotation={[Math.PI / 2, 0, 0]} raycast={() => null}>
              <cylinderGeometry args={[0.012, 0.016, 0.012, 16]} />
              <meshStandardMaterial color="#334155" roughness={0.5} />
            </mesh>

            {/* 7. Clinical status badge */}
            <group position={[0, 0.088 * padScale + 0.095, 0.03]}>
              <Text
                position={[0, 0, 0.005]}
                fontSize={padLabelFontSize * 0.58}
                color="#7DD3FC"
                anchorX="center"
                anchorY="middle"
                fontWeight="bold"
                outlineWidth={0.0035}
                outlineColor="#070B12"
              >
                {`- CATHODE (${cathodeNode.id})`}
              </Text>
            </group>
          </group>
        </>
      )}

      {/* Interactive 10-20 Scalp Target Nodes - High Visibility & Glowing Halo (Video Feedback #4 & #5) */}
      {Object.values(BRAIN_NODES).map((node) => {
        const isAnode = node.id === anodeId;
        const isCathode = node.id === cathodeId || (montageType === 'hd4x1' && surroundNodes?.includes(node.id));
        const isHovered = hoveredNode === node.id;
        const isExtracephalic = node.id.startsWith('EX_');

        // With the coordinate shell hidden, inactive landmarks would float in
        // empty space around the cortex. Keep only the two active pads visible;
        // the full 10-20 set returns with the shell or during placement.
        if (!showScalpGrid && !isAnode && !isCathode && !isHovered && !activePlacementMode) {
          return null;
        }

        // Inactive landmarks recede when the 10-20 shell is hidden so the
        // cortical tissue remains the visual subject.
        let nodeColor = isExtracephalic ? '#94A3B8' : '#F8FAFC';
        let emissiveColor = isExtracephalic ? '#64748B' : '#38BDF8';
        let emissiveIntensity = showScalpGrid ? 0.85 : 0.38;
        let radius = showScalpGrid ? 0.032 : 0.020;

        if (isAnode) {
          nodeColor = '#EF4444';
          emissiveColor = '#FF1111';
          emissiveIntensity = 1.3;
          radius = 0.042;
        } else if (isCathode) {
          nodeColor = '#06B6D4';
          emissiveColor = '#00E5FF';
          emissiveIntensity = 1.3;
          radius = 0.042;
        } else if (isHovered) {
          nodeColor = '#38BDF8';
          emissiveColor = '#00F0FF';
          emissiveIntensity = 1.1;
          radius = 0.038;
        }

        return (
          <group key={node.id} position={node.pos3D}>
            {/* Outer high-contrast marker ring for inactive nodes to be immediately detectable */}
            {!isAnode && !isCathode && (
              <mesh>
                <sphereGeometry args={[radius * 1.3, 12, 12]} />
                <meshBasicMaterial
                  color="#38BDF8"
                  wireframe
                  transparent
                  opacity={isHovered ? 0.9 : 0.45}
                  depthWrite={false}
                />
              </mesh>
            )}

            <mesh
              onClick={(e) => {
                e.stopPropagation();
                if (activePlacementMode === 'anode') {
                  onSelectNode(node.id, 'anode');
                  setActivePlacementMode(null);
                } else if (activePlacementMode === 'cathode') {
                  onSelectNode(node.id, 'cathode');
                  setActivePlacementMode(null);
                } else {
                  onSelectNode(node.id, 'anode');
                }
              }}
              onPointerOver={(e) => {
                e.stopPropagation();
                setHoveredNode(node.id);
                document.body.style.cursor = 'pointer';
              }}
              onPointerOut={() => {
                setHoveredNode(null);
                document.body.style.cursor = 'auto';
              }}
            >
              <sphereGeometry args={[radius, 16, 16]} />
              <meshStandardMaterial
                color={nodeColor}
                emissive={emissiveColor}
                emissiveIntensity={emissiveIntensity}
                roughness={0.2}
              />
            </mesh>

            {(showBrodmannLabels || isHovered) && !isAnode && !isCathode && (
              <Text
                position={[0, 0.052, 0.02]}
                fontSize={0.034}
                color="#E2E8F0"
                anchorX="center"
                anchorY="bottom"
                outlineWidth={0.004}
                outlineColor="#070B12"
              >
                {node.id}
              </Text>
            )}

            {isHovered && (
              <Html distanceFactor={3.2} position={[0, 0.12, 0]} style={{ pointerEvents: 'none' }}>
                <div className="bg-[#0F1623]/95 backdrop-blur-md border border-cyan-500/40 rounded-lg p-2.5 shadow-2xl text-xs w-48 text-slate-200">
                  <div className="flex items-center justify-between font-mono font-bold text-cyan-400">
                    <span>10-20: {node.id}</span>
                    <span className="text-[11px] bg-cyan-950/60 px-1.5 py-0.5 rounded text-cyan-300">
                      {node.lobe}
                    </span>
                  </div>
                  <div className="text-[12px] font-semibold text-slate-100 mt-1 line-clamp-1">
                    {node.name}
                  </div>
                  <div className="text-[11px] text-amber-300 font-mono mt-0.5">
                    Brodmann: {node.brodmannAreas.join(', ')}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                    {node.primaryFunctions[0]}
                  </div>
                  <div className="mt-1.5 pt-1 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Click to assign</span>
                    <span className="font-mono text-cyan-400 font-bold">
                      {activePlacementMode ? `Set ${activePlacementMode.toUpperCase()}` : 'SET ANODE'}
                    </span>
                  </div>
                </div>
              </Html>
            )}
          </group>
        );
      })}
    </>
  );
};

/**
 * Deep grey-matter nuclei (thalami and striata) as soft translucent solids,
 * so lowering cortical opacity reveals what lies beneath the stimulated cortex.
 */
const SubcorticalNuclei: React.FC<{ opacity: number }> = ({ opacity }) => {
  const geometry = useMemo(() => new THREE.SphereGeometry(1, 24, 16), []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const nuclei: Array<{ pos: [number, number, number]; scale: [number, number, number]; color: string }> = [
    { pos: [-0.07, 0.02, -0.06], scale: [0.06, 0.05, 0.1], color: '#E9A6A0' },
    { pos: [0.07, 0.02, -0.06], scale: [0.06, 0.05, 0.1], color: '#E9A6A0' },
    { pos: [-0.17, 0.06, 0.1], scale: [0.05, 0.07, 0.13], color: '#D98F8A' },
    { pos: [0.17, 0.06, 0.1], scale: [0.05, 0.07, 0.13], color: '#D98F8A' }
  ];
  return (
    <group renderOrder={-1}>
      {nuclei.map((n, i) => (
        <mesh key={i} geometry={geometry} position={n.pos} scale={n.scale} renderOrder={-1}>
          <meshStandardMaterial
            color={n.color}
            roughness={0.7}
            transparent
            opacity={Math.max(0, Math.min(0.85, opacity))}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
};

/** Measured frame rate, written straight to the DOM twice a second. */
const FpsProbe: React.FC<{ target: React.RefObject<HTMLSpanElement> }> = ({ target }) => {
  const acc = useRef({ frames: 0, time: 0 });
  useFrame((_, delta) => {
    acc.current.frames += 1;
    acc.current.time += delta;
    if (acc.current.time >= 0.5) {
      if (target.current) target.current.textContent = `${Math.round(acc.current.frames / acc.current.time)} FPS`;
      acc.current.frames = 0;
      acc.current.time = 0;
    }
  });
  return null;
};

const SPEEDS: Array<{ value: number; label: string; title: string; icon: React.ReactNode }> = [
  { value: 0, label: 'Pause', title: 'Pause the simulation', icon: <Pause className="h-3.5 w-3.5" /> },
  { value: 1, label: '1×', title: 'Play at 1× speed', icon: <Play className="h-3.5 w-3.5" /> },
  { value: 2, label: '2×', title: 'Fast forward at 2× speed', icon: <FastForward className="h-3.5 w-3.5" /> }
];

export const BrainViewport3D: React.FC<BrainViewport3DProps> = ({
  anodeId,
  cathodeId,
  currentMa,
  padAreaCm2,
  montageType,
  surroundNodes,
  telemetry,
  onSelectNode,
  showScalpGrid,
  showShuntHalo,
  showHumanFace,
  showEField,
  showStreamlines,
  showPointCloud,
  showBrodmannLabels,
  activePlacementMode,
  setActivePlacementMode,
  isLeftDockCollapsed,
  layerOpacity,
  onTissueOpacityChange
}) => {
  const anodeNode = BRAIN_NODES[anodeId] || BRAIN_NODES['F3'];
  const [isHudMinimized, setIsHudMinimized] = useState(false);
  const [isLensOpen, setIsLensOpen] = useState(false);
  const [simSpeed, setSimSpeed] = useState(1);
  const [resetNonce, setResetNonce] = useState(0);
  const [cameraRequest, setCameraRequest] = useState<{ view: CameraView; nonce: number } | null>(null);
  const fpsRef = useRef<HTMLSpanElement>(null);

  const handleSnapCamera = (view: CameraView) => {
    setCameraRequest((prev) => ({ view, nonce: (prev?.nonce ?? 0) + 1 }));
  };

  const shiftSign = telemetry.maxMembraneShiftMv >= 0 ? '+' : '';

  return (
    <div
      className="relative h-full w-full select-none overflow-hidden bg-[#070B12]"
      style={{
        background:
          'radial-gradient(ellipse at 50% 42%, #0E192A 0%, #09111D 48%, #070B12 100%)'
      }}
    >
      <CanvasErrorBoundary>
        <Canvas
          camera={{ position: [-1.32, 0.48, 3.72], fov: 40, near: 0.1, far: 20 }}
          gl={{ antialias: true, powerPreference: 'high-performance', alpha: true }}
          dpr={[1, 2]}
        >
          <Suspense fallback={null}>
            <BrainScene
              anodeId={anodeId}
              cathodeId={cathodeId}
              currentMa={currentMa}
              padAreaCm2={padAreaCm2}
              montageType={montageType}
              surroundNodes={surroundNodes}
              onSelectNode={onSelectNode}
              showScalpGrid={showScalpGrid}
              showShuntHalo={showShuntHalo}
              showHumanFace={showHumanFace}
              showEField={showEField}
              showStreamlines={showStreamlines}
              showPointCloud={showPointCloud}
              showBrodmannLabels={showBrodmannLabels}
              activePlacementMode={activePlacementMode}
              setActivePlacementMode={setActivePlacementMode}
              cameraRequest={cameraRequest}
              layerOpacity={layerOpacity}
              simSpeed={simSpeed}
              resetNonce={resetNonce}
            />
          </Suspense>
          <FpsProbe target={fpsRef} />
        </Canvas>
      </CanvasErrorBoundary>

      {/* Top-right: camera snap views, then the cellular microscope beneath */}
      <div className="pointer-events-none absolute right-4 top-4 z-10 flex flex-col items-end gap-2">
        <div className="pointer-events-auto">
          <ViewportOrientationCube onSnapCamera={handleSnapCamera} />
        </div>
        <NeuronalMagnifyingLens
          anodeId={anodeId}
          cathodeId={cathodeId}
          currentMa={currentMa}
          padAreaCm2={padAreaCm2}
          montageType={montageType}
          surroundNodes={surroundNodes}
          simSpeed={simSpeed}
          collapsed={!isLensOpen}
          onToggle={() => setIsLensOpen((open) => !open)}
        />
      </div>

      {/* Minimizable Floating HUD: Real-Time Biophysical Telemetry */}
      <div className={`absolute top-4 ${isLeftDockCollapsed ? 'left-10' : 'left-4'} z-10 pointer-events-auto transition-all duration-300`}>
        {isHudMinimized ? (
          <button
            onClick={() => setIsHudMinimized(false)}
            className="group flex cursor-pointer items-center gap-2 rounded-full border border-cyan-500/50 bg-[#0F1623]/95 px-3.5 py-1.5 text-xs text-slate-200 shadow-2xl backdrop-blur-md transition-all hover:border-cyan-400"
            title="Click to expand the cortical E-field HUD"
          >
            <Activity className="h-3.5 w-3.5 text-cyan-400" />
            <span className="font-medium text-white">E-field</span>
            <span className="font-mono font-semibold text-amber-300">{telemetry.peakEFieldVm.toFixed(3)} <span className="font-normal text-slate-500">V/m</span></span>
            <span className="text-slate-600">|</span>
            <span className="font-mono font-semibold text-cyan-300">{telemetry.currentDensityMaCm2.toFixed(3)} <span className="font-normal text-slate-500">mA/cm²</span></span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition" />
          </button>
        ) : (
          <div className="bg-[#0F1623]/90 backdrop-blur-md border border-slate-800/80 rounded-xl p-3 shadow-xl text-xs w-[320px] select-none space-y-2">
            {/* The whole header collapses the HUD back to its chip. */}
            <button
              type="button"
              onClick={() => setIsHudMinimized(true)}
              className="flex w-full items-center justify-between rounded-md border-b border-slate-800 pb-1.5 text-left text-slate-400 transition hover:text-white"
              title="Collapse the telemetry panel"
              aria-expanded
            >
              <span className="flex items-center gap-1.5 text-[12.5px] font-semibold tracking-tight text-cyan-300">
                <Activity className="h-4 w-4 text-cyan-400" />
                Cortical telemetry
              </span>
              <span className="flex items-center gap-1.5">
                <span
                  ref={fpsRef}
                  className="rounded bg-slate-800/80 px-1.5 py-0.5 font-mono text-[11.5px] text-slate-300"
                  title="Measured WebGL frame rate"
                >
                  — FPS
                </span>
                <ChevronDown className="h-4 w-4 rotate-180" />
              </span>
            </button>

            {/* E-Field Thermal Spectrum with Physiological Milestones */}
            <EFieldThermalSpectrum peakEFieldVm={telemetry.peakEFieldVm} />

            {/* Membrane Potential Shift Micro-Gauge */}
            <div className="rounded-lg border border-slate-800/60 bg-slate-900/70 p-2 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-400">Peak membrane shift (ΔVm)</span>
                <span className="font-mono font-semibold text-emerald-300">{shiftSign}{telemetry.maxMembraneShiftMv.toFixed(2)} mV</span>
              </div>
              <div className="relative w-full h-2 bg-slate-950 rounded-full mt-1.5 overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (Math.abs(telemetry.maxMembraneShiftMv) / 15) * 100)}%` }}
                />
              </div>
              <div className="mt-1 flex justify-between font-mono text-[9.5px] text-slate-500">
                <span>−70 mV rest</span>
                <span className="text-slate-400">bar = share of the 15 mV gap</span>
                <span className="font-semibold text-rose-400">−55 mV</span>
              </div>
            </div>

            {/* Grid Stats */}
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              <div className="rounded border border-slate-800/50 bg-slate-900/60 p-1.5">
                <div className="text-slate-400">Current density J</div>
                <div className="mt-0.5 font-mono text-xs font-semibold text-cyan-300">
                  {telemetry.currentDensityMaCm2.toFixed(3)} <span className="text-[10.5px] font-normal text-slate-400">mA/cm²</span>
                </div>
              </div>

              <div className="rounded border border-slate-800/50 bg-slate-900/60 p-1.5">
                <div className="text-slate-400">Scalp shunt</div>
                <div className="mt-0.5 font-mono text-xs font-semibold text-rose-300">
                  {telemetry.shuntPercentage.toFixed(1)}% <span className="text-[10.5px] font-normal text-slate-400">lost</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-800/60 pt-1 text-[11px]">
              <span className="text-slate-400">Target areas</span>
              <span className="font-mono font-semibold text-amber-300">{anodeNode.brodmannAreas.join(', ')}</span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom-centre: simulation playback and tissue translucency */}
      <div className="pointer-events-auto absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-xl border border-slate-800/80 bg-[#0E1524]/90 p-1 shadow-2xl backdrop-blur-md">
        {SPEEDS.map((speed) => (
          <button
            key={speed.value}
            type="button"
            onClick={() => setSimSpeed(speed.value)}
            aria-pressed={simSpeed === speed.value}
            title={speed.title}
            className={`flex items-center gap-1 rounded-lg px-1.5 py-1.5 text-[11px] font-medium transition ${
              simSpeed === speed.value ? 'bg-cyan-500/15 text-cyan-200' : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-100'
            }`}
          >
            {speed.icon}
            {speed.value > 0 && <span className="font-mono">{speed.label}</span>}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setResetNonce((n) => n + 1)}
          title="Reset the session clock"
          aria-label="Reset the session clock"
          className="rounded-lg px-1.5 py-1.5 text-slate-400 transition hover:bg-slate-800/80 hover:text-slate-100"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
        <label
          className="ml-1 flex items-center gap-1.5 border-l border-slate-800 pl-2 pr-1.5"
          title="Cortical tissue translucency: slide left to see current paths and deep nuclei inside"
        >
          <Droplet className="h-3.5 w-3.5 shrink-0 text-rose-300" />
          <input
            type="range"
            min={0.15}
            max={0.9}
            step={0.01}
            value={layerOpacity.tissue}
            onChange={(event) => onTissueOpacityChange(parseFloat(event.target.value))}
            className="slider w-20 text-rose-300"
            aria-label="Cortical tissue opacity"
          />
          <span className="w-7 text-right font-mono text-[10.5px] text-slate-400">{Math.round(layerOpacity.tissue * 100)}%</span>
        </label>
      </div>

      {/* Calibrated scientific colorbar */}
      {showEField && (
        <div className="absolute bottom-4 right-4 z-10 w-48 rounded-xl border border-slate-800/80 bg-[#0E1524]/90 p-2.5 shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-medium text-slate-300">Cortical E-field</span>
            <span className="font-mono text-[11px] font-semibold text-amber-300">
              {telemetry.peakEFieldVm.toFixed(3)} <span className="font-normal text-slate-500">V/m</span>
            </span>
          </div>
          <div
            className="mt-1.5 h-2 w-full rounded-full border border-slate-700/70"
            style={{ background: 'linear-gradient(90deg, #67E8F9 0%, #E2E8F0 50%, #FDBA74 100%)' }}
          />
          <div className="mt-1 flex justify-between text-[9.5px] text-slate-500">
            <span>− cathodal</span>
            <span>0</span>
            <span>anodal +</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrainViewport3D;
