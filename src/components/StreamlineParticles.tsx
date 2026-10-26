import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { BRAIN_NODES } from '../data/brain_nodes';
import { createRadialGlowTexture } from '../utils/brainGeometry';

interface StreamlineParticlesProps {
  anodeId: string;
  cathodeId: string;
  currentMa: number;
  montageType: 'sponge' | 'hd4x1';
  surroundNodes?: string[];
  visible: boolean;
  /** Live simulation clock: ramped current (mA) and playback speed multiplier. */
  simRef?: React.MutableRefObject<{ ma: number; speed: number }>;
  opacity?: number;
}

// Deterministic per-path variation so streamlines never reshuffle between renders.
const seeded = (i: number, k: number) => {
  const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

export const StreamlineParticles: React.FC<StreamlineParticlesProps> = ({
  anodeId,
  cathodeId,
  currentMa,
  montageType,
  surroundNodes,
  visible,
  simRef,
  opacity = 1
}) => {
  const pointsRef = useRef<THREE.Points>(null);
  const linesRef = useRef<THREE.LineSegments>(null);
  const glowTexture = useMemo(() => createRadialGlowTexture(), []);

  const anodeNode = BRAIN_NODES[anodeId] || BRAIN_NODES['F3'];
  const cathodeNode = BRAIN_NODES[cathodeId] || BRAIN_NODES['Fp2'];

  // Total particles and paths
  const NUM_PATHS = 32;
  const PARTICLES_PER_PATH = 16;
  const TOTAL_PARTICLES = NUM_PATHS * PARTICLES_PER_PATH;

  // Build curved trajectories between Anode and Cathode / Surround Ring
  const { paths, lineGeometry } = useMemo(() => {
    const pA = new THREE.Vector3(...anodeNode.pos3D);
    const pACortical = new THREE.Vector3(...anodeNode.posCortical);

    const generatedPaths: THREE.CatmullRomCurve3[] = [];
    const linePositions: number[] = [];

    // Determine target cathodes (single cathode or multiple surround cathodes for HD-tDCS)
    const targetCathodes: THREE.Vector3[] = [];
    if (montageType === 'hd4x1' && surroundNodes && surroundNodes.length > 0) {
      for (const sId of surroundNodes) {
        const sNode = BRAIN_NODES[sId];
        if (sNode) targetCathodes.push(new THREE.Vector3(...sNode.pos3D));
      }
    } else {
      targetCathodes.push(new THREE.Vector3(...cathodeNode.pos3D));
    }

    for (let i = 0; i < NUM_PATHS; i++) {
      const targetC = targetCathodes[i % targetCathodes.length];
      const isShunt = i < NUM_PATHS * 0.32; // 32% superficial scalp/CSF shunt

      // Create random lateral jitter along perpendicular axis
      const dir = targetC.clone().sub(pA).normalize();
      const up = new THREE.Vector3(0, 1, 0);
      const right = new THREE.Vector3().crossVectors(dir, up).normalize();
      if (right.lengthSq() < 0.001) right.set(1, 0, 0);
      const actualUp = new THREE.Vector3().crossVectors(right, dir).normalize();

      const spreadAngle = (i / NUM_PATHS) * Math.PI * 2;
      const spreadRadius = (0.05 + seeded(i, 1) * 0.08) * (isShunt ? 1.4 : 0.8);

      const lateralOffset = right.clone().multiplyScalar(Math.cos(spreadAngle) * spreadRadius)
        .add(actualUp.clone().multiplyScalar(Math.sin(spreadAngle) * spreadRadius));

      const isExtra = targetC.y < -0.8 || pA.y < -0.8;

      if (isExtra) {
        // Extracephalic pathway (head to deltoid): the deep share runs down
        // through the brainstem and neck; the shunted share hugs the skin.
        const anodeOnShoulder = pA.y < -0.8;
        const pHead = anodeOnShoulder ? targetC : pA;
        const pHeadCortical = anodeOnShoulder ? targetC.clone().multiplyScalar(0.85) : pACortical;
        const pArm = anodeOnShoulder ? pA : targetC;
        const side = Math.sign(pArm.x) || 1;
        const jitter = (seeded(i, 2) - 0.5) * 0.1;

        const points = isShunt
          ? [
              pHead.clone(),
              new THREE.Vector3(pHead.x * 0.9 + side * 0.25, -0.45, pHead.z * 0.75),
              new THREE.Vector3(side * 0.58, -1.3, -0.12 + jitter),
              new THREE.Vector3(side * 1.25, -2.0, -0.08 + jitter),
              new THREE.Vector3(pArm.x * 0.92, pArm.y + 0.18, pArm.z),
              pArm.clone()
            ]
          : [
              pHead.clone(),
              pHeadCortical.clone(),
              new THREE.Vector3(pHead.x * 0.2, -0.5, -0.12 + jitter),
              new THREE.Vector3(side * 0.12, -1.35, -0.12 + jitter),
              new THREE.Vector3(side * 0.85, -2.05, -0.05).add(lateralOffset.clone().multiplyScalar(0.6)),
              new THREE.Vector3(pArm.x * 0.88, pArm.y + 0.12, pArm.z),
              pArm.clone()
            ];
        if (anodeOnShoulder) points.reverse();
        const curve = new THREE.CatmullRomCurve3(points);
        generatedPaths.push(curve);

        const curvePts = curve.getPoints(32);
        for (let k = 0; k < curvePts.length - 1; k++) {
          linePositions.push(curvePts[k].x, curvePts[k].y, curvePts[k].z);
          linePositions.push(curvePts[k + 1].x, curvePts[k + 1].y, curvePts[k + 1].z);
        }
      } else if (isShunt) {
        // Superficial Shunt Path: Arcs across scalp surface outside calvarium
        const midPoint = pA.clone().lerp(targetC, 0.5);
        // Push outward toward scalp perimeter
        midPoint.normalize().multiplyScalar(1.04);
        midPoint.add(lateralOffset.clone().multiplyScalar(1.2));

        const cp1 = pA.clone().lerp(midPoint, 0.5).normalize().multiplyScalar(1.02);
        const cp2 = midPoint.clone().lerp(targetC, 0.5).normalize().multiplyScalar(1.02);

        const curve = new THREE.CatmullRomCurve3([pA.clone(), cp1, midPoint, cp2, targetC.clone()]);
        generatedPaths.push(curve);

        // Add line points for trajectory ghost lines
        const curvePts = curve.getPoints(24);
        for (let k = 0; k < curvePts.length - 1; k++) {
          linePositions.push(curvePts[k].x, curvePts[k].y, curvePts[k].z);
          linePositions.push(curvePts[k + 1].x, curvePts[k + 1].y, curvePts[k + 1].z);
        }
      } else {
        // Deep Intracortical Path: Dives through skull into gray/white matter
        const pCCortical = targetC.clone().multiplyScalar(0.85);
        const deepDivingDepth = 0.55 + seeded(i, 3) * 0.25;
        const midIntra = pACortical.clone().lerp(pCCortical, 0.5).multiplyScalar(deepDivingDepth);
        midIntra.add(lateralOffset);

        const curve = new THREE.CatmullRomCurve3([
          pA.clone(),
          pACortical.clone(),
          midIntra,
          pCCortical.clone(),
          targetC.clone()
        ]);
        generatedPaths.push(curve);

        const curvePts = curve.getPoints(24);
        for (let k = 0; k < curvePts.length - 1; k++) {
          linePositions.push(curvePts[k].x, curvePts[k].y, curvePts[k].z);
          linePositions.push(curvePts[k + 1].x, curvePts[k + 1].y, curvePts[k + 1].z);
        }
      }
    }

    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));

    return { paths: generatedPaths, lineGeometry: lineGeo };
  }, [anodeId, cathodeId, montageType, surroundNodes]);

  // Particles buffer setup
  const { particleGeometry, progressArray, speedArray, pathIndices } = useMemo(() => {
    const pos = new Float32Array(TOTAL_PARTICLES * 3);
    const colors = new Float32Array(TOTAL_PARTICLES * 3);
    const progress = new Float32Array(TOTAL_PARTICLES);
    const speeds = new Float32Array(TOTAL_PARTICLES);
    const indices = new Uint16Array(TOTAL_PARTICLES);

    for (let i = 0; i < TOTAL_PARTICLES; i++) {
      const pathIdx = i % paths.length;
      indices[i] = pathIdx;
      // Charges are evenly spaced along each streamline (uniform carrier density).
      const slot = Math.floor(i / paths.length);
      progress[i] = (slot + seeded(pathIdx, 4) * 0.5) / PARTICLES_PER_PATH % 1;
      // Drift velocity v = μE is constant along a streamline, so the
      // normalized progress rate is inversely proportional to arc length.
      speeds[i] = 1 / Math.max(0.4, paths[pathIdx].getLength());

      const p = paths[pathIdx].getPointAt(progress[i]);
      pos[i * 3] = p.x;
      pos[i * 3 + 1] = p.y;
      pos[i * 3 + 2] = p.z;

      // Color starts warm red/gold at Anode (t=0) and becomes cyan at Cathode (t=1)
      const t = progress[i];
      const r = THREE.MathUtils.lerp(1.0, 0.0, t);
      const g = THREE.MathUtils.lerp(0.35, 0.85, t);
      const b = THREE.MathUtils.lerp(0.2, 1.0, t);
      colors[i * 3] = r;
      colors[i * 3 + 1] = g;
      colors[i * 3 + 2] = b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    return {
      particleGeometry: geo,
      progressArray: progress,
      speedArray: speeds,
      pathIndices: indices
    };
  }, [paths, TOTAL_PARTICLES]);

  useEffect(() => () => lineGeometry.dispose(), [lineGeometry]);
  useEffect(() => () => particleGeometry.dispose(), [particleGeometry]);
  useEffect(() => () => glowTexture.dispose(), [glowTexture]);

  const scratch = useMemo(() => new THREE.Vector3(), []);

  // Frame animation loop
  useFrame((_, delta) => {
    if (!visible || !pointsRef.current) return;

    const posAttr = particleGeometry.getAttribute('position') as THREE.BufferAttribute;
    const colAttr = particleGeometry.getAttribute('color') as THREE.BufferAttribute;
    const positions = posAttr.array as Float32Array;
    const colors = colAttr.array as Float32Array;

    // Drift velocity scales linearly with the (ramped) injected current.
    const ma = simRef ? simRef.current.ma : currentMa;
    const speed = simRef ? simRef.current.speed : 1;
    const baseVelocity = 0.32 * ma * speed * Math.min(delta, 0.1);

    for (let i = 0; i < TOTAL_PARTICLES; i++) {
      const pathIdx = pathIndices[i];
      const curve = paths[pathIdx];
      if (!curve) continue;

      let p = progressArray[i] + baseVelocity * speedArray[i];
      if (p > 1.0) p -= 1.0;
      progressArray[i] = p;

      const pt = curve.getPointAt(p, scratch);
      positions[i * 3] = pt.x;
      positions[i * 3 + 1] = pt.y;
      positions[i * 3 + 2] = pt.z;

      // Smooth color transition along current streamline
      const t = p;
      colors[i * 3] = THREE.MathUtils.lerp(1.0, 0.0, t);
      colors[i * 3 + 1] = THREE.MathUtils.lerp(0.3, 0.85, t);
      colors[i * 3 + 2] = THREE.MathUtils.lerp(0.15, 1.0, t);
    }

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
  });

  if (!visible) return null;

  return (
    <group>
      {/* Ghost streamline trajectories */}
      <lineSegments ref={linesRef} geometry={lineGeometry} renderOrder={0}>
        <lineBasicMaterial
          color="#38BDF8"
          transparent
          opacity={0.16 * opacity}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>

      {/* Flowing electric charge particle nodes */}
      <points ref={pointsRef} geometry={particleGeometry} renderOrder={0}>
        <pointsMaterial
          map={glowTexture}
          size={0.038}
          sizeAttenuation
          vertexColors
          transparent
          opacity={0.95 * opacity}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
};
