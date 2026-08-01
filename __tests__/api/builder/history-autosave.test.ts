// =============================================================================
// Website Builder — History & Autosave Tests
// =============================================================================
import { describe, it, expect, vi } from 'vitest';
import {
  HistoryStack,
  BuilderSession,
  AutosaveManager,
  MemoryStorageAdapter,
  createLocalStorageAdapter,
  type BuilderProject,
} from '@/lib/builder';
import { makeTestProject } from './fixtures';

describe('History Stack', () => {
  it('undoes and redoes snapshots', () => {
    const stack = new HistoryStack();
    const project = makeTestProject();
    stack.push(project, 'create');
    const edited = { ...project, name: 'Edited' };
    stack.push(edited, 'rename');

    const undone = stack.undo();
    expect(undone?.name).toBe(project.name);
    // Two states pushed, one undo step taken — the timeline is at its start.
    expect(stack.canUndo()).toBe(false);
    expect(stack.canRedo()).toBe(true);

    const redone = stack.redo();
    expect(redone?.name).toBe('Edited');
    expect(stack.list().map((entry) => entry.label)).toContain('create');
  });

  it('clears history', () => {
    const stack = new HistoryStack();
    stack.push(makeTestProject(), 'a');
    stack.push(makeTestProject(), 'b');
    stack.clear();
    expect(stack.canUndo()).toBe(false);
    expect(stack.list()).toHaveLength(0);
  });

  it('respects the limit', () => {
    const stack = new HistoryStack(3);
    for (let i = 0; i < 10; i += 1) {
      stack.push({ ...makeTestProject(), name: `v${i}` }, `v${i}`);
    }
    expect(stack.list()).toHaveLength(3);
  });
});

describe('Builder Session', () => {
  it('applies edits with history + autosave scheduling', () => {
    const autosave = new AutosaveManager(() => undefined, { storage: new MemoryStorageAdapter() });
    const session = new BuilderSession(makeTestProject(), { autosave });
    const next = session.apply('rename', (project) => ({ ...project, name: 'New Name' }));
    expect(next.name).toBe('New Name');

    const undone = session.undo();
    expect(undone?.name).not.toBe('New Name');
    const redone = session.redo();
    expect(redone?.name).toBe('New Name');
  });

  it('increments version on every edit', () => {
    const session = new BuilderSession(makeTestProject());
    const v1 = session.apply('edit', (project) => project);
    expect(v1.version).toBe(2);
  });

  it('historyList exposes labels', () => {
    const session = new BuilderSession(makeTestProject());
    session.apply('rename', (project) => ({ ...project, name: 'X' }));
    session.apply('theme', (project) => project);
    expect(session.historyList().map((entry) => entry.label)).toEqual(['rename', 'theme']);
  });
});

describe('Autosave Manager', () => {
  it('persists and recovers projects through the storage adapter', async () => {
    const storage = new MemoryStorageAdapter();
    const saved: BuilderProject[] = [];
    const manager = new AutosaveManager((project) => {
      saved.push(project);
    }, { storage, key: 'test-autosave' });

    const project = makeTestProject('Autosave Co');
    await manager.flush(project);

    expect(saved).toHaveLength(1);
    const recovered = manager.recover();
    expect(recovered?.name).toBe('Autosave Co');
    expect(recovered?.pages.length).toBe(project.pages.length);
  });

  it('schedule debounces and flush writes the latest state', async () => {
    vi.useFakeTimers();
    const storage = new MemoryStorageAdapter();
    const manager = new AutosaveManager(() => undefined, { storage, key: 'debounce-test', debounceMs: 500 });

    manager.schedule(makeTestProject('First'));
    manager.schedule(makeTestProject('Second'));
    vi.advanceTimersByTime(600);
    await vi.runAllTimersAsync();
    vi.useRealTimers();

    expect(manager.recover()?.name).toBe('Second');
  });

  it('recover returns null for garbage', () => {
    const storage = new MemoryStorageAdapter();
    storage.set('k', 'not-json');
    const manager = new AutosaveManager(() => undefined, { storage, key: 'k' });
    expect(manager.recover()).toBeNull();
  });

  it('localStorage adapter is null in a server environment', () => {
    expect(createLocalStorageAdapter()).toBeNull();
  });
});
