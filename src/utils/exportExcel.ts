import ExcelJS from 'exceljs';
import { SHEET_NAMES, SheetName, SheetRow, WorkbookData } from '../types/proteck';
import {
  computeRowReste,
  computeSheetStats,
  formatTodayFr,
  isResteAlert,
} from './calculations';

export interface ExportOptions {
  scope: 'all' | 'current';
  activeSheet: SheetName;
  includeClientColumns: boolean;
  fileName?: string;
}

const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: 'FF1E293B' } },
  left: { style: 'thin', color: { argb: 'FF1E293B' } },
  bottom: { style: 'thin', color: { argb: 'FF1E293B' } },
  right: { style: 'thin', color: { argb: 'FF1E293B' } },
};

const SHEET_TAB_COLORS: Record<SheetName, string> = {
  INSTALLATION: '16A34A',
  VISITE: '2563EB',
  PROSPECTION: 'D97706',
  MAINTENANCE: '0D9488',
  SAV: '7C3AED',
  DEPANNAGE: 'EA580C',
  CREANCE: 'DC2626',
};

function applyProteckSheet(
  workbook: ExcelJS.Workbook,
  sheetName: SheetName,
  rows: SheetRow[],
  includeClientColumns: boolean
) {
  const ws = workbook.addWorksheet(sheetName, {
    properties: { tabColor: { argb: `FF${SHEET_TAB_COLORS[sheetName]}` } },
    views: [{ state: 'frozen', ySplit: 3 }],
  });

  // Column setup:
  // If includeClientColumns is true (Columns A..L):
  // A=DATE, B=CLIENT, C=CONTACT, D=LOCALISATION, E=PROJET, F=TYPE DE PROJET, G=TECHNICIEN, H=COUT, I=ACOMPTE, J=RESTE, K=SOLDE, L=COMMENTAIRE
  const columns = includeClientColumns
    ? [
        { header: 'DATE', key: 'date', width: 13 },
        { header: 'CLIENT', key: 'client', width: 24 },
        { header: 'CONTACT', key: 'contact', width: 16 },
        { header: 'LOCALISATION', key: 'localisation', width: 20 },
        { header: 'PROJET', key: 'projet', width: 24 },
        { header: 'TYPE DE PROJET', key: 'typeProjet', width: 18 },
        { header: 'TECHNICIEN', key: 'technicien', width: 16 },
        { header: 'COUT', key: 'cout', width: 15 },
        { header: 'ACOMPTE', key: 'acompte', width: 15 },
        { header: 'RESTE', key: 'reste', width: 15 },
        { header: 'SOLDE', key: 'solde', width: 15 },
        { header: 'COMMENTAIRE', key: 'commentaire', width: 24 },
      ]
    : [
        { header: 'DATE', key: 'date', width: 13 },
        { header: 'TYPE DE PROJET', key: 'typeProjet', width: 20 },
        { header: 'TECHNICIEN', key: 'technicien', width: 18 },
        { header: 'COUT', key: 'cout', width: 16 },
        { header: 'ACOMPTE', key: 'acompte', width: 16 },
        { header: 'RESTE', key: 'reste', width: 16 },
        { header: 'SOLDE', key: 'solde', width: 16 },
        { header: 'COMMENTAIRE', key: 'commentaire', width: 26 },
      ];

  ws.columns = columns.map((c) => ({ width: c.width }));

  const totalCols = columns.length;
  const colOffset = includeClientColumns ? 5 : 1; // F is index 6 when colOffset=5; compact starts after DATE
  const typeCol = colOffset + 1;
  const techCol = colOffset + 2;
  const coutCol = colOffset + 3;
  const acompteCol = colOffset + 4;
  const resteCol = colOffset + 5;
  const soldeCol = colOffset + 6;
  const commentCol = colOffset + 7;

  const colLetter = (idx: number) => {
    let n = idx;
    let s = '';
    while (n > 0) {
      const m = (n - 1) % 26;
      s = String.fromCharCode(65 + m) + s;
      n = Math.floor((n - m) / 26);
    }
    return s;
  };

  // Row 1: Title Banner
  const stats = computeSheetStats(rows);
  const titleRow = ws.getRow(1);
  titleRow.height = 26;
  ws.mergeCells(1, 1, 1, totalCols);
  const titleCell = ws.getCell(1, 1);
  titleCell.value = `AFRICA ENGIE — ONGLET ${sheetName}`;
  titleCell.font = { name: 'Calibri', size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };

  // Row 2: Quick Summary Line
  const infoRow = ws.getRow(2);
  infoRow.height = 19;
  ws.mergeCells(2, 1, 2, totalCols);
  const infoCell = ws.getCell(2, 1);
  infoCell.value = `Date: ${formatTodayFr()}  |  Dossiers: ${stats.entryCount}  |  Total Coût: ${stats.totalCout.toLocaleString('fr-FR')}  |  Soldé: ${stats.totalSolde.toLocaleString('fr-FR')}  |  Reste à percevoir: ${stats.totalReste.toLocaleString('fr-FR')}`;
  infoCell.font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF334155' } };
  infoCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
  infoCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };

  // Row 3: Column Headers (matching row 130 style)
  const headerRow = ws.getRow(3);
  headerRow.height = 22;
  columns.forEach((col, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = col.header;
    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF0F172A' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
    cell.alignment = { vertical: 'middle', horizontal: i + 1 >= coutCol && i + 1 <= soldeCol ? 'center' : 'left' };
    cell.border = THIN_BORDER;
  });

  // Data rows start at Row 4
  let currentExcelRow = 4;
  const dataStartRow = 4;

  for (const row of rows) {
    const excelRow = ws.getRow(currentExcelRow);

    if (row.kind === 'separator') {
      excelRow.height = 16;
      for (let c = 1; c <= totalCols; c += 1) {
        const cell = excelRow.getCell(c);
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFA6A6A6' } };
        cell.border = THIN_BORDER;
        if (c === typeCol && row.groupLabel) {
          cell.value = row.groupLabel.toUpperCase();
          cell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF1E293B' } };
        }
      }
      currentExcelRow += 1;
      continue;
    }

    excelRow.height = 20;

    if (includeClientColumns) {
      const cDate = excelRow.getCell(1);
      cDate.value = row.date || '';
      cDate.font = { name: 'Calibri', size: 10 };
      cDate.alignment = { vertical: 'middle', horizontal: 'center' };
      cDate.border = THIN_BORDER;

      const cClient = excelRow.getCell(2);
      cClient.value = row.client || '';
      cClient.font = { name: 'Calibri', size: 10 };
      cClient.alignment = { vertical: 'middle', horizontal: 'left' };
      cClient.border = THIN_BORDER;

      const cContact = excelRow.getCell(3);
      cContact.value = row.contact || '';
      cContact.font = { name: 'Calibri', size: 10 };
      cContact.alignment = { vertical: 'middle', horizontal: 'left' };
      cContact.border = THIN_BORDER;

      const cLoc = excelRow.getCell(4);
      cLoc.value = row.localisation || '';
      cLoc.font = { name: 'Calibri', size: 10 };
      cLoc.alignment = { vertical: 'middle', horizontal: 'left' };
      cLoc.border = THIN_BORDER;

      const cProjet = excelRow.getCell(5);
      cProjet.value = row.projet || '';
      cProjet.font = { name: 'Calibri', size: 10 };
      cProjet.alignment = { vertical: 'middle', horizontal: 'left' };
      cProjet.border = THIN_BORDER;
    } else {
      const cDate = excelRow.getCell(1);
      cDate.value = row.date || '';
      cDate.font = { name: 'Calibri', size: 10 };
      cDate.alignment = { vertical: 'middle', horizontal: 'center' };
      cDate.border = THIN_BORDER;
    }

    // F: TYPE DE PROJET
    const cType = excelRow.getCell(typeCol);
    cType.value = row.typeProjet.toUpperCase();
    cType.font = { name: 'Calibri', size: 10 };
    cType.alignment = { vertical: 'middle', horizontal: 'left' };
    cType.border = THIN_BORDER;

    // G: TECHNICIEN (Yellow #FFFF00)
    const cTech = excelRow.getCell(techCol);
    cTech.value = row.technicien.toUpperCase();
    cTech.font = { name: 'Calibri', size: 10, bold: Boolean(row.technicien) };
    cTech.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } };
    cTech.alignment = { vertical: 'middle', horizontal: 'center' };
    cTech.border = THIN_BORDER;

    // H: COUT (Yellow #FFFF00)
    const cCout = excelRow.getCell(coutCol);
    cCout.value = row.cout !== null ? row.cout : null;
    cCout.numFmt = '# ##0';
    cCout.font = { name: 'Calibri', size: 10 };
    cCout.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } };
    cCout.alignment = { vertical: 'middle', horizontal: 'right' };
    cCout.border = THIN_BORDER;

    // I: ACOMPTE (Blue #5B9BD5)
    const cAcompte = excelRow.getCell(acompteCol);
    cAcompte.value = row.acompte !== null ? row.acompte : null;
    cAcompte.numFmt = '# ##0';
    cAcompte.font = { name: 'Calibri', size: 10 };
    cAcompte.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF5B9BD5' } };
    cAcompte.alignment = { vertical: 'middle', horizontal: 'right' };
    cAcompte.border = THIN_BORDER;

    // J: RESTE (White if active balance due, Red #FF0000 if empty/settled)
    const resteVal = computeRowReste(row);
    const cReste = excelRow.getCell(resteCol);
    const hRef = `${colLetter(coutCol)}${currentExcelRow}`;
    const iRef = `${colLetter(acompteCol)}${currentExcelRow}`;
    const kRef = `${colLetter(soldeCol)}${currentExcelRow}`;

    if (resteVal !== null && resteVal > 0) {
      if (row.resteManual !== undefined && row.resteManual !== null) {
        cReste.value = row.resteManual;
      } else {
        cReste.value = {
          formula: `IF(AND(${hRef}>0,${iRef}>0,${kRef}=""),${hRef}-${iRef},"")`,
          result: resteVal,
        };
      }
      cReste.numFmt = '# ##0';
      cReste.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
      cReste.font = {
        name: 'Calibri',
        size: 10,
        bold: isResteAlert(row),
        color: { argb: isResteAlert(row) ? 'FFDC2626' : 'FF0F172A' },
      };
    } else {
      cReste.value = {
        formula: `IF(AND(${hRef}>0,${iRef}>0,${kRef}=""),${hRef}-${iRef},"")`,
        result: '',
      };
      cReste.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF0000' } };
      cReste.font = { name: 'Calibri', size: 10 };
    }
    cReste.alignment = { vertical: 'middle', horizontal: 'right' };
    cReste.border = THIN_BORDER;

    // K: SOLDE (Green #70AD47)
    const cSolde = excelRow.getCell(soldeCol);
    cSolde.value = row.solde !== null ? row.solde : null;
    cSolde.numFmt = '# ##0';
    cSolde.font = { name: 'Calibri', size: 10 };
    cSolde.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF70AD47' } };
    cSolde.alignment = { vertical: 'middle', horizontal: 'right' };
    cSolde.border = THIN_BORDER;

    // L: COMMENTAIRE
    const cComment = excelRow.getCell(commentCol);
    cComment.value = row.commentaire.toUpperCase();
    cComment.font = { name: 'Calibri', size: 10 };
    cComment.alignment = { vertical: 'middle', horizontal: 'left' };
    cComment.border = THIN_BORDER;

    currentExcelRow += 1;
  }

  // Totals Footer Row
  const dataEndRow = Math.max(dataStartRow, currentExcelRow - 1);
  const totalRow = ws.getRow(currentExcelRow);
  totalRow.height = 24;

  for (let c = 1; c <= totalCols; c += 1) {
    const cell = totalRow.getCell(c);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.border = THIN_BORDER;
  }

  totalRow.getCell(typeCol).value = 'TOTAL GENERAL';
  totalRow.getCell(typeCol).alignment = { vertical: 'middle', horizontal: 'left' };

  const sumCols = [
    { col: coutCol, result: stats.totalCout },
    { col: acompteCol, result: stats.totalAcompte },
    { col: resteCol, result: stats.totalReste },
    { col: soldeCol, result: stats.totalSolde },
  ];

  for (const sc of sumCols) {
    const letter = colLetter(sc.col);
    const cell = totalRow.getCell(sc.col);
    cell.value =
      rows.length > 0
        ? {
            formula: `SUM(${letter}${dataStartRow}:${letter}${dataEndRow})`,
            result: sc.result,
          }
        : 0;
    cell.numFmt = '# ##0';
    cell.alignment = { vertical: 'middle', horizontal: 'right' };
  }
}

export async function exportWorkbookToExcel(
  workbookData: WorkbookData,
  options: ExportOptions
): Promise<string> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Africa Engie';
  workbook.created = new Date();
  workbook.modified = new Date();

  const sheetsToExport: SheetName[] =
    options.scope === 'all' ? SHEET_NAMES : [options.activeSheet];

  for (const name of sheetsToExport) {
    applyProteckSheet(workbook, name, workbookData[name], options.includeClientColumns);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const dateTag = new Date().toISOString().slice(0, 10);
  const defaultName =
    options.scope === 'all'
      ? `FICHIER_EXCEL_AFRICA_ENGIE_${dateTag}.xlsx`
      : `AFRICA_ENGIE_${options.activeSheet}_${dateTag}.xlsx`;
  const finalName = options.fileName || defaultName;

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = finalName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);

  return finalName;
}
