import { useEffect, useMemo, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { INITIAL_WORKBOOK_DATA } from './data/initialData';
import {
  SHEET_DESCRIPTIONS,
  SHEET_NAMES,
  SheetName,
  SheetRow,
  WorkbookData,
} from './types/proteck';
import {
  collectUnpaidAcrossSheets,
  computeSheetStats,
  formatAmount,
  formatTodayFr,
} from './utils/calculations';
import { AppView, TopBar } from './components/TopBar';
import { ProteckGrid } from './components/ProteckGrid';
import { AddRowModal } from './components/AddRowModal';
import { ExportModal } from './components/ExportModal';
import { FinancialOverview } from './components/FinancialOverview';
import { TechniciansView } from './components/TechniciansView';

const STORAGE_KEY = 'africa_engie_workbook_v2';

function loadInitialWorkbook(): WorkbookData {
  try {
    window.localStorage.removeItem('systeme_proteck_workbook_v1');
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_WORKBOOK_DATA;
    const parsed = JSON.parse(raw) as Partial<WorkbookData>;
    const hydrated = { ...INITIAL_WORKBOOK_DATA };
    for (const name of SHEET_NAMES) {
      if (Array.isArray(parsed[name])) {
        hydrated[name] = (parsed[name] as SheetRow[]).map((r) => ({
          ...r,
          projet: r.projet ?? '',
        }));
      }
    }
    return hydrated;
  } catch {
    return INITIAL_WORKBOOK_DATA;
  }
}

export default function App() {
  const [workbookData, setWorkbookData] = useState<WorkbookData>(loadInitialWorkbook);
  const [activeView, setActiveView] = useState<AppView>('grid');
  const [activeSheet, setActiveSheet] = useState<SheetName>('INSTALLATION');
  const [showClientColumns, setShowClientColumns] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [undoState, setUndoState] = useState<{
    sheet: SheetName;
    rows: SheetRow[];
    label: string;
  } | null>(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(workbookData));
    } catch {
      // Ignore storage quota errors silently
    }
  }, [workbookData]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    window.setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4500);
  };

  const knownTechnicians = useMemo(() => {
    const set = new Set<string>(['HERMAN', 'MAMADOU', 'GAVOR']);
    for (const name of SHEET_NAMES) {
      for (const row of workbookData[name]) {
        if (row.technicien.trim()) {
          set.add(row.technicien.trim().toUpperCase());
        }
      }
    }
    return Array.from(set).sort();
  }, [workbookData]);

  const activeRows = workbookData[activeSheet];
  const activeStats = useMemo(() => computeSheetStats(activeRows), [activeRows]);

  const handleUpdateRow = (rowId: string, patch: Partial<SheetRow>) => {
    setWorkbookData((prev) => ({
      ...prev,
      [activeSheet]: prev[activeSheet].map((row) =>
        row.id === rowId ? { ...row, ...patch } : row
      ),
    }));
  };

  const handleDeleteRow = (rowId: string) => {
    const previousRows = workbookData[activeSheet];
    const target = previousRows.find((r) => r.id === rowId);
    setUndoState({
      sheet: activeSheet,
      rows: previousRows,
      label: target?.kind === 'separator' ? 'Séparateur supprimé' : 'Ligne supprimée',
    });
    setWorkbookData((prev) => ({
      ...prev,
      [activeSheet]: prev[activeSheet].filter((row) => row.id !== rowId),
    }));
  };

  const handleUndo = () => {
    if (!undoState) return;
    setWorkbookData((prev) => ({
      ...prev,
      [undoState.sheet]: undoState.rows,
    }));
    setUndoState(null);
  };

  const handleAddQuickRow = () => {
    const today = formatTodayFr();
    const newRow: SheetRow = {
      id: `${activeSheet.toLowerCase()}-${Date.now()}`,
      kind: 'entry',
      date: today,
      client: '',
      contact: '',
      localisation: '',
      projet: '',
      typeProjet: 'MAISON',
      technicien: '',
      cout: null,
      acompte: null,
      solde: null,
      commentaire: 'EN COURS',
    };
    setWorkbookData((prev) => ({
      ...prev,
      [activeSheet]: [...prev[activeSheet], newRow],
    }));
  };

  const handleAddModalRow = (rowInput: Omit<SheetRow, 'id'>) => {
    const newRow: SheetRow = {
      ...rowInput,
      id: `${activeSheet.toLowerCase()}-${Date.now()}`,
    };
    setWorkbookData((prev) => ({
      ...prev,
      [activeSheet]: [...prev[activeSheet], newRow],
    }));
    showToast(`Dossier ajouté dans ${activeSheet}.`);
  };

  const handleAddSeparator = () => {
    const sep: SheetRow = {
      id: `sep-${Date.now()}`,
      kind: 'separator',
      date: '',
      client: '',
      contact: '',
      localisation: '',
      projet: '',
      typeProjet: '',
      technicien: '',
      cout: null,
      acompte: null,
      solde: null,
      commentaire: '',
      groupLabel: 'Nouveau lot',
    };
    setWorkbookData((prev) => ({
      ...prev,
      [activeSheet]: [...prev[activeSheet], sep],
    }));
  };

  const handleSettleRow = (rowId: string) => {
    setWorkbookData((prev) => ({
      ...prev,
      [activeSheet]: prev[activeSheet].map((row) => {
        if (row.id !== rowId) return row;
        return {
          ...row,
          solde: row.cout,
          resteManual: null,
          resteAlert: false,
          commentaire: 'TERMINEE/SOLDE',
        };
      }),
    }));
    showToast('Dossier marqué soldé (colonne verte mise à jour).');
  };

  const handleSyncCreances = (): number => {
    const unpaid = collectUnpaidAcrossSheets(workbookData);
    const existingKeys = new Set(
      workbookData.CREANCE.filter((r) => r.kind === 'entry').map(
        (r) => `${r.client.toUpperCase()}|${r.typeProjet}|${r.cout ?? 0}`
      )
    );

    const toAdd: SheetRow[] = [];
    for (const item of unpaid) {
      const key = `${item.row.client.toUpperCase()}|${item.row.typeProjet}|${item.row.cout ?? 0}`;
      if (existingKeys.has(key)) continue;
      existingKeys.add(key);
      toAdd.push({
        ...item.row,
        id: `cre-sync-${item.sourceSheet}-${item.row.id}-${Date.now()}`,
        rowNumber: undefined,
        resteAlert: true,
        commentaire: item.row.commentaire || `CREANCE (${item.sourceSheet})`,
      });
    }

    if (toAdd.length > 0) {
      setWorkbookData((prev) => ({
        ...prev,
        CREANCE: [...prev.CREANCE, ...toAdd],
      }));
    }
    return toAdd.length;
  };

  const handleResetDemo = () => {
    setWorkbookData(INITIAL_WORKBOOK_DATA);
    setConfirmReset(false);
    setUndoState(null);
    showToast('Toutes les données ont été remises à zéro.');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <TopBar
        activeView={activeView}
        onChangeView={setActiveView}
        onOpenExport={() => setIsExportModalOpen(true)}
      />

      {/* Mobile View Switcher */}
      <div className="border-b border-slate-200 bg-white px-4 py-2 md:hidden">
        <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
          {(
            [
              { id: 'grid', label: 'Classeur' },
              { id: 'finance', label: 'Synthèse' },
              { id: 'technicians', label: 'Techniciens' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveView(item.id)}
              className={`flex-1 rounded-md px-2.5 py-1.5 text-xs font-medium ${
                activeView === item.id
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <main className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6">
        {activeView === 'grid' && (
          <div className="space-y-5">
            {/* Sheet Title & 7-Tab Switcher (mirroring the Excel bottom tabs) */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-xl font-bold tracking-tight text-slate-900">
                      Onglet {activeSheet}
                    </h1>
                    <span className="rounded-md border border-slate-200 bg-white px-2.5 py-0.5 font-mono text-xs font-medium text-slate-600 tabular-nums">
                      {formatTodayFr()}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-600">
                    {SHEET_DESCRIPTIONS[activeSheet]}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {confirmReset ? (
                    <div className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs">
                      <span className="text-slate-700">Tout remettre à zéro ?</span>
                      <button
                        type="button"
                        onClick={handleResetDemo}
                        className="font-semibold text-red-600 hover:underline"
                      >
                        Confirmer
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmReset(false)}
                        className="text-slate-500 hover:text-slate-900"
                      >
                        Annuler
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmReset(true)}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 transition-colors hover:text-slate-900"
                    >
                      <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Tout remettre à zéro</span>
                    </button>
                  )}
                </div>
              </div>

              {/* 7 Excel Worksheet Tabs */}
              <div
                role="tablist"
                aria-label="Onglets du classeur Africa Engie"
                className="flex items-center gap-1 overflow-x-auto border-b border-slate-300 pb-0"
              >
                {SHEET_NAMES.map((name) => {
                  const isActive = activeSheet === name;
                  const count = workbookData[name].filter((r) => r.kind === 'entry').length;
                  return (
                    <button
                      key={name}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setActiveSheet(name)}
                      className={`relative flex items-center gap-2 border border-b-0 px-4 py-2 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors rounded-t-lg ${
                        isActive
                          ? 'border-slate-300 bg-white text-emerald-800 after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:bg-white'
                          : 'border-transparent bg-slate-100/80 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
                      }`}
                    >
                      <span>{name}</span>
                      <span className="font-mono text-[11px] font-normal text-slate-500 tabular-nums">
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Sheet 4-Column KPI Strip */}
            <div className="grid grid-cols-2 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white sm:grid-cols-4 sm:divide-x sm:divide-y-0">
              <div className="px-4 py-3.5">
                <div className="text-[11px] font-medium text-slate-500">
                  Coût total ({activeSheet})
                </div>
                <div className="mt-1 font-mono text-lg font-bold text-slate-900 tabular-nums">
                  {formatAmount(activeStats.totalCout) || '0'}
                </div>
                <div className="mt-0.5 text-[11px] text-slate-500 tabular-nums">
                  {activeStats.entryCount} dossiers · {activeStats.inProgressCount} en cours
                </div>
              </div>

              <div className="px-4 py-3.5">
                <div className="text-[11px] font-medium text-slate-500">
                  Acomptes enregistrés
                </div>
                <div className="mt-1 font-mono text-lg font-bold text-sky-700 tabular-nums">
                  {formatAmount(activeStats.totalAcompte) || '0'}
                </div>
                <div className="mt-0.5 text-[11px] text-slate-500">Colonne bleue (Col I)</div>
              </div>

              <div className="px-4 py-3.5">
                <div className="text-[11px] font-medium text-slate-500">
                  Reste à percevoir
                </div>
                <div className="mt-1 font-mono text-lg font-bold text-red-600 tabular-nums">
                  {formatAmount(activeStats.totalReste) || '0'}
                </div>
                <div className="mt-0.5 text-[11px] text-slate-500">
                  Solde partiel (Col J)
                </div>
              </div>

              <div className="px-4 py-3.5">
                <div className="text-[11px] font-medium text-slate-500">
                  Montant soldé
                </div>
                <div className="mt-1 font-mono text-lg font-bold text-emerald-700 tabular-nums">
                  {formatAmount(activeStats.totalSolde) || '0'}
                </div>
                <div className="mt-0.5 text-[11px] text-slate-500 tabular-nums">
                  Recouvrement : {activeStats.tauxRecouvrement}%
                </div>
              </div>
            </div>

            {/* Interactive Spreadsheet Grid */}
            <ProteckGrid
              sheetName={activeSheet}
              rows={activeRows}
              knownTechnicians={knownTechnicians}
              showClientColumns={showClientColumns}
              onToggleClientColumns={() => setShowClientColumns((v) => !v)}
              onUpdateRow={handleUpdateRow}
              onDeleteRow={handleDeleteRow}
              onAddQuickRow={handleAddQuickRow}
              onOpenAddModal={() => setIsAddModalOpen(true)}
              onAddSeparator={handleAddSeparator}
              onSettleRow={handleSettleRow}
              onSyncCreances={
                activeSheet === 'CREANCE' ? handleSyncCreances : undefined
              }
            />
          </div>
        )}

        {activeView === 'finance' && (
          <FinancialOverview
            workbookData={workbookData}
            onSelectSheet={(sheet) => {
              setActiveSheet(sheet);
              setActiveView('grid');
            }}
          />
        )}

        {activeView === 'technicians' && (
          <TechniciansView workbookData={workbookData} />
        )}
      </main>

      {/* Modals */}
      <AddRowModal
        isOpen={isAddModalOpen}
        sheetName={activeSheet}
        knownTechnicians={knownTechnicians}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddModalRow}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        workbookData={workbookData}
        activeSheet={activeSheet}
        onExportSuccess={(fileName) =>
          showToast(`Fichier Excel exporté : ${fileName}`)
        }
      />

      {/* Undo / Toast Bar */}
      {(toastMessage || undoState) && (
        <div className="fixed right-5 bottom-5 z-40 flex flex-col gap-2">
          {undoState && (
            <div className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs text-white shadow-lg">
              <span>{undoState.label}</span>
              <button
                type="button"
                onClick={handleUndo}
                className="font-semibold text-emerald-400 hover:underline"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => setUndoState(null)}
                aria-label="Fermer la notification"
                className="text-slate-400 hover:text-white"
              >
                ×
              </button>
            </div>
          )}

          {toastMessage && (
            <div className="rounded-lg border border-emerald-700 bg-emerald-800 px-4 py-2.5 text-xs font-medium text-white shadow-lg">
              {toastMessage}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
