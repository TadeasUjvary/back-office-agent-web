"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, BellRing, Database, Plug, Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";

const NAV = [
  { href: "/", label: "Konverzace", icon: MessageSquare, shortcut: "1" },
  { href: "/briefings", label: "Ranní briefingy", icon: BellRing, shortcut: "2" },
  { href: "/data", label: "Datová vrstva", icon: Database, shortcut: "3" },
  { href: "/integrations", label: "Integrace", icon: Plug, shortcut: "4" },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-bg-2">
      {/* Brand */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5">
          <div className="relative flex size-7 items-center justify-center rounded-md bg-gradient-to-br from-accent to-accent-bright">
            <Sparkles className="size-3.5 text-white" />
            <div className="absolute -inset-0.5 -z-10 rounded-md bg-accent/30 blur" />
          </div>
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

      <div className="mt-auto px-3 pb-4">
        <div className="rounded-lg border border-border bg-surface/60 p-3">
          <div className="flex items-center gap-2">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-green" />
            </span>
            <p className="text-[11px] font-medium text-text-2">Agent online</p>
          </div>
          <p className="mt-1.5 font-mono text-[10px] text-text-faint">
            gemini-2.5-flash
          </p>
          <div className="mt-3 flex items-center gap-3 text-[10px] text-text-faint">
            <span><span className="text-text-2 font-mono">21</span> nástrojů</span>
            <span className="size-0.5 rounded-full bg-text-dim" />
            <span><span className="text-text-2 font-mono">5</span> integrací</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
