import { AppShell } from "@/features/shell/app-shell";
import { TopBar } from "@/features/shell/top-bar";
import { EmptyState } from "@/components/ui/empty-state";

export default function ComingSoonPage() {
  return (
    <AppShell>
      <TopBar showSearch={false} />
      <main className="flex-1 px-8 py-8">
        <EmptyState
          title="Coming soon"
          description="This area is a placeholder for an upcoming feature."
        />
      </main>
    </AppShell>
  );
}