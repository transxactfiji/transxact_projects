import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api-helpers";
import { listAllItemOptions } from "@/services/workflow.service";

export async function GET(_request: NextRequest) {
  try {
    const items = await listAllItemOptions();
    return NextResponse.json(items, { status: 200 });
  } catch (error) {
    return apiError(error);
  }
}
