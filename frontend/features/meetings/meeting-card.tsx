"use client";

import { useMemo } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Monitor, ChevronRight } from "lucide-react";

import type { MeetingRead } from "@/lib/query-keys";
import { clsx } from "clsx";

interface MeetingCardProps {
  meeting: MeetingRead;
  active?: boolean;
}

function formatDuration(seconds: number): string {
  if (seconds <= 0) return "—";
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem ? `${h}h ${rem}m` : `${h}h`;
}

export function MeetingCard({ meeting, active }: MeetingCardProps) {
  const date = useMemo(() => {
    try {
      return format(new Date(meeting.starts_at), "MMM d");
    } catch {
      return meeting.starts_at.slice(0, 10);
    }
  }, [meeting.starts_at]);

  return (
    <Link
      href={`/meetings/${meeting.id}`}
      className={clsx(
        "group flex items-center gap-3 rounded-lg border border-border-subtle bg-surface p-3 transition-all hover:-translate-y-0.5 hover:border-border-strong hover:shadow-md",
        active && "border-accent ring-2 ring-accent/30",
      )}
    >
      <span className="grid h-10 w-8 shrink-0 place-items-center rounded-md bg-accent/10 text-xs font-bold text-accent">
        {meeting.host
          .split(" ")
          .map((p) => p[0])
          .filter(Boolean)
          .slice(0, 2)
          .join("")
          .toUpperCase() || "?"}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink">
          {meeting.title}
        </p>
        <p className="mt-0.5 text-xs text-ink-muted">
          {date} · {formatDuration(meeting.duration_seconds)} ·{" "}
          <span className="text-ink-muted">{meeting.host}</span>
        </p>
      </div>
      <ChevronRight className="h-4 w-4 text-ink-subtle transition-transform group-hover:translate-x-0.5" />
      <Monitor className="h-4 w-4 text-ink-subtle" />
    </Link>
  );
}