"use client";

import { useState } from "react";
import { ChevronRight, Slack, Share2, Plus, Bell, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";

import type { MeetingRead } from "@/lib/query-keys";
import { useToast } from "@/hooks/use-toast";

interface BreadcrumbHeaderProps {
  meeting: MeetingRead;
  channel: string;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function BreadcrumbHeader({ meeting, channel, onEdit, onDelete }: BreadcrumbHeaderProps) {
  const toast = useToast();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex h-14 items-center gap-2 border-b border-border-subtle bg-surface px-4">
      <div className="flex items-center gap-1 text-sm text-ink-muted">
        <Link href="/" className="hover:text-ink">
          <span className="grid h-6 w-6 place-items-center rounded bg-surface-2 text-[10px] font-semibold text-ink">
            NY
          </span>
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link href={`/meetings?channel=${channel}`} className="hover:text-ink">
          #{channel} Meetings
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="font-semibold text-ink">{meeting.title}</span>
        <div className="relative ml-1">
          <button
            type="button"
            aria-label="More actions"
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            onClick={() => setMenuOpen((v) => !v)}
            className="grid h-7 w-7 place-items-center rounded hover:bg-surface-2"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          {menuOpen ? (
            <div
              role="menu"
              className="absolute right-0 top-full z-10 mt-1 w-44 rounded-md border border-border-subtle bg-surface py-1 shadow-md"
              onMouseLeave={() => setMenuOpen(false)}
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  onEdit?.();
                }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-ink hover:bg-surface-2"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit meeting
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  onDelete?.();
                }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-danger hover:bg-danger/5"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete meeting
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          className="rounded-md border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100"
        >
          Upgrade
        </button>
        <button
          type="button"
          aria-label="Integrations"
          className="grid h-8 w-8 place-items-center rounded-md hover:bg-surface-2"
          onClick={() => toast.info("Slack integration is not implemented in this demo.")}
        >
          <Slack className="h-4 w-4 text-emerald-500" />
        </button>
        <span className="rounded-md border border-border-subtle bg-surface px-2 py-1 text-xs text-ink-muted">
          👁 1 View
        </span>
        <Button
          icon={<Share2 className="h-3.5 w-3.5" />}
          onClick={() => toast.info("Share is not implemented in this demo.")}
        >
          Share
        </Button>
        <button
          type="button"
          aria-label="Add"
          className="grid h-8 w-8 place-items-center rounded-md border border-border-subtle hover:bg-surface-2"
          onClick={() => toast.info("Add is not implemented in this demo.")}
        >
          <Plus className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="Notifications"
          className="relative grid h-8 w-8 place-items-center rounded-md hover:bg-surface-2"
        >
          <Bell className="h-4 w-4 text-ink-muted" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-danger" />
        </button>
        <span className="grid h-8 w-8 place-items-center rounded-md bg-surface-2 text-xs font-semibold">
          NY
        </span>
      </div>
    </div>
  );
}

function Button({
  children,
  onClick,
  icon,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1 text-xs font-semibold text-white hover:bg-accent-hover"
    >
      {icon}
      {children}
    </button>
  );
}