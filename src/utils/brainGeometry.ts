import * as THREE from 'three';

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

