import { tool } from "ai";
import { z } from "zod";
import {
  getNewClients, getLeadsAndSalesTrend, proposeViewingSlots,
  auditMissingRenovationData, weeklyReport, setupMarketMonitoring,
  listAgents, queryProperties, queryLeads, queryClients, querySales,
  getPropertyDetail, getAgentDetail, getLeadFunnel, comparePeriods,
} from "@/lib/queries";
import {
  mockSendEmail, mockAddCalendarEvent, mockLogCRMNote, mockUrgeAgent, mockExportToSheet,
} from "@/lib/actions";
import { fetchWebUrl } from "@/lib/web";

const QuarterSchema = z.enum(["Q1", "Q2", "Q3", "Q4"]);

export const tools = {
  getNewClients: tool({
    description:
      "Spočítá nové klienty za zadaný kvartál a rozdělí je dle zdroje (Sreality, web, doporučení atd.). Použij pro otázky typu 'Jaké nové klienty máme za Q1?' nebo 'Odkud přišli klienti za druhý kvartál?'. Vrací data pro pie/bar chart.",
    inputSchema: z.object({
      quarter: QuarterSchema.describe("Kvartál — Q1, Q2, Q3 nebo Q4"),
      year: z.number().int().min(2020).max(2030).describe("Rok, např. 2026"),
      chartType: z.enum(["pie", "bar"]).optional().describe("Typ grafu, default pie"),
    }),
    execute: async ({ quarter, year, chartType }) => {
      const data = getNewClients(quarter, year);
      return { ...data, chartType: chartType ?? "pie" };
    },
  }),

  getLeadsAndSalesTrend: tool({
    description:
      "Vykreslí měsíční vývoj počtu nových leadů a prodaných nemovitostí za posledních N měsíců. Použij pro otázky o trendu, vývoji, srovnání po měsících.",
    inputSchema: z.object({
      monthsBack: z.number().int().min(2).max(14).default(6)
        .describe("Kolik měsíců zpět zobrazit (default 6)"),
      district: z.string().optional()
        .describe("Volitelná lokalita — Praha-Holešovice, Praha-Vinohrady, ..."),
    }),
    execute: async ({ monthsBack, district }) => {
      return getLeadsAndSalesTrend(monthsBack, district);
    },
  }),

  proposeViewingSlots: tool({
    description:
      "Najde volné termíny prohlídky v Pepově kalendáři a připraví návrh e-mailu zájemci. Použij pro otázky typu 'Napiš e-mail zájemci a doporuč termín' nebo 'Kdy mám volno na schůzku?'.",
    inputSchema: z.object({
      propertyRef: z.string().optional()
        .describe("Kód nemovitosti, např. RH-1042 (pokud zájemce o konkrétní nemovitost)"),
      daysAhead: z.number().int().min(1).max(14).default(7)
        .describe("Kolik pracovních dnů dopředu hledat (default 7)"),
      slotMinutes: z.number().int().min(30).max(180).default(60)
        .describe("Délka slotu v minutách (default 60)"),
    }),
    execute: async ({ propertyRef, daysAhead, slotMinutes }) => {
      return proposeViewingSlots(propertyRef, daysAhead, slotMinutes);
    },
  }),

  auditMissingRenovationData: tool({
    description:
      "Vrátí seznam nemovitostí, kterým v systému chybí data o rekonstrukci a stavebních úpravách, seřazené podle priority (aktivně nabízené první, pak dle ceny sestupně). Použij pro otázky typu 'Najdi nemovitosti bez dat o rekonstrukci' nebo 'Připrav seznam k doplnění'.",
    inputSchema: z.object({
      district: z.string().optional()
        .describe("Volitelná lokalita pro zúžení (např. Praha-Holešovice)"),
      minPrice: z.number().int().optional()
        .describe("Minimální cena v Kč pro zúžení (např. 5000000)"),
    }),
    execute: async ({ district, minPrice }) => {
      return auditMissingRenovationData(district, minPrice);
    },
  }),

  weeklyReport: tool({
    description:
      "Sestaví týdenní report pro vedení s klíčovými metrikami (nové leady, prodeje, objem, provize, pipeline, top makléř) a připraví 3-slidovou prezentaci. Použij pro otázky typu 'Shrň minulý týden' nebo 'Připrav prezentaci pro vedení'.",
    inputSchema: z.object({
      weekEnding: z.string().optional()
        .describe("Datum konce týdne ve formátu YYYY-MM-DD, default = včera"),
      includeSlides: z.boolean().default(true)
        .describe("Vykreslit i 3-slidovou prezentaci (default true)"),
    }),
    execute: async ({ weekEnding, includeSlides }) => {
      return { ...weeklyReport(weekEnding), includeSlides };
    },
  }),

  listAgents: tool({
    description:
      "Vrátí seznam všech makléřů firmy s jejich KPI (počet prodejů, objem, provize, aktivní inzeráty, chybějící data). Použij pro dotazy typu 'Jaké jsou jména makléřů?', 'Kdo je nejlepší makléř za celou dobu?', 'Kolik prodal Petr Svoboda?'.",
    inputSchema: z.object({}),
    execute: async () => listAgents(),
  }),

  queryProperties: tool({
    description:
      "Univerzální dotaz nad databází nemovitostí — filtruj dle lokality, typu, ceny, plochy, stavu, layoutu, dostupnosti dat o rekonstrukci. Použij pro libovolný dotaz o konkrétních nemovitostech, který nezvládají ostatní tooly. Vrací počet shod, průměrnou cenu, rozdělení dle statusu a top 25 řádků.",
    inputSchema: z.object({
      district: z.string().optional().describe("Lokalita — Praha-Holešovice, Praha-Karlín, Brno-střed, ..."),
      type: z.string().optional().describe("Typ — 'Byt 2+kk', 'Rodinný dům', 'Pozemek', 'Komerční prostor' atd."),
      status: z.enum(["nabízí se", "rezervováno", "prodáno"]).optional(),
      layout: z.string().optional().describe("Dispozice u bytů, např. 'Byt 2+kk'"),
      minPrice: z.number().int().optional().describe("Minimální cena v Kč"),
      maxPrice: z.number().int().optional().describe("Maximální cena v Kč"),
      minArea: z.number().int().optional().describe("Minimální plocha m²"),
      maxArea: z.number().int().optional().describe("Maximální plocha m²"),
      hasRenovationData: z.boolean().optional().describe("true = jen s vyplněnými daty, false = jen bez nich"),
      limit: z.number().int().min(1).max(100).default(25).describe("Maximální počet řádků v odpovědi"),
    }),
    execute: async (filters) => queryProperties(filters),
  }),

  setupMarketMonitoring: tool({
    description:
      "Nastaví pravidelný ranní monitoring nových nabídek na realitních serverech pro zadanou lokalitu. Použij pro otázky typu 'Sleduj nabídky v Praze 7 a každé ráno mě informuj'.",
    inputSchema: z.object({
      district: z.string()
        .describe("Lokalita — Praha-Holešovice, Praha-Vinohrady, Brno-střed atd."),
      time: z.string().default("07:30")
        .describe("Čas ranního briefingu ve formátu HH:MM (default 07:30)"),
      portals: z.array(z.string()).default([])
        .describe("Seznam portálů, default Sreality/Bezrealitky/iDNES"),
    }),
    execute: async ({ district, time, portals }) => {
      return setupMarketMonitoring(district, time, portals);
    },
  }),

  // ─── READ tools ─────────────────────────────────────────────────────────
  queryLeads: tool({
    description:
      "Univerzální dotaz nad databází leadů — filtruj dle statusu (nový/kontaktován/kvalifikován/konvertován/ztracený), zdroje (Sreality.cz, Web firmy, Doporučení atd.), regionu, makléře a období. Vrací počet shod, rozdělení dle statusu a zdroje, prvních 25 záznamů.",
    inputSchema: z.object({
      status: z.enum(["nový", "kontaktován", "kvalifikován", "konvertován", "ztracený"]).optional(),
      source: z.string().optional().describe("Sreality.cz, Web firmy, Doporučení, Bezrealitky.cz, Sociální sítě, Walk-in, Placená inzerce"),
      region: z.string().optional(),
      agentName: z.string().optional().describe("Jméno makléře, např. 'Jana Nováková'"),
      fromDate: z.string().optional().describe("YYYY-MM-DD — od kdy"),
      toDate: z.string().optional().describe("YYYY-MM-DD — do kdy (vyloučeno)"),
      limit: z.number().int().min(1).max(100).default(25),
    }),
    execute: async (f) => queryLeads(f),
  }),

  queryClients: tool({
    description:
      "Filtr nad klienty — prodávající vs. kupující, zdroj, region, období. Vrací rozdělení dle typu a zdroje + řádky.",
    inputSchema: z.object({
      type: z.enum(["prodávající", "kupující"]).optional(),
      source: z.string().optional(),
      region: z.string().optional(),
      fromDate: z.string().optional(),
      toDate: z.string().optional(),
      limit: z.number().int().min(1).max(100).default(25),
    }),
    execute: async (f) => queryClients(f),
  }),

  querySales: tool({
    description:
      "Filtr a agregace prodejů — období, lokalita, makléř, cenový rozsah. Vrací objem, provizi, průměrnou cenu, rozdělení dle makléře a lokality + jednotlivé prodeje.",
    inputSchema: z.object({
      fromDate: z.string().optional().describe("YYYY-MM-DD"),
      toDate: z.string().optional().describe("YYYY-MM-DD (vyloučeno)"),
      district: z.string().optional(),
      agentName: z.string().optional(),
      minPrice: z.number().int().optional(),
      maxPrice: z.number().int().optional(),
      limit: z.number().int().min(1).max(100).default(25),
    }),
    execute: async (f) => querySales(f),
  }),

  getPropertyDetail: tool({
    description:
      "Plný detail jedné nemovitosti dle ref_code (RH-1042 atd.) — všechna pole, jméno makléře, údaje o vlastníkovi, případný prodej.",
    inputSchema: z.object({
      refCode: z.string().describe("Kód, např. RH-1042"),
    }),
    execute: async ({ refCode }) => getPropertyDetail(refCode),
  }),

  getAgentDetail: tool({
    description:
      "Detail jednoho makléře — jeho KPI, posledních 5 prodejů, aktivní inzeráty, počet chybějících dat. Použij když uživatel chce vědět konkrétního makléře jménem.",
    inputSchema: z.object({
      agentName: z.string().describe("Jméno, např. 'Petr Svoboda'"),
    }),
    execute: async ({ agentName }) => getAgentDetail(agentName),
  }),

  getLeadFunnel: tool({
    description:
      "Konverzní trychtýř leadů — kolik je v každém stavu (nový → kontaktován → kvalifikován → konvertován → ztracený), konverzní a kvalifikační poměr. Volitelně omez na N posledních měsíců a/nebo lokalitu.",
    inputSchema: z.object({
      monthsBack: z.number().int().min(1).max(14).optional(),
      district: z.string().optional(),
    }),
    execute: async ({ monthsBack, district }) => getLeadFunnel(monthsBack, district),
  }),

  comparePeriods: tool({
    description:
      "Spočítá rozdíl jedné metriky (leads/sales/salesVolume/commission/newClients) mezi dvěma obdobími (thisWeek/lastWeek/thisMonth/lastMonth/thisQuarter/lastQuarter/thisYear/lastYear). Vrací oba počty, absolutní rozdíl, procentní změnu a směr.",
    inputSchema: z.object({
      metric: z.enum(["leads", "sales", "salesVolume", "commission", "newClients"]),
      periodA: z.enum(["thisWeek", "lastWeek", "thisMonth", "lastMonth", "thisQuarter", "lastQuarter", "thisYear", "lastYear"]),
      periodB: z.enum(["thisWeek", "lastWeek", "thisMonth", "lastMonth", "thisQuarter", "lastQuarter", "thisYear", "lastYear"]),
    }),
    execute: async ({ metric, periodA, periodB }) => comparePeriods(metric, periodA, periodB),
  }),

  // ─── WRITE / ACTION tools (mocked SaaS calls) ──────────────────────────
  sendEmail: tool({
    description:
      "Odešle e-mail přes Gmail. Použij když chce uživatel reálně poslat mail klientovi/makléři, ne jen napsat draft. Vrací message ID a potvrzení odeslání.",
    inputSchema: z.object({
      to: z.string().describe("E-mail příjemce"),
      subject: z.string(),
      body: z.string().describe("Tělo e-mailu, plain text nebo markdown"),
      cc: z.array(z.string()).optional(),
      attachments: z.array(z.string()).optional().describe("Názvy příloh z Google Drive"),
    }),
    execute: async (a) => mockSendEmail(a),
  }),

  addCalendarEvent: tool({
    description:
      "Aktivně zapíše událost do Pepova Google Kalendáře (prohlídka, schůzka, call). Použij když uživatel řekne 'naplánuj', 'přidej', 'zapiš', 'rezervuj' termín. Událost se okamžitě objeví v sekci Kalendář v levém menu. Vrací potvrzení a event ID.",
    inputSchema: z.object({
      date: z.string().describe("YYYY-MM-DD"),
      startTime: z.string().describe("HH:MM"),
      durationMinutes: z.number().int().min(15).max(480).default(60),
      title: z.string().describe("Název události, např. 'Prohlídka RH-1042 — Novák'"),
      description: z.string().optional().describe("Popis / poznámky k události"),
      attendees: z.array(z.string()).optional().describe("E-maily účastníků"),
      location: z.string().optional(),
    }),
    execute: async (a) => mockAddCalendarEvent({ ...a, notes: a.description }),
  }),

  logCRMNote: tool({
    description:
      "Přidá poznámku k záznamu v CRM (nemovitost / lead / klient / makléř). Použij když chce uživatel zapsat zjištění, postřeh, nebo follow-up úkol.",
    inputSchema: z.object({
      entity: z.enum(["property", "lead", "client", "agent"]),
      ref: z.string().describe("Identifikátor — ref_code (RH-…) u nemovitosti, jinak ID nebo jméno"),
      note: z.string().describe("Text poznámky"),
      tag: z.string().optional().describe("Tag/kategorie, např. 'followup', 'price-drop', 'price-check'"),
    }),
    execute: async (a) => mockLogCRMNote(a),
  }),

  urgeAgent: tool({
    description:
      "Pošle urgenci konkrétnímu makléři (např. doplnění chybějících dat o rekonstrukci, nebo follow-up). Volá se typicky po auditu.",
    inputSchema: z.object({
      agentName: z.string(),
      subject: z.string().describe("Předmět urgence — 'Doplnit data o rekonstrukci' atd."),
      itemCount: z.number().int().optional().describe("Počet položek k doplnění"),
      deadline: z.string().optional().describe("Termín, např. '2026-05-25' nebo 'do 5 prac. dnů'"),
    }),
    execute: async (a) => mockUrgeAgent(a),
  }),

  exportToSheet: tool({
    description:
      "Vyexportuje vybranou sadu záznamů do nového Google Sheetu a vrátí URL. Použij pro 'pošli mi to v tabulce' nebo 'vyexportuj audit'.",
    inputSchema: z.object({
      entity: z.enum(["properties", "leads", "clients", "sales", "audit"]),
      rowCount: z.number().int().min(1).describe("Počet řádků, co se exportuje"),
      title: z.string().optional().describe("Název listu, defaultně '<entita>-export-YYYY-MM-DD'"),
    }),
    execute: async (a) => mockExportToSheet(a),
  }),

  // ─── WEB access ────────────────────────────────────────────────────────
  fetchUrl: tool({
    description:
      "Stáhne obsah veřejné URL z internetu (HTTP GET, max 8 KB textu) a vrátí očištěný text + titulek. Použij když uživatel pošle odkaz (Sreality, Bezrealitky, zpráva ČTK…) a chce, abys ho přečetl, shrnul nebo z něj vytáhl konkrétní fakta. Pozn.: jen veřejné stránky, žádné přihlášení.",
    inputSchema: z.object({
      url: z.string().describe("Veřejná HTTP/HTTPS URL"),
    }),
    execute: async ({ url }) => fetchWebUrl(url),
  }),

  // ─── READ Calendar — render-side čte z Zustand (synced from Supabase) ──
  getCalendar: tool({
    description:
      "Přečte události z Pepova kalendáře. Použij pro otázky jako 'Co mám zítra v kalendáři?', 'Jaké schůzky mám tento týden?', 'Co je naplánováno na 22.5.?'. " +
      "Pro hledání volných slotů použij místo toho `proposeViewingSlots`. " +
      "Pokud `from` a `to` zadáno, vrátí události v rozsahu; jinak vrátí všechny nadcházející.",
    inputSchema: z.object({
      from: z.string().optional().describe("Začátek rozsahu YYYY-MM-DD"),
      to: z.string().optional().describe("Konec rozsahu YYYY-MM-DD (včetně)"),
      query: z.string().optional().describe("Volitelný fulltext filtr nad title"),
    }),
    // Note: execute is server-side, but to keep things simple and avoid
    // needing user_id in tool context, the component (CalendarRead) reads
    // the live data from the client-side Zustand store (which is hydrated
    // from Supabase on mount). Server returns filter spec only.
    execute: async ({ from, to, query }) => ({
      mode: "client-read" as const,
      filters: { from, to, query },
    }),
  }),

  // ─── GENERIC CHART — libovolný pie/bar/line graf ───────────────────────
  renderChart: tool({
    description:
      "Vykreslí libovolný graf (pie / bar / line) z jakýchkoli dat. Použij když uživatel chce graf, který nezvládají specifické tooly (např. 'koláčový graf prodejů per makléř', 'sloupcový graf top 5 lokalit dle objemu', 'line graf cen za 3 měsíce'). " +
      "**Workflow:** nejdřív zavolej query tool (`listAgents`, `querySales`, `queryProperties`…), z výsledku poskládej `data` pole a vyrender. " +
      "**Schema:** `data` je pole `{label: string, value: number}`. Pro multi-series bar/line použij `series` (pole `{name, data}`).",
    inputSchema: z.object({
      chartType: z.enum(["pie", "bar", "line"]).describe("Typ grafu"),
      title: z.string().describe("Nadpis grafu"),
      subtitle: z.string().optional().describe("Volitelný podtitul/kontext"),
      data: z
        .array(z.object({
          label: z.string().describe("Popisek (osa X u bar/line, řez u pie)"),
          value: z.number().describe("Hodnota"),
        }))
        .min(1)
        .describe("Datové body pro graf"),
      series: z
        .array(z.object({
          name: z.string(),
          data: z.array(z.object({ label: z.string(), value: z.number() })),
        }))
        .optional()
        .describe("Více sérií (jen pro bar/line). Pokud zadáno, `data` se ignoruje."),
      valueFormat: z
        .enum(["number", "currency", "percent"])
        .default("number")
        .describe("Formátování hodnot v tooltipu/labelu"),
    }),
    execute: async (args) => args,
  }),

  // ─── EXPORT — reálné PDF / XLSX ke stažení ─────────────────────────────
  exportData: tool({
    description:
      "Připraví data k reálnému stažení jako PDF nebo Excel. Použij když uživatel řekne 'vyexportuj', 'vygeneruj PDF', 'pošli mi to v Excelu', 'stáhni'. **DŮLEŽITÉ — schema:**\n" +
      "- `content.columns` MUSÍ být POLE PROSTÝCH ŘETĚZCŮ jako [\"Kód\", \"Adresa\", \"Cena\"], NIKDY ne pole objektů.\n" +
      "- `content.rows` MUSÍ být POLE POLÍ (2D array) jako [[\"RH-1001\", \"Praha\", 3500000], [\"RH-1002\", \"Brno\", 4200000]], NIKDY ne pole objektů.\n" +
      "- Pořadí hodnot v `rows[i]` musí odpovídat pořadí `columns`.\n" +
      "Použij `kind:'table'` pro tabulky, `kind:'text'` pro souvislý text, `kind:'report'` pro multi-sekční report. Po zavolání **napiš max 1 krátkou větu** (např. 'Hotovo, stáhněte kliknutím.') — nic víc, žádné shrnutí dat, žádné další tooly.",
    inputSchema: z.object({
      format: z.enum(["pdf", "excel"]).describe("Formát stahovaného souboru"),
      title: z.string().describe("Název dokumentu/souboru (bez přípony)"),
      content: z.discriminatedUnion("kind", [
        z.object({
          kind: z.literal("table"),
          columns: z
            .array(
              z.union([
                z.string(),
                // Tolerant fallback if model sends [{title, id}] — normalized in execute
                z.object({ title: z.string(), id: z.string().optional() }),
              ]),
            )
            .describe("Hlavička sloupců — pole stringů. Např. [\"Kód\", \"Adresa\", \"Cena\"]."),
          rows: z
            .array(
              z.union([
                z.array(z.union([z.string(), z.number(), z.null()])),
                // Tolerant fallback: row as object → normalized to array using `columns` order
                z.record(z.string(), z.union([z.string(), z.number(), z.null()])),
              ]),
            )
            .describe("Řádky — pole polí. Např. [[\"RH-1001\", \"Praha\", 3500000]]."),
          summary: z.string().optional().describe("Krátké shrnutí pod tabulkou"),
        }),
        z.object({
          kind: z.literal("text"),
          body: z.string().describe("Souvislý text (markdown OK)"),
        }),
        z.object({
          kind: z.literal("report"),
          sections: z.array(z.object({
            heading: z.string(),
            body: z.string(),
          })).describe("Sekce reportu"),
        }),
      ]),
    }),
    execute: async (args) => {
      // Normalize tolerant inputs to strict shape expected by the client renderer
      if (args.content.kind === "table") {
        const rawCols = args.content.columns;
        const cols: string[] = rawCols.map((c) =>
          typeof c === "string" ? c : (c.title ?? c.id ?? ""),
        );
        const ids: string[] = rawCols.map((c, i) =>
          typeof c === "string" ? c : (c.id ?? c.title ?? `col${i}`),
        );
        const rawRows = args.content.rows as Array<
          (string | number | null)[] | Record<string, string | number | null>
        >;
        const rows: (string | number)[][] = rawRows.map((r) => {
          if (Array.isArray(r)) return r.map((v) => (v == null ? "" : v));
          // Object row → align with column ids/titles
          return ids.map((key, i) => {
            const v = r[key] ?? r[cols[i]] ?? "";
            return v == null ? "" : v;
          });
        });
        return {
          format: args.format,
          title: args.title,
          content: { kind: "table" as const, columns: cols, rows, summary: args.content.summary },
          preparedAt: new Date().toISOString(),
        };
      }
      return {
        format: args.format,
        title: args.title,
        content: args.content,
        preparedAt: new Date().toISOString(),
      };
    },
  }),
} as const;

export type Tools = typeof tools;
