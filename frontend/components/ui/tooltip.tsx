"use client";

import { useState } from "react";
import { clsx } from "clsx";

interface TooltipProps {
  label: string;
  children: React.ReactNode;
  side?: "top" | "bottom";
  className?: string;
}

/**
 * Lightweight CSS-only tooltip. Hover/focus reveals the label via the
 * `group-hover` / `group-focus` utilities.
 */
export function Tooltip({ label, children, side = "top", className }: TooltipProps) {
  const [open, setOpen] = useState(false);
  return (
    <span
      className={clsx("group relative inline-flex", className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      tabIndex={0}
    >
      {children}
      <span
        role="tooltip"
        className={clsx(
          "pointer-events-none absolute left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-md bg-ink px-2 py-1 text-[11px] font-medium text-white shadow-md transition-all",
          side === "top"
            ? "bottom-full mb-1.5"
            : "top-full mt-1.5",
          open ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-0.5 pointer-events-none",
        )}
      >
        {label}
      </span>
    </span>
  );
}