import type { ButtonHTMLAttributes, ReactElement, ReactNode } from "react";
import { cx } from "./cx";

type ButtonVariant = "primary" | "secondary" | "ghost";

interface AppButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  fullWidth?: boolean;
  isLoading?: boolean;
  loadingLabel?: string;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
}

export default function AppButton({
  children,
  className,
  disabled,
  endIcon,
  fullWidth = false,
  isLoading = false,
  loadingLabel,
  startIcon,
  type = "button",
  variant = "primary",
  ...props
}: AppButtonProps): ReactElement {
  const isDisabled = disabled || isLoading;
  const buttonContent = isLoading ? (loadingLabel ?? "Working...") : children;

  return (
    <button
      type={type}
      className={cx(
        "app-button",
        `is-${variant}`,
        fullWidth && "is-full-width",
        className,
      )}
      disabled={isDisabled}
      {...props}
    >
      <span className="app-button-content">
        {!isLoading && startIcon ? <span className="button-icon">{startIcon}</span> : null}
        <span>{buttonContent}</span>
        {!isLoading && endIcon ? <span className="button-icon">{endIcon}</span> : null}
      </span>
    </button>
  );
}
