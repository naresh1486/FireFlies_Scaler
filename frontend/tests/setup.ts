import "@testing-library/jest-dom/vitest";

// Polyfill HTMLMediaElement for jsdom (no playback).
if (typeof window !== "undefined") {
  window.HTMLMediaElement.prototype.play = function () {
    return Promise.resolve();
  };
  window.HTMLMediaElement.prototype.pause = function () {
    /* noop */
  };
  window.HTMLMediaElement.prototype.load = function () {
    /* noop */
  };
}