import { describe, expect, it } from 'vitest';
import { analyzeAndPreprocessImage } from '../engine/ImagePreprocessor';
import { generateParticlesFromBuffer } from '../engine/ParticleEngine';
import { generateEditableEPS } from '../exporters/EPSExporter';
import { generateIllustratorJSXScript } from '../exporters/IllustratorBridge';
import { generateEditableVectorPDF } from '../exporters/PDFExporter';
import { generateEditableSVG } from '../exporters/SVGExporter';
import {
  convertArtboardUnit,
  getArtboardPixelDimensions,
  pixelsToUnit,
  unitToPixels,
} from '../managers/ArtboardManager';
import {
  createHistoryStack,
  pushHistoryState,
  redoHistoryState,
  undoHistoryState,
} from '../managers/HistoryManager';
import {
  deleteProjectRecord,
  listSavedProjects,
  parsePortableProject,
  saveProjectRecord,
  serializePortableProject,
} from '../managers/ProjectManager';
import { DEFAULT_STUDIO_CONFIG, StudioConfig } from '../types/studio';
import { validateImageFileMetadata } from '../utils/imageUploadValidator';

/**
 * Helper to create a synthetic test RGBA image with a bright circular subject and sharp contour edge.
 */
function createSyntheticSubjectBuffer(width: number, height: number): Uint8ClampedArray {
  const rgba = new Uint8ClampedArray(width * height * 4);
  const cx = width * 0.5;
  const cy = height * 0.5;
  const maxR = Math.min(width, height) * 0.35;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= maxR) {
        const norm = 1 - dist / maxR;
        rgba[idx] = Math.round(255 * norm); // R
        rgba[idx + 1] = Math.round(180 * norm); // G
        rgba[idx + 2] = Math.round(40 * norm); // B
        rgba[idx + 3] = 255; // Alpha
      } else {
        rgba[idx] = 5;
        rgba[idx + 1] = 6;
        rgba[idx + 2] = 8;
        rgba[idx + 3] = 255;
      }
    }
  }
  return rgba;
}

describe('ParticleForge Studio — Comprehensive Functional Test Suite', () => {
  // 1. IMAGE UPLOAD VALIDATION
  describe('1. Image Upload Validation', () => {
    it('accepts valid PNG, JPG, and WEBP files', () => {
      expect(
        validateImageFileMetadata({ name: 'artwork.png', type: 'image/png', size: 120_000 }).valid
      ).toBe(true);
      expect(
        validateImageFileMetadata({ name: 'photo.jpg', type: 'image/jpeg', size: 450_000 }).valid
      ).toBe(true);
      expect(
        validateImageFileMetadata({ name: 'render.webp', type: 'image/webp', size: 280_000 }).valid
      ).toBe(true);
    });

    it('rejects unsupported file formats and empty/corrupted files', () => {
      const badGif = validateImageFileMetadata({
        name: 'anim.gif',
        type: 'image/gif',
        size: 50_000,
      });
      expect(badGif.valid).toBe(false);
      expect(badGif.error).toContain('Unsupported file format');

      const emptyFile = validateImageFileMetadata({
        name: 'corrupted.png',
        type: 'image/png',
        size: 0,
      });
      expect(emptyFile.valid).toBe(false);
      expect(emptyFile.error).toContain('empty');
    });
  });

  // 2. PARTICLE GENERATION MODES & DETERMINISM
  describe('2. Particle Generation Modes & Constraints', () => {
    const rawRgba = createSyntheticSubjectBuffer(120, 120);
    const analyzed = analyzeAndPreprocessImage(
      rawRgba,
      120,
      120,
      120,
      120,
      DEFAULT_STUDIO_CONFIG.transform,
      DEFAULT_STUDIO_CONFIG.preprocess
    );

    it('generates Mode A: Image-Based particles with valid positions and sizes', () => {
      const cfg: StudioConfig = {
        ...DEFAULT_STUDIO_CONFIG,
        mode: 'image-based',
        distribution: {
          ...DEFAULT_STUDIO_CONFIG.distribution,
          targetCount: 1500,
          allowOutsideArtboard: false,
        },
      };
      const res = generateParticlesFromBuffer(analyzed, cfg, 'final');
      expect(res.particles.length).toBeGreaterThan(200);
      for (const p of res.particles) {
        expect(p.x).toBeGreaterThanOrEqual(0);
        expect(p.x).toBeLessThanOrEqual(res.artboardWidthPx);
        expect(p.y).toBeGreaterThanOrEqual(0);
        expect(p.y).toBeLessThanOrEqual(res.artboardHeightPx);
        expect(p.radius).toBeGreaterThan(0);
      }
    });

    it('generates Mode B: Uniform Grid particles cleanly', () => {
      const cfg: StudioConfig = {
        ...DEFAULT_STUDIO_CONFIG,
        mode: 'uniform-grid',
        distribution: {
          ...DEFAULT_STUDIO_CONFIG.distribution,
          spacing: 18,
          gridAlign: 'hex',
        },
      };
      const res = generateParticlesFromBuffer(analyzed, cfg, 'final');
      expect(res.particles.length).toBeGreaterThan(50);
    });

    it('generates Mode C: Random Distribution particles and respects deterministic seed', () => {
      const cfg: StudioConfig = {
        ...DEFAULT_STUDIO_CONFIG,
        mode: 'random',
        distribution: {
          ...DEFAULT_STUDIO_CONFIG.distribution,
          targetCount: 800,
          seed: 987654,
        },
      };
      const run1 = generateParticlesFromBuffer(analyzed, cfg, 'final');
      const run2 = generateParticlesFromBuffer(analyzed, cfg, 'final');

      expect(run1.particles.length).toBe(run2.particles.length);
      expect(run1.particles[0]).toEqual(run2.particles[0]);
      expect(run1.particles[run1.particles.length - 1]).toEqual(
        run2.particles[run2.particles.length - 1]
      );
    });

    it('generates Mode D: Edge-Based particles along detected Sobel contours', () => {
      const cfg: StudioConfig = {
        ...DEFAULT_STUDIO_CONFIG,
        mode: 'edge-based',
        distribution: {
          ...DEFAULT_STUDIO_CONFIG.distribution,
          targetCount: 900,
          edgeOnly: true,
        },
      };
      const res = generateParticlesFromBuffer(analyzed, cfg, 'final');
      expect(res.particles.length).toBeGreaterThan(100);
      expect(res.stats.edgeCount).toBeGreaterThan(0);
    });
  });

  // 3. COLOR SYSTEM MODES
  describe('3. Advanced Color System Modes', () => {
    const rawRgba = createSyntheticSubjectBuffer(80, 80);
    const analyzed = analyzeAndPreprocessImage(
      rawRgba,
      80,
      80,
      80,
      80,
      DEFAULT_STUDIO_CONFIG.transform,
      DEFAULT_STUDIO_CONFIG.preprocess
    );

    it('supports Single, Original, Gradient, Brightness, and Random Variation color modes', () => {
      const modes = [
        'single',
        'original',
        'gradient',
        'brightness',
        'random-variation',
      ] as const;

      for (const m of modes) {
        const cfg: StudioConfig = {
          ...DEFAULT_STUDIO_CONFIG,
          distribution: { ...DEFAULT_STUDIO_CONFIG.distribution, targetCount: 300 },
          color: { ...DEFAULT_STUDIO_CONFIG.color, mode: m, singleColor: '#22D3EE' },
        };
        const res = generateParticlesFromBuffer(analyzed, cfg, 'final');
        expect(res.particles.length).toBeGreaterThan(20);
        const p = res.particles[0];
        expect(p.r).toBeGreaterThanOrEqual(0);
        expect(p.r).toBeLessThanOrEqual(255);
        expect(p.g).toBeGreaterThanOrEqual(0);
        expect(p.g).toBeLessThanOrEqual(255);
        expect(p.b).toBeGreaterThanOrEqual(0);
        expect(p.b).toBeLessThanOrEqual(255);
      }
    });
  });

  // 4. ARTBOARD DIMENSIONS, UNITS & DPI
  describe('4. Artboard Unit & DPI Conversion', () => {
    it('accurately converts between px, in, mm, and cm at 300 DPI', () => {
      expect(unitToPixels(10, 'in', 300)).toBe(3000);
      expect(pixelsToUnit(3000, 'in', 300)).toBe(10);
      expect(unitToPixels(25.4, 'mm', 300)).toBe(300);
      expect(convertArtboardUnit(10, 'in', 'cm', 300)).toBeCloseTo(25.4, 1);

      const dims = getArtboardPixelDimensions({
        ...DEFAULT_STUDIO_CONFIG.artboard,
        width: 8.5,
        height: 11,
        unit: 'in',
        dpi: 300,
      });
      expect(dims.widthPx).toBe(2550);
      expect(dims.heightPx).toBe(3300);
    });
  });

  // 5. VECTOR EXPORTERS (SVG, EPS, PDF, ILLUSTRATOR BRIDGE)
  describe('5. Vector Export Verification (SVG, EPS, PDF, Illustrator JSX)', () => {
    const rawRgba = createSyntheticSubjectBuffer(80, 80);
    const analyzed = analyzeAndPreprocessImage(
      rawRgba,
      80,
      80,
      80,
      80,
      DEFAULT_STUDIO_CONFIG.transform,
      DEFAULT_STUDIO_CONFIG.preprocess
    );
    const result = generateParticlesFromBuffer(
      analyzed,
      {
        ...DEFAULT_STUDIO_CONFIG,
        distribution: { ...DEFAULT_STUDIO_CONFIG.distribution, targetCount: 400 },
      },
      'final'
    );

    it('exports valid SVG with editable vector elements and exact artboard dimensions', () => {
      const svg = generateEditableSVG(result, DEFAULT_STUDIO_CONFIG);
      expect(svg).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(svg).toContain('viewBox="0 0 3000 3000"');
      expect(svg).toContain('<circle cx=');
      expect(svg).toContain('<g id="Main_Particles"');
    });

    it('exports genuine Encapsulated PostScript (EPS) with PostScript vector drawing commands', () => {
      const eps = generateEditableEPS(result, DEFAULT_STUDIO_CONFIG);
      expect(eps).toContain('%!PS-Adobe-3.0 EPSF-3.0');
      expect(eps).toContain('%%BoundingBox: 0 0 3000 3000');
      expect(eps).toContain('/c { newpath 0 360 arc closepath fill } bind def');
      expect(eps).toContain('%%EOF');
    });

    it('omits background rectangle in SVG and EPS when transparent background is selected', () => {
      const transparentCfg: StudioConfig = {
        ...DEFAULT_STUDIO_CONFIG,
        background: { ...DEFAULT_STUDIO_CONFIG.background, type: 'transparent' },
        export: { ...DEFAULT_STUDIO_CONFIG.export, includeBackground: false },
      };
      const svg = generateEditableSVG(result, transparentCfg);
      const eps = generateEditableEPS(result, transparentCfg);
      expect(svg).not.toContain('<g id="Background"');
      expect(eps).not.toContain('rectfill_pf\n% --- Begin Group');
    });

    it('exports valid Vector PDF 1.4 and Adobe Illustrator JSX script', () => {
      const pdf = generateEditableVectorPDF(result, DEFAULT_STUDIO_CONFIG);
      expect(pdf.startsWith('%PDF-1.4')).toBe(true);
      expect(pdf).toContain('/MediaBox [0 0 3000 3000]');
      expect(pdf).toContain('xref');
      expect(pdf).toContain('%%EOF');

      const jsx = generateIllustratorJSXScript(
        result,
        DEFAULT_STUDIO_CONFIG,
        'artwork.svg'
      );
      expect(jsx).toContain('#target illustrator');
      expect(jsx).toContain('new IllustratorSaveOptions()');
    });
  });

  // 6. PROJECT MANAGEMENT & UNDO/REDO
  describe('6. Project Save/Load & Undo/Redo History', () => {
    it('saves, lists, and deletes projects and serializes portable JSON reproducibly', async () => {
      const saved = await saveProjectRecord({
        name: 'Test Golden Phoenix',
        config: DEFAULT_STUDIO_CONFIG,
        sourceImage: null,
        particleCount: 9500,
      });
      expect(saved.name).toBe('Test Golden Phoenix');

      const all = await listSavedProjects();
      expect(all.some((p) => p.id === saved.id)).toBe(true);

      const jsonStr = serializePortableProject(
        saved.name,
        saved.config,
        saved.sourceImage
      );
      const restored = parsePortableProject(jsonStr);
      expect(restored.name).toBe('Test Golden Phoenix');
      expect(restored.config.distribution.seed).toBe(
        DEFAULT_STUDIO_CONFIG.distribution.seed
      );

      await deleteProjectRecord(saved.id);
    });

    it('tracks Undo and Redo state transitions accurately', () => {
      let stack = createHistoryStack(DEFAULT_STUDIO_CONFIG);
      const modified: StudioConfig = {
        ...DEFAULT_STUDIO_CONFIG,
        mode: 'edge-based',
      };
      stack = pushHistoryState(stack, modified);
      expect(stack.present.mode).toBe('edge-based');
      expect(stack.past.length).toBe(1);

      stack = undoHistoryState(stack);
      expect(stack.present.mode).toBe('image-based');
      expect(stack.future.length).toBe(1);

      stack = redoHistoryState(stack);
      expect(stack.present.mode).toBe('edge-based');
    });
  });

  // 7. PERFORMANCE & HIGH PARTICLE COUNTS
  describe('7. Performance & Scalability', () => {
    it('generates 25,000 particles within a fast interactive budget', () => {
      const rawRgba = createSyntheticSubjectBuffer(200, 200);
      const analyzed = analyzeAndPreprocessImage(
        rawRgba,
        200,
        200,
        200,
        200,
        DEFAULT_STUDIO_CONFIG.transform,
        DEFAULT_STUDIO_CONFIG.preprocess
      );
      const start = performance.now();
      const res = generateParticlesFromBuffer(
        analyzed,
        {
          ...DEFAULT_STUDIO_CONFIG,
          distribution: {
            ...DEFAULT_STUDIO_CONFIG.distribution,
            targetCount: 25000,
            minSpacing: 0,
          },
        },
        'final'
      );
      const elapsed = performance.now() - start;
      expect(res.particles.length).toBeGreaterThan(5000);
      expect(elapsed).toBeLessThan(2500);
    });
  });
});
