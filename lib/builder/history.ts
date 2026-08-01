// =============================================================================
// Website Builder — History (Undo / Redo / Versions)
// =============================================================================
// Undo, redo, version history, and restore. Snapshots are deep-cloned so
// history entries are immutable. The BuilderSession in store.ts wires this
// stack to every edit operation.
// =============================================================================

import { nanoid } from 'nanoid';
import type { BuilderProject, HistoryEntry } from './types';

interface Snapshot {
  entry: HistoryEntry;
  project: BuilderProject;
}

export class HistoryStack {
  private states: Snapshot[] = [];
  private index = -1;

  constructor(private readonly limit = 50) {}

  /**
   * Push a state onto the timeline. States pushed while a redo branch exists
   * discard that branch (standard linear history). Undo/redo move an index,
   * so every snapshot is immutable and reusable.
   */
  push(project: BuilderProject, label: string): void {
    this.states = this.states.slice(0, this.index + 1);
    this.states.push({
      entry: { id: nanoid(), label, createdAt: Date.now() },
      project: cloneProject(project),
    });
    if (this.states.length > this.limit) {
      this.states.shift();
    }
    this.index = this.states.length - 1;
  }

  undo(): BuilderProject | null {
    if (this.index <= 0) return null;
    this.index -= 1;
    return cloneProject(this.states[this.index].project);
  }

  redo(): BuilderProject | null {
    if (this.index >= this.states.length - 1) return null;
    this.index += 1;
    return cloneProject(this.states[this.index].project);
  }

  list(): HistoryEntry[] {
    return this.states.slice(0, this.index + 1).map((snapshot) => snapshot.entry);
  }

  canUndo(): boolean {
    return this.index > 0;
  }

  canRedo(): boolean {
    return this.index < this.states.length - 1;
  }

  clear(): void {
    this.states = [];
    this.index = -1;
  }
}

export function cloneProject(project: BuilderProject): BuilderProject {
  return JSON.parse(JSON.stringify(project)) as BuilderProject;
}
