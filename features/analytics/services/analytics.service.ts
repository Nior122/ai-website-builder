// =============================================================================
// Analytics Service
// =============================================================================
// Analytics data aggregation and reporting. Delegates to tracking.service
// for real data queries against the AnalyticsEvent table.
// =============================================================================

import { getProjectAnalytics as getRealAnalytics } from './tracking.service';
import type { AnalyticsDashboard } from '../types';

/**
 * Get dashboard analytics for a project.
 * Wraps the tracking service's real aggregation queries.
 */
export async function getProjectAnalytics(
  projectId: string,
  period: '7d' | '30d' | '90d' = '30d'
): Promise<AnalyticsDashboard> {
  return getRealAnalytics(projectId, period);
}
