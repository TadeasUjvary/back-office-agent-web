"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, BellRing, Database, Sparkles, Plug } from "lucide-react";
import { cn } from "@/lib/cn";

const NAV = [
  { href: "/", label: "Chat", icon: MessageSquare },
  { href: "/briefings", label: "Ranní briefingy", icon: BellRing },
  { href: "/data", label: "Datová vrstva", icon: Database },
  { href: "/integrations", label: "Integrace", icon: Plug },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-zinc-200 bg-zinc-50/60">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
          <Sparkles className="size-4" />
        </div>
        <div>
          <p className="text-sm font-semibold text-zinc-900">Back Office Agent</p>
          <p className="text-xs text-zinc-500">Reality Holding</p>
        </div>
      </div>
      <nav className="flex-1 px-3">
        {NAV.map((n) => {
          const Active = pathname === n.href || (n.href !== "/" && pathname.startsWith(n.href));
          const Icon = n.icon;
          return (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                "mb-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                Active
                  ? "bg-white font-medium text-zinc-900 shadow-sm"
                  : "text-zinc-600 hover:bg-white/60 hover:text-zinc-900",
              )}
            >
              <Icon className="size-4" />
              {n.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-zinc-200 px-5 py-4">
        <p className="text-xs text-zinc-500">
          Demo · synthetic data · Gemini 2.5 Flash via Vercel AI SDK
        </p>
      </div>
    </aside>
  );
}
