import { NextResponse } from "next/server";
import { getUnreadInboxCounts } from "@/services/notification.service";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  try {
    const counts = await getUnreadInboxCounts();
    return NextResponse.json(counts);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load inbox counts.";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
