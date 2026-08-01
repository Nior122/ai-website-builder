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
  private undoStack: Snapshot[] = [];
  private redoStack: Snapshot[] = [];

  constructor(private readonly limit = 50) {}

  /** Push the PREVIOUS state so the user can undo back to it. */
  push(project: BuilderProject, label: string): void {
    const snapshot: Snapshot = {
      entry: { id: nanoid(), label, createdAt: Date.now() },
      project: cloneProject(project),
    };
    this.undoStack.push(snapshot);
    if (this.undoStack.length > this.limit) {
      this.undoStack.shift();
    }
    this.redoStack = [];
  }

  undo(): BuilderProject | null {
    const snapshot = this.undoStack.pop();
    if (!snapshot) return null;
    this.redoStack.push(snapshot);
    return cloneProject(snapshot.project);
  }

  redo(): BuilderProject | null {
    const snapshot = this.redoStack.pop();
    if (!snapshot) return null;
    this.undoStack.push(snapshot);
    return cloneProject(snapshot.project);
  }

  list(): HistoryEntry[] {
    return this.undoStack.map((snapshot) => snapshot.entry);
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }
}

export function cloneProject(project: BuilderProject): BuilderProject {
  return JSON.parse(JSON.stringify(project)) as BuilderProject;
}
