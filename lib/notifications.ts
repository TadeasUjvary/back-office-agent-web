import { loadAll, TODAY_ISO } from "@/data/db";

export type NotifTone = "audit" | "lead" | "report" | "briefing" | "calendar" | "info";

export type AppNotification = {
  id: string;
  tone: NotifTone;
  title: string;
  body: string;
  href: string;
  ts: string;
};

/**
 * Proactive alerts derived deterministically from the data layer.
 * IDs are stable per (type + today) so "read" state survives reloads
 * but re-surfaces on a new simulated day.
 */
export function getNotifications(): AppNotification[] {
  const { properties, leads } = loadAll();
  const today = TODAY_ISO;
  const out: AppNotification[] = [];

  const missingReno = properties.filter((p) => p.has_renovation_data === 0).length;
  if (missingReno > 0) {
    out.push({
      id: `audit-${today}`,
      tone: "audit",
      title: "Nekompletní data o nemovitostech",
      body: `${missingReno} nemovitostí nemá údaje o rekonstrukci. Stojí za to je doplnit.`,
      href:
        "/?q=" +
        encodeURIComponent("Najdi nemovitosti bez dat o rekonstrukci a připrav seznam k doplnění."),
      ts: `${today}T08:00:00`,
    });
  }

  const newLeads = leads.filter((l) => l.status === "nový").length;
  if (newLeads > 0) {
    out.push({
      id: `leads-${today}`,
      tone: "lead",
      title: "Nové leady k oslovení",
      body: `${newLeads} leadů čeká na první kontakt. Mám připravit přehled podle zdroje?`,
      href:
        "/?q=" +
        encodeURIComponent("Vypiš nové leady, které ještě nikdo nekontaktoval, a seřaď je podle data."),
      ts: `${today}T07:45:00`,
    });
  }

  const reserved = properties.filter((p) => p.status === "rezervováno").length;
  if (reserved > 0) {
    out.push({
      id: `reserved-${today}`,
      tone: "info",
      title: "Rezervace čekají na dokončení",
      body: `${reserved} nemovitostí je rezervováno. Zkontrolujte, kde to drhne.`,
      href: "/?q=" + encodeURIComponent("Vypiš rezervované nemovitosti a kdo je má na starosti."),
      ts: `${today}T07:30:00`,
    });
  }

  // Weekly report nudge — at the start of the working week
  const dow = new Date(`${today}T00:00:00Z`).getUTCDay(); // 0 = neděle, 1 = pondělí
  if (dow === 1 || dow === 0) {
    out.push({
      id: `report-${today}`,
      tone: "report",
      title: "Čas na týdenní report",
      body: "Shrňte uplynulý týden pro vedení — zvládnu to i s prezentací.",
      href:
        "/?q=" +
        encodeURIComponent("Shrň výsledky minulého týdne do reportu pro vedení a připrav 3 slidy."),
      ts: `${today}T07:00:00`,
    });
  }

  out.push({
    id: `briefing-${today}`,
    tone: "briefing",
    title: "Ranní briefing je připraven",
    body: "Nové nabídky v lokalitě Praha-Holešovice za posledních 24 hodin.",
    href: "/briefings",
    ts: `${today}T06:30:00`,
  });

  return out.sort((a, b) => b.ts.localeCompare(a.ts));
}
