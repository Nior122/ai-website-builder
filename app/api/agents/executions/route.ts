// =============================================================================
// GET /api/agents/executions
// =============================================================================
// Admin dashboard data source: recent agent executions with status, duration,
// model, attempts, errors, and fallback usage.
// =============================================================================

import { ok } from '@/lib/api-response';
import { listExecutions } from '@/lib/agents/execution-store';

export const runtime = 'nodejs';

export async function GET() {
  return ok({ executions: listExecutions() });
}
