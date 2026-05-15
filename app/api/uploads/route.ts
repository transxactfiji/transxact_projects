import { NextResponse } from "next/server";
import { uploadAttachment } from "@/services/attachment.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const taskIdRaw = formData.get("taskId");
    const issueIdRaw = formData.get("issueId");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    const taskId = taskIdRaw ? Number(taskIdRaw) : undefined;
    const issueId = issueIdRaw ? Number(issueIdRaw) : undefined;

    const result = await uploadAttachment(file, taskId, issueId);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message.includes("signed in") ? 401 : message.includes("limit") || message.includes("allowed") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
