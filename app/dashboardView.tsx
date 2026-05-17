"use client";

import { useMemo, useState } from "react";
import type { ReactElement } from "react";
import Link from "next/link";
import { FiArrowDown, FiArrowUp } from "react-icons/fi";
import InlineStatus from "@/app/ui/inlineStatus";
import { useSseRefresh } from "@/app/ui/useSseRefresh";

interface AssigneeTaskSummary {
  assigneeName: string | null;
  total: number;
}

interface ProjectIssueSummary {
  projectName: string;
  total: number;
}

interface DashboardViewProps {
  openTasksByAssignee: AssigneeTaskSummary[];
  overdueTaskCount: number;
  openIssuesByProject: ProjectIssueSummary[];
}

type SortDirection = "asc" | "desc";

function resolveAssigneeName(assigneeName: string | null): string {
  if (!assigneeName || !assigneeName.trim()) {
    return "Unassigned";
  }
  return assigneeName;
}

function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural;
}

export default function DashboardView({
  openIssuesByProject,
  openTasksByAssignee,
  overdueTaskCount,
}: DashboardViewProps): ReactElement {
  useSseRefresh();
  const [taskFilter, setTaskFilter] = useState("");
  const [issueFilter, setIssueFilter] = useState("");
  const [taskSortDirection, setTaskSortDirection] = useState<SortDirection>("desc");
  const [issueSortDirection, setIssueSortDirection] = useState<SortDirection>("desc");

  const filteredAndSortedTasks = useMemo(() => {
    const normalizedFilter = taskFilter.trim().toLowerCase();
    const rows = openTasksByAssignee.filter((row) =>
      resolveAssigneeName(row.assigneeName).toLowerCase().includes(normalizedFilter),
    );

    return rows.sort((a, b) => {
      const countDelta = a.total - b.total;
      if (countDelta !== 0) {
        return taskSortDirection === "asc" ? countDelta : -countDelta;
      }
      const aName = resolveAssigneeName(a.assigneeName);
      const bName = resolveAssigneeName(b.assigneeName);
      return aName.localeCompare(bName);
    });
  }, [openTasksByAssignee, taskFilter, taskSortDirection]);

  const filteredAndSortedIssues = useMemo(() => {
    const normalizedFilter = issueFilter.trim().toLowerCase();
    const rows = openIssuesByProject.filter((row) =>
      row.projectName.toLowerCase().includes(normalizedFilter),
    );

    return rows.sort((a, b) => {
      const countDelta = a.total - b.total;
      if (countDelta !== 0) {
        return issueSortDirection === "asc" ? countDelta : -countDelta;
      }
      return a.projectName.localeCompare(b.projectName);
    });
  }, [issueFilter, issueSortDirection, openIssuesByProject]);

  const toggleTaskSortDirection = (): void => {
    setTaskSortDirection((current) => (current === "desc" ? "asc" : "desc"));
  };

  const toggleIssueSortDirection = (): void => {
    setIssueSortDirection((current) => (current === "desc" ? "asc" : "desc"));
  };

  const issueStatusMessage =
    overdueTaskCount > 0
      ? `${overdueTaskCount} ${pluralize(overdueTaskCount, "task", "tasks")} overdue`
      : "All tasks on track";
  const TaskSortIcon = taskSortDirection === "desc" ? FiArrowDown : FiArrowUp;
  const IssueSortIcon = issueSortDirection === "desc" ? FiArrowDown : FiArrowUp;

  return (
    <section className="flex flex-col gap-2">
      <div className="grid gap-2 grid-cols-3">
        <Link href="/tasks" className="border rounded-lg bg-card shadow-card p-2.5">
          <p className="text-muted-foreground text-xs font-medium">Overdue tasks</p>
          <p className="mt-1 text-xl font-bold">{overdueTaskCount}</p>
        </Link>
        <Link href="/tasks" className="border rounded-lg bg-card shadow-card p-2.5">
          <p className="text-muted-foreground text-xs font-medium">Active assignees</p>
          <p className="mt-1 text-xl font-bold">{openTasksByAssignee.length}</p>
        </Link>
        <Link href="/issues" className="border rounded-lg bg-card shadow-card p-2.5">
          <p className="text-muted-foreground text-xs font-medium">Projects with open issues</p>
          <p className="mt-1 text-xl font-bold">{openIssuesByProject.length}</p>
        </Link>
      </div>

      <InlineStatus
        tone={overdueTaskCount > 0 ? "error" : "success"}
        message={issueStatusMessage}
      />

      <section className="rounded-lg border bg-card shadow-card p-2.5">
        <div className="flex flex-wrap gap-2 justify-between mb-2">
          <h2>Open tasks by assignee</h2>
          <div className="flex items-center gap-1.5">
            <input
              type="search"
              value={taskFilter}
              onChange={(event) => setTaskFilter(event.target.value)}
              className="min-w-40 border rounded-md bg-accent text-foreground text-sm px-2 py-1.5 transition-colors focus:border-primary"
              placeholder="Filter by assignee"
              aria-label="Filter assignees"
            />
            <button
              type="button"
              className="inline-flex items-center justify-center gap-1 border rounded-md bg-accent text-muted-foreground cursor-pointer text-sm font-semibold min-h-7 px-2 py-1.5 transition-colors hover:border-border hover:text-foreground"
              onClick={toggleTaskSortDirection}
            >
              <span className="inline-flex items-center gap-1">
                <TaskSortIcon className="shrink-0" aria-hidden="true" />
                <span>
                  Sort {taskSortDirection === "desc" ? "highest first" : "lowest first"}
                </span>
              </span>
            </button>
          </div>
        </div>

        <div className="max-h-64 overflow-auto border rounded-md">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th scope="col" className="sticky top-0 z-10 bg-accent text-muted-foreground text-xs font-bold uppercase tracking-wider px-2 py-1.5 text-left border-b">Assignee</th>
                <th scope="col" className="sticky top-0 z-10 bg-accent text-muted-foreground text-xs font-bold uppercase tracking-wider px-2 py-1.5 text-left border-b">Open tasks</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedTasks.length === 0 ? (
                <tr>
                  <td colSpan={2} className="text-muted-foreground text-center py-2">
                    No matching assignees.
                  </td>
                </tr>
              ) : (
                filteredAndSortedTasks.map((item, index) => (
                  <tr key={`${resolveAssigneeName(item.assigneeName)}-${index}`} className="transition-colors hover:bg-accent">
                    <td className="border-b px-2 py-1.5 text-left">{resolveAssigneeName(item.assigneeName)}</td>
                    <td className="border-b px-2 py-1.5 text-left">
                      <Link
                        href={`/tasks?search=${encodeURIComponent(resolveAssigneeName(item.assigneeName))}`}
                        className="inline-flex items-center gap-1 text-primary font-semibold text-sm hover:text-primary/80"
                      >
                        {item.total}
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-lg border bg-card shadow-card p-2.5">
        <div className="flex flex-wrap gap-2 justify-between mb-2">
          <h2>Open issues by project</h2>
          <div className="flex items-center gap-1.5">
            <input
              type="search"
              value={issueFilter}
              onChange={(event) => setIssueFilter(event.target.value)}
              className="min-w-40 border rounded-md bg-accent text-foreground text-sm px-2 py-1.5 transition-colors focus:border-primary"
              placeholder="Filter by project"
              aria-label="Filter projects"
            />
            <button
              type="button"
              className="inline-flex items-center justify-center gap-1 border rounded-md bg-accent text-muted-foreground cursor-pointer text-sm font-semibold min-h-7 px-2 py-1.5 transition-colors hover:border-border hover:text-foreground"
              onClick={toggleIssueSortDirection}
            >
              <span className="inline-flex items-center gap-1">
                <IssueSortIcon className="shrink-0" aria-hidden="true" />
                <span>
                  Sort {issueSortDirection === "desc" ? "highest first" : "lowest first"}
                </span>
              </span>
            </button>
          </div>
        </div>

        <div className="max-h-64 overflow-auto border rounded-md">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th scope="col" className="sticky top-0 z-10 bg-accent text-muted-foreground text-xs font-bold uppercase tracking-wider px-2 py-1.5 text-left border-b">Project</th>
                <th scope="col" className="sticky top-0 z-10 bg-accent text-muted-foreground text-xs font-bold uppercase tracking-wider px-2 py-1.5 text-left border-b">Open issues</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedIssues.length === 0 ? (
                <tr>
                  <td colSpan={2} className="text-muted-foreground text-center py-2">
                    No matching projects.
                  </td>
                </tr>
              ) : (
                filteredAndSortedIssues.map((item) => (
                  <tr key={item.projectName} className="transition-colors hover:bg-accent">
                    <td className="border-b px-2 py-1.5 text-left">{item.projectName}</td>
                    <td className="border-b px-2 py-1.5 text-left">
                      <Link
                        href={`/issues?search=${encodeURIComponent(item.projectName)}`}
                        className="inline-flex items-center gap-1 text-primary font-semibold text-sm hover:text-primary/80"
                      >
                        {item.total}
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
