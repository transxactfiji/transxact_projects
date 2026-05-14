import type { ReactElement } from "react";
import { redirect } from "next/navigation";
import NotificationsView from "./notificationsView";
import { listNotificationCenterData } from "@/services/notification.service";

export const dynamic = "force-dynamic";

export default async function NotificationsPage(): Promise<ReactElement> {
  let data: Awaited<ReturnType<typeof listNotificationCenterData>>;
  try {
    data = await listNotificationCenterData();
  } catch (error) {
    if (error instanceof Error && error.message === "You must be signed in to continue.") {
      redirect("/auth");
    }

    throw error;
  }

  return (
    <NotificationsView
      notifications={data.notifications}
      preferences={data.preferences}
    />
  );
}
