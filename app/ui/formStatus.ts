export interface FormStatus {
  tone: "success" | "error" | "info";
  message: string;
}

export const statusBadgeClassMap: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400",
  inactive: "bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400",
  pending: "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400",
};

export const roleBadgeClassMap: Record<string, string> = {
  admin: "bg-primary/10 text-primary",
  member: "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400",
};
