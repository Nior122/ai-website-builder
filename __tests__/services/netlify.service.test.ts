// =============================================================================
// Netlify Deployment Service Tests
// =============================================================================
// Tests the Netlify deployment flow: site creation, file hashing,
// deploy creation, file upload, polling, and error handling.
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
    NETLIFY_AUTH_TOKEN: 'test-netlify-token',
  }),
}));

// Mock crypto so sha1() doesn't use a dynamic import (which hangs with fake timers)
vi.mock('crypto', () => ({
  createHash: () => ({
    update: () => ({ digest: () => 'a'.repeat(40) }),
  }),
}));

// ─── Import after mocks ────────────────────────────────────────────────

import { deployToNetlify, isNetlifyConfigured } from '@/features/deployment/services/netlify.service';
import type { ExportFile } from '@/features/export/types';

// ─── Helpers ───────────────────────────────────────────────────────────

const sampleFiles: ExportFile[] = [
  { path: 'index.html', content: '<html><body>Home</body></html>', size: 30, type: 'html' },
  { path: 'about.html', content: '<html><body>About</body></html>', size: 30, type: 'html' },
];

function mockSiteCreate(id: string, name: string) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      id,
      name,
      url: `https://${name}.netlify.app`,
      ssl_url: `https://${name}.netlify.app`,
      subdomain: name,
    }),
  });
}

function mockDeployCreate(id: string, state: string, required?: Array<{ id: string; path: string }>) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      id,
      site_id: 'site_abc',
      state,
      url: 'https://deploy.netlify.app',
      ssl_url: 'https://deploy.netlify.app',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      required: required || [],
    }),
  });
}

function mockDeployStatus(id: string, state: string) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      id,
      site_id: 'site_abc',
      state,
      url: 'https://deploy.netlify.app',
      ssl_url: 'https://deploy.netlify.app',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
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

describe('NetlifyService', () => {
  describe('isNetlifyConfigured', () => {
    it('returns true when token is set', () => {
      expect(isNetlifyConfigured()).toBe(true);
    });
  });

  describe('deployToNetlify', () => {
    it('creates site + deploy and returns success on ready', async () => {
      mockSiteCreate('site_abc', 'my-project');
      mockDeployCreate('dep_123', 'ready', []);
      mockDeployStatus('dep_123', 'ready');

      const resultPromise = deployToNetlify({
        projectName: 'my-project',
        files: sampleFiles,
      });

      await vi.advanceTimersByTimeAsync(6000);
      const result = await resultPromise;

      expect(result.status).toBe('deployed');
      expect(result.deploymentId).toBe('dep_123');
      expect(result.url).toBe('https://deploy.netlify.app');
      expect(result.buildLog.length).toBeGreaterThan(0);
    }, 15000);

    it('uses existing siteId when provided', async () => {
      mockDeployCreate('dep_existing', 'ready', []);
      mockDeployStatus('dep_existing', 'ready');

      const resultPromise = deployToNetlify({
        projectName: 'my-project',
        files: sampleFiles,
        siteId: 'existing_site_123',
      });

      await vi.advanceTimersByTimeAsync(6000);
      const result = await resultPromise;

      expect(result.status).toBe('deployed');
      // Should not have called site creation (only deploy + poll)
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('returns failed when site creation fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 422,
        json: async () => ({
          message: 'Site name already exists',
        }),
      });

      const result = await deployToNetlify({
        projectName: 'existing-site',
        files: sampleFiles,
      });

      expect(result.status).toBe('failed');
      expect(result.deploymentId).toBe('');
    });

    it('returns failed when deploy creation fails', async () => {
      mockSiteCreate('site_new', 'new-proj');
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          message: 'Invalid deploy configuration',
        }),
      });

      const result = await deployToNetlify({
        projectName: 'new-proj',
        files: sampleFiles,
      });

      expect(result.status).toBe('failed');
    });

    it('uploads required files when Netlify requests them', async () => {
      mockSiteCreate('site_up', 'upload-proj');
      mockDeployCreate('dep_up', 'new', [
        { id: 'hash1', path: '/index.html' },
      ]);
      // Upload response
      mockFetch.mockResolvedValueOnce({ ok: true });
      // Poll status → ready
      mockDeployStatus('dep_up', 'ready');

      const resultPromise = deployToNetlify({
        projectName: 'upload-proj',
        files: sampleFiles,
      });

      await vi.advanceTimersByTimeAsync(6000);
      const result = await resultPromise;

      expect(result.status).toBe('deployed');
      // site create + deploy create + file upload + poll
      expect(mockFetch).toHaveBeenCalledTimes(4);
    });

    it('returns errored status when deploy fails', async () => {
      mockSiteCreate('site_err', 'err-proj');
      mockDeployCreate('dep_err', 'new', []);
      mockDeployStatus('dep_err', 'errored');

      const resultPromise = deployToNetlify({
        projectName: 'err-proj',
        files: sampleFiles,
      });

      await vi.advanceTimersByTimeAsync(6000);
      const result = await resultPromise;

      expect(result.status).toBe('failed');
      expect(result.deploymentId).toBe('dep_err');
    });

    it('handles network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('ECONNREFUSED'));

      const result = await deployToNetlify({
        projectName: 'net-err',
        files: sampleFiles,
      });

      expect(result.status).toBe('failed');
      expect(result.buildLog.some((l) => l.includes('ECONNREFUSED'))).toBe(true);
    });

    it('sends correct auth headers', async () => {
      mockSiteCreate('site_h', 'h-proj');
      mockDeployCreate('dep_h', 'ready', []);
      mockDeployStatus('dep_h', 'ready');

      const resultPromise = deployToNetlify({
        projectName: 'h-proj',
        files: sampleFiles,
      });

      await vi.advanceTimersByTimeAsync(6000);
      await resultPromise;

      const headers = mockFetch.mock.calls[0][1].headers;
      expect(headers.Authorization).toBe('Bearer test-netlify-token');
    });
  });
});
