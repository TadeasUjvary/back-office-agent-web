"use client";
import { useState } from "react";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { FileDown, FileText, FileSpreadsheet, CheckCircle2, Loader2 } from "lucide-react";

type Content =
  | { kind: "table"; columns: string[]; rows: (string | number)[][]; summary?: string }
  | { kind: "text"; body: string }
  | { kind: "report"; sections: { heading: string; body: string }[] };

type Data = {
  format: "pdf" | "excel";
  title: string;
  content: Content;
  preparedAt: string;
};

function safeFileName(s: string) {
  return s.replace(/[^a-zA-Z0-9-_ěščřžýáíéúůďťňŮ]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

export function ExportDownloadCard({ data }: { data: Data }) {
  const [downloading, setDownloading] = useState(false);
  const [done, setDone] = useState(false);

  const onDownload = async () => {
    setDownloading(true);
    try {
      const filename = `${safeFileName(data.title)}-${data.preparedAt.slice(0, 10)}`;
      if (data.format === "pdf") {
        await generatePDF(filename, data);
      } else {
        await generateExcel(filename, data);
      }
      setDone(true);
      setTimeout(() => setDone(false), 3000);
    } catch (e) {
      console.error("Export failed", e);
      alert("Export selhal: " + (e instanceof Error ? e.message : "Neznámá chyba"));
    } finally {
      setDownloading(false);
    }
  };

  const Icon = data.format === "pdf" ? FileText : FileSpreadsheet;
  const accentClass = data.format === "pdf" ? "bg-rose/15 text-rose" : "bg-green/15 text-green";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className={`flex size-9 shrink-0 items-center justify-center rounded-md ${accentClass}`}>
            <Icon className="size-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="eyebrow">
              Export · {data.format.toUpperCase()} · {data.content.kind}
            </p>
            <CardTitle className="mt-1 truncate">{data.title}</CardTitle>
          </div>
          <Badge tone={data.format === "pdf" ? "danger" : "success"}>
            {data.format === "pdf" ? ".pdf" : ".xlsx"}
          </Badge>
        </div>
      </CardHeader>
      <CardBody className="space-y-4">
        <Preview content={data.content} />

        <div className="flex items-center justify-between border-t border-border pt-4">
          <p className="font-mono text-[10px] text-text-faint">
            Generuje se v prohlížeči · {data.format === "pdf" ? "jspdf" : "SheetJS xlsx"}
          </p>
          <Button onClick={onDownload} disabled={downloading}>
            {downloading ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                Generuji…
              </>
            ) : done ? (
              <>
                <CheckCircle2 className="size-3.5" />
                Staženo
              </>
            ) : (
              <>
                <FileDown className="size-3.5" />
                Stáhnout {data.format === "pdf" ? "PDF" : "Excel"}
              </>
            )}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

function Preview({ content }: { content: Content }) {
  if (content.kind === "table") {
    const previewRows = content.rows.slice(0, 5);
    return (
      <div>
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="min-w-full text-[12px]">
            <thead className="bg-surface-2">
              <tr>
                {content.columns.map((c) => (
                  <th key={c} className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-wider text-text-faint">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewRows.map((r, i) => (
                <tr key={i} className="border-t border-border">
                  {r.map((cell, j) => (
                    <td key={j} className="px-3 py-2 text-text-2">{String(cell)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 font-mono text-[10px] text-text-faint">
          {content.rows.length} řádků · zobrazeno prvních {Math.min(5, content.rows.length)}
        </p>
        {content.summary && (
          <p className="mt-2 text-[13px] text-text-muted">{content.summary}</p>
        )}
      </div>
    );
  }
  if (content.kind === "text") {
    return (
      <div className="max-h-40 overflow-y-auto rounded-md border border-border bg-surface-2 p-3">
        <pre className="whitespace-pre-wrap text-[12px] leading-relaxed text-text-2">
          {content.body.slice(0, 600)}{content.body.length > 600 && "…"}
        </pre>
      </div>
    );
  }
  // report
  return (
    <div className="space-y-2">
      {content.sections.slice(0, 3).map((s, i) => (
        <div key={i} className="rounded-md border border-border bg-surface-2 p-3">
          <p className="text-[13px] font-medium text-text">{s.heading}</p>
          <p className="mt-1 text-[12px] text-text-muted line-clamp-2">{s.body}</p>
        </div>
      ))}
      {content.sections.length > 3 && (
        <p className="font-mono text-[10px] text-text-faint">
          + {content.sections.length - 3} další sekce v exportu
        </p>
      )}
    </div>
  );
}

// ─── PDF generation (jspdf + jspdf-autotable) ──────────────────────────
async function generatePDF(filename: string, data: Data) {
  const jspdfMod = await import("jspdf");
  const autoTableMod = await import("jspdf-autotable");
  const JsPDF = jspdfMod.default ?? jspdfMod.jsPDF;
  const autoTable = (autoTableMod.default ?? autoTableMod) as unknown as (doc: unknown, opts: unknown) => void;

  const doc = new JsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(data.title, 40, 50);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text(`Reality Holding · ${data.preparedAt.slice(0, 10)}`, 40, 68);
  doc.setDrawColor(180, 180, 180);
  doc.line(40, 80, pageW - 40, 80);
  doc.setTextColor(20, 20, 20);

  if (data.content.kind === "table") {
    autoTable(doc, {
      startY: 100,
      head: [data.content.columns],
      body: data.content.rows.map((r) => r.map((c) => String(c))),
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [40, 90, 72], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [248, 248, 250] },
    });
    if (data.content.summary) {
      const finalY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 100;
      doc.setFontSize(10);
      doc.text(data.content.summary, 40, finalY + 24, { maxWidth: pageW - 80 });
    }
  } else if (data.content.kind === "text") {
    doc.setFontSize(11);
    const lines = doc.splitTextToSize(data.content.body, pageW - 80);
    doc.text(lines, 40, 110);
  } else {
    let y = 110;
    for (const s of data.content.sections) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text(s.heading, 40, y);
      y += 18;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const lines = doc.splitTextToSize(s.body, pageW - 80);
      doc.text(lines, 40, y);
      y += lines.length * 14 + 12;
      if (y > 760) { doc.addPage(); y = 60; }
    }
  }

  // Footer
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Reality Holding · Generated by Back Office Agent · ${i} / ${pages}`,
      pageW / 2,
      doc.internal.pageSize.getHeight() - 24,
      { align: "center" },
    );
  }

  doc.save(`${filename}.pdf`);
}

// ─── Excel generation (xlsx / SheetJS) ─────────────────────────────────
async function generateExcel(filename: string, data: Data) {
  const XLSX = await import("xlsx");
  const wb = XLSX.utils.book_new();

  if (data.content.kind === "table") {
    const aoa: (string | number)[][] = [data.content.columns, ...data.content.rows];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    // simple column widths
    ws["!cols"] = data.content.columns.map(() => ({ wch: 18 }));
    XLSX.utils.book_append_sheet(wb, ws, "Data");
    if (data.content.summary) {
      const sws = XLSX.utils.aoa_to_sheet([[data.content.summary]]);
      XLSX.utils.book_append_sheet(wb, sws, "Shrnutí");
    }
  } else if (data.content.kind === "text") {
    const ws = XLSX.utils.aoa_to_sheet([["Obsah"], [data.content.body]]);
    ws["!cols"] = [{ wch: 100 }];
    XLSX.utils.book_append_sheet(wb, ws, "Text");
  } else {
    for (const s of data.content.sections) {
      const ws = XLSX.utils.aoa_to_sheet([[s.heading], [s.body]]);
      ws["!cols"] = [{ wch: 100 }];
      XLSX.utils.book_append_sheet(wb, ws, s.heading.slice(0, 31).replace(/[\\/?*\[\]:]/g, "-"));
    }
  }

  XLSX.writeFile(wb, `${filename}.xlsx`);
}
