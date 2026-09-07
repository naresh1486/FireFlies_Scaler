"use client";

import { useState } from "react";
import {
  Search,
  Bookmark,
  Sparkles,
  Smile,
  BarChart3,
  Plus,
  ChevronDown,
} from "lucide-react";
import { clsx } from "clsx";

interface ContextPanelProps {
  className?: string;
}

export function ContextPanel({ className }: ContextPanelProps) {
  return (
    <aside
      className={clsx(
        "flex w-64 shrink-0 flex-col gap-3 border-r border-border-subtle bg-surface px-3 py-4",
        className,
      )}
    >
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
        <input
          type="search"
          placeholder="Smart Search"
          className="h-9 w-full rounded-md border border-border-subtle bg-surface pl-9 pr-3 text-sm placeholder:text-ink-subtle focus:border-accent focus:outline-none"
        />
      </div>

      <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
        Soundbite is not available for this meeting.
      </div>

      <Accordion label="AI FILTERS" icon={<Sparkles className="h-3.5 w-3.5" />} />
      <Accordion label="SENTIMENTS" icon={<Smile className="h-3.5 w-3.5" />} />
      <Accordion label="SPEAKER TALKTIME" icon={<BarChart3 className="h-3.5 w-3.5" />} />

      <div>
        <div className="flex items-center justify-between px-1 py-1 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
          <span>Topic Trackers</span>
          <button
            type="button"
            aria-label="Add topic tracker"
            className="grid h-5 w-5 place-items-center rounded hover:bg-surface-2"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="mt-2 flex flex-col items-center rounded-md border border-dashed border-border-subtle px-3 py-6 text-center">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-amber-50 text-amber-600">
            #
          </span>
          <p className="mt-2 text-xs font-semibold text-ink">No topic tracker</p>
          <p className="mt-1 text-[11px] text-ink-muted">
            This meeting is not transcribed yet to show keywords mentioned in the meeting.
          </p>
        </div>
      </div>

      <div className="mt-auto px-1 pt-2">
        <button
          type="button"
          aria-label="Bookmark meeting"
          className="grid h-7 w-7 place-items-center rounded-md hover:bg-surface-2"
        >
          <Bookmark className="h-4 w-4 text-ink-muted" />
        </button>
      </div>
    </aside>
  );
}

function Accordion({
  label,
  icon,
}: {
  label: string;
  icon?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-1 py-1 text-[11px] font-semibold uppercase tracking-wide text-ink-muted hover:text-ink"
      >
        <span className="flex items-center gap-2">
          {icon}
          {label}
        </span>
        <ChevronDown
          className={clsx("h-3.5 w-3.5 transition-transform", open && "rotate-180")}
        />
      </button>
    </div>
  );
}