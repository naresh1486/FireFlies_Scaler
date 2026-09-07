/// <reference types="node" />
/**
 * Pure derivation helpers for Topics & Chapters. Extracted to a .ts
 * file (no JSX) so they can be tested in isolation without pulling
 * in MediaSyncContext.
 */

const TIMESTAMP_PATTERN = /\((\d{1,2}):(\d{2})\)/g;

export interface SectionShape {
  id: number;
  heading: string;
  body: string;
  sequence?: number;
}

export function deriveTopics(sections: SectionShape[]): string[] {
  // First-line headings of each section act as Topics. We avoid duplicating
  // the section labelled "Notes" which is the top-level wrapper.
  const seen = new Set<string>();
  const topics: string[] = [];
  for (const s of sections) {
    const t = (s.heading ?? "").trim();
    if (!t || t.toLowerCase() === "notes") continue;
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    topics.push(t);
  }
  return topics;
}

export interface Chapter {
  timestamp: number;
  label: string;
  sectionId: number;
}

export function deriveChapters(sections: SectionShape[]): Chapter[] {
  const out: Chapter[] = [];
  for (const s of sections) {
    const matches = Array.from(s.body.matchAll(TIMESTAMP_PATTERN));
    if (!matches.length) continue;
    const m = matches[0];
    const mm = parseInt(m[1], 10);
    const ss = parseInt(m[2], 10);
    out.push({
      timestamp: mm * 60 + ss,
      label: s.heading,
      sectionId: s.id,
    });
  }
  return out;
}