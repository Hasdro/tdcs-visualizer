import React, { useMemo, useRef, useState, Component, ErrorInfo, ReactNode, Suspense } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Html } from '@react-three/drei';
import {
  createBiHemisphericBrainGeometry,
  createHumanFaceGeometry,
  create1020MeridianArcs,
  createCurvedPadGeometry,
  createLeadWireGeometry,
  createNeckAndShoulderGeometry
} from '../utils/brainGeometry';
import { BRAIN_NODES } from '../data/brain_nodes';
import { StreamlineParticles } from './StreamlineParticles';
import { BiophysicalTelemetry } from '../utils/biophysicsEngine';
import { Activity, Zap, AlertTriangle, Minimize2, ChevronDown } from 'lucide-react';

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
}

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
          <h3 className="font-mono text-sm font-bold text-slate-200 uppercase tracking-wider">
            WebGL Context Notice
          </h3>
          <p className="text-xs text-slate-400 max-w-md mt-2 font-mono">
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
    uMontageType: { value: 0 }, // 0: sponge, 1: hd4x1
    uSurroundPos0: { value: new THREE.Vector3() },
    uSurroundPos1: { value: new THREE.Vector3() },
    uSurroundPos2: { value: new THREE.Vector3() },
    uSurroundPos3: { value: new THREE.Vector3() },
  },
  vertexShader: `
    attribute float aCurvature;
    varying vec3 vNormal;
    varying vec3 vWorldNormal;
    varying vec3 vPosition;
    varying vec3 vWorldPosition;
    varying float vCurvature;

    void main() {
      vCurvature = aCurvature;
      vNormal = normalize(normal);
      vWorldNormal = normalize(normalMatrix * normal);
      vPosition = position;
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

    varying vec3 vNormal;
    varying vec3 vWorldNormal;
    varying vec3 vPosition;
    varying vec3 vWorldPosition;
    varying float vCurvature;

    void main() {
      // 1. Biological Cortical Grey Matter Tones:
      // Deep sulcal valleys: rich shadowed burgundy-umber
      vec3 deepSulcus = vec3(0.24, 0.09, 0.09);
      // Mid-cortex grey matter: warm lifelike biological pinkish-tan
      vec3 midCortex = vec3(0.76, 0.60, 0.54);
      // Gyral crowns: glistening soft cream-pink
      vec3 gyrusCrown = vec3(0.88, 0.74, 0.68);

      vec3 baseColor = mix(deepSulcus, midCortex, smoothstep(0.0, 0.48, vCurvature));
      baseColor = mix(baseColor, gyrusCrown, smoothstep(0.48, 1.0, vCurvature));

      // Delicate micro-vascular sulcal capillaries
      float microPia = sin(vPosition.x * 48.0 + sin(vPosition.y * 36.0)) *
                       cos(vPosition.z * 48.0 + cos(vPosition.x * 36.0));
      if (vCurvature < 0.45 && microPia > 0.65) {
        baseColor = mix(baseColor, vec3(0.38, 0.06, 0.06), 0.35);
      }

      // 2. Anatomical Living Tissue Lighting:
      vec3 viewDir = normalize(cameraPosition - vWorldPosition);
      vec3 keyLight = normalize(vec3(2.5, 3.8, 2.8));
      vec3 fillLight = normalize(vec3(-2.5, -1.2, 1.5));
      vec3 rimLight = normalize(vec3(0.0, 2.0, -3.0));

      // Normal micro-perturbation for organic living tissue feel
      vec3 perturbedNormal = normalize(vWorldNormal + vec3(
        sin(vPosition.y * 32.0 + vPosition.z * 24.0) * 0.06,
        cos(vPosition.x * 32.0 + vPosition.z * 24.0) * 0.06,
        sin(vPosition.x * 32.0 + vPosition.y * 24.0) * 0.06
      ));

      // Diffuse wrap lighting (subsurface scattering approximation for soft organic tissue)
      float diffKey = max(0.0, (dot(perturbedNormal, keyLight) + 0.25) / 1.25);
      float diffFill = max(0.0, (dot(perturbedNormal, fillLight) + 0.20) / 1.20);
      float diffRim = max(0.0, dot(perturbedNormal, rimLight));

      baseColor *= (0.28 + 0.52 * diffKey + 0.14 * diffFill + 0.06 * diffRim);

      // Pia mater wet glistening specular highlight
      vec3 halfDir = normalize(keyLight + viewDir);
      float spec = pow(max(dot(perturbedNormal, halfDir), 0.0), 38.0);
      vec3 piaSpecular = vec3(0.98, 0.94, 0.92) * spec * 0.45 * (0.30 + 0.70 * vCurvature);
      baseColor += piaSpecular;

      // Organic tissue Fresnel edge glow (warm biological subsurface rim)
      float fresnel = pow(1.0 - max(dot(perturbedNormal, viewDir), 0.0), 3.0);
      baseColor += vec3(0.92, 0.42, 0.32) * fresnel * 0.28;

      // 3. Smooth Physical E-Field Potential Field:
      float sigma = (uMontageType == 1) ? 0.16 : (0.22 * sqrt(max(uPadArea, 9.0) / 25.0));
      float twoSigmaSq = 2.0 * sigma * sigma;
      float dSkullSq = 0.028;

      // Anodal potential field
      float distAnodeSq = dot(vPosition - uAnodePos, vPosition - uAnodePos);
      float effAnodeDist = sqrt(distAnodeSq + dSkullSq);
      float weightAnode = exp(-distAnodeSq / twoSigmaSq);
      float phiA = (uCurrentMa * 0.35 * weightAnode) / effAnodeDist;

      // Cathodal potential field
      float phiC = 0.0;
      if (uMontageType == 1) {
        vec3 ring[4];
        ring[0] = uSurroundPos0;
        ring[1] = uSurroundPos1;
        ring[2] = uSurroundPos2;
        ring[3] = uSurroundPos3;

        for (int i = 0; i < 4; i++) {
          float dSq = dot(vPosition - ring[i], vPosition - ring[i]);
          float effDist = sqrt(dSq + dSkullSq);
          float w = exp(-dSq / (twoSigmaSq * 0.85));
          phiC += (uCurrentMa * 0.35 * 0.25 * w) / effDist;
        }
      } else {
        float distCathodeSq = dot(vPosition - uCathodePos, vPosition - uCathodePos);
        float effCathodeDist = sqrt(distCathodeSq + dSkullSq);
        float weightCathode = exp(-distCathodeSq / twoSigmaSq);
        phiC = (uCurrentMa * 0.35 * weightCathode) / effCathodeDist;
      }

      // Gyral crown depth modulation: preserves dark sulcal crevices
      float gyralModulation = 0.65 + 0.35 * vCurvature;
      float netField = (phiA - phiC) * gyralModulation;

      float pulse = 1.0 + 0.03 * sin(uTime * 3.5 + vPosition.x * 6.0);
      float peakField = max(0.8, uCurrentMa * 1.8);

      vec3 finalColor = baseColor;

      // 4. Smooth Clinical E-Field Heatmap Overlay over Biological Tissue
      if (uShowEField > 0.5) {
        if (netField > 0.03) {
          float t = clamp((netField - 0.03) / (peakField * 0.75), 0.0, 1.0) * pulse;
          // Anodal Excitation: deep coral-rose -> fiery amber -> golden yellow -> sunburst cream
          vec3 c1 = vec3(0.88, 0.24, 0.14); // coral rose
          vec3 c2 = vec3(0.98, 0.54, 0.10); // fiery amber
          vec3 c3 = vec3(1.00, 0.82, 0.20); // golden yellow
          vec3 c4 = vec3(1.00, 0.94, 0.58); // sunburst cream

          vec3 anodalHot = (t < 0.28) ? mix(c1, c2, t / 0.28) :
                           (t < 0.65) ? mix(c2, c3, (t - 0.28) / 0.37) :
                                        mix(c3, c4, (t - 0.65) / 0.35);

          // Blend with tissue preserving sulcal depth shadows
          float heatBlend = smoothstep(0.03, peakField * 0.60, netField) * (0.50 + 0.50 * vCurvature);
          finalColor = mix(finalColor, anodalHot, heatBlend * 0.72);
          finalColor += anodalHot * pow(t, 2.0) * 0.22 * (0.35 + 0.65 * vCurvature);
        } else if (netField < -0.03) {
          float t = clamp((-netField - 0.03) / (peakField * 0.75), 0.0, 1.0) * pulse;
          // Cathodal Inhibition: twilight navy -> sapphire -> electric cyan -> ice aquamarine
          vec3 c1 = vec3(0.10, 0.26, 0.68); // navy
          vec3 c2 = vec3(0.06, 0.52, 0.95); // sapphire
          vec3 c3 = vec3(0.12, 0.85, 1.00); // cyan
          vec3 c4 = vec3(0.60, 0.95, 1.00); // ice aquamarine

          vec3 cathodalCool = (t < 0.28) ? mix(c1, c2, t / 0.28) :
                              (t < 0.65) ? mix(c2, c3, (t - 0.28) / 0.37) :
                                           mix(c3, c4, (t - 0.65) / 0.35);

          // Blend with tissue preserving sulcal depth shadows
          float coolBlend = smoothstep(0.03, peakField * 0.60, -netField) * (0.50 + 0.50 * vCurvature);
          finalColor = mix(finalColor, cathodalCool, coolBlend * 0.72);
          finalColor += cathodalCool * pow(t, 2.0) * 0.22 * (0.35 + 0.65 * vCurvature);
        }
      }

      gl_FragColor = vec4(clamp(finalColor, 0.0, 1.0), 1.0);
    }
  `
};

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
  },
  vertexShader: `
    attribute float aPhase;
    uniform vec3 uAnodePos;
    uniform vec3 uCathodePos;
    uniform float uTime;
    uniform float uCurrentMa;

    varying vec3 vColor;
    varying float vAlpha;

    void main() {
      float distA = length(position - uAnodePos);
      float distC = length(position - uCathodePos);

      float freq = 2.5;
      vec3 ptColor = vec3(0.25, 0.55, 0.9);
      float size = 2.5;
      float alpha = 0.35;

      if (distA < 0.45) {
        float intensity = 1.0 - (distA / 0.45);
        freq = 6.0 + intensity * 6.0;
        ptColor = mix(vec3(1.0, 0.35, 0.2), vec3(1.0, 0.85, 0.2), sin(uTime * freq + aPhase) * 0.5 + 0.5);
        size = 3.5 + intensity * 2.5;
        alpha = 0.55 + 0.15 * sin(uTime * freq + aPhase);
      } else if (distC < 0.45) {
        float intensity = 1.0 - (distC / 0.45);
        freq = 1.8;
        ptColor = mix(vec3(0.0, 0.5, 0.9), vec3(0.1, 0.8, 1.0), sin(uTime * freq + aPhase) * 0.5 + 0.5);
        size = 3.5 + intensity * 2.5;
        alpha = 0.50;
      } else {
        float twinkle = sin(uTime * 3.0 + aPhase * 4.0);
        alpha = 0.18 + 0.18 * max(0.0, twinkle);
      }

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
  shuntPercentage: number;
  showEField: boolean;
  showStreamlines: boolean;
  showPointCloud: boolean;
  showBrodmannLabels: boolean;
  activePlacementMode: 'anode' | 'cathode' | null;
  setActivePlacementMode: (mode: 'anode' | 'cathode' | null) => void;
  isLeftDockCollapsed?: boolean;
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
  shuntPercentage,
  showEField,
  showStreamlines,
  showPointCloud,
  showBrodmannLabels,
  activePlacementMode,
  setActivePlacementMode
}) => {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [draggingElectrode, setDraggingElectrode] = useState<'anode' | 'cathode' | null>(null);
  const [magneticCandidateNode, setMagneticCandidateNode] = useState<string | null>(null);

  const { cortexGeometry, pointCloudGeometry, wireframeGeometry, headSilhouetteGeometry } = useMemo(
    () => createBiHemisphericBrainGeometry(),
    []
  );

  const { facialContoursGeometry, facialMaskGeometry, orientationRingGeometry } = useMemo(
    () => createHumanFaceGeometry(),
    []
  );

  const meridianArcsGeo = useMemo(() => create1020MeridianArcs(), []);

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

  const anodeNode = BRAIN_NODES[anodeId] || BRAIN_NODES['F3'];
  const cathodeNode = BRAIN_NODES[cathodeId] || BRAIN_NODES['Fp2'];

  const anodeLeadWireGeo = useMemo(() => {
    return createLeadWireGeometry(
      anodeNode.pos3D,
      anodeNode.normal,
      [0.18, -0.75, -0.65]
    );
  }, [anodeNode]);

  const cathodeLeadWireGeo = useMemo(() => {
    return createLeadWireGeometry(
      cathodeNode.pos3D,
      cathodeNode.normal,
      [-0.18, -0.75, -0.65]
    );
  }, [cathodeNode]);

  const heatmapMatRef = useRef<THREE.ShaderMaterial>(null);
  const pointCloudMatRef = useRef<THREE.ShaderMaterial>(null);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();

    if (heatmapMatRef.current) {
      heatmapMatRef.current.uniforms.uTime.value = time;
      heatmapMatRef.current.uniforms.uCurrentMa.value = currentMa;
      heatmapMatRef.current.uniforms.uPadArea.value = padAreaCm2;
      heatmapMatRef.current.uniforms.uShowEField.value = showEField ? 1.0 : 0.0;
      heatmapMatRef.current.uniforms.uMontageType.value = montageType === 'hd4x1' ? 1 : 0;

      heatmapMatRef.current.uniforms.uAnodePos.value.set(...anodeNode.posCortical);
      heatmapMatRef.current.uniforms.uCathodePos.value.set(...cathodeNode.posCortical);

      if (montageType === 'hd4x1' && surroundNodes && surroundNodes.length >= 4) {
        const s0 = BRAIN_NODES[surroundNodes[0]];
        const s1 = BRAIN_NODES[surroundNodes[1]];
        const s2 = BRAIN_NODES[surroundNodes[2]];
        const s3 = BRAIN_NODES[surroundNodes[3]];
        if (s0) heatmapMatRef.current.uniforms.uSurroundPos0.value.set(...s0.posCortical);
        if (s1) heatmapMatRef.current.uniforms.uSurroundPos1.value.set(...s1.posCortical);
        if (s2) heatmapMatRef.current.uniforms.uSurroundPos2.value.set(...s2.posCortical);
        if (s3) heatmapMatRef.current.uniforms.uSurroundPos3.value.set(...s3.posCortical);
      }
    }

    if (pointCloudMatRef.current) {
      pointCloudMatRef.current.uniforms.uTime.value = time;
      pointCloudMatRef.current.uniforms.uCurrentMa.value = currentMa;
      pointCloudMatRef.current.uniforms.uPadArea.value = padAreaCm2;
      pointCloudMatRef.current.uniforms.uAnodePos.value.set(...anodeNode.posCortical);
      pointCloudMatRef.current.uniforms.uCathodePos.value.set(...cathodeNode.posCortical);
    }
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
      <ambientLight intensity={0.55} />
      <directionalLight position={[3, 4, 2.5]} intensity={0.85} />
      <directionalLight position={[-3, -1.5, -2]} intensity={0.35} color="#38BDF8" />

      <OrbitControls
        enableDamping
        dampingFactor={0.06}
        minDistance={1.4}
        maxDistance={4.8}
        target={[0, 0.15, 0]}
        enabled={!draggingElectrode && activePlacementMode === null}
      />

      {/* Layer 1: Anatomical Bi-Hemispheric Cortical Mesh */}
      <mesh geometry={cortexGeometry}>
        <shaderMaterial
          ref={heatmapMatRef}
          vertexShader={CorticalHeatmapShader.vertexShader}
          fragmentShader={CorticalHeatmapShader.fragmentShader}
          uniforms={CorticalHeatmapShader.uniforms}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Layer 2: High-Tech Neural Point-Cloud */}
      {showPointCloud && (
        <group>
          <points geometry={pointCloudGeometry}>
            <shaderMaterial
              ref={pointCloudMatRef}
              vertexShader={NeuralPointCloudShader.vertexShader}
              fragmentShader={NeuralPointCloudShader.fragmentShader}
              uniforms={NeuralPointCloudShader.uniforms}
              transparent
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </points>

          <lineSegments geometry={wireframeGeometry}>
            <lineBasicMaterial
              color="#38BDF8"
              transparent
              opacity={0.09}
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
              opacity={0.06}
              depthWrite={false}
            />
          </mesh>

          <lineSegments geometry={meridianArcsGeo}>
            <lineBasicMaterial
              color="#38BDF8"
              transparent
              opacity={0.40}
              depthWrite={false}
            />
          </lineSegments>
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
              opacity={0.80}
              depthWrite={false}
            />
          </lineSegments>

          {/* Continuous 3D Holographic Head and Face Mesh */}
          <mesh geometry={facialMaskGeometry}>
            <shaderMaterial
              vertexShader={HolographicFaceShader.vertexShader}
              fragmentShader={HolographicFaceShader.fragmentShader}
              uniforms={HolographicFaceShader.uniforms}
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
              opacity={0.50}
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
            ▲ FRONT (FACE)
          </Text>
        </group>
      )}

      {/* Layer 3.5: Skull Shunt Halo (Outer Calvarium Current Mantle - BUG-04) */}
      {showShuntHalo && (
        <mesh geometry={headSilhouetteGeometry} scale={[1.028, 1.028, 1.028]}>
          <meshStandardMaterial
            color="#38BDF8"
            emissive="#00D2FF"
            emissiveIntensity={0.25 + (shuntPercentage / 100) * 0.45 * Math.min(1.5, currentMa)}
            transparent
            opacity={0.14 + (shuntPercentage / 100) * 0.12}
            roughness={0.2}
            metalness={0.7}
            depthWrite={false}
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
        {/* 1. Base Saline Sponge Pad */}
        <mesh
          geometry={curvedPadGeo}
          position={[0, 0, 0.012]}
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
          <meshStandardMaterial
            color="#E2E8F0"
            roughness={0.72}
            metalness={0.04}
          />
        </mesh>

        {/* 2. Silicone Perimeter Frame (Clinical Red) */}
        <mesh position={[0, 0, 0.022]} scale={[1.02, 1.02, 0.22]}>
          <boxGeometry args={[0.16 * padScale, 0.16 * padScale, 0.012]} />
          <meshStandardMaterial
            color="#EF4444"
            emissive="#DC2626"
            emissiveIntensity={0.65}
            roughness={0.35}
          />
        </mesh>

        {/* 3. Conductive Carbon Rubber Plate Core */}
        <mesh position={[0, 0, 0.024]} scale={[0.82, 0.82, 0.28]}>
          <boxGeometry args={[0.16 * padScale, 0.16 * padScale, 0.012]} />
          <meshStandardMaterial
            color="#1E293B"
            roughness={0.88}
            metalness={0.15}
          />
        </mesh>

        {/* 4. Center Machined Gold Snap Connector Stud */}
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

        {/* 5. Strain-Relief Boot Collar */}
        <mesh position={[0, 0, 0.044]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.012, 0.016, 0.012, 16]} />
          <meshStandardMaterial color="#334155" roughness={0.5} />
        </mesh>

        {/* 6. Clinical Status Badge */}
        <group position={[0, 0.088 * padScale + 0.032, 0.032]}>
          <mesh>
            <planeGeometry args={[0.16, 0.044]} />
            <meshBasicMaterial color="#0B132B" transparent opacity={0.90} side={THREE.DoubleSide} />
          </mesh>
          <Text
            position={[0, 0, 0.005]}
            fontSize={padLabelFontSize * 0.52}
            color="#EF4444"
            anchorX="center"
            anchorY="middle"
            fontWeight="bold"
          >
            {`+ ANODE (${anodeNode.id})`}
          </Text>
        </group>
      </group>

      {/* Anode Flexible Medical Lead Wire Cable */}
      <mesh geometry={anodeLeadWireGeo}>
        <meshStandardMaterial
          color="#EF4444"
          roughness={0.35}
          metalness={0.15}
        />
      </mesh>

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
            {/* 1. Base Saline Sponge Pad */}
            <mesh
              geometry={curvedPadGeo}
              position={[0, 0, 0.012]}
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
              <meshStandardMaterial
                color="#E2E8F0"
                roughness={0.72}
                metalness={0.04}
              />
            </mesh>

            {/* 2. Silicone Perimeter Frame (Clinical Blue) */}
            <mesh position={[0, 0, 0.022]} scale={[1.02, 1.02, 0.22]}>
              <boxGeometry args={[0.16 * padScale, 0.16 * padScale, 0.012]} />
              <meshStandardMaterial
                color="#0EA5E9"
                emissive="#0284C7"
                emissiveIntensity={0.65}
                roughness={0.35}
              />
            </mesh>

            {/* 3. Conductive Carbon Rubber Plate Core */}
            <mesh position={[0, 0, 0.024]} scale={[0.82, 0.82, 0.28]}>
              <boxGeometry args={[0.16 * padScale, 0.16 * padScale, 0.012]} />
              <meshStandardMaterial
                color="#1E293B"
                roughness={0.88}
                metalness={0.15}
              />
            </mesh>

            {/* 4. Center Machined Chrome Snap Connector Stud */}
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

            {/* 5. Strain-Relief Boot Collar */}
            <mesh position={[0, 0, 0.044]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.012, 0.016, 0.012, 16]} />
              <meshStandardMaterial color="#334155" roughness={0.5} />
            </mesh>

            {/* 6. Clinical Status Badge */}
            <group position={[0, 0.088 * padScale + 0.032, 0.032]}>
              <mesh>
                <planeGeometry args={[0.17, 0.044]} />
                <meshBasicMaterial color="#0B132B" transparent opacity={0.90} side={THREE.DoubleSide} />
              </mesh>
              <Text
                position={[0, 0, 0.005]}
                fontSize={padLabelFontSize * 0.52}
                color="#0EA5E9"
                anchorX="center"
                anchorY="middle"
                fontWeight="bold"
              >
                {`- CATHODE (${cathodeNode.id})`}
              </Text>
            </group>
          </group>

          {/* Cathode Flexible Medical Lead Wire Cable */}
          <mesh geometry={cathodeLeadWireGeo}>
            <meshStandardMaterial
              color="#0284C7"
              roughness={0.35}
              metalness={0.15}
            />
          </mesh>
        </>
      )}

      {/* Interactive 10-20 Scalp Target Nodes - High Visibility & Glowing Halo (Video Feedback #4 & #5) */}
      {Object.values(BRAIN_NODES).map((node) => {
        const isAnode = node.id === anodeId;
        const isCathode = node.id === cathodeId || (montageType === 'hd4x1' && surroundNodes?.includes(node.id));
        const isHovered = hoveredNode === node.id;
        const isExtracephalic = node.id.startsWith('EX_');

        // High visibility luminous silver-white for inactive nodes with electric cyan border
        let nodeColor = isExtracephalic ? '#94A3B8' : '#F8FAFC';
        let emissiveColor = isExtracephalic ? '#64748B' : '#38BDF8';
        let emissiveIntensity = 0.85;
        let radius = 0.034;

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
                    <span className="text-[10px] bg-cyan-950/60 px-1.5 py-0.5 rounded text-cyan-300">
                      {node.lobe}
                    </span>
                  </div>
                  <div className="text-[11px] font-semibold text-slate-100 mt-1 line-clamp-1">
                    {node.name}
                  </div>
                  <div className="text-[10px] text-amber-300 font-mono mt-0.5">
                    Brodmann: {node.brodmannAreas.join(', ')}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 line-clamp-2">
                    {node.primaryFunctions[0]}
                  </div>
                  <div className="mt-1.5 pt-1 border-t border-slate-700/60 flex items-center justify-between text-[10px] text-slate-400">
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
  isLeftDockCollapsed
}) => {
  const anodeNode = BRAIN_NODES[anodeId] || BRAIN_NODES['F3'];
  // Minimizable HUD state (Video Feedback #9 & #10)
  const [isHudMinimized, setIsHudMinimized] = useState(false);

  return (
    <div className="relative w-full h-full bg-[#070B12] overflow-hidden select-none">
      <CanvasErrorBoundary>
        <Canvas
          camera={{ position: [0.0, 0.7, 3.2], fov: 42, near: 0.1, far: 20 }}
          gl={{ antialias: true, powerPreference: 'high-performance' }}
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
              shuntPercentage={telemetry.shuntPercentage}
              showEField={showEField}
              showStreamlines={showStreamlines}
              showPointCloud={showPointCloud}
              showBrodmannLabels={showBrodmannLabels}
              activePlacementMode={activePlacementMode}
              setActivePlacementMode={setActivePlacementMode}
            />
          </Suspense>
        </Canvas>
      </CanvasErrorBoundary>

      {/* Minimizable Floating HUD: Real-Time Biophysical Telemetry (Video Feedback #9 & #10) */}
      <div className={`absolute top-4 ${isLeftDockCollapsed ? 'left-52' : 'left-4'} z-10 pointer-events-auto transition-all duration-300`}>
        {isHudMinimized ? (
          // Minimized sleek floating pill
          <button
            onClick={() => setIsHudMinimized(false)}
            className="flex items-center gap-2 bg-[#0F1623]/95 backdrop-blur-md border border-cyan-500/50 hover:border-cyan-400 rounded-full px-3.5 py-1.5 shadow-2xl text-xs font-mono text-slate-200 transition-all cursor-pointer group shadow-glow-cyan"
            title="Click to expand Cortical E-Field HUD"
          >
            <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="font-bold text-white">E-FIELD HUD:</span>
            <span className="text-amber-300 font-bold">{telemetry.peakEFieldVm} V/m</span>
            <span className="text-slate-500">|</span>
            <span className="text-cyan-300 font-bold">{telemetry.currentDensityMaCm2} mA/cm²</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition" />
          </button>
        ) : (
          // Full expanded HUD card
          <div className="bg-[#0F1623]/90 backdrop-blur-md border border-slate-800/80 rounded-xl p-3 shadow-xl text-xs w-64 select-none">
            <div className="flex items-center justify-between text-slate-400 pb-1.5 border-b border-slate-800">
              <span className="flex items-center gap-1.5 font-mono text-[11px] font-semibold text-cyan-400">
                <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                CORTICAL E-FIELD HUD
              </span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[10px] bg-slate-800/80 px-1.5 py-0.5 rounded text-slate-300">
                  60 FPS
                </span>
                <button
                  onClick={() => setIsHudMinimized(true)}
                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition"
                  title="Minimize HUD to see unobstructed brain"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2 font-mono">
              <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/50">
                <div className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400" />
                  PEAK |E| FIELD
                </div>
                <div className="text-sm font-bold text-amber-300 mt-0.5">
                  {telemetry.peakEFieldVm} <span className="text-[10px] text-slate-400 font-normal">V/m</span>
                </div>
              </div>

              <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/50">
                <div className="text-[10px] text-slate-400">CURRENT DENSITY J</div>
                <div className="text-sm font-bold text-cyan-300 mt-0.5">
                  {telemetry.currentDensityMaCm2} <span className="text-[10px] text-slate-400 font-normal">mA/cm²</span>
                </div>
              </div>

              <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/50">
                <div className="text-[10px] text-slate-400">SCALP SHUNT</div>
                <div className="text-sm font-bold text-rose-300 mt-0.5">
                  {telemetry.shuntPercentage}% <span className="text-[10px] text-slate-400 font-normal">shunted</span>
                </div>
              </div>

              <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/50">
                <div className="text-[10px] text-slate-400">MEMBRANE ΔVm</div>
                <div className="text-sm font-bold text-emerald-300 mt-0.5">
                  +{telemetry.maxMembraneShiftMv} <span className="text-[10px] text-slate-400 font-normal">mV</span>
                </div>
              </div>
            </div>

            <div className="mt-2 pt-1.5 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono">
              <span className="text-slate-400">Target Brodmann:</span>
              <span className="text-amber-300 font-bold">{anodeNode.brodmannAreas.join(', ')}</span>
            </div>
          </div>
        )}
      </div>

      {/* Legend & Navigation Helper */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#0F1623]/80 backdrop-blur border border-slate-800 rounded-full text-[10px] font-mono text-slate-400 pointer-events-none flex items-center gap-3 shadow-lg">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-500 shadow-glow-anode" />
          Anode (+ Depolarize)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-glow-cathode" />
          Cathode (– Hyperpolarize)
        </span>
        <span className="text-slate-600">|</span>
        <span>Rotate: Left Click + Drag</span>
        <span>•</span>
        <span>Zoom: Scroll</span>
      </div>
    </div>
  );
};

export default BrainViewport3D;
