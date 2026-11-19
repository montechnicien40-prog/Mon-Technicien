import { WorkbookData } from '../types/proteck';
import { computeTechnicianSummaries, formatAmount } from '../utils/calculations';

interface TechniciansViewProps {
  workbookData: WorkbookData;
}

export function TechniciansView({ workbookData }: TechniciansViewProps) {
  const summaries = computeTechnicianSummaries(workbookData);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Activité par technicien
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Suivi des interventions assignées (colonne jaune Technicien) sur l’ensemble des onglets.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                <th className="px-5 py-3">Technicien</th>
                <th className="px-4 py-3 text-right">Dossiers</th>
                <th className="px-4 py-3 text-right">Terminés / Soldés</th>
                <th className="px-4 py-3 text-right">En cours</th>
                <th className="px-4 py-3 text-right">Volume Coût</th>
                <th className="px-4 py-3 text-right">Montant encaissé</th>
                <th className="px-5 py-3 text-right">Reste à percevoir</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {summaries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-xs text-slate-500">
                    Aucune intervention enregistrée pour le moment.
                  </td>
                </tr>
              ) : (
                summaries.map((tech) => (
                  <tr key={tech.technicien} className="hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <span className="inline-block rounded bg-[#FFF34F] px-2 py-0.5 font-semibold text-slate-950">
                        {tech.technicien}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-800 tabular-nums">
                      {tech.projets}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-emerald-700 tabular-nums">
                      {tech.termines}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-amber-700 tabular-nums">
                      {tech.enCours}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-medium text-slate-900 tabular-nums">
                      {formatAmount(tech.totalCout) || '0'}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-emerald-700 tabular-nums">
                      {formatAmount(tech.totalEncaisse) || '0'}
                    </td>
                    <td className="px-5 py-3 text-right font-mono font-semibold text-red-600 tabular-nums">
                      {formatAmount(tech.resteAPercevoir) || '0'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
