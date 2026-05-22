"use client";
import { useEffect, useState } from "react";

/** Animated number count-up. Respects prefers-reduced-motion. */
export function CountUp({
  value,
  durationMs = 900,
  format,
}: {
  value: number;
  durationMs?: number;
  format?: (n: number) => string;
}) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    ) {
      setDisplay(value);
      return;
    }
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      setDisplay(value * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
      else setDisplay(value);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, durationMs]);

  const rounded = Math.round(display);
  return <>{format ? format(rounded) : rounded.toLocaleString("cs-CZ")}</>;
}
