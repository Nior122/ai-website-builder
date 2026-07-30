// =============================================================================
// usePublish — Publish / Unpublish Client Hook
// =============================================================================
// Thin client hook that POSTs to the publish/unpublish API routes and exposes
// the resulting state to the editor toolbar. Keeps the toolbar free of fetch
// boilerplate and gives it one source of truth for the "what button do I show?"
// decision: `status`, `isPublishing`, the latest `publishedUrl`, and an error.
//
// Design notes:
//   - Optimistic-ish status: the hook returns the API's authoritative status
//     rather than guessing, but the toolbar can read `status` immediately after
//     a successful call. We deliberately do *not* write into the editor store —
//     `project.status` is the server's value (fetched on editor load) and the
//     hook's `status` is the live override. A full page refresh is the only
//     thing that resets both to the server truth; that's acceptable for a
//     state transition the user explicitly triggers.
//   - The returned `publishedUrl` is the public `/site/<slug>` URL the toolbar
//     can offer to copy / open. It is `null` after an unpublish.
//   - `ProjectStatus` is imported from the app type (the API serializes the
//     same union), so the hook's types line up with the server contract.
// =============================================================================

'use client';

import { useCallback, useState } from 'react';
import type { ProjectStatus } from '@/types';
import type { PublishResult } from '@/features/publishing/types';

interface UsePublishState {
  /** Latest known publish status (server value until a mutation succeeds). */
  status: ProjectStatus | null;
  /** True while a publish/unpublish request is in flight. */
  isPublishing: boolean;
  /** Public URL after a successful publish; `null` after unpublish / before any. */
  publishedUrl: string | null;
  /** Human-readable error from the last failed mutation, if any. */
  error: string | null;
}

interface UsePublishApi extends UsePublishState {
  /** Transition the project to `published`. Throws on failure for the caller to handle. */
  publish: (projectId: string) => Promise<PublishResult | null>;
  /** Transition the project back to `draft`. */
  unpublish: (projectId: string) => Promise<PublishResult | null>;
  /** Clear the last error (e.g. when the user dismisses it). */
  clearError: () => void;
}

/**
 * Hook the editor toolbar uses to publish / unpublish the current project.
 *
 * Initial `status` is whatever the caller passes (the server-fetched value),
 * so the toolbar renders the right button on first paint; it then tracks the
 * API's authoritative status as mutations succeed.
 */
export function usePublish(initialStatus?: ProjectStatus): UsePublishApi {
  const [state, setState] = useState<UsePublishState>({
    status: initialStatus ?? null,
    isPublishing: false,
    publishedUrl: null,
    error: null,
  });

  const clearError = useCallback(() => {
    setState((s) => ({ ...s, error: null }));
  }, []);

  const mutate = useCallback(
    async (
      projectId: string,
      action: 'publish' | 'unpublish'
    ): Promise<PublishResult | null> => {
      setState((s) => ({ ...s, isPublishing: true, error: null }));
      try {
        const res = await fetch(`/api/projects/${projectId}/${action}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        const body = (await res.json().catch(() => null)) as
          | { success: true; data: PublishResult }
          | { success: false; error?: { message?: string } }
          | null;

        if (!res.ok || !body || body.success !== true) {
          const message =
            (body && body.success === false && body.error?.message) ||
            `Failed to ${action} the project`;
          setState((s) => ({ ...s, isPublishing: false, error: message }));
          return null;
        }

        const { status, publishedUrl } = body.data;
        setState({
          status,
          isPublishing: false,
          publishedUrl,
          error: null,
        });
        return body.data;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : `Failed to ${action} the project`;
        setState((s) => ({ ...s, isPublishing: false, error: message }));
        return null;
      }
    },
    []
  );

  const publish = useCallback(
    (projectId: string) => mutate(projectId, 'publish'),
    [mutate]
  );
  const unpublish = useCallback(
    (projectId: string) => mutate(projectId, 'unpublish'),
    [mutate]
  );

  return {
    ...state,
    publish,
    unpublish,
    clearError,
  };
}
