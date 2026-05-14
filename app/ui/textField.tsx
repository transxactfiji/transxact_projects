import type { InputHTMLAttributes, ReactElement } from "react";
import { cx } from "./cx";

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
    <div className={cx("field-wrap", containerClassName)}>
      <label
        htmlFor={id}
        className="field-label"
      >
        {label}
      </label>
      <input
        id={id}
        className={cx("text-input", error && "is-invalid", className)}
        aria-invalid={Boolean(error)}
        aria-describedby={noteId}
        {...props}
      />
      {noteId ? (
        <p
          id={noteId}
          className={cx("field-note", error && "is-error")}
        >
          {error ?? hint}
        </p>
      ) : null}
    </div>
  );
}
