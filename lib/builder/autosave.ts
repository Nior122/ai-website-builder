// =============================================================================
// Website Builder — Autosave
// =============================================================================
// Debounced autosave with crash recovery. Projects, pages, sections, theme,
// and content are persisted every few seconds. On reload, recover() restores
// the last autosaved state.
// =============================================================================

import type { BuilderProject } from './types';
import { cloneProject } from './history';

export interface StorageAdapter {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
}

export class MemoryStorageAdapter implements StorageAdapter {
  private readonly data = new Map<string, string>();

  get(key: string): string | null {
    return this.data.get(key) ?? null;
  }

  set(key: string, value: string): void {
    this.data.set(key, value);
  }

  remove(key: string): void {
    this.data.delete(key);
  }
}

export function createLocalStorageAdapter(): StorageAdapter | null {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return null;
  }
  return {
    get: (key) => window.localStorage.getItem(key),
    set: (key, value) => window.localStorage.setItem(key, value),
    remove: (key) => window.localStorage.removeItem(key),
  };
}

export interface AutosaveOptions {
  /** Flush cadence when start() is active. */
  intervalMs?: number;
  /** Debounce before a scheduled save fires. */
  debounceMs?: number;
  /** Storage key prefix. */
  key?: string;
  /** Storage adapter (memory by default; localStorage on the client). */
  storage?: StorageAdapter;
}

export class AutosaveManager {
  private readonly intervalMs: number;
  private readonly debounceMs: number;
  private readonly key: string;
  private readonly storage: StorageAdapter;
  private readonly save: (project: BuilderProject) => void | Promise<void>;

  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private intervalTimer: ReturnType<typeof setInterval> | null = null;
  private pending: BuilderProject | null = null;

  constructor(save: (project: BuilderProject) => void | Promise<void>, options: AutosaveOptions = {}) {
    this.save = save;
    this.intervalMs = options.intervalMs ?? 5000;
    this.debounceMs = options.debounceMs ?? 800;
    this.key = options.key ?? 'builder-autosave';
    this.storage = options.storage ?? new MemoryStorageAdapter();
  }

  /** Debounce-schedule a save (called on every edit). */
  schedule(project: BuilderProject): void {
    this.pending = cloneProject(project);
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      void this.flush();
    }, this.debounceMs);
  }

  /** Start the periodic flush (autosave every few seconds). */
  start(): void {
    if (this.intervalTimer) return;
    this.intervalTimer = setInterval(() => {
      void this.flush();
    }, this.intervalMs);
  }

  stop(): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    if (this.intervalTimer) clearInterval(this.intervalTimer);
    this.debounceTimer = null;
    this.intervalTimer = null;
  }

  /** Persist the pending project now (returns the saved snapshot). */
  async flush(project?: BuilderProject): Promise<BuilderProject | null> {
    const snapshot = project ?? this.pending;
    if (!snapshot) return null;
    const payload = {
      savedAt: Date.now(),
      project: cloneProject(snapshot),
    };
    this.storage.set(this.key, JSON.stringify(payload));
    await this.save(snapshot);
    this.pending = null;
    return snapshot;
  }

  /** Restore the last autosaved project (null when none/valid). */
  recover(): BuilderProject | null {
    const raw = this.storage.get(this.key);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as { savedAt: number; project: unknown };
      if (typeof parsed.savedAt !== 'number' || typeof parsed.project !== 'object' || parsed.project === null) {
        return null;
      }
      const project = parsed.project as BuilderProject;
      if (!Array.isArray(project.pages) || !project.name) return null;
      return project;
    } catch {
      return null;
    }
  }

  clearAutosave(): void {
    this.storage.remove(this.key);
    this.pending = null;
  }
}
