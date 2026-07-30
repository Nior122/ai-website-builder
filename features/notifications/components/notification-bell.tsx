// =============================================================================
// Notification Bell Component
// =============================================================================
// Bell icon in the dashboard header showing unread count badge. Click opens
// a dropdown panel with recent notifications, each showing icon (by type),
// title, message, and relative time. Includes "Mark all as read" action.
// =============================================================================

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import useSWR from 'swr';
import { formatDistanceToNow } from 'date-fns';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  readAt: string | null;
  createdAt: string;
}

interface NotificationsResponse {
  success: boolean;
  data: {
    notifications: NotificationItem[];
    unreadCount: number;
    hasMore: boolean;
    total: number;
  };
}

// Icons by notification type
const TYPE_ICONS: Record<string, string> = {
  deployment_complete: '🚀',
  deployment_failed: '❌',
  generation_complete: '✨',
  subscription_changed: '💳',
  payment_failed: '⚠️',
  collaboration_invite: '👥',
  comment_added: '💬',
  system_announcement: '📢',
};

function getIcon(type: string): string {
  return TYPE_ICONS[type] || '🔔';
}

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const { data, mutate } = useSWR<NotificationsResponse>(
    '/api/notifications?limit=10',
    fetcher,
    { refreshInterval: 30000, dedupingInterval: 10000 }
  );

  const notifications = data?.data?.notifications ?? [];
  const unreadCount = data?.data?.unreadCount ?? 0;

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = useCallback(async () => {
    await fetch('/api/notifications/read-all', { method: 'PATCH' });
    await mutate();
  }, [mutate]);

  const handleMarkRead = useCallback(
    async (id: string) => {
      await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
      await mutate();
    },
    [mutate]
  );

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
          />
        </svg>

        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-tight text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute right-0 top-full z-50 mt-2 w-80 origin-top-right rounded-xl border border-neutral-200 bg-white shadow-lg"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
            <h3 className="text-sm font-semibold text-neutral-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs font-medium text-neutral-500 hover:text-neutral-700"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <span className="mb-2 block text-2xl opacity-30">🔔</span>
                <p className="text-xs text-neutral-400">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => {
                    if (!notification.readAt) {
                      handleMarkRead(notification.id);
                    }
                  }}
                  className={`flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-neutral-50 ${
                    !notification.readAt ? 'bg-blue-50/30' : ''
                  }`}
                >
                  {/* Icon */}
                  <span className="mt-0.5 text-lg">{getIcon(notification.type)}</span>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-neutral-900">{notification.title}</p>
                    <p className="truncate text-xs text-neutral-500">{notification.message}</p>
                    <p className="mt-0.5 text-[10px] text-neutral-400">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </p>
                  </div>

                  {/* Unread dot */}
                  {!notification.readAt && (
                    <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                  )}
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-neutral-100 px-4 py-2 text-center">
              <p className="text-[10px] text-neutral-400">
                {data?.data?.total ?? 0} total
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
