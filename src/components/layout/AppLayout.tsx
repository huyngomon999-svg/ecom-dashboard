"use client";
import { useState } from "react";
import { Sidebar } from "./Sidebar";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-[var(--color-bg)]">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((p) => !p)} />
      <main className="flex-1 min-w-0 overflow-auto">{children}</main>
    </div>
  );
}
