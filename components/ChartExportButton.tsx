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
 * Captures the referenced DOM node via html2canvas, embeds as image in a jsPDF doc.
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
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);
      const canvas = await html2canvas(targetRef.current, {
        backgroundColor: "#131418", // matches --surface
        scale: 2,
        logging: false,
        useCORS: true,
      });
      const imgData = canvas.toDataURL("image/png");
      // A4 landscape, fit width
      const doc = new jsPDF({ unit: "pt", format: "a4", orientation: "landscape" });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 32;
      const maxW = pageW - margin * 2;
      const maxH = pageH - margin * 2 - 40;
      const ratio = canvas.width / canvas.height;
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
      doc.addImage(imgData, "PNG", margin, margin + 32, w, h);
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
