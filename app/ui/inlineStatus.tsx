import { cx } from "./cx";
import type { ReactElement } from "react";
import { FiAlertCircle, FiCheckCircle, FiInfo } from "react-icons/fi";

type StatusTone = "success" | "error" | "info";

interface InlineStatusProps {
  tone: StatusTone;
  message: string | null;
}

export default function InlineStatus({
  message,
  tone,
}: InlineStatusProps): ReactElement | null {
  if (!message) {
    return null;
  }

  const icon =
    tone === "success" ? (
      <FiCheckCircle aria-hidden="true" />
    ) : tone === "error" ? (
      <FiAlertCircle aria-hidden="true" />
    ) : (
      <FiInfo aria-hidden="true" />
    );

  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={cx("inline-status", `is-${tone}`)}
    >
      <span className="inline-status-content">
        <span className="inline-status-icon">{icon}</span>
        <span>{message}</span>
      </span>
    </p>
  );
}
