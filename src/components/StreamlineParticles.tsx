import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { BRAIN_NODES } from '../data/brain_nodes';

interface StreamlineParticlesProps {
  anodeId: string;
  cathodeId: string;
  currentMa: number;
  montageType: 'sponge' | 'hd4x1';
  surroundNodes?: string[];
  visible: boolean;
}

export const StreamlineParticles: React.FC<StreamlineParticlesProps> = ({
  anodeId,
  cathodeId,
  currentMa,
  montageType,
  surroundNodes,
  visible
}) => {
  const pointsRef = useRef<THREE.Points>(null);
  const linesRef = useRef<THREE.LineSegments>(null);

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
      const spreadRadius = (0.05 + Math.random() * 0.08) * (isShunt ? 1.4 : 0.8);

      const lateralOffset = right.clone().multiplyScalar(Math.cos(spreadAngle) * spreadRadius)
        .add(actualUp.clone().multiplyScalar(Math.sin(spreadAngle) * spreadRadius));

      if (isShunt) {
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
        const deepDivingDepth = 0.55 + Math.random() * 0.25;
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
      // Stagger initial progress along trajectory
      progress[i] = Math.random();
      // Speed variation
      speeds[i] = 0.8 + Math.random() * 0.5;

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

  // Frame animation loop
  useFrame((_, delta) => {
    if (!visible || !pointsRef.current) return;

    const posAttr = particleGeometry.getAttribute('position') as THREE.BufferAttribute;
    const colAttr = particleGeometry.getAttribute('color') as THREE.BufferAttribute;
    const positions = posAttr.array as Float32Array;
    const colors = colAttr.array as Float32Array;

    // Current-dependent flow velocity (faster mA = faster particle flux)
    const baseVelocity = (0.18 + currentMa * 0.12) * Math.min(delta, 0.1);

    for (let i = 0; i < TOTAL_PARTICLES; i++) {
      const pathIdx = pathIndices[i];
      const curve = paths[pathIdx];
      if (!curve) continue;

      let p = progressArray[i] + baseVelocity * speedArray[i];
      if (p > 1.0) p -= 1.0;
      progressArray[i] = p;

      const pt = curve.getPointAt(p);
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
      <lineSegments ref={linesRef} geometry={lineGeometry}>
        <lineBasicMaterial
          color="#38BDF8"
          transparent
          opacity={0.16}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>

      {/* Flowing electric charge particle nodes */}
      <points ref={pointsRef} geometry={particleGeometry}>
        <pointsMaterial
          size={0.024}
          sizeAttenuation
          vertexColors
          transparent
          opacity={0.92}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
};
