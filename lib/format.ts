const CZ_MONTHS = [
  "", "ledna", "února", "března", "dubna", "května", "června",
  "července", "srpna", "září", "října", "listopadu", "prosince",
] as const;
const CZ_DAYS = [
  "neděle", "pondělí", "úterý", "středa", "čtvrtek", "pátek", "sobota",
] as const;

const NBSP = " ";

/** Czech currency with non-breaking spaces — never wraps mid-number. */
export function czCurrency(n: number) {
  const num = n.toLocaleString("cs-CZ").replace(/\s/g, NBSP);
  return `${num}${NBSP}Kč`;
}

export function czNumber(n: number) {
  return n.toLocaleString("cs-CZ").replace(/\s/g, NBSP);
}

/** Compact Czech currency for tight spaces — "91,9 mil. Kč", "620 tis. Kč". */
export function czCompactCurrency(n: number) {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) {
    const v = (n / 1_000_000).toLocaleString("cs-CZ", { maximumFractionDigits: 1 });
    return `${v}${NBSP}mil.${NBSP}Kč`;
  }
  if (abs >= 10_000) {
    const v = Math.round(n / 1_000).toLocaleString("cs-CZ").replace(/\s/g, NBSP);
    return `${v}${NBSP}tis.${NBSP}Kč`;
  }
  return czCurrency(n);
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
