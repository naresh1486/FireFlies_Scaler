"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Filter as FilterIcon, MessageSquare } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { SortOption } from "@/lib/query-keys";

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "recent", label: "Recent" },
  { value: "oldest", label: "Oldest" },
  { value: "longest", label: "Longest" },
  { value: "shortest", label: "Shortest" },
  { value: "title_asc", label: "Title A→Z" },
];

export interface LibraryFiltersState {
  q: string;
  sort: SortOption;
  hosted_by_me: boolean;
  shared_by_me: boolean;
  bookmarked: boolean;
  channel: string;
  capture_source: string;
  duration_min?: number;
  duration_max?: number;
}

export const defaultLibraryFilters: LibraryFiltersState = {
  q: "",
  sort: "recent",
  hosted_by_me: false,
  shared_by_me: false,
  bookmarked: false,
  channel: "",
  capture_source: "",
};

interface LibraryToolbarProps {
  state: LibraryFiltersState;
  onChange: (next: LibraryFiltersState) => void;
  showHostedToggles?: boolean;
}

export function LibraryToolbar({
  state,
  onChange,
  showHostedToggles = true,
}: LibraryToolbarProps) {
  const [localQ, setLocalQ] = useState(state.q);

  // Sync external q changes (e.g., channel switch clears filters)
  useEffect(() => {
    setLocalQ(state.q);
  }, [state.q]);

  // Debounce q into filters
  useEffect(() => {
    if (localQ === state.q) return;
    const handle = setTimeout(() => {
      onChange({ ...state, q: localQ });
    }, 200);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localQ]);

  const showSort = useMemo(() => sortOptions, []);

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border-subtle bg-surface px-4 py-3">
      {showHostedToggles ? (
        <>
          <button
            type="button"
            onClick={() =>
              onChange({ ...state, hosted_by_me: !state.hosted_by_me })
            }
            className={`rounded-md border px-3 py-1 text-xs ${
  state.hosted_by_me
    ? "border-accent bg-accent/10 text-accent"
    : "border-border-subtle text-ink-muted hover:bg-surface-2"
}`}
          >
            Hosted by me
          </button>
          <button
            type="button"
            onClick={() =>
              onChange({ ...state, shared_by_me: !state.shared_by_me })
            }
            className={`rounded-md border px-3 py-1 text-xs ${
  state.shared_by_me
    ? "border-accent bg-accent/10 text-accent"
    : "border-border-subtle text-ink-muted hover:bg-surface-2"
}`}
          >
            Shared with me
          </button>
          <span className="mx-1 h-5 w-px bg-border-subtle" />
        </>
      ) : null}
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-md border border-border-subtle px-3 py-1 text-xs text-ink hover:bg-surface-2"
      >
        <FilterIcon className="h-3.5 w-3.5" />
        Filters
      </button>
      <div className="relative ml-auto w-full max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
        <Input
          value={localQ}
          onChange={(e) => setLocalQ(e.target.value)}
          placeholder="Search meetings"
          className="pl-9"
        />
      </div>
      <select
        aria-label="Sort"
        value={state.sort}
        onChange={(e) =>
          onChange({ ...state, sort: e.target.value as SortOption })
        }
        className="rounded-md border border-border-subtle bg-surface px-2 py-1 text-xs text-ink"
      >
        {showSort.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <Button
        variant="ghost"
        size="sm"
        className="ml-1"
        onClick={() => onChange(defaultLibraryFilters)}
      >
        Reset
      </Button>
      <Button variant="secondary" size="sm" className="ml-1">
        <MessageSquare className="h-3.5 w-3.5" />
        Feedback
      </Button>
    </div>
  );
}