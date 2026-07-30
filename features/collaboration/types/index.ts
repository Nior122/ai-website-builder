// =============================================================================
// Collaboration Types
// =============================================================================

import type { MemberRole } from '@/types';

export interface Collaborator {
  id: string;
  userId: string;
  email: string;
  name: string;
  avatar: string | null;
  role: MemberRole;
  joinedAt: string;
  lastActiveAt: string;
}

export interface Invitation {
  id: string;
  email: string;
  role: MemberRole;
  invitedBy: string;
  expiresAt: string;
  status: 'pending' | 'accepted' | 'expired';
}

export interface Comment {
  id: string;
  sectionId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string | null;
  content: string;
  createdAt: string;
  resolvedAt: string | null;
  replies: Comment[];
}

export interface PresenceUser {
  userId: string;
  name: string;
  avatar: string | null;
  cursor: { x: number; y: number } | null;
  activeSection: string | null;
}
