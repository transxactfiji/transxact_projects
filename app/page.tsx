import { and, count, eq, inArray, isNull, lt } from "drizzle-orm";
import db, { ensureDbSchema } from "@/db/connection";
import { issue, project, task, user } from "@/db/schema";
import DashboardView from "@/app/dashboardView";
import type { ReactElement } from "react";

export const dynamic = "force-dynamic";

export default async function HomePage(): Promise<ReactElement> {
  await ensureDbSchema();

  const nowIso = new Date().toISOString();

  const openTasksByAssignee = await db
    .select({
      assigneeName: user.name,
      total: count(task.id),
    })
    .from(task)
    .leftJoin(user, eq(task.assigneeUserId, user.id))
    .where(
      and(
        isNull(task.deletedAt),
        inArray(task.status, ["not_started", "in_progress"]),
      ),
    )
    .groupBy(user.name);

  const overdueTasks = await db
    .select({
      total: count(task.id),
    })
    .from(task)
    .where(
      and(
        isNull(task.deletedAt),
        inArray(task.status, ["not_started", "in_progress"]),
        lt(task.dueAt, nowIso),
      ),
    );

  const openIssuesByProject = await db
    .select({
      projectName: project.name,
      total: count(issue.id),
    })
    .from(issue)
    .innerJoin(project, eq(issue.projectId, project.id))
    .where(
      and(
        isNull(issue.deletedAt),
        isNull(project.deletedAt),
        inArray(issue.status, ["open", "in_progress"]),
      ),
    )
    .groupBy(project.name);

  return (
    <DashboardView
      openTasksByAssignee={openTasksByAssignee}
      overdueTaskCount={overdueTasks[0]?.total ?? 0}
      openIssuesByProject={openIssuesByProject}
    />
  );
}
