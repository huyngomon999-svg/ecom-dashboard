"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  TrendingUp,
  ShoppingCart,
  Megaphone,
  Package,
  Users,
  Activity,
  ChevronRight,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/revenue", label: "Doanh thu", icon: TrendingUp },
  { href: "/orders", label: "Đơn hàng", icon: ShoppingCart },
  { href: "/ads", label: "Ads & Marketing", icon: Megaphone },
  { href: "/products", label: "Sản phẩm", icon: Package },
  { href: "/customers", label: "Khách hàng", icon: Users },
  { href: "/traffic", label: "Traffic", icon: Activity },
];

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex flex-col h-screen sticky top-0 border-r transition-all duration-300",
        "bg-[var(--color-sidebar-bg)] border-[var(--color-sidebar-border)]",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo */}
      <div className={cn(
        "flex items-center gap-3 px-4 h-16 border-b border-[var(--color-sidebar-border)]",
        collapsed && "justify-center px-0"
      )}>
        <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)] flex items-center justify-center flex-shrink-0">
          <Zap size={16} className="text-white" />
        </div>
        {!collapsed && (
          <div>
            <p className="font-semibold text-sm text-[var(--color-text)] leading-tight">EcomReport</p>
            <p className="text-[10px] text-[var(--color-text-muted)]">Analytics Dashboard</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto">
        {!collapsed && (
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-subtle)]">
            Menu chính
          </p>
        )}
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                active
                  ? "bg-[var(--color-sidebar-active)] text-[var(--color-sidebar-active-text)]"
                  : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]",
                collapsed && "justify-center px-0 w-10 mx-auto"
              )}
            >
              <Icon
                size={18}
                className={cn(
                  "flex-shrink-0 transition-colors",
                  active ? "text-[var(--color-primary)]" : "text-[var(--color-text-muted)] group-hover:text-[var(--color-text)]"
                )}
              />
              {!collapsed && <span className="flex-1 truncate">{label}</span>}
              {!collapsed && active && (
                <ChevronRight size={14} className="text-[var(--color-primary)] opacity-60" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className={cn(
        "p-4 border-t border-[var(--color-sidebar-border)]",
        collapsed && "flex justify-center p-3"
      )}>
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] transition-colors"
        >
          <ChevronRight
            size={14}
            className={cn("transition-transform", collapsed ? "" : "rotate-180")}
          />
          {!collapsed && <span>Thu gọn</span>}
        </button>
      </div>
    </aside>
  );
}
