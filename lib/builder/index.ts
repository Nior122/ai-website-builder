// =============================================================================
// Website Builder — Barrel Exports
// =============================================================================
// The professional builder layer: themes, components, page/section ops,
// navigation, forms, blog, SEO, media, preview, history, autosave, exports,
// quality checks, AI regeneration, the generation workflow, and the editor
// session store.
// =============================================================================

export { BuilderSession } from './store';
export { HistoryStack, cloneProject } from './history';
export {
  AutosaveManager,
  MemoryStorageAdapter,
  createLocalStorageAdapter,
  type StorageAdapter,
  type AutosaveOptions,
} from './autosave';
export { COMPONENT_LIBRARY, getComponent, listComponents, getVariant } from './component-library';
export {
  BUILDER_THEMES,
  listBuilderThemes,
  getThemeDefinition,
  createBuilderTheme,
  applyTheme,
  updateStyleToken,
  getStyleToken,
  STYLE_EDITOR_FIELDS,
  type ThemeDefinition,
  type StyleTokenPath,
} from './theme-system';
export {
  defaultSection,
  addSection,
  deleteSection,
  duplicateSection,
  moveSection,
  reorderSections,
  setSectionVisibility,
  setSectionLocked,
  updateSectionContent,
  copySectionToClipboard,
  pasteSection,
  saveSectionAsTemplate,
  listSectionTemplates,
  insertTemplate,
  getSection,
  sectionCount,
} from './section-operations';
export {
  slugify,
  uniqueSlug,
  buildStandardPages,
  ensureRequiredPages,
  createPage,
  renamePage,
  deletePage,
  duplicatePage,
  reorderPages,
  setHomePage,
  setPageStatus,
  updatePageMeta,
  getPageBySlug,
  getHomePage,
} from './page-operations';
export {
  buildNavigation,
  buildFooter,
  updateNavigation,
  addNavLink,
  removeNavLink,
  updateNavLink,
  setNavbarMode,
  setNavbarCta,
  setMobileMenu,
  updateFooter,
  setFooterColumn,
  addFooterColumn,
  addSocialLink,
  removeSocialLink,
  setFooterTagline,
} from './navigation-builder';
export {
  createForm,
  addForm,
  removeForm,
  updateForm,
  addFormField,
  removeFormField,
  getForm,
  defaultForms,
  validateFormSubmission,
  type FormValidationResult,
} from './forms-config';
export {
  defaultBlogState,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  listPosts,
  getRelatedPosts,
  paginatePosts,
  type BlogFilters,
} from './blog-system';
export {
  updateSiteSeo,
  updatePageSeo,
  validateSeo,
  validatePageSeo,
  buildDefaultSeo,
  type SeoValidationIssue,
} from './seo-panel';
export {
  addMediaItem,
  removeMediaItem,
  updateMediaItem,
  listMedia,
  searchMedia,
  seedMediaLibrary,
  type NewMediaInput,
} from './media-manager';
export {
  PREVIEW_DEVICES,
  defaultPreviewState,
  updatePreviewState,
  setPreviewDevice,
  setPreviewZoom,
  togglePreviewMode,
  toggleFullscreen,
  refreshPreview,
  deviceWidth,
  deviceHeight,
  previewUrl,
} from './preview-service';
export { exportProject, exportAll } from './export-service';
export { runQualityChecks } from './quality-checks';
export { regenerateSection, buildRegenerationPrompt } from './regeneration';
export { buildProjectFromBlueprint } from './project-builder';
export {
  GENERATION_WORKFLOW,
  runGenerationWorkflow,
  type WorkflowStepDef,
  type GenerationWorkflowOptions,
  type GenerationWorkflowResult,
} from './generation-workflow';

export type {
  ThemeMode,
  PreviewDevice,
  PreviewState,
  BuilderSection,
  PageStatus,
  BuilderPage,
  BuilderTheme,
  NavLink,
  NavigationConfig,
  FooterColumn,
  FooterConfig,
  SiteSeo,
  MediaType,
  MediaSource,
  MediaItem,
  FormKind,
  FormFieldType,
  FormField,
  FormConfig,
  BlogPost,
  BlogState,
  BuilderProject,
  HistoryEntry,
  LibraryVariant,
  LibraryComponent,
  QualityIssue,
  QualityReport,
  WorkflowProgress,
  ExportFormat,
  ExportResult,
} from './types';
