"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ReactElement } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { FiFolder, FiPlus } from "react-icons/fi";
import AppButton from "@/app/ui/appButton";
import InlineStatus from "@/app/ui/inlineStatus";
import Modal from "@/app/ui/modal";
import TextField from "@/app/ui/textField";
import { Badge } from "@/components/ui/badge";
import { useSseRefresh } from "@/app/ui/useSseRefresh";
import {
  createCase,
  type CaseListItem,
  type ProjectOption,
} from "@/services/workflow.service";
import type { CaseType } from "@/db/schema";

interface CaseListViewProps {
  cases: CaseListItem[];
  projects: ProjectOption[];
}

export default function CaseListView({
  cases: initialCases,
  projects,
}: CaseListViewProps): ReactElement {
  useSseRefresh();
  const router = useRouter();
  const [cases, setCases] = useState<CaseListItem[]>(initialCases);
  const prevInitialCases = useRef(initialCases);

  useEffect(() => {
    if (initialCases !== prevInitialCases.current) {
      setCases(initialCases);
      prevInitialCases.current = initialCases;
    }
  }, [initialCases]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [projectId, setProjectId] = useState(projects[0]?.id ?? 0);
  const [caseType, setCaseType] = useState<CaseType>("support");
  const [error, setError] = useState<string | null>(null);

  const refreshCases = useCallback(async () => {
    try {
      const res = await fetch("/api/cases", {
        cache: "no-store",
        credentials: "same-origin",
      });
      if (res.ok) {
        setCases(await res.json());
      }
    } catch {
      // Best effort
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(refreshCases, 30000);
    return () => clearInterval(interval);
  }, [refreshCases]);

  const handleCreate = async () => {
    setError(null);
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!projectId) {
      setError("Project is required.");
      return;
    }
    setIsSubmitting(true);
    try {
      await createCase({
        projectId,
        title,
        description: description || undefined,
        customerName: customerName || undefined,
        type: caseType,
      });
      toast.success("Case created.");
      setIsModalOpen(false);
      setTitle("");
      setDescription("");
      setCustomerName("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create case.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="flex flex-col gap-2 min-h-0">
      <section className="rounded-lg border bg-card shadow-card p-2.5">
        <AppButton
          className="mb-4"
          onClick={() => {
            setIsModalOpen(true);
            setProjectId(projects[0]?.id ?? 0);
            setCaseType("support");
          }}
          startIcon={<FiPlus aria-hidden="true" />}
        >
          Create case
        </AppButton>

        {cases.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
            <div className="text-muted-foreground opacity-40">
              <FiFolder
                size={32}
                aria-hidden="true"
              />
            </div>
            <p className="text-lg font-semibold">No cases yet</p>
            <p>Create your first case to track project work.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {cases.map((c) => (
              <Link
                key={c.id}
                href={`/cases/${c.id}`}
                className="border rounded-lg bg-card shadow p-3 no-underline text-inherit transition-shadow hover:shadow-lg flex flex-col gap-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="font-semibold text-sm leading-tight min-w-0">
                    {c.title}
                  </div>
                  <Badge
                    variant={statusVariant(c.status)}
                    className="shrink-0"
                  >
                    {statusLabel(c.status)}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                  <Badge variant={typeVariant(c.type)}>
                    {typeLabel(c.type)}
                  </Badge>
                  <span className="opacity-50">&middot;</span>
                  <span className="inline-flex items-center gap-1">
                    {c.projectColor && (
                      <span
                        className="inline-block w-2.5 h-2.5 rounded-full border border-border shrink-0"
                        style={{ backgroundColor: c.projectColor }}
                      />
                    )}
                    {c.projectName}
                  </span>
                  {c.customerName && (
                    <>
                      <span className="opacity-50">&middot;</span>
                      <span>{c.customerName}</span>
                    </>
                  )}
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {c.taskCount} {c.taskCount === 1 ? "task" : "tasks"}
                  </span>
                  <span>by {c.createdBy}</span>
                </div>
                <div className="text-xs text-muted-foreground/70">
                  {new Date(c.createdAt).toLocaleDateString()}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setError(null);
        }}
        title="Create case"
      >
        {error && (
          <div className="mb-2">
            <InlineStatus
              tone="error"
              message={error}
            />
          </div>
        )}
        <div className="flex flex-col gap-3">
          <TextField
            id="case-title"
            label="Case title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Brief summary of the case"
            required
          />
          <div className="flex flex-col gap-1">
            <label
              htmlFor="case-project"
              className="text-sm font-semibold text-muted-foreground"
            >
              Project
            </label>
            <select
              id="case-project"
              className="w-full border rounded-md bg-accent text-foreground text-sm px-2.5 py-1.5 transition-colors focus:border-primary"
              value={projectId}
              onChange={(e) => setProjectId(Number(e.target.value))}
            >
              {projects.map((p) => (
                <option
                  key={p.id}
                  value={p.id}
                >
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label
              htmlFor="case-type"
              className="text-sm font-semibold text-muted-foreground"
            >
              Type
            </label>
            <select
              id="case-type"
              className="w-full border rounded-md bg-accent text-foreground text-sm px-2.5 py-1.5 transition-colors focus:border-primary"
              value={caseType}
              onChange={(e) => setCaseType(e.target.value as CaseType)}
            >
              {CASE_TYPE_OPTIONS.map((o) => (
                <option
                  key={o.value}
                  value={o.value}
                >
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <TextField
            id="case-customer"
            label="Customer name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Optional"
          />
          <TextField
            id="case-desc"
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional details"
          />
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <AppButton
            variant="ghost"
            onClick={() => setIsModalOpen(false)}
            disabled={isSubmitting}
          >
            Cancel
          </AppButton>
          <AppButton
            onClick={handleCreate}
            isLoading={isSubmitting}
            loadingLabel="Creating..."
          >
            Create case
          </AppButton>
        </div>
      </Modal>
    </section>
  );
}

function statusLabel(status: string): string {
  if (status === "open") return "Open";
  if (status === "in_progress") return "In Progress";
  return "Closed";
}

function statusVariant(
  status: string,
): "default" | "secondary" | "destructive" {
  if (status === "open") return "destructive";
  if (status === "in_progress") return "default";
  return "secondary";
}

const CASE_TYPE_OPTIONS: { value: CaseType; label: string }[] = [
  { value: "development", label: "Development" },
  { value: "support", label: "Support" },
  { value: "maintenance", label: "Maintenance" },
  { value: "incident", label: "Incident" },
  { value: "consulting", label: "Consulting" },
  { value: "training", label: "Training" },
  { value: "other", label: "Other" },
];

function typeLabel(type: string): string {
  const found = CASE_TYPE_OPTIONS.find((o) => o.value === type);
  return found?.label ?? type;
}

function typeVariant(type: string): "default" | "secondary" | "destructive" {
  if (type === "incident") return "destructive";
  if (type === "development") return "default";
  return "secondary";
}
