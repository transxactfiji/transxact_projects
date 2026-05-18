"use client";

import type { ReactElement } from "react";
import AppButton from "@/app/ui/appButton";
import InlineStatus from "@/app/ui/inlineStatus";
import Modal from "@/app/ui/modal";
import TextField from "@/app/ui/textField";
import type { CaseOption } from "@/services/workflow.service";

const IMPACT_OPTIONS = [
  { value: "many", label: "Many affected" },
  { value: "some", label: "Some affected" },
  { value: "one", label: "One affected" },
];

const SEVERITY_OPTIONS = [
  { value: "major", label: "Major disruption" },
  { value: "minor", label: "Minor disruption" },
  { value: "degraded", label: "Degraded service" },
  { value: "none", label: "No disruption" },
];

const ITEM_STATUS_OPTIONS = [
  { value: "rework", label: "Rework" },
  { value: "feedback", label: "Feedback" },
  { value: "closed", label: "Closed" },
];

export interface ItemFormValues {
  caseId: number;
  dateReported: string;
  description: string;
  impact: string;
  severity: string;
  classification: string;
  status: string;
}

interface ItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  cases: CaseOption[];
  values: ItemFormValues;
  onChange: (field: keyof ItemFormValues, value: string | number) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  isLoadingDetail: boolean;
  error: string | null;
}

export function defaultItemFormValues(caseId?: number): ItemFormValues {
  return {
    caseId: caseId ?? 0,
    dateReported: new Date().toISOString().slice(0, 10),
    description: "",
    impact: "one",
    severity: "minor",
    classification: "bug",
    status: "rework",
  };
}

export default function ItemModal({
  isOpen,
  onClose,
  mode,
  cases,
  values,
  onChange,
  onSubmit,
  isSubmitting,
  isLoadingDetail,
  error,
}: ItemModalProps): ReactElement {
  const title = mode === "create" ? "Create item" : "Edit item";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      {error && (
        <div className="mb-2">
          <InlineStatus tone="error" message={error} />
        </div>
      )}
      {isLoadingDetail ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          Loading item details...
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {mode === "create" && (
            <div className="flex flex-col gap-1">
              <label
                htmlFor="item-case"
                className="text-sm font-semibold text-muted-foreground"
              >
                Case
              </label>
              <select
                id="item-case"
                className="w-full border rounded-md bg-accent text-foreground text-sm px-2.5 py-1.5 transition-colors focus:border-primary"
                value={values.caseId}
                onChange={(e) => onChange("caseId", Number(e.target.value))}
              >
                {cases.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.projectName} / {c.title}
                  </option>
                ))}
              </select>
            </div>
          )}
          <TextField
            id="item-date"
            label="Date reported"
            type="date"
            value={values.dateReported}
            onChange={(e) => onChange("dateReported", e.target.value)}
          />
          <TextField
            id="item-desc"
            label="Description"
            value={values.description}
            onChange={(e) => onChange("description", e.target.value)}
            placeholder="Brief description of the issue"
            required
          />
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label
                htmlFor="item-impact"
                className="text-sm font-semibold text-muted-foreground"
              >
                Impact
              </label>
              <select
                id="item-impact"
                className="w-full border rounded-md bg-accent text-foreground text-sm px-2.5 py-1.5 transition-colors focus:border-primary"
                value={values.impact}
                onChange={(e) => onChange("impact", e.target.value)}
              >
                {IMPACT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label
                htmlFor="item-severity"
                className="text-sm font-semibold text-muted-foreground"
              >
                Severity
              </label>
              <select
                id="item-severity"
                className="w-full border rounded-md bg-accent text-foreground text-sm px-2.5 py-1.5 transition-colors focus:border-primary"
                value={values.severity}
                onChange={(e) => onChange("severity", e.target.value)}
              >
                {SEVERITY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <TextField
            id="item-classification"
            label="Classification"
            value={values.classification}
            onChange={(e) => onChange("classification", e.target.value)}
            placeholder="bug"
          />
          {mode === "edit" && (
            <div className="flex flex-col gap-1">
              <label
                htmlFor="item-status"
                className="text-sm font-semibold text-muted-foreground"
              >
                Status
              </label>
              <select
                id="item-status"
                className="w-full border rounded-md bg-accent text-foreground text-sm px-2.5 py-1.5 transition-colors focus:border-primary"
                value={values.status}
                onChange={(e) => onChange("status", e.target.value)}
              >
                {ITEM_STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
      <div className="flex justify-end gap-2 mt-4">
        <AppButton
          variant="ghost"
          onClick={onClose}
          disabled={isSubmitting}
        >
          Cancel
        </AppButton>
        <AppButton
          onClick={onSubmit}
          isLoading={isSubmitting}
          loadingLabel={mode === "create" ? "Creating..." : "Saving..."}
        >
          {mode === "create" ? "Create item" : "Save changes"}
        </AppButton>
      </div>
    </Modal>
  );
}
