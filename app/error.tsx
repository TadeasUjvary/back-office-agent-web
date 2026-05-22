"use client";
import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Mascot } from "@/components/Mascot";
import { RotateCw, LayoutDashboard } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[route-error]", error);
  }, [error]);

  return (
    <div className="flex h-full flex-1 items-center justify-center bg-bg px-6">
      <div className="w-full max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <Mascot size={72} rounded="rounded-2xl" state="alive" />
        </div>
        <p className="eyebrow">Něco se pokazilo</p>
        <h1 className="mt-2 text-[24px] font-semibold leading-tight tracking-[-0.02em] text-text">
          Tohle se nepovedlo načíst.
        </h1>
        <p className="mt-3 text-[14px] leading-relaxed text-text-muted">
          Narazili jsme na neočekávanou chybu. Zkuste to prosím znovu — vaše data
          jsou v pořádku.
        </p>

        {error?.message && (
          <pre className="mt-4 overflow-x-auto rounded-lg border border-border bg-surface-2 px-3 py-2 text-left font-mono text-[11px] leading-relaxed text-text-muted">
            {error.message}
            {error.digest ? `\n\ndigest: ${error.digest}` : ""}
          </pre>
        )}

        <div className="mt-6 flex items-center justify-center gap-2">
          <Button onClick={reset}>
            <RotateCw className="size-3.5" /> Zkusit znovu
          </Button>
          <Link href="/prehled">
            <Button variant="secondary">
              <LayoutDashboard className="size-3.5" /> Zpět na přehled
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
