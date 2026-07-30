// =============================================================================
// Admin Types
// =============================================================================

import type { SystemAnalytics, FeatureFlag } from '@/types';

export interface AdminDashboard {
  totalUsers: number;
  activeUsers: number;
  totalProjects: number;
  totalDeployments: number;
  revenue: number;
  aiUsage: AIUsageStats;
}

export interface AIUsageStats {
  totalGenerations: number;
  totalTokensUsed: number;
  avgTokensPerGeneration: number;
  estimatedCost: number;
}

export interface UserManagement {
  users: AdminUser[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  plan: string;
  projectCount: number;
  createdAt: string;
  lastActiveAt: string;
  status: 'active' | 'suspended' | 'deleted';
}

export interface SystemHealth {
  database: 'healthy' | 'degraded' | 'down';
  redis: 'healthy' | 'degraded' | 'down';
  aiService: 'healthy' | 'degraded' | 'down';
  storage: 'healthy' | 'degraded' | 'down';
  uptime: number;
  lastChecked: string;
}
