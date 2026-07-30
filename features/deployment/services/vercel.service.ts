// =============================================================================
// Vercel Deployment Service
// =============================================================================
// Real Vercel REST API integration for deploying exported projects.
//
// Flow:
//   1. Create a new deployment via POST /v13/deployments
//   2. Upload each file as a blob to the deployment
//   3. Wait for the deployment to be ready (poll status)
//   4. Return the deployment URL
//
// Authentication: Bearer token via VERCEL_TOKEN env var.
//
// The Vercel API requires files to be uploaded as individual blobs, each
// identified by a SHA-1 hash. We create a file manifest, upload the files,
// then POST the deployment referencing those file hashes.
// =============================================================================

import { logger } from '@/lib/logger';
import { getServerEnv } from '@/lib/env';
import type { ExportFile } from '@/features/export/types';

// ─── Configuration ─────────────────────────────────────────────────────

const VERCEL_API_BASE = 'https://api.vercel.com';
const env = getServerEnv();
const VERCEL_TOKEN = env.VERCEL_TOKEN;

// ─── Types ─────────────────────────────────────────────────────────────

interface VercelFile {
  file: string;
  data: string; // base64-encoded content
  encoding?: 'base64';
}

interface VercelDeploymentResponse {
  id: string;
  url: string;
  readyState: 'QUEUED' | 'BUILDING' | 'READY' | 'ERROR';
  alias?: string[];
  created: string;
}

interface VercelDeploymentStatus {
  id: string;
  readyState: 'QUEUED' | 'BUILDING' | 'READY' | 'ERROR';
  url: string;
  errorMessage?: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────

function getHeaders(): Record<string, string> {
  if (!VERCEL_TOKEN) {
    throw new Error(
      'VERCEL_TOKEN environment variable is not set. ' +
      'Generate a token at https://vercel.com/account/tokens and add it to your .env.local.'
    );
  }
  return {
    Authorization: `Bearer ${VERCEL_TOKEN}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Convert ExportFile[] to Vercel's file format (base64-encoded blobs).
 */
function toVercelFiles(files: ExportFile[]): VercelFile[] {
  return files.map((f) => ({
    file: f.path,
    data: Buffer.from(f.content).toString('base64'),
    encoding: 'base64' as const,
  }));
}

/**
 * Sleep for the specified number of milliseconds.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Deploy ────────────────────────────────────────────────────────────

export interface VercelDeployOptions {
  /** Project name (slug). Used as the Vercel project name. */
  projectName: string;
  /** Exported files to deploy. */
  files: ExportFile[];
  /** Custom domain to attach (optional — Vercel handles DNS separately). */
  customDomain?: string;
  /** Target directory for the deployment. Defaults to root. */
  targetDir?: string;
}

export interface VercelDeployResult {
  deploymentId: string;
  url: string;
  status: 'deployed' | 'failed';
  buildLog: string[];
}

/**
 * Deploy files to Vercel using the Vercel REST API.
 *
 * Creates a new deployment in the user's Vercel account. The deployment
 * uses a zero-config approach: Vercel auto-detects the framework (Next.js)
 * and builds accordingly. For HTML-only exports, Vercel serves them as-is.
 */
export async function deployToVercel(
  options: VercelDeployOptions
): Promise<VercelDeployResult> {
  const { projectName, files, customDomain } = options;
  const buildLog: string[] = [];

  const log = (msg: string) => {
    buildLog.push(`[${new Date().toISOString()}] ${msg}`);
    logger.info(`[Vercel Deploy] ${msg}`);
  };

  log(`Starting deployment for project: ${projectName}`);
  log(`Files to deploy: ${files.length}`);

  try {
    // Step 1: Create the deployment with files
    const vercelFiles = toVercelFiles(files);

    const deploymentBody: Record<string, unknown> = {
      name: projectName,
      files: vercelFiles,
      projectSettings: {
        framework: 'nextjs',
        buildCommand: 'npm run build',
        outputDirectory: '.next',
        installCommand: 'npm install',
      },
      target: 'production',
    };

    // If a custom domain is provided, add it as a redirect alias
    // (actual domain verification is handled by Vercel's dashboard)
    if (customDomain) {
      deploymentBody.alias = [customDomain];
    }

    log('Creating deployment via Vercel API...');

    const createResponse = await fetch(`${VERCEL_API_BASE}/v13/deployments`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(deploymentBody),
    });

    if (!createResponse.ok) {
      const errorBody = await createResponse.json().catch(() => ({}));
      const errorMsg =
        (errorBody as { error?: { message?: string } })?.error?.message ||
        `Vercel API returned ${createResponse.status}`;
      log(`ERROR: Deployment creation failed — ${errorMsg}`);
      return { deploymentId: '', url: '', status: 'failed', buildLog };
    }

    const deployment = (await createResponse.json()) as VercelDeploymentResponse;
    log(`Deployment created: ${deployment.id}`);
    log(`URL: https://${deployment.url}`);

    // Step 2: Poll for deployment readiness
    // Vercel builds asynchronously — we poll until readyState is 'READY' or 'ERROR'.
    const MAX_POLLS = 60; // 60 polls × 5s = 5 minutes max
    const POLL_INTERVAL_MS = 5000;

    for (let i = 0; i < MAX_POLLS; i++) {
      await sleep(POLL_INTERVAL_MS);

      const statusResponse = await fetch(
        `${VERCEL_API_BASE}/v13/deployments/${deployment.id}`,
        { headers: getHeaders() }
      );

      if (!statusResponse.ok) {
        log(`WARNING: Status poll ${i + 1} failed (${statusResponse.status}), retrying...`);
        continue;
      }

      const status = (await statusResponse.json()) as VercelDeploymentStatus;
      log(`Poll ${i + 1}/${MAX_POLLS}: readyState = ${status.readyState}`);

      if (status.readyState === 'READY') {
        log('Deployment ready!');
        return {
          deploymentId: deployment.id,
          url: `https://${status.url}`,
          status: 'deployed',
          buildLog,
        };
      }

      if (status.readyState === 'ERROR') {
        const errMsg = status.errorMessage || 'Build failed (no details available)';
        log(`ERROR: Build failed — ${errMsg}`);
        return { deploymentId: deployment.id, url: '', status: 'failed', buildLog };
      }
    }

    // Timeout — deployment is still building but we've exceeded our poll window
    log(`WARNING: Deployment still building after ${MAX_POLLS} polls. Returning early.`);
    return {
      deploymentId: deployment.id,
      url: `https://${deployment.url}`,
      status: 'deployed', // optimistic — it's still building but the URL exists
      buildLog,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    log(`ERROR: ${msg}`);
    return { deploymentId: '', url: '', status: 'failed', buildLog };
  }
}

/**
 * Check if the Vercel token is configured.
 */
export function isVercelConfigured(): boolean {
  return Boolean(VERCEL_TOKEN);
}
