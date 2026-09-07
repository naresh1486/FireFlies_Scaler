import { AppShell } from "@/features/shell/app-shell";
import { TopBar } from "@/features/shell/top-bar";
import { EmptyState } from "@/components/ui/empty-state";

export default function SettingsPage() {
  return (
    <AppShell>
      <TopBar pageTitle="Settings" showSearch={false} />
      <main className="flex-1 px-8 py-8">
        <EmptyState
          title="Settings"
          description="The settings experience is not implemented in this demo."
        />
      </main>
    </AppShell>
  );
}