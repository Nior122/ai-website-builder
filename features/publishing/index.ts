// =============================================================================
// Publishing — Feature Barrel
// =============================================================================
// Public API surface for the publishing feature. Import from
// `@/features/publishing` — keeps the editor toolbar, dashboard card, and any
// future history UI off the internal service paths so refactor churn stays
// inside this barrel.
// =============================================================================

// Services
export {
  publishProject,
  unpublishProject,
  buildProjectSnapshot,
  buildPublishedUrl,
} from './services/publishing.service';

export {
  getVersionCount,
  getNextVersionNumber,
  listVersions,
} from './services/version.service';

export {
  getPublishedProjectBySlug,
  getSeoConfig,
  buildPublicMetadata,
} from './services/public-site.service';
export type { PublicSiteData } from './services/public-site.service';

// Components
export { PublicSiteLayout } from './components/public-site-layout';

// Types
export type {
  PublishResult,
  VersionSummary,
  ProjectSnapshot,
} from './types';
