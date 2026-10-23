import * as THREE from 'three';

export interface BrainGeometryData {
  cortexGeometry: THREE.BufferGeometry;
  pointCloudGeometry: THREE.BufferGeometry;
  wireframeGeometry: THREE.BufferGeometry;
  headSilhouetteGeometry: THREE.BufferGeometry;
}

export interface HumanFaceGeometryData {
  facialContoursGeometry: THREE.BufferGeometry;
  facialMaskGeometry: THREE.BufferGeometry;
}

/**
 * Procedurally sculpts the human bi-hemispheric cortical mesh,
 * neural point-cloud, and synaptic wireframe lattice with realistic
 * biological anatomical lobes, serpentine gyral folds, and deep sulcal fissures.
 */
export function createBiHemisphericBrainGeometry(): BrainGeometryData {
  // Ultra-detailed hemisphere resolution
  const uSegments = 88;
  const vSegments = 88;

  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const curvatures: number[] = [];
  const indices: number[] = [];

  // Helper function to sculpt realistic biological brain tissue
  function sculptPoint(u: number, v: number, isRightHemisphere: boolean): {
    p: THREE.Vector3;
    norm: THREE.Vector3;
    curvature: number;
  } {
    // Spherical base mapping: theta around pole (0 to PI), phi around equator
    const theta = v * Math.PI; // 0 (superior crown) to PI (inferior base)
    const phi = isRightHemisphere
      ? (u * Math.PI * 0.965) + 0.018 // right hemisphere
      : (u * Math.PI * 0.965) + Math.PI + 0.018; // left hemisphere

    // Base unit sphere coordinates
    let x = Math.sin(theta) * Math.sin(phi);
    let y = Math.cos(theta);
    let z = Math.sin(theta) * Math.cos(phi);

    // Cranial anatomical proportions (Brodmann/Talairach proportions)
    // X: lateral width (~0.73)
    // Y: superior-inferior height (~0.76)
    // Z: anterior-posterior length (~0.90)
    let rx = 0.73;
    let ry = 0.76;
    let rz = 0.90;

    // 1. Anterior frontal pole tapering (Z > 0.2)
    if (z > 0.20) {
      const fTaper = 1.0 - 0.16 * ((z - 0.20) / 0.70);
      rx *= fTaper;
    }

    // 2. Parietal boss expansion (dorsal posterior Z in [-0.5, 0.2])
    if (z < 0.20 && z > -0.55 && y > 0.0) {
      const pExpand = 1.0 + 0.08 * Math.sin(((z + 0.55) / 0.75) * Math.PI);
      rx *= pExpand;
    }

    // 3. Temporal lobe lateral & inferior bulge (T7 / T8 area)
    if (y < 0.10 && y > -0.48 && z > -0.32 && z < 0.42) {
      const tempFactor = Math.cos(((y + 0.18) / 0.32) * Math.PI * 0.5) *
                         Math.cos(((z - 0.05) / 0.38) * Math.PI * 0.5);
      rx += 0.085 * Math.max(0, tempFactor);
      ry -= 0.035 * Math.max(0, tempFactor);
    }

    // 4. Occipital pole narrowing and ventral notch for cerebellum
    if (z < -0.38) {
      const occTaper = 1.0 - 0.14 * Math.min(1.0, (-z - 0.38) / 0.52);
      rx *= occTaper;
      if (y < -0.12) {
        // Indentation for cerebellar fossa
        ry *= 0.84;
        rz *= 0.94;
      }
    }

    let px = x * rx;
    let py = y * ry;
    let pz = z * rz;

    // 5. Interhemispheric Longitudinal Fissure
    // As x approaches 0 near midline, carve deeply inward
    const medialDist = Math.abs(px);
    if (py > -0.32 && pz > -0.82) {
      const fissureDepth = 0.135 * Math.exp(-(medialDist * medialDist) / 0.0075);
      if (isRightHemisphere) {
        px = Math.max(0.016, px - fissureDepth * 0.5);
      } else {
        px = Math.min(-0.016, px + fissureDepth * 0.5);
      }
    }

    // 6. Realistic biological gyri & sulci with domain warping
    // Creates organic serpentine convolutions rather than uniform mathematical checkerboards
    const warpX = Math.sin(py * 8.5 + pz * 7.2) * 0.14;
    const warpY = Math.cos(px * 8.2 + pz * 6.8) * 0.14;
    const warpZ = Math.sin(px * 7.5 + py * 7.5) * 0.14;

    const g1 = Math.sin((px + warpX) * 14.0 + (py + warpY) * 11.5);
    const g2 = Math.cos((pz + warpZ) * 16.0 + (py - warpX) * 9.8);
    const g3 = Math.sin((px * 24.0) + Math.cos(pz * 22.0)) * 0.5;

    // Biological fold equation: rounded crowns (gyri) with deep narrow fissures (sulci)
    const rawFold = 0.58 * g1 + 0.42 * g2 + 0.22 * g3;
    // Power-law shaping creates steep narrow sulcal valleys and broad rounded gyral crowns
    const gyralProfile = Math.sign(rawFold) * Math.pow(Math.abs(rawFold), 0.82);

    // Anatomical Sylvian (Lateral) Fissure indentation
    let sylvianDepth = 0;
    if (y > -0.22 && y < 0.12 && z > -0.25 && z < 0.35 && Math.abs(x) > 0.45) {
      sylvianDepth = 0.038 * Math.cos(((y + 0.05) / 0.17) * Math.PI * 0.5) *
                             Math.cos(((z - 0.05) / 0.30) * Math.PI * 0.5);
    }

    // Anatomical Central Sulcus groove (coronal band around z ~ 0.0)
    let centralSulcusDepth = 0;
    if (Math.abs(pz - 0.02) < 0.06 && py > 0.15) {
      centralSulcusDepth = 0.025 * Math.cos(((pz - 0.02) / 0.06) * Math.PI * 0.5);
    }

    const displacement = (0.046 * gyralProfile) - sylvianDepth - centralSulcusDepth;

    // Unit normal before displacement
    const baseNorm = new THREE.Vector3(px, py * 1.05, pz * 0.92).normalize();

    px += baseNorm.x * displacement;
    py += baseNorm.y * displacement;
    pz += baseNorm.z * displacement;

    // Curvature metric: 0.0 = deep sulcus valley, 1.0 = crown of gyrus
    const curvature = THREE.MathUtils.clamp((gyralProfile + 1.1) / 2.2, 0.0, 1.0);

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

  // Layer 2: Neural Point-Cloud & Synaptic Wireframe Lattice
  const ptPositions: number[] = [];
  const ptNormals: number[] = [];
  const ptPhases: number[] = [];
  const linePositions: number[] = [];

  const sampledVertices: THREE.Vector3[] = [];
  const totalVerts = positions.length / 3;
  const stride = 5;

  for (let i = 0; i < totalVerts; i += stride) {
    const cur = curvatures[i];
    if (cur > 0.42) {
      const vx = positions[i * 3];
      const vy = positions[i * 3 + 1];
      const vz = positions[i * 3 + 2];

      const nx = normals[i * 3];
      const ny = normals[i * 3 + 1];
      const nz = normals[i * 3 + 2];

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

    hx *= 0.88;
    hy *= 0.94;
    hz *= 1.04;

    if (hy < -0.2) {
      const neckTaper = 1.0 - 0.25 * ((-hy - 0.2) / 0.8);
      hx *= neckTaper;
      hz *= neckTaper;
    }

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
 * Creates 3D Human Face Geometry:
 * - Landmark contours: nose bridge & tip, nostrils, philtrum, upper & lower lips, chin, jawline, eye orbits, brows, and ears.
 * - Translucent face surface mask: conformal facial skin surface in front of the brain/skull ($+z$).
 * This guarantees instantaneous detection of anterior (front) vs posterior (back).
 */
export function createHumanFaceGeometry(): HumanFaceGeometryData {
  const lineSegments: number[] = [];

  // Helper to add Catmull-Rom curve as line segments
  function addCurve(points: THREE.Vector3[], segments = 16) {
    const curve = new THREE.CatmullRomCurve3(points);
    const pts = curve.getPoints(segments);
    for (let i = 0; i < pts.length - 1; i++) {
      lineSegments.push(pts[i].x, pts[i].y, pts[i].z);
      lineSegments.push(pts[i + 1].x, pts[i + 1].y, pts[i + 1].z);
    }
  }

  // Helper to add closed loop
  function addClosedLoop(points: THREE.Vector3[], segments = 20) {
    const curve = new THREE.CatmullRomCurve3(points, true);
    const pts = curve.getPoints(segments);
    for (let i = 0; i < pts.length - 1; i++) {
      lineSegments.push(pts[i].x, pts[i].y, pts[i].z);
      lineSegments.push(pts[i + 1].x, pts[i + 1].y, pts[i + 1].z);
    }
  }

  // 1. Sagittal Nasal Bridge & Nose Profile (Prominent anterior feature along +z)
  addCurve([
    new THREE.Vector3(0.0, 0.24, 1.01),   // Glabella / lower forehead
    new THREE.Vector3(0.0, 0.14, 1.03),   // Nasion dip
    new THREE.Vector3(0.0, 0.04, 1.13),   // Rhinion / nasal bone
    new THREE.Vector3(0.0, -0.05, 1.22),  // Supratip break
    new THREE.Vector3(0.0, -0.10, 1.28),  // Pronasale (Nose Tip forward protrusion)
    new THREE.Vector3(0.0, -0.16, 1.20),  // Columella
    new THREE.Vector3(0.0, -0.22, 1.08),  // Subnasale
  ], 24);

  // 2. Left & Right Nostril / Alar Wings
  for (const side of [-1, 1]) {
    addCurve([
      new THREE.Vector3(0.0, -0.10, 1.28),          // Tip
      new THREE.Vector3(side * 0.06, -0.12, 1.22),  // Alar curve superior
      new THREE.Vector3(side * 0.11, -0.15, 1.14),  // Alar flare lateral
      new THREE.Vector3(side * 0.09, -0.19, 1.08),  // Alar base
      new THREE.Vector3(0.0, -0.22, 1.08),          // Subnasale
    ], 16);
  }

  // 3. Eyebrows (Supraorbital Arches)
  for (const side of [-1, 1]) {
    addCurve([
      new THREE.Vector3(side * 0.10, 0.21, 1.02),   // Medial head
      new THREE.Vector3(side * 0.28, 0.25, 0.98),   // Arch peak
      new THREE.Vector3(side * 0.46, 0.22, 0.86),   // Lateral body
      new THREE.Vector3(side * 0.58, 0.16, 0.74),   // Lateral tail
    ], 16);
  }

  // 4. Eye Orbits (Almond-shaped eyelids & pupil indicator)
  for (const side of [-1, 1]) {
    // Upper eyelid
    addCurve([
      new THREE.Vector3(side * 0.15, 0.08, 1.00),   // Inner canthus
      new THREE.Vector3(side * 0.28, 0.14, 0.97),   // Upper lid apex
      new THREE.Vector3(side * 0.44, 0.09, 0.89),   // Outer canthus
    ], 14);

    // Lower eyelid
    addCurve([
      new THREE.Vector3(side * 0.15, 0.08, 1.00),   // Inner canthus
      new THREE.Vector3(side * 0.28, 0.03, 0.96),   // Lower lid
      new THREE.Vector3(side * 0.44, 0.09, 0.89),   // Outer canthus
    ], 14);

    // Pupil / Iris circle
    const eyeCenter = new THREE.Vector3(side * 0.29, 0.085, 0.965);
    const pupilPts: THREE.Vector3[] = [];
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      pupilPts.push(new THREE.Vector3(
        eyeCenter.x + Math.cos(a) * 0.035,
        eyeCenter.y + Math.sin(a) * 0.035,
        eyeCenter.z
      ));
    }
    addClosedLoop(pupilPts, 12);
  }

  // 5. Philtrum Columns (Upper lip ridges)
  for (const side of [-1, 1]) {
    addCurve([
      new THREE.Vector3(side * 0.025, -0.22, 1.08),
      new THREE.Vector3(side * 0.035, -0.27, 1.10)
    ], 6);
  }

  // 6. Mouth & Lips
  // Upper lip vermilion (Cupid's bow)
  addCurve([
    new THREE.Vector3(-0.20, -0.32, 1.00), // Left commissure (mouth corner)
    new THREE.Vector3(-0.04, -0.27, 1.10), // Left peak
    new THREE.Vector3(0.0, -0.28, 1.09),   // Cupid's notch
    new THREE.Vector3(0.04, -0.27, 1.10),  // Right peak
    new THREE.Vector3(0.20, -0.32, 1.00),  // Right commissure
  ], 20);

  // Stomion (lip seal line)
  addCurve([
    new THREE.Vector3(-0.20, -0.32, 1.00),
    new THREE.Vector3(0.0, -0.32, 1.08),
    new THREE.Vector3(0.20, -0.32, 1.00),
  ], 14);

  // Lower lip vermilion
  addCurve([
    new THREE.Vector3(-0.20, -0.32, 1.00),
    new THREE.Vector3(0.0, -0.39, 1.06),
    new THREE.Vector3(0.20, -0.32, 1.00),
  ], 16);

  // 7. Chin (Mentum) & Labiomental Groove
  addCurve([
    new THREE.Vector3(-0.10, -0.44, 0.99),
    new THREE.Vector3(0.0, -0.44, 1.01),
    new THREE.Vector3(0.10, -0.44, 0.99),
  ], 10);

  addCurve([
    new THREE.Vector3(-0.14, -0.52, 0.98),
    new THREE.Vector3(0.0, -0.52, 1.04), // Pogonion forward projection
    new THREE.Vector3(0.14, -0.52, 0.98),
  ], 12);

  // 8. Mandibular Jawline (Connecting chin back to ears)
  for (const side of [-1, 1]) {
    addCurve([
      new THREE.Vector3(0.0, -0.56, 1.00),         // Gnathion / chin tip
      new THREE.Vector3(side * 0.18, -0.54, 0.92), // Jawline front
      new THREE.Vector3(side * 0.44, -0.50, 0.70), // Mandible body
      new THREE.Vector3(side * 0.68, -0.42, 0.32), // Mandible angle (Gonion)
      new THREE.Vector3(side * 0.76, -0.25, 0.10), // Ascending ramus to ear
    ], 20);
  }

  // 9. Cheekbones (Zygomatic Arches)
  for (const side of [-1, 1]) {
    addCurve([
      new THREE.Vector3(side * 0.42, -0.06, 0.92), // Malar anterior
      new THREE.Vector3(side * 0.62, -0.05, 0.76), // Cheek prominence
      new THREE.Vector3(side * 0.78, -0.03, 0.36), // Arch lateral
    ], 14);
  }

  // 10. Left & Right Ears (Auricles / Pinnae)
  for (const side of [-1, 1]) {
    // Outer helix rim loop
    addClosedLoop([
      new THREE.Vector3(side * 0.82, 0.15, -0.02), // Upper crus
      new THREE.Vector3(side * 0.91, 0.14, -0.12), // Superior helix
      new THREE.Vector3(side * 0.94, 0.02, -0.18), // Posterior helix curve
      new THREE.Vector3(side * 0.90, -0.12, -0.15),// Lower helix
      new THREE.Vector3(side * 0.84, -0.22, -0.08),// Lobule (earlobe)
      new THREE.Vector3(side * 0.81, -0.14, 0.02), // Tragus / incisura
      new THREE.Vector3(side * 0.81, 0.02, 0.03),  // Concha anterior
    ], 24);

    // Inner antihelix fold
    addCurve([
      new THREE.Vector3(side * 0.86, 0.09, -0.08),
      new THREE.Vector3(side * 0.88, 0.01, -0.11),
      new THREE.Vector3(side * 0.85, -0.10, -0.07),
    ], 10);
  }

  const facialContoursGeometry = new THREE.BufferGeometry();
  facialContoursGeometry.setAttribute('position', new THREE.Float32BufferAttribute(lineSegments, 3));

  // 11. Translucent Conformal Facial Mask Mesh
  // Smooth grid covering anterior face from brow down to chin and across to cheeks
  const maskCols = 24;
  const maskRows = 24;
  const maskPos: number[] = [];
  const maskIndices: number[] = [];

  for (let j = 0; j <= maskRows; j++) {
    const v = j / maskRows;
    const y = 0.28 - v * 0.88; // from brow (0.28) down to lower chin (-0.60)
    for (let i = 0; i <= maskCols; i++) {
      const u = i / maskCols;
      const angle = (u - 0.5) * Math.PI * 0.72; // horizontal sweep across face
      let x = Math.sin(angle) * 0.78;
      let z = Math.cos(angle) * 0.96;

      // Sculpt facial features into the surface
      const xAbs = Math.abs(x);

      // Nose projection
      if (y > -0.22 && y < 0.18 && xAbs < 0.16) {
        const noseProfile = Math.cos((xAbs / 0.16) * Math.PI * 0.5);
        const yNose = (y + 0.10) / 0.18;
        const noseProtrusion = Math.max(0, 0.26 * Math.exp(-yNose * yNose));
        z += noseProtrusion * noseProfile;
      }

      // Eye orbit depression
      if (y > 0.0 && y < 0.18 && xAbs > 0.14 && xAbs < 0.44) {
        const eyeFactor = Math.sin(((xAbs - 0.14) / 0.30) * Math.PI) *
                          Math.sin(((y - 0.0) / 0.18) * Math.PI);
        z -= 0.045 * eyeFactor;
      }

      // Mouth / Lips protrusion
      if (y > -0.40 && y < -0.24 && xAbs < 0.22) {
        const lipFactor = Math.cos((xAbs / 0.22) * Math.PI * 0.5) *
                          Math.sin(((y + 0.40) / 0.16) * Math.PI);
        z += 0.055 * Math.max(0, lipFactor);
      }

      // Chin projection
      if (y < -0.44 && y > -0.58 && xAbs < 0.20) {
        const chinFactor = Math.cos((xAbs / 0.20) * Math.PI * 0.5) *
                           Math.sin(((-y - 0.44) / 0.14) * Math.PI);
        z += 0.065 * Math.max(0, chinFactor);
      }

      maskPos.push(x, y, z);
    }
  }

  for (let j = 0; j < maskRows; j++) {
    for (let i = 0; i < maskCols; i++) {
      const a = j * (maskCols + 1) + i;
      const b = (j + 1) * (maskCols + 1) + i;
      const c = (j + 1) * (maskCols + 1) + (i + 1);
      const d = j * (maskCols + 1) + (i + 1);

      maskIndices.push(a, b, d);
      maskIndices.push(b, c, d);
    }
  }

  const facialMaskGeometry = new THREE.BufferGeometry();
  facialMaskGeometry.setAttribute('position', new THREE.Float32BufferAttribute(maskPos, 3));
  facialMaskGeometry.setIndex(maskIndices);
  facialMaskGeometry.computeVertexNormals();

  return {
    facialContoursGeometry,
    facialMaskGeometry
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
    new THREE.Vector3(0.0, 0.231, 1.008),
    new THREE.Vector3(0.0, 0.765, 0.604),
    new THREE.Vector3(0.0, 0.940, 0.0),
    new THREE.Vector3(0.0, 0.749, -0.628),
    new THREE.Vector3(0.0, 0.162, -1.024)
  ];
  const sagittalCurve = new THREE.CatmullRomCurve3(sagittalNodes);
  const sagPoints = sagittalCurve.getPoints(50);
  for (let i = 0; i < sagPoints.length - 1; i++) {
    points.push(sagPoints[i].x, sagPoints[i].y, sagPoints[i].z);
    points.push(sagPoints[i + 1].x, sagPoints[i + 1].y, sagPoints[i + 1].z);
  }

  // Coronal Central Arc: T7 -> C3 -> Cz -> C4 -> T8
  const coronalNodes = [
    new THREE.Vector3(-0.877, 0.076, 0.0),
    new THREE.Vector3(-0.604, 0.684, 0.0),
    new THREE.Vector3(0.0, 0.940, 0.0),
    new THREE.Vector3(0.604, 0.684, 0.0),
    new THREE.Vector3(0.877, 0.076, 0.0)
  ];
  const coronalCurve = new THREE.CatmullRomCurve3(coronalNodes);
  const corPoints = coronalCurve.getPoints(50);
  for (let i = 0; i < corPoints.length - 1; i++) {
    points.push(corPoints[i].x, corPoints[i].y, corPoints[i].z);
    points.push(corPoints[i + 1].x, corPoints[i + 1].y, corPoints[i + 1].z);
  }

  // Frontal Arc: F7 -> F3 -> Fz -> F4 -> F8
  const frontalNodes = [
    new THREE.Vector3(-0.716, 0.172, 0.573),
    new THREE.Vector3(-0.471, 0.589, 0.589),
    new THREE.Vector3(0.0, 0.765, 0.604),
    new THREE.Vector3(0.471, 0.589, 0.589),
    new THREE.Vector3(0.716, 0.172, 0.573)
  ];
  const frontalCurve = new THREE.CatmullRomCurve3(frontalNodes);
  const fPoints = frontalCurve.getPoints(50);
  for (let i = 0; i < fPoints.length - 1; i++) {
    points.push(fPoints[i].x, fPoints[i].y, fPoints[i].z);
    points.push(fPoints[i + 1].x, fPoints[i + 1].y, fPoints[i + 1].z);
  }

  // Parietal Arc: P7 -> P3 -> Pz -> P4 -> P8
  const parietalNodes = [
    new THREE.Vector3(-0.721, 0.019, -0.596),
    new THREE.Vector3(-0.472, 0.570, -0.610),
    new THREE.Vector3(0.0, 0.749, -0.628),
    new THREE.Vector3(0.472, 0.570, -0.610),
    new THREE.Vector3(0.721, 0.019, -0.596)
  ];
  const parietalCurve = new THREE.CatmullRomCurve3(parietalNodes);
  const pPoints = parietalCurve.getPoints(50);
  for (let i = 0; i < pPoints.length - 1; i++) {
    points.push(pPoints[i].x, pPoints[i].y, pPoints[i].z);
    points.push(pPoints[i + 1].x, pPoints[i + 1].y, pPoints[i + 1].z);
  }

  // Circumferential Headband: Fpz -> Fp1 -> F7 -> T7 -> P7 -> O1 -> Oz -> O2 -> P8 -> T8 -> F8 -> Fp2 -> Fpz
  const equatorNodes = [
    new THREE.Vector3(0.0, 0.231, 1.008),
    new THREE.Vector3(-0.328, 0.256, 0.922),
    new THREE.Vector3(-0.716, 0.172, 0.573),
    new THREE.Vector3(-0.877, 0.076, 0.0),
    new THREE.Vector3(-0.721, 0.019, -0.596),
    new THREE.Vector3(-0.312, 0.156, -0.957),
    new THREE.Vector3(0.0, 0.162, -1.024),
    new THREE.Vector3(0.312, 0.156, -0.957),
    new THREE.Vector3(0.721, 0.019, -0.596),
    new THREE.Vector3(0.877, 0.076, 0.0),
    new THREE.Vector3(0.716, 0.172, 0.573),
    new THREE.Vector3(0.328, 0.256, 0.922),
    new THREE.Vector3(0.0, 0.231, 1.008)
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

/**
 * Creates curved rectangular pad geometry conforming flush to the calvarium's spherical curvature.
 * Scales dynamically with the padAreaCm2 slider (BUG-07 & BUG-11).
 */
export function createCurvedPadGeometry(
  width = 0.16,
  height = 0.16,
  thickness = 0.024,
  curveRadius = 1.0
): THREE.BufferGeometry {
  const geo = new THREE.BoxGeometry(width, height, thickness, 8, 8, 1);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const rSq = x * x + y * y;
    const sagitta = rSq / (2.0 * curveRadius);
    pos.setXYZ(i, x, y, z - sagitta);
  }
  geo.computeVertexNormals();
  return geo;
}

/**
 * Creates stylized futuristic neck and shoulder wireframe anatomy for extracephalic reference nodes (BUG-06).
 */
export function createNeckAndShoulderGeometry(): THREE.BufferGeometry {
  const lines: number[] = [];

  // 1. Neck rings
  const neckLevels = [-0.35, -0.50, -0.65, -0.78];
  for (const y of neckLevels) {
    const progress = (-y - 0.35) / 0.43;
    const rx = 0.38 + progress * 0.06;
    const rz = 0.40 + progress * 0.06;
    const segments = 24;
    for (let i = 0; i < segments; i++) {
      const th1 = (i / segments) * Math.PI * 2;
      const th2 = ((i + 1) / segments) * Math.PI * 2;
      lines.push(Math.sin(th1) * rx, y, Math.cos(th1) * rz);
      lines.push(Math.sin(th2) * rx, y, Math.cos(th2) * rz);
    }
  }

  // 2. Neck vertical ribs
  for (let i = 0; i < 8; i++) {
    const th = (i / 8) * Math.PI * 2;
    for (let k = 0; k < neckLevels.length - 1; k++) {
      const y1 = neckLevels[k];
      const y2 = neckLevels[k + 1];
      const prog1 = (-y1 - 0.35) / 0.43;
      const prog2 = (-y2 - 0.35) / 0.43;
      lines.push(Math.sin(th) * (0.38 + prog1 * 0.06), y1, Math.cos(th) * (0.40 + prog1 * 0.06));
      lines.push(Math.sin(th) * (0.38 + prog2 * 0.06), y2, Math.cos(th) * (0.40 + prog2 * 0.06));
    }
  }

  // 3. Sloping shoulder / clavicle arches connecting to deltoid nodes (EX_L at -1.4, -1.2, EX_R at +1.4, -1.2)
  for (const side of [-1, 1]) {
    const shoulderCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 0.44, -0.78, 0.0),
      new THREE.Vector3(side * 0.75, -0.92, 0.05),
      new THREE.Vector3(side * 1.10, -1.08, 0.02),
      new THREE.Vector3(side * 1.40, -1.20, 0.0),
      new THREE.Vector3(side * 1.48, -1.30, 0.0)
    ]);
    const pts = shoulderCurve.getPoints(20);
    for (let i = 0; i < pts.length - 1; i++) {
      lines.push(pts[i].x, pts[i].y, pts[i].z);
      lines.push(pts[i + 1].x, pts[i + 1].y, pts[i + 1].z);
    }

    // Trapezius posterior arch
    const trapCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 0.38, -0.75, -0.22),
      new THREE.Vector3(side * 0.72, -0.96, -0.20),
      new THREE.Vector3(side * 1.25, -1.18, -0.12),
      new THREE.Vector3(side * 1.40, -1.20, 0.0)
    ]);
    const trapPts = trapCurve.getPoints(16);
    for (let i = 0; i < trapPts.length - 1; i++) {
      lines.push(trapPts[i].x, trapPts[i].y, trapPts[i].z);
      lines.push(trapPts[i + 1].x, trapPts[i + 1].y, trapPts[i + 1].z);
    }

    // Deltoid pad cradle circle
    const deltoidCenter = new THREE.Vector3(side * 1.40, -1.20, 0.0);
    const deltoidRadius = 0.14;
    for (let i = 0; i < 16; i++) {
      const a1 = (i / 16) * Math.PI * 2;
      const a2 = ((i + 1) / 16) * Math.PI * 2;
      lines.push(
        deltoidCenter.x + Math.sin(a1) * 0.05,
        deltoidCenter.y + Math.cos(a1) * deltoidRadius,
        deltoidCenter.z + Math.sin(a1) * deltoidRadius
      );
      lines.push(
        deltoidCenter.x + Math.sin(a2) * 0.05,
        deltoidCenter.y + Math.cos(a2) * deltoidRadius,
        deltoidCenter.z + Math.sin(a2) * deltoidRadius
      );
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(lines, 3));
  return geo;
}
