// =============================================================================
// Analytics Service Tests
// =============================================================================
// Unit tests for the real analytics service backed by AnalyticsEvent rows.
// Mocks Prisma and cache to test aggregation queries without a real database.
// =============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';

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
  cacheGetOrSet: vi.fn((_key: string, fn: () => Promise<unknown>) => fn()),
  cacheKeys: {
    analytics: (projectId: string, period: string) =>
      `analytics:${projectId}:${period}`,
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// ─── Imports (after mocks) ─────────────────────────────────────────────

import { trackEvent, getProjectAnalytics } from '@/features/analytics/services/tracking.service';
import prisma from '@/lib/prisma/client';

const mockedPrisma = vi.mocked(prisma, true);

// ─── Tests ─────────────────────────────────────────────────────────────

describe('AnalyticsTrackingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('trackEvent', () => {
    it('should write an analytics event and return true', async () => {
      mockedPrisma.analyticsEvent.create.mockResolvedValueOnce({} as never);

      const result = await trackEvent({
        projectId: 'proj_1',
        eventType: 'page_view',
        path: '/home',
        referrer: 'https://google.com',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120',
        ip: '127.0.0.1',
      });

      expect(result).toBe(true);
      expect(mockedPrisma.analyticsEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          projectId: 'proj_1',
          eventType: 'page_view',
          path: '/home',
          referrer: 'https://google.com',
          device: 'desktop',
          browser: 'Chrome',
          ip: '127.0.0.1',
        }),
      });
    });

    it('should return false on database error (fire-and-forget)', async () => {
      mockedPrisma.analyticsEvent.create.mockRejectedValueOnce(
        new Error('DB down')
      );

      const result = await trackEvent({
        projectId: 'proj_1',
        eventType: 'page_view',
      });

      expect(result).toBe(false);
    });

    it('should detect mobile device from user agent', async () => {
      mockedPrisma.analyticsEvent.create.mockResolvedValueOnce({} as never);

      await trackEvent({
        projectId: 'proj_1',
        eventType: 'page_view',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
      });

      expect(mockedPrisma.analyticsEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          device: 'mobile',
        }),
      });
    });

    it('should detect tablet device from user agent', async () => {
      mockedPrisma.analyticsEvent.create.mockResolvedValueOnce({} as never);

      await trackEvent({
        projectId: 'proj_1',
        eventType: 'page_view',
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X)',
      });

      expect(mockedPrisma.analyticsEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          device: 'tablet',
        }),
      });
    });
  });

  describe('getProjectAnalytics', () => {
    const mockCountResult = 12450;
    const mockGroupByUniqueVisitors = [
      { ip: '1.1.1.1' },
      { ip: '2.2.2.2' },
      { ip: '3.3.3.3' },
    ] as any[];
    const mockTopPages = [
      { path: '/', _count: { id: 5200 } },
      { path: '/features', _count: { id: 2800 } },
    ] as any[];
    const mockTrafficSources = [
      { referrer: 'https://google.com', _count: { id: 3500 } },
    ] as any[];
    const mockDeviceBreakdown = [
      { device: 'desktop', _count: { id: 8000 } },
      { device: 'mobile', _count: { id: 3000 } },
      { device: 'tablet', _count: { id: 1450 } },
    ] as any[];
    const mockTimeSeries = Array.from({ length: 30 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      return {
        id: `evt_${i}`,
        projectId: 'proj_1',
        data: {},
        userAgent: null,
        eventType: 'page_view',
        path: null,
        referrer: null,
        ip: null,
        country: null,
        device: null,
        browser: null,
        createdAt: d,
      };
    }) as any[];

    beforeEach(() => {
      mockedPrisma.analyticsEvent.count.mockResolvedValue(mockCountResult);
      mockedPrisma.analyticsEvent.groupBy
        .mockResolvedValueOnce(mockGroupByUniqueVisitors) // unique visitors
        .mockResolvedValueOnce(mockTopPages)              // top pages
        .mockResolvedValueOnce(mockTrafficSources)        // traffic sources
        .mockResolvedValueOnce(mockDeviceBreakdown);      // device breakdown
      mockedPrisma.analyticsEvent.findMany.mockResolvedValue(mockTimeSeries);
    });

    it('should return a valid AnalyticsDashboard structure', async () => {
      const result = await getProjectAnalytics('proj_1', '30d');

      expect(result).toHaveProperty('pageViews');
      expect(result).toHaveProperty('uniqueVisitors');
      expect(result).toHaveProperty('avgSessionDuration');
      expect(result).toHaveProperty('bounceRate');
      expect(result).toHaveProperty('topPages');
      expect(result).toHaveProperty('trafficSources');
      expect(result).toHaveProperty('deviceBreakdown');
      expect(result).toHaveProperty('timeSeriesData');

      expect(typeof result.pageViews).toBe('number');
      expect(typeof result.uniqueVisitors).toBe('number');
      expect(Array.isArray(result.topPages)).toBe(true);
      expect(Array.isArray(result.trafficSources)).toBe(true);
      expect(Array.isArray(result.timeSeriesData)).toBe(true);
    });

    it('should return correct time series length for 7d', async () => {
      mockedPrisma.analyticsEvent.groupBy.mockReset();
      mockedPrisma.analyticsEvent.groupBy.mockResolvedValue([]);
      mockedPrisma.analyticsEvent.findMany.mockResolvedValue([]);

      const result = await getProjectAnalytics('proj_1', '7d');

      expect(result.timeSeriesData).toHaveLength(7);
    });

    it('should return correct time series length for 90d', async () => {
      mockedPrisma.analyticsEvent.groupBy.mockReset();
      mockedPrisma.analyticsEvent.groupBy.mockResolvedValue([]);
      mockedPrisma.analyticsEvent.findMany.mockResolvedValue([]);

      const result = await getProjectAnalytics('proj_1', '90d');

      expect(result.timeSeriesData).toHaveLength(90);
    });

    it('should return correct unique visitors count', async () => {
      const result = await getProjectAnalytics('proj_1', '30d');

      expect(result.uniqueVisitors).toBe(3);
    });

    it('should have correct device breakdown structure', async () => {
      const result = await getProjectAnalytics('proj_1', '30d');

      expect(result.deviceBreakdown).toHaveProperty('desktop');
      expect(result.deviceBreakdown).toHaveProperty('mobile');
      expect(result.deviceBreakdown).toHaveProperty('tablet');
      expect(result.deviceBreakdown.desktop).toBe(8000);
      expect(result.deviceBreakdown.mobile).toBe(3000);
      expect(result.deviceBreakdown.tablet).toBe(1450);
    });

    it('should include Direct as first traffic source when there are untracked referrers', async () => {
      const result = await getProjectAnalytics('proj_1', '30d');

      // Total views = 12450, Google referrers = 3500, so Direct = 8950
      expect(result.trafficSources[0].source).toBe('Direct');
      expect(result.trafficSources[0].visitors).toBe(8950);
    });

    it('should have top pages with required fields', async () => {
      const result = await getProjectAnalytics('proj_1', '30d');

      expect(result.topPages.length).toBe(2);
      expect(result.topPages[0].path).toBe('/');
      expect(result.topPages[0].title).toBe('Home');
      expect(result.topPages[0].views).toBe(5200);
    });

    it('should have bounceRate between 0 and 1', async () => {
      const result = await getProjectAnalytics('proj_1', '30d');

      expect(result.bounceRate).toBeGreaterThanOrEqual(0);
      expect(result.bounceRate).toBeLessThanOrEqual(1);
    });

    it('should handle empty data gracefully', async () => {
      mockedPrisma.analyticsEvent.count.mockResolvedValue(0);
      mockedPrisma.analyticsEvent.groupBy.mockReset();
      mockedPrisma.analyticsEvent.groupBy.mockResolvedValue([]);
      mockedPrisma.analyticsEvent.findMany.mockResolvedValue([]);

      const result = await getProjectAnalytics('proj_1', '30d');

      expect(result.pageViews).toBe(0);
      expect(result.uniqueVisitors).toBe(0);
      expect(result.topPages).toHaveLength(0);
      expect(result.trafficSources).toHaveLength(0);
      expect(result.deviceBreakdown).toEqual({
        desktop: 0,
        mobile: 0,
        tablet: 0,
      });
      expect(result.timeSeriesData).toHaveLength(30);
    });
  });
});
