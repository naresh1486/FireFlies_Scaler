"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import {
  Home,
  MessageSquareText,
  Video,
  ListChecks,
  Sparkles,
  BarChart3,
  Mic2,
  Zap,
  Mail,
  Plug,
  Settings,
  Menu,
  X,
} from "lucide-react";

interface RailItem {
  label: string;
  href: string | null;
  icon: React.ComponentType<{ className?: string }>;
  pill?: { text: string; tone: "warning" | "success" | "info" };
  highlight?: boolean;
}

const items: RailItem[] = [
  { label: "Home", href: "/", icon: Home },
  { label: "AskFred", href: null, icon: MessageSquareText },
  { label: "Meetings", href: "/meetings", icon: Video },
  { label: "Tasks", href: null, icon: ListChecks },
  { label: "AI Skills", href: null, icon: Sparkles },
  { label: "Analytics", href: null, icon: BarChart3 },
  { label: "Voice Agents", href: null, icon: Mic2 },
  {
    label: "Upgrade",
    href: null,
    icon: Zap,
    pill: { text: "40% OFF", tone: "success" },
  },
  { label: "Try Email Assistant", href: null, icon: Mail, highlight: true },
  { label: "Integrations", href: null, icon: Plug },
  { label: "Settings", href: "/settings", icon: Settings },
];

function RailList({
  pathname,
  onNavigate,
  compact,
}: {
  pathname: string;
  onNavigate?: () => void;
  compact?: boolean;
}) {
  return (
    <ul className="flex flex-1 flex-col gap-0.5 px-2">
      {items.map((item) => {
        const isActive = item.href === pathname;
        const linkClass = clsx(
          "group/item flex items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
          isActive
            ? "bg-accent/10 text-accent"
            : "text-ink-muted hover:bg-surface-2 hover:text-ink",
          item.highlight && !isActive && "bg-amber-50 text-ink",
        );
        const iconNode = (
          <span className="grid h-6 w-6 shrink-0 place-items-center">
            <item.icon className="h-5 w-5" />
          </span>
        );
        const inner = (
          <>
            {iconNode}
            {compact ? (
              <span className="flex-1 truncate">{item.label}</span>
            ) : (
              <span className="hidden flex-1 truncate opacity-0 transition-opacity duration-150 group-hover/rail:inline group-hover/rail:opacity-100">
                {item.label}
              </span>
            )}
            {item.pill ? (
              <span
                className={clsx(
                  "rounded px-1.5 py-0.5 text-[10px] font-semibold",
                  compact && "inline",
                  !compact &&
                    "hidden opacity-0 transition-opacity duration-150 group-hover/rail:inline group-hover/rail:opacity-100",
                  item.pill.tone === "success" && "bg-emerald-100 text-emerald-700",
                  item.pill.tone === "warning" && "bg-amber-100 text-amber-700",
                  item.pill.tone === "info" && "bg-sky-100 text-sky-700",
                )}
              >
                {item.pill.text}
              </span>
            ) : null}
          </>
        );
        const href = item.href ?? "/coming-soon";

        return (
          <li key={item.label}>
            <Link
              href={href}
              className={linkClass}
              aria-current={isActive ? "page" : undefined}
              title={item.label}
              onClick={onNavigate}
            >
              {inner}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** Desktop icon-only rail that expands on hover. */
export function DesktopIconRail() {
  const pathname = usePathname() ?? "/";
  return (
    <nav
      aria-label="Primary"
      className="group/rail hidden h-screen w-16 shrink-0 flex-col items-stretch border-r border-border-subtle py-3 transition-[width,box-shadow] duration-200 ease-out hover:w-52 hover:shadow-md md:flex"
    >
      <div className="px-3 pb-4">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-md px-1 py-1 text-sm font-semibold text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        >
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-accent text-xs font-bold text-white">
            FF
          </span>
          <span className="hidden whitespace-nowrap opacity-0 transition-opacity duration-150 group-hover/rail:inline group-hover/rail:opacity-100">
            Fireflies Clone
          </span>
        </Link>
      </div>
      <RailList pathname={pathname} />
    </nav>
  );
}

/** Mobile hamburger trigger + slide-over drawer. */
export function MobileIconRail() {
  const pathname = usePathname() ?? "/";
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        aria-label="Open navigation menu"
        onClick={() => setOpen(true)}
        className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-border-subtle bg-surface text-ink md:hidden"
      >
        <Menu className="h-4 w-4" />
      </button>
      {open ? (
        <div
          className="fixed inset-0 z-40 md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Primary navigation"
        >
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
          />
          <nav className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-surface shadow-lg">
            <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
              <Link
                href="/"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 text-sm font-semibold text-ink"
              >
                <span className="grid h-7 w-7 place-items-center rounded-md bg-accent text-xs font-bold text-white">
                  FF
                </span>
                Fireflies Clone
              </Link>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-md text-ink-muted hover:bg-surface-2"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <ul className="flex-1 overflow-y-auto p-2">
              <RailList
                pathname={pathname}
                onNavigate={() => setOpen(false)}
                compact
              />
            </ul>
          </nav>
        </div>
      ) : null}
    </>
  );
}