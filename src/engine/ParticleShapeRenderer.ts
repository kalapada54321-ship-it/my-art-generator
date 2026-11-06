import { ParticleItem, ParticleShapeSettings } from '../types/studio';

export interface Point2D {
  x: number;
  y: number;
}

/**
 * Computes polygon vertices in artboard coordinates for non-circle shapes
 * (or returns empty array when shape === 'circle').
 * Fully deterministic per particle using p.shapeSeed and p.rotation.
 */
export function getParticlePolygonPoints(
  p: ParticleItem,
  shapeSettings: ParticleShapeSettings
): Point2D[] {
  const shape = shapeSettings.shape;
  const r = p.radius;
  const rad = (p.rotation * Math.PI) / 180;
  const cosA = Math.cos(rad);
  const sinA = Math.sin(rad);

  const rotateAndTranslate = (lx: number, ly: number): Point2D => ({
    x: Number((p.x + lx * cosA - ly * sinA).toFixed(2)),
    y: Number((p.y + lx * sinA + ly * cosA).toFixed(2)),
  });

  if (shape === 'square') {
    const s = r * 0.88;
    return [
      rotateAndTranslate(-s, -s),
      rotateAndTranslate(s, -s),
      rotateAndTranslate(s, s),
      rotateAndTranslate(-s, s),
    ];
  }

  if (shape === 'diamond') {
    const aspect = 0.72 + ((shapeSettings.cornerSharpness || 80) / 100) * 0.35;
    const rx = r * (1.15 / aspect);
    const ry = r * 1.15;
    return [
      rotateAndTranslate(0, -ry),
      rotateAndTranslate(rx * 0.72, 0),
      rotateAndTranslate(0, ry),
      rotateAndTranslate(-rx * 0.72, 0),
    ];
  }

  if (shape === 'hexagon') {
    const pts: Point2D[] = [];
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      pts.push(rotateAndTranslate(Math.cos(a) * r, Math.sin(a) * r));
    }
    return pts;
  }

  if (shape === 'star') {
    const numPoints = Math.max(4, Math.min(8, Math.round(shapeSettings.starPoints || 5)));
    const innerRatio = Math.max(0.2, Math.min(0.8, shapeSettings.innerRadiusRatio || 0.45));
    const innerR = r * innerRatio;
    const pts: Point2D[] = [];
    const totalVerts = numPoints * 2;
    for (let i = 0; i < totalVerts; i++) {
      const a = (i * Math.PI) / numPoints - Math.PI / 2;
      const currR = i % 2 === 0 ? r * 1.15 : innerR * 1.15;
      pts.push(rotateAndTranslate(Math.cos(a) * currR, Math.sin(a) * currR));
    }
    return pts;
  }

  if (shape === 'organic') {
    // 8-vertex harmonic organic dust speck shape seeded by p.shapeSeed
    const numVerts = 8;
    const variation = ((shapeSettings.shapeVariation ?? 35) / 100) * 0.42;
    const phase = p.shapeSeed * Math.PI * 2;
    const pts: Point2D[] = [];
    for (let i = 0; i < numVerts; i++) {
      const a = (i / numVerts) * Math.PI * 2;
      const harmonic =
        Math.sin(a * 2 + phase) * 0.6 + Math.cos(a * 3 - phase * 1.7) * 0.4;
      const localR = r * (1 + harmonic * variation);
      pts.push(rotateAndTranslate(Math.cos(a) * localR, Math.sin(a) * localR));
    }
    return pts;
  }

  return [];
}

/**
 * Draws a single particle path onto an HTML5 Canvas 2D context.
 * Assumes ctx.beginPath() has been called or will be called inside.
 */
export function traceParticleCanvasPath(
  ctx: CanvasRenderingContext2D,
  p: ParticleItem,
  shapeSettings: ParticleShapeSettings
): void {
  if (shapeSettings.shape === 'circle') {
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    return;
  }

  const pts = getParticlePolygonPoints(p, shapeSettings);
  if (pts.length === 0) {
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    return;
  }

  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) {
    ctx.lineTo(pts[i].x, pts[i].y);
  }
  ctx.closePath();
}
