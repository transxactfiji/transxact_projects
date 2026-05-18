"use client";

import { useMemo, useState } from "react";
import type { ReactElement } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import AppButton from "@/app/ui/appButton";
import PageHeading from "@/app/ui/pageHeading";
import InlineStatus from "@/app/ui/inlineStatus";
import { useSseRefresh } from "@/app/ui/useSseRefresh";
import type {
  AssigneeTaskSummary,
  CaseSummary,
  ItemStatusSummary,
  ProjectIssueSummary,
} from "@/services/dashboard.service";

interface DashboardViewProps {
  openTasksByAssignee: AssigneeTaskSummary[];
  overdueTaskCount: number;
  openIssuesByProject: ProjectIssueSummary[];
  openCasesByProject: CaseSummary[];
  itemsByStatus: ItemStatusSummary[];
  totalOpenTasks: number;
  totalOpenCases: number;
  itemsPending: number;
}

type SortDirection = "asc" | "desc";

const ITEM_STATUS_LABELS: Record<string, string> = {
  rework: "Needs rework",
  feedback: "Awaiting feedback",
  closed: "Closed",
};

function resolveAssigneeName(assigneeName: string | null): string {
  if (!assigneeName || !assigneeName.trim()) {
    return "Unassigned";
  }
  return assigneeName;
}

function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural;
}

function itemStatusLabel(status: string): string {
  return ITEM_STATUS_LABELS[status] ?? status;
}

function itemStatusVariant(status: string): "default" | "secondary" | "outline" {
  if (status === "rework") return "default";
  if (status === "feedback") return "secondary";
  return "outline";
}

export default function DashboardView({
  openIssuesByProject,
  openTasksByAssignee,
  overdueTaskCount,
  openCasesByProject,
  itemsByStatus,
  totalOpenTasks,
  totalOpenCases,
  itemsPending,
}: DashboardViewProps): ReactElement {
  useSseRefresh();
  const [taskFilter, setTaskFilter] = useState("");
  const [issueFilter, setIssueFilter] = useState("");
  const [caseFilter, setCaseFilter] = useState("");
  const [taskSortDirection, setTaskSortDirection] = useState<SortDirection>("desc");
  const [issueSortDirection, setIssueSortDirection] = useState<SortDirection>("desc");
  const [caseSortDirection, setCaseSortDirection] = useState<SortDirection>("desc");

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

  const filteredAndSortedCases = useMemo(() => {
    const normalizedFilter = caseFilter.trim().toLowerCase();
    const rows = openCasesByProject.filter((row) =>
      row.projectName.toLowerCase().includes(normalizedFilter),
    );

    return rows.sort((a, b) => {
      const countDelta = a.total - b.total;
      if (countDelta !== 0) {
        return caseSortDirection === "asc" ? countDelta : -countDelta;
      }
      return a.projectName.localeCompare(b.projectName);
    });
  }, [caseFilter, caseSortDirection, openCasesByProject]);

  const toggleTaskSortDirection = (): void => {
    setTaskSortDirection((current) => (current === "desc" ? "asc" : "desc"));
  };

  const toggleIssueSortDirection = (): void => {
    setIssueSortDirection((current) => (current === "desc" ? "asc" : "desc"));
  };

  const toggleCaseSortDirection = (): void => {
    setCaseSortDirection((current) => (current === "desc" ? "asc" : "desc"));
  };

  const issueStatusMessage =
    overdueTaskCount > 0
      ? `${overdueTaskCount} ${pluralize(overdueTaskCount, "task", "tasks")} overdue`
      : "All tasks on track";

  return (
    <section className="flex flex-col gap-2">
      <div className="grid gap-2 grid-cols-3">
        <Link href="/cases" className="border rounded-lg bg-card shadow-card p-2.5">
          <p className="text-muted-foreground text-xs font-medium">Open cases</p>
          <p className="mt-1 text-xl font-bold">{totalOpenCases}</p>
        </Link>
        <Link href="/items" className="border rounded-lg bg-card shadow-card p-2.5">
          <p className="text-muted-foreground text-xs font-medium">Items pending</p>
          <p className="mt-1 text-xl font-bold">{itemsPending}</p>
        </Link>
        <Link href="/tasks" className="border rounded-lg bg-card shadow-card p-2.5">
          <p className="text-muted-foreground text-xs font-medium">Open tasks</p>
          <p className="mt-1 text-xl font-bold">{totalOpenTasks}</p>
        </Link>
      </div>

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
          <PageHeading level={2}>Open cases by project</PageHeading>
          <div className="flex items-center gap-1.5">
            <Input
              type="search"
              value={caseFilter}
              onChange={(event) => setCaseFilter(event.target.value)}
              className="min-w-40 bg-accent text-sm"
              placeholder="Filter by project"
              aria-label="Filter case projects"
            />
            <AppButton
              variant="secondary"
              startIcon={caseSortDirection === "desc" ? <ArrowDown className="size-4" /> : <ArrowUp className="size-4" />}
              onClick={toggleCaseSortDirection}
              className="text-sm"
            >
              Sort {caseSortDirection === "desc" ? "highest first" : "lowest first"}
            </AppButton>
          </div>
        </div>

        <div className="max-h-96 overflow-auto border rounded-md">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th scope="col" className="sticky top-0 z-10 bg-accent text-muted-foreground text-xs font-bold uppercase tracking-wider px-2 py-1.5 text-left border-b">Project</th>
                <th scope="col" className="sticky top-0 z-10 bg-accent text-muted-foreground text-xs font-bold uppercase tracking-wider px-2 py-1.5 text-left border-b">Open cases</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedCases.length === 0 ? (
                <tr>
                  <td colSpan={2} className="text-muted-foreground text-center py-2">
                    No matching projects.
                  </td>
                </tr>
              ) : (
                filteredAndSortedCases.map((item) => (
                  <tr key={item.projectName} className="transition-colors hover:bg-accent">
                    <td className="border-b px-2 py-1.5 text-left">{item.projectName}</td>
                    <td className="border-b px-2 py-1.5 text-left">
                      <Link
                        href={`/cases?search=${encodeURIComponent(item.projectName)}`}
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
          <PageHeading level={2}>Items by status</PageHeading>
        </div>

        <div className="max-h-96 overflow-auto border rounded-md">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th scope="col" className="sticky top-0 z-10 bg-accent text-muted-foreground text-xs font-bold uppercase tracking-wider px-2 py-1.5 text-left border-b">Status</th>
                <th scope="col" className="sticky top-0 z-10 bg-accent text-muted-foreground text-xs font-bold uppercase tracking-wider px-2 py-1.5 text-left border-b">Count</th>
              </tr>
            </thead>
            <tbody>
              {itemsByStatus.length === 0 ? (
                <tr>
                  <td colSpan={2} className="text-muted-foreground text-center py-2">
                    No items.
                  </td>
                </tr>
              ) : (
                itemsByStatus.map((item) => (
                  <tr key={item.status} className="transition-colors hover:bg-accent">
                    <td className="border-b px-2 py-1.5 text-left">
                      <Badge variant={itemStatusVariant(item.status)}>
                        {itemStatusLabel(item.status)}
                      </Badge>
                    </td>
                    <td className="border-b px-2 py-1.5 text-left">
                      <Link
                        href={`/items?status=${encodeURIComponent(item.status)}`}
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
          <PageHeading level={2}>Open tasks by assignee</PageHeading>
          <div className="flex items-center gap-1.5">
            <Input
              type="search"
              value={taskFilter}
              onChange={(event) => setTaskFilter(event.target.value)}
              className="min-w-40 bg-accent text-sm"
              placeholder="Filter by assignee"
              aria-label="Filter assignees"
            />
            <AppButton
              variant="secondary"
              startIcon={taskSortDirection === "desc" ? <ArrowDown className="size-4" /> : <ArrowUp className="size-4" />}
              onClick={toggleTaskSortDirection}
              className="text-sm"
            >
              Sort {taskSortDirection === "desc" ? "highest first" : "lowest first"}
            </AppButton>
          </div>
        </div>

        <div className="max-h-96 overflow-auto border rounded-md">
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
          <PageHeading level={2}>Open issues by project</PageHeading>
          <div className="flex items-center gap-1.5">
            <Input
              type="search"
              value={issueFilter}
              onChange={(event) => setIssueFilter(event.target.value)}
              className="min-w-40 bg-accent text-sm"
              placeholder="Filter by project"
              aria-label="Filter projects"
            />
            <AppButton
              variant="secondary"
              startIcon={issueSortDirection === "desc" ? <ArrowDown className="size-4" /> : <ArrowUp className="size-4" />}
              onClick={toggleIssueSortDirection}
              className="text-sm"
            >
              Sort {issueSortDirection === "desc" ? "highest first" : "lowest first"}
            </AppButton>
          </div>
        </div>

        <div className="max-h-96 overflow-auto border rounded-md">
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
