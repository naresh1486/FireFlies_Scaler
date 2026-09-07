/// <reference types="node" />
/**
 * Pure helpers used by MediaSyncContext. Extracted for testability.
 */

export interface SegmentShape {
  id?: number;
  start_time: number;
  end_time: number;
}

export function compute_active_segment<T extends SegmentShape>(
  time: number,
  segs: T[],
): number | null {
  if (!segs.length) return null;
  let left_idx = 0;
  let right_idx = segs.length - 1;
  while (left_idx <= right_idx) {
    const mid = (left_idx + right_idx) >> 1;
    const s = segs[mid];
    if (time < s.start_time) {
      right_idx = mid - 1;
    } else {
      left_idx = mid + 1;
    }
  }
  const idx = Math.min(left_idx, segs.length - 1);
  const candidate = segs[idx];
  if (
    candidate &&
    time >= candidate.start_time &&
    time <= candidate.end_time + 0.05
  ) {
    return typeof candidate.id === "number" ? candidate.id : null;
  }
  if (idx > 0 && segs[idx - 1] && time >= segs[idx - 1].start_time) {
    const id = segs[idx - 1].id;
    return typeof id === "number" ? id : null;
  }
  return null;
}

export function step_segment<T extends SegmentShape>(
  segs: T[],
  current_time: number,
  direction: number,
): T | null {
  if (!segs.length) return null;
  const idx = segs.findIndex(
    (s) => current_time >= s.start_time && current_time <= s.end_time + 0.05,
  );
  if (idx === -1) {
    if (direction === 1) {
      return segs.find((s) => s.start_time > current_time) ?? null;
    }
    for (let i = segs.length - 1; i >= 0; i--) {
      if (segs[i].start_time < current_time) return segs[i];
    }
    return null;
  }
  const target_idx = Math.max(0, Math.min(segs.length - 1, idx + direction));
  return segs[target_idx];
}