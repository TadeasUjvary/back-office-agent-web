"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Bell, FileSearch, UserPlus, Presentation, BellRing, CalendarDays, Info, Check,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/cn";
import type { AppNotification, NotifTone } from "@/lib/notifications";

const READ_KEY = "bo-agent-notifs-read";

const TONE_ICON: Record<NotifTone, { icon: typeof Info; cls: string }> = {
  audit: { icon: FileSearch, cls: "text-orange" },
  lead: { icon: UserPlus, cls: "text-accent" },
  report: { icon: Presentation, cls: "text-accent" },
  briefing: { icon: BellRing, cls: "text-accent" },
  calendar: { icon: CalendarDays, cls: "text-cyan" },
  info: { icon: Info, cls: "text-text-muted" },
};

function loadRead(): Set<string> {
  try {
    const raw = localStorage.getItem(READ_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

export function NotificationsBell() {
  const { user } = useAuth();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [read, setRead] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setRead(loadRead());
  }, []);

  useEffect(() => {
    const headers: Record<string, string> = user
      ? { "x-user-id": encodeURIComponent(user) }
      : {};
    fetch("/api/notifications", { headers })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.notifications) setItems(d.notifications as AppNotification[]);
      })
      .catch(() => {});
  }, [user]);

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const unread = items.filter((n) => !read.has(n.id));
  const unreadCount = unread.length;

  const persist = (next: Set<string>) => {
    setRead(next);
    try {
      localStorage.setItem(READ_KEY, JSON.stringify([...next]));
    } catch {}
  };

  const markAllRead = () => persist(new Set(items.map((n) => n.id)));

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next && unreadCount > 0) {
      // Give the badge a beat to be seen, then clear
      window.setTimeout(markAllRead, 1200);
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={toggle}
        title="Upozornění"
        className={cn(
          "relative rounded-md p-1.5 text-text-faint transition-colors hover:bg-surface hover:text-text",
          open && "bg-surface text-text",
        )}
      >
        <Bell className={cn("size-4", unreadCount > 0 && "bell-wiggle text-text")} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex min-w-[15px] items-center justify-center rounded-full bg-rose px-1 text-[9px] font-semibold leading-[15px] text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="panel-in absolute left-0 top-full z-50 mt-2 w-[320px] overflow-hidden rounded-xl border border-border bg-surface lift">
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <p className="text-[12px] font-semibold tracking-tight text-text">Upozornění</p>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="inline-flex items-center gap-1 text-[11px] text-text-muted transition-colors hover:text-accent"
              >
                <Check className="size-3" /> Označit přečtené
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <p className="px-4 py-6 text-center text-[12px] text-text-muted">Žádná upozornění.</p>
          ) : (
            <ul className="max-h-[60vh] overflow-y-auto">
              {items.map((n) => {
                const { icon: Icon, cls } = TONE_ICON[n.tone];
                const isUnread = !read.has(n.id);
                return (
                  <li key={n.id}>
                    <Link
                      href={n.href}
                      onClick={() => {
                        persist(new Set([...read, n.id]));
                        setOpen(false);
                      }}
                      className="flex items-start gap-3 border-b border-border px-4 py-3 transition-colors last:border-b-0 hover:bg-surface-2"
                    >
                      <span className={cn("mt-0.5 shrink-0", cls)}>
                        <Icon className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5">
                          <span className="truncate text-[12.5px] font-medium tracking-tight text-text">
                            {n.title}
                          </span>
                          {isUnread && <span className="size-1.5 shrink-0 rounded-full bg-accent" />}
                        </span>
                        <span className="mt-0.5 block text-[11.5px] leading-snug text-text-muted">
                          {n.body}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
