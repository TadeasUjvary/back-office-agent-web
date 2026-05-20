# Back Office Agent — Reality Holding

Autonomní AI agent pro back-office realitní a investiční firmy. Chat rozhraní postavené na **Vercel AI SDK + Gemini 2.5 Flash** s **Generative UI** — agent volá funkce nad syntetickou datovou vrstvou a renderuje interaktivní React komponenty (grafy, tabulky, e-maily, klikací slidy).

## Funkční scénáře

Agent autonomně zvládá těchto 6 scénářů (zkuste prompty v chatu):

1. **Kvartální analýza klientů** — _„Jaké nové klienty máme za 1. kvartál? Odkud přišli? Můžeš to znázornit graficky?"_ → pie/bar chart dle zdroje (Sreality, web, doporučení…).
2. **Vývoj leadů a prodejů** — _„Vytvoř graf vývoje leadů a prodaných nemovitostí za posledních 6 měsíců."_ → line chart s dvěma sériemi.
3. **Email s termínem prohlídky** — _„Napiš e-mail pro zájemce o RH-1042 a doporuč termín dle mé dostupnosti v kalendáři."_ → návrh termínů + e-mailový klient s tlačítkem **Odeslat**.
4. **Audit chybějících dat** — _„Najdi nemovitosti bez dat o rekonstrukci a připrav seznam k doplnění."_ → sortovaná tabulka s urgency-tlačítky na makléře.
5. **Týdenní report + slidy** — _„Shrň minulý týden do reportu pro vedení a připrav 3-slide prezentaci."_ → KPI karta + klikací 3-slide deck (←/→).
6. **Ranní monitoring trhu** — _„Sleduj realitní servery a každé ráno mě informuj o nových nabídkách v Praha-Holešovice."_ → potvrzení nastavení + odkaz na sekci **Ranní briefingy** se 7 předgenerovanými dny.

Kontextová paměť — funguje i navazující dotaz typu _„A co Q2?"_.

## Stack

- **Next.js 16** App Router · TypeScript strict
- **Vercel AI SDK 6** (`ai`, `@ai-sdk/google`, `@ai-sdk/react`) · `ToolLoopAgent` + `createAgentUIStreamResponse`
- **Gemini 2.5 Flash** přes oficiální `@ai-sdk/google` provider
- **Tailwind CSS 4** + minimalistický shadcn-style komponentní set
- **Recharts** (pie, bar, line)
- **Zod** pro tool schemata
- Žádná databáze — celá datová vrstva je deterministicky generované JSON (seed=42, ref. datum 2026-05-17)

## Quickstart

```bash
# 1. Instalace
npm install

# 2. API klíč — získat na https://aistudio.google.com/apikey
cp .env.example .env.local
# vyplň GOOGLE_GENERATIVE_AI_API_KEY=...

# 3. Vygeneruj syntetická data (běží jednou; commitnutý JSON v /data lze nechat)
npm run seed

# 4. Dev server
npm run dev
# → http://localhost:3000
```

## Architektura

```
app/
├─ page.tsx              # Chat (uses @ai-sdk/react useChat)
├─ briefings/page.tsx    # Ranní briefingy (statická data z /data/briefings)
├─ data/page.tsx         # Read-only přehled syntetické DB
└─ api/chat/route.ts     # POST → createAgentUIStreamResponse

ai/
├─ agent.ts              # ToolLoopAgent (gemini-2.5-flash + nástroje)
├─ tools.ts              # 6 toolů se zod inputSchema
└─ system-prompt.ts      # CZ playbook (no-hallucinate, prefer GenUI)

lib/queries.ts           # Čisté funkce nad JSON daty (volané z toolů)
data/generate.ts         # Deterministický generátor (seed=42)
data/*.json              # Committed artifacts (180 nemovitostí, 407 leadů, …)
components/
├─ chat/                 # Chat shell + ToolPart router
├─ generative/           # 6 komponent: graf/tabulka/email/slidy/briefing
└─ ui/                   # Button, Card, Badge (Tailwind native)
```

### Tok zprávy

1. Uživatel → `useChat.sendMessage({ text })` → `POST /api/chat`
2. `createAgentUIStreamResponse({ agent, uiMessages })` spustí Gemini.
3. Gemini volá nástroj → `tool.execute()` čte JSON přes `lib/queries.ts`.
4. Klient streamuje `tool-<name>` part — `ToolPart` switch ho mapuje na konkrétní generativní komponentu.

### Důležité rozhodnutí

**Agent nemá přístup k textovým datům.** Veškeré numerické a entity-based odpovědi MUSÍ pocházet z volání toolů — system prompt to vynucuje. Tím se vyhneme halucinacím.

## Deploy na Vercel

```bash
vercel
# → ve Vercel dashboardu nastav env var GOOGLE_GENERATIVE_AI_API_KEY
vercel --prod
```

`vercel.json` spouští `npm run seed && npm run build`, aby JSON data byla čerstvá při každém buildu (deterministická — výsledek je vždy stejný).

## Datový model (synthetic, seed=42)

| Entita | Počet | Klíčové údaje |
|---|---|---|
| Properties | 180 | ref_code, adresa, district, type, cena, status, **`has_renovation_data` (36.7 % chybí)** |
| Leads | 407 | jméno, source, status (konvertován/kvalifikován/…), region, agent |
| Clients | 179 | prodávající (60) + kupující (119, z konvertovaných leadů) |
| Sales | 59 | prodejní cena, provize, makléř, datum |
| Agents | 5 | Jana Nováková, Petr Svoboda, … |
| Calendar | 21 events | Pepa, pracovní hodiny 09–18, příští 12 prac. dní |
| Listings feed | 57 | mock Sreality/Bezrealitky/iDNES, posledních 10 dnů |
| Briefings | 7 dní | předgenerované ranní reporty Praha-Holešovice |

## Licence

Demo/portfolio. Data jsou kompletně syntetická, žádné osobní údaje.
