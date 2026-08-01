// =============================================================================
// POST /api/builder/regenerate
// =============================================================================
// ✨ Regenerate with AI — rebuilds ONLY the targeted section. The rest of the
// website is untouched.
// =============================================================================

import { ok, badRequest } from '@/lib/api-response';
import { regenerateSection, type BuilderProject } from '@/lib/builder';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      project?: BuilderProject;
      pageId?: string;
      sectionId?: string;
    };
    if (!body.project || !body.pageId || !body.sectionId) {
      return badRequest('project, pageId and sectionId are required');
    }

    const result = regenerateSection(body.project, body.pageId, body.sectionId);
    return ok({ section: result.section, usedFallback: result.usedFallback, prompt: result.prompt });
  } catch (err) {
    return badRequest(err instanceof Error ? err.message : 'Regeneration failed');
  }
}
