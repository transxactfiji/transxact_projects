import type { CSSProperties, ReactElement, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

type ButtonVariant = "primary" | "secondary" | "ghost";

interface AppButtonProps {
  children: ReactNode;
  variant?: ButtonVariant;
  fullWidth?: boolean;
  isLoading?: boolean;
  loadingLabel?: string;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  type?: "button" | "submit" | "reset";
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  style?: CSSProperties;
}

const variantMap: Record<ButtonVariant, "default" | "secondary" | "ghost"> = {
  primary: "default",
  secondary: "secondary",
  ghost: "ghost",
};

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
  onClick,
  style,
}: AppButtonProps): ReactElement {
  const isDisabled = disabled || isLoading;
  const buttonContent = isLoading ? (loadingLabel ?? "Working...") : children;

  return (
    <Button
      type={type}
      variant={variantMap[variant]}
      className={fullWidth ? `w-full ${className ?? ""}` : className}
      disabled={isDisabled}
      onClick={onClick}
      style={style}
    >
      {isLoading ? <Loader2 className="animate-spin" /> : null}
      {!isLoading && startIcon ? startIcon : null}
      {buttonContent}
      {!isLoading && endIcon ? endIcon : null}
    </Button>
  );
}
