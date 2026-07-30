// =============================================================================
// Vercel Deployment Service Tests
// =============================================================================
// Tests the Vercel deployment flow: file upload, deployment creation,
// polling for readiness, and error handling.
// =============================================================================

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ─── Mocks ─────────────────────────────────────────────────────────────

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock('@/lib/env', () => ({
  getServerEnv: () => ({
    VERCEL_TOKEN: 'test-vercel-token',
  }),
}));

// ─── Import after mocks ────────────────────────────────────────────────

import { deployToVercel, isVercelConfigured } from '@/features/deployment/services/vercel.service';
import type { ExportFile } from '@/features/export/types';

// ─── Helpers ───────────────────────────────────────────────────────────

const sampleFiles: ExportFile[] = [
  { path: 'index.html', content: '<html><body>Home</body></html>', size: 30, type: 'html' },
  { path: 'about.html', content: '<html><body>About</body></html>', size: 30, type: 'html' },
  { path: 'styles.css', content: 'body { margin: 0; }', size: 20, type: 'css' },
];

function mockDeploymentCreate(id: string, url: string) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      id,
      url,
      readyState: 'QUEUED',
      created: new Date().toISOString(),
    }),
  });
}

function mockDeploymentStatus(id: string, readyState: string, url?: string) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      id,
      readyState,
      url: url || 'project.vercel.app',
      errorMessage: readyState === 'ERROR' ? 'Build failed' : undefined,
    }),
  });
}

// ─── Setup ─────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

// ─── Tests ─────────────────────────────────────────────────────────────

describe('VercelService', () => {
  describe('isVercelConfigured', () => {
    it('returns true when token is set', () => {
      expect(isVercelConfigured()).toBe(true);
    });
  });

  describe('deployToVercel', () => {
    it('creates deployment and returns success on READY status', async () => {
      mockDeploymentCreate('dpl_abc', 'project-abc.vercel.app');
      mockDeploymentStatus('dpl_abc', 'READY', 'project-abc.vercel.app');

      const resultPromise = deployToVercel({
        projectName: 'my-project',
        files: sampleFiles,
      });

      // Advance past the first sleep
      await vi.advanceTimersByTimeAsync(6000);
      const result = await resultPromise;

      expect(result.status).toBe('deployed');
      expect(result.deploymentId).toBe('dpl_abc');
      expect(result.url).toBe('https://project-abc.vercel.app');
      expect(result.buildLog.length).toBeGreaterThan(0);
    });

    it('returns failed when deployment creation fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 402,
        json: async () => ({
          error: { message: 'Payment required' },
        }),
      });

      const result = await deployToVercel({
        projectName: 'my-project',
        files: sampleFiles,
      });

      expect(result.status).toBe('failed');
      expect(result.deploymentId).toBe('');
      expect(result.url).toBe('');
    });

    it('returns failed when build errors out', async () => {
      mockDeploymentCreate('dpl_err', 'project.vercel.app');
      mockDeploymentStatus('dpl_err', 'ERROR');

      const resultPromise = deployToVercel({
        projectName: 'my-project',
        files: sampleFiles,
      });

      await vi.advanceTimersByTimeAsync(6000);
      const result = await resultPromise;

      expect(result.status).toBe('failed');
      expect(result.deploymentId).toBe('dpl_err');
    });

    it('includes custom domain when provided', async () => {
      mockDeploymentCreate('dpl_custom', 'custom.vercel.app');
      mockDeploymentStatus('dpl_custom', 'READY', 'custom.vercel.app');

      const resultPromise = deployToVercel({
        projectName: 'my-project',
        files: sampleFiles,
        customDomain: 'myapp.com',
      });

      await vi.advanceTimersByTimeAsync(6000);
      const result = await resultPromise;

      // Verify the deployment body included the alias
      const createCall = mockFetch.mock.calls[0];
      const body = JSON.parse(createCall[1].body);
      expect(body.alias).toEqual(['myapp.com']);
      expect(result.status).toBe('deployed');
    });

    it('handles network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await deployToVercel({
        projectName: 'my-project',
        files: sampleFiles,
      });

      expect(result.status).toBe('failed');
      expect(result.buildLog.some((l) => l.includes('Network error'))).toBe(true);
    });

    it('sends correct headers with authorization', async () => {
      mockDeploymentCreate('dpl_h', 'h.vercel.app');
      mockDeploymentStatus('dpl_h', 'READY', 'h.vercel.app');

      const resultPromise = deployToVercel({
        projectName: 'test-proj',
        files: sampleFiles,
      });

      await vi.advanceTimersByTimeAsync(6000);
      await resultPromise;

      const headers = mockFetch.mock.calls[0][1].headers;
      expect(headers.Authorization).toBe('Bearer test-vercel-token');
    });

    it('converts files to base64 encoding', async () => {
      mockDeploymentCreate('dpl_b64', 'b64.vercel.app');
      mockDeploymentStatus('dpl_b64', 'READY', 'b64.vercel.app');

      const resultPromise = deployToVercel({
        projectName: 'b64-proj',
        files: sampleFiles,
      });

      await vi.advanceTimersByTimeAsync(6000);
      await resultPromise;

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.files).toHaveLength(3);
      expect(body.files[0].encoding).toBe('base64');
      expect(body.files[0].file).toBe('index.html');
    });
  });
});
