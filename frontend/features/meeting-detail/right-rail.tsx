"use client";

import { useState } from "react";
import { Sparkles, MessageSquareText, X, Plus } from "lucide-react";
import { clsx } from "clsx";

import { TranscriptPanel } from "@/features/transcript/transcript-panel";
import type { TranscriptSegmentRead } from "@/lib/query-keys";
import { useToast } from "@/hooks/use-toast";

interface RightRailProps {
  meetingId: number;
  transcript: TranscriptSegmentRead[];
  channelName: string;
  activeTab?: "askfred" | "transcript";
  onActiveTabChange?: (tab: "askfred" | "transcript") => void;
}

const SUGGESTED_PROMPTS = [
  "My action items",
  "Key decisions",
  "Summarize the meeting",
];

export function RightRail({
  meetingId,
  transcript,
  channelName,
  activeTab,
  onActiveTabChange,
}: RightRailProps) {
  const [internal, setInternal] = useState<"askfred" | "transcript">("askfred");
  const tab = activeTab ?? internal;
  const setTab = (next: "askfred" | "transcript") => {
    if (onActiveTabChange) onActiveTabChange(next);
    if (activeTab === undefined) setInternal(next);
  };
  const toast = useToast();

  return (
    <aside className="flex w-full shrink-0 flex-col border-l border-border-subtle bg-surface md:w-96">
      <div className="flex items-center gap-1 border-b border-border-subtle px-2 py-2">
        <TabButton
          label="Ask Fred"
          icon={<Sparkles className="h-3.5 w-3.5" />}
          selected={tab === "askfred"}
          onClick={() => {
            setTab("askfred");
            if (activeTab === undefined) toast.info("Ask Fred is a placeholder in this demo.");
          }}
        />
        <TabButton
          label="Transcript"
          icon={<MessageSquareText className="h-3.5 w-3.5" />}
          selected={tab === "transcript"}
          onClick={() => {
            setTab("transcript");
            if (activeTab === undefined) toast.info("Ask Fred is a placeholder in this demo.");
          }}
        />
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            aria-label="New chat"
            className="grid h-7 w-7 place-items-center rounded-md hover:bg-surface-2"
            onClick={() => toast.info("Ask Fred chat is a placeholder in this demo.")}
          >
            <Plus className="h-4 w-4 text-ink-muted" />
          </button>
          <button
            type="button"
            aria-label="Close panel"
            className="grid h-7 w-7 place-items-center rounded-md hover:bg-surface-2"
          >
            <X className="h-4 w-4 text-ink-muted" />
          </button>
        </div>
      </div>

      {tab === "askfred" ? (
        <AskFredPanel channelName={channelName} onPrompt={(p) => toast.info(p)} />
      ) : (
        <TranscriptPanel meetingId={meetingId} segments={transcript} />
      )}
    </aside>
  );
}

function TabButton({
  label,
  icon,
  selected,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold",
        selected
          ? "border-b-2 border-accent text-accent"
          : "text-ink-muted hover:text-ink",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function AskFredPanel({
  channelName,
  onPrompt,
}: {
  channelName: string;
  onPrompt: (text: string) => void;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
        <div className="flex justify-center">
          <Sparkles className="h-6 w-6 text-emerald-500" />
        </div>
        <div>
          <h4 className="text-lg font-semibold text-ink">Hi Naresh!</h4>
          <p className="mt-1 text-sm text-ink-muted">
            Ask anything about this meeting
          </p>
        </div>
        <ul className="space-y-2">
          {SUGGESTED_PROMPTS.map((p) => (
            <li key={p}>
              <button
                type="button"
                onClick={() => onPrompt(p)}
                className="w-full rounded-md border border-border-subtle bg-surface px-3 py-2 text-left text-sm text-ink hover:bg-surface-2"
              >
                {p}
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="border-t border-border-subtle p-3">
        <div className="rounded-md border border-border-subtle px-2 py-1 text-[11px] text-ink-muted">
          #{channelName}
        </div>
        <div className="mt-2 flex items-center gap-2 rounded-md border border-border-subtle px-3 py-2 text-sm text-ink-muted">
          <span>Ask anything. Type / to run AI skills.</span>
          <button
            type="button"
            aria-label="Send"
            onClick={() => onPrompt("(sent)")}
            className="ml-auto grid h-6 w-6 place-items-center rounded bg-accent text-white hover:bg-accent-hover"
          >
            ↑
          </button>
        </div>
      </div>
    </div>
  );
}