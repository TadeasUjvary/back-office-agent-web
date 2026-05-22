"use client";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Brand mascot. Renders /mascot.png if present, otherwise falls back to a
 * green gradient sparkle badge so the app never shows a broken image.
 * Drop the mascot PNG at: public/mascot.png
 */
export function Mascot({
  size = 28,
  className,
  rounded = "rounded-md",
  state = "still",
}: {
  size?: number;
  className?: string;
  rounded?: string;
  /** "alive" = gentle idle float, "think" = faster float + glow, "still" = no motion */
  state?: "alive" | "think" | "still";
}) {
  const [failed, setFailed] = useState(false);
  const anim =
    state === "alive" ? "mascot-alive" : state === "think" ? "mascot-think" : undefined;

  if (failed) {
    return (
      <div
        className={cn(
          "relative flex items-center justify-center bg-gradient-to-br from-deep to-accent",
          rounded,
          anim,
          className,
        )}
        style={{ width: size, height: size }}
      >
        <Sparkles className="text-white" style={{ width: size * 0.5, height: size * 0.5 }} />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/mascot.png"
      alt="Maskot"
      width={size}
      height={size}
      onError={() => setFailed(true)}
      className={cn("object-contain", rounded, anim, className)}
      style={{ width: size, height: size }}
    />
  );
}
