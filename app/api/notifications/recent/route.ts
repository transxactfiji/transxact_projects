import { NextResponse } from "next/server";
import { listRecentNotifications } from "@/services/notification.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const limitParam = Number(url.searchParams.get("limit"));
    const resolvedLimit =
      Number.isFinite(limitParam) && limitParam > 0
        ? Math.min(Math.floor(limitParam), 20)
        : 8;
    const notifications = await listRecentNotifications(resolvedLimit);
    return NextResponse.json({ notifications });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load notifications.";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
