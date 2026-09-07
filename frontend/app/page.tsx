import Link from "next/link";

import { AppShell } from "@/features/shell/app-shell";
import { TopBar } from "@/features/shell/top-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <AppShell>
      <TopBar pageTitle="Home" />
      <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
        <section className="mx-auto max-w-2xl space-y-6">
          <header className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
              Welcome
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-ink md:text-3xl">
              Fireflies Clone
            </h1>
            <p className="text-sm text-ink-muted md:text-base">
              The meetings library is live. Open it to browse, search, and
              manage meetings.
            </p>
          </header>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/meetings">
              <Button>Go to Meetings Library</Button>
            </Link>
            <Link href="/meetings/1">
              <Button variant="secondary">Open the demo meeting</Button>
            </Link>
          </div>
          <EmptyState
            title="More dashboard widgets are coming"
            description="Per the assignment, the home dashboard ships as a minimal placeholder; richer widgets are intentionally out of scope."
            className="mt-8"
          />
        </section>
      </main>
    </AppShell>
  );
}