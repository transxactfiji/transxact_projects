"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ReactElement } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { FiArchive, FiEdit2, FiEye, FiEyeOff, FiPlus, FiRotateCcw, FiX } from "react-icons/fi";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import AppButton from "@/app/ui/appButton";
import InlineStatus from "@/app/ui/inlineStatus";
import { FormStatus } from "@/app/ui/formStatus";
import Modal from "@/app/ui/modal";
import TextField from "@/app/ui/textField";
import { useSseRefresh } from "@/app/ui/useSseRefresh";
import {
  archiveProject,
  createProject,
  restoreProject,
  setProjectFollow,
  updateProject,
  listArchivedProjects,
  type ProjectWorkflowItem,
} from "@/services/workflow.service";

interface ProjectsWorkflowViewProps {
  projects: ProjectWorkflowItem[];
}

function formatDate(isoDate: string): string {
  const parsedDate = new Date(isoDate);
  if (Number.isNaN(parsedDate.getTime())) return "Unknown";
  return parsedDate.toLocaleDateString();
}

function validateProjectName(rawProjectName: string): string | undefined {
  const normalizedName = rawProjectName.trim().replace(/\s+/g, " ");
  if (!normalizedName) return "Project name is required.";
  if (normalizedName.length < 3) return "Project name must be at least 3 characters.";
  return undefined;
}

export default function ProjectsWorkflowView({
  projects,
}: ProjectsWorkflowViewProps): ReactElement {
  useSseRefresh();
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isArchivingId, setIsArchivingId] = useState<number | null>(null);
  const [isTogglingFollowId, setIsTogglingFollowId] = useState<number | null>(null);
  const [isEditingId, setIsEditingId] = useState<number | null>(null);
  const [editProjectName, setEditProjectName] = useState("");
  const [isSavingEditId, setIsSavingEditId] = useState<number | null>(null);
  const [status, setStatus] = useState<FormStatus | null>(null);
  const [confirmArchiveId, setConfirmArchiveId] = useState<number | null>(null);
  const [archivedProjects, setArchivedProjects] = useState<ProjectWorkflowItem[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [loadingArchived, setLoadingArchived] = useState(false);
  const [restoringId, setRestoringId] = useState<number | null>(null);

  const summary = useMemo(() => {
    return projects.reduce(
      (result, item) => {
        result.totalTasks += item.taskCount;
        result.totalOpenIssues += item.openIssueCount;
        return result;
      },
      { totalTasks: 0, totalOpenIssues: 0 },
    );
  }, [projects]);

  const handleCreateProject = async (): Promise<void> => {
    const validationError = validateProjectName(projectName);
    if (validationError) {
      setStatus({ tone: "error", message: validationError });
      toast.error(validationError);
      return;
    }

    setIsCreating(true);
    try {
      await createProject(projectName);
      setProjectName("");
      toast.success("Project created");
      setIsModalOpen(false);
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to create project.";
      setStatus({ tone: "error", message });
      toast.error(message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleFollow = async (projectId: number, follow: boolean): Promise<void> => {
    setIsTogglingFollowId(projectId);
    try {
      await setProjectFollow(projectId, follow);
      setStatus({ tone: "success", message: follow ? "Project followed." : "Project unfollowed." });
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update follow state.";
      setStatus({ tone: "error", message });
      toast.error(message);
    } finally {
      setIsTogglingFollowId(null);
    }
  };

  const handleArchiveRequest = (projectId: number): void => {
    setConfirmArchiveId(projectId);
  };

  const handleArchiveConfirm = async (): Promise<void> => {
    if (confirmArchiveId === null) return;
    const projectId = confirmArchiveId;
    setConfirmArchiveId(null);
    setIsArchivingId(projectId);
    try {
      await archiveProject(projectId);
      setStatus({ tone: "success", message: "Project archived." });
      toast.success("Project archived");
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to archive project.";
      setStatus({ tone: "error", message });
      toast.error(message);
    } finally {
      setIsArchivingId(null);
    }
  };

  const handleShowArchived = async (): Promise<void> => {
    setShowArchived(true);
    setLoadingArchived(true);
    try {
      const archived = await listArchivedProjects();
      setArchivedProjects(archived);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load archived projects.";
      toast.error(message);
    } finally {
      setLoadingArchived(false);
    }
  };

  const handleRestoreProject = async (projectId: number): Promise<void> => {
    setRestoringId(projectId);
    try {
      await restoreProject(projectId);
      toast.success("Project restored");
      setArchivedProjects((prev) => prev.filter((p) => p.id !== projectId));
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to restore project.";
      toast.error(message);
    } finally {
      setRestoringId(null);
    }
  };

  const handleStartEditProject = (item: ProjectWorkflowItem): void => {
    setEditProjectName(item.name);
    setIsEditingId(item.id);
  };

  const handleCancelEditProject = (): void => {
    setIsEditingId(null);
    setEditProjectName("");
  };

  const handleSaveEditProject = async (projectId: number): Promise<void> => {
    if (!editProjectName.trim()) {
      toast.error("Project name is required.");
      return;
    }

    setIsSavingEditId(projectId);
    try {
      await updateProject(projectId, editProjectName.trim());
      setIsEditingId(null);
      setEditProjectName("");
      toast.success("Project renamed");
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to rename project.";
      setStatus({ tone: "error", message });
      toast.error(message);
    } finally {
      setIsSavingEditId(null);
    }
  };

  return (
    <section className="flex flex-col gap-2 min-h-0">
      <div className="grid gap-2 grid-cols-3">
        <article className="border rounded-lg bg-card shadow-card p-2.5">
          <p className="text-muted-foreground text-xs font-medium">Active projects</p>
          <p className="mt-1 text-xl font-bold">{projects.length}</p>
        </article>
        <article className="border rounded-lg bg-card shadow-card p-2.5">
          <p className="text-muted-foreground text-xs font-medium">Tracked tasks</p>
          <p className="mt-1 text-xl font-bold">{summary.totalTasks}</p>
        </article>
        <article className="border rounded-lg bg-card shadow-card p-2.5">
          <p className="text-muted-foreground text-xs font-medium">Open issues</p>
          <p className="mt-1 text-xl font-bold">{summary.totalOpenIssues}</p>
        </article>
      </div>

      <section className="rounded-lg border bg-card shadow-card p-2.5">
        <div className="flex flex-wrap gap-2 justify-between mb-2">
          <h2>Project workflow board</h2>
          <div className="flex items-center gap-1.5">
            <AppButton
              onClick={handleShowArchived}
              variant="ghost"
              startIcon={<FiArchive aria-hidden="true" />}
            >
              Archived
            </AppButton>
            <AppButton
              onClick={() => setIsModalOpen(true)}
              startIcon={<FiPlus aria-hidden="true" />}
            >
              Create project
            </AppButton>
          </div>
        </div>

        <div className="max-h-64 overflow-auto border rounded-md">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th scope="col" className="sticky top-0 z-10 bg-accent text-muted-foreground text-xs font-bold uppercase tracking-wider px-2 py-1.5 text-left border-b">Project</th>
                <th scope="col" className="sticky top-0 z-10 bg-accent text-muted-foreground text-xs font-bold uppercase tracking-wider px-2 py-1.5 text-left border-b">Tasks</th>
                <th scope="col" className="sticky top-0 z-10 bg-accent text-muted-foreground text-xs font-bold uppercase tracking-wider px-2 py-1.5 text-left border-b">Open issues</th>
                <th scope="col" className="sticky top-0 z-10 bg-accent text-muted-foreground text-xs font-bold uppercase tracking-wider px-2 py-1.5 text-left border-b">Created</th>
                <th scope="col" className="sticky top-0 z-10 bg-accent text-muted-foreground text-xs font-bold uppercase tracking-wider px-2 py-1.5 text-left border-b">Action</th>
              </tr>
            </thead>
            <tbody>
              {projects.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-muted-foreground text-center border-b px-2 py-1.5 text-left">
                    No projects yet.
                  </td>
                </tr>
              ) : (
                projects.map((item) => (
                  <tr key={item.id} className="transition-colors hover:bg-accent">
                    <td className="border-b px-2 py-1.5 text-left">
                      {isEditingId === item.id ? (
                        <div className="flex gap-2 items-center">
                          <input
                            className="w-full border rounded-md bg-accent text-foreground text-sm px-2.5 py-1.5 transition-colors focus:border-primary placeholder:text-muted-foreground w-[200px]"
                            value={editProjectName}
                            onChange={(e) => setEditProjectName(e.target.value)}
                            disabled={isSavingEditId === item.id}
                          />
                          <AppButton
                            variant="ghost"
                            onClick={() => void handleSaveEditProject(item.id)}
                            disabled={isSavingEditId === item.id}
                            isLoading={isSavingEditId === item.id}
                            loadingLabel="Saving..."
                          >
                            Save
                          </AppButton>
                          <AppButton
                            variant="ghost"
                            onClick={handleCancelEditProject}
                            disabled={isSavingEditId === item.id}
                          >
                            Cancel
                          </AppButton>
                        </div>
                      ) : (
                        <div className="flex gap-2 items-center">
                          <Link href="/tasks" className="inline-flex items-center gap-1 text-primary font-semibold text-sm hover:text-primary/80 text-sm">
                            {item.name}
                          </Link>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => handleStartEditProject(item)}
                                className="inline-flex items-center gap-1 border-0 bg-transparent text-primary cursor-pointer text-sm font-semibold p-0 transition-colors hover:text-primary/80"
                              >
                                <FiEdit2 size={13} />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>Rename</TooltipContent>
                          </Tooltip>
                        </div>
                      )}
                    </td>
                    <td className="border-b px-2 py-1.5 text-left">{item.taskCount}</td>
                    <td className="border-b px-2 py-1.5 text-left">{item.openIssueCount}</td>
                    <td className="border-b px-2 py-1.5 text-left">{formatDate(item.createdAt)}</td>
                    <td className="border-b px-2 py-1.5 text-left">
                      <div className="flex items-center gap-1.5">
                        <AppButton
                          variant="secondary"
                          onClick={() => handleToggleFollow(item.id, !item.isFollowing)}
                          isLoading={isTogglingFollowId === item.id}
                          loadingLabel="Updating..."
                          startIcon={
                            item.isFollowing ? (
                              <FiEyeOff aria-hidden="true" />
                            ) : (
                              <FiEye aria-hidden="true" />
                            )
                          }
                        >
                          {item.isFollowing ? "Unfollow" : "Follow"}
                        </AppButton>
                        <AppButton
                          variant="secondary"
                          onClick={() => handleArchiveRequest(item.id)}
                          isLoading={isArchivingId === item.id}
                          loadingLabel="Archiving..."
                          startIcon={<FiArchive aria-hidden="true" />}
                        >
                          Archive
                        </AppButton>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {showArchived && (
        <section className="rounded-lg border bg-card shadow-card p-2.5">
          <div className="flex flex-wrap gap-2 justify-between mb-2">
            <h2>Archived projects</h2>
            <AppButton
              variant="ghost"
              onClick={() => setShowArchived(false)}
              startIcon={<FiX aria-hidden="true" />}
            >
              Close
            </AppButton>
          </div>

          {loadingArchived ? (
            <p className="text-muted-foreground text-center p-4">Loading...</p>
          ) : archivedProjects.length === 0 ? (
            <p className="text-muted-foreground text-center p-4">No archived projects.</p>
          ) : (
            <div className="max-h-64 overflow-auto border rounded-md">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th scope="col" className="sticky top-0 z-10 bg-accent text-muted-foreground text-xs font-bold uppercase tracking-wider px-2 py-1.5 text-left border-b">Project</th>
                    <th scope="col" className="sticky top-0 z-10 bg-accent text-muted-foreground text-xs font-bold uppercase tracking-wider px-2 py-1.5 text-left border-b">Created</th>
                    <th scope="col" className="sticky top-0 z-10 bg-accent text-muted-foreground text-xs font-bold uppercase tracking-wider px-2 py-1.5 text-left border-b">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {archivedProjects.map((item) => (
                    <tr key={item.id} className="transition-colors hover:bg-accent">
                      <td className="border-b px-2 py-1.5 text-left">{item.name}</td>
                      <td className="border-b px-2 py-1.5 text-left">{formatDate(item.createdAt)}</td>
                      <td className="border-b px-2 py-1.5 text-left">
                        <AppButton
                          variant="secondary"
                          onClick={() => handleRestoreProject(item.id)}
                          isLoading={restoringId === item.id}
                          loadingLabel="Restoring..."
                          startIcon={<FiRotateCcw aria-hidden="true" />}
                        >
                          Restore
                        </AppButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setProjectName("");
          setStatus(null);
        }}
        title="Create project"
      >
        <div className="flex items-end gap-2 mb-2">
          <TextField
            id="projectName"
            label="Project name"
            placeholder="Customer portal refresh"
            value={projectName}
            onChange={(event) => {
              setProjectName(event.target.value);
              if (status?.tone === "error") setStatus(null);
            }}
            disabled={isCreating}
            required
          />
          <AppButton
            onClick={handleCreateProject}
            isLoading={isCreating}
            loadingLabel="Creating..."
            startIcon={<FiPlus aria-hidden="true" />}
          >
            Create project
          </AppButton>
        </div>
        <InlineStatus
          tone={status?.tone ?? "info"}
          message={status?.message ?? null}
        />
      </Modal>

      {confirmArchiveId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2.5" onClick={() => setConfirmArchiveId(null)}>
          <div className="w-full max-w-sm border rounded-lg bg-card shadow-elevated p-3" onClick={(e) => e.stopPropagation()}>
            <h3>Archive project</h3>
            <p>
              This will hide the project and its tasks/issues from the active workflow.
              You can restore it from the archived list later.
            </p>
            <div className="flex justify-end gap-1.5">
              <AppButton variant="ghost" onClick={() => setConfirmArchiveId(null)}>
                Cancel
              </AppButton>
              <AppButton variant="primary" onClick={() => void handleArchiveConfirm()}>
                Archive
              </AppButton>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
