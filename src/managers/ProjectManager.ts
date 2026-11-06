import {
  DEFAULT_STUDIO_CONFIG,
  SavedProjectRecord,
  SourceImageMetadata,
  StudioConfig,
} from '../types/studio';

const DB_NAME = 'ParticleForgeStudioDB';
const DB_VERSION = 1;
const STORE_NAME = 'projects';
const FALLBACK_KEY = 'particleforge_projects_fallback_v1';

const memoryStore = new Map<string, SavedProjectRecord>();

function openProjectDatabase(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

function saveToFallback(record: SavedProjectRecord): void {
  memoryStore.set(record.id, record);
  try {
    if (typeof localStorage !== 'undefined') {
      const all = Array.from(memoryStore.values());
      localStorage.setItem(FALLBACK_KEY, JSON.stringify(all));
    }
  } catch {
    // Ignore storage quota in fallback
  }
}

function loadAllFromFallback(): SavedProjectRecord[] {
  try {
    if (typeof localStorage !== 'undefined' && memoryStore.size === 0) {
      const raw = localStorage.getItem(FALLBACK_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as SavedProjectRecord[];
        if (Array.isArray(parsed)) {
          parsed.forEach((p) => memoryStore.set(p.id, p));
        }
      }
    }
  } catch {
    // Ignore errors
  }
  return Array.from(memoryStore.values()).sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function listSavedProjects(): Promise<SavedProjectRecord[]> {
  const db = await openProjectDatabase();
  if (!db) {
    return loadAllFromFallback();
  }

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const list = (req.result as SavedProjectRecord[]) || [];
        resolve(list.sort((a, b) => b.updatedAt - a.updatedAt));
      };
      req.onerror = () => resolve(loadAllFromFallback());
    } catch {
      resolve(loadAllFromFallback());
    }
  });
}

export async function saveProjectRecord(params: {
  id?: string;
  name: string;
  config: StudioConfig;
  sourceImage: SourceImageMetadata | null;
  particleCount: number;
  thumbnailDataUrl?: string;
}): Promise<SavedProjectRecord> {
  const now = Date.now();
  const id = params.id || `proj-${now}-${Math.random().toString(36).slice(2, 7)}`;

  const record: SavedProjectRecord = {
    id,
    name: params.name.trim() || 'Untitled Particle Artwork',
    createdAt: now,
    updatedAt: now,
    config: JSON.parse(JSON.stringify(params.config)),
    sourceImage: params.sourceImage ? { ...params.sourceImage } : null,
    particleCount: params.particleCount,
    thumbnailDataUrl: params.thumbnailDataUrl,
  };

  saveToFallback(record);

  const db = await openProjectDatabase();
  if (!db) return record;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(record);
      tx.oncomplete = () => resolve(record);
      tx.onerror = () => resolve(record);
    } catch {
      resolve(record);
    }
  });
}

export async function duplicateProjectRecord(
  projectId: string
): Promise<SavedProjectRecord | null> {
  const projects = await listSavedProjects();
  const target = projects.find((p) => p.id === projectId);
  if (!target) return null;

  return saveProjectRecord({
    name: `${target.name} (Copy)`,
    config: target.config,
    sourceImage: target.sourceImage,
    particleCount: target.particleCount,
    thumbnailDataUrl: target.thumbnailDataUrl,
  });
}

export async function renameProjectRecord(
  projectId: string,
  newName: string
): Promise<SavedProjectRecord | null> {
  const projects = await listSavedProjects();
  const target = projects.find((p) => p.id === projectId);
  if (!target) return null;

  const updated: SavedProjectRecord = {
    ...target,
    name: newName.trim() || target.name,
    updatedAt: Date.now(),
  };

  saveToFallback(updated);
  const db = await openProjectDatabase();
  if (!db) return updated;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(updated);
      tx.oncomplete = () => resolve(updated);
      tx.onerror = () => resolve(updated);
    } catch {
      resolve(updated);
    }
  });
}

export async function deleteProjectRecord(projectId: string): Promise<void> {
  memoryStore.delete(projectId);
  try {
    if (typeof localStorage !== 'undefined') {
      const all = Array.from(memoryStore.values());
      localStorage.setItem(FALLBACK_KEY, JSON.stringify(all));
    }
  } catch {
    // Ignore
  }

  const db = await openProjectDatabase();
  if (!db) return;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(projectId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

/**
 * Serializes a project into a portable JSON string for file download/sharing.
 */
export function serializePortableProject(
  name: string,
  config: StudioConfig,
  sourceImage: SourceImageMetadata | null
): string {
  const payload = {
    format: 'ParticleForgeStudioProject',
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    name,
    config,
    sourceImage,
  };
  return JSON.stringify(payload, null, 2);
}

/**
 * Validates and parses an imported portable JSON project file.
 */
export function parsePortableProject(jsonStr: string): {
  name: string;
  config: StudioConfig;
  sourceImage: SourceImageMetadata | null;
} {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new Error('Invalid JSON file. Could not parse project file.');
  }

  if (
    !parsed ||
    typeof parsed !== 'object' ||
    (parsed as { format?: string }).format !== 'ParticleForgeStudioProject'
  ) {
    throw new Error('Unrecognized project file format. Expected a ParticleForge Studio (.pforge.json) file.');
  }

  const obj = parsed as {
    name?: string;
    config?: Partial<StudioConfig>;
    sourceImage?: SourceImageMetadata | null;
  };

  const mergedConfig: StudioConfig = {
    ...DEFAULT_STUDIO_CONFIG,
    ...obj.config,
    transform: { ...DEFAULT_STUDIO_CONFIG.transform, ...obj.config?.transform },
    preprocess: { ...DEFAULT_STUDIO_CONFIG.preprocess, ...obj.config?.preprocess },
    size: { ...DEFAULT_STUDIO_CONFIG.size, ...obj.config?.size },
    distribution: { ...DEFAULT_STUDIO_CONFIG.distribution, ...obj.config?.distribution },
    shape: { ...DEFAULT_STUDIO_CONFIG.shape, ...obj.config?.shape },
    color: { ...DEFAULT_STUDIO_CONFIG.color, ...obj.config?.color },
    effects: { ...DEFAULT_STUDIO_CONFIG.effects, ...obj.config?.effects },
    background: { ...DEFAULT_STUDIO_CONFIG.background, ...obj.config?.background },
    artboard: { ...DEFAULT_STUDIO_CONFIG.artboard, ...obj.config?.artboard },
    export: { ...DEFAULT_STUDIO_CONFIG.export, ...obj.config?.export },
  };

  return {
    name: typeof obj.name === 'string' && obj.name.trim() ? obj.name.trim() : 'Imported Project',
    config: mergedConfig,
    sourceImage: obj.sourceImage || null,
  };
}
