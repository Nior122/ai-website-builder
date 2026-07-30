// =============================================================================
// Deployment Types
// =============================================================================

import type { DeployPlatform } from '@/types';

export type DeploymentStatus = 'pending' | 'building' | 'deploying' | 'deployed' | 'failed' | 'cancelled';

export interface DeploymentConfig {
  platform: DeployPlatform;
  projectId: string;
  customDomain?: string;
  repositoryUrl?: string;
  branch?: string;
  buildCommand?: string;
  outputDir?: string;
}

export interface DeploymentResult {
  id: string;
  projectId: string;
  platform: DeployPlatform;
  status: DeploymentStatus;
  url: string | null;
  customDomain: string | null;
  buildLog: string[];
  deployedAt: string | null;
  createdAt: string;
}

export interface PlatformConfig {
  name: string;
  icon: string;
  description: string;
  supportedFeatures: string[];
  requiresAuth: boolean;
}
