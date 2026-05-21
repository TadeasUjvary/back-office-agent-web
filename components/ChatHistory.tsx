"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { Plus, MessageSquare, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/cn";

type Conversation = {
  id: string;
  title: string | null;
  last_message_at: string;
  created_at: string;
};

function relTime(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return "teď";
  if (min < 60) return `${min} min`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} h`;
  const d = Math.floor(hr / 24);
  if (d < 7) return `${d} d`;
  return new Date(iso).toLocaleDateString("cs-CZ");
}

export function ChatHistory() {
  const { user, hydrated } = useAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeId = searchParams.get("c");
  const onChatPage = pathname === "/";
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch("/api/conversations", {
        headers: { "x-user-id": encodeURIComponent(user) },
      });
      const data = await res.json();
      setConvs(data.conversations ?? []);
    } catch {}
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => {
    if (hydrated && user) refresh();
  }, [hydrated, user, refresh]);

  // Re-fetch when active conversation changes (likely a new one)
  useEffect(() => {
    if (hydrated && user && activeId) refresh();
  }, [activeId, hydrated, user, refresh]);

  // Listen for cross-component refresh events
  useEffect(() => {
    const handler = () => refresh();
    window.addEventListener("bo-chat-refresh", handler);
    return () => window.removeEventListener("bo-chat-refresh", handler);
  }, [refresh]);

  const del = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Smazat tuto konverzaci?")) return;
    await fetch(`/api/conversations/${id}`, {
      method: "DELETE",
      headers: user ? { "x-user-id": encodeURIComponent(user) } : undefined,
    });
    setConvs((c) => c.filter((x) => x.id !== id));
    if (activeId === id) router.replace("/");
  };

  if (!hydrated || !user) return null;

  return (
    <div className="px-3 pb-3">
      <div className="flex items-center justify-between px-3 py-2">
        <p className="text-[10px] font-medium uppercase tracking-wider text-text-dim">
          Konverzace
        </p>
        <Link
          href="/"
          onClick={() => {
            // Force a fresh chat (clear ?c=)
            if (onChatPage && activeId) router.replace("/");
          }}
          className="rounded p-1 text-text-faint transition-colors hover:bg-surface hover:text-text"
          title="Nová konverzace"
        >
          <Plus className="size-3.5" />
        </Link>
      </div>
      {loading && convs.length === 0 ? (
        <p className="px-3 py-1 text-[11px] text-text-faint">načítám…</p>
      ) : convs.length === 0 ? (
        <p className="px-3 py-1 text-[11px] text-text-faint">Žádné konverzace</p>
      ) : (
        <ul className="max-h-[260px] overflow-y-auto">
          {convs.map((c) => {
            const active = activeId === c.id && onChatPage;
            const title = c.title?.trim() || "(bez názvu)";
            return (
              <li key={c.id}>
                <Link
                  href={`/?c=${c.id}`}
                  className={cn(
                    "group flex items-start gap-2 rounded-md px-3 py-1.5 transition-colors",
                    active
                      ? "bg-surface text-text"
                      : "text-text-muted hover:bg-surface/60 hover:text-text",
                  )}
                >
                  <MessageSquare className={cn("mt-0.5 size-3 shrink-0", active ? "text-accent-bright" : "text-text-dim")} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px]">{title}</p>
                    <p className="font-mono text-[9px] text-text-faint">{relTime(c.last_message_at)}</p>
                  </div>
                  <button
                    onClick={(e) => del(c.id, e)}
                    title="Smazat"
                    className="opacity-0 transition-opacity group-hover:opacity-100 text-text-dim hover:text-rose"
                  >
                    <Trash2 className="size-3" />
                  </button>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
