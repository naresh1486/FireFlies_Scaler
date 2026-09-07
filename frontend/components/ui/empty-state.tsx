"use client";

import { clsx } from "clsx";
import { Inbox } from "lucide-react";
import type { HTMLAttributes } from "react";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  action,
  icon,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={clsx(
        "flex flex-col items-center justify-center rounded-lg border border-dashed border-border-subtle bg-surface px-6 py-10 text-center",
        className,
      )}
    >
      <span className="grid h-12 w-12 place-items-center rounded-full bg-surface-2 text-ink-muted">
        {icon ?? <Inbox className="h-5 w-5" />}
      </span>
      <h3 className="mt-3 text-base font-semibold text-ink">{title}</h3>
      {description ? (
        <p className="mt-1 max-w-sm text-sm text-ink-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  title,
  description,
  className,
  ...rest
}: { title: string; description?: string } & HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        "rounded-lg border border-danger/30 bg-danger/5 px-6 py-5 text-danger",
        className,
      )}
      role="alert"
      {...rest}
    >
      <p className="font-semibold">{title}</p>
      {description ? <p className="mt-1 text-sm">{description}</p> : null}
    </div>
  );
}