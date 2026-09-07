"use client";

import { clsx } from "clsx";
import { forwardRef, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, invalid, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      className={clsx(
        "h-9 w-full rounded-md border bg-surface px-3 text-sm placeholder:text-ink-subtle transition-colors focus:outline-none focus:ring-2 focus:ring-accent/30",
        invalid
          ? "border-danger focus:border-danger focus:ring-danger/30"
          : "border-border-subtle focus:border-accent",
        className,
      )}
      {...props}
    />
  );
});