import type { InputHTMLAttributes, ReactElement } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  containerClassName?: string;
}

export default function TextField({
  className,
  containerClassName,
  error,
  hint,
  id,
  label,
  ...props
}: TextFieldProps): ReactElement {
  const noteId = hint || error ? `${id}-note` : undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", containerClassName)}>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        className={cn(error && "border-destructive focus-visible:ring-destructive", className)}
        aria-invalid={Boolean(error)}
        aria-describedby={noteId}
        {...props}
      />
      {noteId ? (
        <p
          id={noteId}
          className={cn(
            "text-sm",
            error ? "text-destructive" : "text-muted-foreground"
          )}
        >
          {error ?? hint}
        </p>
      ) : null}
    </div>
  );
}
