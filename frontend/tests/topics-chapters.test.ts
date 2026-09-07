import { describe, expect, it } from "vitest";

import {
  deriveTopics,
  deriveChapters,
} from "@/features/meeting-detail/topics-helpers";

describe("topics/chapters derivation", () => {
  it("derives topics from section headings, excluding the 'Notes' wrapper", () => {
    const sections = [
      { id: 1, heading: "Notes", body: "x", sequence: 1 },
      { id: 2, heading: "App Overview", body: "x", sequence: 2 },
      { id: 3, heading: "User Interface", body: "x", sequence: 3 },
      { id: 4, heading: "App Overview", body: "x", sequence: 4 },
    ];
    expect(deriveTopics(sections)).toEqual(["App Overview", "User Interface"]);
  });

  it("case-insensitive dedup of topic headings", () => {
    const sections = [
      { id: 1, heading: "Notes", body: "x", sequence: 1 },
      { id: 2, heading: "App Overview", body: "x", sequence: 2 },
      { id: 3, heading: "APP OVERVIEW", body: "x", sequence: 3 },
    ];
    expect(deriveTopics(sections)).toEqual(["App Overview"]);
  });

  it("returns no topics when only 'Notes' section exists", () => {
    const sections = [{ id: 1, heading: "Notes", body: "x", sequence: 1 }];
    expect(deriveTopics(sections)).toEqual([]);
  });

  it("derives chapters from the first (mm:ss) timestamp per section", () => {
    const sections = [
      { id: 1, heading: "Notes", body: "- Wrap-up (10:00)\n- Hi (00:30)", sequence: 1 },
      { id: 2, heading: "App Overview", body: "- First (00:07)", sequence: 2 },
    ];
    const chapters = deriveChapters(sections);
    expect(chapters).toEqual([
      { sectionId: 1, label: "Notes", timestamp: 600 },
      { sectionId: 2, label: "App Overview", timestamp: 7 },
    ]);
  });

  it("skips sections with no timestamps when deriving chapters", () => {
    const sections = [
      { id: 1, heading: "Empty", body: "no timestamps here", sequence: 1 },
      { id: 2, heading: "Has", body: "hello (01:23)", sequence: 2 },
    ];
    const chapters = deriveChapters(sections);
    expect(chapters.length).toBe(1);
    expect(chapters[0].label).toBe("Has");
    expect(chapters[0].timestamp).toBe(83);
  });
});