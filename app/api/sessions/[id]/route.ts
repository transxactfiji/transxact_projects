import { NextResponse } from "next/server";
import db, { ensureDbSchema } from "@/db/connection";
import { userSession } from "@/db/schema";
import { requireSessionUser } from "@/services/session.service";
import { and, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const currentUser = await requireSessionUser();
    await ensureDbSchema();

    const { id } = await params;
    const sessionId = Number(id);

    if (!Number.isInteger(sessionId) || sessionId <= 0) {
      return NextResponse.json({ error: "Invalid session ID." }, { status: 400 });
    }

    const rows = await db
      .select({ id: userSession.id })
      .from(userSession)
      .where(
        and(eq(userSession.id, sessionId), eq(userSession.userId, currentUser.id)),
      )
      .limit(1);

    if (rows.length === 0) {
      return NextResponse.json({ error: "Session not found." }, { status: 404 });
    }

    await db
      .update(userSession)
      .set({ isActive: 0 })
      .where(eq(userSession.id, sessionId));

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message.includes("signed in") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
