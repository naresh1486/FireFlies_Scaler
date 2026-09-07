"use client";

import { DesktopIconRail, MobileIconRail } from "@/features/shell/icon-rail";

export function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-canvas">
      <DesktopIconRail />
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      <MobileIconRail />
    </div>
  );
}