"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import {
  useCreateMeeting,
  useUpdateMeeting,
} from "@/hooks/use-meetings";
import type {
  MeetingCreatePayload,
  MeetingRead,
  MeetingUpdatePayload,
  Channel,
  CaptureSource,
} from "@/lib/query-keys";
import { useToast } from "@/hooks/use-toast";

interface MeetingFormModalProps {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  meeting?: MeetingRead;
  onCreated?: (meeting: MeetingRead) => void;
  onUpdated?: (meeting: MeetingRead) => void;
}

function formatLocalDateTime(iso: string): string {
  // Convert ISO string to "YYYY-MM-DDTHH:mm" for datetime-local input.
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

export function MeetingFormModal({
  open,
  onClose,
  mode,
  meeting,
  onCreated,
  onUpdated,
}: MeetingFormModalProps) {
  const create = useCreateMeeting();
  const update = useUpdateMeeting(meeting?.id ?? 0);
  const toast = useToast();

  const initial = useMemo(() => {
    if (mode === "edit" && meeting) {
      return {
        title: meeting.title,
        host: meeting.host,
        starts_at: formatLocalDateTime(meeting.starts_at),
        duration_minutes: Math.max(0, Math.round(meeting.duration_seconds / 60)),
        channel: meeting.channel,
        capture_source: meeting.capture_source,
        bookmarked: meeting.bookmarked,
        participant_names: meeting.participants.map((p) => p.name).join(", "),
        transcript_text: "",
      };
    }
    const now = new Date();
    return {
      title: "",
      host: "Naresh Yadav",
      starts_at: formatLocalDateTime(now.toISOString()),
      duration_minutes: 30,
      channel: "my" as const,
      capture_source: "upload" as const,
      bookmarked: false,
      participant_names: "",
      transcript_text: "",
    };
  }, [mode, meeting, open]);

  const [form, setForm] = useState(initial);
  useEffect(() => {
    if (open) setForm(initial);
  }, [open, initial]);

  const submitting = create.isPending || update.isPending;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const startsAtIso = new Date(form.starts_at).toISOString();
    const participantNames = form.participant_names
      .split(",")
      .map((n) => n.trim())
      .filter(Boolean);

    if (mode === "create") {
      const payload: MeetingCreatePayload = {
        title: form.title.trim(),
        starts_at: startsAtIso,
        duration_seconds: Math.max(0, Math.round(form.duration_minutes * 60)),
        host: form.host.trim() || "Naresh Yadav",
        channel: form.channel,
        capture_source: form.capture_source,
        bookmarked: form.bookmarked,
        participant_names: participantNames,
        ...(form.transcript_text.trim()
          ? { transcript: { format: "txt" as const, text: form.transcript_text } }
          : {}),
      };
      create.mutate(payload, {
        onSuccess: (data) => {
          toast.success("Meeting created");
          onCreated?.(data);
          onClose();
        },
        onError: (e) => toast.error(e.message),
      });
    } else if (meeting) {
      const payload: MeetingUpdatePayload = {
        title: form.title.trim(),
        starts_at: startsAtIso,
        duration_seconds: Math.max(0, Math.round(form.duration_minutes * 60)),
        host: form.host.trim(),
        channel: form.channel,
        capture_source: form.capture_source,
        bookmarked: form.bookmarked,
        participant_names: participantNames,
      };
      update.mutate(payload, {
        onSuccess: (data) => {
          toast.success("Meeting updated");
          onUpdated?.(data);
          onClose();
        },
        onError: (e) => toast.error(e.message),
      });
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === "create" ? "New Meeting" : "Edit Meeting"}
      description={
        mode === "create"
          ? "Create a meeting. You can paste a transcript or leave it empty."
          : "Update meeting metadata. Transcript changes are managed separately."
      }
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            disabled={submitting || !form.title.trim()}
            aria-busy={submitting}
          >
            {submitting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : null}
            {submitting
              ? mode === "create"
                ? "Creating…"
                : "Saving…"
              : mode === "create"
                ? "Create meeting"
                : "Save changes"}
          </Button>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-5">
        <Field label="Title" required>
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Q4 Product Strategy"
            className={inputClass}
            required
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Date & time" required>
            <input
              type="datetime-local"
              value={form.starts_at}
              onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
              className={inputClass}
              required
            />
          </Field>
          <Field label="Duration (minutes)" required>
            <input
              type="number"
              min={0}
              value={form.duration_minutes}
              onChange={(e) =>
                setForm({
                  ...form,
                  duration_minutes: Math.max(0, Number(e.target.value)),
                })
              }
              className={inputClass}
            />
          </Field>
        </div>

        <Field label="Host" required>
          <input
            value={form.host}
            onChange={(e) => setForm({ ...form, host: e.target.value })}
            className={inputClass}
          />
        </Field>

        <Field label="Participants (comma, separated)">
          <input
            value={form.participant_names}
            onChange={(e) =>
              setForm({ ...form, participant_names: e.target.value })
            }
            placeholder="Naresh Yadav, Sarah Chen"
            className={inputClass}
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Field label="Channel">
            <select
              value={form.channel}
              onChange={(e) =>
                setForm({
                  ...form,
                  channel: e.target.value as Channel,
                })
              }
              className={inputClass}
            >
              <option value="my">My</option>
              <option value="all">All</option>
              <option value="voice">Voice Agent</option>
              <option value="uploads">Uploads</option>
            </select>
          </Field>
          <Field label="Capture source">
            <select
              value={form.capture_source}
              onChange={(e) =>
                setForm({
                  ...form,
                  capture_source: e.target.value as CaptureSource,
                })
              }
              className={inputClass}
            >
              <option value="upload">Upload</option>
              <option value="mic">Microphone</option>
              <option value="bot">Notetaker</option>
              <option value="desktop">Desktop</option>
              <option value="browser">Browser</option>
            </select>
          </Field>
          <Field label="Bookmark">
            <label className="flex items-center gap-2 pt-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={form.bookmarked}
                onChange={(e) =>
                  setForm({ ...form, bookmarked: e.target.checked })
                }
                className="h-4 w-4 rounded border-border-strong accent-accent"
              />
              Star this meeting
            </label>
          </Field>
        </div>

        {mode === "create" ? (
          <Field label="Transcript (optional, .txt format)">
            <textarea
              value={form.transcript_text}
              onChange={(e) =>
                setForm({ ...form, transcript_text: e.target.value })
              }
              rows={6}
              placeholder={"00:00 Naresh Yadav: Welcome everyone.\n00:07 Naresh Yadav: Let's start."}
              className={`${inputClass} font-mono text-xs`}
            />
            <p className="mt-1 text-[11px] text-ink-muted">
              Each line should look like: <code>mm:ss Speaker: text</code>.
              Multiple matches per speaker are supported.
            </p>
          </Field>
        ) : null}
      </form>
    </Modal>
  );
}

const inputClass =
  "h-9 w-full rounded-md border border-border-subtle bg-surface px-3 text-sm placeholder:text-ink-subtle focus:border-accent focus:outline-none";

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-ink">
        {label}
        {required ? <span className="ml-0.5 text-danger">*</span> : null}
      </span>
      {children}
    </label>
  );
}