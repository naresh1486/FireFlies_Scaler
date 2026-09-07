"use client";

import { useState } from "react";
import { Check, Pencil, Trash2, Plus, Loader2 } from "lucide-react";
import { clsx } from "clsx";

import {
  useActionItems,
  useCreateActionItem,
  useDeleteActionItem,
  useUpdateActionItem,
} from "@/hooks/use-notepad";
import type {
  ActionItemCreatePayload,
  ActionItemRead,
  ActionItemUpdatePayload,
} from "@/lib/query-keys";
import { useToast } from "@/hooks/use-toast";

function formatDate(iso: string | null): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}

interface ActionItemsPanelProps {
  meetingId: number;
}

export function ActionItemsPanel({ meetingId }: ActionItemsPanelProps) {
  const query = useActionItems(meetingId);
  const create = useCreateActionItem(meetingId);
  const toast = useToast();
  const [draftTitle, setDraftTitle] = useState("");
  const [draftAssignee, setDraftAssignee] = useState("");
  const [draftDue, setDraftDue] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  const submitCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftTitle.trim()) return;
    const payload: ActionItemCreatePayload = {
      title: draftTitle.trim(),
      assignee: draftAssignee.trim() || null,
      due_date: draftDue || null,
    };
    create.mutate(payload, {
      onSuccess: () => {
        setDraftTitle("");
        setDraftAssignee("");
        setDraftDue("");
        toast.success("Action item added");
      },
      onError: (err) => toast.error(err.message),
    });
  };

  if (query.isLoading) {
    return (
      <section>
        <h3 className="text-base font-semibold text-ink">Action Items</h3>
        <div className="mt-4 space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-8 animate-pulse rounded bg-surface-2" />
          ))}
        </div>
      </section>
    );
  }

  const items = query.data?.items ?? [];

  return (
    <section>
      <h3 className="text-base font-semibold text-ink">Action Items</h3>
      <p className="mt-1 text-xs text-ink-muted">
        {items.filter((i) => !i.completed).length} pending ·{" "}
        {items.filter((i) => i.completed).length} completed
      </p>

      <ul className="mt-4 space-y-2">
        {items.map((item) => (
          <ActionItemRow
            key={item.id}
            item={item}
            meetingId={meetingId}
            isEditing={editingId === item.id}
            onStartEdit={() => setEditingId(item.id)}
            onCancelEdit={() => setEditingId(null)}
            onSavedEdit={() => setEditingId(null)}
          />
        ))}
        {items.length === 0 ? (
          <li className="rounded-md border border-dashed border-border-subtle p-4 text-center text-xs text-ink-muted">
            No action items yet. Add one below.
          </li>
        ) : null}
      </ul>

      <form
        onSubmit={submitCreate}
        className="mt-4 rounded-md border border-border-subtle bg-surface p-3"
      >
        <label className="text-xs font-semibold text-ink">Add action item</label>
        <div className="mt-2 grid grid-cols-1 gap-2">
          <input
            type="text"
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            placeholder="What needs to happen?"
            className="h-9 w-full rounded-md border border-border-subtle bg-surface px-3 text-sm placeholder:text-ink-subtle focus:border-accent focus:outline-none"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={draftAssignee}
              onChange={(e) => setDraftAssignee(e.target.value)}
              placeholder="Assignee (optional)"
              className="h-9 w-full rounded-md border border-border-subtle bg-surface px-3 text-sm placeholder:text-ink-subtle focus:border-accent focus:outline-none"
            />
            <input
              type="date"
              value={draftDue}
              onChange={(e) => setDraftDue(e.target.value)}
              className="h-9 w-full rounded-md border border-border-subtle bg-surface px-3 text-sm text-ink focus:border-accent focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={create.isPending || !draftTitle.trim()}
            aria-busy={create.isPending}
            className="ml-auto inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {create.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Plus className="h-3.5 w-3.5" />
            )}
            {create.isPending ? "Adding…" : "Add"}
          </button>
        </div>
      </form>
    </section>
  );
}

function ActionItemRow({
  item,
  meetingId,
  isEditing,
  onStartEdit,
  onCancelEdit,
  onSavedEdit,
}: {
  item: ActionItemRead;
  meetingId: number;
  isEditing: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSavedEdit: () => void;
}) {
  const update = useUpdateActionItem(meetingId);
  const remove = useDeleteActionItem(meetingId);
  const toast = useToast();

  const [editTitle, setEditTitle] = useState(item.title);
  const [editAssignee, setEditAssignee] = useState(item.assignee ?? "");
  const [editDue, setEditDue] = useState(item.due_date ?? "");

  const toggleComplete = () => {
    const payload: ActionItemUpdatePayload = { completed: !item.completed };
    update.mutate(
      { id: item.id, payload },
      {
        onError: (e) => toast.error(e.message),
      },
    );
  };

  const saveEdit = () => {
    const payload: ActionItemUpdatePayload = {
      title: editTitle.trim() || item.title,
      assignee: editAssignee.trim() || null,
      due_date: editDue || null,
    };
    update.mutate(
      { id: item.id, payload },
      {
        onSuccess: () => {
          toast.success("Action item updated");
          onSavedEdit();
        },
        onError: (e) => toast.error(e.message),
      },
    );
  };

  const onDelete = () => {
    remove.mutate(item.id, {
      onSuccess: () => toast.success("Action item deleted"),
      onError: (e) => toast.error(e.message),
    });
  };

  if (isEditing) {
    return (
      <li className="rounded-md border border-accent/40 bg-surface p-3">
        <input
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          className="h-9 w-full rounded-md border border-border-subtle bg-surface px-3 text-sm focus:border-accent focus:outline-none"
        />
        <div className="mt-2 grid grid-cols-2 gap-2">
          <input
            value={editAssignee}
            onChange={(e) => setEditAssignee(e.target.value)}
            placeholder="Assignee"
            className="h-9 w-full rounded-md border border-border-subtle bg-surface px-3 text-sm placeholder:text-ink-subtle focus:border-accent focus:outline-none"
          />
          <input
            type="date"
            value={editDue}
            onChange={(e) => setEditDue(e.target.value)}
            className="h-9 w-full rounded-md border border-border-subtle bg-surface px-3 text-sm focus:border-accent focus:outline-none"
          />
        </div>
        <div className="mt-2 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancelEdit}
            className="rounded-md px-2 py-1 text-xs text-ink-muted hover:bg-surface-2"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={saveEdit}
            disabled={update.isPending}
            aria-busy={update.isPending}
            className="inline-flex items-center gap-1 rounded-md bg-accent px-3 py-1 text-xs font-semibold text-white shadow-sm hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {update.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
            {update.isPending ? "Saving…" : "Save"}
          </button>
        </div>
      </li>
    );
  }

  return (
    <li
      className={clsx(
        "group flex items-start gap-3 rounded-md border border-border-subtle bg-surface p-3 transition-colors hover:border-border-strong",
        item.completed && "bg-surface-2/60",
      )}
    >
      <button
        type="button"
        aria-label={item.completed ? "Mark as incomplete" : "Mark as complete"}
        onClick={toggleComplete}
        className={clsx(
          "mt-0.5 grid h-5 w-5 place-items-center rounded border",
          item.completed
            ? "border-success bg-success/10 text-success"
            : "border-border-strong text-transparent hover:border-accent",
        )}
      >
        <Check className="h-3.5 w-3.5" />
      </button>
      <div className="min-w-0 flex-1">
        <p
          className={clsx(
            "text-sm font-medium text-ink",
            item.completed && "text-ink-muted line-through",
          )}
        >
          {item.title}
        </p>
        {(item.assignee || item.due_date) && (
          <p className="mt-0.5 text-xs text-ink-muted">
            {item.assignee ? <span>{item.assignee}</span> : null}
            {item.assignee && item.due_date ? <span> · </span> : null}
            {item.due_date ? (
              <span>due {formatDate(item.due_date)}</span>
            ) : null}
          </p>
        )}
        {item.completed && item.completed_at ? (
          <p className="mt-0.5 text-[10px] uppercase tracking-wide text-success">
            Completed
          </p>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-1 opacity-0 group-hover:opacity-100">
        <button
          type="button"
          aria-label="Edit"
          onClick={onStartEdit}
          className="grid h-7 w-7 place-items-center rounded-md text-ink-muted hover:bg-surface-2"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          aria-label="Delete"
          onClick={onDelete}
          className="grid h-7 w-7 place-items-center rounded-md text-ink-muted hover:bg-surface-2"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </li>
  );
}