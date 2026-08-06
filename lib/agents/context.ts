// =============================================================================
// Agent System — Shared Project Context (Agent Memory)
// =============================================================================
// Agents do NOT work independently. Every agent reads prior outputs from this
// shared context and writes its own output back. The orchestrator owns one
// context per generation request.
// =============================================================================

import type { DesignBrief } from '@/lib/ai/design-pipeline';
import type {
  AgentBrand,
  AgentCopy,
  AgentReport,
  AgentSeo,
  BusinessStrategy,
  ComponentArchitecture,
  ImageDirection,
  UiDesign,
  UxBlueprint,
} from './types';

/**
 * Shared memory for one orchestrated generation run.
 * Typed accessors keep agent outputs safe without any casts at call sites.
 */
export class ProjectContext {
  private readonly data: Record<string, unknown>;

  constructor(request: DesignBrief) {
    this.data = { request };
  }

  get request(): DesignBrief {
    return this.data.request as DesignBrief;
  }

  set<T>(key: string, value: T): void {
    this.data[key] = value;
  }

  get<T>(key: string): T | undefined {
    return this.data[key] as T | undefined;
  }

  has(key: string): boolean {
    return this.data[key] !== undefined;
  }

  // ─── Typed Accessors ────────────────────────────────────────────────

  get business(): BusinessStrategy | undefined {
    return this.get<BusinessStrategy>('business');
  }

  get brand(): AgentBrand | undefined {
    return this.get<AgentBrand>('brand');
  }

  get ux(): UxBlueprint | undefined {
    return this.get<UxBlueprint>('ux');
  }

  get ui(): UiDesign | undefined {
    return this.get<UiDesign>('ui');
  }

  get copy(): AgentCopy | undefined {
    return this.get<AgentCopy>('copy');
  }

  get images(): ImageDirection | undefined {
    return this.get<ImageDirection>('images');
  }

  get seo(): AgentSeo | undefined {
    return this.get<AgentSeo>('seo');
  }

  get frontend(): ComponentArchitecture | undefined {
    return this.get<ComponentArchitecture>('frontend');
  }

  get accessibility(): AgentReport | undefined {
    return this.get<AgentReport>('accessibility');
  }

  get performance(): AgentReport | undefined {
    return this.get<AgentReport>('performance');
  }

  get security(): AgentReport | undefined {
    return this.get<AgentReport>('security');
  }

  get qa(): AgentReport | undefined {
    return this.get<AgentReport>('qa');
  }

  toJSON(): Record<string, unknown> {
    return JSON.parse(JSON.stringify(this.data)) as Record<string, unknown>;
  }
}
