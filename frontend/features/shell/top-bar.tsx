"use client";

import { useState } from "react";
import { Search, Bell } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import clsx from "clsx";

interface TopBarProps {
  pageTitle?: string;
  showSearch?: boolean;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (v: string) => void;
  right?: React.ReactNode;
}

export function TopBar({
  pageTitle,
  showSearch = true,
  searchPlaceholder = "Search by title or keyword",
  searchValue,
  onSearchChange,
  right,
}: TopBarProps) {
  const [internal, setInternal] = useState("");
  const value = searchValue ?? internal;
  const handle = (v: string) => {
    if (searchValue === undefined) setInternal(v);
    onSearchChange?.(v);
  };

  return (
    <header className="flex h-14 items-center gap-2 border-b border-border-subtle bg-surface px-3 md:px-4">
      {pageTitle ? (
        <h1 className="hidden whitespace-nowrap text-base font-semibold text-ink md:block">
          {pageTitle}
        </h1>
      ) : null}

      {showSearch ? (
        <div className="relative mx-auto w-full max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
          <Input
            value={value}
            onChange={(e) => handle(e.target.value)}
            placeholder={searchPlaceholder}
            className="pl-9"
          />
          <span className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-border-subtle bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium text-ink-muted md:block">
            ⌘K
          </span>
        </div>
      ) : null}

      <div className={clsx("ml-auto flex items-center gap-2", !showSearch && "ml-0")}>
        {right}
        <span className="hidden rounded-full border border-border-subtle bg-surface px-2.5 py-0.5 text-xs text-ink-muted md:inline-flex">
          <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-amber-500 align-middle" />
          0 Free meetings
        </span>
        <button
          type="button"
          className="hidden rounded-md border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100 md:inline-flex"
        >
          Upgrade
        </button>
        <button
          type="button"
          aria-label="Notifications"
          className="relative grid h-9 w-9 place-items-center rounded-md hover:bg-surface-2"
        >
          <Bell className="h-4 w-4 text-ink-muted" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-danger" />
        </button>
        <Button
          className="md:hidden"
          size="sm"
          variant="primary"
          aria-label="Capture"
        >
          <span className="h-3 w-3 rounded-sm bg-white/80" />
          Capture
        </Button>
        <Button
          className="hidden md:inline-flex"
          size="sm"
          variant="primary"
          aria-label="Capture"
        >
          <span className="h-3 w-3 rounded-sm bg-white/80" />
          Capture
        </Button>
      </div>
    </header>
  );
}