import { NextResponse } from "next/server";
import { markAllNotificationsAsRead } from "@/services/notification.service";

export async function POST(): Promise<Response> {
  try {
    const markedCount = await markAllNotificationsAsRead();
    return NextResponse.json({ ok: true, markedCount });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to mark all notifications.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
