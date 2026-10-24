import * as THREE from 'three';

export interface HumanFaceGeometryData {
  facialContoursGeometry: THREE.BufferGeometry;
  facialMaskGeometry: THREE.BufferGeometry;
  orientationRingGeometry: THREE.BufferGeometry;
  fiducials: {
    nasion: [number, number, number];
    inion: [number, number, number];
    lpa: [number, number, number];
    rpa: [number, number, number];
    cz: [number, number, number];
  };
}

/**
 * Procedurally generates realistic 3D anatomical human head and face geometry:
 * - Complete, continuous 3D anatomical head & face mesh encompassing cranium, forehead,
 *   eye orbits, 3D nose bridge/tip/alar wings, lips, chin, jawline, ears, and neck.
 * - High-contrast anatomical landmark wireframe contours (brow, eyelids, mouth, ears).
 * - Calibrated fiducial landmark positions (Nasion, Inion, LPA, RPA, Cz).
 */
export function createHumanFaceGeometry(): HumanFaceGeometryData {
  const lineSegments: number[] = [];

  function addCurve(points: THREE.Vector3[], segments = 16) {
    const curve = new THREE.CatmullRomCurve3(points);
    const curvePts = curve.getPoints(segments);
    for (let i = 0; i < curvePts.length - 1; i++) {
      lineSegments.push(curvePts[i].x, curvePts[i].y, curvePts[i].z);
      lineSegments.push(curvePts[i + 1].x, curvePts[i + 1].y, curvePts[i + 1].z);
    }
  }

  function addClosedLoop(points: THREE.Vector3[], segments = 20) {
    const curve = new THREE.CatmullRomCurve3(points, true);
    const curvePts = curve.getPoints(segments);
    for (let i = 0; i < curvePts.length; i++) {
      const p1 = curvePts[i];
      const p2 = curvePts[(i + 1) % curvePts.length];
      lineSegments.push(p1.x, p1.y, p1.z);
      lineSegments.push(p2.x, p2.y, p2.z);
    }
  }

  // 1. Forehead & Eyebrow Arches
  for (const side of [-1, 1]) {
    addCurve([
      new THREE.Vector3(side * 0.08, 0.22, 1.01),
      new THREE.Vector3(side * 0.22, 0.25, 0.99),
      new THREE.Vector3(side * 0.42, 0.22, 0.92),
      new THREE.Vector3(side * 0.54, 0.16, 0.82),
    ], 16);
  }

  // 2. Glabella & Nose Ridge
  addCurve([
    new THREE.Vector3(0.0, 0.24, 1.01),
    new THREE.Vector3(0.0, 0.12, 1.02),
    new THREE.Vector3(0.0, -0.02, 1.07),
    new THREE.Vector3(0.0, -0.12, 1.14), // Pronasale (tip)
    new THREE.Vector3(0.0, -0.16, 1.08), // Columella base
  ], 20);

  // 3. Nostril Wings (Alar Bases)
  for (const side of [-1, 1]) {
    addCurve([
      new THREE.Vector3(0.0, -0.12, 1.14),
      new THREE.Vector3(side * 0.08, -0.13, 1.11),
      new THREE.Vector3(side * 0.12, -0.16, 1.06),
      new THREE.Vector3(side * 0.05, -0.17, 1.04),
      new THREE.Vector3(0.0, -0.16, 1.08)
    ], 14);
  }

  // 4. Eyes & Orbital Rims
  for (const side of [-1, 1]) {
    addClosedLoop([
      new THREE.Vector3(side * 0.16, 0.10, 0.99),
      new THREE.Vector3(side * 0.28, 0.16, 0.96),
      new THREE.Vector3(side * 0.44, 0.10, 0.89),
      new THREE.Vector3(side * 0.30, 0.02, 0.94),
    ], 20);

    // Eyelid slit
    addCurve([
      new THREE.Vector3(side * 0.16, 0.09, 0.99),
      new THREE.Vector3(side * 0.29, 0.08, 0.965),
      new THREE.Vector3(side * 0.43, 0.09, 0.89),
    ], 12);
  }

  // 5. Philtrum & Mouth Lips
  for (const side of [-1, 1]) {
    addCurve([
      new THREE.Vector3(side * 0.025, -0.18, 1.07),
      new THREE.Vector3(side * 0.035, -0.25, 1.09)
    ], 6);
  }

  // Upper Lip (Cupid's bow)
  addCurve([
    new THREE.Vector3(-0.19, -0.30, 1.00),
    new THREE.Vector3(-0.04, -0.26, 1.09),
    new THREE.Vector3(0.0, -0.27, 1.08),
    new THREE.Vector3(0.04, -0.26, 1.09),
    new THREE.Vector3(0.19, -0.30, 1.00),
  ], 18);

  // Stomion (lip seal)
  addCurve([
    new THREE.Vector3(-0.19, -0.30, 1.00),
    new THREE.Vector3(0.0, -0.30, 1.07),
    new THREE.Vector3(0.19, -0.30, 1.00),
  ], 14);

  // Lower Lip
  addCurve([
    new THREE.Vector3(-0.19, -0.30, 1.00),
    new THREE.Vector3(0.0, -0.37, 1.05),
    new THREE.Vector3(0.19, -0.30, 1.00),
  ], 16);

  // 6. Chin & Jawline
  addCurve([
    new THREE.Vector3(-0.12, -0.50, 0.99),
    new THREE.Vector3(0.0, -0.50, 1.05),
    new THREE.Vector3(0.12, -0.50, 0.99),
  ], 12);

  for (const side of [-1, 1]) {
    addCurve([
      new THREE.Vector3(0.0, -0.54, 1.01),
      new THREE.Vector3(side * 0.20, -0.52, 0.92),
      new THREE.Vector3(side * 0.46, -0.47, 0.68),
      new THREE.Vector3(side * 0.68, -0.40, 0.32),
      new THREE.Vector3(side * 0.76, -0.22, 0.08),
    ], 20);
  }

  // 7. Ears (Auricles)
  for (const side of [-1, 1]) {
    addClosedLoop([
      new THREE.Vector3(side * 0.82, 0.14, -0.02),
      new THREE.Vector3(side * 0.90, 0.13, -0.12),
      new THREE.Vector3(side * 0.93, 0.01, -0.18),
      new THREE.Vector3(side * 0.89, -0.13, -0.15),
      new THREE.Vector3(side * 0.83, -0.22, -0.08),
      new THREE.Vector3(side * 0.80, -0.13, 0.02),
      new THREE.Vector3(side * 0.80, 0.01, 0.03),
    ], 24);
  }

  const facialContoursGeometry = new THREE.BufferGeometry();
  facialContoursGeometry.setAttribute('position', new THREE.Float32BufferAttribute(lineSegments, 3));

  // 8. Continuous 3D Anatomical Anterior Human Face Mesh
  // Smooth conformal facial mask covering forehead, eyes, 3D nose, lips, chin, and jawline
  const uCols = 40;
  const vRows = 40;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let j = 0; j <= vRows; j++) {
    const v = j / vRows;
    // v = 0 (upper forehead / hairline py ~ 0.38) down to v = 1 (submental neck py ~ -0.68)
    const pyBase = 0.38 - v * 1.06;
    const rRing = Math.sqrt(Math.max(0.01, 1.0 - Math.pow(pyBase / 0.95, 2)));

    for (let i = 0; i <= uCols; i++) {
      const u = i / uCols;
      // Azimuth angle covering anterior 110 degrees (-55 deg to +55 deg)
      const phi = (u - 0.5) * Math.PI * 0.62;

      let rx = 0.84;
      let rz = 0.98;

      let px = Math.sin(phi) * rRing * rx;
      let py = pyBase;
      let pz = Math.cos(phi) * rRing * rz;

      const xAbs = Math.abs(px);

      // 1. Forehead and supraorbital brow ridge
      if (py > 0.12 && py < 0.28) {
        const browProfile = Math.cos(((py - 0.20) / 0.08) * Math.PI * 0.5);
        pz += 0.038 * Math.max(0, browProfile) * Math.max(0, 1.0 - xAbs / 0.5);
      }

      // 2. Glabella & Nasion (indentation between brows and nose bridge)
      if (py > 0.08 && py < 0.16 && xAbs < 0.12) {
        const nasionIndent = Math.cos(((py - 0.12) / 0.04) * Math.PI * 0.5) * (1.0 - xAbs / 0.12);
        pz -= 0.030 * Math.max(0, nasionIndent);
      }

      // 3. Orbital eye socket recessions
      if (py > -0.04 && py < 0.14 && xAbs > 0.12 && xAbs < 0.42) {
        const orbitFactor = Math.sin(((xAbs - 0.12) / 0.30) * Math.PI) *
                           Math.sin(((py + 0.04) / 0.18) * Math.PI);
        pz -= 0.052 * Math.max(0, orbitFactor);
      }

      // 4. Nose: Bridge, dorsum, tip (lobule), and alar wings
      if (py > -0.22 && py < 0.12 && xAbs < 0.18) {
        const noseWidth = 0.07 + 0.06 * Math.max(0, (-py - 0.02) / 0.18);
        if (xAbs < noseWidth) {
          const latProfile = Math.cos((xAbs / noseWidth) * Math.PI * 0.5);
          const tipFactor = Math.exp(-Math.pow((py + 0.12) / 0.07, 2));
          const dorsumFactor = Math.max(0, (py + 0.22) / 0.34);
          const protrusion = 0.15 * dorsumFactor + 0.09 * tipFactor;
          pz += protrusion * latProfile;
        }
      }

      // 5. Philtrum & Upper Lip (Cupid's bow)
      if (py > -0.32 && py < -0.22 && xAbs < 0.24) {
        const philtrumFactor = Math.cos((xAbs / 0.24) * Math.PI * 0.5);
        const lipHeight = Math.sin(((py + 0.32) / 0.10) * Math.PI);
        pz += 0.045 * philtrumFactor * Math.max(0, lipHeight);
        if (xAbs < 0.035) {
          pz -= 0.014 * (1.0 - xAbs / 0.035);
        }
      }

      // 6. Oral fissure (mouth slit)
      if (Math.abs(py + 0.33) < 0.03 && xAbs < 0.22) {
        pz -= 0.024 * Math.cos((xAbs / 0.22) * Math.PI * 0.5);
      }

      // 7. Lower Lip
      if (py > -0.42 && py < -0.33 && xAbs < 0.22) {
        const lipProfile = Math.cos((xAbs / 0.22) * Math.PI * 0.5) *
                          Math.sin(((py + 0.42) / 0.09) * Math.PI);
        pz += 0.040 * Math.max(0, lipProfile);
      }

      // 8. Labiomental crease (groove above chin)
      if (py > -0.47 && py < -0.41 && xAbs < 0.20) {
        pz -= 0.022 * Math.cos((xAbs / 0.20) * Math.PI * 0.5);
      }

      // 9. Chin (Mental protuberance)
      if (py < -0.44 && py > -0.62 && xAbs < 0.22) {
        const chinFactor = Math.cos((xAbs / 0.22) * Math.PI * 0.5) *
                          Math.sin(((-py - 0.44) / 0.18) * Math.PI);
        pz += 0.070 * Math.max(0, chinFactor);
      }

      // 10. Cheekbones (Zygomatic prominence)
      if (py > -0.18 && py < 0.08 && xAbs > 0.32 && xAbs < 0.68) {
        const cheekFactor = Math.sin(((xAbs - 0.32) / 0.36) * Math.PI) *
                           Math.sin(((py + 0.18) / 0.26) * Math.PI);
        px += Math.sign(px) * 0.045 * cheekFactor;
        pz += 0.038 * cheekFactor;
      }

      positions.push(px, py, pz);
      uvs.push(u, v);
    }
  }

  for (let j = 0; j < vRows; j++) {
    for (let i = 0; i < uCols; i++) {
      const a = j * (uCols + 1) + i;
      const b = (j + 1) * (uCols + 1) + i;
      const c = (j + 1) * (uCols + 1) + (i + 1);
      const d = j * (uCols + 1) + (i + 1);

      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  const facialMaskGeometry = new THREE.BufferGeometry();
  facialMaskGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  facialMaskGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  facialMaskGeometry.setIndex(indices);
  facialMaskGeometry.computeVertexNormals();

  // 9. Sleek Skull Base Orientation Compass Ring
  const ringPts: number[] = [];
  const ringRadius = 1.04;
  const ringY = -0.66;
  const segments = 48;

  for (let i = 0; i < segments; i++) {
    const a1 = (i / segments) * Math.PI * 2;
    const a2 = ((i + 1) / segments) * Math.PI * 2;
    ringPts.push(Math.sin(a1) * ringRadius, ringY, Math.cos(a1) * ringRadius);
    ringPts.push(Math.sin(a2) * ringRadius, ringY, Math.cos(a2) * ringRadius);
  }

  // Anterior pointer chevron at z = +1.04
  ringPts.push(0.0, ringY, 1.04);
  ringPts.push(-0.08, ringY, 1.16);
  ringPts.push(0.0, ringY, 1.04);
  ringPts.push(0.08, ringY, 1.16);
  ringPts.push(-0.08, ringY, 1.16);
  ringPts.push(0.08, ringY, 1.16);

  const orientationRingGeometry = new THREE.BufferGeometry();
  orientationRingGeometry.setAttribute('position', new THREE.Float32BufferAttribute(ringPts, 3));

  return {
    facialContoursGeometry,
    facialMaskGeometry,
    orientationRingGeometry,
    fiducials: {
      nasion: [0.0, 0.08, 1.04],
      inion: [0.0, -0.22, -1.02],
      lpa: [-0.85, -0.12, -0.05],
      rpa: [0.85, -0.12, -0.05],
      cz: [0.0, 1.02, 0.0]
    }
  };
}

/**
 * Creates curved rectangular pad geometry conforming flush to the calvarium's spherical curvature.
 * Scales dynamically with the padAreaCm2 slider.
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
 * Creates flexible 3D medical cable geometry curving from the electrode snap connector
 * cleanly along the calvarium exterior down towards the stimulator harness.
 */
export function createLeadWireGeometry(
  startPos: [number, number, number],
  normal: [number, number, number],
  endPos: [number, number, number]
): THREE.BufferGeometry {
  const pStart = new THREE.Vector3(...startPos);
  const vNorm = new THREE.Vector3(...normal).normalize();

  // 1. Initial takeoff from snap connector
  const p0 = pStart.clone().add(vNorm.clone().multiplyScalar(0.038));
  const p1 = p0.clone().add(vNorm.clone().multiplyScalar(0.055));

  // Determine backward/tangent sweep vector along skull
  const up = new THREE.Vector3(0, 1, 0);
  let tangent = new THREE.Vector3().crossVectors(vNorm, up).normalize();
  if (tangent.lengthSq() < 0.01) tangent = new THREE.Vector3(1, 0, 0);
  // Direct tangent towards posterior (z < 0)
  if (tangent.z > 0) tangent.negate();

  const pEnd = new THREE.Vector3(...endPos);

  // Calvarium envelope radius (head surface is ~1.035, cable runs at 1.07 - 1.09)
  const p2 = p1.clone().add(tangent.clone().multiplyScalar(0.12));
  p2.normalize().multiplyScalar(1.08);

  const p3 = new THREE.Vector3().lerpVectors(p2, pEnd, 0.45);
  p3.normalize().multiplyScalar(1.07);

  const p4 = new THREE.Vector3().lerpVectors(p2, pEnd, 0.85);
  p4.normalize().multiplyScalar(1.06);

  const curve = new THREE.CatmullRomCurve3([p0, p1, p2, p3, p4, pEnd]);
  return new THREE.TubeGeometry(curve, 28, 0.007, 8, false);
}

/**
 * Creates procedural soft circular Gaussian glow texture for particle sprites
 * to eliminate pixelated square point artifacts.
 */
export function createRadialGlowTexture(): THREE.Texture {
  if (typeof document === 'undefined') {
    return new THREE.Texture();
  }
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
    grad.addColorStop(0.18, 'rgba(230, 245, 255, 0.95)');
    grad.addColorStop(0.45, 'rgba(56, 189, 248, 0.55)');
    grad.addColorStop(0.80, 'rgba(14, 165, 233, 0.15)');
    grad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/**
 * Creates stylized neck and shoulder wireframe anatomy for extracephalic reference nodes.
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

  // 3. Sloping shoulder / clavicle arches connecting to deltoid nodes
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
