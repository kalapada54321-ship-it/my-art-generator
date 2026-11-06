import { DEFAULT_STUDIO_CONFIG, StudioConfig, StudioPreset } from '../types/studio';

const CUSTOM_PRESETS_STORAGE_KEY = 'particleforge_custom_presets_v1';

export const BUILTIN_PRESETS: StudioPreset[] = [
  {
    id: 'golden-dust',
    name: 'Golden Dust',
    category: 'Gold & Luxury',
    description: 'Signature shimmering golden particles with fine contour density on deep black.',
    badgeColor: '#F59E0B',
    config: {
      mode: 'image-based',
      size: {
        ...DEFAULT_STUDIO_CONFIG.size,
        mode: 'image-dependent',
        minSize: 1.1,
        maxSize: 9.2,
        defaultSize: 3.8,
        invertMapping: false,
        mappingStrength: 88,
        sizeRandomness: 28,
      },
      distribution: {
        ...DEFAULT_STUDIO_CONFIG.distribution,
        targetCount: 10500,
        density: 80,
        randomness: 58,
        scatterAmount: 26,
        scatterRadius: 45,
        subjectPreservation: 88,
        brightnessWeight: 68,
        edgeDensity: 65,
      },
      shape: {
        ...DEFAULT_STUDIO_CONFIG.shape,
        shape: 'circle',
      },
      color: {
        ...DEFAULT_STUDIO_CONFIG.color,
        mode: 'brightness',
        paletteId: 'golden',
        darkColor: '#78350F',
        midColor: '#F59E0B',
        brightColor: '#FEF3C7',
      },
      effects: {
        ...DEFAULT_STUDIO_CONFIG.effects,
        glowIntensity: 68,
        glowRadius: 16,
        outerGlow: 62,
        innerGlow: 48,
        glowColor: '#F59E0B',
        bloomEffect: 52,
        highlightIntensity: 78,
        backgroundAtmosphere: 42,
      },
      background: {
        ...DEFAULT_STUDIO_CONFIG.background,
        type: 'solid-black',
      },
    },
  },
  {
    id: 'golden-glow',
    name: 'Golden Glow',
    category: 'Gold & Luxury',
    description: 'Intense radiant warm gold bloom with soft atmospheric luxury lighting.',
    badgeColor: '#FBBF24',
    config: {
      mode: 'image-based',
      size: {
        ...DEFAULT_STUDIO_CONFIG.size,
        mode: 'image-dependent',
        minSize: 1.5,
        maxSize: 12.5,
        defaultSize: 4.8,
        mappingStrength: 92,
      },
      distribution: {
        ...DEFAULT_STUDIO_CONFIG.distribution,
        targetCount: 8500,
        density: 74,
        scatterAmount: 35,
        scatterRadius: 65,
        brightnessWeight: 75,
      },
      shape: {
        ...DEFAULT_STUDIO_CONFIG.shape,
        shape: 'circle',
      },
      color: {
        ...DEFAULT_STUDIO_CONFIG.color,
        mode: 'gradient',
        paletteId: 'warm-gold',
        gradientType: 'radial',
        gradientStops: [
          { offset: 0, color: '#FFFFFF' },
          { offset: 0.4, color: '#FDE047' },
          { offset: 0.8, color: '#D97706' },
          { offset: 1, color: '#7C2D12' },
        ],
      },
      effects: {
        ...DEFAULT_STUDIO_CONFIG.effects,
        glowIntensity: 92,
        glowRadius: 28,
        outerGlow: 88,
        innerGlow: 75,
        glowColor: '#FBBF24',
        bloomEffect: 84,
        highlightIntensity: 90,
        backgroundAtmosphere: 68,
      },
      background: {
        ...DEFAULT_STUDIO_CONFIG.background,
        type: 'gradient',
        gradientType: 'radial',
        gradientStart: '#231606',
        gradientEnd: '#040507',
      },
    },
  },
  {
    id: 'silver-particles',
    name: 'Silver Particles',
    category: 'Gold & Luxury',
    description: 'Metallic platinum and liquid silver beads with crisp specular highlights.',
    badgeColor: '#CBD5E1',
    config: {
      mode: 'image-based',
      size: {
        ...DEFAULT_STUDIO_CONFIG.size,
        mode: 'image-dependent',
        minSize: 1.0,
        maxSize: 8.5,
        defaultSize: 3.5,
      },
      distribution: {
        ...DEFAULT_STUDIO_CONFIG.distribution,
        targetCount: 11000,
        density: 82,
        scatterAmount: 18,
      },
      shape: {
        ...DEFAULT_STUDIO_CONFIG.shape,
        shape: 'circle',
      },
      color: {
        ...DEFAULT_STUDIO_CONFIG.color,
        mode: 'brightness',
        paletteId: 'silver',
        darkColor: '#334155',
        midColor: '#94A3B8',
        brightColor: '#FFFFFF',
      },
      effects: {
        ...DEFAULT_STUDIO_CONFIG.effects,
        glowIntensity: 54,
        glowRadius: 14,
        glowColor: '#94A3B8',
        bloomEffect: 42,
        backgroundAtmosphere: 30,
      },
      background: {
        ...DEFAULT_STUDIO_CONFIG.background,
        type: 'solid-black',
      },
    },
  },
  {
    id: 'white-particles',
    name: 'White Particles',
    category: 'Print & Halftone',
    description: 'Clean high-contrast pure white vector stipple dots on pitch black.',
    badgeColor: '#FFFFFF',
    config: {
      mode: 'image-based',
      size: {
        ...DEFAULT_STUDIO_CONFIG.size,
        mode: 'image-dependent',
        minSize: 1.0,
        maxSize: 7.5,
        defaultSize: 3.2,
      },
      distribution: {
        ...DEFAULT_STUDIO_CONFIG.distribution,
        targetCount: 12000,
        scatterAmount: 10,
      },
      shape: {
        ...DEFAULT_STUDIO_CONFIG.shape,
        shape: 'circle',
      },
      color: {
        ...DEFAULT_STUDIO_CONFIG.color,
        mode: 'single',
        paletteId: 'white',
        singleColor: '#FFFFFF',
      },
      effects: {
        ...DEFAULT_STUDIO_CONFIG.effects,
        glowIntensity: 20,
        glowRadius: 8,
        glowColor: '#FFFFFF',
        bloomEffect: 15,
        backgroundAtmosphere: 10,
      },
      background: {
        ...DEFAULT_STUDIO_CONFIG.background,
        type: 'solid-black',
      },
    },
  },
  {
    id: 'blue-neon',
    name: 'Blue Neon',
    category: 'Luminous & Neon',
    description: 'Cybernetic electric cyan and sapphire bioluminescent particle matrix.',
    badgeColor: '#06B6D4',
    config: {
      mode: 'image-based',
      size: {
        ...DEFAULT_STUDIO_CONFIG.size,
        mode: 'image-dependent',
        minSize: 1.2,
        maxSize: 9.0,
      },
      distribution: {
        ...DEFAULT_STUDIO_CONFIG.distribution,
        targetCount: 10000,
        scatterAmount: 28,
        edgeDensity: 78,
      },
      shape: {
        ...DEFAULT_STUDIO_CONFIG.shape,
        shape: 'hexagon',
      },
      color: {
        ...DEFAULT_STUDIO_CONFIG.color,
        mode: 'brightness',
        paletteId: 'cyan',
        darkColor: '#1E3A8A',
        midColor: '#06B6D4',
        brightColor: '#ECFEFF',
      },
      effects: {
        ...DEFAULT_STUDIO_CONFIG.effects,
        glowIntensity: 85,
        glowRadius: 22,
        outerGlow: 80,
        glowColor: '#06B6D4',
        bloomEffect: 75,
        backgroundAtmosphere: 55,
      },
      background: {
        ...DEFAULT_STUDIO_CONFIG.background,
        type: 'custom-solid',
        customColor: '#030812',
      },
    },
  },
  {
    id: 'purple-galaxy',
    name: 'Purple Galaxy',
    category: 'Luminous & Neon',
    description: 'Deep cosmic nebula particles with star shapes and magenta-violet gradients.',
    badgeColor: '#A855F7',
    config: {
      mode: 'random',
      size: {
        ...DEFAULT_STUDIO_CONFIG.size,
        mode: 'random',
        minSize: 1.0,
        maxSize: 11.0,
        defaultSize: 3.6,
        sizeVariation: 82,
      },
      distribution: {
        ...DEFAULT_STUDIO_CONFIG.distribution,
        targetCount: 9500,
        randomness: 85,
        scatterAmount: 42,
        scatterRadius: 72,
      },
      shape: {
        ...DEFAULT_STUDIO_CONFIG.shape,
        shape: 'star',
        starPoints: 4,
        innerRadiusRatio: 0.35,
      },
      color: {
        ...DEFAULT_STUDIO_CONFIG.color,
        mode: 'gradient',
        paletteId: 'purple',
        gradientType: 'radial',
        gradientStops: [
          { offset: 0, color: '#FEF08A' },
          { offset: 0.35, color: '#F472B6' },
          { offset: 0.72, color: '#9333EA' },
          { offset: 1, color: '#1E1B4B' },
        ],
      },
      effects: {
        ...DEFAULT_STUDIO_CONFIG.effects,
        glowIntensity: 82,
        glowRadius: 24,
        glowColor: '#A855F7',
        bloomEffect: 70,
        backgroundAtmosphere: 62,
      },
      background: {
        ...DEFAULT_STUDIO_CONFIG.background,
        type: 'gradient',
        gradientType: 'radial',
        gradientStart: '#1D0B30',
        gradientEnd: '#04030A',
      },
    },
  },
  {
    id: 'minimal-black-dots',
    name: 'Minimal Black Dots',
    category: 'Print & Halftone',
    description: 'Clean editorial black ink particles on crisp white artboard for print design.',
    badgeColor: '#52525B',
    config: {
      mode: 'image-based',
      size: {
        ...DEFAULT_STUDIO_CONFIG.size,
        mode: 'image-dependent',
        minSize: 1.2,
        maxSize: 8.5,
        defaultSize: 4.0,
        invertMapping: false,
      },
      distribution: {
        ...DEFAULT_STUDIO_CONFIG.distribution,
        targetCount: 8500,
        scatterAmount: 4,
        backgroundDensity: 0,
      },
      shape: {
        ...DEFAULT_STUDIO_CONFIG.shape,
        shape: 'circle',
      },
      color: {
        ...DEFAULT_STUDIO_CONFIG.color,
        mode: 'single',
        paletteId: 'monochrome',
        singleColor: '#111827',
      },
      effects: {
        ...DEFAULT_STUDIO_CONFIG.effects,
        glowIntensity: 0,
        outerGlow: 0,
        innerGlow: 0,
        bloomEffect: 0,
        backgroundAtmosphere: 0,
        particleOpacity: 95,
        minOpacity: 40,
      },
      background: {
        ...DEFAULT_STUDIO_CONFIG.background,
        type: 'solid-white',
      },
    },
  },
  {
    id: 'monochrome-halftone',
    name: 'Monochrome Halftone',
    category: 'Print & Halftone',
    description: 'Precision uniform hexagonal grid screen dots modulated by image luminance.',
    badgeColor: '#E4E4E7',
    config: {
      mode: 'uniform-grid',
      size: {
        ...DEFAULT_STUDIO_CONFIG.size,
        mode: 'image-dependent',
        minSize: 0.8,
        maxSize: 9.5,
        defaultSize: 4.5,
        mappingStrength: 98,
        sizeRandomness: 0,
      },
      distribution: {
        ...DEFAULT_STUDIO_CONFIG.distribution,
        spacing: 8,
        density: 78,
        randomness: 0,
        scatterAmount: 0,
        gridAlign: 'hex',
      },
      shape: {
        ...DEFAULT_STUDIO_CONFIG.shape,
        shape: 'circle',
      },
      color: {
        ...DEFAULT_STUDIO_CONFIG.color,
        mode: 'single',
        paletteId: 'white',
        singleColor: '#F4F4F5',
      },
      effects: {
        ...DEFAULT_STUDIO_CONFIG.effects,
        glowIntensity: 0,
        bloomEffect: 0,
        backgroundAtmosphere: 0,
        particleOpacity: 100,
        minOpacity: 65,
      },
      background: {
        ...DEFAULT_STUDIO_CONFIG.background,
        type: 'solid-black',
      },
    },
  },
  {
    id: 'colorful-particles',
    name: 'Colorful Particles',
    category: 'Artistic',
    description: 'Samples true RGB colors from the original image with boosted saturation.',
    badgeColor: '#EC4899',
    config: {
      mode: 'image-based',
      size: {
        ...DEFAULT_STUDIO_CONFIG.size,
        mode: 'image-dependent',
        minSize: 1.5,
        maxSize: 10.0,
      },
      distribution: {
        ...DEFAULT_STUDIO_CONFIG.distribution,
        targetCount: 10000,
        scatterAmount: 20,
      },
      shape: {
        ...DEFAULT_STUDIO_CONFIG.shape,
        shape: 'circle',
      },
      color: {
        ...DEFAULT_STUDIO_CONFIG.color,
        mode: 'original',
        colorPreservation: 96,
        colorSaturation: 35,
        colorVariation: 18,
        colorBrightness: 12,
      },
      effects: {
        ...DEFAULT_STUDIO_CONFIG.effects,
        glowIntensity: 60,
        glowRadius: 15,
        bloomEffect: 45,
        backgroundAtmosphere: 30,
      },
      background: {
        ...DEFAULT_STUDIO_CONFIG.background,
        type: 'solid-black',
      },
    },
  },
  {
    id: 'random-dust',
    name: 'Random Dust',
    category: 'Artistic',
    description: 'Organic irregular mineral specks with Monte Carlo scatter and hue variation.',
    badgeColor: '#F97316',
    config: {
      mode: 'random',
      size: {
        ...DEFAULT_STUDIO_CONFIG.size,
        mode: 'random',
        minSize: 1.0,
        maxSize: 9.8,
        sizeVariation: 85,
      },
      distribution: {
        ...DEFAULT_STUDIO_CONFIG.distribution,
        targetCount: 9500,
        randomness: 90,
        scatterAmount: 48,
        scatterRadius: 68,
        densityVariation: 60,
      },
      shape: {
        ...DEFAULT_STUDIO_CONFIG.shape,
        shape: 'organic',
        shapeVariation: 65,
        rotationRandomness: 100,
      },
      color: {
        ...DEFAULT_STUDIO_CONFIG.color,
        mode: 'random-variation',
        baseColor: '#F59E0B',
        variationIntensity: 65,
        hueVariation: 28,
        saturationVariation: 35,
        brightnessVariation: 45,
      },
      effects: {
        ...DEFAULT_STUDIO_CONFIG.effects,
        glowIntensity: 52,
        bloomEffect: 38,
      },
      background: {
        ...DEFAULT_STUDIO_CONFIG.background,
        type: 'solid-black',
      },
    },
  },
  {
    id: 'edge-glow',
    name: 'Edge Glow',
    category: 'Luminous & Neon',
    description: 'Concentrates glowing diamond particles along detected Sobel contours and edges.',
    badgeColor: '#38BDF8',
    config: {
      mode: 'edge-based',
      size: {
        ...DEFAULT_STUDIO_CONFIG.size,
        mode: 'image-dependent',
        minSize: 1.0,
        maxSize: 6.5,
        defaultSize: 2.8,
      },
      distribution: {
        ...DEFAULT_STUDIO_CONFIG.distribution,
        targetCount: 11500,
        edgeSensitivity: 55,
        edgeDensity: 85,
        combineEdgeInterior: true,
        edgeOnly: false,
        scatterAmount: 22,
      },
      shape: {
        ...DEFAULT_STUDIO_CONFIG.shape,
        shape: 'diamond',
      },
      color: {
        ...DEFAULT_STUDIO_CONFIG.color,
        mode: 'brightness',
        paletteId: 'golden',
        darkColor: '#92400E',
        midColor: '#F59E0B',
        brightColor: '#FFFFFF',
      },
      effects: {
        ...DEFAULT_STUDIO_CONFIG.effects,
        glowIntensity: 84,
        glowRadius: 20,
        outerGlow: 78,
        innerGlow: 65,
        bloomEffect: 68,
        highlightIntensity: 88,
      },
      background: {
        ...DEFAULT_STUDIO_CONFIG.background,
        type: 'solid-black',
      },
    },
  },
  {
    id: 'soft-particle-cloud',
    name: 'Soft Particle Cloud',
    category: 'Artistic',
    description: 'Dreamy atmospheric bokeh particles with wide variation and sunset gradient.',
    badgeColor: '#FB7185',
    config: {
      mode: 'image-based',
      size: {
        ...DEFAULT_STUDIO_CONFIG.size,
        mode: 'image-dependent',
        minSize: 2.2,
        maxSize: 15.5,
        defaultSize: 6.2,
        sizeSmoothing: 65,
      },
      distribution: {
        ...DEFAULT_STUDIO_CONFIG.distribution,
        targetCount: 6500,
        scatterAmount: 45,
        scatterRadius: 80,
      },
      shape: {
        ...DEFAULT_STUDIO_CONFIG.shape,
        shape: 'circle',
      },
      color: {
        ...DEFAULT_STUDIO_CONFIG.color,
        mode: 'gradient',
        paletteId: 'sunset',
        gradientType: 'linear',
        gradientAngle: 135,
        gradientStops: [
          { offset: 0, color: '#FEF08A' },
          { offset: 0.45, color: '#F97316' },
          { offset: 0.8, color: '#EC4899' },
          { offset: 1, color: '#6366F1' },
        ],
      },
      effects: {
        ...DEFAULT_STUDIO_CONFIG.effects,
        glowIntensity: 78,
        glowRadius: 26,
        particleOpacity: 75,
        minOpacity: 15,
        bloomEffect: 65,
        backgroundAtmosphere: 55,
      },
      background: {
        ...DEFAULT_STUDIO_CONFIG.background,
        type: 'custom-solid',
        customColor: '#090612',
      },
    },
  },
];

export function loadCustomPresets(): StudioPreset[] {
  try {
    const raw = localStorage.getItem(CUSTOM_PRESETS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCustomPreset(name: string, config: StudioConfig): StudioPreset[] {
  const existing = loadCustomPresets();
  const newPreset: StudioPreset = {
    id: `custom-${Date.now()}`,
    name: name.trim() || 'Custom Preset',
    category: 'Custom',
    description: `${config.mode} • ${config.shape.shape} • ${config.distribution.targetCount.toLocaleString()} pts`,
    badgeColor: config.color.singleColor || '#F59E0B',
    isCustom: true,
    config: {
      mode: config.mode,
      size: { ...config.size },
      distribution: { ...config.distribution },
      shape: { ...config.shape },
      color: { ...config.color },
      effects: { ...config.effects },
      background: { ...config.background },
    },
  };
  const updated = [newPreset, ...existing];
  try {
    localStorage.setItem(CUSTOM_PRESETS_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Ignore quota errors
  }
  return updated;
}

export function deleteCustomPreset(presetId: string): StudioPreset[] {
  const existing = loadCustomPresets().filter((p) => p.id !== presetId);
  try {
    localStorage.setItem(CUSTOM_PRESETS_STORAGE_KEY, JSON.stringify(existing));
  } catch {
    // Ignore errors
  }
  return existing;
}

/**
 * Merges a preset configuration onto the current StudioConfig while preserving
 * artboard dimensions, image transform, and export filenames.
 */
export function applyPresetToConfig(
  current: StudioConfig,
  preset: StudioPreset
): StudioConfig {
  return {
    ...current,
    mode: preset.config.mode ?? current.mode,
    size: preset.config.size ? { ...current.size, ...preset.config.size } : current.size,
    distribution: preset.config.distribution
      ? { ...current.distribution, ...preset.config.distribution }
      : current.distribution,
    shape: preset.config.shape ? { ...current.shape, ...preset.config.shape } : current.shape,
    color: preset.config.color ? { ...current.color, ...preset.config.color } : current.color,
    effects: preset.config.effects
      ? { ...current.effects, ...preset.config.effects }
      : current.effects,
    background: preset.config.background
      ? { ...current.background, ...preset.config.background }
      : current.background,
  };
}
