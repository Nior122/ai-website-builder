// =============================================================================
// Analytics Tracking Service Tests
// =============================================================================
// Tests for event ingestion, device detection, and analytics aggregation.
// =============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { trackEvent, getProjectAnalytics } from '@/features/analytics/services/tracking.service';

// ─── Mocks ─────────────────────────────────────────────────────────────

vi.mock('@/lib/prisma/client', () => ({
  default: {
    analyticsEvent: {
      create: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

vi.mock('@/lib/redis/cache', () => ({
  cacheGetOrSet: vi.fn((_key: string, fn: () => Promise<any>) => fn()),
  cacheKeys: {
    analytics: (id: string, period: string) => `analytics:${id}:${period}`,
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

// ─── Tests ─────────────────────────────────────────────────────────────

describe('TrackingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('trackEvent', () => {
    it('should create an analytics event', async () => {
      const { default: prisma } = await import('@/lib/prisma/client');
      (prisma.analyticsEvent.create as any).mockResolvedValue({ id: 'evt-1' });

      const result = await trackEvent({
        projectId: 'proj-1',
        eventType: 'page_view',
        path: '/home',
        userAgent: 'Mozilla/5.0 Chrome/120',
        ip: '127.0.0.1',
      });

      expect(result).toBe(true);
      expect(prisma.analyticsEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          projectId: 'proj-1',
          eventType: 'page_view',
          path: '/home',
          ip: '127.0.0.1',
          device: 'desktop',
          browser: 'Chrome',
        }),
      });
    });

    it('should detect mobile devices', async () => {
      const { default: prisma } = await import('@/lib/prisma/client');
      (prisma.analyticsEvent.create as any).mockResolvedValue({ id: 'evt-2' });

      await trackEvent({
        projectId: 'proj-1',
        eventType: 'page_view',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) AppleWebKit/605.1.15',
      });

      expect(prisma.analyticsEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ device: 'mobile' }),
        })
      );
    });

    it('should detect tablet devices', async () => {
      const { default: prisma } = await import('@/lib/prisma/client');
      (prisma.analyticsEvent.create as any).mockResolvedValue({ id: 'evt-3' });

      await trackEvent({
        projectId: 'proj-1',
        eventType: 'page_view',
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0) AppleWebKit/605.1.15',
      });

      expect(prisma.analyticsEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ device: 'tablet' }),
        })
      );
    });

    it('should detect browsers', async () => {
      const { default: prisma } = await import('@/lib/prisma/client');
      (prisma.analyticsEvent.create as any).mockResolvedValue({ id: 'evt-4' });

      // Firefox
      await trackEvent({
        projectId: 'proj-1',
        eventType: 'page_view',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; rv:121.0) Gecko/20100101 Firefox/121.0',
      });

      expect(prisma.analyticsEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ browser: 'Firefox' }),
        })
      );
    });

    it('should detect Edge browser', async () => {
      const { default: prisma } = await import('@/lib/prisma/client');
      (prisma.analyticsEvent.create as any).mockResolvedValue({ id: 'evt-5' });

      await trackEvent({
        projectId: 'proj-1',
        eventType: 'page_view',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Edg/120.0',
      });

      expect(prisma.analyticsEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ browser: 'Edge' }),
        })
      );
    });

    it('should default to desktop for unknown user agents', async () => {
      const { default: prisma } = await import('@/lib/prisma/client');
      (prisma.analyticsEvent.create as any).mockResolvedValue({ id: 'evt-6' });

      await trackEvent({
        projectId: 'proj-1',
        eventType: 'page_view',
        userAgent: undefined,
      });

      expect(prisma.analyticsEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ device: 'desktop', browser: null }),
        })
      );
    });

    it('should return false on database error', async () => {
      const { default: prisma } = await import('@/lib/prisma/client');
      (prisma.analyticsEvent.create as any).mockRejectedValue(new Error('DB error'));

      const result = await trackEvent({
        projectId: 'proj-1',
        eventType: 'page_view',
      });

      expect(result).toBe(false);
    });

    it('should include custom event data', async () => {
      const { default: prisma } = await import('@/lib/prisma/client');
      (prisma.analyticsEvent.create as any).mockResolvedValue({ id: 'evt-7' });

      await trackEvent({
        projectId: 'proj-1',
        eventType: 'click',
        path: '/pricing',
        data: { buttonId: 'cta-1', section: 'hero' },
      });

      expect(prisma.analyticsEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            data: expect.objectContaining({
              buttonId: 'cta-1',
              section: 'hero',
            }),
          }),
        })
      );
    });
  });

  describe('getProjectAnalytics', () => {
    it('should return analytics dashboard data', async () => {
      const { default: prisma } = await import('@/lib/prisma/client');
      (prisma.analyticsEvent.count as any).mockResolvedValue(150);
      (prisma.analyticsEvent.groupBy as any)
        .mockResolvedValueOnce([{ ip: '1.1.1.1' }, { ip: '2.2.2.2' }])  // unique visitors
        .mockResolvedValueOnce([{ path: '/', _count: { id: 100 } }])     // top pages
        .mockResolvedValueOnce([{ referrer: 'https://google.com', _count: { id: 50 } }]) // traffic
        .mockResolvedValueOnce([                                            // devices
          { device: 'desktop', _count: { id: 90 } },
          { device: 'mobile', _count: { id: 50 } },
          { device: 'tablet', _count: { id: 10 } },
        ]);
      (prisma.analyticsEvent.findMany as any).mockResolvedValue([]);

      const result = await getProjectAnalytics('proj-1', '30d');

      expect(result.pageViews).toBe(150);
      expect(result.uniqueVisitors).toBe(2);
      expect(result.topPages).toHaveLength(1);
      expect(result.topPages[0].path).toBe('/');
      expect(result.trafficSources.length).toBeGreaterThan(0);
      expect(result.deviceBreakdown.desktop).toBe(90);
      expect(result.deviceBreakdown.mobile).toBe(50);
      expect(result.timeSeriesData).toBeDefined();
    });

    it('should return zeroed analytics for no data', async () => {
      const { default: prisma } = await import('@/lib/prisma/client');
      (prisma.analyticsEvent.count as any).mockResolvedValue(0);
      (prisma.analyticsEvent.groupBy as any)
        .mockResolvedValue([])
        .mockResolvedValue([])
        .mockResolvedValue([])
        .mockResolvedValue([]);
      (prisma.analyticsEvent.findMany as any).mockResolvedValue([]);

      const result = await getProjectAnalytics('proj-empty', '7d');

      expect(result.pageViews).toBe(0);
      expect(result.uniqueVisitors).toBe(0);
      expect(result.bounceRate).toBe(0);
      expect(result.avgSessionDuration).toBe(0);
      expect(result.topPages).toHaveLength(0);
    });

    it('should include Direct as top traffic source when no referrals', async () => {
      const { default: prisma } = await import('@/lib/prisma/client');
      (prisma.analyticsEvent.count as any).mockResolvedValue(100);
      (prisma.analyticsEvent.groupBy as any)
        .mockResolvedValueOnce([{ ip: '1.1.1.1' }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])  // no referrers
        .mockResolvedValueOnce([]);
      (prisma.analyticsEvent.findMany as any).mockResolvedValue([]);

      const result = await getProjectAnalytics('proj-1', '30d');

      expect(result.trafficSources[0].source).toBe('Direct');
      expect(result.trafficSources[0].visitors).toBe(100);
    });
  });
});
