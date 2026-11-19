import { ArrowRight } from 'lucide-react';
import {
  SHEET_DESCRIPTIONS,
  SHEET_NAMES,
  SheetName,
  WorkbookData,
} from '../types/proteck';
import {
  collectUnpaidAcrossSheets,
  computeSheetStats,
  formatAmount,
} from '../utils/calculations';

interface FinancialOverviewProps {
  workbookData: WorkbookData;
  onSelectSheet: (sheet: SheetName) => void;
}

export function FinancialOverview({
  workbookData,
  onSelectSheet,
}: FinancialOverviewProps) {
  const perSheet = SHEET_NAMES.map((name) => ({
    name,
    stats: computeSheetStats(workbookData[name]),
  }));

  // Global totals exclude CREANCE so cross-sheet revenue isn't double-counted with unpaid invoices
  const operationalSheets = perSheet.filter((s) => s.name !== 'CREANCE');
  const globalCout = operationalSheets.reduce((a, s) => a + s.stats.totalCout, 0);
  const globalEncaisse = operationalSheets.reduce(
    (a, s) => a + s.stats.totalEncaisse,
    0
  );
  const globalReste = operationalSheets.reduce((a, s) => a + s.stats.totalReste, 0);
  const globalSolde = operationalSheets.reduce((a, s) => a + s.stats.totalSolde, 0);
  const globalRate =
    globalCout > 0 ? Math.min(100, Math.round((globalEncaisse / globalCout) * 100)) : 0;

  const unpaidItems = collectUnpaidAcrossSheets(workbookData);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Synthèse financière multi-onglets
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Consolidation des 6 onglets opérationnels et suivi des créances clients.
          </p>
        </div>
      </div>

      {/* Global KPI Strip */}
      <div className="grid grid-cols-1 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white sm:grid-cols-4 sm:divide-x sm:divide-y-0">
        <div className="p-5">
          <div className="text-xs font-medium text-slate-500">Chiffre engagé (Coût)</div>
          <div className="mt-1.5 font-mono text-2xl font-bold text-slate-900 tabular-nums">
            {formatAmount(globalCout)}
          </div>
          <div className="mt-1 text-xs text-slate-500">Hors onglet Créance</div>
        </div>
        <div className="p-5">
          <div className="text-xs font-medium text-slate-500">Total encaissé</div>
          <div className="mt-1.5 font-mono text-2xl font-bold text-emerald-700 tabular-nums">
            {formatAmount(globalEncaisse)}
          </div>
          <div className="mt-1 text-xs text-slate-500 tabular-nums">
            Taux de recouvrement : {globalRate}%
          </div>
        </div>
        <div className="p-5">
          <div className="text-xs font-medium text-slate-500">Total soldé (Col K)</div>
          <div className="mt-1.5 font-mono text-2xl font-bold text-slate-900 tabular-nums">
            {formatAmount(globalSolde)}
          </div>
          <div className="mt-1 text-xs text-slate-500">Dossiers clôturés</div>
        </div>
        <div className="p-5">
          <div className="text-xs font-medium text-slate-500">Reste actif (Col J)</div>
          <div className="mt-1.5 font-mono text-2xl font-bold text-red-600 tabular-nums">
            {formatAmount(globalReste)}
          </div>
          <div className="mt-1 text-xs text-slate-500 tabular-nums">
            {unpaidItems.length} dossier(s) avec solde dû
          </div>
        </div>
      </div>

      {/* Per-sheet table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-3.5">
          <h2 className="text-sm font-semibold text-slate-900">
            Répartition par onglet du classeur
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                <th className="px-5 py-3">Onglet</th>
                <th className="px-4 py-3 text-right">Dossiers</th>
                <th className="px-4 py-3 text-right">Terminés</th>
                <th className="px-4 py-3 text-right">En cours</th>
                <th className="px-4 py-3 text-right">Coût total</th>
                <th className="px-4 py-3 text-right">Acomptes</th>
                <th className="px-4 py-3 text-right">Reste (Col J)</th>
                <th className="px-4 py-3 text-right">Soldé (Col K)</th>
                <th className="px-4 py-3">Recouvrement</th>
                <th className="px-5 py-3 text-right">Accès</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {perSheet.map(({ name, stats }) => (
                <tr key={name} className="hover:bg-slate-50">
                  <td className="px-5 py-3">
                    <div className="font-semibold text-slate-900">{name}</div>
                    <div className="text-[11px] text-slate-500">
                      {SHEET_DESCRIPTIONS[name]}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-700 tabular-nums">
                    {stats.entryCount}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-emerald-700 tabular-nums">
                    {stats.terminatedCount}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-amber-700 tabular-nums">
                    {stats.inProgressCount}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-medium text-slate-900 tabular-nums">
                    {formatAmount(stats.totalCout) || '0'}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-sky-700 tabular-nums">
                    {formatAmount(stats.totalAcompte) || '0'}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-semibold text-red-600 tabular-nums">
                    {formatAmount(stats.totalReste) || '0'}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-semibold text-emerald-700 tabular-nums">
                    {formatAmount(stats.totalSolde) || '0'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full bg-emerald-600"
                          style={{ width: `${stats.tauxRecouvrement}%` }}
                        />
                      </div>
                      <span className="font-mono text-[11px] text-slate-600 tabular-nums">
                        {stats.tauxRecouvrement}%
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => onSelectSheet(name)}
                      className="inline-flex items-center gap-1 font-medium text-slate-700 hover:text-emerald-700"
                    >
                      <span>Ouvrir</span>
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Unpaid Balances Across Sheets */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Dossiers avec solde restant à percevoir
            </h2>
            <p className="text-xs text-slate-500">
              Détectés automatiquement sur tous les onglets (Coût non entièrement soldé).
            </p>
          </div>
          <span className="font-mono text-xs font-semibold text-red-600 tabular-nums">
            {unpaidItems.length} dossier(s)
          </span>
        </div>

        {unpaidItems.length === 0 ? (
          <div className="px-5 py-8 text-center text-xs text-slate-500">
            Aucun impayé détecté sur les onglets opérationnels.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                  <th className="px-5 py-2.5">Date</th>
                  <th className="px-4 py-2.5">Onglet</th>
                  <th className="px-4 py-2.5">Client / Projet</th>
                  <th className="px-4 py-2.5">Technicien</th>
                  <th className="px-4 py-2.5 text-right">Coût</th>
                  <th className="px-4 py-2.5 text-right">Acompte</th>
                  <th className="px-4 py-2.5 text-right">Reste dû</th>
                  <th className="px-5 py-2.5">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {unpaidItems.map(({ sourceSheet, row, unpaidAmount }) => (
                  <tr
                    key={`${sourceSheet}-${row.id}`}
                    onClick={() => onSelectSheet(sourceSheet)}
                    className="cursor-pointer hover:bg-slate-50"
                  >
                    <td className="px-5 py-2.5 font-mono text-slate-600 tabular-nums">
                      {row.date || '—'}
                    </td>
                    <td className="px-4 py-2.5 font-semibold text-slate-700">
                      {sourceSheet}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="font-medium text-slate-900">
                        {row.client || row.projet || row.typeProjet}
                      </span>
                      {row.client && row.projet && (
                        <span className="text-slate-600"> · {row.projet}</span>
                      )}
                      {(row.client || row.projet) && (
                        <span className="text-slate-500"> · {row.typeProjet}</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-slate-700">
                      {row.technicien || '—'}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-slate-900 tabular-nums">
                      {formatAmount(row.cout)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-sky-700 tabular-nums">
                      {formatAmount(row.acompte) || '0'}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono font-bold text-red-600 tabular-nums">
                      {formatAmount(unpaidAmount)}
                    </td>
                    <td className="px-5 py-2.5 text-slate-700">{row.commentaire}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
