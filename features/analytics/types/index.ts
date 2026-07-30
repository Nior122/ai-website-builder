// =============================================================================
// Analytics Types
// =============================================================================

export interface AnalyticsDashboard {
  pageViews: number;
  uniqueVisitors: number;
  avgSessionDuration: number;
  bounceRate: number;
  topPages: PageAnalytics[];
  trafficSources: TrafficSource[];
  deviceBreakdown: DeviceBreakdown;
  timeSeriesData: TimeSeriesPoint[];
}

export interface PageAnalytics {
  path: string;
  title: string;
  views: number;
  uniqueVisitors: number;
  avgTimeOnPage: number;
  exitRate: number;
}

export interface TrafficSource {
  source: string;
  visitors: number;
  percentage: number;
}

export interface DeviceBreakdown {
  desktop: number;
  mobile: number;
  tablet: number;
}

export interface TimeSeriesPoint {
  date: string;
  pageViews: number;
  uniqueVisitors: number;
}
