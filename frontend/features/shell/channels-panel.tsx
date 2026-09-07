"use client";

import { useState } from "react";
import { Search, Hash, Upload, Mic2, CalendarRange } from "lucide-react";
import { clsx } from "clsx";

import { Input } from "@/components/ui/input";

export type Channel = "my" | "all" | "voice" | "uploads";

interface ChannelsPanelProps {
  active: Channel;
  onChange: (c: Channel) => void;
}

const channels: { id: Channel; label: string; icon: React.ComponentType<{ className?: string }>; pill?: string }[] = [
  { id: "my", label: "My Meetings", icon: Hash },
  { id: "all", label: "All Meetings", icon: CalendarRange },
  { id: "voice", label: "Voice Agent Meetings", icon: Mic2, pill: "NEW" },
  { id: "uploads", label: "Uploads", icon: Upload, pill: "NEW" },
];

export function ChannelsPanel({ active, onChange }: ChannelsPanelProps) {
  const [q, setQ] = useState("");
  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-border-subtle bg-surface">
      <div className="border-b border-border-subtle p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search channels"
            className="pl-9"
          />
        </div>
      </div>
      <ul className="flex-1 overflow-y-auto p-2">
        {channels.map((c) => {
          const isActive = c.id === active;
          return (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => onChange(c.id)}
                className={clsx(
                  "flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
                  isActive
                    ? "bg-accent/10 text-accent"
                    : "text-ink hover:bg-surface-2",
                )}
              >
                <c.icon className="h-4 w-4 shrink-0" />
                <span className="flex-1 truncate">{c.label}</span>
                {c.pill ? (
                  <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                    {c.pill}
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
      <div className="border-t border-border-subtle p-3">
        <p className="text-xs font-semibold text-ink">All channels</p>
        <div className="mt-3 grid place-items-center text-center">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-pink-50 text-pink-500">
            #
          </span>
          <p className="mt-2 text-xs text-ink-muted">
            Create channels to organize your conversations
          </p>
          <button
            type="button"
            className="mt-2 inline-flex items-center gap-1 rounded-md border border-border-subtle px-3 py-1 text-xs text-ink hover:bg-surface-2"
          >
            + Channel
          </button>
        </div>
      </div>
    </aside>
  );
}