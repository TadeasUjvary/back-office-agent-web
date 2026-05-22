"use client";
import { useState, type RefObject } from "react";
import { FileDown, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

function slug(s: string) {
  return s
    .replace(/[^a-zA-Z0-9-_ěščřžýáíéúůďťňŮ]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Click-to-export-PDF button for any chart card.
 * Uses html-to-image (SVG foreignObject under the hood) — supports
 * modern CSS color functions (oklab/oklch) that html2canvas doesn't.
 */
export function ChartExportButton({
  targetRef,
  title,
}: {
  targetRef: RefObject<HTMLDivElement | null>;
  title: string;
}) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const handleClick = async () => {
    if (!targetRef.current) return;
    setBusy(true);
    try {
      const [{ toPng }, { jsPDF }] = await Promise.all([
        import("html-to-image"),
        import("jspdf"),
      ]);
      // Render to PNG data URL @ 2x for retina sharpness
      const dataUrl = await toPng(targetRef.current, {
        pixelRatio: 2,
        backgroundColor: "#FFFFFF",
        cacheBust: true,
        // Skip the export button itself so it's not in the screenshot
        filter: (node) => {
          if (node instanceof HTMLElement) {
            return !node.dataset.exportSkip;
          }
          return true;
        },
      });

      // Measure to compute aspect ratio
      const img = new Image();
      img.src = dataUrl;
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Image preload failed"));
      });

      const doc = new jsPDF({ unit: "pt", format: "a4", orientation: "landscape" });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 32;
      const maxW = pageW - margin * 2;
      const maxH = pageH - margin * 2 - 40;
      const ratio = img.width / img.height;
      let w = maxW;
      let h = w / ratio;
      if (h > maxH) {
        h = maxH;
        w = h * ratio;
      }

      // Header
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text(title, margin, margin + 4);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text(
        `Reality Holding · Back Office Agent · ${new Date().toLocaleDateString("cs-CZ")}`,
        margin,
        margin + 20,
      );
      doc.setTextColor(20, 20, 20);
      doc.addImage(dataUrl, "PNG", margin, margin + 32, w, h);

      const date = new Date().toISOString().slice(0, 10);
      doc.save(`${slug(title)}-${date}.pdf`);

      setDone(true);
      setTimeout(() => setDone(false), 2500);
    } catch (e) {
      console.error("[chart-export] failed", e);
      alert("Export grafu selhal: " + (e instanceof Error ? e.message : "neznámá chyba"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      type="button"
      variant="secondary"
      onClick={handleClick}
      disabled={busy}
      className="text-xs"
      title="Stáhnout graf jako PDF"
      data-export-skip="true"
    >
      {busy ? (
        <Loader2 className="size-3 animate-spin" />
      ) : done ? (
        <CheckCircle2 className="size-3 text-green" />
      ) : (
        <FileDown className="size-3" />
      )}
      PDF
    </Button>
  );
}
