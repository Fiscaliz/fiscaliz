import { Document, Packer, Paragraph, HeadingLevel, ImageRun, AlignmentType, PageBreak, TextRun } from "docx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";

export type BlockType =
  | "cover" | "identification" | "introduction" | "methodology"
  | "evidences" | "findings" | "rationale" | "recommendations"
  | "conclusion" | "attachments";

export interface EvidenceItem { url: string; caption?: string; }

export interface ReportBlock {
  id: string;
  type: BlockType;
  title: string;
  content?: string;
  evidences?: EvidenceItem[];
}

export const BLOCK_DEFS: { type: BlockType; label: string }[] = [
  { type: "cover", label: "Capa" },
  { type: "identification", label: "Identificação" },
  { type: "introduction", label: "Introdução" },
  { type: "methodology", label: "Metodologia" },
  { type: "evidences", label: "Evidências" },
  { type: "findings", label: "Achados" },
  { type: "rationale", label: "Fundamentação" },
  { type: "recommendations", label: "Recomendações" },
  { type: "conclusion", label: "Conclusão" },
  { type: "attachments", label: "Anexos" },
];

export function defaultBlock(type: BlockType): ReportBlock {
  const def = BLOCK_DEFS.find((b) => b.type === type)!;
  return { id: crypto.randomUUID(), type, title: def.label, content: "", evidences: [] };
}

// ---------- PDF Export ----------
export async function exportReportPDF(title: string, blocks: ReportBlock[]) {
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 18;
  let y = margin;

  const ensureSpace = (h: number) => {
    if (y + h > pageH - margin) { pdf.addPage(); y = margin; }
  };

  // Cover
  pdf.setFont("helvetica", "bold"); pdf.setFontSize(22);
  pdf.text(title || "Relatório", pageW / 2, 60, { align: "center" });
  pdf.setFont("helvetica", "normal"); pdf.setFontSize(11);
  pdf.text(new Date().toLocaleDateString("pt-BR"), pageW / 2, 72, { align: "center" });
  pdf.addPage(); y = margin;

  for (const b of blocks) {
    if (b.type === "cover") continue; // already rendered
    ensureSpace(14);
    pdf.setFont("helvetica", "bold"); pdf.setFontSize(14);
    pdf.text(b.title, margin, y); y += 8;
    pdf.setFont("helvetica", "normal"); pdf.setFontSize(11);
    if (b.content) {
      const lines = pdf.splitTextToSize(b.content, pageW - margin * 2);
      for (const line of lines) { ensureSpace(6); pdf.text(line, margin, y); y += 6; }
    }
    if (b.evidences && b.evidences.length > 0) {
      y += 2;
      const imgW = (pageW - margin * 2 - 6) / 2;
      const imgH = 55;
      for (let i = 0; i < b.evidences.length; i += 2) {
        ensureSpace(imgH + 10);
        for (let j = 0; j < 2 && i + j < b.evidences.length; j++) {
          const ev = b.evidences[i + j];
          const x = margin + j * (imgW + 6);
          try {
            const dataUrl = await urlToDataUrl(ev.url);
            pdf.addImage(dataUrl, "JPEG", x, y, imgW, imgH, undefined, "FAST");
          } catch { /* skip broken image */ }
          if (ev.caption) {
            pdf.setFontSize(8);
            const lines = pdf.splitTextToSize(ev.caption, imgW);
            pdf.text(lines, x, y + imgH + 4);
            pdf.setFontSize(11);
          }
        }
        y += imgH + 12;
      }
    }
    y += 4;
  }

  pdf.save(`${slug(title)}.pdf`);
}

// ---------- DOCX Export ----------
export async function exportReportDOCX(title: string, blocks: ReportBlock[]) {
  const children: any[] = [
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 2400, after: 400 },
      children: [new TextRun({ text: title || "Relatório", bold: true, size: 44 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: new Date().toLocaleDateString("pt-BR"), size: 22 })] }),
    new Paragraph({ children: [new PageBreak()] }),
  ];

  for (const b of blocks) {
    if (b.type === "cover") continue;
    children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 200, after: 120 },
      children: [new TextRun({ text: b.title, bold: true })] }));
    if (b.content) {
      for (const p of b.content.split(/\n+/)) {
        children.push(new Paragraph({ children: [new TextRun(p)] }));
      }
    }
    if (b.evidences && b.evidences.length > 0) {
      for (const ev of b.evidences) {
        try {
          const buf = await urlToArrayBuffer(ev.url);
          children.push(new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new ImageRun({
              type: "jpg",
              data: buf,
              transformation: { width: 360, height: 240 },
              altText: { title: ev.caption ?? "Evidência", description: ev.caption ?? "", name: "evidence" },
            } as any)],
          }));
          if (ev.caption) {
            children.push(new Paragraph({ alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: ev.caption, italics: true, size: 18 })] }));
          }
        } catch { /* skip */ }
      }
    }
  }

  const doc = new Document({ sections: [{ children }] });
  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${slug(title)}.docx`);
}

// ---------- Helpers ----------
async function urlToDataUrl(url: string): Promise<string> {
  const blob = await (await fetch(url)).blob();
  return await new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}
async function urlToArrayBuffer(url: string): Promise<ArrayBuffer> {
  return await (await fetch(url)).arrayBuffer();
}
function slug(s: string) {
  return (s || "relatorio").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
}
