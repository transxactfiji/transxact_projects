import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { getAttachmentById, getFilePath } from "@/services/attachment.service";
import { requireSessionUser } from "@/services/session.service";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    await requireSessionUser();
    const { id } = await params;
    const attachmentId = Number(id);

    if (!Number.isInteger(attachmentId) || attachmentId <= 0) {
      return NextResponse.json({ error: "Invalid attachment ID." }, { status: 400 });
    }

    const attachment = await getAttachmentById(attachmentId);
    if (!attachment) {
      return NextResponse.json({ error: "Attachment not found." }, { status: 404 });
    }

    const filePath = await getFilePath(attachment.storagePath);
    const buffer = await readFile(filePath);

    return new Response(buffer, {
      headers: {
        "Content-Type": attachment.mimeType,
        "Content-Disposition": `inline; filename="${attachment.fileName}"`,
        "Content-Length": String(attachment.sizeBytes),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message.includes("signed in") ? 401 : message.includes("not found") || message.includes("ENOENT") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
