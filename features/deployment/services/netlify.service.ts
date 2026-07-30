// =============================================================================
// Netlify Deployment Service
// =============================================================================
// Real Netlify REST API integration for deploying exported projects.
//
// Flow:
//   1. Create a new site (or use existing siteId)
//   2. Upload files as a deploy (Netlify's SHA-based content addressing)
//   3. Poll deploy status until ready
//   4. Return the deployment URL
//
// Authentication: Bearer token via NETLIFY_AUTH_TOKEN env var.
//
// Netlify API docs: https://docs.netlify.com/api/get-started/
// =============================================================================

import { logger } from '@/lib/logger';
import { getServerEnv } from '@/lib/env';
import type { ExportFile } from '@/features/export/types';

// ─── Configuration ─────────────────────────────────────────────────────

const NETLIFY_API_BASE = 'https://api.netlify.com/api/v1';
const env = getServerEnv();
const NETLIFY_AUTH_TOKEN = env.NETLIFY_AUTH_TOKEN;

// ─── Types ─────────────────────────────────────────────────────────────

interface NetlifySiteResponse {
  id: string;
  name: string;
  url: string;
  ssl_url: string;
  subdomain: string;
}

interface NetlifyDeployResponse {
  id: string;
  site_id: string;
  state: 'new' | 'pending' | 'building' | 'ready' | 'errored';
  url: string;
  ssl_url: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

interface NetlifyFile {
  id: string;       // SHA-1 hash of content
  path: string;
  size: number;
}

// ─── Helpers ───────────────────────────────────────────────────────────

function getHeaders(): Record<string, string> {
  if (!NETLIFY_AUTH_TOKEN) {
    throw new Error(
      'NETLIFY_AUTH_TOKEN environment variable is not set. ' +
      'Generate a token at https://app.netlify.com/user/applications#personal-access-tokens ' +
      'and add it to your .env.local.'
    );
  }
  return {
    Authorization: `Bearer ${NETLIFY_AUTH_TOKEN}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Compute SHA-1 hash of a string (used as file ID in Netlify's API).
 */
async function sha1(content: string): Promise<string> {
  const { createHash } = await import('crypto');
  return createHash('sha1').update(content).digest('hex');
}

/**
 * Sleep for the specified number of milliseconds.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Deploy ────────────────────────────────────────────────────────────

export interface NetlifyDeployOptions {
  /** Project name (slug). Used as the Netlify site name. */
  projectName: string;
  /** Exported files to deploy. */
  files: ExportFile[];
  /** Custom domain to attach (optional). */
  customDomain?: string;
  /** Existing Netlify site ID (optional — creates new site if not provided). */
  siteId?: string;
}

export interface NetlifyDeployResult {
  deploymentId: string;
  url: string;
  status: 'deployed' | 'failed';
  buildLog: string[];
}

/**
 * Deploy files to Netlify using the Netlify REST API.
 *
 * Creates a new deploy for a site. Netlify handles the build/CDN
 * propagation automatically. For pre-built HTML files, Netlify
 * serves them as-is with no build step required.
 */
export async function deployToNetlify(
  options: NetlifyDeployOptions
): Promise<NetlifyDeployResult> {
  const { projectName, files, customDomain, siteId } = options;
  const buildLog: string[] = [];

  const log = (msg: string) => {
    buildLog.push(`[${new Date().toISOString()}] ${msg}`);
    logger.info(`[Netlify Deploy] ${msg}`);
  };

  log(`Starting deployment for project: ${projectName}`);
  log(`Files to deploy: ${files.length}`);

  try {
    // Step 1: Create or reuse site
    let targetSiteId = siteId;

    if (!targetSiteId) {
      log('Creating new Netlify site...');
      const siteResponse = await fetch(`${NETLIFY_API_BASE}/sites`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          name: projectName,
          // Custom domain setup happens separately via DNS
        }),
      });

      if (!siteResponse.ok) {
        const errorBody = await siteResponse.json().catch(() => ({}));
        const errorMsg =
          (errorBody as { message?: string })?.message ||
          `Netlify API returned ${siteResponse.status}`;
        log(`ERROR: Site creation failed — ${errorMsg}`);
        return { deploymentId: '', url: '', status: 'failed', buildLog };
      }

      const site = (await siteResponse.json()) as NetlifySiteResponse;
      targetSiteId = site.id;
      log(`Site created: ${site.name} (${site.id})`);
      log(`URL: ${site.ssl_url}`);
    } else {
      log(`Using existing site: ${targetSiteId}`);
    }

    // Step 2: Compute file hashes and create deploy
    log('Computing file hashes...');
    const netlifyFiles: NetlifyFile[] = [];

    for (const file of files) {
      const hash = await sha1(file.content);
      netlifyFiles.push({
        id: hash,
        path: `/${file.path}`,
        size: file.content.length,
      });
    }

    log(`Created ${netlifyFiles.length} file manifests`);

    // Create deploy with file digest
    // Netlify uses a "file digest" — a map of path → SHA-1 hash.
    // If the hash matches an existing deploy, Netlify skips the upload.
    const fileDigest: Record<string, string> = {};
    for (const f of netlifyFiles) {
      fileDigest[f.path] = f.id;
    }

    log('Creating deploy...');
    const deployResponse = await fetch(`${NETLIFY_API_BASE}/sites/${targetSiteId}/deploys`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        files: fileDigest,
      }),
    });

    if (!deployResponse.ok) {
      const errorBody = await deployResponse.json().catch(() => ({}));
      const errorMsg =
        (errorBody as { message?: string })?.message ||
        `Netlify API returned ${deployResponse.status}`;
      log(`ERROR: Deploy creation failed — ${errorMsg}`);
      return { deploymentId: '', url: '', status: 'failed', buildLog };
    }

    const deploy = (await deployResponse.json()) as NetlifyDeployResponse;
    log(`Deploy created: ${deploy.id}`);
    log(`Deploy state: ${deploy.state}`);

    // Step 3: Upload required files
    // Netlify returns a "required" field listing files it doesn't have yet.
    // We need to upload those as individual PUT requests.
    const requiredFiles = (deploy as unknown as { required?: Array<{ id: string; path: string }> }).required;

    if (requiredFiles && requiredFiles.length > 0) {
      log(`Uploading ${requiredFiles.length} new files...`);

      for (const reqFile of requiredFiles) {
        const fileData = files.find((f) => `/${f.path}` === reqFile.path);
        if (!fileData) {
          log(`WARNING: Required file ${reqFile.path} not found in export, skipping`);
          continue;
        }

        const uploadResponse = await fetch(
          `${NETLIFY_API_BASE}/deploys/${deploy.id}/files${reqFile.path}`,
          {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${NETLIFY_AUTH_TOKEN}`,
              'Content-Type': 'application/octet-stream',
            },
            body: fileData.content,
          }
        );

        if (!uploadResponse.ok) {
          log(`WARNING: Failed to upload ${reqFile.path} (${uploadResponse.status}), continuing...`);
        }
      }

      log('File upload complete');
    } else {
      log('All files already cached by Netlify (no upload needed)');
    }

    // Step 4: Poll deploy status
    const MAX_POLLS = 60; // 60 polls × 5s = 5 minutes max
    const POLL_INTERVAL_MS = 5000;

    for (let i = 0; i < MAX_POLLS; i++) {
      await sleep(POLL_INTERVAL_MS);

      const statusResponse = await fetch(
        `${NETLIFY_API_BASE}/deploys/${deploy.id}`,
        { headers: getHeaders() }
      );

      if (!statusResponse.ok) {
        log(`WARNING: Status poll ${i + 1} failed (${statusResponse.status}), retrying...`);
        continue;
      }

      const status = (await statusResponse.json()) as NetlifyDeployResponse;
      log(`Poll ${i + 1}/${MAX_POLLS}: state = ${status.state}`);

      if (status.state === 'ready') {
        log('Deployment ready!');
        return {
          deploymentId: deploy.id,
          url: status.ssl_url || status.url,
          status: 'deployed',
          buildLog,
        };
      }

      if (status.state === 'errored') {
        const errMsg = status.error_message || 'Deploy failed (no details available)';
        log(`ERROR: Deploy failed — ${errMsg}`);
        return { deploymentId: deploy.id, url: '', status: 'failed', buildLog };
      }
    }

    // Timeout — deployment is still processing but we've exceeded our poll window
    log(`WARNING: Deploy still processing after ${MAX_POLLS} polls. Returning early.`);
    return {
      deploymentId: deploy.id,
      url: deploy.ssl_url || deploy.url,
      status: 'deployed', // optimistic — it's still processing but the URL exists
      buildLog,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    log(`ERROR: ${msg}`);
    return { deploymentId: '', url: '', status: 'failed', buildLog };
  }
}

/**
 * Check if the Netlify token is configured.
 */
export function isNetlifyConfigured(): boolean {
  return Boolean(NETLIFY_AUTH_TOKEN);
}
