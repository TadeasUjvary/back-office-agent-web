"use client";
import { useChat } from "@ai-sdk/react";
import { useState, useRef, useEffect } from "react";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ToolPart } from "./ToolPart";
import { cn } from "@/lib/cn";

const SUGGESTED_PROMPTS = [
  {
    cat: "Reporting",
    label: "Q1 2026 — klienti dle zdroje",
    text: "Jaké nové klienty máme za 1. kvartál 2026? Odkud přišli? Můžeš to znázornit graficky?",
  },
  {
    cat: "Reporting",
    label: "Trend leadů & prodejů, 6M",
    text: "Vytvoř graf vývoje počtu leadů a prodaných nemovitostí za posledních 6 měsíců.",
  },
  {
    cat: "Operations",
    label: "Termín prohlídky — RH-1042",
    text: "Napiš e-mail pro zájemce o nemovitost RH-1042 a doporuč mu termín prohlídky na základě mé dostupnosti v kalendáři.",
  },
  {
    cat: "Operations",
    label: "Audit chybějících dat",
    text: "Najdi nemovitosti, u kterých nám v systému chybí data o rekonstrukci a stavebních úpravách a připrav jejich seznam k doplnění.",
  },
  {
    cat: "Executive",
    label: "Týdenní report + 3 slidy",
    text: "Shrň výsledky minulého týdne do krátkého reportu pro vedení a připrav k tomu prezentaci se třemi slidy.",
  },
  {
    cat: "Monitoring",
    label: "Ranní briefing — Holešovice",
    text: "Sleduj všechny hlavní realitní servery a každé ráno mě informuj o nových nabídkách v lokalitě Praha-Holešovice.",
  },
];

export function Chat() {
  const { messages, sendMessage, status, error } = useChat();
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const submit = (text: string) => {
    if (!text.trim()) return;
    sendMessage({ text: text.trim() });
    setInput("");
  };

  const busy = status === "submitted" || status === "streaming";

  return (
    <div className="flex h-full flex-col bg-paper">
      {/* Header rail */}
      <header className="flex shrink-0 items-baseline justify-between border-b border-hairline bg-paper px-10 py-5">
        <div>
          <p className="eyebrow">Conversation</p>
          <h2 className="display mt-1 text-[22px] leading-none tracking-tight">
            Asistent Pepa
          </h2>
        </div>
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-ink-muted">
          <span className="inline-block size-1.5 rounded-full bg-success" />
          On-line · gemini-2.5-flash
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-10 py-8">
        {messages.length === 0 ? (
          <Welcome onPick={submit} />
        ) : (
          <div className="mx-auto max-w-3xl space-y-10">
            {messages.map((m) => (
              <MessageRow key={m.id} message={m} />
            ))}
            {status === "submitted" && (
              <div className="flex items-center gap-3 text-[12px] text-ink-muted">
                <Pulse />
                Agent přemýšlí…
              </div>
            )}
            {error && (
              <div className="border border-[#C77373] bg-[#F2DCDB] px-4 py-3 text-sm text-[#7A1E1E]">
                Chyba: {error.message}
              </div>
            )}
            <div ref={endRef} />
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="border-t border-hairline bg-paper-deep/40 px-10 py-5">
        <form
          className="mx-auto flex max-w-3xl items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            submit(input);
          }}
        >
          <div className="flex-1">
            <p className="eyebrow mb-1.5">Zpráva pro Pepu</p>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={busy}
              placeholder={
                'např. „Najdi byty 2+kk v Karlíně do 8 mil. a vyexportuj seznam"'
              }
              className="w-full border-b border-hairline-strong bg-transparent px-0 py-2 text-[15px] outline-none placeholder:text-ink-faint focus:border-copper disabled:opacity-50"
            />
          </div>
          <Button
            type="submit"
            disabled={!input.trim() || busy}
            className="mb-1"
          >
            Odeslat <ArrowUp className="size-3.5" />
          </Button>
        </form>
      </div>
    </div>
  );
}

function Pulse() {
  return (
    <span className="relative inline-flex size-2.5 items-center justify-center">
      <span className="absolute inline-flex size-2.5 animate-ping rounded-full bg-copper opacity-50" />
      <span className="relative inline-flex size-1.5 rounded-full bg-copper" />
    </span>
  );
}

function Welcome({ onPick }: { onPick: (text: string) => void }) {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="grid grid-cols-[1fr] gap-12 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="eyebrow">Co umím</p>
          <h2 className="display mt-3 text-[44px] leading-[1.02] tracking-tight text-ink">
            Ptám se{" "}
            <em className="not-italic text-copper">vašich dat</em>{" "}
            za vás.
          </h2>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-ink-muted">
            Klienti, leady, kalendář, audity, ranní briefingy — vše skrz volání nástrojů
            nad mockovanými integracemi Google Workspace a interním CRM.
            <span className="text-ink"> Nikdy žádné odhady.</span>
          </p>
          <div className="mt-8 flex gap-6 text-[11px] uppercase tracking-wider text-ink-muted">
            <Stat n="21" l="nástrojů" />
            <Stat n="180" l="nemovitostí" />
            <Stat n="5" l="integrací" />
          </div>
        </div>

        <div>
          <p className="eyebrow mb-3">Sugerované dotazy</p>
          <ul>
            {SUGGESTED_PROMPTS.map((p, i) => (
              <li key={i} className="border-b border-hairline last:border-b-0">
                <button
                  onClick={() => onPick(p.text)}
                  className="group flex w-full items-baseline gap-3 py-3 text-left transition-colors hover:bg-card"
                >
                  <span className="font-mono text-[10px] uppercase tracking-wider text-ink-faint w-20 shrink-0">
                    {p.cat}
                  </span>
                  <span className="flex-1 text-[14px] tracking-tight text-ink group-hover:text-copper">
                    {p.label}
                  </span>
                  <span className="text-ink-faint transition-transform group-hover:translate-x-0.5 group-hover:text-copper">
                    →
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Stat({ n, l }: { n: string; l: string }) {
  return (
    <div>
      <p className="display text-[28px] leading-none tracking-tight text-ink">{n}</p>
      <p className="mt-1 text-ink-faint">{l}</p>
    </div>
  );
}

type Msg = ReturnType<typeof useChat>["messages"][number];

function MessageRow({ message }: { message: Msg }) {
  const isUser = message.role === "user";
  return (
    <article className="grid grid-cols-[60px_1fr] gap-5">
      <div className="text-right">
        <p className="eyebrow">{isUser ? "Pepa" : "Agent"}</p>
      </div>
      <div className={cn("min-w-0 space-y-3", isUser && "border-l border-copper pl-5")}>
        {message.parts.map((part, idx) => {
          if (part.type === "text") {
            const text = (part as { text: string }).text;
            return (
              <div
                key={idx}
                className={cn(
                  "whitespace-pre-wrap text-[15px] leading-relaxed",
                  isUser ? "text-ink font-medium" : "text-ink-2",
                )}
              >
                {text}
              </div>
            );
          }
          if (typeof part.type === "string" && part.type.startsWith("tool-")) {
            return <ToolPart key={idx} part={part as never} />;
          }
          return null;
        })}
      </div>
    </article>
  );
}
