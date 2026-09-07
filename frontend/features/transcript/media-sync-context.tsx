"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type { TranscriptSegmentRead } from "@/lib/query-keys";
import { compute_active_segment, step_segment } from "@/features/transcript/media-sync-helpers";

interface MediaSyncState {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  currentTime: number;
  duration: number;
  playing: boolean;
  playbackRate: number;
  activeSegmentId: number | null;
  followActive: boolean;
  toggleFollow: () => void;
  setFollowActive: (v: boolean) => void;
  seek: (time: number) => void;
  seekRelative: (delta: number) => void;
  togglePlay: () => void;
  setPlaybackRate: (rate: number) => void;
  bindSegments: (segments: TranscriptSegmentRead[]) => void;
  segments: TranscriptSegmentRead[];
  stepSegment: (direction: -1 | 1) => void;
}

const MediaSyncContext = createContext<MediaSyncState | null>(null);

export function MediaSyncProvider({
  meetingId,
  src,
  children,
}: {
  meetingId: number;
  src: string;
  children: React.ReactNode;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const segmentsRef = useRef<TranscriptSegmentRead[]>([]);
  const rafRef = useRef<number | null>(null);

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [playbackRate, setPlaybackRateState] = useState(1);
  const [activeSegmentId, setActiveSegmentId] = useState<number | null>(null);
  const [followActive, setFollowActive] = useState(true);
  const [segments, setSegments] = useState<TranscriptSegmentRead[]>([]);

  const computeActive = useCallback(
    (time: number, segs: TranscriptSegmentRead[]): number | null =>
      compute_active_segment(
        time,
        segs.map((s) => ({
          id: s.id,
          start_time: s.start_time,
          end_time: s.end_time,
        })),
      ),
    [],
  );

  const tick = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    setCurrentTime(el.currentTime);
    setActiveSegmentId(computeActive(el.currentTime, segmentsRef.current));
    rafRef.current = requestAnimationFrame(tick);
  }, [computeActive]);

  useEffect(() => {
    if (playing) {
      rafRef.current = requestAnimationFrame(tick);
      return () => {
        if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      };
    }
    return undefined;
  }, [playing, tick]);

  useEffect(() => {
    setCurrentTime(0);
    setActiveSegmentId(null);
    setPlaying(false);
    segmentsRef.current = [];
    setSegments([]);
  }, [meetingId]);

  const seek = useCallback(
    (time: number) => {
      const el = audioRef.current;
      if (!el) return;
      const safe = Math.max(
        0,
        Math.min(time, isFinite(el.duration) ? el.duration : time),
      );
      el.currentTime = safe;
      setCurrentTime(safe);
      setActiveSegmentId(computeActive(safe, segmentsRef.current));
    },
    [computeActive],
  );

  const seekRelative = useCallback(
    (delta: number) => {
      const el = audioRef.current;
      if (!el) return;
      seek(el.currentTime + delta);
    },
    [seek],
  );

  const togglePlay = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) {
      void el.play();
    } else {
      el.pause();
    }
  }, []);

  const setPlaybackRate = useCallback((rate: number) => {
    const el = audioRef.current;
    if (el) el.playbackRate = rate;
    setPlaybackRateState(rate);
  }, []);

  const toggleFollow = useCallback(() => {
    setFollowActive((v) => !v);
  }, []);

  const bindSegments = useCallback(
    (next: TranscriptSegmentRead[]) => {
      segmentsRef.current = next;
      setSegments(next);
      setActiveSegmentId(
        computeActive(audioRef.current?.currentTime ?? 0, next),
      );
    },
    [computeActive],
  );

  const stepSegment = useCallback(
    (direction: -1 | 1) => {
      const list = segmentsRef.current;
      if (!list.length) return;
      const t = audioRef.current?.currentTime ?? 0;
      const next = step_segment(
        list.map((s) => ({
          id: s.id,
          start_time: s.start_time,
          end_time: s.end_time,
        })),
        t,
        direction,
      );
      if (next && next.id !== undefined) {
        const target = list.find((x) => x.id === next.id);
        if (target) seek(target.start_time);
      }
    },
    [seek],
  );

  const value = useMemo<MediaSyncState>(
    () => ({
      audioRef,
      currentTime,
      duration,
      playing,
      playbackRate,
      activeSegmentId,
      followActive,
      toggleFollow,
      setFollowActive,
      seek,
      seekRelative,
      togglePlay,
      setPlaybackRate,
      bindSegments,
      segments,
      stepSegment,
    }),
    [
      currentTime,
      duration,
      playing,
      playbackRate,
      activeSegmentId,
      followActive,
      toggleFollow,
      seek,
      seekRelative,
      togglePlay,
      setPlaybackRate,
      bindSegments,
      segments,
      stepSegment,
    ],
  );

  return (
    <MediaSyncContext.Provider value={value}>
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onLoadedMetadata={(e) =>
          setDuration((e.currentTarget as HTMLAudioElement).duration)
        }
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
      />
      {children}
    </MediaSyncContext.Provider>
  );
}

export function useMediaSync(): MediaSyncState {
  const ctx = useContext(MediaSyncContext);
  if (!ctx) {
    throw new Error("useMediaSync must be used within <MediaSyncProvider>");
  }
  return ctx;
}