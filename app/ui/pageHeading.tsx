import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeadingProps {
  level?: 1 | 2 | 3;
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
}

export default function PageHeading({
  level = 2,
  children,
  icon,
  className,
}: PageHeadingProps) {
  const Tag = `h${level}` as ElementType;

  return (
    <Tag
      className={cn(
        level === 1 && "text-xl font-bold",
        level === 2 && "text-base font-semibold",
        level === 3 && "text-sm font-semibold",
        icon && "inline-flex items-center gap-1.5",
        className,
      )}
    >
      {icon}
      <span>{children}</span>
    </Tag>
  );
}
