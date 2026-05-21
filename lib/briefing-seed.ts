/**
 * Deterministic briefing listing generator.
 * Given a date + district, produces 1-3 mock listings using a seeded RNG
 * (so the same date+district always yields the same listings on regen).
 */

const PORTALS = ["Sreality.cz", "Bezrealitky.cz", "Reality.iDNES.cz"] as const;
const PROPERTY_TYPES = [
  "Byt 1+kk", "Byt 2+kk", "Byt 3+1", "Byt 4+1",
  "Rodinný dům", "Komerční prostor", "Pozemek",
] as const;

// Hash string → 32bit unsigned seed
function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type BriefingListing = {
  id: string;
  portal: string;
  title: string;
  district: string;
  type: string;
  area_m2: number;
  price_czk: number;
  url: string;
  published: string;
};

export function generateBriefingListings(date: string, district: string): BriefingListing[] {
  const rng = mulberry32(hashSeed(`${date}|${district}`));
  const randInt = (lo: number, hi: number) => Math.floor(rng() * (hi - lo + 1)) + lo;
  const choice = <T,>(arr: readonly T[]): T => arr[Math.floor(rng() * arr.length)];

  const count = randInt(1, 3);
  const listings: BriefingListing[] = [];
  for (let i = 0; i < count; i++) {
    const ptype = choice(PROPERTY_TYPES);
    const area = randInt(30, 160);
    const price = Math.floor((area * randInt(80000, 150000)) / 1000) * 1000;
    const id = `L-${date}-${i + 1}`;
    listings.push({
      id,
      portal: choice(PORTALS),
      title: `${ptype}, ${area} m², ${district}`,
      district,
      type: ptype,
      area_m2: area,
      price_czk: price,
      url: `https://example-realitni-portal.cz/nabidka/${id}`,
      published: date,
    });
  }
  return listings;
}
