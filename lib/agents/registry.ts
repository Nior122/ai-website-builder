// =============================================================================
// Agent System — Agent Registry
// =============================================================================
// Builds the default ordered agent roster for the orchestrator. Each agent
// has one responsibility, one output key, and one validation contract.
// =============================================================================

import type { Agent } from './base';
import { BusinessAnalystAgent } from './agents/business-analyst';
import { BrandIdentityAgent } from './agents/brand-identity';
import { UxStrategistAgent } from './agents/ux-strategist';
import { UiDesignAgent } from './agents/ui-design';
import { CopywritingAgent } from './agents/copywriting';
import { ImageDirectionAgent } from './agents/image-direction';
import { SeoAgent } from './agents/seo';
import { FrontendArchitectAgent } from './agents/frontend-architect';
import { AccessibilityAgent } from './agents/accessibility';
import { PerformanceAgent } from './agents/performance';
import { SecurityAgent } from './agents/security';
import { QaAgent } from './agents/qa';

/**
 * The default roster: 12 specialized agents in dependency order.
 */
export function createDefaultAgents(): Agent[] {
  return [
    new BusinessAnalystAgent(),
    new BrandIdentityAgent(),
    new UxStrategistAgent(),
    new UiDesignAgent(),
    new CopywritingAgent(),
    new ImageDirectionAgent(),
    new SeoAgent(),
    new FrontendArchitectAgent(),
    new AccessibilityAgent(),
    new PerformanceAgent(),
    new SecurityAgent(),
    new QaAgent(),
  ];
}
