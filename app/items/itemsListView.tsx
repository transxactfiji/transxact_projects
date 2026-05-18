"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactElement } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FiEdit2, FiList, FiPlus, FiSearch, FiTrash2 } from "react-icons/fi";
import AppButton from "@/app/ui/appButton";
import { useSseRefresh } from "@/app/ui/useSseRefresh";
import type { CaseOption, ItemOption } from "@/services/workflow.service";
import ItemModal, {
  defaultItemFormValues,
  type ItemFormValues,
} from "./itemModal";

interface ItemsListViewProps {
  items: ItemOption[];
  cases: CaseOption[];
}

export default function ItemsListView({
  items: initialItems,
  cases,
}: ItemsListViewProps): ReactElement {
  useSseRefresh();
  const router = useRouter();
  const [items, setItems] = useState<ItemOption[]>(initialItems);
  const prevInitialItems = useRef(initialItems);

  useEffect(() => {
    if (initialItems !== prevInitialItems.current) {
      setItems(initialItems);
      prevInitialItems.current = initialItems;
    }
  }, [initialItems]);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterCaseId, setFilterCaseId] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingItem, setEditingItem] = useState<ItemOption | undefined>(
    undefined,
  );
  const [formValues, setFormValues] = useState<ItemFormValues>(
    defaultItemFormValues(cases[0]?.id),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredItems = useMemo(() => {
    let result = items;

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (i) =>
          i.description.toLowerCase().includes(q) ||
          i.caseTitle.toLowerCase().includes(q) ||
          i.projectName.toLowerCase().includes(q),
      );
    }

    if (filterCaseId) {
      const cid = Number(filterCaseId);
      result = result.filter((i) => i.caseId === cid);
    }

    return result;
  }, [items, searchQuery, filterCaseId]);

  const clearFiltersActive = searchQuery || filterCaseId;

  const refreshItems = useCallback(async () => {
    try {
      const res = await fetch("/api/items", {
        cache: "no-store",
        credentials: "same-origin",
      });
      if (res.ok) {
        setItems(await res.json());
      }
    } catch {
      // Best effort
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(refreshItems, 30000);
    return () => clearInterval(interval);
  }, [refreshItems]);

  const handleFieldChange = (
    field: keyof ItemFormValues,
    value: string | number,
  ) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
  };

  const openCreate = () => {
    setModalMode("create");
    setEditingItem(undefined);
    setFormValues(defaultItemFormValues(cases[0]?.id));
    setIsLoadingDetail(false);
    setError(null);
    setIsModalOpen(true);
  };

  const openEdit = (item: ItemOption) => {
    setModalMode("edit");
    setEditingItem(item);
    setFormValues(defaultItemFormValues());
    setIsLoadingDetail(true);
    setError(null);
    setIsModalOpen(true);

    fetch(`/api/cases/${item.caseId}/items/${item.id}`, {
      credentials: "same-origin",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load item details.");
        return res.json();
      })
      .then((data) => {
        setFormValues({
          caseId: data.caseId,
          dateReported: data.dateReported?.slice(0, 10) ?? "",
          description: data.description ?? "",
          impact: data.impact ?? "one",
          severity: data.severity ?? "minor",
          classification: data.classification ?? "bug",
          status: data.status ?? "rework",
        });
      })
      .catch(() => {
        setError("Failed to load item details.");
      })
      .finally(() => {
        setIsLoadingDetail(false);
      });
  };

  const handleSubmit = async () => {
    setError(null);
    if (!formValues.description.trim()) {
      setError("Description is required.");
      return;
    }
    if (modalMode === "create" && !formValues.caseId) {
      setError("Case is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (modalMode === "create") {
        const res = await fetch(`/api/cases/${formValues.caseId}/items`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dateReported: formValues.dateReported,
            description: formValues.description.trim(),
            impact: formValues.impact,
            severity: formValues.severity,
            classification: formValues.classification.trim() || "bug",
          }),
          credentials: "same-origin",
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to create item.");
        }
        toast.success("Item created.");
      } else if (editingItem) {
        const res = await fetch(
          `/api/cases/${editingItem.caseId}/items/${editingItem.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              dateReported: formValues.dateReported,
              description: formValues.description.trim(),
              impact: formValues.impact,
              severity: formValues.severity,
              classification: formValues.classification.trim() || "bug",
              status: formValues.status,
            }),
            credentials: "same-origin",
          },
        );
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to update item.");
        }
        toast.success("Item updated.");
      }
      setIsModalOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (item: ItemOption) => {
    if (!confirm(`Delete "${item.description}" and its tasks?`)) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/cases/${item.caseId}/items/${item.id}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete item.");
      }
      toast.success("Item deleted.");
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete item.",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <section className="flex flex-col gap-2 min-h-0">
      <section className="rounded-lg border bg-card shadow-card p-2.5">
        <AppButton
          onClick={openCreate}
          startIcon={<FiPlus aria-hidden="true" />}
        >
          Create item
        </AppButton>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
            <div className="text-muted-foreground opacity-40">
              <FiList
                size={32}
                aria-hidden="true"
              />
            </div>
            <p className="text-lg font-semibold">No items yet</p>
            <p>
              Create a case first, then add items here or from the case detail
              page.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-1.5 mb-2 flex-wrap">
              <div className="relative flex-1 min-w-40">
                <FiSearch
                  size={16}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none z-10"
                />
                <input
                  className="w-full border rounded-md bg-accent text-foreground text-sm pl-8 pr-2.5 py-1.5 transition-colors focus:border-primary placeholder:text-muted-foreground"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search items..."
                />
              </div>
              <select
                className="min-w-40 border rounded-md bg-accent text-foreground text-sm px-2 py-1.5 transition-colors focus:border-primary"
                value={filterCaseId}
                onChange={(e) => setFilterCaseId(e.target.value)}
                aria-label="Filter by case"
              >
                <option value="">All cases</option>
                {cases.map((c) => (
                  <option
                    key={c.id}
                    value={c.id}
                  >
                    {c.projectName} / {c.title}
                  </option>
                ))}
              </select>
              {clearFiltersActive && (
                <button
                  type="button"
                  className="inline-flex items-center gap-1 border rounded-md bg-accent text-muted-foreground cursor-pointer text-sm font-semibold px-2 py-1.5 transition-colors hover:border-border hover:text-foreground"
                  onClick={() => {
                    setSearchQuery("");
                    setFilterCaseId("");
                  }}
                >
                  Clear
                </button>
              )}
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                {filteredItems.length} of {items.length}
              </span>
            </div>

            <div className="max-h-96 overflow-auto border rounded-md">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th
                      scope="col"
                      className="sticky top-0 z-10 bg-accent text-muted-foreground text-xs font-bold uppercase tracking-wider px-2 py-1.5 text-left border-b"
                    >
                      Item
                    </th>
                    <th
                      scope="col"
                      className="sticky top-0 z-10 bg-accent text-muted-foreground text-xs font-bold uppercase tracking-wider px-2 py-1.5 text-left border-b"
                    >
                      Project
                    </th>
                    <th
                      scope="col"
                      className="sticky top-0 z-10 bg-accent text-muted-foreground text-xs font-bold uppercase tracking-wider px-2 py-1.5 text-left border-b"
                    >
                      Case
                    </th>
                    <th
                      scope="col"
                      className="sticky top-0 z-10 bg-accent text-muted-foreground text-xs font-bold uppercase tracking-wider px-2 py-1.5 text-left border-b"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="text-muted-foreground text-center py-2"
                      >
                        No matching items.
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => (
                      <tr
                        key={item.id}
                        className="transition-colors hover:bg-accent"
                      >
                        <td className="border-b px-2 py-1.5 text-left">
                          <Link
                            href={`/cases/${item.caseId}/items/${item.id}`}
                            className="no-underline text-inherit block"
                          >
                            <div className="font-semibold">
                              {item.description}
                            </div>
                          </Link>
                        </td>
                        <td className="border-b px-2 py-1.5 text-left text-muted-foreground">
                          {item.projectName}
                        </td>
                        <td className="border-b px-2 py-1.5 text-left text-muted-foreground">
                          {item.caseTitle}
                        </td>
                        <td className="border-b px-2 py-1.5 text-left">
                          <div className="flex items-center gap-1">
                            <AppButton
                              variant="ghost"
                              onClick={() => openEdit(item)}
                            >
                              <FiEdit2 size={14} />
                            </AppButton>
                            <AppButton
                              variant="ghost"
                              onClick={() => handleDelete(item)}
                              disabled={isDeleting}
                            >
                              <FiTrash2 size={14} />
                            </AppButton>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      <ItemModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        mode={modalMode}
        cases={cases}
        values={formValues}
        onChange={handleFieldChange}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        isLoadingDetail={isLoadingDetail}
        error={error}
      />
    </section>
  );
}
