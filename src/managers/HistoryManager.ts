import { ColorPalettePresetId, StudioConfig } from '../types/studio';
import { COLOR_PALETTES } from '../utils/colorUtils';

export interface HistoryStack<T> {
  past: T[];
  present: T;
  future: T[];
}

const MAX_HISTORY_STEPS = 45;

export function createHistoryStack<T>(initialState: T): HistoryStack<T> {
  return {
    past: [],
    present: JSON.parse(JSON.stringify(initialState)),
    future: [],
  };
}

export function pushHistoryState<T>(stack: HistoryStack<T>, nextState: T): HistoryStack<T> {
  const serializedCurrent = JSON.stringify(stack.present);
  const serializedNext = JSON.stringify(nextState);
  if (serializedCurrent === serializedNext) {
    return stack;
  }

  const nextPast = [...stack.past, stack.present];
  if (nextPast.length > MAX_HISTORY_STEPS) {
    nextPast.shift();
  }

  return {
    past: nextPast,
    present: JSON.parse(serializedNext),
    future: [],
  };
}

export function undoHistoryState<T>(stack: HistoryStack<T>): HistoryStack<T> {
  if (stack.past.length === 0) return stack;
  const previous = stack.past[stack.past.length - 1];
  const newPast = stack.past.slice(0, stack.past.length - 1);
  return {
    past: newPast,
    present: previous,
    future: [stack.present, ...stack.future],
  };
}

export function redoHistoryState<T>(stack: HistoryStack<T>): HistoryStack<T> {
  if (stack.future.length === 0) return stack;
  const next = stack.future[0];
  const newFuture = stack.future.slice(1);
  return {
    past: [...stack.past, stack.present],
    present: next,
    future: newFuture,
  };
}

function randomInt(min: number, max: number): number {
  return Math.floor(min + Math.random() * (max - min + 1));
}

function randomFloat(min: number, max: number, decimals = 1): number {
  const val = min + Math.random() * (max - min);
  return Number(val.toFixed(decimals));
}

/**
 * Randomize Only Size within safe subject-preserving limits.
 */
export function randomizeSizeOnly(config: StudioConfig): StudioConfig {
  const newMin = randomFloat(0.8, 2.4, 1);
  const newMax = randomFloat(Math.max(4.5, newMin + 3), 13.5, 1);
  const newDef = randomFloat(newMin + 0.8, newMax - 1.2, 1);

  return {
    ...config,
    size: {
      ...config.size,
      minSize: newMin,
      maxSize: newMax,
      defaultSize: newDef,
      sizeVariation: randomInt(20, 85),
      sizeRandomness: randomInt(15, 70),
      mappingStrength: randomInt(65, 96),
      sizeSeed: randomInt(100, 999999),
    },
  };
}

/**
 * Randomize Only Position (Seed & micro-jitter while preserving recognizable subject).
 */
export function randomizePositionOnly(config: StudioConfig): StudioConfig {
  return {
    ...config,
    distribution: {
      ...config.distribution,
      seed: randomInt(1000, 999999),
      randomness: randomInt(25, 85),
      gridOffsetX: randomInt(0, 95),
      gridOffsetY: randomInt(0, 95),
    },
  };
}

/**
 * Randomize Only Distribution parameters while keeping the subject recognizable.
 */
export function randomizeDistributionOnly(config: StudioConfig): StudioConfig {
  return {
    ...config,
    distribution: {
      ...config.distribution,
      seed: randomInt(1000, 999999),
      density: randomInt(58, 92),
      randomness: randomInt(30, 85),
      scatterAmount: randomInt(12, 45),
      scatterRadius: randomInt(25, 75),
      subjectPreservation: randomInt(72, 95),
      edgeDensity: randomInt(40, 88),
      densityVariation: randomInt(15, 65),
    },
  };
}

/**
 * Randomize Only Color variation & palette parameters.
 */
export function randomizeColorOnly(config: StudioConfig): StudioConfig {
  const paletteKeys: ColorPalettePresetId[] = [
    'golden',
    'warm-gold',
    'silver',
    'blue',
    'cyan',
    'purple',
    'neon',
    'sunset',
  ];
  const pickedKey = paletteKeys[Math.floor(Math.random() * paletteKeys.length)];
  const spec = COLOR_PALETTES[pickedKey];

  return {
    ...config,
    color: {
      ...config.color,
      paletteId: pickedKey,
      singleColor: spec.single,
      darkColor: spec.dark,
      midColor: spec.mid,
      brightColor: spec.bright,
      baseColor: spec.single,
      gradientStops: [...spec.stops],
      variationIntensity: randomInt(25, 75),
      hueVariation: randomInt(10, 45),
      saturationVariation: randomInt(15, 50),
      brightnessVariation: randomInt(20, 55),
      colorSeed: randomInt(100, 999999),
    },
    effects: {
      ...config.effects,
      glowColor: spec.glow,
    },
  };
}

/**
 * Randomize All:
 * - Generates new random seeds
 * - Randomizes particle positions and sizes within configured constraints
 * - Randomizes color variation if enabled
 * - Preserves original subject's recognizable shape
 * - Preserves selected generation mode and artboard dimensions
 */
export function randomizeAllSettings(config: StudioConfig): StudioConfig {
  let next = randomizePositionOnly(config);
  next = randomizeSizeOnly(next);
  next = randomizeDistributionOnly(next);
  next = {
    ...next,
    color: {
      ...next.color,
      colorSeed: randomInt(100, 999999),
      variationIntensity: randomInt(25, 70),
    },
  };
  return next;
}
