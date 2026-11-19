import { useState } from 'react';
import { Download, FileSpreadsheet, X } from 'lucide-react';
import { SHEET_NAMES, SheetName, WorkbookData } from '../types/proteck';
import { exportWorkbookToExcel } from '../utils/exportExcel';
import { computeSheetStats } from '../utils/calculations';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  workbookData: WorkbookData;
  activeSheet: SheetName;
  onExportSuccess: (fileName: string) => void;
}

export function ExportModal({
  isOpen,
  onClose,
  workbookData,
  activeSheet,
  onExportSuccess,
}: ExportModalProps) {
  const [scope, setScope] = useState<'all' | 'current'>('all');
  const [includeClientColumns, setIncludeClientColumns] = useState(true);
  const [customName, setCustomName] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const totalEntries = SHEET_NAMES.reduce(
    (acc, name) => acc + computeSheetStats(workbookData[name]).entryCount,
    0
  );
  const currentEntries = computeSheetStats(workbookData[activeSheet]).entryCount;

  const handleExport = async () => {
    setIsExporting(true);
    setErrorMessage(null);
    try {
      const sanitizedName = customName.trim()
        ? customName.trim().endsWith('.xlsx')
          ? customName.trim()
          : `${customName.trim()}.xlsx`
        : undefined;

      const fileName = await exportWorkbookToExcel(workbookData, {
        scope,
        activeSheet,
        includeClientColumns,
        fileName: sanitizedName,
      });
      onExportSuccess(fileName);
      onClose();
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Impossible de générer le fichier Excel. Veuillez réessayer.'
      );
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
    >
      <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <FileSpreadsheet className="h-5 w-5 text-emerald-700" aria-hidden="true" />
            <h2 id="export-modal-title" className="text-base font-semibold text-slate-900">
              Exporter vers Microsoft Excel (.xlsx)
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 px-6 py-5">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Contenu du classeur
            </p>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setScope('all')}
                className={`rounded-lg border p-3 text-left transition-colors ${
                  scope === 'all'
                    ? 'border-emerald-600 bg-emerald-50/60 text-slate-900'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="text-sm font-semibold">Classeur complet</div>
                <div className="mt-0.5 text-xs text-slate-600 tabular-nums">
                  7 onglets · {totalEntries} dossiers
                </div>
              </button>

              <button
                type="button"
                onClick={() => setScope('current')}
                className={`rounded-lg border p-3 text-left transition-colors ${
                  scope === 'current'
                    ? 'border-emerald-600 bg-emerald-50/60 text-slate-900'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="text-sm font-semibold">Onglet {activeSheet}</div>
                <div className="mt-0.5 text-xs text-slate-600 tabular-nums">
                  1 onglet · {currentEntries} dossiers
                </div>
              </button>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Structure des colonnes
            </p>
            <div className="space-y-2">
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3 hover:bg-slate-50">
                <input
                  type="radio"
                  name="colStructure"
                  checked={includeClientColumns}
                  onChange={() => setIncludeClientColumns(true)}
                  className="mt-0.5 h-4 w-4 accent-emerald-700"
                />
                <div>
                  <div className="text-sm font-medium text-slate-900">
                    Format complet (Colonnes A à L)
                  </div>
                  <div className="text-xs text-slate-600">
                    DATE, CLIENT, CONTACT, LOCALISATION, PROJET en A–E et TYPE DE PROJET, TECHNICIEN, COUT, ACOMPTE, RESTE, SOLDE, COMMENTAIRE en F–L.
                  </div>
                </div>
              </label>

              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3 hover:bg-slate-50">
                <input
                  type="radio"
                  name="colStructure"
                  checked={!includeClientColumns}
                  onChange={() => setIncludeClientColumns(false)}
                  className="mt-0.5 h-4 w-4 accent-emerald-700"
                />
                <div>
                  <div className="text-sm font-medium text-slate-900">
                    Format compact (Date + 7 colonnes Africa Engie)
                  </div>
                  <div className="text-xs text-slate-600">
                    Inclut Date, Type de projet, Technicien, Coût, Acompte, Reste, Solde et Commentaire.
                  </div>
                </div>
              </label>
            </div>
          </div>

          <div>
            <label
              htmlFor="excel-filename"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              Nom du fichier (optionnel)
            </label>
            <input
              id="excel-filename"
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="FICHIER_EXCEL_AFRICA_ENGIE.xlsx"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none"
            />
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
            Le fichier généré conserve les codes couleurs Africa Engie (Jaune pour Technicien/Coût, Bleu pour Acompte, Blanc/Rouge pour Reste, Vert pour Solde), les séparateurs gris de lots et les formules Excel de calcul automatique.
          </div>

          {errorMessage && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {errorMessage}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-800 disabled:opacity-60"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            <span>{isExporting ? 'Génération...' : 'Télécharger .xlsx'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
