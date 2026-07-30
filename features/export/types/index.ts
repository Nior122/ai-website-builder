// =============================================================================
// Export Types
// =============================================================================

import type { ExportFormat, DeployPlatform } from '@/types';

export interface ExportConfig {
  format: ExportFormat;
  includeStyles: boolean;
  includeImages: boolean;
  minify: boolean;
  splitSections: boolean;
}

export interface ExportResult {
  id: string;
  format: ExportFormat;
  files: ExportFile[];
  downloadUrl: string;
  fileSize: number;
  createdAt: string;
}

export interface ExportFile {
  path: string;
  content: string;
  size: number;
  type: 'html' | 'css' | 'js' | 'json' | 'image' | 'other';
}

export interface DeployConfig {
  platform: DeployPlatform;
  projectId: string;
  customDomain?: string;
  environmentVariables?: Record<string, string>;
}

export interface DeployResult {
  id: string;
  platform: DeployPlatform;
  url: string;
  status: 'deploying' | 'deployed' | 'failed';
  deployedAt: string;
}
