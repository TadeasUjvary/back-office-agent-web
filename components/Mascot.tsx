"use client";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";

/** Each pose maps to one uploaded avatar image in /public. */
const POSE_SRC = {
  idle: "/mascot-idle.png",
  think: "/mascot-think.png",
  write: "/mascot-write.png",
  done: "/mascot-done.png",
} as const;

export type MascotPose = keyof typeof POSE_SRC;

/**
 * Brand mascot with state-driven poses.
 * Drop 4 PNGs (transparent bg ideal) at:
 *   public/mascot-idle.png · mascot-think.png · mascot-write.png · mascot-done.png
 * Falls back to a gradient sparkle badge if an image is missing, so the app
 * never shows a broken image.
 */
export function Mascot({
  size = 28,
  className,
  rounded = "rounded-md",
  pose = "idle",
  state = "still",
}: {
  size?: number;
  className?: string;
  rounded?: string;
  /** Which pose image to show. */
  pose?: MascotPose;
  /** Motion: "alive" = gentle float, "think" = faster float + glow, "still" = none. */
  state?: "alive" | "think" | "still";
}) {
  const [failed, setFailed] = useState(false);
  const anim =
    state === "alive" ? "mascot-alive" : state === "think" ? "mascot-think" : undefined;
  const box = cn(
    "relative inline-flex items-center justify-center overflow-hidden",
    rounded,
    anim,
    className,
  );

  if (failed) {
    return (
      <span className={cn(box, "bg-gradient-to-br from-deep to-accent")} style={{ width: size, height: size }}>
        <Sparkles className="text-white" style={{ width: size * 0.5, height: size * 0.5 }} />
      </span>
    );
  }

  return (
    <span className={box} style={{ width: size, height: size }}>
      {/* key={pose} remounts on pose change so the new frame fades in */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={pose}
        src={POSE_SRC[pose]}
        alt="Maskot"
        onError={() => setFailed(true)}
        className="mascot-swap size-full object-contain"
        draggable={false}
      />
    </span>
  );
}
