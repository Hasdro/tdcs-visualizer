import os, struct, json, base64, math, sys
import numpy as np

SRC = os.environ.get('BRAIN_SRC', 'brain_nih.glb')
DST = os.environ.get('BRAIN_DST', 'public/models/brain.glb')

raw = open(SRC, 'rb').read()
magic, ver, total = struct.unpack_from('<III', raw, 0)
assert magic == 0x46546C67
off = 12
chunks = []
while off < total:
    clen, ctype = struct.unpack_from('<II', raw, off); off += 8
    chunks.append((ctype, raw[off:off+clen])); off += clen
gltf = json.loads(chunks[0][1].decode('utf-8'))
bin_data = chunks[1][1]

COMP = {5120: ('b', 1), 5121: ('B', 1), 5122: ('h', 2), 5123: ('H', 2), 5125: ('I', 4), 5126: ('f', 4)}
NCOMP = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16}

def read_accessor(idx):
    acc = gltf['accessors'][idx]
    bv = gltf['bufferViews'][acc['bufferView']]
    fmt, csize = COMP[acc['componentType']]
    n = NCOMP[acc['type']]
    count = acc['count']
    start = bv.get('byteOffset', 0) + acc.get('byteOffset', 0)
    stride = bv.get('byteStride', csize * n)
    out = np.zeros((count, n), dtype=np.float64)
    for i in range(count):
        vals = struct.unpack_from('<' + fmt * n, bin_data, start + i * stride)
        out[i] = vals
    if acc.get('normalized') and fmt in ('B', 'H'):
        maxv = 255.0 if fmt == 'B' else 65535.0
        out /= maxv
    return out

# Find the scene mesh nodes and apply world matrices.
def mat_mul(a, b):
    return np.array(a).reshape(4, 4).T @ np.array(b).reshape(4, 4).T

world = {}
def walk(node_idx, parent):
    node = gltf['nodes'][node_idx]
    m = np.array(node.get('matrix', np.eye(4).T).copy(), dtype=np.float64).reshape(4, 4).T
    if 'matrix' not in node:
        m = np.eye(4)
        if 'translation' in node:
            m[:3, 3] = node['translation']
        if 'scale' in node:
            m[:3, :3] = np.diag(node['scale'])
        # no rotations in this file except the root matrix
    wm = parent @ m
    world[node_idx] = wm
    for c in node.get('children', []):
        walk(c, wm)

walk(0, np.eye(4))

all_pos = []
all_idx = []
offset = 0
for ni, node in enumerate(gltf['nodes']):
    if 'mesh' not in node:
        continue
    M = world[ni]
    R = M[:3, :3]
    t = M[:3, 3]
    for prim in gltf['meshes'][node['mesh']]['primitives']:
        pos = read_accessor(prim['attributes']['POSITION'])
        pos = pos @ R.T + t
        idx = read_accessor(prim['indices']).astype(np.int64).reshape(-1)
        all_pos.append(pos)
        all_idx.append(idx + offset)
        offset += len(pos)

pos = np.concatenate(all_pos, axis=0)
idx = np.concatenate(all_idx, axis=0)
print('raw', pos.shape, idx.shape)

# Weld duplicated seam vertices by quantized position.
q = np.round(pos, 3)
_, first, inverse = np.unique(q, axis=0, return_index=True, return_inverse=True)
pos = pos[first]
idx = inverse[idx].astype(np.int64)
print('welded', pos.shape, idx.shape)

# Orient: +z anterior, +y superior. The source model faces -z.
pos[:, [0, 2]] *= -1.0

# Normalize to a natural brain bounding box, then center.
mins, maxs = pos.min(0), pos.max(0)
size = maxs - mins
target = np.array([1.44, 1.24, 1.76])
scale = target / size
pos = (pos - (mins + maxs) / 2.0) * scale
pos[:, 1] += 0.02

# Tuck the medullary stump up beneath the cerebellum. The stem sits just
# anterior to the cerebellar mass (z ~ -0.12); compressing it vertically keeps
# the mesh closed while removing the dangling root from the silhouette.
stem_r = np.sqrt(pos[:, 0] ** 2 + (pos[:, 2] + 0.12) ** 2)
stem_w = np.clip((0.16 - stem_r) / 0.13, 0.0, 1.0) ** 2 * np.clip((-0.26 - pos[:, 1]) / 0.08, 0.0, 1.0)
pos[:, 1] = pos[:, 1] * (1.0 - 0.94 * stem_w) + (-0.31) * (0.94 * stem_w)

# Recompute smooth vertex normals from the welded topology.
tris = idx.reshape(-1, 3)
v0 = pos[tris[:, 0]]; v1 = pos[tris[:, 1]]; v2 = pos[tris[:, 2]]
face_n = np.cross(v1 - v0, v2 - v0)
normals = np.zeros_like(pos)
for k in range(3):
    np.add.at(normals, tris[:, k], face_n)
ln = np.linalg.norm(normals, axis=1)
normals[ln > 1e-12] /= ln[ln > 1e-12, None]

# Curvature: umbrella Laplacian projected on the normal. Positive = concave
# sulcus, negative = convex gyral crown.
neigh_sum = np.zeros_like(pos)
neigh_count = np.zeros(len(pos))
edge_sum = np.zeros(len(pos))
for a, b in ((0, 1), (1, 2), (2, 0)):
    ea = tris[:, a]; eb = tris[:, b]
    np.add.at(neigh_sum, ea, pos[eb] - pos[ea])
    np.add.at(neigh_sum, eb, pos[ea] - pos[eb])
    np.add.at(neigh_count, ea, 1)
    np.add.at(neigh_count, eb, 1)
    np.add.at(edge_sum, ea, np.linalg.norm(pos[eb] - pos[ea], axis=1))
    np.add.at(edge_sum, eb, np.linalg.norm(pos[eb] - pos[ea], axis=1))
mean_edge = edge_sum / np.maximum(neigh_count, 1)
lap = neigh_sum / np.maximum(neigh_count, 1)[:, None]
kappa = np.einsum('ij,ij->i', lap, normals) / np.maximum(mean_edge, 1e-9)

# smooth curvature twice over the 1-ring
for _ in range(1):
    acc = np.zeros_like(kappa); cnt = np.zeros_like(kappa)
    for a, b in ((0, 1), (1, 2), (2, 0)):
        ea = tris[:, a]; eb = tris[:, b]
        np.add.at(acc, ea, kappa[eb]); np.add.at(cnt, ea, 1)
        np.add.at(acc, eb, kappa[ea]); np.add.at(cnt, eb, 1)
    kappa = 0.45 * kappa + 0.55 * acc / np.maximum(cnt, 1)

lo, hi = np.percentile(kappa, [6, 94])
# concave (high kappa) -> low c (sulcus); convex -> high c (gyrus)
c = np.clip(1.0 - (kappa - lo) / (hi - lo), 0.0, 1.0)
c = c ** 0.85

# The cerebellar folia are much finer than the cerebral gyri; soften their
# curvature response so they read as a coherent lobed mass rather than noise.
cerebellum = (pos[:, 1] < -0.34) & (pos[:, 2] < 0.30) & (np.abs(pos[:, 0]) < 0.50)
blend = np.clip((-0.34 - pos[:, 1]) / 0.16, 0.0, 1.0)[cerebellum] * 0.55
c[cerebellum] = c[cerebellum] * (1.0 - blend) + 0.68 * blend
print('kappa pct', lo, hi, 'c mean', c.mean(), 'tri', len(tris))

# Pack: positions f32, normals f32, curvature in COLOR_0 as normalized u8 VEC4.
pos32 = pos.astype('<f4')
nrm32 = normals.astype('<f4')
col8 = np.zeros((len(pos), 4), dtype=np.uint8)
col8[:, 0] = np.round(c * 255).astype(np.uint8)
col8[:, 1] = np.round(c * 255).astype(np.uint8)
col8[:, 2] = np.round(c * 255).astype(np.uint8)
col8[:, 3] = 255
idx32 = idx.astype('<I')

def pad4(b):
    return b + b'\x00' * ((4 - len(b) % 4) % 4)

pos_b = pad4(pos32.tobytes())
nrm_b = pad4(nrm32.tobytes())
col_b = pad4(col8.tobytes())
idx_b = pad4(idx32.tobytes())

out = {
    'asset': {
        'version': '2.0',
        'generator': 'tDCS-visualizer brain preprocessing',
        'extras': {
            'title': 'Detailed Human Brain Model',
            'source': 'NIH 3D, entry 3DPX-021161',
            'license': 'CC BY 4.0',
        }
    },
    'scene': 0,
    'scenes': [{'nodes': [0]}],
    'nodes': [{'mesh': 0, 'name': 'Cerebral cortex'}],
    'meshes': [{
        'name': 'Cerebral cortex',
        'primitives': [{
            'attributes': {'POSITION': 0, 'NORMAL': 1, 'COLOR_0': 2},
            'indices': 3,
            'material': 0,
            'mode': 4,
        }]
    }],
    'materials': [{
        'name': 'Cortical tissue',
        'doubleSided': True,
        'pbrMetallicRoughness': {'baseColorFactor': [1, 1, 1, 1], 'metallicFactor': 0.0, 'roughnessFactor': 0.8}
    }],
    'accessors': [
        {'bufferView': 0, 'componentType': 5126, 'count': len(pos), 'type': 'VEC3',
         'min': pos.min(0).tolist(), 'max': pos.max(0).tolist()},
        {'bufferView': 1, 'componentType': 5126, 'count': len(pos), 'type': 'VEC3'},
        {'bufferView': 2, 'componentType': 5121, 'count': len(pos), 'type': 'VEC4', 'normalized': True},
        {'bufferView': 3, 'componentType': 5125, 'count': len(idx), 'type': 'SCALAR'},
    ],
    'bufferViews': [
        {'buffer': 0, 'byteOffset': 0, 'byteLength': len(pos_b)},
        {'buffer': 0, 'byteOffset': len(pos_b), 'byteLength': len(nrm_b)},
        {'buffer': 0, 'byteOffset': len(pos_b) + len(nrm_b), 'byteLength': len(col_b)},
        {'buffer': 0, 'byteOffset': len(pos_b) + len(nrm_b) + len(col_b), 'byteLength': len(idx_b)},
    ],
    'buffers': [{'byteLength': len(pos_b) + len(nrm_b) + len(col_b) + len(idx_b)}],
}
bin_out = pos_b + nrm_b + col_b + idx_b
js = json.dumps(out, separators=(',', ':')).encode()
js += b' ' * ((4 - len(js) % 4) % 4)
glb = struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(bin_out))
glb += struct.pack('<II', len(js), 0x4E4F534A) + js
glb += struct.pack('<II', len(bin_out), 0x004E4942) + bin_out
import os
os.makedirs(os.path.dirname(DST), exist_ok=True)
open(DST, 'wb').write(glb)
print('wrote', DST, len(glb) / 1e6, 'MB')
