import { describe, expect, it } from "vitest";

// Mirror of the inline collectMatches logic in transcript-panel.tsx.
// Kept here as a contract test so future refactors don't regress.
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

describe("transcript search offsets", () => {
  it("returns empty for empty query", () => {
    expect(collectMatches("any text", "")).toEqual([]);
  });

  it("finds a single match", () => {
    expect(collectMatches("Hello world", "world")).toEqual([6]);
  });

  it("finds multiple matches in order", () => {
    expect(collectMatches("foo bar foo baz foo", "foo")).toEqual([0, 8, 16]);
  });

  it("is case-insensitive", () => {
    expect(collectMatches("Roadmap ROADMAP roadmap", "roadmap")).toEqual([0, 8, 16]);
  });

  it("returns empty when no match", () => {
    expect(collectMatches("hello", "world")).toEqual([]);
  });

  it("non-overlapping offsets", () => {
    // indexOf advances by the full query length so the next match can
    // begin at the position right after the previous one.
    expect(collectMatches("aaaa", "aa")).toEqual([0, 2]);
    expect(collectMatches("aaaaa", "aa")).toEqual([0, 2]);
  });

  it("respects length of query when computing end offsets", () => {
    const text = "abcabcabc";
    const matches = collectMatches(text, "abc");
    expect(matches).toEqual([0, 3, 6]);
    expect(text.substring(matches[0], matches[0] + 3)).toBe("abc");
  });
});