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
}: {
  size?: number;
  className?: string;
  rounded?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={cn(
          "relative flex items-center justify-center bg-gradient-to-br from-deep to-accent",
          rounded,
          className,
        )}
        style={{ width: size, height: size }}
      >
        <Sparkles className="text-accent-bright" style={{ width: size * 0.5, height: size * 0.5 }} />
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
      className={cn("object-contain", rounded, className)}
      style={{ width: size, height: size }}
    />
  );
}
