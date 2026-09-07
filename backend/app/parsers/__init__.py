"""Transcript parsers.

Supported input formats:
- `txt`   Plain text. Each line is a segment. Either:
            * "HH:MM:SS Speaker: text"
            * "M:SS Speaker: text"
            * "Speaker: text" (no timestamp; start_time defaults to 0)
- `vtt`   WebVTT. Cue format: "HH:MM:SS.mmm --> HH:MM:SS.mmm\nSpeaker: text"
            Speaker line is optional; if missing, speaker_name defaults
            to "Speaker" and speaker_key is derived from sequence.
- `json`  JSON array of objects:
            [{"speaker_name": "...", "speaker_key": "...",
              "start_time": 0.0, "end_time": 1.0, "text": "..."}]

The parser is strict about monotonic sequence (start_time non-decreasing
across segments of the same meeting). On failure it raises
ValueError with a human-readable message; the API layer converts that
to a 400 validation_error.
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass


@dataclass(frozen=True)
class ParsedSegment:
    speaker_name: str
    speaker_key: str
    start_time: float
    end_time: float
    text: str


_TIME_HMS_RE = re.compile(r"^(\d{1,2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?$")
_TIME_MS_RE = re.compile(r"^(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?$")


def parse_time(raw: str) -> float:
    raw = raw.strip()
    m = _TIME_HMS_RE.match(raw)
    if m:
        h, mn, s = int(m.group(1)), int(m.group(2)), int(m.group(3))
        ms = int(m.group(4)) if m.group(4) else 0
        return h * 3600 + mn * 60 + s + ms / 1000
    m = _TIME_MS_RE.match(raw)
    if m:
        mn, s = int(m.group(1)), int(m.group(2))
        ms = int(m.group(3)) if m.group(3) else 0
        return mn * 60 + s + ms / 1000
    raise ValueError(f"Invalid timestamp: {raw!r}")


def _speaker_key_for(name: str, index: int) -> str:
    cleaned = re.sub(r"[^a-z0-9]+", "_", name.lower()).strip("_")
    return cleaned or f"spk_{index}"


def parse_txt(text: str) -> list[ParsedSegment]:
    segments: list[ParsedSegment] = []
    for line in text.splitlines():
        stripped = line.strip()
        if not stripped:
            continue

        # Strategy: a line can have one of two shapes:
        #   A) "[<timestamp>] <Speaker>: <text>"
        #   B) "<Speaker>: <text>" (no timestamp; start_time defaults to 0)
        # In both shapes the SPEAKER separator is the colon we pick. We
        # need to skip past any leading timestamp that itself contains
        # colons, so we first try to consume a leading timestamp; the
        # remainder is then "<Speaker>: <text>".

        start_time = 0.0
        remainder = stripped

        ts_match = re.match(
            r"^(\[)?((?:\d{1,2}:)?\d{1,2}:\d{2}(?:\.\d{1,3})?)(?:\]|\s+)",
            remainder,
        )
        if ts_match:
            ts_raw = ts_match.group(2)
            try:
                start_time = parse_time(ts_raw)
            except ValueError as e:
                raise ValueError(f"Line {len(segments) + 1}: {e}") from e
            remainder = remainder[ts_match.end():].lstrip()

        if ":" not in remainder:
            # No speaker separator → treat the whole line as text.
            segments.append(
                ParsedSegment(
                    speaker_name="Speaker",
                    speaker_key=_speaker_key_for("Speaker", len(segments)),
                    start_time=start_time,
                    end_time=start_time,
                    text=remainder,
                )
            )
            continue

        speaker_idx = remainder.find(":")
        speaker_name = remainder[:speaker_idx].strip() or "Speaker"
        body = remainder[speaker_idx + 1 :].strip()

        if not body:
            raise ValueError(f"Line {len(segments) + 1}: missing text after speaker")

        segments.append(
            ParsedSegment(
                speaker_name=speaker_name,
                speaker_key=_speaker_key_for(speaker_name, len(segments)),
                start_time=start_time,
                end_time=start_time,  # txt format has only start_time
                text=body,
            )
        )

    _ensure_monotonic(segments)
    _ensure_end_after_start(segments)
    return segments


def parse_vtt(text: str) -> list[ParsedSegment]:
    segments: list[ParsedSegment] = []
    blocks = re.split(r"\n\s*\n", text.strip())
    for block in blocks:
        lines = [ln for ln in block.splitlines() if ln.strip()]
        if not lines:
            continue
        if lines[0].strip().upper().startswith("WEBVTT"):
            continue
        if "-->" not in lines[0]:
            continue
        try:
            start_str, end_str = [s.strip() for s in lines[0].split("-->", 1)]
            start_time = parse_time(start_str)
            end_time = parse_time(end_str)
        except ValueError as e:
            raise ValueError(f"Invalid cue timing: {lines[0]!r}: {e}") from e
        body_lines = lines[1:]
        speaker_name = "Speaker"
        body = ""
        if body_lines:
            head = body_lines[0]
            if ":" in head:
                sp, _, txt = head.partition(":")
                speaker_name = sp.strip() or "Speaker"
                body = "\n".join([txt.strip(), *body_lines[1:]]).strip()
            else:
                body = "\n".join(body_lines).strip()
        if not body:
            continue
        segments.append(
            ParsedSegment(
                speaker_name=speaker_name,
                speaker_key=_speaker_key_for(speaker_name, len(segments)),
                start_time=start_time,
                end_time=end_time,
                text=body,
            )
        )

    _ensure_monotonic(segments)
    _ensure_end_after_start(segments)
    return segments


def parse_json(text: str) -> list[ParsedSegment]:
    try:
        data = json.loads(text)
    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid JSON: {e}") from e
    if not isinstance(data, list):
        raise ValueError("JSON transcript must be an array of segments")
    segments: list[ParsedSegment] = []
    for idx, item in enumerate(data):
        if not isinstance(item, dict):
            raise ValueError(f"Segment {idx}: expected object")
        try:
            speaker_name = str(item["speaker_name"])
            start_time = float(item["start_time"])
            end_time = float(item.get("end_time", start_time))
            text_value = str(item["text"])
        except KeyError as e:
            raise ValueError(f"Segment {idx}: missing {e.args[0]}") from e
        speaker_key = str(item.get("speaker_key") or _speaker_key_for(speaker_name, idx))
        if not text_value.strip():
            continue
        segments.append(
            ParsedSegment(
                speaker_name=speaker_name,
                speaker_key=speaker_key,
                start_time=start_time,
                end_time=end_time,
                text=text_value,
            )
        )
    _ensure_monotonic(segments)
    _ensure_end_after_start(segments)
    return segments


def parse_transcript(format: str, text: str) -> list[ParsedSegment]:
    fmt = (format or "").strip().lower()
    if fmt == "txt":
        return parse_txt(text)
    if fmt == "vtt":
        return parse_vtt(text)
    if fmt == "json":
        return parse_json(text)
    raise ValueError(f"Unsupported transcript format: {format!r}")


def _ensure_monotonic(segments: list[ParsedSegment]) -> None:
    for i in range(1, len(segments)):
        prev = segments[i - 1]
        curr = segments[i]
        if curr.start_time < prev.start_time - 1e-3:
            raise ValueError(
                f"Segment {i + 1} starts at {curr.start_time}s but previous segment "
                f"starts at {prev.start_time}s; timestamps must be non-decreasing."
            )


def _ensure_end_after_start(segments: list[ParsedSegment]) -> None:
    for i, s in enumerate(segments):
        if s.end_time + 1e-3 < s.start_time:
            raise ValueError(
                f"Segment {i + 1}: end_time ({s.end_time}s) must be >= "
                f"start_time ({s.start_time}s)"
            )


def coalesce_end_times(segments: list[ParsedSegment]) -> list[ParsedSegment]:
    """Set each segment's end_time to the next segment's start_time so the
    transcript covers the full meeting duration. Mutates a copy."""
    out: list[ParsedSegment] = []
    for i, seg in enumerate(segments):
        if seg.end_time <= seg.start_time and i + 1 < len(segments):
            end_time = segments[i + 1].start_time
        else:
            end_time = seg.end_time
        out.append(
            ParsedSegment(
                speaker_name=seg.speaker_name,
                speaker_key=seg.speaker_key,
                start_time=seg.start_time,
                end_time=end_time,
                text=seg.text,
            )
        )
    return out