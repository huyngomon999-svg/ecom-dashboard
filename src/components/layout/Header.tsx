"use client";
import { Moon, Sun, Bell } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { isDark, toggle } = useTheme();

  return (
    <header className="sticky top-0 z-20 h-16 flex items-center gap-4 px-6 border-b bg-[var(--color-surface)] border-[var(--color-border)]">
      <div className="flex-1 min-w-0">
        <h1 className="text-lg font-semibold text-[var(--color-text)] leading-tight truncate">{title}</h1>
        {subtitle && (
          <p className="text-xs text-[var(--color-text-muted)] truncate">{subtitle}</p>
        )}
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={toggle}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)] transition-colors"
          title={isDark ? "Light mode" : "Dark mode"}
        >
          {isDark ? <Sun size={17} /> : <Moon size={17} />}
        </button>
        <button className="w-9 h-9 rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)] transition-colors relative">
          <Bell size={17} />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-[var(--color-danger)]" />
        </button>
      </div>
    </header>
  );
}
