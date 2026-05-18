"use server";

import { and, count, eq, inArray, isNull, lt } from "drizzle-orm";
import db, { ensureDbSchema } from "@/db/connection";
import { caseItem, issue, project, supportCase, task, user } from "@/db/schema";
import { requireSessionUser } from "./session.service";

export interface AssigneeTaskSummary {
  assigneeName: string | null;
  total: number;
}

export interface ProjectIssueSummary {
  projectName: string;
  total: number;
}

export interface CaseSummary {
  projectName: string;
  total: number;
}

export interface ItemStatusSummary {
  status: string;
  total: number;
}

export interface DashboardData {
  openTasksByAssignee: AssigneeTaskSummary[];
  overdueTaskCount: number;
  openIssuesByProject: ProjectIssueSummary[];
  openCasesByProject: CaseSummary[];
  itemsByStatus: ItemStatusSummary[];
}

export async function getDashboardData(): Promise<DashboardData> {
  await requireSessionUser();
  await ensureDbSchema();

  const nowIso = new Date().toISOString();

  const [openTasksByAssignee, overdueTasks, openIssuesByProject, openCasesByProject, itemsByStatus] =
    await Promise.all([
      db
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
        .groupBy(user.name),

      db
        .select({ total: count(task.id) })
        .from(task)
        .where(
          and(
            isNull(task.deletedAt),
            inArray(task.status, ["not_started", "in_progress"]),
            lt(task.dueAt, nowIso),
          ),
        ),

      db
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
        .groupBy(project.name),

      db
        .select({
          projectName: project.name,
          total: count(supportCase.id),
        })
        .from(supportCase)
        .innerJoin(project, eq(supportCase.projectId, project.id))
        .where(
          and(
            isNull(supportCase.deletedAt),
            isNull(project.deletedAt),
            inArray(supportCase.status, ["open", "in_progress"]),
          ),
        )
        .groupBy(project.name),

      db
        .select({
          status: caseItem.status,
          total: count(caseItem.id),
        })
        .from(caseItem)
        .where(isNull(caseItem.deletedAt))
        .groupBy(caseItem.status),
    ]);

  return {
    openTasksByAssignee,
    overdueTaskCount: overdueTasks[0]?.total ?? 0,
    openIssuesByProject,
    openCasesByProject,
    itemsByStatus,
  };
}
