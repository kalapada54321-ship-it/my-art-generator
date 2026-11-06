import { SourceImageMetadata } from '../types/studio';

export interface SampleSubjectSpec {
  id: string;
  name: string;
  subtitle: string;
  category: string;
}

export const SAMPLE_SUBJECTS: SampleSubjectSpec[] = [
  {
    id: 'phoenix',
    name: 'Imperial Phoenix',
    subtitle: 'Intricate wings & radiant plumage',
    category: 'Emblem',
  },
  {
    id: 'lotus',
    name: 'Sacred Lotus',
    subtitle: 'Botanical petals & soft tonal gradients',
    category: 'Botanical',
  },
  {
    id: 'lion',
    name: 'Celestial Lion',
    subtitle: 'Sculpted mane & geometric symmetry',
    category: 'Heraldic',
  },
  {
    id: 'butterfly',
    name: 'Iridescent Monarch',
    subtitle: 'Multi-hue filigree wing venation',
    category: 'Nature',
  },
  {
    id: 'astrolabe',
    name: 'Astrolabe Chronometer',
    subtitle: 'Precision celestial rings & gears',
    category: 'Mechanical',
  },
  {
    id: 'bust',
    name: 'Apollo Chiaroscuro',
    subtitle: 'Classical sculptural shadow falloff',
    category: 'Portrait',
  },
];

/**
 * Generates an actual 720x720 PNG dataUrl and metadata for a studio sample subject.
 */
export function generateSampleImage(sampleId = 'phoenix'): SourceImageMetadata {
  const size = 720;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return {
      name: `${sampleId}-sample.png`,
      width: size,
      height: size,
      fileSize: 84200,
      mimeType: 'image/png',
      dataUrl: '',
      isSample: true,
      sampleId,
    };
  }

  // Deep dark background
  ctx.fillStyle = '#040507';
  ctx.fillRect(0, 0, size, size);

  const cx = size / 2;
  const cy = size / 2;

  if (sampleId === 'phoenix') {
    drawPhoenix(ctx, cx, cy, size);
  } else if (sampleId === 'lotus') {
    drawLotus(ctx, cx, cy, size);
  } else if (sampleId === 'lion') {
    drawLion(ctx, cx, cy, size);
  } else if (sampleId === 'butterfly') {
    drawButterfly(ctx, cx, cy, size);
  } else if (sampleId === 'astrolabe') {
    drawAstrolabe(ctx, cx, cy, size);
  } else {
    drawSculptedSphereBust(ctx, cx, cy, size);
  }

  const dataUrl = canvas.toDataURL('image/png');
  const approxBytes = Math.round((dataUrl.length * 3) / 4);
  const spec = SAMPLE_SUBJECTS.find((s) => s.id === sampleId) || SAMPLE_SUBJECTS[0];

  return {
    name: `${spec.name.toLowerCase().replace(/\s+/g, '-')}.png`,
    width: size,
    height: size,
    fileSize: approxBytes,
    mimeType: 'image/png',
    dataUrl,
    isSample: true,
    sampleId,
  };
}

function drawPhoenix(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
  ctx.save();
  // Subtle ambient halo
  const halo = ctx.createRadialGradient(cx, cy - 20, 15, cx, cy, size * 0.44);
  halo.addColorStop(0, 'rgba(255, 215, 110, 0.28)');
  halo.addColorStop(0.5, 'rgba(245, 158, 11, 0.08)');
  halo.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.44, 0, Math.PI * 2);
  ctx.fill();

  // Symmetric wings with layered glowing feathers
  for (const dir of [-1, 1]) {
    ctx.save();
    ctx.translate(cx, cy - 10);
    ctx.scale(dir, 1);

    // Primary and secondary wing feathers
    for (let i = 0; i < 16; i++) {
      const t = i / 15;
      const angle = -0.75 + t * 1.38;
      const length = 265 - Math.abs(t - 0.32) * 145;
      const width = 22 - t * 9;

      ctx.save();
      ctx.rotate(angle);

      const grad = ctx.createLinearGradient(25, 0, length, 0);
      grad.addColorStop(0, 'rgba(254, 243, 199, 0.95)');
      grad.addColorStop(0.55, 'rgba(245, 158, 11, 0.85)');
      grad.addColorStop(0.88, 'rgba(217, 119, 6, 0.45)');
      grad.addColorStop(1, 'rgba(120, 53, 15, 0.0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(22, 0);
      ctx.quadraticCurveTo(length * 0.55, -width * 1.35, length, -width * 0.15);
      ctx.quadraticCurveTo(length * 0.6, width * 0.9, 22, width * 0.35);
      ctx.closePath();
      ctx.fill();

      // Crisp bright feather rachis (spine) for edge detection detail
      ctx.strokeStyle = `rgba(255, 251, 235, ${0.9 - t * 0.45})`;
      ctx.lineWidth = 2.1 - t * 0.8;
      ctx.beginPath();
      ctx.moveTo(24, 0);
      ctx.quadraticCurveTo(length * 0.56, -width * 0.35, length * 0.96, -width * 0.1);
      ctx.stroke();

      ctx.restore();
    }

    // Sweeping tail plumes
    for (let j = 0; j < 5; j++) {
      const tj = j / 4;
      ctx.strokeStyle = `rgba(251, 191, 36, ${0.82 - tj * 0.12})`;
      ctx.lineWidth = 4.2 - tj * 0.6;
      ctx.beginPath();
      ctx.moveTo(8 + j * 4, 48);
      ctx.bezierCurveTo(
        35 + j * 22,
        125 + j * 12,
        -15 + j * 28,
        210 + j * 16,
        30 + j * 32,
        285 - j * 8
      );
      ctx.stroke();

      // Eye-spots on tail tips
      const ex = 30 + j * 32;
      const ey = 285 - j * 8;
      const eyeGrad = ctx.createRadialGradient(ex, ey, 1, ex, ey, 14);
      eyeGrad.addColorStop(0, '#FFFBEB');
      eyeGrad.addColorStop(0.45, '#F59E0B');
      eyeGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = eyeGrad;
      ctx.beginPath();
      ctx.arc(ex, ey, 14, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // Central phoenix body & torso
  const bodyGrad = ctx.createRadialGradient(cx, cy - 35, 6, cx, cy, 95);
  bodyGrad.addColorStop(0, '#FFFFFF');
  bodyGrad.addColorStop(0.35, '#FDE68A');
  bodyGrad.addColorStop(0.75, '#F59E0B');
  bodyGrad.addColorStop(1, 'rgba(180, 83, 9, 0)');
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.ellipse(cx, cy - 12, 34, 82, 0, 0, Math.PI * 2);
  ctx.fill();

  // Head & Crown Crest
  ctx.fillStyle = '#FFFBEB';
  ctx.beginPath();
  ctx.arc(cx, cy - 115, 20, 0, Math.PI * 2);
  ctx.fill();

  for (let c = -2; c <= 2; c++) {
    ctx.strokeStyle = '#FEF3C7';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(cx + c * 4, cy - 132);
    ctx.quadraticCurveTo(cx + c * 18, cy - 175, cx + c * 26, cy - 205 + Math.abs(c) * 10);
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(cx + c * 26, cy - 205 + Math.abs(c) * 10, 4.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawLotus(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
  ctx.save();
  ctx.translate(cx, cy + 25);

  const layers = [
    { count: 12, length: 245, width: 64, alpha: 0.45, offsetAngle: Math.PI / 12 },
    { count: 10, length: 200, width: 58, alpha: 0.72, offsetAngle: 0 },
    { count: 8, length: 145, width: 46, alpha: 0.92, offsetAngle: Math.PI / 8 },
    { count: 6, length: 92, width: 32, alpha: 1.0, offsetAngle: 0 },
  ];

  layers.forEach((layer, lIdx) => {
    for (let i = 0; i < layer.count; i++) {
      const angle = (i / layer.count) * Math.PI * 2 + layer.offsetAngle;
      ctx.save();
      ctx.rotate(angle);

      const grad = ctx.createLinearGradient(0, 0, 0, -layer.length);
      grad.addColorStop(0, `rgba(180, 83, 9, ${layer.alpha * 0.5})`);
      grad.addColorStop(0.55, `rgba(245, 158, 11, ${layer.alpha * 0.85})`);
      grad.addColorStop(0.92, `rgba(254, 243, 199, ${layer.alpha})`);
      grad.addColorStop(1, `rgba(255, 255, 255, ${layer.alpha})`);

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(
        -layer.width,
        -layer.length * 0.35,
        -layer.width * 0.75,
        -layer.length * 0.82,
        0,
        -layer.length
      );
      ctx.bezierCurveTo(
        layer.width * 0.75,
        -layer.length * 0.82,
        layer.width,
        -layer.length * 0.35,
        0,
        0
      );
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = `rgba(255, 251, 235, ${0.4 + lIdx * 0.18})`;
      ctx.lineWidth = 1.6;
      ctx.stroke();

      // Central vein
      ctx.beginPath();
      ctx.moveTo(0, -12);
      ctx.lineTo(0, -layer.length * 0.94);
      ctx.stroke();

      ctx.restore();
    }
  });

  // Glowing stamen core
  const core = ctx.createRadialGradient(0, 0, 2, 0, 0, size * 0.08);
  core.addColorStop(0, '#FFFFFF');
  core.addColorStop(0.5, '#FDE68A');
  core.addColorStop(1, 'rgba(245, 158, 11, 0)');
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.08, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawLion(ctx: CanvasRenderingContext2D, cx: number, cy: number, _size: number) {
  ctx.save();
  ctx.translate(cx, cy);

  // Radiant mane rings
  for (let ring = 2; ring >= 0; ring--) {
    const count = 24 + ring * 8;
    const innerR = 75 + ring * 42;
    const outerR = 145 + ring * 55;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      ctx.save();
      ctx.rotate(a);
      const g = ctx.createLinearGradient(0, -innerR, 0, -outerR);
      g.addColorStop(0, 'rgba(254, 243, 199, 0.9)');
      g.addColorStop(0.6, 'rgba(245, 158, 11, 0.65)');
      g.addColorStop(1, 'rgba(120, 53, 15, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(-14, -innerR);
      ctx.quadraticCurveTo(-18, -(innerR + outerR) * 0.5, 0, -outerR);
      ctx.quadraticCurveTo(18, -(innerR + outerR) * 0.5, 14, -innerR);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  // Sculpted face planes
  const faceGrad = ctx.createRadialGradient(0, -15, 10, 0, 0, 115);
  faceGrad.addColorStop(0, '#FFFBEB');
  faceGrad.addColorStop(0.55, '#F59E0B');
  faceGrad.addColorStop(1, '#451A03');
  ctx.fillStyle = faceGrad;
  ctx.beginPath();
  ctx.moveTo(0, -105);
  ctx.lineTo(82, -45);
  ctx.lineTo(68, 55);
  ctx.lineTo(0, 112);
  ctx.lineTo(-68, 55);
  ctx.lineTo(-82, -45);
  ctx.closePath();
  ctx.fill();

  // Fierce luminous eyes & bridge lines
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 3;
  for (const dir of [-1, 1]) {
    ctx.save();
    ctx.scale(dir, 1);
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(22, -22);
    ctx.lineTo(54, -32);
    ctx.lineTo(44, -12);
    ctx.closePath();
    ctx.fill();

    // Nose & whisker contours
    ctx.beginPath();
    ctx.moveTo(0, -70);
    ctx.lineTo(18, 18);
    ctx.lineTo(0, 32);
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore();
}

function drawButterfly(ctx: CanvasRenderingContext2D, cx: number, cy: number, _size: number) {
  ctx.save();
  ctx.translate(cx, cy);

  for (const dir of [-1, 1]) {
    ctx.save();
    ctx.scale(dir, 1);

    // Forewing
    const fwGrad = ctx.createRadialGradient(90, -70, 10, 120, -60, 220);
    fwGrad.addColorStop(0, '#FEF08A');
    fwGrad.addColorStop(0.45, '#F97316');
    fwGrad.addColorStop(0.78, '#EC4899');
    fwGrad.addColorStop(1, 'rgba(88, 28, 135, 0)');
    ctx.fillStyle = fwGrad;
    ctx.beginPath();
    ctx.moveTo(8, -20);
    ctx.bezierCurveTo(95, -210, 280, -195, 255, -35);
    ctx.bezierCurveTo(235, 45, 95, 30, 8, 5);
    ctx.closePath();
    ctx.fill();

    // Hindwing
    const hwGrad = ctx.createRadialGradient(75, 75, 8, 95, 95, 165);
    hwGrad.addColorStop(0, '#A5F3FC');
    hwGrad.addColorStop(0.5, '#3B82F6');
    hwGrad.addColorStop(0.85, '#9333EA');
    hwGrad.addColorStop(1, 'rgba(30, 58, 138, 0)');
    ctx.fillStyle = hwGrad;
    ctx.beginPath();
    ctx.moveTo(8, 10);
    ctx.bezierCurveTo(165, 20, 210, 145, 130, 215);
    ctx.bezierCurveTo(65, 255, 18, 155, 6, 40);
    ctx.closePath();
    ctx.fill();

    // Wing veins and marginal spots
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 2.2;
    for (let v = 0; v < 6; v++) {
      ctx.beginPath();
      ctx.moveTo(12, -10);
      ctx.quadraticCurveTo(110, -120 + v * 28, 230 - v * 14, -115 + v * 32);
      ctx.stroke();
    }

    ctx.restore();
  }

  // Body & Antennae
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.ellipse(0, 10, 9, 95, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawAstrolabe(ctx: CanvasRenderingContext2D, cx: number, cy: number, _size: number) {
  ctx.save();
  ctx.translate(cx, cy);

  const radii = [265, 235, 185, 135, 85, 38];
  radii.forEach((r, idx) => {
    ctx.strokeStyle = idx % 2 === 0 ? '#FEF3C7' : '#F59E0B';
    ctx.lineWidth = idx === 0 ? 6 : 3;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();

    // Degree tick marks
    const ticks = idx === 0 ? 72 : 36;
    for (let t = 0; t < ticks; t++) {
      const a = (t / ticks) * Math.PI * 2;
      const len = t % 6 === 0 ? 14 : 7;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      ctx.lineTo(Math.cos(a) * (r - len), Math.sin(a) * (r - len));
      ctx.stroke();
    }
  });

  // Compass rose star points
  for (let i = 0; i < 8; i++) {
    ctx.save();
    ctx.rotate((i * Math.PI) / 4);
    ctx.fillStyle = i % 2 === 0 ? '#FFFBEB' : '#D97706';
    ctx.beginPath();
    ctx.moveTo(0, -255);
    ctx.lineTo(18, -45);
    ctx.lineTo(0, 0);
    ctx.lineTo(-18, -45);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}

function drawSculptedSphereBust(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  _size: number
) {
  ctx.save();
  // Classical portrait bust silhouette with dramatic directional key light
  const headGrad = ctx.createRadialGradient(cx - 55, cy - 95, 18, cx, cy - 55, 165);
  headGrad.addColorStop(0, '#FFFFFF');
  headGrad.addColorStop(0.45, '#FDE68A');
  headGrad.addColorStop(0.78, '#B45309');
  headGrad.addColorStop(1, '#1C1917');

  ctx.fillStyle = headGrad;
  ctx.beginPath();
  ctx.ellipse(cx, cy - 65, 105, 132, 0, 0, Math.PI * 2);
  ctx.fill();

  // Shoulders & pedestal
  const shoulderGrad = ctx.createRadialGradient(cx - 70, cy + 120, 20, cx, cy + 160, 240);
  shoulderGrad.addColorStop(0, '#FEF3C7');
  shoulderGrad.addColorStop(0.55, '#D97706');
  shoulderGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = shoulderGrad;
  ctx.beginPath();
  ctx.moveTo(cx - 210, cy + 235);
  ctx.quadraticCurveTo(cx - 175, cy + 85, cx - 55, cy + 68);
  ctx.lineTo(cx + 55, cy + 68);
  ctx.quadraticCurveTo(cx + 175, cy + 85, cx + 210, cy + 235);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}
