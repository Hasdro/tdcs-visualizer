// Builds public/models/head-bust.bin: an anatomically proportioned head, neck
// and shoulder surface in the same frame as the 10-20 electrode model
// (1 unit ≈ 9.5 cm, +x = subject's right, +y = up, +z = face).
//
// The bust is a signed distance field (smooth unions of ellipsoids, capsules
// and cones), meshed with naive surface nets and given SDF-gradient normals.
// Output layout (little endian):
//   uint32 vertexCount, uint32 indexCount,
//   float32[3] boundsMin, float32[3] boundsMax,
//   int16[vertexCount * 3] positions (quantised to the bounds),
//   int8[vertexCount * 3]  normals,
//   int8[vertexCount]      curvature (SDF Laplacian: + ridge, − crease),
//   uint32[indexCount]     indices
//
// Run: node scripts/build-head-bust.mjs

import { writeFileSync } from 'node:fs';

/* ----------------------------------------------------------- SDF primitives */

const len2 = (x, y) => Math.sqrt(x * x + y * y);
const len3 = (x, y, z) => Math.sqrt(x * x + y * y + z * z);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

// Inigo Quilez's bound-corrected ellipsoid distance.
function ellipsoid(px, py, pz, cx, cy, cz, rx, ry, rz) {
  const x = px - cx, y = py - cy, z = pz - cz;
  const k0 = len3(x / rx, y / ry, z / rz);
  const k1 = len3(x / (rx * rx), y / (ry * ry), z / (rz * rz));
  return k1 === 0 ? -Math.min(rx, ry, rz) : (k0 * (k0 - 1)) / k1;
}

function capsule(px, py, pz, ax, ay, az, bx, by, bz, r) {
  const pax = px - ax, pay = py - ay, paz = pz - az;
  const bax = bx - ax, bay = by - ay, baz = bz - az;
  const h = clamp((pax * bax + pay * bay + paz * baz) / (bax * bax + bay * bay + baz * baz), 0, 1);
  return len3(pax - bax * h, pay - bay * h, paz - baz * h) - r;
}

// Capsule whose radius tapers linearly from ra (at a) to rb (at b).
function taperedCapsule(px, py, pz, ax, ay, az, bx, by, bz, ra, rb) {
  const pax = px - ax, pay = py - ay, paz = pz - az;
  const bax = bx - ax, bay = by - ay, baz = bz - az;
  const h = clamp((pax * bax + pay * bay + paz * baz) / (bax * bax + bay * bay + baz * baz), 0, 1);
  return len3(pax - bax * h, pay - bay * h, paz - baz * h) - (ra + (rb - ra) * h);
}

const smin = (a, b, k) => {
  const h = clamp(0.5 + (0.5 * (b - a)) / k, 0, 1);
  return b + (a - b) * h - k * h * (1 - h);
};
const smax = (a, b, k) => -smin(-a, -b, k);
const ssub = (a, b, k) => smax(a, -b, k); // a minus b

/* ------------------------------------------------------------- the bust SDF */

function head(x, y, z) {
  const ax = Math.abs(x);

  // Cranium fitted to the 10-20 sites (Cz, T7/T8, Fpz, Oz sit on it).
  let d = ellipsoid(x, y, z, 0, 0.0, 0.0, 0.885, 0.95, 1.04);
  // Slight occipital fullness and a flatter temporal side.
  d = smin(d, ellipsoid(x, y, z, 0, -0.05, -0.32, 0.78, 0.82, 0.8), 0.1);
  // The cranial vault stops above the skull base; face and neck fill below.
  d = smax(d, -(y + 0.6) - 0.02 * z, 0.22);

  // Forehead to brow: frontal bone and supraorbital ridge.
  d = smin(d, capsule(ax, y, z, 0.0, -0.04, 0.9, 0.36, -0.06, 0.84, 0.13), 0.08);

  // Mid-face (maxilla and zygomas).
  d = smin(d, ellipsoid(x, y, z, 0, -0.5, 0.43, 0.66, 0.5, 0.56), 0.16);
  d = smin(d, ellipsoid(ax, y, z, 0.5, -0.36, 0.66, 0.2, 0.13, 0.2), 0.12);

  // Lower face: mandible body, ramus, angle and chin.
  d = smin(d, ellipsoid(x, y, z, 0, -0.92, 0.42, 0.5, 0.38, 0.5), 0.18);
  d = smin(d, capsule(ax, y, z, 0.6, -0.38, -0.02, 0.56, -0.96, 0.02, 0.12), 0.14);
  d = smin(d, capsule(ax, y, z, 0.53, -1.0, 0.08, 0.16, -1.23, 0.7, 0.1), 0.12);
  d = smin(d, ellipsoid(x, y, z, 0, -1.14, 0.75, 0.22, 0.17, 0.17), 0.1);

  // Mouth: muzzle, lips and the oral fissure.
  d = smin(d, ellipsoid(x, y, z, 0, -0.78, 0.78, 0.3, 0.24, 0.26), 0.1);
  d = smin(d, ellipsoid(x, y, z, 0, -0.745, 0.985, 0.2, 0.055, 0.075), 0.05);
  d = smin(d, ellipsoid(x, y, z, 0, -0.865, 0.975, 0.175, 0.06, 0.075), 0.05);
  d = ssub(d, ellipsoid(x, y, z, 0, -0.805, 1.06, 0.19, 0.008, 0.07), 0.02);
  // Philtrum groove and labiomental fold.
  d = ssub(d, ellipsoid(x, y, z, 0, -0.67, 1.03, 0.03, 0.06, 0.03), 0.02);
  d = ssub(d, ellipsoid(x, y, z, 0, -0.97, 1.0, 0.15, 0.03, 0.05), 0.05);

  // Nose: dorsum, lobule, alae; nostrils carved underneath.
  d = smin(d, taperedCapsule(x, y, z, 0, -0.13, 0.96, 0, -0.5, 1.2, 0.045, 0.075), 0.07);
  d = smin(d, ellipsoid(x, y, z, 0, -0.53, 1.18, 0.085, 0.07, 0.08), 0.06);
  d = smin(d, ellipsoid(ax, y, z, 0.1, -0.585, 1.075, 0.07, 0.055, 0.065), 0.05);
  d = ssub(d, ellipsoid(ax, y, z, 0.055, -0.635, 1.12, 0.03, 0.016, 0.045), 0.02);

  // Orbits: carve the sockets, then set the globes and lids back in.
  d = ssub(d, ellipsoid(ax, y, z, 0.33, -0.2, 0.99, 0.19, 0.12, 0.16), 0.07);
  d = smin(d, ellipsoid(ax, y, z, 0.33, -0.21, 0.84, 0.125, 0.125, 0.125), 0.02);
  d = smin(d, ellipsoid(ax, y, z, 0.33, -0.165, 0.875, 0.16, 0.07, 0.1), 0.03);
  d = smin(d, ellipsoid(ax, y, z, 0.33, -0.255, 0.87, 0.15, 0.05, 0.09), 0.03);

  // Ears: a tilted, flattened helix with the concha hollowed out.
  {
    const cy = -0.32, cz = -0.1;
    const tilt = 0.26; // top leans back
    const ly = (y - cy) * Math.cos(tilt) + (z - cz) * Math.sin(tilt);
    const lz = -(y - cy) * Math.sin(tilt) + (z - cz) * Math.cos(tilt);
    let ear = ellipsoid(ax, ly, lz, 0.9, 0.0, 0.0, 0.05, 0.3, 0.17);
    ear = ssub(ear, ellipsoid(ax, ly, lz, 0.955, -0.04, 0.03, 0.045, 0.14, 0.09), 0.03);
    d = smin(d, ear, 0.05);
  }

  return d;
}

function body(x, y, z) {
  const ax = Math.abs(x);

  // Neck: an elliptic column leaning slightly forward, capped top and bottom.
  const nz = z + 0.16 - 0.08 * (y + 1.0);
  let neck = len2(x / 0.6, nz / 0.56) * 0.58 - 0.58;
  neck = smax(neck, y - -0.55, 0.2);
  neck = smax(neck, -(y + 2.6), 0.2);
  let d = neck;

  // Sternocleidomastoids, the larynx, and the trapezius slope to each acromion.
  d = smin(d, taperedCapsule(ax, y, z, 0.6, -0.55, -0.22, 0.12, -2.15, 0.44, 0.13, 0.1), 0.16);
  d = smin(d, ellipsoid(x, y, z, 0, -1.55, 0.42, 0.09, 0.12, 0.08), 0.08);
  d = smin(d, taperedCapsule(ax, y, z, 0.32, -1.45, -0.32, 1.25, -2.05, -0.2, 0.3, 0.3), 0.28);
  d = smin(d, taperedCapsule(ax, y, z, 1.25, -2.05, -0.2, 1.95, -2.38, -0.05, 0.3, 0.32), 0.22);

  // Shoulder caps (deltoids) and the top of each upper arm.
  d = smin(d, ellipsoid(ax, y, z, 2.12, -2.62, 0.0, 0.42, 0.55, 0.47), 0.18);
  d = smin(d, taperedCapsule(ax, y, z, 2.2, -2.7, -0.02, 2.32, -3.9, -0.04, 0.4, 0.36), 0.12);

  // Upper chest, pectorals and clavicles.
  d = smin(d, ellipsoid(x, y, z, 0, -3.35, -0.08, 1.95, 1.25, 0.86), 0.32);
  d = smin(d, ellipsoid(ax, y, z, 0.78, -2.98, 0.5, 0.78, 0.46, 0.34), 0.25);
  d = smin(d, capsule(ax, y, z, 0.16, -2.2, 0.5, 1.85, -2.34, 0.12, 0.065), 0.12);
  // Suprasternal notch.
  d = ssub(d, ellipsoid(x, y, z, 0, -2.17, 0.62, 0.11, 0.08, 0.1), 0.07);

  // Open the bust below the chest; the shader fades this edge out.
  d = smax(d, -(y + 3.8), 0.05);
  return d;
}

const bust = (x, y, z) => smin(head(x, y, z), body(x, y, z), 0.24);

/* ------------------------------------------------------- naive surface nets */

const STEP = 0.022;
const MIN = [-2.95, -3.88, -1.45];
const MAX = [2.95, 1.12, 1.55];
const NX = Math.ceil((MAX[0] - MIN[0]) / STEP) + 1;
const NY = Math.ceil((MAX[1] - MIN[1]) / STEP) + 1;
const NZ = Math.ceil((MAX[2] - MIN[2]) / STEP) + 1;

console.log(`grid ${NX}×${NY}×${NZ} = ${(NX * NY * NZ / 1e6).toFixed(1)} M samples`);
const field = new Float32Array(NX * NY * NZ);
const at = (i, j, k) => i + NX * (j + NY * k);
for (let k = 0; k < NZ; k++) {
  const z = MIN[2] + k * STEP;
  for (let j = 0; j < NY; j++) {
    const y = MIN[1] + j * STEP;
    for (let i = 0; i < NX; i++) field[at(i, j, k)] = bust(MIN[0] + i * STEP, y, z);
  }
}

// One vertex per cell that straddles the surface, at the mean edge crossing.
const cellVertex = new Int32Array((NX - 1) * (NY - 1) * (NZ - 1)).fill(-1);
const cellAt = (i, j, k) => i + (NX - 1) * (j + (NY - 1) * k);
const positions = [];
const CORNERS = [
  [0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0],
  [0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1]
];
const EDGES = [
  [0, 1], [2, 3], [4, 5], [6, 7],
  [0, 2], [1, 3], [4, 6], [5, 7],
  [0, 4], [1, 5], [2, 6], [3, 7]
];
const v = new Float32Array(8);
for (let k = 0; k < NZ - 1; k++) {
  for (let j = 0; j < NY - 1; j++) {
    for (let i = 0; i < NX - 1; i++) {
      let mask = 0;
      for (let c = 0; c < 8; c++) {
        const [di, dj, dk] = CORNERS[c];
        v[c] = field[at(i + di, j + dj, k + dk)];
        if (v[c] < 0) mask |= 1 << c;
      }
      if (mask === 0 || mask === 255) continue;
      let sx = 0, sy = 0, sz = 0, n = 0;
      for (const [a, b] of EDGES) {
        if ((v[a] < 0) === (v[b] < 0)) continue;
        const t = v[a] / (v[a] - v[b]);
        const A = CORNERS[a], B = CORNERS[b];
        sx += A[0] + (B[0] - A[0]) * t;
        sy += A[1] + (B[1] - A[1]) * t;
        sz += A[2] + (B[2] - A[2]) * t;
        n++;
      }
      cellVertex[cellAt(i, j, k)] = positions.length / 3;
      positions.push(MIN[0] + (i + sx / n) * STEP, MIN[1] + (j + sy / n) * STEP, MIN[2] + (k + sz / n) * STEP);
    }
  }
}

// One quad per grid edge that crosses the surface, wound outward.
const indices = [];
const quad = (a, b, c, d, flip) => {
  if (a < 0 || b < 0 || c < 0 || d < 0) return;
  if (flip) indices.push(a, c, b, a, d, c);
  else indices.push(a, b, c, a, c, d);
};
for (let k = 1; k < NZ - 1; k++) {
  for (let j = 1; j < NY - 1; j++) {
    for (let i = 1; i < NX - 1; i++) {
      const inside = field[at(i, j, k)] < 0;
      if (inside !== field[at(i + 1, j, k)] < 0) {
        quad(cellVertex[cellAt(i, j - 1, k - 1)], cellVertex[cellAt(i, j, k - 1)], cellVertex[cellAt(i, j, k)], cellVertex[cellAt(i, j - 1, k)], !inside);
      }
      if (inside !== field[at(i, j + 1, k)] < 0) {
        quad(cellVertex[cellAt(i - 1, j, k - 1)], cellVertex[cellAt(i - 1, j, k)], cellVertex[cellAt(i, j, k)], cellVertex[cellAt(i, j, k - 1)], !inside);
      }
      if (inside !== field[at(i, j, k + 1)] < 0) {
        quad(cellVertex[cellAt(i - 1, j - 1, k)], cellVertex[cellAt(i, j - 1, k)], cellVertex[cellAt(i, j, k)], cellVertex[cellAt(i - 1, j, k)], !inside);
      }
    }
  }
}

// Snap each vertex onto the zero set and take the analytic SDF gradient.
const vertexCount = positions.length / 3;
const normals = new Float32Array(positions.length);
const h = 0.004;
for (let p = 0; p < vertexCount; p++) {
  let x = positions[p * 3], y = positions[p * 3 + 1], z = positions[p * 3 + 2];
  let gx = 0, gy = 0, gz = 0;
  for (let iter = 0; iter < 3; iter++) {
    gx = bust(x + h, y, z) - bust(x - h, y, z);
    gy = bust(x, y + h, z) - bust(x, y - h, z);
    gz = bust(x, y, z + h) - bust(x, y, z - h);
    const gl = len3(gx, gy, gz) || 1;
    gx /= gl; gy /= gl; gz /= gl;
    const dist = bust(x, y, z);
    x -= gx * dist; y -= gy * dist; z -= gz * dist;
  }
  positions[p * 3] = x; positions[p * 3 + 1] = y; positions[p * 3 + 2] = z;
  normals[p * 3] = gx; normals[p * 3 + 1] = gy; normals[p * 3 + 2] = gz;
}

// Mean curvature from the SDF Laplacian, sampled at a feature-sized scale:
// positive on ridges (brow, nose, lips, helix), negative in creases (orbits,
// nasolabial folds, the lip line) where skin gathers shadow.
const curvature = new Float32Array(vertexCount);
const hc = 0.03;
for (let p = 0; p < vertexCount; p++) {
  const x = positions[p * 3], y = positions[p * 3 + 1], z = positions[p * 3 + 2];
  const lap =
    bust(x + hc, y, z) + bust(x - hc, y, z) + bust(x, y + hc, z) + bust(x, y - hc, z) +
    bust(x, y, z + hc) + bust(x, y, z - hc) - 6 * bust(x, y, z);
  curvature[p] = lap / (hc * hc);
}

/* ------------------------------------------------------------------ output */

const bmin = [Infinity, Infinity, Infinity];
const bmax = [-Infinity, -Infinity, -Infinity];
for (let p = 0; p < vertexCount; p++) {
  for (let c = 0; c < 3; c++) {
    bmin[c] = Math.min(bmin[c], positions[p * 3 + c]);
    bmax[c] = Math.max(bmax[c], positions[p * 3 + c]);
  }
}

const headerBytes = 8 + 24;
const posBytes = vertexCount * 6;
const nrmBytes = vertexCount * 3;
const curvBytes = vertexCount;
const pad = (4 - ((headerBytes + posBytes + nrmBytes + curvBytes) % 4)) % 4;
const buffer = Buffer.alloc(headerBytes + posBytes + nrmBytes + curvBytes + pad + indices.length * 4);
let o = 0;
buffer.writeUInt32LE(vertexCount, o); o += 4;
buffer.writeUInt32LE(indices.length, o); o += 4;
for (const value of [...bmin, ...bmax]) { buffer.writeFloatLE(value, o); o += 4; }
for (let p = 0; p < vertexCount * 3; p++) {
  const c = p % 3;
  const t = (positions[p] - bmin[c]) / (bmax[c] - bmin[c]);
  buffer.writeInt16LE(Math.round(t * 65535 - 32768), o); o += 2;
}
for (let p = 0; p < vertexCount * 3; p++) {
  buffer.writeInt8(Math.round(clamp(normals[p], -1, 1) * 127), o); o += 1;
}
// Scale so a 0.1-unit radius ridge (≈1 cm) saturates.
for (let p = 0; p < vertexCount; p++) {
  buffer.writeInt8(Math.round(clamp(curvature[p] / 20, -1, 1) * 127), o); o += 1;
}
o += pad;
for (const index of indices) { buffer.writeUInt32LE(index, o); o += 4; }

writeFileSync(new URL('../public/models/head-bust.bin', import.meta.url), buffer);
console.log(`${vertexCount} vertices, ${indices.length / 3} triangles, ${(buffer.length / 1024).toFixed(0)} KB`);
