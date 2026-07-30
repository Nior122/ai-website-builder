// =============================================================================
// Notification Types
// =============================================================================

import type { Notification } from '@/types';

export type NotificationType =
  | 'deployment_complete'
  | 'deployment_failed'
  | 'generation_complete'
  | 'generation_failed'
  | 'subscription_changed'
  | 'payment_failed'
  | 'collaboration_invite'
  | 'comment_added'
  | 'system_announcement';

export interface NotificationPreferences {
  email: boolean;
  browser: boolean;
  deployment: boolean;
  billing: boolean;
  collaboration: boolean;
  marketing: boolean;
}

export interface NotificationList {
  notifications: Notification[];
  unreadCount: number;
  hasMore: boolean;
}
