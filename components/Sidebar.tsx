"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const NAV = [
  { href: "/", label: "Konverzace", num: "01" },
  { href: "/briefings", label: "Ranní briefingy", num: "02" },
  { href: "/data", label: "Datová vrstva", num: "03" },
  { href: "/integrations", label: "Integrace", num: "04" },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="flex w-72 shrink-0 flex-col border-r border-hairline bg-paper-deep">
      {/* Brand */}
      <div className="px-7 pt-9 pb-6">
        <p className="eyebrow">Reality Holding</p>
        <h1
          className="display mt-2 text-[26px] leading-[1.05] tracking-tight text-ink"
          style={{ fontVariationSettings: "'opsz' 144" }}
        >
          Back Office<br />
          <em className="not-italic text-copper">Agent</em>
        </h1>
        <div className="hairline mt-6" />
      </div>

      {/* Nav */}
      <nav className="px-3">
        {NAV.map((n) => {
          const active = pathname === n.href || (n.href !== "/" && pathname.startsWith(n.href));
          return (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                "group flex items-baseline gap-3 px-4 py-3 transition-colors",
                active
                  ? "bg-card text-ink"
                  : "text-ink-muted hover:bg-card/60 hover:text-ink",
              )}
            >
              <span
                className={cn(
                  "font-mono text-[11px] tabular-nums",
                  active ? "text-copper" : "text-ink-faint",
                )}
              >
                {n.num}
              </span>
              <span className="text-[14px] font-medium tracking-tight">{n.label}</span>
              {active && (
                <span className="ml-auto h-[1px] w-6 bg-copper" aria-hidden />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto px-7 pb-7 pt-6">
        <div className="hairline mb-6" />
        <p className="eyebrow mb-2">Status</p>
        <p className="text-xs leading-relaxed text-ink-muted">
          Demo · syntetická data ·{" "}
          <span className="font-mono text-[10px]">gemini-2.5-flash</span>
        </p>
        <p className="mt-1 text-xs text-ink-faint">
          <span className="font-mono">21</span> nástrojů · <span className="font-mono">5</span> integrací
        </p>
      </div>
    </aside>
  );
}
