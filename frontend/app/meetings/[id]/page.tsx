"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Maximize2, FileText, Sparkles, MessageSquareText } from "lucide-react";

import { AppShell } from "@/features/shell/app-shell";
import { TopBar } from "@/features/shell/top-bar";
import { BreadcrumbHeader } from "@/features/meeting-detail/breadcrumb-header";
import { ContextPanel } from "@/features/meeting-detail/context-panel";
import { KeyboardShortcuts } from "@/features/meeting-detail/keyboard-shortcuts";
import { NotesPanel } from "@/features/meeting-detail/notes-panel";
import { StickyMediaBar } from "@/features/meeting-detail/sticky-media-bar";
import { RightRail } from "@/features/meeting-detail/right-rail";
import { MediaSyncProvider } from "@/features/transcript/media-sync-context";
import { MeetingFormModal } from "@/features/meetings/meeting-form-modal";
import { DeleteMeetingDialog } from "@/features/meetings/delete-meeting-dialog";
import { useMeeting as _useMeeting } from "@/hooks/use-meetings";
import {
  useNotes,
  useSummary,
  useTranscript,
} from "@/hooks/use-notepad";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

type MobileView = "notes" | "transcript" | "askfred";

export default function NotepadPage({
  params,
}: {
  params: { id: string };
}) {
  const meetingId = Number(params.id);

  return (
    <AppShell>
      <NotepadContent meetingId={meetingId} />
    </AppShell>
  );
}

function NotepadContent({ meetingId }: { meetingId: number }) {
  const router = useRouter();
  const meetingQuery = _useMeeting(meetingId);
  const summaryQuery = useSummary(meetingId);
  const notesQuery = useNotes(meetingId);
  const transcriptQuery = useTranscript(meetingId);
  const [bookmarked, setBookmarked] = useState(false);
  const [mobileView, setMobileView] = useState<MobileView>("notes");

  if (meetingQuery.isLoading) {
    return <LoadingSplash />;
  }
  if (meetingQuery.isError || !meetingQuery.data) {
    const errorMsg =
      (meetingQuery.error as Error | null | undefined)?.message ??
      "We couldn't load this meeting.";
    const isNotFound = /not.?found/i.test(errorMsg) || errorMsg.includes("404");
    return (
      <>
        <TopBar pageTitle="Notepad" showSearch={false} />
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
          <EmptyState
            title={isNotFound ? "Meeting not found" : "Couldn't load meeting"}
            description={
              isNotFound
                ? "This meeting may have been deleted, or the link is incorrect."
                : errorMsg
            }
            action={
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => router.push("/meetings")}>
                  Back to library
                </Button>
                {!isNotFound ? (
                  <Button onClick={() => meetingQuery.refetch()}>Retry</Button>
                ) : null}
              </div>
            }
          />
        </main>
      </>
    );
  }

  const meeting = meetingQuery.data;
  const demoAudioUrl = process.env.NEXT_PUBLIC_DEMO_AUDIO_URL?.trim();
  const mediaUrl =
    meeting.media_url === "/audio/sample.wav" && demoAudioUrl
      ? demoAudioUrl
      : meeting.media_url;

  return (
    <MediaSyncProvider meetingId={meetingId} src={mediaUrl}>
      <KeyboardShortcuts />
      <NotepadInner
        meetingId={meetingId}
        meeting={{ ...meeting, bookmarked }}
        bookmarked={bookmarked}
        setBookmarked={setBookmarked}
        summary={summaryQuery.data}
        sections={notesQuery.data?.sections ?? []}
        transcript={transcriptQuery.data?.segments ?? []}
        loading={summaryQuery.isLoading || notesQuery.isLoading}
        channelName={meeting.channel === "my" ? "My Meetings" : "All Meetings"}
        mobileView={mobileView}
        onMobileViewChange={setMobileView}
      />
    </MediaSyncProvider>
  );
}

function NotepadInner({
  meetingId,
  meeting,
  bookmarked,
  setBookmarked,
  summary,
  sections,
  transcript,
  loading,
  channelName,
  mobileView,
  onMobileViewChange,
}: {
  meetingId: number;
  meeting: import("@/lib/query-keys").MeetingRead;
  bookmarked: boolean;
  setBookmarked: (v: boolean) => void;
  summary: import("@/lib/query-keys").SummaryRead | undefined;
  sections: import("@/lib/query-keys").NotesSectionRead[];
  transcript: import("@/lib/query-keys").TranscriptSegmentRead[];
  loading: boolean;
  channelName: string;
  mobileView: MobileView;
  onMobileViewChange: (v: MobileView) => void;
}) {
  const toast = useToast();
  const router = useRouter();
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [contextOpen, setContextOpen] = useState(false);

  return (
    <div className="flex h-screen min-h-0 flex-col">
      {/* Notes / AI Skills tab strip — desktop visible, mobile also
          uses this to switch between summary view modes. */}
      <div className="flex items-center border-b border-border-subtle bg-surface px-3 py-2 md:px-4">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => onMobileViewChange("notes")}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
              mobileView === "notes"
                ? "border border-accent bg-accent/5 text-accent"
                : "text-ink-muted hover:bg-surface-2"
            }`}
            aria-current={mobileView === "notes" ? "page" : undefined}
          >
            <FileText className="mr-1 inline-block h-3.5 w-3.5 align-text-bottom" />
            Notes
          </button>
          <button
            type="button"
            onClick={() => {
              onMobileViewChange("transcript");
              toast.info("Switched to Transcript tab");
            }}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
              mobileView === "transcript"
                ? "border border-accent bg-accent/5 text-accent"
                : "text-ink-muted hover:bg-surface-2"
            } md:hidden`}
            aria-current={mobileView === "transcript" ? "page" : undefined}
          >
            <MessageSquareText className="mr-1 inline-block h-3.5 w-3.5 align-text-bottom" />
            Transcript
          </button>
          <button
            type="button"
            onClick={() => {
              onMobileViewChange("askfred");
              toast.info("Switched to AskFred panel");
            }}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
              mobileView === "askfred"
                ? "border border-accent bg-accent/5 text-accent"
                : "text-ink-muted hover:bg-surface-2"
            } md:hidden`}
            aria-current={mobileView === "askfred" ? "page" : undefined}
          >
            <Sparkles className="mr-1 inline-block h-3.5 w-3.5 align-text-bottom" />
            Ask Fred
          </button>
        </div>
        <button
          type="button"
          aria-label="Fullscreen"
          onClick={() => toast.info("Fullscreen is not implemented in this demo.")}
          className="ml-auto grid h-7 w-7 place-items-center rounded-md text-ink-muted hover:bg-surface-2"
        >
          <Maximize2 className="h-4 w-4" />
        </button>
      </div>

      <BreadcrumbHeader
        meeting={meeting}
        channel={meeting.channel}
        onEdit={() => setShowEdit(true)}
        onDelete={() => setShowDelete(true)}
      />

      <div className="flex min-h-0 flex-1">
        {/* ContextPanel: visible on lg+, hidden otherwise (slides in via
            a button on smaller screens). */}
        <div className="hidden lg:block">
          <ContextPanel />
        </div>
        <button
          type="button"
          aria-label="Toggle side panel"
          onClick={() => setContextOpen((v) => !v)}
          className="lg:hidden absolute left-2 top-32 z-10 grid h-8 w-8 place-items-center rounded-full border border-border-subtle bg-surface shadow-sm"
        >
          <Sparkles className="h-4 w-4" />
        </button>

        {/* Main column — Notes. Hidden on mobile when transcript/askfred is active. */}
        <div
          className={`flex min-w-0 flex-1 flex-col ${
            mobileView !== "notes" ? "hidden md:flex" : ""
          }`}
        >
          <NotesPanel
            meeting={meeting}
            summary={summary}
            sections={sections}
            loading={loading}
          />
          <StickyMediaBar
            meetingId={meetingId}
            bookmarked={bookmarked}
            onBookmarkChange={setBookmarked}
          />
        </div>

        {/* RightRail (Transcript + AskFred). On mobile, hidden when mobileView=notes. */}
        <div
          className={`${
            mobileView === "notes"
              ? "hidden md:flex"
              : "flex w-full md:w-auto md:shrink-0"
          }`}
        >
          <RightRail
            meetingId={meetingId}
            transcript={transcript}
            channelName={channelName}
            activeTab={mobileView === "askfred" ? "askfred" : "transcript"}
            onActiveTabChange={(t) => onMobileViewChange(t)}
          />
        </div>

        {/* Mobile context sheet */}
        {contextOpen ? (
          <div className="fixed inset-0 z-30 lg:hidden">
            <button
              type="button"
              aria-label="Close side panel"
              className="absolute inset-0 bg-ink/30"
              onClick={() => setContextOpen(false)}
            />
            <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] shadow-lg">
              <ContextPanel />
            </div>
          </div>
        ) : null}
      </div>

      <MeetingFormModal
        open={showEdit}
        onClose={() => setShowEdit(false)}
        mode="edit"
        meeting={meeting}
        onUpdated={() => {
          /* hook invalidates */
        }}
      />
      <DeleteMeetingDialog
        open={showDelete}
        onClose={() => setShowDelete(false)}
        meetingId={meeting.id}
        meetingTitle={meeting.title}
        onDeleted={() => router.push("/meetings")}
      />
    </div>
  );
}

function LoadingSplash() {
  return (
    <>
      <TopBar pageTitle="Notepad" showSearch={false} />
      <div className="flex min-h-0 flex-1">
        <div className="hidden lg:block">
          <div className="w-64 border-r border-border-subtle bg-surface p-3">
            <Skeleton className="h-8 w-full" />
            <div className="mt-4 space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-5 w-full" />
              ))}
            </div>
          </div>
        </div>
        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="mt-2 h-4 w-1/3" />
          <Skeleton className="mt-6 h-4 w-1/2" />
          <Skeleton className="mt-2 h-4 w-3/4" />
          <Skeleton className="mt-2 h-4 w-3/4" />
          <Skeleton className="mt-2 h-4 w-2/3" />
          <Skeleton className="mt-6 h-4 w-1/2" />
          <Skeleton className="mt-2 h-4 w-2/3" />
          <Skeleton className="mt-2 h-4 w-2/3" />
        </main>
      </div>
    </>
  );
}