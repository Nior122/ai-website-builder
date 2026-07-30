// =============================================================================
// JSON Engine — Barrel Exports
// =============================================================================
// The JSON engine handles all JSON validation, transformation, and patching
// for the JSON-first architecture. Used by the AI generator, editor, and
// renderer to ensure data integrity at every boundary.
// =============================================================================

// ─── Schemas ────────────────────────────────────────────────────────────
export {
  SECTION_CONTENT_SCHEMAS,
  validateSectionContent,
  safeValidateSectionContent,
  isValidSectionType,
  getValidSectionTypes,
  ctaSchema,
  imageConfigSchema,
  contentItemSchema,
  testimonialSchema,
  faqSchema,
  statSchema,
  pricingFeatureSchema,
  pricingPlanSchema,
  teamMemberSchema,
  galleryItemSchema,
  videoConfigSchema,
  mapConfigSchema,
} from './schemas/section-schemas';

export {
  aiProjectOutputSchema,
  validateSectionType,
  validateAllSections,
  type AIProjectOutput,
  type AIPageOutput,
  type AISectionOutput,
  type AIBrandOutput,
  type ThemeOutput,
  type SEOOutput,
  type ColorPaletteOutput,
} from './schemas/project-schemas';

// ─── Services ───────────────────────────────────────────────────────────
export {
  getSectionConfig,
  getDefaultSection,
  validateSection,
  isValidLayout,
  getSectionTypesByCategory,
  getSingletonSectionTypes,
  getRecommendedSections,
  type SectionTypeConfig,
  type ImageRequirement,
} from './services/section-registry';

export {
  transformAIOutput,
  buildImageConfigs,
  type NormalizedSection,
  type NormalizedPage,
  type NormalizedProject,
  type TransformResult,
  type TransformError,
} from './services/json-transformer';

export {
  deepMerge,
  patchSection,
  diffSections,
  reorderSections,
  cloneSection,
  clonePage,
  getSectionContent,
  setSectionContent,
  addContentArrayItem,
  removeContentArrayItem,
  updateContentArrayItem,
  type SectionPatch,
  type DiffResult,
} from './services/json-patcher';

export {
  getDefaultTheme,
  getDefaultSEO,
  getDefaultProjectSettings,
  buildBrandConfig,
  type ProjectSettings,
  type BrandConfig,
} from './services/project-defaults';
