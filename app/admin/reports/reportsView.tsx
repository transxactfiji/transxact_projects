"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ReactElement } from "react";
import { toast } from "sonner";
import { FiCheckCircle, FiExternalLink } from "react-icons/fi";
import AppButton from "@/app/ui/appButton";
import InlineStatus from "@/app/ui/inlineStatus";
import PageHeading from "@/app/ui/pageHeading";
import { formatDateTime } from "@/lib/utils";
import {
  resolveMessageReport,
  type AdminMessageReportItem,
} from "@/services/report.service";

interface ReportsViewProps {
  reports: AdminMessageReportItem[];
}

interface StatusState {
  tone: "success" | "error" | "info";
  message: string;
}

export default function ReportsView({ reports }: ReportsViewProps): ReactElement {
  const router = useRouter();
  const [resolvingId, setResolvingId] = useState<number | null>(null);
  const [status, setStatus] = useState<StatusState | null>(null);

  const handleResolve = async (reportId: number): Promise<void> => {
    setResolvingId(reportId);
    try {
      await resolveMessageReport(reportId);
      setStatus({ tone: "success", message: "Report marked as resolved." });
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to resolve report.";
      setStatus({ tone: "error", message });
      toast.error(message);
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <section className="flex flex-col gap-2 min-h-0">
      <section className="rounded-lg border bg-card shadow-card p-2.5">
        <div className="flex flex-wrap gap-2 justify-between mb-2">
          <div>
            <PageHeading level={2}>Abuse report queue</PageHeading>
            <p>Review conversation and message reports from users.</p>
          </div>
        </div>

        <InlineStatus
          tone={status?.tone ?? "info"}
          message={status?.message ?? null}
        />

        <div className="max-h-64 overflow-auto border rounded-md">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th scope="col" className="sticky top-0 z-10 bg-accent text-muted-foreground text-xs font-bold uppercase tracking-wider px-2 py-1.5 text-left border-b">Status</th>
                <th scope="col" className="sticky top-0 z-10 bg-accent text-muted-foreground text-xs font-bold uppercase tracking-wider px-2 py-1.5 text-left border-b">Reported by</th>
                <th scope="col" className="sticky top-0 z-10 bg-accent text-muted-foreground text-xs font-bold uppercase tracking-wider px-2 py-1.5 text-left border-b">Participants</th>
                <th scope="col" className="sticky top-0 z-10 bg-accent text-muted-foreground text-xs font-bold uppercase tracking-wider px-2 py-1.5 text-left border-b">Reason</th>
                <th scope="col" className="sticky top-0 z-10 bg-accent text-muted-foreground text-xs font-bold uppercase tracking-wider px-2 py-1.5 text-left border-b">Message</th>
                <th scope="col" className="sticky top-0 z-10 bg-accent text-muted-foreground text-xs font-bold uppercase tracking-wider px-2 py-1.5 text-left border-b">Created</th>
                <th scope="col" className="sticky top-0 z-10 bg-accent text-muted-foreground text-xs font-bold uppercase tracking-wider px-2 py-1.5 text-left border-b">Action</th>
              </tr>
            </thead>
            <tbody>
              {reports.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="text-muted-foreground text-center border-b px-2 py-1.5 text-left"
                  >
                    No reports in queue.
                  </td>
                </tr>
              ) : (
                reports.map((report) => (
                  <tr key={report.id} className="transition-colors hover:bg-accent">
                    <td className="border-b px-2 py-1.5 text-left">{report.status}</td>
                    <td className="border-b px-2 py-1.5 text-left">{report.reporterLabel}</td>
                    <td className="border-b px-2 py-1.5 text-left">{report.participantsLabel}</td>
                    <td className="border-b px-2 py-1.5 text-left">{report.reason}</td>
                    <td className="border-b px-2 py-1.5 text-left">{report.messagePreview}</td>
                    <td className="border-b px-2 py-1.5 text-left">{formatDateTime(report.createdAt)}</td>
                    <td className="border-b px-2 py-1.5 text-left">
                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/messages?conversationId=${report.conversationId}`}
                          className="inline-flex items-center gap-1 text-primary font-semibold text-sm hover:text-primary/80"
                        >
                          <span className="inline-flex items-center gap-1">
                            <FiExternalLink aria-hidden="true" />
                            <span>Open convo</span>
                          </span>
                        </Link>
                        {report.status === "open" ? (
                          <AppButton
                            variant="secondary"
                            onClick={() => void handleResolve(report.id)}
                            isLoading={resolvingId === report.id}
                            loadingLabel="Updating..."
                            startIcon={<FiCheckCircle aria-hidden="true" />}
                          >
                            Resolve
                          </AppButton>
                        ) : null}
                      </div>
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
