import { describe, expect, it } from "vitest";
import { renderHook, act } from "@testing-library/react";

import { useTranscriptSearch } from "@/hooks/use-transcript-search";
import type { TranscriptSegmentRead } from "@/lib/query-keys";

function seg(
  id: number,
  start: number,
  end: number,
  text: string,
): TranscriptSegmentRead {
  return {
    id,
    meeting_id: 1,
    speaker_name: `Speaker ${id}`,
    speaker_key: `spk_${id}`,
    start_time: start,
    end_time: end,
    text,
    sequence: id,
  };
}

const segments = [
  seg(1, 0, 5, "Welcome everyone to the Q4 roadmap discussion."),
  seg(2, 5, 12, "We have three big bets this quarter."),
  seg(3, 12, 20, "Roadmap priorities include the dashboard launch."),
  seg(4, 20, 30, "ROADMAP needs review before the launch."),
];

describe("useTranscriptSearch", () => {
  it("returns zero matches for empty query", () => {
    const { result } = renderHook(() => useTranscriptSearch(segments));
    expect(result.current.total).toBe(0);
    expect(result.current.currentIndex).toBe(-1);
    expect(result.current.matches).toEqual([]);
  });

  it("matches case-insensitively across segments", () => {
    const { result } = renderHook(() => useTranscriptSearch(segments));
    act(() => result.current.setQuery("roadmap"));
    expect(result.current.total).toBe(3);
    // First match is in segment 1.
    expect(result.current.matches[0].segmentId).toBe(1);
  });

  it("advances currentIndex on goNext / wraps around", () => {
    const { result } = renderHook(() => useTranscriptSearch(segments));
    act(() => result.current.setQuery("roadmap"));
    expect(result.current.currentIndex).toBe(0);
    act(() => result.current.goNext());
    expect(result.current.currentIndex).toBe(1);
    act(() => result.current.goNext());
    act(() => result.current.goNext());
    // Wraps to 0.
    expect(result.current.currentIndex).toBe(0);
  });

  it("advances currentIndex on goPrev and wraps backward", () => {
    const { result } = renderHook(() => useTranscriptSearch(segments));
    act(() => result.current.setQuery("roadmap"));
    expect(result.current.currentIndex).toBe(0);
    act(() => result.current.goPrev());
    // Wraps to last (3rd match).
    expect(result.current.currentIndex).toBe(2);
  });

  it("jumpTo sets currentIndex to first match in target segment", () => {
    const { result } = renderHook(() => useTranscriptSearch(segments));
    act(() => result.current.setQuery("roadmap"));
    act(() => result.current.jumpTo(4));
    // First match in segment 4 is at index 2.
    expect(result.current.currentIndex).toBe(2);
  });

  it("exposes the active segment id", () => {
    const { result } = renderHook(() => useTranscriptSearch(segments));
    act(() => result.current.setQuery("roadmap"));
    expect(result.current.activeSegmentId).toBe(1);
    act(() => result.current.goNext());
    expect(result.current.activeSegmentId).toBe(3);
  });

  it("clear resets state", () => {
    const { result } = renderHook(() => useTranscriptSearch(segments));
    act(() => result.current.setQuery("roadmap"));
    expect(result.current.total).toBe(3);
    act(() => result.current.clear());
    expect(result.current.total).toBe(0);
    expect(result.current.currentIndex).toBe(-1);
    expect(result.current.activeSegmentId).toBe(null);
  });

  it("re-syncs currentIndex when segments change", () => {
    const { result, rerender } = renderHook(
      ({ data }: { data: TranscriptSegmentRead[] }) => useTranscriptSearch(data),
      { initialProps: { data: segments } },
    );
    act(() => result.current.setQuery("roadmap"));
    expect(result.current.currentIndex).toBe(0);
    act(() => result.current.goNext());
    expect(result.current.currentIndex).toBe(1);
    // Replace segments so the current match no longer exists.
    rerender({ data: [seg(100, 0, 5, "Unrelated text")] });
    expect(result.current.currentIndex).toBe(-1);
  });

  it("finds multiple matches within the same segment", () => {
    const { result } = renderHook(() => useTranscriptSearch([
      seg(1, 0, 10, "Roadmap here roadmap there roadmap everywhere"),
    ]));
    act(() => result.current.setQuery("roadmap"));
    expect(result.current.total).toBe(3);
  });
});