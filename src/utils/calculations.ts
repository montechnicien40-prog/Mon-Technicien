import { SheetName, SheetRow, SheetStats, WorkbookData } from '../types/proteck';

/**
 * Computes the "Reste à payer" (Column J) for an entry row.
 * Matches the Proteck Excel rule:
 * - When `solde` (Column K, green) is filled, the account is settled -> reste is null (red empty indicator).
 * - If `resteManual` is explicitly provided (number >= 0), use it.
 * - Otherwise, if both `cout` and `acompte` are > 0 and `cout > acompte`, return `cout - acompte`.
 * - If `cout > 0` and `acompte` is empty and `solde` is empty, return null (red empty cell in Excel until an acompte is logged,
 *   unless status is CREANCE/EN COURS with explicit tracking — we still count unpaid exposure in `computeUnpaidExposure`).
 */
export function computeRowReste(row: SheetRow): number | null {
  if (row.kind !== 'entry') return null;
  if (row.solde !== null && row.solde > 0) return null;
  if (row.resteManual !== undefined && row.resteManual !== null) {
    return row.resteManual > 0 ? row.resteManual : null;
  }
  if (row.cout !== null && row.cout > 0 && row.acompte !== null && row.acompte > 0) {
    const diff = row.cout - row.acompte;
    return diff > 0 ? diff : null;
  }
  return null;
}

/**
 * Computes true unpaid exposure for a row (used for CREANCE aggregation & collection rate).
 */
export function computeUnpaidAmount(row: SheetRow): number {
  if (row.kind !== 'entry') return 0;
  if (row.solde !== null && row.solde > 0) {
    if (row.cout !== null && row.cout > row.solde) {
      return row.cout - row.solde;
    }
    return 0;
  }
  const cout = row.cout ?? 0;
  const acompte = row.acompte ?? 0;
  if (cout <= 0) return 0;
  return Math.max(0, cout - acompte);
}

/**
 * Checks if the remaining amount (Col J) should be rendered in crimson red alert style
 * (like row 112 `405 000` in EN COURS).
 */
export function isResteAlert(row: SheetRow): boolean {
  if (row.resteAlert) return true;
  const upper = row.commentaire.toUpperCase();
  return upper.includes('EN COURS') || upper.includes('RETARD') || upper.includes('RELANCE');
}

export function formatAmount(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '';
  return Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

export function parseAmountInput(raw: string): number | null {
  const cleaned = raw.replace(/\s+/g, '').replace(/[^\d-]/g, '');
  if (!cleaned) return null;
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : null;
}

export function formatTodayFr(): string {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = now.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export function formatTodayIso(): string {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = now.getFullYear();
  return `${yyyy}-${mm}-${dd}`;
}

export function frDateToIso(fr: string): string {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(fr.trim());
  if (!match) return '';
  return `${match[3]}-${match[2]}-${match[1]}`;
}

export function isoDateToFr(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!match) return iso;
  return `${match[3]}/${match[2]}/${match[1]}`;
}

export function computeSheetStats(rows: SheetRow[]): SheetStats {
  let entryCount = 0;
  let terminatedCount = 0;
  let inProgressCount = 0;
  let waitingCount = 0;
  let totalCout = 0;
  let totalAcompte = 0;
  let totalReste = 0;
  let totalSolde = 0;
  let totalEncaisse = 0;

  for (const row of rows) {
    if (row.kind !== 'entry') continue;
    entryCount += 1;

    const status = row.commentaire.toUpperCase();
    if (status.includes('TERMINEE') || status.includes('SOLDE')) {
      terminatedCount += 1;
    } else if (status.includes('EN COURS')) {
      inProgressCount += 1;
    } else if (status.includes('ATTENTE')) {
      waitingCount += 1;
    }

    const cout = row.cout ?? 0;
    const acompte = row.acompte ?? 0;
    const solde = row.solde ?? 0;
    const reste = computeRowReste(row) ?? 0;

    totalCout += cout;
    totalAcompte += acompte;
    totalReste += reste;
    totalSolde += solde;

    if (solde > 0) {
      totalEncaisse += solde;
    } else if (acompte > 0) {
      totalEncaisse += acompte;
    }
  }

  const tauxRecouvrement = totalCout > 0 ? Math.min(100, Math.round((totalEncaisse / totalCout) * 100)) : 0;

  return {
    entryCount,
    terminatedCount,
    inProgressCount,
    waitingCount,
    totalCout,
    totalAcompte,
    totalReste,
    totalSolde,
    totalEncaisse,
    tauxRecouvrement,
  };
}

export interface TechnicianSummary {
  technicien: string;
  projets: number;
  termines: number;
  enCours: number;
  totalCout: number;
  totalEncaisse: number;
  resteAPercevoir: number;
}

export function computeTechnicianSummaries(workbook: WorkbookData): TechnicianSummary[] {
  const map = new Map<string, TechnicianSummary>();

  for (const sheetName of Object.keys(workbook) as SheetName[]) {
    if (sheetName === 'CREANCE') continue;
    for (const row of workbook[sheetName]) {
      if (row.kind !== 'entry') continue;
      const tech = row.technicien.trim().toUpperCase() || 'NON ASSIGNÉ';
      const existing = map.get(tech) ?? {
        technicien: tech,
        projets: 0,
        termines: 0,
        enCours: 0,
        totalCout: 0,
        totalEncaisse: 0,
        resteAPercevoir: 0,
      };
      existing.projets += 1;
      const upper = row.commentaire.toUpperCase();
      if (upper.includes('TERMINEE') || upper.includes('SOLDE')) existing.termines += 1;
      if (upper.includes('EN COURS')) existing.enCours += 1;

      const cout = row.cout ?? 0;
      const encaisse = row.solde && row.solde > 0 ? row.solde : (row.acompte ?? 0);
      existing.totalCout += cout;
      existing.totalEncaisse += encaisse;
      existing.resteAPercevoir += computeUnpaidAmount(row);
      map.set(tech, existing);
    }
  }

  return Array.from(map.values()).sort((a, b) => b.totalCout - a.totalCout);
}

export interface UnpaidCrossSheetItem {
  sourceSheet: SheetName;
  row: SheetRow;
  unpaidAmount: number;
}

export function collectUnpaidAcrossSheets(workbook: WorkbookData): UnpaidCrossSheetItem[] {
  const items: UnpaidCrossSheetItem[] = [];
  for (const sheetName of Object.keys(workbook) as SheetName[]) {
    if (sheetName === 'CREANCE') continue;
    for (const row of workbook[sheetName]) {
      if (row.kind !== 'entry') continue;
      const unpaid = computeUnpaidAmount(row);
      if (unpaid > 0) {
        items.push({
          sourceSheet: sheetName,
          row,
          unpaidAmount: unpaid,
        });
      }
    }
  }
  return items.sort((a, b) => b.unpaidAmount - a.unpaidAmount);
}
