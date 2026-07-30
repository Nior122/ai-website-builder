// =============================================================================
// AI Engine — Barrel Exports
// =============================================================================

// Types
export type {
  GenerationPhase,
  GenerationProgress,
  AIPageResult,
  AISectionResult,
  AIGenerationResult,
  AIServiceConfig,
} from './types';

// Services
export {
  executeGeneration as generateSite,
  executeGeneration as regenerateSection,
  executeGeneration as generatePageContent,
} from './services/generation.service';

export function calculateProgress(_progress: unknown): number {
  return 0;
}

export function getPhaseMessage(_phase: unknown): string {
  return 'Processing...';
}

export {
  generateImage,
  generateBatchImages,
  enhanceImagePrompt,
  getImageSizeForSection,
  isImageGenerationAvailable,
} from './services/image.service';

export type {
  ImageGenerationRequest,
  GeneratedImage,
  BatchImageRequest,
} from './services/image.service';

export {
  refineSection,
  refineSections,
  quickRefineText,
  detectRefinementType,
} from './services/refinement.service';

export type {
  RefinementRequest,
  RefinementResult,
} from './services/refinement.service';

// Prompts
export {
  GENERATION_SYSTEM_PROMPT,
  REFINE_SYSTEM_PROMPT,
  IMAGE_SYSTEM_PROMPT,
  buildGenerationPrompt,
  buildRefinePrompt,
  buildImagePromptBatch,
  buildBlogPrompt,
  buildSingleImagePrompt,
  SECTION_CONTENT_SCHEMAS,
} from './prompts';

// Hooks
export { useGeneration } from './hooks/useGeneration';

// Components
export { PromptBuilder } from './components/PromptBuilder';
