import { cn } from "@/lib/utils";
import React from "react";

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "info" | "success" | "warning" | "danger";
  title?: string;
}

export function Alert({
  className,
  variant = "info",
  title,
  children,
  ...props
}: AlertProps) {
  const variantStyles = {
    info: "bg-blue-500/10 border-blue-500/30 text-blue-300",
    success: "bg-emerald-500/10 border-emerald-500/30 text-emerald-300",
    warning: "bg-amber-500/10 border-amber-500/30 text-amber-300",
    danger: "bg-rose-500/10 border-rose-500/30 text-rose-300",
  };

  return (
    <div
      role="alert"
      className={cn("rounded-lg border p-4 text-xs leading-relaxed", variantStyles[variant], className)}
      {...props}
    >
      {title && <h5 className="font-semibold mb-1 text-sm">{title}</h5>}
      <div className="opacity-90">{children}</div>
    </div>
  );
}
