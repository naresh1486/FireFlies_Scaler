"use client";

import { useMemo } from "react";
import { Sparkles, Copy, Pencil, Video } from "lucide-react";
import { format } from "date-fns";

import { useMediaSync } from "@/features/transcript/media-sync-context";
import { ActionItemsPanel } from "@/features/meeting-detail/action-items-panel";
import { TopicsAndChapters } from "@/features/meeting-detail/topics-and-chapters";
import type {
  MeetingRead,
  NotesSectionRead,
  SummaryRead,
} from "@/lib/query-keys";
import { useToast } from "@/hooks/use-toast";

function formatTime(seconds: number): string {
  if (seconds < 0) return "00:00";
  const total = Math.floor(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function renderSectionBody(body: string, onTimestamp: (t: number) => void) {
  const lines = body.split("\n");
  return (
    <div className="space-y-1 text-sm leading-relaxed text-ink">
      {lines.map((line, i) => {
        const trimmed = line.trimStart();
        const indent = line.length - trimmed.length;
        const isSubBullet = indent >= 2 && trimmed.startsWith("- ");
        const isBullet = trimmed.startsWith("- ");
        const text = trimmed.replace(/^-\s+/, "");
        if (!text) return null;

        const inline: React.ReactNode[] = [];
        let cursor = 0;
        for (const m of text.matchAll(/\((\d{1,2}):(\d{2})\)/g)) {
          const i0 = m.index ?? 0;
          if (i0 > cursor) inline.push(text.slice(cursor, i0));
          const mm = parseInt(m[1], 10);
          const ss = parseInt(m[2], 10);
          const t = mm * 60 + ss;
          inline.push(
            <button
              key={`${i}-${i0}`}
              type="button"
              onClick={() => onTimestamp(t)}
              className="mx-0.5 inline-flex items-center rounded px-1 font-mono text-xs font-semibold text-accent hover:bg-accent/10"
            >
              ({m[1]}:{m[2]})
            </button>,
          );
          cursor = i0 + m[0].length;
        }
        if (cursor < text.length) inline.push(text.slice(cursor));

        return (
          <p
            key={i}
            className={
              isSubBullet
                ? "pl-6 text-ink-muted"
                : isBullet
                  ? "flex gap-2"
                  : ""
            }
          >
            {isBullet && !isSubBullet ? (
              <span className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-ink-muted" />
            ) : null}
            <span>{inline}</span>
          </p>
        );
      })}
    </div>
  );
}

interface NotesPanelProps {
  meeting: MeetingRead;
  summary: SummaryRead | undefined;
  sections: NotesSectionRead[];
  loading: boolean;
}

export function NotesPanel({ meeting, summary, sections, loading }: NotesPanelProps) {
  const toast = useToast();
  const { seek } = useMediaSync();

  const dateLabel = useMemo(() => {
    try {
      return format(new Date(meeting.starts_at), "MMM d, yyyy, h:mm a");
    } catch {
      return meeting.starts_at;
    }
  }, [meeting.starts_at]);

  return (
    <div className="flex-1 overflow-y-auto px-8 py-6">
      <header className="mb-6 border-b border-border-subtle pb-6">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            {meeting.title}
          </h1>
          <button
            type="button"
            disabled
            aria-label="Video"
            className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-border-subtle px-3 py-1.5 text-xs font-medium text-ink-muted disabled:cursor-not-allowed"
            title="Video not available in this demo"
          >
            <Video className="h-3.5 w-3.5" />
            Video
          </button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-ink-muted">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-surface-2 text-xs font-semibold text-ink">
            NY
          </span>
          <span className="font-medium text-ink underline-offset-2 hover:underline">
            {meeting.host}
          </span>
          <span>{dateLabel}</span>
          <span className="grid h-5 w-5 place-items-center rounded bg-surface-2 text-ink-muted">
            <span className="block h-2 w-2 rounded-sm border border-ink-muted" />
          </span>
          <span>• {meeting.language} ▾</span>
        </div>
      </header>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-semibold text-accent hover:bg-accent/10"
        >
          <Sparkles className="h-4 w-4" />
          General Summary ▾
        </button>
        <button
          type="button"
          onClick={() => toast.info("Refine Summary is not implemented in this demo.")}
          className="text-sm font-semibold text-accent hover:underline"
        >
          ✦ Refine Summary
        </button>
        <button
          type="button"
          aria-label="Copy summary"
          onClick={() => {
            const blob = JSON.stringify(summary ?? {}, null, 2);
            void navigator.clipboard.writeText(blob).then(() => toast.success("Summary copied"));
          }}
          className="grid h-7 w-7 place-items-center rounded-md text-ink-muted hover:bg-surface-2"
        >
          <Copy className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="Edit summary"
          onClick={() => toast.info("Inline editing is not available in this demo.")}
          className="ml-auto inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm text-ink hover:bg-surface-2"
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-4 animate-pulse bg-surface-2"
              style={{ width: `${60 + i * 8}%` }}
            />
          ))}
        </div>
) : (
        <div className="space-y-10">
          {summary ? (
            <section className="space-y-5">
              <h3 className="text-base font-semibold tracking-tight text-ink">
                Notes
              </h3>
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-ink">Overview</h4>
                <p className="text-sm leading-relaxed text-ink">{summary.overview}</p>
              </div>
              {summary.key_points.length ? (
                <div>
                  <h4 className="text-sm font-semibold text-ink">Key points</h4>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink">
                    {summary.key_points.map((kp, i) => (
                      <li key={i}>{kp}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {summary.decisions.length ? (
                <div>
                  <h4 className="text-sm font-semibold text-ink">Decisions</h4>
                  <ul className="mt-2 space-y-1 text-sm text-ink">
                    {summary.decisions.map((d, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="mt-1.5 inline-block h-3.5 w-3.5 shrink-0 rounded-sm bg-success/20 ring-1 ring-success/40" />
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </section>
          ) : null}

          {sections.length ? (
            <section className="space-y-6">
              {sections.map((s) => (
                <div key={s.id}>
                  <h4 className="text-sm font-semibold text-ink">{s.heading}</h4>
                  {s.subheading ? (
                    <p className="mt-1 text-xs text-ink-muted">{s.subheading}</p>
                  ) : null}
                  <div className="mt-2">{renderSectionBody(s.body, seek)}</div>
                </div>
              ))}
            </section>
          ) : !summary ? (
            <div className="rounded-md border border-dashed border-border-subtle p-6 text-center text-sm text-ink-muted">
              No notes are available for this meeting yet.
            </div>
          ) : null}

          <TopicsAndChapters sections={sections} />

          <ActionItemsPanel meetingId={meeting.id} />
        </div>
      )}
    </div>
  );
}