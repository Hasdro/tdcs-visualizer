import React, { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame, useLoader } from '@react-three/fiber';

// Decodes public/models/head-bust.bin (see scripts/build-head-bust.mjs):
// quantised positions, int8 normals and uint32 indices.
function decodeBust(buffer: ArrayBuffer): THREE.BufferGeometry {
  const view = new DataView(buffer);
  const vertexCount = view.getUint32(0, true);
  const indexCount = view.getUint32(4, true);
  const min = [0, 1, 2].map((c) => view.getFloat32(8 + c * 4, true));
  const max = [0, 1, 2].map((c) => view.getFloat32(20 + c * 4, true));

  let offset = 32;
  const quantised = new Int16Array(buffer, offset, vertexCount * 3);
  offset += vertexCount * 6;
  const packedNormals = new Int8Array(buffer, offset, vertexCount * 3);
  offset += vertexCount * 3;
  const packedCurvature = new Int8Array(buffer, offset, vertexCount);
  offset += vertexCount;
  offset += (4 - (offset % 4)) % 4;
  const indices = new Uint32Array(buffer, offset, indexCount);

  const positions = new Float32Array(vertexCount * 3);
  const normals = new Float32Array(vertexCount * 3);
  for (let i = 0; i < vertexCount * 3; i++) {
    const c = i % 3;
    positions[i] = min[c] + ((quantised[i] + 32768) / 65535) * (max[c] - min[c]);
    normals[i] = packedNormals[i] / 127;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  const curvature = new Float32Array(vertexCount);
  for (let i = 0; i < vertexCount; i++) curvature[i] = packedCurvature[i] / 127;
  geometry.setAttribute('aCurvature', new THREE.BufferAttribute(curvature, 1));
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  geometry.computeBoundingSphere();
  return geometry;
}

const VERTEX = `
  attribute float aCurvature;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;
  varying float vCurvature;
  void main() {
    vCurvature = aCurvature;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorldPosition = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

// Translucent skin: only the nearest surface is shaded (a depth pre-pass runs
// first), its centre stays clear so the brain shows through, and the
// silhouette, sheen and lit side carry the anatomy.
const FRAGMENT = `
  uniform float uOpacity;
  uniform float uLight;      // 0 = dark stage, 1 = light stage
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;
  varying float vCurvature;

  void main() {
    vec3 N = normalize(vWorldNormal);
    vec3 V = normalize(cameraPosition - vWorldPosition);
    // Key light follows the viewer (upper left), so features read from any orbit.
    vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), V));
    vec3 L = normalize(V * 0.75 + vec3(0.0, 0.55, 0.0) - right * 0.45);
    vec3 F = normalize(V * 0.6 - vec3(0.0, 0.2, 0.0) + right * 0.7);

    float nv = clamp(dot(N, V), 0.0, 1.0);
    float fresnel = pow(1.0 - nv, 2.2);

    // Wrapped diffuse keeps the terminator soft, as in scattering skin.
    float key = clamp((dot(N, L) + 0.3) / 1.3, 0.0, 1.0);
    float fill = clamp(dot(N, F), 0.0, 1.0) * 0.25;
    vec3 albedo = vec3(0.96, 0.73, 0.62);
    vec3 scatter = vec3(0.9, 0.35, 0.26) * pow(1.0 - key, 2.0) * 0.22;
    vec3 diffuse = albedo * (0.18 + key * 0.85 + fill) + scatter;

    // Two lobes of skin sheen: a broad oily lobe and a tight highlight.
    vec3 H = normalize(L + V);
    float nh = clamp(dot(N, H), 0.0, 1.0);
    // Soft, skin-tinted sheen only: no white hot spots on broad surfaces.
    float spec = pow(nh, 24.0) * 0.07 + pow(nh, 90.0) * 0.08;

    vec3 rim = mix(vec3(1.0, 0.8, 0.68), vec3(0.6, 0.36, 0.3), uLight);
    vec3 color = mix(diffuse, rim, fresnel * 0.55) + albedo * spec;

    // Shading drives opacity too: faces turned from the light (eye sockets,
    // under the nose and chin) darken and thicken, so the anatomy reads
    // while the lit centre of each surface stays clear.
    float shade = 1.0 - key;
    // Creases gather shadow like a cavity map.
    float crease = smoothstep(0.05, 0.6, -vCurvature);
    float alpha = 0.17 + fresnel * 0.5 + shade * 0.2 + spec * 0.3 + crease * 0.32;
    color *= (1.0 - shade * 0.45) * (1.0 - crease * 0.55);
    // Dissolve the chest so the bust has no hard cut.
    alpha *= smoothstep(-3.8, -2.85, vWorldPosition.y);
    gl_FragColor = vec4(color, clamp(alpha, 0.0, 0.9) * uOpacity);
  }
`;

const DEPTH_ONLY = `void main() { gl_FragColor = vec4(0.0); }`;

interface HeadBustProps {
  opacity: number;
  lightStage: boolean;
}

/**
 * Head, neck and shoulders as see-through skin, sized to the 10-20 electrode
 * frame so scalp pads sit on the scalp and deltoid returns on the shoulders.
 */
export const HeadBust: React.FC<HeadBustProps> = ({ opacity, lightStage }) => {
  const buffer = useLoader(THREE.FileLoader, '/models/head-bust.bin', (loader) =>
    (loader as THREE.FileLoader).setResponseType('arraybuffer')
  ) as unknown as ArrayBuffer;
  const geometry = useMemo(() => decodeBust(buffer), [buffer]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  const uniforms = useMemo(() => ({ uOpacity: { value: opacity }, uLight: { value: 0 } }), []);
  useFrame(() => {
    uniforms.uOpacity.value = opacity;
    uniforms.uLight.value = lightStage ? 1 : 0;
  });

  // Drawn after the brain and current paths so they show through the skin.
  return (
    <group>
      <mesh geometry={geometry} renderOrder={8} raycast={() => null}>
        <shaderMaterial
          vertexShader={VERTEX}
          fragmentShader={DEPTH_ONLY}
          colorWrite={false}
          transparent
          depthWrite
          polygonOffset
          polygonOffsetFactor={1}
          polygonOffsetUnits={1}
        />
      </mesh>
      <mesh geometry={geometry} renderOrder={9} raycast={() => null}>
        <shaderMaterial
          vertexShader={VERTEX}
          fragmentShader={FRAGMENT}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          depthFunc={THREE.LessEqualDepth}
        />
      </mesh>
    </group>
  );
};

export default HeadBust;
