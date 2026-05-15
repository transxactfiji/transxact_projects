import { NextResponse } from "next/server";
import db, { ensureDbSchema } from "@/db/connection";
import { userSession } from "@/db/schema";
import { requireSessionUser } from "@/services/session.service";
import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  try {
    const currentUser = await requireSessionUser();
    await ensureDbSchema();

    const sessions = await db
      .select({
        id: userSession.id,
        deviceLabel: userSession.deviceLabel,
        ipAddress: userSession.ipAddress,
        createdAt: userSession.createdAt,
        lastUsedAt: userSession.lastUsedAt,
        expiresAt: userSession.expiresAt,
        isActive: userSession.isActive,
      })
      .from(userSession)
      .where(eq(userSession.userId, currentUser.id))
      .orderBy(desc(userSession.lastUsedAt))
      .limit(50);

    return NextResponse.json({ sessions });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message.includes("signed in") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
