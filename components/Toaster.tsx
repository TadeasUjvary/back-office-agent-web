"use client";
import { CheckCircle2, Info, AlertTriangle, X } from "lucide-react";
import { useToastStore, type ToastTone } from "@/lib/toast";
import { cn } from "@/lib/cn";

const TONE: Record<ToastTone, { icon: typeof Info; cls: string }> = {
  success: { icon: CheckCircle2, cls: "text-green" },
  info: { icon: Info, cls: "text-accent" },
  error: { icon: AlertTriangle, cls: "text-rose" },
};

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-50 flex w-[min(360px,calc(100vw-2.5rem))] flex-col gap-2">
      {toasts.map((t) => {
        const { icon: Icon, cls } = TONE[t.tone];
        return (
          <div
            key={t.id}
            className="toast-in pointer-events-auto flex items-start gap-3 rounded-xl border border-border bg-surface px-4 py-3 lift"
          >
            <Icon className={cn("mt-0.5 size-4 shrink-0", cls)} />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium tracking-tight text-text">{t.title}</p>
              {t.body && <p className="mt-0.5 text-[12px] leading-snug text-text-muted">{t.body}</p>}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className="-mr-1 -mt-0.5 rounded-md p-1 text-text-faint transition-colors hover:bg-surface-2 hover:text-text"
              aria-label="Zavřít"
            >
              <X className="size-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
