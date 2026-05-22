"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, BellRing, Database, Plug, Calendar, LogOut, Trash2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { useAuth } from "@/lib/auth";
import { Mascot } from "./Mascot";

const NAV = [
  { href: "/", label: "Konverzace", icon: MessageSquare, shortcut: "1" },
  { href: "/calendar", label: "Kalendář", icon: Calendar, shortcut: "2" },
  { href: "/briefings", label: "Ranní briefingy", icon: BellRing, shortcut: "3" },
  { href: "/data", label: "Datová vrstva", icon: Database, shortcut: "4" },
  { href: "/integrations", label: "Integrace", icon: Plug, shortcut: "5" },
];

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? "?") + (parts[1]?.[0] ?? "");
}

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const wipeHistory = async () => {
    if (!user) return;
    if (!confirm("Vymazat celou historii konverzace?")) return;
    try {
      await fetch("/api/conversation", {
        method: "DELETE",
        headers: { "x-user-id": encodeURIComponent(user) },
      });
      window.dispatchEvent(new CustomEvent("bo-chat-wipe"));
    } catch (e) {
      alert("Mazání selhalo: " + (e instanceof Error ? e.message : "neznámá chyba"));
    }
  };

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-bg-2">
      {/* Brand */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5">
          <Mascot size={32} />
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold tracking-tight text-text">
              Reality Holding
            </p>
            <p className="truncate text-[11px] text-text-faint">Back office agent</p>
          </div>
        </div>
      </div>

      <div className="px-3">
        <p className="px-3 py-2 text-[10px] font-medium uppercase tracking-wider text-text-dim">
          Workspace
        </p>
      </div>

      {/* Nav */}
      <nav className="px-3">
        {NAV.map((n) => {
          const active = pathname === n.href || (n.href !== "/" && pathname.startsWith(n.href));
          const Icon = n.icon;
          return (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                "group flex items-center gap-2.5 rounded-md px-3 py-1.5 text-[13px] transition-colors",
                active
                  ? "bg-surface text-text"
                  : "text-text-muted hover:bg-surface/60 hover:text-text",
              )}
            >
              <Icon className={cn("size-4 shrink-0", active ? "text-accent-bright" : "text-text-dim")} />
              <span className="flex-1 truncate">{n.label}</span>
              <span className="hidden font-mono text-[10px] text-text-dim group-hover:inline">
                ⌘{n.shortcut}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Wipe chat history button — only shown on chat page */}
      {pathname === "/" && (
        <div className="mt-2 px-3">
          <button
            onClick={wipeHistory}
            className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-[12px] text-text-faint transition-colors hover:bg-surface/60 hover:text-rose"
            title="Smaže historii a začne novou konverzaci"
          >
            <Trash2 className="size-3" />
            Vymazat historii
          </button>
        </div>
      )}

      {/* User pill */}
      {user && (
        <div className="mt-auto border-t border-border px-3 py-3">
          <div className="flex items-center gap-2.5 rounded-lg border border-border bg-surface/60 p-2">
            <div className="flex size-7 items-center justify-center rounded-full bg-gradient-to-br from-deep to-accent text-[11px] font-semibold uppercase text-accent-bright">
              {initials(user)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] font-medium text-text">{user}</p>
              <p className="truncate font-mono text-[10px] text-text-faint">přihlášen</p>
            </div>
            <button
              onClick={logout}
              title="Odhlásit"
              className="rounded-md p-1.5 text-text-faint transition-colors hover:bg-surface-2 hover:text-text"
            >
              <LogOut className="size-3.5" />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
