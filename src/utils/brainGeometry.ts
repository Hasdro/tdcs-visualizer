import * as THREE from 'three';

export interface BrainGeometryData {
  cortexGeometry: THREE.BufferGeometry;
  pointCloudGeometry: THREE.BufferGeometry;
  wireframeGeometry: THREE.BufferGeometry;
  headSilhouetteGeometry: THREE.BufferGeometry;
}

/**
 * Procedurally sculpts the human bi-hemispheric cortical mesh,
 * neural point-cloud, and synaptic wireframe lattice.
 */
export function createBiHemisphericBrainGeometry(): BrainGeometryData {
  // We construct two detailed hemispheres (Left and Right) with high resolution
  const uSegments = 80;
  const vSegments = 80;

  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const curvatures: number[] = [];
  const indices: number[] = [];

  // Helper function to displace a point based on anatomical landmarks & folding harmonics
  function sculptPoint(u: number, v: number, isRightHemisphere: boolean): {
    p: THREE.Vector3;
    norm: THREE.Vector3;
    curvature: number;
  } {
    // Spherical base mapping: theta around pole (0 to PI), phi around equator
    // For each hemisphere, phi covers 0 to PI (or slightly over for clean seam)
    const theta = v * Math.PI; // 0 (top) to PI (bottom)
    const phi = isRightHemisphere
      ? (u * Math.PI * 0.96) + 0.02 // right side
      : (u * Math.PI * 0.96) + Math.PI + 0.02; // left side

    // Base unit sphere coordinates
    let x = Math.sin(theta) * Math.sin(phi);
    let y = Math.cos(theta);
    let z = Math.sin(theta) * Math.cos(phi);

    // Ellipsoidal base scaling for cranial proportions
    // X: lateral width (~0.72)
    // Y: superior-inferior height (~0.76)
    // Z: anterior-posterior length (~0.90)
    let rx = 0.72;
    let ry = 0.76;
    let rz = 0.90;

    // 1. Anterior frontal pole tapering
    if (z > 0.25) {
      const fTaper = 1.0 - 0.18 * ((z - 0.25) / 0.65);
      rx *= fTaper;
    }

    // 2. Parietal boss expansion
    if (z < 0.15 && z > -0.55 && y > 0.0) {
      const pExpand = 1.0 + 0.10 * Math.sin(((z + 0.55) / 0.7) * Math.PI);
      rx *= pExpand;
    }

    // 3. Temporal lobe lateral & inferior bulge (T7 / T8 area)
    if (y < 0.15 && y > -0.45 && z > -0.35 && z < 0.45) {
      const tempFactor = Math.cos(((y + 0.15) / 0.3) * Math.PI * 0.5) *
                         Math.cos(((z - 0.05) / 0.4) * Math.PI * 0.5);
      rx += 0.09 * Math.max(0, tempFactor);
      ry -= 0.04 * Math.max(0, tempFactor);
    }

    // 4. Occipital pole narrowing and ventral indentation for cerebellum
    if (z < -0.40) {
      const occTaper = 1.0 - 0.12 * Math.min(1.0, (-z - 0.4) / 0.5);
      rx *= occTaper;
      if (y < -0.15) {
        // Ventral cerebellar notch
        ry *= 0.82;
        rz *= 0.92;
      }
    }

    let px = x * rx;
    let py = y * ry;
    let pz = z * rz;

    // 5. Longitudinal Fissure (deep medial groove separating hemispheres)
    // As x approaches 0 near superior / anterior-posterior midline, carve inward
    const medialDist = Math.abs(px);
    if (py > -0.30 && pz > -0.80) {
      const fissureDepth = 0.14 * Math.exp(-(medialDist * medialDist) / 0.009);
      if (isRightHemisphere) {
        px = Math.max(0.015, px - fissureDepth * 0.5);
      } else {
        px = Math.min(-0.015, px + fissureDepth * 0.5);
      }
    }

    // 6. Gyral & Sulcal multi-octave harmonic displacement
    // Computes realistic brain surface convolutions
    const h1 = Math.sin(px * 12.0) * Math.cos(py * 12.0) * Math.sin(pz * 12.0);
    const h2 = Math.sin(px * 24.0 + 1.2) * Math.sin(py * 24.0 + 0.4) * Math.cos(pz * 24.0);
    const h3 = Math.cos(px * 40.0) * Math.sin(py * 40.0 + 0.8) * Math.cos(pz * 40.0);

    const displacement = 0.038 * h1 + 0.022 * h2 + 0.012 * h3;

    // Approximate unit normal before displacement
    const baseNorm = new THREE.Vector3(px, py * 1.05, pz * 0.9).normalize();

    // Displace outward along normal
    px += baseNorm.x * displacement;
    py += baseNorm.y * displacement;
    pz += baseNorm.z * displacement;

    // Curvature metric (0 = deep sulcus, 1 = crown of gyrus)
    const curvature = THREE.MathUtils.clamp((h1 + h2 * 0.6 + 1.2) / 2.4, 0.0, 1.0);

    const p = new THREE.Vector3(px, py, pz);
    return { p, norm: baseNorm, curvature };
  }

  let indexOffset = 0;

  // Build Left and Right Hemispheres
  for (const isRight of [false, true]) {
    const startIdx = indexOffset;

    for (let j = 0; j <= vSegments; j++) {
      const v = j / vSegments;
      for (let i = 0; i <= uSegments; i++) {
        const u = i / uSegments;

        const { p, norm, curvature } = sculptPoint(u, v, isRight);

        positions.push(p.x, p.y, p.z);
        normals.push(norm.x, norm.y, norm.z);
        uvs.push(u, v);
        curvatures.push(curvature);
        indexOffset++;
      }
    }

    // Grid triangles
    for (let j = 0; j < vSegments; j++) {
      for (let i = 0; i < uSegments; i++) {
        const a = startIdx + j * (uSegments + 1) + i;
        const b = startIdx + (j + 1) * (uSegments + 1) + i;
        const c = startIdx + (j + 1) * (uSegments + 1) + (i + 1);
        const d = startIdx + j * (uSegments + 1) + (i + 1);

        if (isRight) {
          indices.push(a, b, d);
          indices.push(b, c, d);
        } else {
          indices.push(a, d, b);
          indices.push(b, d, c);
        }
      }
    }
  }

  // Construct Cortex BufferGeometry
  const cortexGeometry = new THREE.BufferGeometry();
  cortexGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  cortexGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  cortexGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  cortexGeometry.setAttribute('aCurvature', new THREE.Float32BufferAttribute(curvatures, 1));
  cortexGeometry.setIndex(indices);
  cortexGeometry.computeVertexNormals();

  // Construct Layer 2: Neural Point-Cloud & Synaptic Wireframe Lattice
  // We sample vertices that sit on gyral crowns (higher curvature)
  const ptPositions: number[] = [];
  const ptNormals: number[] = [];
  const ptPhases: number[] = [];
  const linePositions: number[] = [];

  const sampledVertices: THREE.Vector3[] = [];
  const totalVerts = positions.length / 3;
  const stride = 5; // Clean, non-overlapping spacing (~2,500 points)

  for (let i = 0; i < totalVerts; i += stride) {
    const cur = curvatures[i];
    // Slightly bias towards gyri crowns for high-tech synaptic appearance
    if (cur > 0.40) {
      const vx = positions[i * 3];
      const vy = positions[i * 3 + 1];
      const vz = positions[i * 3 + 2];

      const nx = normals[i * 3];
      const ny = normals[i * 3 + 1];
      const nz = normals[i * 3 + 2];

      // Hover 0.015 units (~2mm) above cortical surface
      const hx = vx + nx * 0.015;
      const hy = vy + ny * 0.015;
      const hz = vz + nz * 0.015;

      ptPositions.push(hx, hy, hz);
      ptNormals.push(nx, ny, nz);
      ptPhases.push(Math.random() * Math.PI * 2);

      const v = new THREE.Vector3(hx, hy, hz);
      sampledVertices.push(v);
    }
  }

  // Generate sparse synaptic lattice lines connecting nearby points
  const maxConn = 2;
  for (let i = 0; i < sampledVertices.length; i += 3) {
    const pA = sampledVertices[i];
    let connCount = 0;
    for (let j = i + 1; j < Math.min(i + 25, sampledVertices.length); j++) {
      const pB = sampledVertices[j];
      const dist = pA.distanceTo(pB);
      if (dist > 0.03 && dist < 0.11) {
        linePositions.push(pA.x, pA.y, pA.z, pB.x, pB.y, pB.z);
        connCount++;
        if (connCount >= maxConn) break;
      }
    }
  }

  const pointCloudGeometry = new THREE.BufferGeometry();
  pointCloudGeometry.setAttribute('position', new THREE.Float32BufferAttribute(ptPositions, 3));
  pointCloudGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(ptNormals, 3));
  pointCloudGeometry.setAttribute('aPhase', new THREE.Float32BufferAttribute(ptPhases, 1));

  const wireframeGeometry = new THREE.BufferGeometry();
  wireframeGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));

  // Layer 3: Smooth outer head silhouette (calvarium shell)
  const headSilhouetteGeometry = new THREE.SphereGeometry(1.0, 48, 48);
  const headPositions = headSilhouetteGeometry.attributes.position;
  for (let i = 0; i < headPositions.count; i++) {
    let hx = headPositions.getX(i);
    let hy = headPositions.getY(i);
    let hz = headPositions.getZ(i);

    // Anatomical head shape proportions
    hx *= 0.88; // slightly wider than brain
    hy *= 0.94; // crown
    hz *= 1.04; // front-to-back length

    // Chin / neck taper
    if (hy < -0.2) {
      const neckTaper = 1.0 - 0.25 * ((-hy - 0.2) / 0.8);
      hx *= neckTaper;
      hz *= neckTaper;
    }

    // Forehead / Nasion definition
    if (hz > 0.85 && hy < 0.1 && hy > -0.3) {
      hz += 0.05 * Math.sin(((hy + 0.3) / 0.4) * Math.PI);
    }

    headPositions.setXYZ(i, hx, hy, hz);
  }
  headSilhouetteGeometry.computeVertexNormals();

  return {
    cortexGeometry,
    pointCloudGeometry,
    wireframeGeometry,
    headSilhouetteGeometry
  };
}

/**
 * Creates 10-20 system meridian arc curves (e.g. Fpz-Fz-Cz-Pz-Oz sagittal midline
 * and T7-C3-Cz-C4-T8 coronal arch).
 */
export function create1020MeridianArcs(): THREE.BufferGeometry {
  const points: number[] = [];

  // Sagittal Midline Arc: Fpz -> Fz -> Cz -> Pz -> Oz
  const sagittalNodes = [
    new THREE.Vector3(0.0, 0.22, 0.98),
    new THREE.Vector3(0.0, 0.76, 0.62),
    new THREE.Vector3(0.0, 0.97, 0.0),
    new THREE.Vector3(0.0, 0.75, -0.64),
    new THREE.Vector3(0.0, 0.15, -0.98)
  ];
  const sagittalCurve = new THREE.CatmullRomCurve3(sagittalNodes);
  const sagPoints = sagittalCurve.getPoints(50);
  for (let i = 0; i < sagPoints.length - 1; i++) {
    points.push(sagPoints[i].x, sagPoints[i].y, sagPoints[i].z);
    points.push(sagPoints[i + 1].x, sagPoints[i + 1].y, sagPoints[i + 1].z);
  }

  // Coronal Central Arc: T7 -> C3 -> Cz -> C4 -> T8
  const coronalNodes = [
    new THREE.Vector3(-0.94, 0.08, 0.0),
    new THREE.Vector3(-0.62, 0.70, 0.0),
    new THREE.Vector3(0.0, 0.97, 0.0),
    new THREE.Vector3(0.62, 0.70, 0.0),
    new THREE.Vector3(0.94, 0.08, 0.0)
  ];
  const coronalCurve = new THREE.CatmullRomCurve3(coronalNodes);
  const corPoints = coronalCurve.getPoints(50);
  for (let i = 0; i < corPoints.length - 1; i++) {
    points.push(corPoints[i].x, corPoints[i].y, corPoints[i].z);
    points.push(corPoints[i + 1].x, corPoints[i + 1].y, corPoints[i + 1].z);
  }

  // Frontal Arc: F7 -> F3 -> Fz -> F4 -> F8
  const frontalNodes = [
    new THREE.Vector3(-0.76, 0.20, 0.62),
    new THREE.Vector3(-0.50, 0.62, 0.62),
    new THREE.Vector3(0.0, 0.76, 0.62),
    new THREE.Vector3(0.50, 0.62, 0.62),
    new THREE.Vector3(0.76, 0.20, 0.62)
  ];
  const frontalCurve = new THREE.CatmullRomCurve3(frontalNodes);
  const fPoints = frontalCurve.getPoints(50);
  for (let i = 0; i < fPoints.length - 1; i++) {
    points.push(fPoints[i].x, fPoints[i].y, fPoints[i].z);
    points.push(fPoints[i + 1].x, fPoints[i + 1].y, fPoints[i + 1].z);
  }

  // Parietal Arc: P7 -> P3 -> Pz -> P4 -> P8
  const parietalNodes = [
    new THREE.Vector3(-0.76, 0.04, -0.64),
    new THREE.Vector3(-0.50, 0.60, -0.64),
    new THREE.Vector3(0.0, 0.75, -0.64),
    new THREE.Vector3(0.50, 0.60, -0.64),
    new THREE.Vector3(0.76, 0.04, -0.64)
  ];
  const parietalCurve = new THREE.CatmullRomCurve3(parietalNodes);
  const pPoints = parietalCurve.getPoints(50);
  for (let i = 0; i < pPoints.length - 1; i++) {
    points.push(pPoints[i].x, pPoints[i].y, pPoints[i].z);
    points.push(pPoints[i + 1].x, pPoints[i + 1].y, pPoints[i + 1].z);
  }

  // Circumferential Headband: Fpz -> Fp1 -> F7 -> T7 -> P7 -> O1 -> Oz -> O2 -> P8 -> T8 -> F8 -> Fp2 -> Fpz
  const equatorNodes = [
    new THREE.Vector3(0.0, 0.22, 0.98),
    new THREE.Vector3(-0.33, 0.26, 0.92),
    new THREE.Vector3(-0.76, 0.20, 0.62),
    new THREE.Vector3(-0.94, 0.08, 0.0),
    new THREE.Vector3(-0.76, 0.04, -0.64),
    new THREE.Vector3(-0.31, 0.16, -0.94),
    new THREE.Vector3(0.0, 0.15, -0.98),
    new THREE.Vector3(0.31, 0.16, -0.94),
    new THREE.Vector3(0.76, 0.04, -0.64),
    new THREE.Vector3(0.94, 0.08, 0.0),
    new THREE.Vector3(0.76, 0.20, 0.62),
    new THREE.Vector3(0.33, 0.26, 0.92),
    new THREE.Vector3(0.0, 0.22, 0.98)
  ];
  const equatorCurve = new THREE.CatmullRomCurve3(equatorNodes);
  const eqPoints = equatorCurve.getPoints(80);
  for (let i = 0; i < eqPoints.length - 1; i++) {
    points.push(eqPoints[i].x, eqPoints[i].y, eqPoints[i].z);
    points.push(eqPoints[i + 1].x, eqPoints[i + 1].y, eqPoints[i + 1].z);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
  return geo;
}
