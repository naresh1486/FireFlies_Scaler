"use client";

import { useEffect, useState } from "react";
import {
  Play,
  Pause,
  Undo2,
  Redo2,
  Download,
  Star,
  CheckSquare,
  ThumbsUp,
  ThumbsDown,
  AlignVerticalSpaceAround,
} from "lucide-react";

import { useMediaSync } from "@/features/transcript/media-sync-context";
import { useUpdateMeeting } from "@/hooks/use-meetings";
import { useToast } from "@/hooks/use-toast";

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "00:00";
  const total = Math.floor(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

const SPEEDS = [0.5, 0.75, 1, 1.5, 2];

interface StickyMediaBarProps {
  meetingId: number;
  bookmarked: boolean;
  onBookmarkChange: (next: boolean) => void;
}

export function StickyMediaBar({
  meetingId,
  bookmarked,
  onBookmarkChange,
}: StickyMediaBarProps) {
  const {
    currentTime,
    duration,
    playing,
    playbackRate,
    seek,
    togglePlay,
    setPlaybackRate,
    followActive,
    toggleFollow,
  } = useMediaSync();
  const [showSpeeds, setShowSpeeds] = useState(false);
  const update = useUpdateMeeting(meetingId);
  const toast = useToast();

  // Local optimistic bookmark UI synced with prop
  useEffect(() => {
    /* no-op: parent owns the source of truth */
  }, [bookmarked]);

  const handleBookmark = () => {
    const next = !bookmarked;
    onBookmarkChange(next);
    update.mutate(
      { bookmarked: next },
      {
        onError: () => {
      onBookmarkChange(!next);
      toast.error("Could not update bookmark");
        },
      },
    );
  };

  const progress = duration > 0 ? Math.min(1, currentTime / duration) : 0;

  return (
    <div className="sticky bottom-0 z-20 border-t border-border-subtle bg-surface px-4 py-2">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-xs tabular-nums text-ink-muted">
          <span className="font-mono">{formatTime(currentTime)}</span>
          <span>/</span>
          <span className="font-mono">{formatTime(duration)}</span>
          <span
            className="ml-2 hidden rounded border border-border-subtle px-1.5 py-0.5 font-sans text-[10px] text-ink-subtle lg:inline"
            title="Keyboard: Space=play/pause · ←/→=±5s · J/L=prev/next segment · F=follow"
          >
            Space · ←/→ · J/L · F
          </span>
        </div>

        <div className="relative mx-2 flex-1">
          <div className="h-1.5 rounded-full bg-surface-2" />
          <div
            className="absolute left-0 top-0 h-1.5 rounded-full bg-accent transition-[width] duration-100"
            style={{ width: `${progress * 100}%` }}
          />
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={1}
            value={currentTime}
            onChange={(e) => seek(Number(e.target.value))}
            aria-label="Seek"
            className="absolute inset-0 h-1.5 w-full cursor-pointer appearance-none bg-transparent opacity-0"
          />
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowSpeeds((v) => !v)}
            className="rounded px-2 py-1 text-xs font-medium text-ink-muted hover:bg-surface-2"
            aria-label="Playback speed"
          >
            {playbackRate}×
          </button>
          {showSpeeds ? (
            <div className="absolute bottom-full right-0 mb-1 rounded-md border border-border-subtle bg-surface py-1 text-ink shadow-md">
              {SPEEDS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setPlaybackRate(s);
                    setShowSpeeds(false);
                  }}
                  className="block w-20 px-3 py-1 text-left text-xs hover:bg-surface-2"
                >
                  {s}×
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <button
          type="button"
          aria-label="Undo"
          className="grid h-7 w-7 place-items-center rounded-md text-ink-muted hover:bg-surface-2"
          onClick={() => toast.info("Undo is not implemented in this demo.")}
        >
          <Undo2 className="h-4 w-4" />
        </button>

        <button
          type="button"
          aria-label={playing ? "Pause" : "Play"}
          onClick={togglePlay}
          className="grid h-10 w-10 place-items-center rounded-full bg-accent text-white shadow-md transition-all hover:scale-105 hover:bg-accent-hover active:scale-95"
        >
          {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 translate-x-[1px]" />}
        </button>

        <button
          type="button"
          aria-label="Redo"
          className="grid h-7 w-7 place-items-center rounded-md text-ink-muted hover:bg-surface-2"
          onClick={() => toast.info("Redo is not implemented in this demo.")}
        >
          <Redo2 className="h-4 w-4" />
        </button>

        <button
          type="button"
          aria-label="Toggle follow transcript"
          aria-pressed={followActive}
          title={
            followActive
              ? "Auto-scroll transcript with playback (on)"
              : "Auto-scroll transcript with playback (off)"
          }
          onClick={toggleFollow}
          className={`grid h-7 w-7 place-items-center rounded-md hover:bg-surface-2 ${
            followActive ? "text-accent" : "text-ink-muted"
          }`}
        >
          <AlignVerticalSpaceAround className="h-4 w-4" />
        </button>

        <button
          type="button"
          aria-label="Download"
          className="grid h-7 w-7 place-items-center rounded-md text-ink-muted hover:bg-surface-2"
          onClick={() => toast.info("Download is not implemented in this demo.")}
        >
          <Download className="h-4 w-4" />
        </button>

        <div className="ml-2 flex items-center gap-1">
          <button
            type="button"
            aria-label="Bookmark"
            onClick={handleBookmark}
            className="grid h-7 w-7 place-items-center rounded-md hover:bg-surface-2"
          >
            <Star
              className={
                bookmarked
                  ? "h-4 w-4 fill-amber-400 text-amber-500"
                  : "h-4 w-4 text-ink-muted"
              }
            />
          </button>
          <button
            type="button"
            aria-label="Mark complete"
            className="grid h-7 w-7 place-items-center rounded-md hover:bg-surface-2"
            onClick={() => toast.info("This is a placeholder action.")}
          >
            <CheckSquare className="h-4 w-4 text-ink-muted" />
          </button>
          <button
            type="button"
            aria-label="Thumbs up"
            className="grid h-7 w-7 place-items-center rounded-md hover:bg-surface-2"
            onClick={() => toast.success("Thanks for the feedback")}
          >
            <ThumbsUp className="h-4 w-4 text-ink-muted" />
          </button>
          <button
            type="button"
            aria-label="Thumbs down"
            className="grid h-7 w-7 place-items-center rounded-md hover:bg-surface-2"
            onClick={() => toast.info("Thanks for the feedback")}
          >
            <ThumbsDown className="h-4 w-4 text-ink-muted" />
          </button>
        </div>
      </div>
    </div>
  );
}