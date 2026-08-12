'use client';

import { useCallback, useState } from 'react';

import {
  buildPdfFilename,
  buildReportSummary,
  formatReportTimestamp,
  PDF_COLUMN_WIDTHS,
  PDF_HEADERS,
  rowsToPdfBody,
} from '@/helpers/pdf-report';
import type { SheetRowData } from '@/interfaces/tr-sheet';

interface GenerateOptions {
  rows: readonly SheetRowData[];
  /** Shown under the title, e.g. "12 registros selecionados". */
  scopeLabel: string;
  userName?: string;
}

const MARGIN = 12;

export function usePdfReport() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async ({ rows, scopeLabel, userName }: GenerateOptions) => {
    if (rows.length === 0) return;

    setIsGenerating(true);
    setError(null);

    try {
      /**
       * Dynamic import is the whole point. jspdf + autotable is ~130 KB gzipped;
       * loading it eagerly would tax every dashboard visit for a feature most
       * sessions never touch. Parallel because autotable does not re-export jspdf.
       */
      const [{ default: JsPDF }, { default: autoTable }] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable'),
      ]);

      // Landscape: eight columns will not fit portrait A4 legibly.
      const doc = new JsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const summary = buildReportSummary(rows);
      const timestamp = formatReportTimestamp();

      // ── Header ──────────────────────────────────────────────────────────
      doc.setFontSize(16);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text("Controle de ITR's", MARGIN, MARGIN + 4);

      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text(scopeLabel, MARGIN, MARGIN + 10);
      doc.text(
        userName ? `Emitido por ${userName} · ${timestamp}` : `Emitido em ${timestamp}`,
        pageWidth - MARGIN,
        MARGIN + 10,
        { align: 'right' }
      );

      // ── Summary strip ───────────────────────────────────────────────────
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      const summaryLine = [
        `Total: ${summary.total}`,
        `Entregues: ${summary.done}`,
        `Pendentes: ${summary.pending}`,
        `Documentos inválidos: ${summary.invalidDocument}`,
        `Conclusão: ${summary.completion}%`,
      ].join('     ');
      doc.text(summaryLine, MARGIN, MARGIN + 18);

      // ── Table ───────────────────────────────────────────────────────────
      autoTable(doc, {
        startY: MARGIN + 23,
        margin: { left: MARGIN, right: MARGIN, bottom: MARGIN + 6 },
        head: [[...PDF_HEADERS]],
        body: rowsToPdfBody(rows),
        theme: 'grid',
        styles: {
          fontSize: 7.5,
          cellPadding: 1.6,
          overflow: 'linebreak',
          textColor: [30, 41, 59],
          lineColor: [226, 232, 240],
          lineWidth: 0.1,
        },
        headStyles: {
          fillColor: [15, 23, 42],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 7.5,
        },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: Object.fromEntries(
          PDF_COLUMN_WIDTHS.map((width, index) => [index, { cellWidth: width }])
        ),
        /**
         * Colour-codes the two columns an accountant scans for. Doing this in
         * didParseCell rather than pre-baking styles into the body keeps
         * rowsToPdfBody a pure string transform.
         */
        didParseCell: (data) => {
          if (data.section !== 'body') return;

          if (data.column.index === 0) {
            data.cell.styles.textColor = data.cell.raw === 'ENTREGUE' ? [4, 120, 87] : [180, 83, 9];
            data.cell.styles.fontStyle = 'bold';
          }

          if (data.column.index === 3 && data.cell.raw === 'Não') {
            data.cell.styles.textColor = [185, 28, 28];
            data.cell.styles.fontStyle = 'bold';
          }
        },
        // Runs per page — the only reliable place to number pages.
        didDrawPage: (data) => {
          const pageHeight = doc.internal.pageSize.getHeight();
          const current = doc.getNumberOfPages();

          doc.setFontSize(7.5);
          doc.setTextColor(148, 163, 184); // slate-400
          doc.text(
            'Documento gerado automaticamente — confira os dados na planilha de origem.',
            data.settings.margin.left,
            pageHeight - 6
          );
          doc.text(`Página ${current}`, pageWidth - MARGIN, pageHeight - 6, { align: 'right' });
        },
      });

      doc.save(buildPdfFilename());
    } catch (caught) {
      // Most likely cause is a chunk-load failure on a flaky connection.
      setError(
        caught instanceof Error ? caught.message : 'Não foi possível gerar o relatório em PDF.'
      );
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return { generate, isGenerating, error, clearError: () => setError(null) };
}
