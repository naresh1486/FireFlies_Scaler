"use client";

import { useEffect } from "react";

import { useMediaSync } from "@/features/transcript/media-sync-context";

/**
 * Document-level keyboard shortcuts for the Notepad media player.
 *
 * - Space → toggle play
 * - ← / → → seek ±5s
 * - J / L → step to previous / next segment
 * - F → toggle follow mode
 *
 * Skipped when the user is typing in an input/textarea/contenteditable.
 */
export function KeyboardShortcuts() {
  const { togglePlay, seekRelative, stepSegment, toggleFollow } = useMediaSync();

  useEffect(() => {
    function isEditable(target: EventTarget | null): boolean {
      if (!(target instanceof HTMLElement)) return false;
      if (target.isContentEditable) return true;
      const tag = target.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
    }

    function onKey(e: KeyboardEvent) {
      if (e.defaultPrevented) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isEditable(e.target)) return;

      switch (e.key) {
        case " ":
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowLeft":
          e.preventDefault();
          seekRelative(-5);
          break;
        case "ArrowRight":
          e.preventDefault();
          seekRelative(5);
          break;
        case "j":
        case "J":
          e.preventDefault();
          stepSegment(-1);
          break;
        case "l":
        case "L":
          e.preventDefault();
          stepSegment(1);
          break;
        case "f":
        case "F":
          e.preventDefault();
          toggleFollow();
          break;
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [togglePlay, seekRelative, stepSegment, toggleFollow]);

  return null;
}