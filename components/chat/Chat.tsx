"use client";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState, useRef, useEffect, useMemo } from "react";
import {
  ArrowUp, Sparkles, User, Bot, Wrench, BarChart3, Mail, FileSearch,
  Presentation, BellRing, Paperclip, Globe, X, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Switch";
import { ToolPart } from "./ToolPart";
import { cn } from "@/lib/cn";
import { useAttachmentStore } from "@/lib/attachment-store";

type Suggestion = {
  icon: typeof Sparkles;
  cat: string;
  label: string;
  text: string;
};

const SUGGESTED_PROMPTS: Suggestion[] = [
  { icon: BarChart3, cat: "Reporting", label: "Q1 2026 — klienti dle zdroje",
    text: "Jaké nové klienty máme za 1. kvartál 2026? Odkud přišli? Můžeš to znázornit graficky?" },
  { icon: BarChart3, cat: "Reporting", label: "Trend leadů & prodejů, 6M",
    text: "Vytvoř graf vývoje počtu leadů a prodaných nemovitostí za posledních 6 měsíců." },
  { icon: Mail, cat: "Operations", label: "Termín prohlídky — RH-1042",
    text: "Napiš e-mail pro zájemce o nemovitost RH-1042 a doporuč mu termín prohlídky na základě mé dostupnosti v kalendáři." },
  { icon: FileSearch, cat: "Operations", label: "Audit chybějících dat",
    text: "Najdi nemovitosti, u kterých nám v systému chybí data o rekonstrukci a stavebních úpravách a připrav jejich seznam k doplnění." },
  { icon: Presentation, cat: "Executive", label: "Týdenní report + 3 slidy",
    text: "Shrň výsledky minulého týdne do krátkého reportu pro vedení a připrav k tomu prezentaci se třemi slidy." },
  { icon: BellRing, cat: "Monitoring", label: "Ranní briefing — Holešovice",
    text: "Sleduj všechny hlavní realitní servery a každé ráno mě informuj o nových nabídkách v lokalitě Praha-Holešovice." },
];

function fmtBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} kB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export function Chat() {
  const [webSearch, setWebSearch] = useState(false);
  const webSearchRef = useRef(false);
  useEffect(() => { webSearchRef.current = webSearch; }, [webSearch]);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        prepareSendMessagesRequest: ({ messages, body }) => ({
          body: { ...body, messages, webSearch: webSearchRef.current },
        }),
      }),
    [],
  );

  const { messages, sendMessage, status, error } = useChat({ transport });

  const [input, setInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const attachments = useAttachmentStore((s) => s.attachments);
  const addAttachment = useAttachmentStore((s) => s.add);
  const removeAttachment = useAttachmentStore((s) => s.remove);
  const clearAttachments = useAttachmentStore((s) => s.clear);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const onPickFile = async (file: File) => {
    setUploadError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/extract", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Extract failed");
      addAttachment({
        filename: data.filename,
        mimeType: data.mimeType,
        sizeBytes: data.sizeBytes,
        text: data.text,
        truncated: data.truncated,
      });
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Chyba při uploadu");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const submit = (text: string) => {
    if (!text.trim() && attachments.length === 0) return;
    let finalText = text.trim();
    if (attachments.length > 0) {
      const ctx = attachments
        .map((a) => `[Příloha: ${a.filename} (${a.mimeType}, ${fmtBytes(a.sizeBytes)})]\n${a.text}`)
        .join("\n\n———\n\n");
      finalText = `${ctx}\n\n———\n\n[Otázka uživatele:]\n${finalText || "(prosím shrň přílohu)"}`;
    }
    sendMessage({ text: finalText });
    setInput("");
    clearAttachments();
  };

  const busy = status === "submitted" || status === "streaming";

  return (
    <div className="flex h-full flex-col bg-bg">
      <header className="flex shrink-0 items-center justify-between border-b border-border bg-bg/80 px-8 py-4 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <Wrench className="size-3.5 text-text-faint" />
          <h2 className="text-[13px] font-medium tracking-tight text-text">
            Konverzace s agentem
          </h2>
        </div>
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-text-faint">
          <span className="inline-block size-1.5 rounded-full bg-green" />
          gemini-2.5-flash
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-8 py-8">
        {messages.length === 0 ? (
          <Welcome onPick={submit} />
        ) : (
          <div className="mx-auto max-w-3xl space-y-8">
            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} />
            ))}
            {status === "submitted" && (
              <div className="flex items-center gap-3 pl-12 text-[12px] text-text-muted">
                <Pulse />
                Agent přemýšlí…
              </div>
            )}
            {error && (
              <div className="rounded-lg border border-rose/30 bg-[rgba(244,63,94,0.08)] px-4 py-3 text-sm text-rose">
                Chyba: {error.message}
              </div>
            )}
            <div ref={endRef} />
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="border-t border-border bg-bg-2/60 px-8 py-4">
        <form
          className="mx-auto max-w-3xl"
          onSubmit={(e) => {
            e.preventDefault();
            submit(input);
          }}
        >
          {/* Web search toggle */}
          <div className="mb-2 flex items-center justify-between px-1">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <Switch
                checked={webSearch}
                onChange={setWebSearch}
                label="Hledat na internetu"
              />
              <Globe className={cn("size-3.5", webSearch ? "text-accent-bright" : "text-text-faint")} />
              <span className={cn(
                "text-[12px] tracking-tight transition-colors",
                webSearch ? "text-text" : "text-text-muted",
              )}>
                Hledat na internetu
              </span>
              {webSearch && (
                <span className="font-mono text-[9px] uppercase tracking-wider text-accent-bright">
                  · zapnuto
                </span>
              )}
            </label>
            <p className="font-mono text-[10px] text-text-faint">
              {attachments.length > 0 && <span>{attachments.length} {attachments.length === 1 ? "příloha" : "přílohy"}</span>}
            </p>
          </div>

          {/* Attachment chips */}
          {(attachments.length > 0 || uploadError) && (
            <div className="mb-2 space-y-1.5">
              {attachments.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center gap-2 rounded-md border border-border-strong bg-surface px-3 py-1.5 text-[12px]"
                >
                  <Paperclip className="size-3 text-accent-bright" />
                  <span className="truncate text-text">{a.filename}</span>
                  <span className="font-mono text-[10px] text-text-faint">
                    {fmtBytes(a.sizeBytes)}{a.truncated && " · zkráceno"}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeAttachment(a.id)}
                    className="ml-auto text-text-faint hover:text-rose"
                    aria-label="Odebrat přílohu"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ))}
              {uploadError && (
                <div className="rounded-md border border-rose/30 bg-[rgba(244,63,94,0.08)] px-3 py-1.5 text-[12px] text-rose">
                  {uploadError}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 rounded-xl border border-border-strong bg-surface px-3 py-2 transition-colors focus-within:border-accent focus-within:shadow-[0_0_0_3px_rgba(94,106,210,0.18)]">
            {/* File upload button */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.csv,.txt,.xlsx,.xls,.md,application/pdf,text/csv,text/plain,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onPickFile(f);
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || busy}
              title="Nahrát soubor (PDF, XLSX, CSV, TXT)"
              className="rounded-md p-1.5 text-text-faint transition-colors hover:bg-surface-2 hover:text-text disabled:opacity-50"
            >
              {uploading ? <Loader2 className="size-4 animate-spin" /> : <Paperclip className="size-4" />}
            </button>

            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={busy}
              placeholder={
                "Napište zprávu agentovi…  (např. „Najdi byty 2+kk v Karlíně do 8 mil.“)"
              }
              className="flex-1 bg-transparent px-1 text-[14px] outline-none placeholder:text-text-faint disabled:opacity-50"
            />
            <Button
              type="submit"
              disabled={(!input.trim() && attachments.length === 0) || busy}
              className="rounded-md"
            >
              <ArrowUp className="size-3.5" />
            </Button>
          </div>
          <p className="mt-2 px-1 font-mono text-[10px] text-text-faint">
            Enter pro odeslání · sponka pro PDF/XLSX/CSV/TXT (max 5 MB)
          </p>
        </form>
      </div>
    </div>
  );
}

function Pulse() {
  return (
    <span className="relative inline-flex size-2 items-center justify-center">
      <span className="absolute inline-flex size-2 animate-ping rounded-full bg-accent opacity-70" />
      <span className="relative inline-flex size-1.5 rounded-full bg-accent" />
    </span>
  );
}

function Welcome({ onPick }: { onPick: (text: string) => void }) {
  return (
    <div className="mx-auto max-w-3xl pt-12">
      <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-border-strong bg-surface-2 px-3 py-1 text-[11px] text-text-muted">
        <span className="inline-block size-1.5 rounded-full bg-green animate-pulse" />
        Demo · syntetická data · seed=42
      </div>
      <h1 className="text-[40px] font-semibold leading-[1.05] tracking-[-0.025em] text-text">
        Co potřebuje Pepa?
      </h1>
      <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-text-muted">
        Ptám se vašich dat za vás. Klienti, leady, kalendář, audity, ranní briefingy
        — vše skrz volání nástrojů nad mockovanými integracemi Google Workspace a interním CRM.
        Žádné odhady, žádné halucinace. Můžete mi nahrát vlastní soubor přes sponku,
        nebo zapnout vyhledávání na internetu.
      </p>

      <div className="mt-10 mb-3 flex items-center gap-2">
        <p className="text-[11px] font-medium uppercase tracking-wider text-text-faint">
          Sugerované dotazy
        </p>
        <span className="h-px flex-1 bg-border" />
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {SUGGESTED_PROMPTS.map((p, i) => {
          const Icon = p.icon;
          return (
            <button
              key={i}
              onClick={() => onPick(p.text)}
              className="group flex items-start gap-3 rounded-lg border border-border bg-surface/60 p-3 text-left transition-colors hover:border-border-bright hover:bg-surface"
            >
              <Icon className="mt-0.5 size-4 shrink-0 text-text-faint group-hover:text-accent-bright" />
              <div className="min-w-0 flex-1">
                <p className="font-mono text-[9px] uppercase tracking-wider text-text-dim">
                  {p.cat}
                </p>
                <p className="mt-0.5 text-[13px] tracking-tight text-text group-hover:text-text">
                  {p.label}
                </p>
              </div>
              <span className="opacity-0 transition-opacity group-hover:opacity-100 text-text-faint">
                →
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

type Msg = ReturnType<typeof useChat>["messages"][number];

function MessageBubble({ message }: { message: Msg }) {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex gap-3", isUser && "flex-row-reverse")}>
      <div
        className={cn(
          "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md",
          isUser
            ? "bg-surface-3 text-text-2"
            : "bg-gradient-to-br from-accent to-accent-bright text-white shadow-[0_0_0_1px_rgba(94,106,210,0.4),0_0_18px_rgba(94,106,210,0.3)]",
        )}
      >
        {isUser ? <User className="size-3.5" /> : <Bot className="size-3.5" />}
      </div>
      <div className={cn("min-w-0 flex-1 space-y-3", isUser && "flex flex-col items-end")}>
        {message.parts.map((part, idx) => {
          if (part.type === "text") {
            const text = (part as { text: string }).text;
            const cleaned = isUser ? cleanUserText(text) : text;
            return (
              <div
                key={idx}
                className={cn(
                  "max-w-full whitespace-pre-wrap text-[14px] leading-relaxed",
                  isUser
                    ? "rounded-2xl rounded-tr-md bg-surface-2 px-4 py-2.5 text-text"
                    : "text-text-2",
                )}
              >
                {cleaned}
              </div>
            );
          }
          if (typeof part.type === "string" && part.type.startsWith("tool-")) {
            return <ToolPart key={idx} part={part as never} />;
          }
          return null;
        })}
      </div>
    </div>
  );
}

/** Strip injected attachment context from user message rendering — keep raw question only. */
function cleanUserText(text: string): string {
  const marker = "[Otázka uživatele:]";
  const idx = text.lastIndexOf(marker);
  if (idx === -1) return text;
  return text.slice(idx + marker.length).trim();
}
