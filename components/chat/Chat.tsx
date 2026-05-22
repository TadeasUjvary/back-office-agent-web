"use client";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import {
  ArrowUp, Sparkles, User, Bot, Wrench, BarChart3, Mail, FileSearch,
  Presentation, BellRing, Paperclip, Globe, X, Loader2, Mic, Check,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Switch";
import { ToolPart } from "./ToolPart";
import { cn } from "@/lib/cn";
import { useAttachmentStore } from "@/lib/attachment-store";
import { useSpeechRecognition } from "@/lib/useSpeechRecognition";

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

const WEBSEARCH_KEY = "bo-agent-websearch";

export function Chat() {
  const { user } = useAuth();

  const [webSearch, setWebSearchState] = useState(false);
  const webSearchRef = useRef(false);

  // Setter — updates ref SYNCHRONOUSLY so it's never out of sync with UI
  const setWebSearch = useCallback((v: boolean) => {
    webSearchRef.current = v;
    setWebSearchState(v);
    try { localStorage.setItem(WEBSEARCH_KEY, String(v)); } catch {}
  }, []);

  // Restore from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(WEBSEARCH_KEY);
      if (stored === "true") {
        webSearchRef.current = true;
        setWebSearchState(true);
      }
    } catch {}
  }, []);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        headers: (): Record<string, string> =>
          user ? { "x-user-id": encodeURIComponent(user) } : {},
        prepareSendMessagesRequest: ({ messages, body }) => ({
          body: { ...body, messages, webSearch: webSearchRef.current },
        }),
      }),
    [user],
  );

  // Load single user conversation history on mount
  const [initialMessages, setInitialMessages] = useState<UIMessage[] | undefined>(undefined);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoadingHistory(false);
      return;
    }
    setLoadingHistory(true);
    fetch("/api/conversation", {
      headers: { "x-user-id": encodeURIComponent(user) },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data?.messages) {
          setInitialMessages([]);
          return;
        }
        const restored: UIMessage[] = data.messages.map((m: { id: string; role: string; parts: unknown[] }) => ({
          id: m.id,
          role: m.role as UIMessage["role"],
          parts: m.parts as never,
        }));
        setInitialMessages(restored);
      })
      .catch(() => setInitialMessages([]))
      .finally(() => setLoadingHistory(false));
  }, [user]);

  const { messages, sendMessage, status, error, setMessages } = useChat({
    transport,
    messages: initialMessages,
  });

  // Hydrate messages when history arrives
  useEffect(() => {
    if (initialMessages && initialMessages.length > 0) {
      setMessages(initialMessages);
    }
  }, [initialMessages, setMessages]);

  // Wipe history button handler — exposed via window event from Sidebar
  useEffect(() => {
    const wipe = () => setMessages([]);
    window.addEventListener("bo-chat-wipe", wipe);
    return () => window.removeEventListener("bo-chat-wipe", wipe);
  }, [setMessages]);

  const [input, setInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  // Prefill from ?q= (quick actions on the dashboard link here)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q");
    if (q) {
      setInput(q);
      // Clean the URL so reload doesn't re-fill
      window.history.replaceState(null, "", "/");
    }
  }, []);

  const attachments = useAttachmentStore((s) => s.attachments);
  const addAttachment = useAttachmentStore((s) => s.add);
  const removeAttachment = useAttachmentStore((s) => s.remove);
  const clearAttachments = useAttachmentStore((s) => s.clear);

  // Voice input (Web Speech API, cs-CZ)
  const {
    supported: micSupported,
    listening,
    error: micError,
    start: startMic,
  } = useSpeechRecognition({
    lang: "cs-CZ",
    onInterim: (t) => setInput(t),
    onFinal: (t) => setInput(t),
  });

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

  const submit = async (text: string) => {
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
      <header className="flex shrink-0 items-center gap-2.5 border-b border-border bg-bg/80 px-8 py-4 backdrop-blur-sm">
        <Wrench className="size-3.5 text-text-faint" />
        <h2 className="text-[13px] font-medium tracking-tight text-text">
          Asistent
        </h2>
      </header>

      <div className="flex-1 overflow-y-auto px-8 py-8">
        {loadingHistory ? (
          <div className="mx-auto max-w-3xl space-y-3 pt-8 animate-pulse">
            <div className="h-4 w-2/3 rounded bg-surface-2" />
            <div className="h-4 w-3/4 rounded bg-surface-2" />
            <div className="h-32 w-full rounded-lg bg-surface-2" />
          </div>
        ) : messages.length === 0 ? (
          <Welcome onPick={submit} userName={user} />
        ) : (
          <div className="mx-auto max-w-3xl space-y-8">
            {messages.map((m, i) => (
              <MessageBubble
                key={m.id}
                message={m}
                streaming={status === "streaming" && i === messages.length - 1}
              />
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
            {/* Empty-stop hint */}
            {(() => {
              if (status !== "ready" || messages.length === 0) return null;
              const last = messages[messages.length - 1];
              if (last.role !== "assistant") return null;
              const hasContent = last.parts.some((p) => {
                if (p.type === "text") return ((p as { text?: string }).text ?? "").trim().length > 0;
                if (typeof p.type === "string" && p.type.startsWith("tool-")) return true;
                return false;
              });
              if (hasContent) return null;
              return (
                <div className="rounded-lg border border-warn/30 bg-warn-soft px-4 py-3 text-[13px] text-warn">
                  Agent neodpověděl — zkuste přeformulovat dotaz, nebo zkontrolujte limit Gemini API. (Empty stop)
                </div>
              );
            })()}
            {/* Follow-up suggestion chips */}
            {status === "ready" && (
              <FollowupChips messages={messages} onPick={submit} />
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
          {/* Web search toggle — always visible, min height to prevent collapse */}
          <div className="mb-2 flex min-h-[28px] flex-wrap items-center justify-between gap-2 px-1">
            <label className="flex shrink-0 items-center gap-2.5 cursor-pointer">
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

          <div className={cn(
            "flex items-center gap-2 rounded-xl border bg-surface px-3 py-2 transition-colors",
            listening
              ? "border-rose shadow-[0_0_0_3px_rgba(225,29,72,0.18)]"
              : "border-border-strong focus-within:border-accent focus-within:shadow-[0_0_0_3px_rgba(37,99,235,0.18)]",
          )}>
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

            {/* Voice input button */}
            {micSupported && (
              <button
                type="button"
                onClick={startMic}
                disabled={busy}
                title={listening ? "Poslouchám… klikněte pro zastavení" : "Diktovat hlasem"}
                className={cn(
                  "relative rounded-md p-1.5 transition-colors disabled:opacity-50",
                  listening
                    ? "bg-rose/10 text-rose"
                    : "text-text-faint hover:bg-surface-2 hover:text-text",
                )}
              >
                {listening && (
                  <span className="absolute inset-0 -z-10 animate-ping rounded-md bg-rose/30" />
                )}
                <Mic className="size-4" />
              </button>
            )}

            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={busy}
              placeholder={
                listening
                  ? "Poslouchám… mluvte"
                  : "Napište co potřebujete vyřešit…  (např. „Najdi byty 2+kk v Karlíně do 8 mil.“)"
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
          {micError && (
            <p className="mt-1.5 px-1 text-[11px] text-rose">{micError}</p>
          )}
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

function Welcome({ onPick, userName }: { onPick: (text: string) => void; userName?: string | null }) {
  const firstName = (userName ?? "").trim().split(/\s+/)[0] || null;
  return (
    <div className="mx-auto max-w-3xl pt-12">
      <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-border-strong bg-surface-2 px-3 py-1 text-[11px] text-text-muted">
        <span className="inline-block size-1.5 rounded-full bg-green animate-pulse" />
        Reality Holding · interní pracovní prostředí
      </div>
      <h1 className="text-[40px] font-semibold leading-[1.05] tracking-[-0.025em] text-text">
        {firstName ? `Dobrý den, ${firstName}.` : "Dobrý den."}
      </h1>
      <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-text-muted">
        Co dnes potřebujete vyřešit? Můžu projít leady, prohledat databázi nemovitostí,
        připravit report pro vedení, naplánovat schůzku, nebo se podívat ven na trh.
        Stačí napsat.
      </p>

      <div className="mt-10 mb-3 flex items-center gap-2">
        <p className="text-[11px] font-medium uppercase tracking-wider text-text-faint">
          Časté úkoly
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

// Friendly noun labels for the thinking timeline
const TOOL_STEP_LABELS: Record<string, string> = {
  getNewClients: "Klienti dle zdroje",
  getLeadsAndSalesTrend: "Trend leadů a prodejů",
  proposeViewingSlots: "Volné termíny + e-mail",
  auditMissingRenovationData: "Audit chybějících dat",
  weeklyReport: "Manažerský report",
  setupMarketMonitoring: "Nastavení monitoringu",
  listAgents: "Seznam makléřů",
  queryProperties: "Dotaz nad nemovitostmi",
  queryLeads: "Dotaz nad leady",
  queryClients: "Dotaz nad klienty",
  querySales: "Agregace prodejů",
  getPropertyDetail: "Detail nemovitosti",
  getAgentDetail: "Profil makléře",
  getLeadFunnel: "Konverzní trychtýř",
  comparePeriods: "Srovnání období",
  getCalendar: "Čtení kalendáře",
  addCalendarEvent: "Zápis do kalendáře",
  renderChart: "Vykreslení grafu",
  exportData: "Generování souboru",
  sendEmail: "Odeslání e-mailu",
  logCRMNote: "Zápis do CRM",
  urgeAgent: "Urgence makléři",
  exportToSheet: "Export do Sheets",
  fetchUrl: "Načtení webu",
  webSearch: "Hledání na webu",
};

function ThinkingSteps({ message }: { message: Msg }) {
  const steps = message.parts
    .filter((p) => typeof p.type === "string" && p.type.startsWith("tool-"))
    .map((p) => {
      const name = (p.type as string).replace(/^tool-/, "");
      const state = (p as { state?: string }).state;
      const done = state === "output-available" || state === "output-error";
      return { name, label: TOOL_STEP_LABELS[name] ?? name, done };
    });
  if (steps.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-lg border border-border bg-surface-2/50 px-3 py-2">
      {steps.map((s, i) => (
        <span key={i} className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider">
          {s.done ? (
            <Check className="size-3 text-green" />
          ) : (
            <Loader2 className="size-3 animate-spin text-accent" />
          )}
          <span className={s.done ? "text-text-muted" : "text-text"}>{s.label}</span>
        </span>
      ))}
    </div>
  );
}

function MessageBubble({ message, streaming }: { message: Msg; streaming?: boolean }) {
  const isUser = message.role === "user";
  const hasTools = message.parts.some((p) => typeof p.type === "string" && p.type.startsWith("tool-"));
  return (
    <div className={cn("flex gap-3", isUser && "flex-row-reverse")}>
      <div
        className={cn(
          "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md",
          isUser
            ? "bg-surface-3 text-text-2"
            : "bg-gradient-to-br from-deep to-accent text-white shadow-[0_0_0_1px_rgba(37,99,235,0.4),0_0_18px_rgba(37,99,235,0.25)]",
        )}
      >
        {isUser ? <User className="size-3.5" /> : <Bot className="size-3.5" />}
      </div>
      <div className={cn("min-w-0 flex-1 space-y-3", isUser && "flex flex-col items-end")}>
        {/* Thinking timeline (assistant, when it used tools) */}
        {!isUser && hasTools && <ThinkingSteps message={message} />}
        {message.parts.map((part, idx) => {
          if (part.type === "text") {
            const text = (part as { text: string }).text;
            const cleaned = isUser ? cleanUserText(text) : text;
            if (!cleaned.trim()) return null;
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
        {streaming && (
          <div className="flex items-center gap-2 text-[11px] text-text-faint">
            <Pulse /> píšu odpověď…
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Follow-up suggestion chips ─────────────────────────────────────────
const FOLLOWUP_BY_TOOL: Record<string, { label: string; prompt: string }[]> = {
  getNewClients: [
    { label: "A co Q2?", prompt: "A co Q2?" },
    { label: "Vyexportovat do Excelu", prompt: "Vyexportuj ta data do Excelu." },
  ],
  auditMissingRenovationData: [
    { label: "Poslat urgenci makléřům", prompt: "Pošli urgenci makléřům s nejvíce chybějícími daty." },
    { label: "Vyexportovat do PDF", prompt: "Vyexportuj ten audit do PDF." },
  ],
  weeklyReport: [
    { label: "Měsíční místo týdne", prompt: "Připrav to samé jako měsíční report s 5 slidy." },
    { label: "Stáhnout jako PDF", prompt: "Vyexportuj report do PDF." },
  ],
  listAgents: [
    { label: "Graf prodejů per makléř", prompt: "Vykresli koláčový graf prodejů per makléř." },
    { label: "Detail nejlepšího", prompt: "Ukaž detail nejlepšího makléře." },
  ],
  querySales: [
    { label: "Graf dle lokality", prompt: "Vykresli graf objemu prodejů podle lokality." },
    { label: "Do Excelu", prompt: "Vyexportuj tyto prodeje do Excelu." },
  ],
  queryProperties: [
    { label: "Do Excelu", prompt: "Vyexportuj tento výběr do Excelu." },
    { label: "Průměrná cena", prompt: "Jaká je průměrná cena tohoto výběru?" },
  ],
  getLeadsAndSalesTrend: [
    { label: "Srovnat kvartály", prompt: "Porovnej tento a minulý kvartál v objemu prodejů." },
  ],
  proposeViewingSlots: [
    { label: "Naplánovat do kalendáře", prompt: "Naplánuj první navržený termín do kalendáře." },
  ],
  renderChart: [
    { label: "Stáhnout graf jako PDF", prompt: "Vyexportuj poslední data do PDF." },
  ],
  webSearch: [
    { label: "Shrň to do 3 bodů", prompt: "Shrň zjištěné do tří odrážek." },
  ],
};

const GENERIC_FOLLOWUPS = [
  { label: "Týdenní report", prompt: "Připrav týdenní report pro vedení." },
  { label: "Audit dat", prompt: "Najdi nemovitosti bez dat o rekonstrukci." },
];

function FollowupChips({ messages, onPick }: { messages: Msg[]; onPick: (t: string) => void }) {
  const last = messages[messages.length - 1];
  if (!last || last.role !== "assistant") return null;

  // Find the last tool used in the final assistant message
  const toolNames = last.parts
    .filter((p) => typeof p.type === "string" && p.type.startsWith("tool-"))
    .map((p) => (p.type as string).replace(/^tool-/, ""));
  const lastTool = toolNames[toolNames.length - 1];
  const chips = (lastTool && FOLLOWUP_BY_TOOL[lastTool]) || GENERIC_FOLLOWUPS;

  return (
    <div className="flex flex-wrap gap-2 pl-10">
      {chips.map((c, i) => (
        <button
          key={i}
          onClick={() => onPick(c.prompt)}
          className="rounded-full border border-border-strong bg-surface px-3 py-1.5 text-[12px] text-text-2 transition-colors hover:border-accent hover:text-accent"
        >
          {c.label}
        </button>
      ))}
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
