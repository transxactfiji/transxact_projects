"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ReactElement } from "react";
import { toast } from "sonner";
import { FiCheckCircle, FiExternalLink } from "react-icons/fi";
import AppButton from "@/app/ui/appButton";
import InlineStatus from "@/app/ui/inlineStatus";
import PageHeading from "@/app/ui/pageHeading";
import { formatDateTime } from "@/lib/utils";
import {
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type NotificationListItem,
  type NotificationPreferenceItem,
  updateNotificationPreference,
} from "@/services/notification.service";

interface NotificationsViewProps {
  notifications: NotificationListItem[];
  preferences: NotificationPreferenceItem[];
}

interface StatusState {
  tone: "success" | "error" | "info";
  message: string;
}

export default function NotificationsView({
  notifications,
  preferences,
}: NotificationsViewProps): ReactElement {
  const router = useRouter();
  const [status, setStatus] = useState<StatusState | null>(null);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [updatingPreferenceCategory, setUpdatingPreferenceCategory] = useState<
    string | null
  >(null);
  const [markingId, setMarkingId] = useState<number | null>(null);

  const handleMarkAllRead = async (): Promise<void> => {
    setIsMarkingAll(true);
    try {
      const markedCount = await markAllNotificationsAsRead();
      setStatus({
        tone: "success",
        message:
          markedCount > 0
            ? `${markedCount} notification(s) marked as read.`
            : "No unread notifications.",
      });
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to mark all notifications as read.";
      setStatus({ tone: "error", message });
      toast.error(message);
    } finally {
      setIsMarkingAll(false);
    }
  };

  const handleMarkRead = async (notificationId: number): Promise<void> => {
    setMarkingId(notificationId);
    try {
      await markNotificationAsRead(notificationId);
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to mark notification as read.";
      setStatus({ tone: "error", message });
      toast.error(message);
    } finally {
      setMarkingId(null);
    }
  };

  const handlePreferenceChange = async (
    category: NotificationPreferenceItem["category"],
    nextInAppEnabled: boolean,
    nextEmailEnabled: boolean,
  ): Promise<void> => {
    setUpdatingPreferenceCategory(category);
    try {
      await updateNotificationPreference({
        category,
        inAppEnabled: nextInAppEnabled,
        emailEnabled: nextEmailEnabled,
      });
      setStatus({ tone: "success", message: "Notification preferences updated." });
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to update preferences.";
      setStatus({ tone: "error", message });
      toast.error(message);
    } finally {
      setUpdatingPreferenceCategory(null);
    }
  };

  return (
    <section className="flex flex-col gap-2 min-h-0">
      <section className="rounded-lg border bg-card shadow-card p-2.5">
        <div className="flex flex-wrap gap-2 justify-between mb-2">
          <div>
            <PageHeading level={2}>Notification settings</PageHeading>
            <p>Control in-app and email channels by category.</p>
          </div>
        </div>

        <div className="max-h-64 overflow-auto border rounded-md">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th scope="col" className="sticky top-0 z-10 bg-accent text-muted-foreground text-xs font-bold uppercase tracking-wider px-2 py-1.5 text-left border-b">Category</th>
                <th scope="col" className="sticky top-0 z-10 bg-accent text-muted-foreground text-xs font-bold uppercase tracking-wider px-2 py-1.5 text-left border-b">In-app</th>
                <th scope="col" className="sticky top-0 z-10 bg-accent text-muted-foreground text-xs font-bold uppercase tracking-wider px-2 py-1.5 text-left border-b">Email</th>
              </tr>
            </thead>
            <tbody>
              {preferences.map((item) => (
                <tr key={item.category} className="transition-colors hover:bg-accent">
                  <td className="border-b px-2 py-1.5 text-left">{item.label}</td>
                  <td className="border-b px-2 py-1.5 text-left">
                    <input
                      type="checkbox"
                      checked={item.inAppEnabled}
                      onChange={(event) =>
                        void handlePreferenceChange(
                          item.category,
                          event.target.checked,
                          item.emailEnabled,
                        )
                      }
                      disabled={updatingPreferenceCategory === item.category}
                      aria-label={`${item.label} in-app setting`}
                    />
                  </td>
                  <td className="border-b px-2 py-1.5 text-left">
                    <input
                      type="checkbox"
                      checked={item.emailEnabled}
                      onChange={(event) =>
                        void handlePreferenceChange(
                          item.category,
                          item.inAppEnabled,
                          event.target.checked,
                        )
                      }
                      disabled={updatingPreferenceCategory === item.category}
                      aria-label={`${item.label} email setting`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-lg border bg-card shadow-card p-2.5">
        <div className="flex flex-wrap gap-2 justify-between mb-2">
          <div>
            <PageHeading level={2}>All notifications</PageHeading>
            <p>Review activity and open the linked destination.</p>
          </div>
          <AppButton
            variant="secondary"
            onClick={() => void handleMarkAllRead()}
            isLoading={isMarkingAll}
            loadingLabel="Updating..."
            startIcon={<FiCheckCircle aria-hidden="true" />}
          >
            Mark all as read
          </AppButton>
        </div>

        <InlineStatus
          tone={status?.tone ?? "info"}
          message={status?.message ?? null}
        />

        <div className="max-h-64 overflow-auto border rounded-md">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th scope="col" className="sticky top-0 z-10 bg-accent text-muted-foreground text-xs font-bold uppercase tracking-wider px-2 py-1.5 text-left border-b">Status</th>
                <th scope="col" className="sticky top-0 z-10 bg-accent text-muted-foreground text-xs font-bold uppercase tracking-wider px-2 py-1.5 text-left border-b">Title</th>
                <th scope="col" className="sticky top-0 z-10 bg-accent text-muted-foreground text-xs font-bold uppercase tracking-wider px-2 py-1.5 text-left border-b">When</th>
                <th scope="col" className="sticky top-0 z-10 bg-accent text-muted-foreground text-xs font-bold uppercase tracking-wider px-2 py-1.5 text-left border-b">Action</th>
              </tr>
            </thead>
            <tbody>
              {notifications.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="text-muted-foreground text-center border-b px-2 py-1.5 text-left"
                  >
                    No notifications yet.
                  </td>
                </tr>
              ) : (
                notifications.map((item) => (
                  <tr key={item.id} className="transition-colors hover:bg-accent">
                    <td className="border-b px-2 py-1.5 text-left">{item.isRead ? "Read" : "Unread"}</td>
                    <td className="border-b px-2 py-1.5 text-left">
                      <div className="font-semibold">{item.title}</div>
                      {item.body ? (
                        <p className="mt-1 text-muted-foreground text-xs">{item.body}</p>
                      ) : null}
                    </td>
                    <td className="border-b px-2 py-1.5 text-left">{formatDateTime(item.createdAt)}</td>
                    <td className="border-b px-2 py-1.5 text-left">
                      <div className="flex items-center gap-1.5">
                        <Link
                          href={item.href}
                          className="inline-flex items-center gap-1 text-primary font-semibold text-sm hover:text-primary/80"
                        >
                          <span className="inline-flex items-center gap-1">
                            <FiExternalLink aria-hidden="true" />
                            <span>Open</span>
                          </span>
                        </Link>
                        {!item.isRead ? (
                          <AppButton
                            variant="secondary"
                            onClick={() => void handleMarkRead(item.id)}
                            isLoading={markingId === item.id}
                            loadingLabel="Updating..."
                            startIcon={<FiCheckCircle aria-hidden="true" />}
                          >
                            Mark read
                          </AppButton>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
