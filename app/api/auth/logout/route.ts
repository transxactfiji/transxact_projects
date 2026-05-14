import { NextResponse } from "next/server";
import { logout } from "@/services/auth.service";

export async function POST(): Promise<Response> {
  try {
    await logout();
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to logout.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
