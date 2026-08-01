// =============================================================================
// Website Builder — Builder Session (Editor State)
// =============================================================================
// The editor's working state: current project + history (undo/redo) +
// autosave. Every edit goes through apply(), which records history and
// schedules an autosave — so nothing is ever lost.
// =============================================================================

import type { BuilderProject, HistoryEntry } from './types';
import { HistoryStack, cloneProject } from './history';
import { AutosaveManager } from './autosave';

export interface BuilderSessionOptions {
  historyLimit?: number;
  autosave?: AutosaveManager | null;
}

export class BuilderSession {
  private current: BuilderProject;
  private readonly history: HistoryStack;
  private readonly autosave: AutosaveManager | null;

  constructor(project: BuilderProject, options: BuilderSessionOptions = {}) {
    this.current = cloneProject(project);
    this.history = new HistoryStack(options.historyLimit ?? 50);
    this.autosave = options.autosave ?? null;
  }

  get project(): BuilderProject {
    return cloneProject(this.current);
  }

  /**
   * Apply an edit: push the previous state to history, apply the mutator,
   * schedule an autosave. Returns the new project.
   */
  apply(label: string, mutator: (project: BuilderProject) => BuilderProject): BuilderProject {
    this.history.push(this.current, label);
    this.current = mutator(this.current);
    this.current = { ...this.current, updatedAt: Date.now(), version: this.current.version + 1 };
    this.autosave?.schedule(this.current);
    return this.project;
  }

  undo(): BuilderProject | null {
    const snapshot = this.history.undo();
    if (snapshot) this.current = snapshot;
    return snapshot ? this.project : null;
  }

  redo(): BuilderProject | null {
    const snapshot = this.history.redo();
    if (snapshot) this.current = snapshot;
    return snapshot ? this.project : null;
  }

  canUndo(): boolean {
    return this.history.canUndo();
  }

  canRedo(): boolean {
    return this.history.canRedo();
  }

  historyList(): HistoryEntry[] {
    return this.history.list();
  }

  async saveNow(): Promise<BuilderProject | null> {
    if (!this.autosave) return null;
    return this.autosave.flush(this.current);
  }
}
