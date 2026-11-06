import { getParticlePolygonPoints } from '../engine/ParticleShapeRenderer';
import {
  ParticleGenerationResult,
  ParticleItem,
  ParticleShapeSettings,
  StudioConfig,
} from '../types/studio';
import { hexToRgb } from '../utils/colorUtils';

function renderEpsParticleCommand(
  p: ParticleItem,
  artH: number,
  shapeSettings: ParticleShapeSettings
): string {
  const rn = Number((p.r / 255).toFixed(3));
  const gn = Number((p.g / 255).toFixed(3));
  const bn = Number((p.b / 255).toFixed(3));
  const py = Number((artH - p.y).toFixed(2));

  if (shapeSettings.shape === 'circle') {
    return `${rn} ${gn} ${bn} rg ${p.x} ${py} ${p.radius} c`;
  }

  const pts = getParticlePolygonPoints(p, shapeSettings);
  if (pts.length === 0) {
    return `${rn} ${gn} ${bn} rg ${p.x} ${py} ${p.radius} c`;
  }

  const cmdParts: string[] = [`${rn} ${gn} ${bn} rg`, `n`, `${pts[0].x} ${(artH - pts[0].y).toFixed(2)} m`];
  for (let i = 1; i < pts.length; i++) {
    cmdParts.push(`${pts[i].x} ${(artH - pts[i].y).toFixed(2)} l`);
  }
  cmdParts.push(`cp f`);
  return cmdParts.join(' ');
}

/**
 * Generates a valid Encapsulated PostScript (EPSF-3.0) document containing genuine
 * PostScript vector drawing commands for every particle.
 */
export function generateEditableEPS(
  result: ParticleGenerationResult,
  config: StudioConfig
): string {
  const w = Math.round(result.artboardWidthPx);
  const h = Math.round(result.artboardHeightPx);
  const bg = config.background;
  const exp = config.export;
  const shape = config.shape;
  const particles = result.particles;

  const lines: string[] = [];
  lines.push(`%!PS-Adobe-3.0 EPSF-3.0`);
  lines.push(`%%Creator: ParticleForge Studio Vector Engine`);
  lines.push(`%%Title: ${exp.filename || 'particleforge-artwork'}`);
  lines.push(`%%CreationDate: ${new Date().toISOString()}`);
  lines.push(`%%BoundingBox: 0 0 ${w} ${h}`);
  lines.push(`%%HiResBoundingBox: 0.0000 0.0000 ${w}.0000 ${h}.0000`);
  lines.push(`%%LanguageLevel: 2`);
  lines.push(`%%Pages: 1`);
  lines.push(`%%EndComments`);
  lines.push(`%%BeginProlog`);
  lines.push(`/rg { setrgbcolor } bind def`);
  lines.push(`/n { newpath } bind def`);
  lines.push(`/m { moveto } bind def`);
  lines.push(`/l { lineto } bind def`);
  lines.push(`/cp { closepath } bind def`);
  lines.push(`/f { fill } bind def`);
  lines.push(`/c { newpath 0 360 arc closepath fill } bind def`);
  lines.push(`/rectfill_pf { newpath 4 2 roll moveto 1 index 0 rlineto 0 exch rlineto neg 0 rlineto closepath fill } bind def`);
  lines.push(`%%EndProlog`);
  lines.push(`%%Page: 1 1`);
  lines.push(`gsave`);

  // 1. Optional Background Rectangle (omitted when transparent background is selected)
  if (exp.includeBackground && bg.type !== 'transparent') {
    lines.push(`% --- Layer: Background ---`);
    let bgHex = '#050608';
    if (bg.type === 'solid-white') bgHex = '#FFFFFF';
    else if (bg.type === 'custom-solid') bgHex = bg.customColor;
    else if (bg.type === 'gradient') bgHex = bg.gradientEnd || '#050608';

    const rgb = hexToRgb(bgHex);
    const rn = (rgb.r / 255).toFixed(3);
    const gn = (rgb.g / 255).toFixed(3);
    const bn = (rgb.b / 255).toFixed(3);
    lines.push(`${rn} ${gn} ${bn} rg`);
    lines.push(`0 0 ${w} ${h} rectfill_pf`);
  }

  // 2. Vector Particles Grouped by Logical Type Comments
  const scatter = particles.filter((p) => p.type === 2);
  const main = particles.filter((p) => p.type === 0);
  const edge = particles.filter((p) => p.type === 1);
  const highlight = particles.filter((p) => p.type === 3);

  const sections: Array<{ label: string; items: ParticleItem[] }> = [
    { label: 'Scattered_Particles', items: scatter },
    { label: 'Main_Particles', items: main },
    { label: 'Edge_Particles', items: edge },
    { label: 'Highlight_Particles', items: highlight },
  ];

  for (const sec of sections) {
    if (sec.items.length === 0) continue;
    lines.push(`% --- Begin Group: ${sec.label} (${sec.items.length} elements) ---`);
    for (let i = 0; i < sec.items.length; i++) {
      lines.push(renderEpsParticleCommand(sec.items[i], h, shape));
    }
    lines.push(`% --- End Group: ${sec.label} ---`);
  }

  lines.push(`grestore`);
  lines.push(`showpage`);
  lines.push(`%%Trailer`);
  lines.push(`%%EOF`);

  return lines.join('\n');
}
