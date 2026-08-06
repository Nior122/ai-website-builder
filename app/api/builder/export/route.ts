// =============================================================================
// POST /api/builder/export
// =============================================================================
// Export a builder project in any supported format (json, html, zip, react,
// nextjs, tailwind) — or all formats at once.
// =============================================================================

import { ok, badRequest } from '@/lib/api-response';
import { exportProject, exportAll, type BuilderProject, type ExportFormat } from '@/lib/builder';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { project?: BuilderProject; format?: ExportFormat };
    if (!body.project) return badRequest('project is required');

    if (body.format) {
      const result = exportProject(body.project, body.format);
      return ok({ export: result });
    }
    return ok({ exports: exportAll(body.project) });
  } catch (err) {
    return badRequest(err instanceof Error ? err.message : 'Export failed');
  }
}
