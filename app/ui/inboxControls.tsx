"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactElement } from "react";
import { FiBell, FiCheck, FiMail, FiNavigation } from "react-icons/fi";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface UnreadCounts {
  unreadMessageCount: number;
  unreadNotificationCount: number;
}

interface NotificationListItem {
  id: number;
  title: string;
  body: string | null;
  href: string;
  isRead: boolean;
  createdAt: string;
}

const DEFAULT_COUNTS: UnreadCounts = {
  unreadMessageCount: 0,
  unreadNotificationCount: 0,
};

function formatTimestamp(isoValue: string): string {
  const parsed = new Date(isoValue);
  if (Number.isNaN(parsed.getTime())) {
    return "Unknown";
  }

  return parsed.toLocaleString();
}

export default function InboxControls(): ReactElement {
  const [counts, setCounts] = useState<UnreadCounts>(DEFAULT_COUNTS);
  const [notifications, setNotifications] = useState<NotificationListItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const refreshCounts = useCallback(async (): Promise<void> => {
    const response = await fetch("/api/inbox/unread-counts", {
      cache: "no-store",
      credentials: "same-origin",
    });

    if (!response.ok) {
      return;
    }

    const payload = (await response.json()) as UnreadCounts;
    setCounts({
      unreadMessageCount: payload.unreadMessageCount ?? 0,
      unreadNotificationCount: payload.unreadNotificationCount ?? 0,
    });
  }, []);

  const refreshNotifications = useCallback(async (): Promise<void> => {
    const response = await fetch("/api/notifications/recent?limit=8", {
      cache: "no-store",
      credentials: "same-origin",
    });

    if (!response.ok) {
      return;
    }

    const payload = (await response.json()) as { notifications?: NotificationListItem[] };
    setNotifications(payload.notifications ?? []);
  }, []);

  const refreshAll = useCallback(async (): Promise<void> => {
    await Promise.all([refreshCounts(), refreshNotifications()]);
  }, [refreshCounts, refreshNotifications]);

  const markNotificationRead = useCallback(
    async (notificationId: number): Promise<void> => {
      await fetch("/api/notifications/mark-read", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId }),
      });
      await refreshAll();
    },
    [refreshAll],
  );

  const markAllRead = useCallback(async (): Promise<void> => {
    await fetch("/api/notifications/mark-all-read", {
      method: "POST",
      credentials: "same-origin",
    });
    await refreshAll();
  }, [refreshAll]);

  useEffect(() => {
    const initialLoadTimer = window.setTimeout(() => {
      void refreshAll();
    }, 0);
    const refreshInterval = setInterval(() => {
      void refreshAll();
    }, 30000);

    const queueInterval = setInterval(() => {
      void fetch("/api/notifications/process-email", {
        method: "POST",
        credentials: "same-origin",
      });
    }, 60000);

    const eventSource = new EventSource("/api/realtime/stream", { withCredentials: true });
    const handleRefresh = (): void => {
      void refreshAll();
    };
    eventSource.addEventListener("refresh", handleRefresh);

    return () => {
      clearTimeout(initialLoadTimer);
      clearInterval(refreshInterval);
      clearInterval(queueInterval);
      eventSource.removeEventListener("refresh", handleRefresh);
      eventSource.close();
    };
  }, [refreshAll]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleOutsideClick = (event: MouseEvent): void => {
      const targetNode = event.target as Node;
      if (dropdownRef.current && !dropdownRef.current.contains(targetNode)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen]);

  return (
    <div
      className="relative flex items-center gap-1"
      ref={dropdownRef}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href="/messages"
            className="inline-flex items-center justify-center gap-1 border rounded-md bg-accent text-muted-foreground cursor-pointer text-sm font-semibold min-h-7 px-2 py-1 transition-colors hover:border-border hover:text-foreground"
          >
            <FiMail size={15} aria-hidden="true" />
            {counts.unreadMessageCount > 0 ? (
              <span className="inline-flex items-center justify-center min-w-4 rounded-full bg-primary text-primary-foreground text-xs font-bold px-1 py-0.5 leading-none">{counts.unreadMessageCount}</span>
            ) : null}
          </Link>
        </TooltipTrigger>
        <TooltipContent>Messages</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center justify-center gap-1 border rounded-md bg-accent text-muted-foreground cursor-pointer text-sm font-semibold min-h-7 px-2 py-1 transition-colors hover:border-border hover:text-foreground"
            onClick={() => {
              setIsOpen((current) => !current);
              if (!isOpen) {
                void refreshNotifications();
              }
            }}
            aria-label="Open notifications"
          >
            <FiBell size={15} aria-hidden="true" />
            {counts.unreadNotificationCount > 0 ? (
              <span className="inline-flex items-center justify-center min-w-4 rounded-full bg-primary text-primary-foreground text-xs font-bold px-1 py-0.5 leading-none">{counts.unreadNotificationCount}</span>
            ) : null}
          </button>
        </TooltipTrigger>
        <TooltipContent>Notifications</TooltipContent>
      </Tooltip>

      {isOpen ? (
        <div className="absolute top-[calc(100%+0.35rem)] right-0 z-30 w-[min(22rem,85vw)] border rounded-lg bg-card shadow-elevated overflow-hidden">
          <div className="flex items-center justify-between border-b px-2 py-1.5 text-sm">
            <span className="inline-flex items-center gap-1">
              <FiBell size={14} aria-hidden="true" />
              <span>Notifications</span>
            </span>
            <button
              type="button"
              className="inline-flex items-center gap-1 border-0 bg-transparent text-primary cursor-pointer text-sm font-semibold p-0 transition-colors hover:text-primary/80"
              onClick={() => void markAllRead()}
            >
              <FiCheck size={13} aria-hidden="true" />
              Mark all read
            </button>
          </div>
          <div className="max-h-56 overflow-auto">
            {notifications.length === 0 ? (
              <p className="text-muted-foreground text-sm p-2">No notifications yet.</p>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  className={`flex gap-1.5 items-start justify-between border-b px-2 py-1.5 last:border-b-0${item.isRead ? "" : " bg-primary/5"}`}
                >
                  <Link
                    href={item.href}
                    className="flex-1"
                    onClick={() => {
                      setIsOpen(false);
                      if (!item.isRead) {
                        void markNotificationRead(item.id);
                      }
                    }}
                  >
                    <p className="text-sm font-semibold">{item.title}</p>
                    {item.body ? <p className="mt-0.5 text-muted-foreground text-xs">{item.body}</p> : null}
                    <p className="mt-0.5 text-muted-foreground text-xs">{formatTimestamp(item.createdAt)}</p>
                  </Link>
                  {!item.isRead ? (
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 border-0 bg-transparent text-primary cursor-pointer text-sm font-semibold p-0 transition-colors hover:text-primary/80"
                      onClick={() => void markNotificationRead(item.id)}
                    >
                      <FiCheck size={13} aria-hidden="true" />
                      Mark read
                    </button>
                  ) : null}
                </div>
              ))
            )}
          </div>
          <Link
            href="/notifications"
            className="inline-flex items-center gap-1 border-t border-border text-primary text-sm font-semibold p-2 w-full hover:text-primary/80"
            onClick={() => setIsOpen(false)}
          >
            <FiNavigation size={13} aria-hidden="true" />
            Open notification center
          </Link>
        </div>
      ) : null}
    </div>
  );
}
