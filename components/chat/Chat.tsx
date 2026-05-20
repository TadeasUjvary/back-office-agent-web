"use client";
import { useChat } from "@ai-sdk/react";
import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, User2, Bot } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ToolPart } from "./ToolPart";
import { cn } from "@/lib/cn";

const SUGGESTED_PROMPTS = [
  {
    label: "Q1 klienti dle zdroje",
    text: "Jaké nové klienty máme za 1. kvartál 2026? Odkud přišli? Můžeš to znázornit graficky?",
  },
  {
    label: "Trend leadů & prodejů",
    text: "Vytvoř graf vývoje počtu leadů a prodaných nemovitostí za posledních 6 měsíců.",
  },
  {
    label: "Email s termínem prohlídky",
    text: "Napiš e-mail pro zájemce o nemovitost RH-1042 a doporuč mu termín prohlídky na základě mé dostupnosti v kalendáři.",
  },
  {
    label: "Audit chybějících dat",
    text: "Najdi nemovitosti, u kterých nám v systému chybí data o rekonstrukci a stavebních úpravách a připrav jejich seznam k doplnění.",
  },
  {
    label: "Týdenní report + slidy",
    text: "Shrň výsledky minulého týdne do krátkého reportu pro vedení a připrav k tomu prezentaci se třemi slidy.",
  },
  {
    label: "Ranní monitoring Holešovice",
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

  return (
    <div className="flex h-full flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 pb-6 pt-4">
        {messages.length === 0 && <Welcome onPick={submit} />}
        <div className="mx-auto max-w-4xl space-y-6">
          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}
          {status === "submitted" && (
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <Bot className="size-4" /> Agent přemýšlí…
            </div>
          )}
          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              Chyba: {error.message}
            </div>
          )}
          <div ref={endRef} />
        </div>
      </div>

      {/* Composer */}
      <div className="border-t border-zinc-200 bg-white px-6 py-4">
        <form
          className="mx-auto flex max-w-4xl gap-2"
          onSubmit={(e) => { e.preventDefault(); submit(input); }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={status === "streaming" || status === "submitted"}
            placeholder={'Napište zprávu… (např. „Připrav report za minulý týden")'}
            className="flex-1 rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-zinc-100"
          />
          <Button type="submit" disabled={!input.trim() || status === "streaming" || status === "submitted"}>
            <Send className="size-4" /> Odeslat
          </Button>
        </form>
      </div>
    </div>
  );
}

function Welcome({ onPick }: { onPick: (text: string) => void }) {
  return (
    <div className="mx-auto max-w-3xl py-8 text-center">
      <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md">
        <Sparkles className="size-7" />
      </div>
      <h2 className="text-2xl font-semibold text-zinc-900">Back Office Agent</h2>
      <p className="mt-2 text-sm text-zinc-600">
        Ptám se dat za vás. Klienti, leady, kalendář, audity, reporty — vše skrz volání nástrojů, nikdy ne odhadem.
      </p>
      <div className="mt-8 grid grid-cols-1 gap-2 text-left sm:grid-cols-2">
        {SUGGESTED_PROMPTS.map((p) => (
          <button
            key={p.label}
            onClick={() => onPick(p.text)}
            className="rounded-xl border border-zinc-200 bg-white p-4 transition-colors hover:border-indigo-300 hover:bg-indigo-50"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-indigo-600">
              {p.label}
            </p>
            <p className="mt-1 text-sm text-zinc-700">{p.text}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

type Msg = ReturnType<typeof useChat>["messages"][number];

function MessageBubble({ message }: { message: Msg }) {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex gap-3", isUser && "justify-end")}>
      {!isUser && (
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
          <Bot className="size-4" />
        </div>
      )}
      <div className={cn("max-w-[88%] space-y-3", isUser && "items-end")}>
        {message.parts.map((part, idx) => {
          if (part.type === "text") {
            return (
              <div
                key={idx}
                className={cn(
                  "whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed",
                  isUser
                    ? "bg-zinc-900 text-white"
                    : "bg-white text-zinc-800 ring-1 ring-zinc-200",
                )}
              >
                {(part as { text: string }).text}
              </div>
            );
          }
          if (typeof part.type === "string" && part.type.startsWith("tool-")) {
            return <ToolPart key={idx} part={part as never} />;
          }
          return null;
        })}
      </div>
      {isUser && (
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-zinc-700">
          <User2 className="size-4" />
        </div>
      )}
    </div>
  );
}
