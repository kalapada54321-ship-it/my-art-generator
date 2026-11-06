import { getParticlePolygonPoints } from '../engine/ParticleShapeRenderer';
import {
  ParticleGenerationResult,
  ParticleItem,
  ParticleShapeSettings,
  StudioConfig,
} from '../types/studio';
import { hexToRgb } from '../utils/colorUtils';

const KAPPA = 0.55228475;

function pdfCircleStream(cx: number, cy: number, r: number): string {
  const k = Number((r * KAPPA).toFixed(2));
  const x0 = Number((cx - r).toFixed(2));
  const x1 = Number((cx + r).toFixed(2));
  const y0 = Number((cy - r).toFixed(2));
  const y1 = Number((cy + r).toFixed(2));
  const cxF = Number(cx.toFixed(2));
  const cyF = Number(cy.toFixed(2));
  const cxPlusK = Number((cx + k).toFixed(2));
  const cxMinusK = Number((cx - k).toFixed(2));
  const cyPlusK = Number((cy + k).toFixed(2));
  const cyMinusK = Number((cy - k).toFixed(2));

  return [
    `${cxF} ${y1} m`,
    `${cxPlusK} ${y1} ${x1} ${cyPlusK} ${x1} ${cyF} c`,
    `${x1} ${cyMinusK} ${cxPlusK} ${y0} ${cxF} ${y0} c`,
    `${cxMinusK} ${y0} ${x0} ${cyMinusK} ${x0} ${cyF} c`,
    `${x0} ${cyPlusK} ${cxMinusK} ${y1} ${cxF} ${y1} c`,
    `h f`,
  ].join(' ');
}

function pdfParticleCommand(
  p: ParticleItem,
  artH: number,
  shapeSettings: ParticleShapeSettings
): string {
  const rn = Number((p.r / 255).toFixed(3));
  const gn = Number((p.g / 255).toFixed(3));
  const bn = Number((p.b / 255).toFixed(3));
  const py = Number((artH - p.y).toFixed(2));

  if (shapeSettings.shape === 'circle') {
    return `${rn} ${gn} ${bn} rg ${pdfCircleStream(p.x, py, p.radius)}`;
  }

  const pts = getParticlePolygonPoints(p, shapeSettings);
  if (pts.length === 0) {
    return `${rn} ${gn} ${bn} rg ${pdfCircleStream(p.x, py, p.radius)}`;
  }

  const parts: string[] = [
    `${rn} ${gn} ${bn} rg`,
    `${pts[0].x} ${(artH - pts[0].y).toFixed(2)} m`,
  ];
  for (let i = 1; i < pts.length; i++) {
    parts.push(`${pts[i].x} ${(artH - pts[i].y).toFixed(2)} l`);
  }
  parts.push(`h f`);
  return parts.join(' ');
}

/**
 * Generates a valid, self-contained Vector PDF 1.4 file where every particle is
 * represented as a genuine editable vector path object.
 */
export function generateEditableVectorPDF(
  result: ParticleGenerationResult,
  config: StudioConfig
): string {
  const w = Math.round(result.artboardWidthPx);
  const h = Math.round(result.artboardHeightPx);
  const bg = config.background;
  const exp = config.export;
  const shape = config.shape;
  const particles = result.particles;

  const streamLines: string[] = [];
  streamLines.push(`q`);

  // 1. Optional Background
  if (exp.includeBackground && bg.type !== 'transparent') {
    let bgHex = '#050608';
    if (bg.type === 'solid-white') bgHex = '#FFFFFF';
    else if (bg.type === 'custom-solid') bgHex = bg.customColor;
    else if (bg.type === 'gradient') bgHex = bg.gradientEnd || '#050608';

    const rgb = hexToRgb(bgHex);
    const rn = (rgb.r / 255).toFixed(3);
    const gn = (rgb.g / 255).toFixed(3);
    const bn = (rgb.b / 255).toFixed(3);
    streamLines.push(`${rn} ${gn} ${bn} rg`);
    streamLines.push(`0 0 ${w} ${h} re f`);
  }

  // 2. Vector Particles
  for (let i = 0; i < particles.length; i++) {
    streamLines.push(pdfParticleCommand(particles[i], h, shape));
  }

  streamLines.push(`Q`);
  const contentStream = streamLines.join('\n');

  // Assemble PDF 1.4 objects with exact byte offsets
  const objects: string[] = [
    `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj`,
    `2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj`,
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${w} ${h}] /Contents 4 0 R /Resources << >> >>\nendobj`,
    `4 0 obj\n<< /Length ${contentStream.length} >>\nstream\n${contentStream}\nendstream\nendobj`,
  ];

  let pdf = `%PDF-1.4\n`;
  const offsets: number[] = [0];

  for (let i = 0; i < objects.length; i++) {
    offsets.push(pdf.length);
    pdf += objects[i] + `\n`;
  }

  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += `0000000000 65535 f \n`;
  for (let i = 1; i < offsets.length; i++) {
    pdf += `${offsets[i].toString().padStart(10, '0')} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  pdf += `startxref\n${xrefStart}\n%%EOF`;

  return pdf;
}
