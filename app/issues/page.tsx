import type { ReactElement } from "react";
import { redirect } from "next/navigation";
import IssuesWorkflowView from "./issuesWorkflowView";
import { listIssueWorkflowData } from "@/services/workflow.service";

export const dynamic = "force-dynamic";

export default async function IssuesPage(): Promise<ReactElement> {
  let data: Awaited<ReturnType<typeof listIssueWorkflowData>>;
  try {
    data = await listIssueWorkflowData();
  } catch (error) {
    if (error instanceof Error && error.message === "You must be signed in to continue.") {
      redirect("/auth");
    }

    throw error;
  }

  return (
    <IssuesWorkflowView
      projects={data.projects}
      tasks={data.tasks}
      assignees={data.assignees}
      issues={data.issues}
    />
  );
}
