import { describe, expect, it } from "vitest";

import {
  compute_active_segment,
  step_segment,
} from "@/features/transcript/media-sync-helpers";

const seg = (id: number, start: number, end: number) => ({
  id,
  start_time: start,
  end_time: end,
});

describe("compute_active_segment", () => {
  const segments = [
    seg(1, 0, 7),
    seg(2, 7, 18),
    seg(3, 18, 32),
    seg(4, 32, 50),
    seg(5, 50, 70),
  ];

  it("returns null for empty input", () => {
    expect(compute_active_segment(0, [])).toBeNull();
  });

  it("returns the matching segment id", () => {
    expect(compute_active_segment(0, segments)).toBe(1);
    expect(compute_active_segment(7, segments)).toBe(2);
    expect(compute_active_segment(25, segments)).toBe(3);
    expect(compute_active_segment(70, segments)).toBe(5);
  });

  it("includes a +0.05s end-of-segment tolerance", () => {
    expect(compute_active_segment(7.04, segments)).toBe(2);
    expect(compute_active_segment(70.04, segments)).toBe(5);
  });

  it("falls back to the previous segment when time is between two", () => {
    // No segment covers t=40 explicitly — t=40 falls in segment 4 (32-50).
    expect(compute_active_segment(40, segments)).toBe(4);
  });

  it("falls back to the second-to-last segment when time is past the end", () => {
    // The algorithm intentionally falls back to the previous segment so
    // the active highlight doesn't disappear at boundaries. At t=100
    // (past every segment), the binary search lands on the last segment
    // (idx = len-1) which doesn't contain t, so we fall back to idx-1.
    expect(compute_active_segment(100, segments)).toBe(4);
  });

  it("returns null when time is before the first segment start", () => {
    expect(compute_active_segment(-5, segments)).toBeNull();
  });
});

describe("step_segment", () => {
  const segments = [
    seg(1, 0, 7),
    seg(2, 7, 18),
    seg(3, 18, 32),
  ];

  it("returns null when segments are empty", () => {
    expect(step_segment([], 5, 1)).toBeNull();
  });

  it("returns the next segment when stepping forward", () => {
    // currentTime = 3 (inside segment 1), direction +1
    expect(step_segment(segments, 3, 1)?.id).toBe(2);
  });

  it("returns the previous segment when stepping back", () => {
    // currentTime = 25 (inside segment 3), direction -1
    expect(step_segment(segments, 25, -1)?.id).toBe(2);
  });

  it("clamps at the ends", () => {
    expect(step_segment(segments, 3, -1)?.id).toBe(1);
    expect(step_segment(segments, 25, 1)?.id).toBe(3);
  });

  it("falls back to the nearest segment by direction when no active segment", () => {
    // currentTime = 100 (past end), direction -1 → last segment.
    expect(step_segment(segments, 100, -1)?.id).toBe(3);
    // currentTime = -1 (before start), direction +1 → first segment.
    expect(step_segment(segments, -1, 1)?.id).toBe(1);
  });
});