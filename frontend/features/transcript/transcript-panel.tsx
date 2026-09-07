"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, ChevronUp, ChevronDown, X } from "lucide-react";
import { clsx } from "clsx";

import { useMediaSync } from "@/features/transcript/media-sync-context";
import { useTranscriptSearch } from "@/hooks/use-transcript-search";
import type { TranscriptSegmentRead } from "@/lib/query-keys";

const SPEAKER_COLORS = [
  "#5B4DF5",
  "#14B8A6",
  "#F59E0B",
  "#EC4899",
  "#0EA5E9",
  "#84CC16",
  "#A855F7",
  "#EF4444",
];

function speakerColor(key: string): string {
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return SPEAKER_COLORS[hash % SPEAKER_COLORS.length];
}

function formatTime(seconds: number): string {
  if (seconds < 0) return "00:00";
  const total = Math.floor(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

/**
 * Locate all character offsets where `query` occurs in `text`.
 * Returns offsets in ascending order; offsets point at the start of each
 * match substring (case-insensitive).
 */
function collectMatches(text: string, query: string): number[] {
  if (!query) return [];
  const lower = text.toLowerCase();
  const ql = query.toLowerCase();
  const out: number[] = [];
  let i = lower.indexOf(ql);
  while (i !== -1) {
    out.push(i);
    i = lower.indexOf(ql, i + ql.length);
  }
  return out;
}

interface TranscriptPanelProps {
  meetingId: number;
  segments: TranscriptSegmentRead[];
}

export function TranscriptPanel({ meetingId, segments }: TranscriptPanelProps) {
  const { seek, activeSegmentId, followActive, bindSegments } = useMediaSync();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [userScrolled, setUserScrolled] = useState(false);
  const search = useTranscriptSearch(segments);

  useEffect(() => {
    bindSegments(segments);
  }, [segments, bindSegments]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let lastScrollTop = el.scrollTop;
    const onScroll = () => {
      const delta = el.scrollTop - lastScrollTop;
      if (delta < -10 && followActive) {
        setUserScrolled(true);
      }
      lastScrollTop = el.scrollTop;
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [followActive]);

  useEffect(() => {
    if (activeSegmentId !== null) setUserScrolled(false);
  }, [activeSegmentId]);

  useEffect(() => {
    if (!followActive || activeSegmentId == null || userScrolled) return;
    const el = containerRef.current?.querySelector<HTMLElement>(
      `[data-segment-id="${activeSegmentId}"]`,
    );
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [activeSegmentId, followActive, userScrolled]);

  const onSeekSegment = (s: TranscriptSegmentRead) => {
    seek(s.start_time);
    if (search.query) search.jumpTo(s.id);
  };

  // When search prev/next changes the active segment id, seek the player
  // to that segment's start. We only re-seek on segment-id transitions to
  // avoid feedback when the match index changes within the same segment.
  useEffect(() => {
    if (!search.query) return;
    if (search.activeSegmentId == null) return;
    const target = segments.find((x) => x.id === search.activeSegmentId);
    if (target) seek(target.start_time);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.activeSegmentId, search.query]);

  const empty = useMemo(() => segments.length === 0, [segments.length]);

  const onSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (e.shiftKey) search.goPrev();
      else search.goNext();
    } else if (e.key === "Escape") {
      e.preventDefault();
      search.clear();
    }
  };

  // Identify the current match's segment id and char offset so we can
  // render one "active" highlight per segment.
  const activeSearchSegmentId = search.activeSegmentId;
  const activeSearchCharIndex =
    search.currentIndex >= 0 && search.currentIndex < search.matches.length
      ? search.matches[search.currentIndex].index
      : null;

  // Per-segment local index of the active match.
  const activeLocalIndexBySegment = useMemo(() => {
    const map = new Map<number, number>();
    if (!search.query || activeSearchSegmentId == null || activeSearchCharIndex == null) {
      return map;
    }
    let local = 0;
    let matched = false;
    for (const m of search.matches) {
      if (m.segmentId !== activeSearchSegmentId) continue;
      if (m.index === activeSearchCharIndex && !matched) {
        map.set(activeSearchSegmentId, local);
        matched = true;
        break;
      }
      local++;
    }
    return map;
  }, [search.matches, search.query, activeSearchSegmentId, activeSearchCharIndex]);

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center gap-1 border-b border-border-subtle px-3 py-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-subtle" />
          <input
            type="search"
            value={search.query}
            onChange={(e) => search.setQuery(e.target.value)}
            onKeyDown={onSearchKeyDown}
            placeholder="Search transcript"
            className="h-8 w-full rounded-md border border-border-subtle bg-surface pl-7 pr-16 text-xs placeholder:text-ink-subtle focus:border-accent focus:outline-none"
            aria-label="Search transcript"
          />
          <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] tabular-nums text-ink-muted">
            {search.query
              ? search.total === 0
                ? "0 / 0"
                : `${search.currentIndex >= 0 ? search.currentIndex + 1 : 0} / ${search.total}`
              : ""}
          </div>
        </div>
        <button
          type="button"
          aria-label="Previous match"
          disabled={search.total === 0}
          onClick={search.goPrev}
          className="grid h-7 w-7 place-items-center rounded-md text-ink-muted hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronUp className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="Next match"
          disabled={search.total === 0}
          onClick={search.goNext}
          className="grid h-7 w-7 place-items-center rounded-md text-ink-muted hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronDown className="h-4 w-4" />
        </button>
        {search.query ? (
          <button
            type="button"
            aria-label="Clear search"
            onClick={search.clear}
            className="grid h-7 w-7 place-items-center rounded-md text-ink-muted hover:bg-surface-2"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {search.query && search.total === 0 ? (
        <div className="border-b border-border-subtle bg-surface-2 px-4 py-2 text-center text-xs text-ink-muted">
          No matches for <span className="font-semibold">{search.query}</span>.
        </div>
      ) : null}

      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-4 py-4"
        data-testid="transcript-panel"
      >
        {empty ? (
          <p className="rounded-md border border-dashed border-border-subtle p-6 text-center text-sm text-ink-muted">
            No transcript segments for this meeting yet.
          </p>
        ) : (
          <ul className="space-y-3">
            {segments.map((s) => {
              const localMatches = search.query
                ? collectMatches(s.text, search.query)
                : [];
              const activeLocal = activeLocalIndexBySegment.get(s.id) ?? -1;
              return (
                <TranscriptSegmentRow
                  key={s.id}
                  segment={s}
                  active={s.id === activeSegmentId}
                  matches={localMatches}
                  activeMatchIndex={activeLocal}
                  query={search.query}
                  onSeek={() => onSeekSegment(s)}
                />
              );
            })}
          </ul>
        )}
        <p className="mt-6 text-center text-xs text-ink-muted">
          End of transcript for meeting #{meetingId}.
        </p>
      </div>
    </div>
  );
}

function TranscriptSegmentRow({
  segment,
  active,
  matches,
  activeMatchIndex,
  query,
  onSeek,
}: {
  segment: TranscriptSegmentRead;
  active: boolean;
  matches: number[];
  activeMatchIndex: number;
  query: string;
  onSeek: () => void;
}) {
  const color = speakerColor(segment.speaker_key);
  return (
    <li
      data-segment-id={segment.id}
      className={clsx(
        "group flex gap-3 rounded-lg border border-transparent px-2 py-2 transition-all duration-150",
        active
          ? "border-accent/30 bg-active-segment-bg shadow-sm"
          : "hover:bg-surface-2",
      )}
    >
      <button
        type="button"
        onClick={onSeek}
        className="shrink-0 font-mono text-xs font-semibold text-accent transition-opacity hover:opacity-80 hover:underline"
        aria-label={`Jump to ${formatTime(segment.start_time)}`}
      >
        {formatTime(segment.start_time)}
      </button>
      <div className="min-w-0 flex-1">
        <p
          className="text-[11px] font-semibold uppercase tracking-wide"
          style={{ color }}
        >
          {segment.speaker_name}
        </p>
        <p className="mt-0.5 text-sm leading-relaxed text-ink">
          <HighlightedText
            text={segment.text}
            query={query}
            matches={matches}
            activeMatchIndex={activeMatchIndex}
          />
        </p>
      </div>
    </li>
  );
}

function HighlightedText({
  text,
  query,
  matches,
  activeMatchIndex,
}: {
  text: string;
  query: string;
  matches: number[];
  activeMatchIndex: number;
}) {
  if (!query || matches.length === 0) return <>{text}</>;
  const parts: React.ReactNode[] = [];
  let cursor = 0;
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i];
    const end = start + query.length;
    if (cursor < start) parts.push(text.slice(cursor, start));
    const isActive = i === activeMatchIndex;
    parts.push(
      <mark
        key={`${start}-${i}`}
        className={clsx(
          "rounded px-0.5",
          isActive ? "bg-amber-300 text-ink" : "bg-amber-100 text-ink",
        )}
      >
        {text.slice(start, end)}
      </mark>,
    );
    cursor = end;
  }
  if (cursor < text.length) parts.push(text.slice(cursor));
  return <>{parts}</>;
}