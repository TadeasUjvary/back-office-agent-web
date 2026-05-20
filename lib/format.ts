const CZ_MONTHS = [
  "", "ledna", "února", "března", "dubna", "května", "června",
  "července", "srpna", "září", "října", "listopadu", "prosince",
] as const;
const CZ_DAYS = [
  "neděle", "pondělí", "úterý", "středa", "čtvrtek", "pátek", "sobota",
] as const;

export function czCurrency(n: number) {
  return n.toLocaleString("cs-CZ").replace(/ /g, " ") + " Kč";
}

export function czNumber(n: number) {
  return n.toLocaleString("cs-CZ").replace(/ /g, " ");
}

/** ISO date (YYYY-MM-DD) → "středa 14. května 2026" */
export function czDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return `${CZ_DAYS[dow]} ${d}. ${CZ_MONTHS[m]} ${y}`;
}

export function czShortDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d}. ${CZ_MONTHS[m]} ${y}`;
}

export function monthLabel(year: number, month: number) {
  return `${CZ_MONTHS[month]} ${year}`;
}
