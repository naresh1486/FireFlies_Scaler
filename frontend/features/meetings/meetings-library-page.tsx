"use client";

import { useRouter } from "next/navigation";

import { AppShell } from "@/features/shell/app-shell";
import { ChannelsPanel, type Channel } from "@/features/shell/channels-panel";
import { TopBar } from "@/features/shell/top-bar";
import {
  LibraryToolbar,
  defaultLibraryFilters,
  type LibraryFiltersState,
} from "@/features/meetings/library-toolbar";
import { MeetingCard } from "@/features/meetings/meeting-card";
import { MeetingFormModal } from "@/features/meetings/meeting-form-modal";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { useMeetings } from "@/hooks/use-meetings";
import { useMemo, useState } from "react";

const PLACEHOLDER_MEETINGS: Record<Channel, { title: string; subtitle: string }> = {
  my: {
    title: "No meetings yet",
    subtitle: "Try creating a meeting to see it here.",
  },
  all: {
    title: "No meetings in this workspace",
    subtitle: "Once teammates add meetings they'll appear here.",
  },
  voice: {
    title: "Let a voice agent take your meetings",
    subtitle: "Create a voice agent to attend meetings on your behalf.",
  },
  uploads: {
    title: "Upload audio or video recordings",
    subtitle: "Up to 100 MB for video and 500 MB for audio. Supports MP3, M4A, WAV, MP4, WEBM.",
  },
};

export function MeetingsLibraryPage() {
  const [channel, setChannel] = useState<Channel>("my");
const [filters, setFilters] = useState<LibraryFiltersState>(defaultLibraryFilters);
  const [showCreate, setShowCreate] = useState(false);
  const router = useRouter();

  const apiFilters = useMemo(
    () => ({
      q: filters.q || undefined,
      sort: filters.sort,
      hosted_by_me: filters.hosted_by_me || undefined,
      bookmarked: filters.bookmarked || undefined,
      channel: filters.channel || (channel === "all" ? "all" : channel),
      capture_source: filters.capture_source || undefined,
      duration_min: filters.duration_min,
      duration_max: filters.duration_max,
      page_size: 50,
    }),
    [filters, channel],
  );

  const { data, isLoading, isError, error, refetch } = useMeetings(apiFilters);

  const placeholder = PLACEHOLDER_MEETINGS[channel];
  const showChannelEmpty = data && data.items.length === 0;

  return (
    <AppShell>
      <TopBar pageTitle="Meetings" right={
        <Button size="sm" onClick={() => setShowCreate(true)}>
          + New meeting
        </Button>
      } />
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        {/* Channels panel — pushes content on md+, collapses to a
            horizontal scrollable strip on small viewports. */}
        <div className="hidden md:block">
          <ChannelsPanel active={channel} onChange={setChannel} />
        </div>
        <div className="md:hidden border-b border-border-subtle bg-surface px-3 py-2">
          <div className="flex gap-1 overflow-x-auto">
            {[
              { id: "my", label: "My Meetings" },
              { id: "all", label: "All" },
              { id: "voice", label: "Voice" },
              { id: "uploads", label: "Uploads" },
            ].map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setChannel(c.id as Channel)}
                className={`shrink-0 rounded-full px-3 py-1 text-xs ${
                  channel === c.id
                  ? "bg-accent text-white"
                  : "bg-surface-2 text-ink-muted"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
        <main className="flex min-w-0 flex-1 flex-col bg-canvas">
          <LibraryToolbar
            state={filters}
            onChange={(next) => setFilters(next)}
            showHostedToggles={channel !== "uploads" && channel !== "voice"}
          />

          <section className="flex-1 overflow-y-auto px-4 py-4 md:px-6">
            {isLoading ? (
              <ul className="space-y-2" aria-busy="true" aria-live="polite">
                {Array.from({ length: 5 }).map((_, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-3 rounded-lg border border-border-subtle bg-surface p-3"
                  >
                    <Skeleton className="h-10 w-8 shrink-0 rounded-md" />
                    <div className="min-w-0 flex-1 space-y-1">
                      <Skeleton className="h-3 w-2/3" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                    <Skeleton className="h-4 w-4" />
                  </li>
                ))}
              </ul>
            ) : isError ? (
              <EmptyState
                title="Could not load meetings"
                description={
                  (error as Error | null)?.message ??
                  "Something went wrong. Try again in a moment."
                }
                action={
                  <Button onClick={() => refetch()}>Retry</Button>
                }
              />
            ) : showChannelEmpty ? (
              <EmptyState
                title={placeholder.title}
                description={placeholder.subtitle}
                action={
                  channel === "uploads" ? (
                    <Button
                      className="w-full max-w-md"
                      onClick={() =>
                        setShowCreate(true)
                      }
                    >
                      + Upload Meeting
                    </Button>
                  ) : channel === "voice" ? (
                    <Button
                      onClick={() =>
                        setShowCreate(true)
                      }
                    >
                      + Create
                    </Button>
                  ) : (
                    <Button onClick={() => setShowCreate(true)}>
                      Create your first meeting
                    </Button>
                  )
                }
              />
            ) : (
              <div className="space-y-6">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <input
                      type="checkbox"
                      aria-label="Select all on this day"
                      className="h-4 w-4"
                    />
                    <span className="text-xs font-medium text-ink-muted">
                      Today
                    </span>
                    <button
                      type="button"
                      className="ml-auto text-xs text-ink-muted hover:text-ink"
                      onClick={() => setShowCreate(true)}
                    >
                      Feedback
                    </button>
                  </div>
                  <ul className="space-y-2">
                    {data?.items.map((m) => (
                      <li key={m.id}>
                        <MeetingCard meeting={m} />
                      </li>
                    ))}
                  </ul>
                </div>
                <p className="text-center text-xs text-ink-muted">
                  You&apos;ve reached the end of your meetings.
                </p>
              </div>
            )}
          </section>
        </main>
      </div>

      <MeetingFormModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        mode="create"
        onCreated={(m) => {
          router.push(`/meetings/${m.id}`);
        }}
      />
    </AppShell>
  );
}