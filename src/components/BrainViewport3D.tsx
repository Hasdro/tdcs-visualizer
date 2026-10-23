import React, { useMemo, useRef, useState, Component, ErrorInfo, ReactNode, Suspense } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Html } from '@react-three/drei';
import {
  createBiHemisphericBrainGeometry,
  create1020MeridianArcs,
  createCurvedPadGeometry,
  createNeckAndShoulderGeometry
} from '../utils/brainGeometry';
import { BRAIN_NODES } from '../data/brain_nodes';
import { StreamlineParticles } from './StreamlineParticles';
import { BiophysicalTelemetry } from '../utils/biophysicsEngine';
import { Activity, Zap, AlertTriangle } from 'lucide-react';

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
  showEField: boolean;
  showStreamlines: boolean;
  showPointCloud: boolean;
  showBrodmannLabels: boolean;
  activePlacementMode: 'anode' | 'cathode' | null;
  setActivePlacementMode: (mode: 'anode' | 'cathode' | null) => void;
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

// Custom Cortical E-field Shader Material
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
      // Base anatomical shading: Dark charcoal navy with darker sulcal grooves
      vec3 deepSulcus = vec3(0.06, 0.09, 0.16);
      vec3 gyrusCrown = vec3(0.14, 0.20, 0.32);
      vec3 baseColor = mix(deepSulcus, gyrusCrown, vCurvature);

      // Subtle metallic Fresnel rim lighting
      vec3 viewDir = normalize(cameraPosition - vWorldPosition);
      float fresnel = pow(1.0 - max(dot(vWorldNormal, viewDir), 0.0), 2.5);
      baseColor += vec3(0.18, 0.30, 0.45) * fresnel * 0.45;

      float sigma = (uMontageType == 1) ? 0.18 : (0.24 * sqrt(max(uPadArea, 9.0) / 25.0));
      float twoSigmaSq = 2.0 * sigma * sigma;
      float dSkullSq = 0.025;

      float distAnodeSq = dot(vPosition - uAnodePos, vPosition - uAnodePos);
      float effAnodeDist = sqrt(distAnodeSq + dSkullSq);
      float weightAnode = exp(-distAnodeSq / twoSigmaSq);
      float phiA = (uCurrentMa * 0.45 * weightAnode) / effAnodeDist;

      vec3 dirA = vPosition - uAnodePos;
      float eAnodeNorm = dot(dirA / (effAnodeDist * effAnodeDist), vNormal) * phiA * 2.8;

      float phiC = 0.0;
      float eCathodeNorm = 0.0;

      if (uMontageType == 1) {
        vec3 ring[4];
        ring[0] = uSurroundPos0;
        ring[1] = uSurroundPos1;
        ring[2] = uSurroundPos2;
        ring[3] = uSurroundPos3;

        for (int i = 0; i < 4; i++) {
          float dSq = dot(vPosition - ring[i], vPosition - ring[i]);
          float effDist = sqrt(dSq + dSkullSq);
          float w = exp(-dSq / (twoSigmaSq * 0.8));
          float p = (uCurrentMa * 0.45 * 0.25 * w) / effDist;
          phiC += p;
          eCathodeNorm += dot((vPosition - ring[i]) / (effDist * effDist), vNormal) * p * 2.8;
        }
      } else {
        float distCathodeSq = dot(vPosition - uCathodePos, vPosition - uCathodePos);
        float effCathodeDist = sqrt(distCathodeSq + dSkullSq);
        float weightCathode = exp(-distCathodeSq / twoSigmaSq);
        phiC = (uCurrentMa * 0.45 * weightCathode) / effCathodeDist;
        vec3 dirC = vPosition - uCathodePos;
        eCathodeNorm = dot(dirC / (effCathodeDist * effCathodeDist), vNormal) * phiC * 2.8;
      }

      float eNormal = (eAnodeNorm - eCathodeNorm);
      float pulse = 1.0 + 0.06 * sin(uTime * 4.0 + vPosition.x * 10.0);

      vec3 finalColor = baseColor;

      if (uShowEField > 0.5) {
        if (eNormal > 0.03) {
          float t = clamp(eNormal / 0.55, 0.0, 1.0) * pulse;
          vec3 anodalHot = mix(vec3(0.95, 0.22, 0.12), vec3(1.0, 0.72, 0.15), smoothstep(0.2, 0.8, t));
          float heatFactor = smoothstep(0.03, 0.45, eNormal) * (0.6 + 0.4 * vCurvature);
          finalColor = mix(finalColor, anodalHot, heatFactor);
          finalColor += anodalHot * t * 0.15;
        } else if (eNormal < -0.03) {
          float t = clamp(abs(eNormal) / 0.55, 0.0, 1.0) * pulse;
          vec3 cathodalCool = mix(vec3(0.05, 0.35, 0.85), vec3(0.0, 0.75, 0.95), smoothstep(0.2, 0.8, t));
          float coolFactor = smoothstep(0.03, 0.45, abs(eNormal)) * (0.6 + 0.4 * vCurvature);
          finalColor = mix(finalColor, cathodalCool, coolFactor);
          finalColor += cathodalCool * t * 0.15;
        }
      }

      gl_FragColor = vec4(clamp(finalColor, 0.0, 1.0), 1.0);
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
  shuntPercentage: number;
  showEField: boolean;
  showStreamlines: boolean;
  showPointCloud: boolean;
  showBrodmannLabels: boolean;
  activePlacementMode: 'anode' | 'cathode' | null;
  setActivePlacementMode: (mode: 'anode' | 'cathode' | null) => void;
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

  const meridianArcsGeo = useMemo(() => create1020MeridianArcs(), []);
  const curvedPadGeo = useMemo(() => createCurvedPadGeometry(0.16, 0.16, 0.024, 1.0), []);
  const neckShouldersGeo = useMemo(() => createNeckAndShoulderGeometry(), []);

  const anodeNode = BRAIN_NODES[anodeId] || BRAIN_NODES['F3'];
  const cathodeNode = BRAIN_NODES[cathodeId] || BRAIN_NODES['Fp2'];

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

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 4, 2]} intensity={0.8} />
      <directionalLight position={[-3, -2, -2]} intensity={0.3} color="#38BDF8" />

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

      {/* Anode Pad (+) - Curved to conform flush to calvarium without clipping or floating (BUG-07) */}
      <group
        position={[
          anodeNode.pos3D[0] + anodeNode.normal[0] * 0.012,
          anodeNode.pos3D[1] + anodeNode.normal[1] * 0.012,
          anodeNode.pos3D[2] + anodeNode.normal[2] * 0.012
        ]}
        quaternion={anodeQuat}
      >
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
            color="#FF3333"
            emissive="#FF1111"
            emissiveIntensity={0.85}
            roughness={0.3}
          />
        </mesh>
        <Text
          position={[0, 0, 0.026]}
          fontSize={0.045}
          color="#FFFFFF"
          anchorX="center"
          anchorY="middle"
        >
          {`+ ${anodeNode.id}`}
        </Text>
      </group>

      {/* Cathode Pad (-) or HD 4x1 Rings */}
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
              <mesh position={[0, 0, 0.012]}>
                <ringGeometry args={[0.04, 0.08, 24]} />
                <meshBasicMaterial color="#00D2FF" side={THREE.DoubleSide} />
              </mesh>
              <Text
                position={[0, 0, 0.025]}
                fontSize={0.038}
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
        <group
          position={[
            cathodeNode.pos3D[0] + cathodeNode.normal[0] * 0.012,
            cathodeNode.pos3D[1] + cathodeNode.normal[1] * 0.012,
            cathodeNode.pos3D[2] + cathodeNode.normal[2] * 0.012
          ]}
          quaternion={cathodeQuat}
        >
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
              color="#00D2FF"
              emissive="#0099DD"
              emissiveIntensity={0.85}
              roughness={0.3}
            />
          </mesh>
          <Text
            position={[0, 0, 0.026]}
            fontSize={0.045}
            color="#FFFFFF"
            anchorX="center"
            anchorY="middle"
          >
            {`- ${cathodeNode.id}`}
          </Text>
        </group>
      )}

      {/* Interactive 10-20 Scalp Target Nodes */}
      {Object.values(BRAIN_NODES).map((node) => {
        const isAnode = node.id === anodeId;
        const isCathode = node.id === cathodeId || (montageType === 'hd4x1' && surroundNodes?.includes(node.id));
        const isHovered = hoveredNode === node.id;
        const isExtracephalic = node.id.startsWith('EX_');

        let nodeColor = isExtracephalic ? '#64748B' : '#475569';
        if (isAnode) nodeColor = '#FF4D4D';
        else if (isCathode) nodeColor = '#00D2FF';
        else if (isHovered) nodeColor = '#38BDF8';

        return (
          <group key={node.id} position={node.pos3D}>
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
              <sphereGeometry args={[isAnode || isCathode ? 0.035 : 0.024, 16, 16]} />
              <meshStandardMaterial
                color={nodeColor}
                emissive={nodeColor}
                emissiveIntensity={isAnode || isCathode ? 0.9 : (isHovered ? 0.7 : 0.2)}
              />
            </mesh>

            {(showBrodmannLabels || isHovered) && !isAnode && !isCathode && (
              <Text
                position={[0, 0.045, 0.02]}
                fontSize={0.032}
                color="#94A3B8"
                anchorX="center"
                anchorY="bottom"
                outlineWidth={0.003}
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
  showEField,
  showStreamlines,
  showPointCloud,
  showBrodmannLabels,
  activePlacementMode,
  setActivePlacementMode
}) => {
  const anodeNode = BRAIN_NODES[anodeId] || BRAIN_NODES['F3'];

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

      {/* Floating HUD: Real-Time Biophysical Telemetry Readout */}
      <div className="absolute top-4 left-4 pointer-events-none flex flex-col gap-2 z-10">
        <div className="bg-[#0F1623]/90 backdrop-blur-md border border-slate-800/80 rounded-xl p-3 shadow-xl text-xs w-64">
          <div className="flex items-center justify-between text-slate-400 pb-1.5 border-b border-slate-800">
            <span className="flex items-center gap-1.5 font-mono text-[11px] font-semibold text-cyan-400">
              <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              CORTICAL E-FIELD HUD
            </span>
            <span className="font-mono text-[10px] bg-slate-800/80 px-1.5 py-0.5 rounded text-slate-300">
              60 FPS
            </span>
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

          <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
            <span className="text-slate-400">Target Brodmann:</span>
            <span className="font-mono text-amber-300 font-semibold">
              {anodeNode.brodmannAreas.join(', ')}
            </span>
          </div>
        </div>
      </div>

      {/* Floating Placement Mode Indicator Banner */}
      {activePlacementMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-slate-900/95 backdrop-blur-md border border-cyan-500/80 px-4 py-2 rounded-full shadow-2xl flex items-center gap-3 animate-bounce">
          <div className={`w-3 h-3 rounded-full ${activePlacementMode === 'anode' ? 'bg-red-500 shadow-glow-anode' : 'bg-cyan-400 shadow-glow-cathode'}`} />
          <span className="text-xs font-semibold text-slate-100">
            Click any 3D node to place <span className="font-bold text-cyan-300 uppercase">{activePlacementMode}</span>
          </span>
          <button
            onClick={() => setActivePlacementMode(null)}
            className="text-[10px] font-mono text-slate-400 hover:text-slate-200 bg-slate-800 px-2 py-0.5 rounded"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Viewport Camera & Legend Helper Overlay (Bottom-Left) */}
      <div className="absolute bottom-4 left-4 z-10 flex items-center gap-3 text-[11px] font-mono text-slate-400 bg-[#0F1623]/80 backdrop-blur-sm border border-slate-800 px-3 py-1.5 rounded-lg shadow-lg">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <span>Anode (+ Depolarize)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
          <span>Cathode (– Hyperpolarize)</span>
        </div>
        <span className="text-slate-600">|</span>
        <span className="text-slate-500">Rotate: Left Click + Drag • Zoom: Scroll</span>
      </div>
    </div>
  );
};
