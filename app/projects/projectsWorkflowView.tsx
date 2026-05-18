"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ReactElement } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  FiArchive,
  FiEdit2,
  FiEye,
  FiEyeOff,
  FiPlus,
  FiRotateCcw,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import AppButton from "@/app/ui/appButton";
import InlineStatus from "@/app/ui/inlineStatus";
import PageHeading from "@/app/ui/pageHeading";
import { FormStatus } from "@/app/ui/formStatus";
import Modal from "@/app/ui/modal";
import TextField from "@/app/ui/textField";
import { useSseRefresh } from "@/app/ui/useSseRefresh";
import {
  archiveProject,
  createProject,
  deleteProject,
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
  if (normalizedName.length < 3)
    return "Project name must be at least 3 characters.";
  return undefined;
}

export default function ProjectsWorkflowView({
  projects,
}: ProjectsWorkflowViewProps): ReactElement {
  useSseRefresh();
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [projectColor, setProjectColor] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isArchivingId, setIsArchivingId] = useState<number | null>(null);
  const [isTogglingFollowId, setIsTogglingFollowId] = useState<number | null>(
    null,
  );
  const [isEditingId, setIsEditingId] = useState<number | null>(null);
  const [editProjectName, setEditProjectName] = useState("");
  const [editProjectDescription, setEditProjectDescription] = useState("");
  const [editProjectColor, setEditProjectColor] = useState("");
  const [isSavingEditId, setIsSavingEditId] = useState<number | null>(null);
  const [status, setStatus] = useState<FormStatus | null>(null);
  const [confirmArchiveId, setConfirmArchiveId] = useState<number | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [isDeletingArchivedId, setIsDeletingArchivedId] = useState<
    number | null
  >(null);
  const [confirmDeleteArchivedId, setConfirmDeleteArchivedId] = useState<
    number | null
  >(null);
  const [archivedProjects, setArchivedProjects] = useState<
    ProjectWorkflowItem[]
  >([]);
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
      await createProject({
        name: projectName,
        description: projectDescription || undefined,
        color: projectColor || undefined,
      });
      setProjectName("");
      setProjectDescription("");
      setProjectColor("");
      toast.success("Project created");
      setIsModalOpen(false);
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to create project.";
      setStatus({ tone: "error", message });
      toast.error(message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleFollow = async (
    projectId: number,
    follow: boolean,
  ): Promise<void> => {
    setIsTogglingFollowId(projectId);
    try {
      await setProjectFollow(projectId, follow);
      setStatus({
        tone: "success",
        message: follow ? "Project followed." : "Project unfollowed.",
      });
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to update follow state.";
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
      const message =
        error instanceof Error ? error.message : "Unable to archive project.";
      setStatus({ tone: "error", message });
      toast.error(message);
    } finally {
      setIsArchivingId(null);
    }
  };

  const handleDeleteRequest = (projectId: number): void => {
    setConfirmDeleteId(projectId);
  };

  const handleDeleteConfirm = async (): Promise<void> => {
    if (confirmDeleteId === null) return;
    const projectId = confirmDeleteId;
    setConfirmDeleteId(null);
    setIsDeletingId(projectId);
    try {
      await deleteProject(projectId);
      setStatus({ tone: "success", message: "Project permanently deleted." });
      toast.success("Project permanently deleted");
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to delete project.";
      setStatus({ tone: "error", message });
      toast.error(message);
    } finally {
      setIsDeletingId(null);
    }
  };

  const handleDeleteArchivedRequest = (projectId: number): void => {
    setConfirmDeleteArchivedId(projectId);
  };

  const handleDeleteArchivedConfirm = async (): Promise<void> => {
    if (confirmDeleteArchivedId === null) return;
    const projectId = confirmDeleteArchivedId;
    setConfirmDeleteArchivedId(null);
    setIsDeletingArchivedId(projectId);
    try {
      await deleteProject(projectId);
      toast.success("Project permanently deleted");
      setArchivedProjects((prev) => prev.filter((p) => p.id !== projectId));
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to delete project.";
      toast.error(message);
    } finally {
      setIsDeletingArchivedId(null);
    }
  };

  const handleShowArchived = async (): Promise<void> => {
    setShowArchived(true);
    setLoadingArchived(true);
    try {
      const archived = await listArchivedProjects();
      setArchivedProjects(archived);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to load archived projects.";
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
      const message =
        error instanceof Error ? error.message : "Unable to restore project.";
      toast.error(message);
    } finally {
      setRestoringId(null);
    }
  };

  const handleStartEditProject = (item: ProjectWorkflowItem): void => {
    setEditProjectName(item.name);
    setEditProjectDescription(item.description ?? "");
    setEditProjectColor(item.color ?? "");
    setIsEditingId(item.id);
  };

  const handleCancelEditProject = (): void => {
    setIsEditingId(null);
    setEditProjectName("");
    setEditProjectDescription("");
    setEditProjectColor("");
  };

  const handleSaveEditProject = async (projectId: number): Promise<void> => {
    if (!editProjectName.trim()) {
      toast.error("Project name is required.");
      return;
    }

    setIsSavingEditId(projectId);
    try {
      await updateProject(projectId, {
        name: editProjectName.trim(),
        description: editProjectDescription || undefined,
        color: editProjectColor || undefined,
      });
      setIsEditingId(null);
      setEditProjectName("");
      setEditProjectDescription("");
      setEditProjectColor("");
      toast.success("Project updated");
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to update project.";
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
          <p className="text-muted-foreground text-xs font-medium">
            Active projects
          </p>
          <p className="mt-1 text-xl font-bold">{projects.length}</p>
        </article>
        <article className="border rounded-lg bg-card shadow-card p-2.5">
          <p className="text-muted-foreground text-xs font-medium">
            Tracked tasks
          </p>
          <p className="mt-1 text-xl font-bold">{summary.totalTasks}</p>
        </article>
        <article className="border rounded-lg bg-card shadow-card p-2.5">
          <p className="text-muted-foreground text-xs font-medium">
            Open issues
          </p>
          <p className="mt-1 text-xl font-bold">{summary.totalOpenIssues}</p>
        </article>
      </div>

      <section className="rounded-lg border bg-card shadow-card p-2.5">
        <div className="flex flex-wrap gap-2 justify-between mb-2">
          <PageHeading level={2}>Projects</PageHeading>
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

        <div className="max-h-128 overflow-auto">
          {projects.length === 0 ? (
            <p className="text-muted-foreground text-center p-4">
              No projects yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {projects.map((item) => (
                <div
                  key={item.id}
                  className="border rounded-lg bg-card shadow-sm p-3 flex flex-col gap-2.5 transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start gap-2 min-w-0">
                    {item.color && (
                      <span
                        className="inline-block w-3 h-3 rounded-full border border-border shrink-0 mt-1.5"
                        style={{ backgroundColor: item.color }}
                        title={item.color}
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <Link
                          href="/cases"
                          className="text-primary font-semibold text-sm hover:text-primary/80 truncate"
                        >
                          {item.name}
                        </Link>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => handleStartEditProject(item)}
                              className="inline-flex items-center border-0 bg-transparent text-muted-foreground cursor-pointer p-0 transition-colors hover:text-foreground shrink-0"
                            >
                              <FiEdit2 size={13} />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>Edit project</TooltipContent>
                        </Tooltip>
                      </div>
                      {item.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1 bg-accent rounded-full px-2 py-0.5 font-medium">
                      {item.taskCount} {item.taskCount === 1 ? "task" : "tasks"}
                    </span>
                    <span className="inline-flex items-center gap-1 bg-accent rounded-full px-2 py-0.5 font-medium">
                      {item.openIssueCount} open{" "}
                      {item.openIssueCount === 1 ? "issue" : "issues"}
                    </span>
                    <span className="ml-auto">
                      {formatDate(item.createdAt)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <AppButton
                      variant="secondary"
                      className="h-8 text-xs px-2"
                      onClick={() =>
                        handleToggleFollow(item.id, !item.isFollowing)
                      }
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
                      className="h-8 text-xs px-2"
                      onClick={() => handleArchiveRequest(item.id)}
                      isLoading={isArchivingId === item.id}
                      loadingLabel="Archiving..."
                      startIcon={<FiArchive aria-hidden="true" />}
                    >
                      Archive
                    </AppButton>
                    <AppButton
                      variant="secondary"
                      className="h-8 text-xs px-2"
                      onClick={() => handleDeleteRequest(item.id)}
                      isLoading={isDeletingId === item.id}
                      loadingLabel="Deleting..."
                      startIcon={<FiTrash2 aria-hidden="true" />}
                    >
                      Delete
                    </AppButton>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {showArchived && (
        <section className="rounded-lg border bg-card shadow-card p-2.5">
          <div className="flex flex-wrap gap-2 justify-between mb-2">
            <PageHeading level={2}>Archived projects</PageHeading>
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
            <p className="text-muted-foreground text-center p-4">
              No archived projects.
            </p>
          ) : (
            <div className="max-h-128 overflow-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {archivedProjects.map((item) => (
                  <div
                    key={item.id}
                    className="border rounded-lg bg-card shadow-sm p-3 flex flex-col gap-2.5 transition-shadow hover:shadow-md"
                  >
                    <div className="flex items-start gap-2 min-w-0">
                      {item.color && (
                        <span
                          className="inline-block w-3 h-3 rounded-full border border-border shrink-0 mt-1.5"
                          style={{ backgroundColor: item.color }}
                          title={item.color}
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <span className="text-foreground font-semibold text-sm">
                          {item.name}
                        </span>
                        {item.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatDate(item.createdAt)}</span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <AppButton
                        variant="secondary"
                        className="h-8 text-xs px-2"
                        onClick={() => handleRestoreProject(item.id)}
                        isLoading={restoringId === item.id}
                        loadingLabel="Restoring..."
                        startIcon={<FiRotateCcw aria-hidden="true" />}
                      >
                        Restore
                      </AppButton>
                      <AppButton
                        variant="secondary"
                        className="h-8 text-xs px-2"
                        onClick={() => handleDeleteArchivedRequest(item.id)}
                        isLoading={isDeletingArchivedId === item.id}
                        loadingLabel="Deleting..."
                        startIcon={<FiTrash2 aria-hidden="true" />}
                      >
                        Delete
                      </AppButton>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setProjectName("");
          setProjectDescription("");
          setProjectColor("");
          setStatus(null);
        }}
        title="Create project"
      >
        <div className="flex flex-col gap-3 mb-2">
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
          <TextField
            id="projectDescription"
            label="Description"
            placeholder="Optional description of the project"
            value={projectDescription}
            onChange={(event) => setProjectDescription(event.target.value)}
            disabled={isCreating}
          />
          <div className="flex flex-col gap-1">
            <label
              htmlFor="projectColor"
              className="text-sm font-semibold text-muted-foreground"
            >
              Color
            </label>
            <div className="flex gap-2 items-center">
              <input
                id="projectColor"
                type="color"
                className="w-10 h-9 border rounded-md bg-accent cursor-pointer p-0.5"
                value={projectColor || "#6366f1"}
                onChange={(event) => setProjectColor(event.target.value)}
                disabled={isCreating}
              />
              <input
                type="text"
                className="flex-1 border rounded-md bg-accent text-foreground text-sm px-2.5 py-1.5 transition-colors focus:border-primary placeholder:text-muted-foreground"
                value={projectColor}
                onChange={(event) => setProjectColor(event.target.value)}
                placeholder="#6366f1"
                disabled={isCreating}
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end">
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

      <Modal
        isOpen={isEditingId !== null}
        onClose={handleCancelEditProject}
        title="Edit project"
      >
        <div className="flex flex-col gap-3 mb-2">
          <TextField
            id="editProjectName"
            label="Project name"
            value={editProjectName}
            onChange={(e) => setEditProjectName(e.target.value)}
            disabled={isSavingEditId !== null}
            required
          />
          <TextField
            id="editProjectDescription"
            label="Description"
            placeholder="Optional description of the project"
            value={editProjectDescription}
            onChange={(e) => setEditProjectDescription(e.target.value)}
            disabled={isSavingEditId !== null}
          />
          <div className="flex flex-col gap-1">
            <label
              htmlFor="editProjectColor"
              className="text-sm font-semibold text-muted-foreground"
            >
              Color
            </label>
            <div className="flex gap-2 items-center">
              <input
                id="editProjectColor"
                type="color"
                className="w-10 h-9 border rounded-md bg-accent cursor-pointer p-0.5"
                value={editProjectColor || "#6366f1"}
                onChange={(e) => setEditProjectColor(e.target.value)}
                disabled={isSavingEditId !== null}
              />
              <input
                type="text"
                className="flex-1 border rounded-md bg-accent text-foreground text-sm px-2.5 py-1.5 transition-colors focus:border-primary placeholder:text-muted-foreground"
                value={editProjectColor}
                onChange={(e) => setEditProjectColor(e.target.value)}
                placeholder="#6366f1"
                disabled={isSavingEditId !== null}
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <AppButton
            variant="ghost"
            onClick={handleCancelEditProject}
            disabled={isSavingEditId !== null}
          >
            Cancel
          </AppButton>
          <AppButton
            onClick={() => void handleSaveEditProject(isEditingId!)}
            isLoading={isSavingEditId !== null}
            loadingLabel="Saving..."
          >
            Save changes
          </AppButton>
        </div>
      </Modal>

      {confirmArchiveId !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2.5"
          onClick={() => setConfirmArchiveId(null)}
        >
          <div
            className="w-full max-w-sm border rounded-lg bg-card shadow-elevated p-3"
            onClick={(e) => e.stopPropagation()}
          >
            <PageHeading level={3}>Archive project</PageHeading>
            <p>
              This will hide the project and its tasks/issues from the active
              workflow. You can restore it from the archived list later.
            </p>
            <div className="flex justify-end gap-1.5">
              <AppButton
                variant="ghost"
                onClick={() => setConfirmArchiveId(null)}
              >
                Cancel
              </AppButton>
              <AppButton
                variant="primary"
                onClick={() => void handleArchiveConfirm()}
              >
                Archive
              </AppButton>
            </div>
          </div>
        </div>
      )}

      {confirmDeleteId !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2.5"
          onClick={() => setConfirmDeleteId(null)}
        >
          <div
            className="w-full max-w-sm border rounded-lg bg-card shadow-elevated p-3"
            onClick={(e) => e.stopPropagation()}
          >
            <PageHeading level={3}>Delete project</PageHeading>
            <p>
              This will permanently delete the project and cannot be undone.
              Consider archiving instead if you may need it later.
            </p>
            <div className="flex justify-end gap-1.5">
              <AppButton
                variant="ghost"
                onClick={() => setConfirmDeleteId(null)}
              >
                Cancel
              </AppButton>
              <AppButton
                variant="primary"
                onClick={() => void handleDeleteConfirm()}
              >
                Delete
              </AppButton>
            </div>
          </div>
        </div>
      )}

      {confirmDeleteArchivedId !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2.5"
          onClick={() => setConfirmDeleteArchivedId(null)}
        >
          <div
            className="w-full max-w-sm border rounded-lg bg-card shadow-elevated p-3"
            onClick={(e) => e.stopPropagation()}
          >
            <PageHeading level={3}>Delete project</PageHeading>
            <p>
              This will permanently delete the archived project. This action
              cannot be undone.
            </p>
            <div className="flex justify-end gap-1.5">
              <AppButton
                variant="ghost"
                onClick={() => setConfirmDeleteArchivedId(null)}
              >
                Cancel
              </AppButton>
              <AppButton
                variant="primary"
                onClick={() => void handleDeleteArchivedConfirm()}
              >
                Delete
              </AppButton>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
