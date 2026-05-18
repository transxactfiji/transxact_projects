import type { ReactElement } from "react";
import { redirect } from "next/navigation";
import DashboardView from "@/app/dashboardView";
import { getDashboardData } from "@/services/dashboard.service";

export const dynamic = "force-dynamic";

export default async function HomePage(): Promise<ReactElement> {
  let data: Awaited<ReturnType<typeof getDashboardData>>;
  try {
    data = await getDashboardData();
  } catch (error) {
    if (error instanceof Error && error.message === "You must be signed in to continue.") {
      redirect("/auth");
    }

    throw error;
  }

  const totalOpenTasks = data.openTasksByAssignee.reduce(
    (sum, row) => sum + row.total,
    0,
  );

  const totalOpenCases = data.openCasesByProject.reduce(
    (sum, row) => sum + row.total,
    0,
  );

  const itemsPending = data.itemsByStatus
    .filter((row) => row.status !== "closed")
    .reduce((sum, row) => sum + row.total, 0);

  return (
    <DashboardView
      openTasksByAssignee={data.openTasksByAssignee}
      overdueTaskCount={data.overdueTaskCount}
      openIssuesByProject={data.openIssuesByProject}
      openCasesByProject={data.openCasesByProject}
      itemsByStatus={data.itemsByStatus}
      totalOpenTasks={totalOpenTasks}
      totalOpenCases={totalOpenCases}
      itemsPending={itemsPending}
    />
  );
}
