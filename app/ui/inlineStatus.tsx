import type { ReactElement } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";

type StatusTone = "success" | "error" | "info";

interface InlineStatusProps {
  tone: StatusTone;
  message: string | null;
}

const iconMap = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

const variantMap: Record<StatusTone, "default" | "destructive"> = {
  success: "default",
  error: "destructive",
  info: "default",
};

const colorMap: Record<StatusTone, string> = {
  success: "border-emerald-600/30 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-950/50 dark:text-emerald-400",
  error: "",
  info: "border-blue-600/30 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-950/50 dark:text-blue-400",
};

export default function InlineStatus({
  message,
  tone,
}: InlineStatusProps): ReactElement | null {
  if (!message) {
    return null;
  }

  const Icon = iconMap[tone];

  return (
    <Alert
      variant={variantMap[tone]}
      className={tone !== "error" ? colorMap[tone] : undefined}
    >
      <Icon className="h-5 w-5" />
      <AlertDescription>
        <p>{message}</p>
      </AlertDescription>
    </Alert>
  );
}
