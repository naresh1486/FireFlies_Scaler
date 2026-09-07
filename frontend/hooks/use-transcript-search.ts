"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { TranscriptSegmentRead } from "@/lib/query-keys";

export interface TranscriptSearchResult {
  query: string;
  setQuery: (v: string) => void;
  matches: { segmentId: number; index: number }[]; // ordered by segment id then appearance
  total: number;
  currentIndex: number; // -1 when no active match
  goNext: () => void;
  goPrev: () => void;
  jumpTo: (segmentId: number) => void;
  clear: () => void;
  /**
   * The segment id that should be highlighted as the "current" search match.
   * Null when the search is empty or has no matches.
   */
  activeSegmentId: number | null;
}

function findMatchesInSegment(
  segment: TranscriptSegmentRead,
  query: string,
): number[] {
  if (!query) return [];
  const lower = segment.text.toLowerCase();
  const ql = query.toLowerCase();
  const indices: number[] = [];
  let idx = lower.indexOf(ql);
  while (idx !== -1) {
    indices.push(idx);
    idx = lower.indexOf(ql, idx + ql.length);
  }
  return indices;
}

/**
 * Case-insensitive substring search across already-loaded transcript
 * segments. Pure client-side: no network calls; safe to use inside
 * the Notepad's right-rail Transcript tab.
 *
 * Each match is identified by the segment id and the character index
 * of the substring within `segment.text`. Multiple matches in the
 * same segment are exposed so the renderer can highlight them all
 * with one segment marked as the current match.
 */
export function useTranscriptSearch(
  segments: TranscriptSegmentRead[],
): TranscriptSearchResult {
  const [query, setQuery] = useState("");
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [activeSegmentId, setActiveSegmentId] = useState<number | null>(null);

  // Compute all matches.
  const matches = useMemo(() => {
    const out: { segmentId: number; index: number }[] = [];
    for (const s of segments) {
      const idxs = findMatchesInSegment(s, query);
      for (const idx of idxs) {
        out.push({ segmentId: s.id, index: idx });
      }
    }
    return out;
  }, [segments, query]);

  // Whenever the match list changes, ensure `currentIndex` is still in range.
  useEffect(() => {
    if (matches.length === 0) {
      setCurrentIndex(-1);
      setActiveSegmentId(null);
      return;
    }
    if (currentIndex < 0 || currentIndex >= matches.length) {
      setCurrentIndex(0);
      setActiveSegmentId(matches[0].segmentId);
    } else if (activeSegmentId !== matches[currentIndex].segmentId) {
      // Match list shrunk or shifted (e.g., segments changed); re-sync.
      setActiveSegmentId(matches[currentIndex].segmentId);
    }
  }, [matches, currentIndex, activeSegmentId]);

  const goNext = useCallback(() => {
    if (matches.length === 0) return;
    setCurrentIndex((i) => {
      const next = (i + 1) % matches.length;
      setActiveSegmentId(matches[next].segmentId);
      return next;
    });
  }, [matches]);

  const goPrev = useCallback(() => {
    if (matches.length === 0) return;
    setCurrentIndex((i) => {
      const next = (i - 1 + matches.length) % matches.length;
      setActiveSegmentId(matches[next].segmentId);
      return next;
    });
  }, [matches]);

  const jumpTo = useCallback(
    (segmentId: number) => {
      if (matches.length === 0) return;
      const idx = matches.findIndex((m) => m.segmentId === segmentId);
      if (idx >= 0) {
        setCurrentIndex(idx);
        setActiveSegmentId(segmentId);
      }
    },
    [matches],
  );

  const clear = useCallback(() => {
    setQuery("");
    setCurrentIndex(-1);
    setActiveSegmentId(null);
  }, []);

  return {
    query,
    setQuery,
    matches,
    total: matches.length,
    currentIndex,
    goNext,
    goPrev,
    jumpTo,
    clear,
    activeSegmentId:
      currentIndex >= 0 && currentIndex < matches.length
        ? matches[currentIndex].segmentId
        : null,
  };
}

export type TranscriptSearch = TranscriptSearchResult;
export type TranscriptSearchActiveSegmentId = number | null;