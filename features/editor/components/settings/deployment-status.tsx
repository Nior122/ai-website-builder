// =============================================================================
// Deployment Status Panel
// =============================================================================
// Shows deployment history for the current project. Fetches from
// GET /api/deploy?projectId=... and displays each deployment's status,
// platform, URL, and timestamp. Also provides a "Deploy" button that
// triggers a new deployment via POST /api/deploy.
//
// This component is embedded in the Domains tab of the settings panel
// (or can be rendered standalone). It uses a simple polling pattern:
// after triggering a deployment, it re-fetches every 5 seconds until
// the latest deployment reaches a terminal state (deployed/failed).
// =============================================================================

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useEditorStore } from '@/features/editor/store/editor-store';
import {
  Rocket,
  ExternalLink,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  RefreshCw,
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────

interface Deployment {
  id: string;
  platform: string;
  status: string;
  url: string | null;
  deployedAt: string | null;
  createdAt: string;
}

interface DeployResponse {
  success: boolean;
  data?: {
    deploymentId: string;
    platform: string;
    status: string;
    url: string | null;
    buildLog: string[];
  };
}

// ─── Status Helpers ────────────────────────────────────────────────────

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'deployed':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'failed':
      return <XCircle className="h-4 w-4 text-red-500" />;
    case 'building':
    case 'deploying':
      return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
    default:
      return <Clock className="h-4 w-4 text-neutral-400" />;
  }
}

function StatusLabel({ status }: { status: string }) {
  const colors: Record<string, string> = {
    deployed: 'bg-green-50 text-green-700',
    failed: 'bg-red-50 text-red-700',
    building: 'bg-blue-50 text-blue-700',
    deploying: 'bg-blue-50 text-blue-700',
    pending: 'bg-neutral-50 text-neutral-600',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
        colors[status] ?? 'bg-neutral-50 text-neutral-600'
      }`}
    >
      {status}
    </span>
  );
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ─── Component ─────────────────────────────────────────────────────────

export function DeploymentStatus() {
  const project = useEditorStore((s) => s.project);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeploying, setIsDeploying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [buildLog, setBuildLog] = useState<string[] | null>(null);

  // ── Fetch deployment history ──

  const fetchDeployments = useCallback(async () => {
    if (!project?.id) return;

    try {
      const res = await fetch(`/api/deploy?projectId=${project.id}`);
      const body = await res.json();

      if (body.success && body.data?.deployments) {
        setDeployments(body.data.deployments);
      }
    } catch {
      // Silent — don't crash the UI on fetch failure
    } finally {
      setIsLoading(false);
    }
  }, [project?.id]);

  useEffect(() => {
    fetchDeployments();
  }, [fetchDeployments]);

  // ── Trigger deployment ──

  const handleDeploy = useCallback(async () => {
    if (!project?.id || isDeploying) return;

    setIsDeploying(true);
    setError(null);
    setBuildLog(null);

    try {
      const res = await fetch('/api/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          platform: 'vercel',
        }),
      });

      const body: DeployResponse = await res.json();

      if (!body.success || !body.data) {
        setError(body.success === false ? 'Deployment failed' : 'Deployment failed');
        setIsDeploying(false);
        return;
      }

      setBuildLog(body.data.buildLog);

      // If already terminal, refresh immediately
      if (body.data.status === 'deployed' || body.data.status === 'failed') {
        setIsDeploying(false);
        fetchDeployments();
        return;
      }

      // Otherwise, poll for completion
      const pollInterval = setInterval(async () => {
        try {
          const statusRes = await fetch(`/api/deploy/${body.data!.deploymentId}`);
          const statusBody = await statusRes.json();

          if (statusBody.success && statusBody.data) {
            const s = statusBody.data.status as string;
            setBuildLog(statusBody.data.buildLog as string[]);

            if (s === 'deployed' || s === 'failed') {
              clearInterval(pollInterval);
              setIsDeploying(false);
              fetchDeployments();
            }
          }
        } catch {
          // Continue polling — transient network errors are expected
        }
      }, 5000);

      // Safety timeout: stop polling after 5 minutes
      setTimeout(() => clearInterval(pollInterval), 300000);
    } catch {
      setError('Failed to start deployment');
      setIsDeploying(false);
    }
  }, [project?.id, isDeploying, fetchDeployments]);

  // ── Render ──

  return (
    <div className="flex flex-col gap-4 p-3">
      {/* Deploy Button */}
      <section>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-medium text-neutral-700">Deploy</h3>
            <p className="text-[10px] text-neutral-400">
              Deploy your project to Vercel
            </p>
          </div>
          <button
            onClick={handleDeploy}
            disabled={isDeploying || project?.status !== 'published'}
            className="flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isDeploying ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Rocket className="h-3.5 w-3.5" />
            )}
            {isDeploying ? 'Deploying…' : 'Deploy'}
          </button>
        </div>

        {project?.status !== 'published' && (
          <p className="mt-1.5 text-[10px] text-amber-600">
            Publish your project first before deploying.
          </p>
        )}

        {error && (
          <p className="mt-1.5 text-[10px] text-red-500">{error}</p>
        )}
      </section>

      {/* Build Log (shown during/after deployment) */}
      {buildLog && buildLog.length > 0 && (
        <section>
          <label className="mb-1 block text-xs font-medium text-neutral-600">
            Build Log
          </label>
          <div className="max-h-40 overflow-y-auto rounded-md border border-neutral-200 bg-neutral-900 p-2 font-mono text-[10px] text-neutral-300">
            {buildLog.map((line, i) => (
              <div key={i} className="whitespace-pre-wrap">{line}</div>
            ))}
          </div>
        </section>
      )}

      <div className="h-px bg-neutral-200" />

      {/* Deployment History */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium text-neutral-600">
            Recent Deployments
          </span>
          <button
            onClick={() => {
              setIsLoading(true);
              fetchDeployments();
            }}
            className="text-neutral-400 hover:text-neutral-600"
            title="Refresh"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />
          </div>
        ) : deployments.length === 0 ? (
          <p className="py-4 text-center text-[10px] text-neutral-400">
            No deployments yet. Click Deploy to get started.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {deployments.map((d) => (
              <div
                key={d.id}
                className="flex items-center gap-2 rounded-md border border-neutral-100 bg-neutral-50 px-3 py-2"
              >
                <StatusIcon status={d.status} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-medium text-neutral-700 capitalize">
                      {d.platform}
                    </span>
                    <StatusLabel status={d.status} />
                  </div>
                  <span className="text-[9px] text-neutral-400">
                    {formatDate(d.deployedAt || d.createdAt)}
                  </span>
                </div>
                {d.url && (
                  <a
                    href={d.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 text-blue-500 hover:text-blue-600"
                    title={d.url}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
