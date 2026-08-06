// =============================================================================
// Agent 5 — Copywriting Agent
// =============================================================================
// Writes professional, brand-voiced copy: hero, services, features, benefits,
// FAQs, testimonials, about, mission, vision, CTA, footer. No generic AI
// text, no lorem ipsum, no repeated phrases.
// =============================================================================

import { Agent, isNonEmptyArray, isRecord } from '../base';
import type { ProjectContext } from '../context';
import { buildBrandDesign, buildCopyBlocks } from '@/lib/ai/design-pipeline';
import type { AgentCopy } from '../types';

export class CopywritingAgent extends Agent {
  readonly id = 'copy' as const;
  readonly outputKey = 'copy';

  run(context: ProjectContext): AgentCopy {
    const req = context.request;
    const brandDesign = buildBrandDesign(req);
    const blocks = buildCopyBlocks(req, brandDesign);
    return { blocks };
  }

  validate(output: unknown): boolean {
    if (!isRecord(output)) return false;
    if (!isNonEmptyArray(output.blocks)) return false;
    // No placeholder text allowed anywhere in the copy.
    const joined = (output.blocks as Array<{ text: string }>)
      .map((block) => block.text)
      .join(' ');
    return !/lorem ipsum|world-class|cutting-edge/i.test(joined);
  }

  fallback(context: ProjectContext): AgentCopy {
    const req = context.request;
    const brandDesign = buildBrandDesign({ ...req, tone: 'professional' });
    return { blocks: buildCopyBlocks(req, brandDesign) };
  }
}
