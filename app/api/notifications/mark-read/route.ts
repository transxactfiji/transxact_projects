import { NextResponse } from "next/server";
import { markNotificationAsRead } from "@/services/notification.service";

export async function POST(request: Request): Promise<Response> {
  try {
    const payload = (await request.json()) as { notificationId?: number };
    const notificationId = Number(payload.notificationId);
    if (!Number.isInteger(notificationId) || notificationId <= 0) {
      return NextResponse.json(
        { error: "notificationId must be a positive integer." },
        { status: 400 },
      );
    }

    await markNotificationAsRead(notificationId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to mark notification as read.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
