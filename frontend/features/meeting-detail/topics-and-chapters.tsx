"use client";

import { Hash } from "lucide-react";

import {
  deriveChapters,
  deriveTopics,
} from "@/features/meeting-detail/topics-helpers";
import { useMediaSync } from "@/features/transcript/media-sync-context";
import type { NotesSectionRead } from "@/lib/query-keys";

function formatTime(seconds: number): string {
  if (seconds < 0) return "00:00";
  const total = Math.floor(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

interface TopicsAndChaptersProps {
  sections: NotesSectionRead[];
}

export function TopicsAndChapters({ sections }: TopicsAndChaptersProps) {
  const { seek } = useMediaSync();
  const topics = deriveTopics(sections);
  const chapters = deriveChapters(sections);

  if (!topics.length && !chapters.length) return null;

  return (
    <section className="grid gap-6 md:grid-cols-2">
      {topics.length ? (
        <div>
          <h3 className="text-base font-semibold text-ink">Topics</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {topics.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 rounded-full border border-border-subtle bg-surface px-2.5 py-1 text-xs text-ink"
              >
                <Hash className="h-3 w-3 text-ink-muted" />
                {t}
              </span>
            ))}
          </div>
        </div>
      ) : null}
      {chapters.length ? (
        <div>
          <h3 className="text-base font-semibold text-ink">Chapters</h3>
          <ul className="mt-3 space-y-1">
            {chapters.map((c) => (
              <li key={`${c.sectionId}-${c.timestamp}`}>
                <button
                  type="button"
                  onClick={() => seek(c.timestamp)}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-ink hover:bg-surface-2"
                >
                  <span className="font-mono text-xs font-semibold text-accent">
                    {formatTime(c.timestamp)}
                  </span>
                  <span className="flex-1 truncate">{c.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}