import type { ReactElement } from "react";
import { redirect } from "next/navigation";
import ProjectsWorkflowView from "./projectsWorkflowView";
import { listProjectWorkflowData } from "@/services/workflow.service";

export const dynamic = "force-dynamic";

export default async function ProjectsPage(): Promise<ReactElement> {
  let data: Awaited<ReturnType<typeof listProjectWorkflowData>>;
  try {
    data = await listProjectWorkflowData();
  } catch (error) {
    if (error instanceof Error && error.message === "You must be signed in to continue.") {
      redirect("/auth");
    }

    throw error;
  }

  return <ProjectsWorkflowView projects={data.projects} />;
}
