"use client";

import { Loader2 } from "lucide-react";
import { clsx } from "clsx";

interface SpinnerProps {
  className?: string;
  size?: number;
}

export function Spinner({ className, size = 16 }: SpinnerProps) {
  return (
    <Loader2
      className={clsx("animate-spin", className)}
      style={{ width: size, height: size }}
      aria-label="Loading"
    />
  );
}