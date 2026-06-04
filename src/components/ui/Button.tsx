import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "soft" | "danger";
  isLoading?: boolean;
  children: ReactNode;
};

export function Button({ variant = "soft", isLoading, className, children, disabled, ...props }: ButtonProps) {
  return (
    <button
      className={cn("btn", variant === "primary" && "btn-primary", variant === "soft" && "btn-soft", variant === "danger" && "btn-danger", className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {children}
    </button>
  );
}
