import { useState, KeyboardEvent } from 'react';
import {
  Check,
  Columns3,
  Layers,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from 'lucide-react';
import {
  COMMENT_SUGGESTIONS,
  PROJECT_TYPES,
  SheetName,
  SheetRow,
} from '../types/proteck';
import {
  computeRowReste,
  computeSheetStats,
  formatAmount,
  frDateToIso,
  isResteAlert,
  isoDateToFr,
  parseAmountInput,
} from '../utils/calculations';

interface ProteckGridProps {
  sheetName: SheetName;
  rows: SheetRow[];
  knownTechnicians: string[];
  showClientColumns: boolean;
  onToggleClientColumns: () => void;
  onUpdateRow: (rowId: string, patch: Partial<SheetRow>) => void;
  onDeleteRow: (rowId: string) => void;
  onAddQuickRow: () => void;
  onOpenAddModal: () => void;
  onAddSeparator: () => void;
  onSettleRow: (rowId: string) => void;
  onSyncCreances?: () => number;
}

interface NumericCellProps {
  value: number | null;
  onCommit: (val: number | null) => void;
  className?: string;
  placeholder?: string;
  ariaLabel: string;
}

function NumericCell({
  value,
  onCommit,
  className = '',
  placeholder = '',
  ariaLabel,
}: NumericCellProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  const startEdit = () => {
    setDraft(value !== null && value !== undefined ? String(value) : '');
    setEditing(true);
  };

  const commit = () => {
    setEditing(false);
    const parsed = parseAmountInput(draft);
    if (parsed !== value) {
      onCommit(parsed);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    } else if (e.key === 'Escape') {
      setEditing(false);
    }
  };

  if (editing) {
    return (
      <input
        type="text"
        inputMode="numeric"
        autoFocus
        aria-label={ariaLabel}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        className={`h-full w-full bg-white px-2 py-1.5 text-right font-mono text-xs font-medium text-slate-900 tabular-nums outline-2 outline-slate-900 ${className}`}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={startEdit}
      aria-label={ariaLabel}
      className={`flex h-full min-h-[36px] w-full items-center justify-end px-2.5 py-1.5 text-right font-mono text-xs tabular-nums transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-slate-900 ${className}`}
    >
      {value !== null && value !== undefined ? (
        <span>{formatAmount(value)}</span>
      ) : (
        <span className="text-transparent select-none">{placeholder || '0'}</span>
      )}
    </button>
  );
}

interface TextCellProps {
  value: string;
  onCommit: (val: string) => void;
  listId?: string;
  uppercase?: boolean;
  align?: 'left' | 'center';
  className?: string;
  placeholder?: string;
  ariaLabel: string;
}

function TextCell({
  value,
  onCommit,
  listId,
  uppercase = false,
  align = 'left',
  className = '',
  placeholder = '',
  ariaLabel,
}: TextCellProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const startEdit = () => {
    setDraft(value);
    setEditing(true);
  };

  const commit = () => {
    setEditing(false);
    const cleaned = uppercase ? draft.trim().toUpperCase() : draft.trim();
    if (cleaned !== value) {
      onCommit(cleaned);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    } else if (e.key === 'Escape') {
      setEditing(false);
    }
  };

  if (editing) {
    return (
      <input
        type="text"
        autoFocus
        list={listId}
        aria-label={ariaLabel}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        className={`h-full w-full bg-white px-2 py-1.5 text-xs text-slate-900 outline-2 outline-slate-900 ${
          align === 'center' ? 'text-center' : 'text-left'
        } ${uppercase ? 'uppercase' : ''}`}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={startEdit}
      aria-label={ariaLabel}
      className={`flex h-full min-h-[36px] w-full items-center px-2.5 py-1.5 text-xs transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-slate-900 ${
        align === 'center' ? 'justify-center text-center' : 'justify-start text-left'
      } ${className}`}
    >
      {value ? (
        <span className="truncate">{value}</span>
      ) : (
        <span className="truncate text-slate-400/70">{placeholder}</span>
      )}
    </button>
  );
}

interface DateCellProps {
  value: string;
  onCommit: (val: string) => void;
  ariaLabel: string;
}

function DateCell({ value, onCommit, ariaLabel }: DateCellProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  const startEdit = () => {
    setDraft(frDateToIso(value));
    setEditing(true);
  };

  const commit = (nextIso?: string) => {
    setEditing(false);
    const valToUse = nextIso !== undefined ? nextIso : draft;
    const formatted = valToUse ? isoDateToFr(valToUse) : '';
    if (formatted !== value) {
      onCommit(formatted);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    } else if (e.key === 'Escape') {
      setEditing(false);
    }
  };

  if (editing) {
    return (
      <input
        type="date"
        autoFocus
        aria-label={ariaLabel}
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
        }}
        onBlur={() => commit()}
        onKeyDown={handleKeyDown}
        className="h-full w-full bg-white px-1.5 py-1.5 font-mono text-xs text-slate-900 outline-2 outline-slate-900"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={startEdit}
      aria-label={ariaLabel}
      className="flex h-full min-h-[36px] w-full items-center justify-center px-2 py-1.5 text-center font-mono text-xs text-slate-700 tabular-nums transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-slate-900"
    >
      {value ? (
        <span>{value}</span>
      ) : (
        <span className="text-slate-400/70">jj/mm/aaaa</span>
      )}
    </button>
  );
}

export function ProteckGrid({
  sheetName,
  rows,
  knownTechnicians,
  showClientColumns,
  onToggleClientColumns,
  onUpdateRow,
  onDeleteRow,
  onAddQuickRow,
  onOpenAddModal,
  onAddSeparator,
  onSettleRow,
  onSyncCreances,
}: ProteckGridProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'EN COURS' | 'TERMINEE' | 'EN ATTENTE'>('ALL');
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  const hasActiveFilter = searchQuery.trim().length > 0 || statusFilter !== 'ALL';

  const visibleRows = rows.filter((row) => {
    if (row.kind === 'separator') {
      return !hasActiveFilter;
    }
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      row.projet.toLowerCase().includes(q) ||
      row.typeProjet.toLowerCase().includes(q) ||
      row.technicien.toLowerCase().includes(q) ||
      row.client.toLowerCase().includes(q) ||
      row.localisation.toLowerCase().includes(q) ||
      row.commentaire.toLowerCase().includes(q);

    const upperComment = row.commentaire.toUpperCase();
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'TERMINEE' &&
        (upperComment.includes('TERMINEE') || upperComment.includes('SOLDE'))) ||
      (statusFilter === 'EN COURS' && upperComment.includes('EN COURS')) ||
      (statusFilter === 'EN ATTENTE' && upperComment.includes('ATTENTE'));

    return matchesSearch && matchesStatus;
  });

  const stats = computeSheetStats(visibleRows);

  const handleSync = () => {
    if (!onSyncCreances) return;
    const added = onSyncCreances();
    setSyncNotice(
      added > 0
        ? `${added} impayé(s) importé(s) depuis les autres onglets.`
        : 'Toutes les créances en cours sont déjà présentes.'
    );
    window.setTimeout(() => setSyncNotice(null), 4000);
  };

  let runningIndex = 0;

  return (
    <div className="space-y-4">
      {/* Datalists for fast Excel-like inline autocomplete */}
      <datalist id="proteck-project-types">
        {PROJECT_TYPES.map((type) => (
          <option key={type} value={type} />
        ))}
      </datalist>
      <datalist id="proteck-technicians">
        {knownTechnicians.map((tech) => (
          <option key={tech} value={tech} />
        ))}
      </datalist>
      <datalist id="proteck-comments">
        {COMMENT_SUGGESTIONS.map((comment) => (
          <option key={comment} value={comment} />
        ))}
      </datalist>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher projet, technicien, client..."
              className="w-64 rounded-lg border border-slate-200 bg-slate-50 py-1.5 pr-3 pl-8 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:outline-none"
            />
          </div>

          <div
            role="group"
            aria-label="Filtrer par statut"
            className="flex items-center gap-1 rounded-lg bg-slate-100 p-1"
          >
            {(
              [
                { id: 'ALL', label: 'Tous' },
                { id: 'EN COURS', label: 'En cours' },
                { id: 'TERMINEE', label: 'Terminés' },
                { id: 'EN ATTENTE', label: 'En attente' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setStatusFilter(opt.id)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                  statusFilter === opt.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onToggleClientColumns}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
              showClientColumns
                ? 'border-slate-300 bg-slate-100 text-slate-900'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Columns3 className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{showClientColumns ? 'Colonnes A–L' : 'Date + F–L'}</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {sheetName === 'CREANCE' && onSyncCreances && (
            <button
              type="button"
              onClick={handleSync}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-800 whitespace-nowrap shrink-0 transition-colors hover:bg-red-100"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Synchroniser impayés</span>
            </button>
          )}

          <button
            type="button"
            onClick={onAddSeparator}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 whitespace-nowrap shrink-0 transition-colors hover:bg-slate-50"
          >
            <Layers className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Séparateur de lot</span>
          </button>

          <button
            type="button"
            onClick={onAddQuickRow}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 whitespace-nowrap shrink-0 transition-colors hover:bg-slate-50"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Ligne rapide</span>
          </button>

          <button
            type="button"
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white whitespace-nowrap shrink-0 transition-colors hover:bg-slate-800"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Nouveau dossier</span>
          </button>
        </div>
      </div>

      {syncNotice && (
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700">
          {syncNotice}
        </div>
      )}

      {/* Spreadsheet Container */}
      <div className="overflow-hidden rounded-xl border border-slate-300 bg-white">
        <div className="sheet-scroll overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              {/* Excel column letters bar (A..L) */}
              <tr className="border-b border-slate-300 bg-slate-100 text-[11px] font-medium text-slate-500">
                <th className="w-11 border-r border-slate-300 px-2 py-1 text-center font-mono">
                  #
                </th>
                <th className="w-28 border-r border-slate-300 px-2 py-1 text-center font-mono">A</th>
                {showClientColumns && (
                  <>
                    <th className="min-w-[155px] border-r border-slate-300 px-2 py-1 text-center font-mono">B</th>
                    <th className="w-28 border-r border-slate-300 px-2 py-1 text-center font-mono">C</th>
                    <th className="min-w-[130px] border-r border-slate-300 px-2 py-1 text-center font-mono">D</th>
                    <th className="min-w-[150px] border-r border-slate-300 px-2 py-1 text-center font-mono">E</th>
                  </>
                )}
                <th className="min-w-[130px] border-r border-slate-300 px-2 py-1 text-center font-mono">F</th>
                <th className="min-w-[115px] border-r border-slate-300 px-2 py-1 text-center font-mono">G</th>
                <th className="w-28 border-r border-slate-300 px-2 py-1 text-center font-mono">H</th>
                <th className="w-28 border-r border-slate-300 px-2 py-1 text-center font-mono">I</th>
                <th className="w-28 border-r border-slate-300 px-2 py-1 text-center font-mono">J</th>
                <th className="w-28 border-r border-slate-300 px-2 py-1 text-center font-mono">K</th>
                <th className="min-w-[155px] border-r border-slate-300 px-2 py-1 text-center font-mono">L</th>
                <th className="w-24 px-2 py-1 text-center font-mono">Actions</th>
              </tr>

              {/* Header Row */}
              <tr className="border-b-2 border-slate-800 bg-slate-200/80 text-[11px] font-bold tracking-wide text-slate-900 uppercase">
                <th className="border-r border-slate-300 px-2 py-2 text-center">#</th>
                <th className="border-r border-slate-300 px-2.5 py-2 text-center">DATE</th>
                {showClientColumns && (
                  <>
                    <th className="border-r border-slate-300 px-2.5 py-2">CLIENT</th>
                    <th className="border-r border-slate-300 px-2.5 py-2">CONTACT</th>
                    <th className="border-r border-slate-300 px-2.5 py-2">LOCALISATION</th>
                    <th className="border-r border-slate-300 px-2.5 py-2">PROJET</th>
                  </>
                )}
                <th className="border-r border-slate-300 px-2.5 py-2">TYPE DE PROJET</th>
                <th className="border-r border-slate-300 bg-[#FFF34F]/70 px-2.5 py-2 text-center">
                  TECHNICIEN
                </th>
                <th className="border-r border-slate-300 bg-[#FFF34F]/70 px-2.5 py-2 text-right">
                  COUT
                </th>
                <th className="border-r border-slate-300 bg-[#5B9BD5]/50 px-2.5 py-2 text-right">
                  ACOMPTE
                </th>
                <th className="border-r border-slate-300 bg-red-100 px-2.5 py-2 text-right text-red-900">
                  RESTE
                </th>
                <th className="border-r border-slate-300 bg-[#70AD47]/50 px-2.5 py-2 text-right">
                  SOLDE
                </th>
                <th className="border-r border-slate-300 px-2.5 py-2">COMMENTAIRE</th>
                <th className="px-2 py-2 text-center">ACTIONS</th>
              </tr>
            </thead>

            <tbody>
              {visibleRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={showClientColumns ? 14 : 10}
                    className="px-6 py-12 text-center text-sm text-slate-500"
                  >
                    <p className="font-medium text-slate-700">
                      {hasActiveFilter
                        ? 'Aucun dossier ne correspond à votre recherche.'
                        : `L’onglet ${sheetName} est actuellement vide.`}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {hasActiveFilter
                        ? 'Modifiez vos filtres ou réinitialisez la recherche.'
                        : 'Ajoutez une première ligne pour démarrer le suivi.'}
                    </p>
                    <div className="mt-4 flex justify-center gap-2">
                      {hasActiveFilter ? (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery('');
                            setStatusFilter('ALL');
                          }}
                          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Réinitialiser les filtres
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={onOpenAddModal}
                          className="rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                        >
                          Ajouter un dossier
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                visibleRows.map((row) => {
                  if (row.kind === 'separator') {
                    return (
                      <tr
                        key={row.id}
                        className="group border-b border-slate-400 bg-[#A6A6A6] text-slate-900"
                      >
                        <td className="border-r border-slate-400/70 px-2 py-1 text-center font-mono text-[10px] text-slate-800">
                          —
                        </td>
                        <td
                          colSpan={showClientColumns ? 12 : 8}
                          className="border-r border-slate-400/70 px-2 py-1"
                        >
                          <input
                            type="text"
                            aria-label="Libellé du séparateur de lot"
                            value={row.groupLabel ?? ''}
                            placeholder="Séparateur de période / lot (cliquer pour nommer)"
                            onChange={(e) =>
                              onUpdateRow(row.id, { groupLabel: e.target.value })
                            }
                            className="w-full bg-transparent text-[11px] font-semibold tracking-wide text-slate-900 uppercase placeholder:font-normal placeholder:normal-case placeholder:text-slate-700/70 focus:bg-white/60 focus:px-1.5 focus:outline-none"
                          />
                        </td>
                        <td className="px-2 py-1 text-center">
                          <button
                            type="button"
                            onClick={() => onDeleteRow(row.id)}
                            title="Supprimer le séparateur"
                            aria-label="Supprimer le séparateur"
                            className="inline-flex rounded p-1 text-slate-800 opacity-60 transition-opacity hover:bg-slate-900/10 hover:opacity-100"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  }

                  runningIndex += 1;
                  const displayNum = row.rowNumber ?? runningIndex;
                  const reste = computeRowReste(row);
                  const alertReste = isResteAlert(row);
                  const canSettle =
                    (row.cout ?? 0) > 0 && (row.solde === null || row.solde === 0);

                  return (
                    <tr
                      key={row.id}
                      className="border-b border-slate-300 bg-white transition-colors hover:bg-slate-50/70"
                    >
                      <td className="border-r border-slate-300 bg-slate-50 px-2 py-1 text-center font-mono text-[11px] text-slate-500 tabular-nums">
                        {displayNum}
                      </td>

                      <td className="border-r border-slate-300 p-0">
                        <DateCell
                          value={row.date}
                          ariaLabel={`Date ligne ${displayNum}`}
                          onCommit={(val) => onUpdateRow(row.id, { date: val })}
                        />
                      </td>

                      {showClientColumns && (
                        <>
                          <td className="border-r border-slate-300 p-0">
                            <TextCell
                              value={row.client}
                              placeholder="Nom client..."
                              ariaLabel={`Client ligne ${displayNum}`}
                              className="font-medium text-slate-900"
                              onCommit={(val) => onUpdateRow(row.id, { client: val })}
                            />
                          </td>
                          <td className="border-r border-slate-300 p-0">
                            <TextCell
                              value={row.contact}
                              placeholder="Téléphone..."
                              ariaLabel={`Contact ligne ${displayNum}`}
                              className="font-mono text-slate-700 tabular-nums"
                              onCommit={(val) => onUpdateRow(row.id, { contact: val })}
                            />
                          </td>
                          <td className="border-r border-slate-300 p-0">
                            <TextCell
                              value={row.localisation}
                              placeholder="Quartier..."
                              ariaLabel={`Localisation ligne ${displayNum}`}
                              className="text-slate-700"
                              onCommit={(val) => onUpdateRow(row.id, { localisation: val })}
                            />
                          </td>
                          <td className="border-r border-slate-300 p-0">
                            <TextCell
                              value={row.projet}
                              placeholder="Intitulé projet..."
                              ariaLabel={`Projet ligne ${displayNum}`}
                              className="text-slate-800"
                              onCommit={(val) => onUpdateRow(row.id, { projet: val })}
                            />
                          </td>
                        </>
                      )}

                      {/* F: TYPE DE PROJET */}
                      <td className="border-r border-slate-300 p-0">
                        <TextCell
                          value={row.typeProjet}
                          listId="proteck-project-types"
                          uppercase
                          placeholder="MAISON..."
                          ariaLabel={`Type de projet ligne ${displayNum}`}
                          className="font-medium text-slate-900"
                          onCommit={(val) => onUpdateRow(row.id, { typeProjet: val })}
                        />
                      </td>

                      {/* G: TECHNICIEN (Yellow #FFF34F) */}
                      <td className="border-r border-slate-300 bg-[#FFF34F] p-0">
                        <TextCell
                          value={row.technicien}
                          listId="proteck-technicians"
                          uppercase
                          align="center"
                          placeholder=""
                          ariaLabel={`Technicien ligne ${displayNum}`}
                          className="font-semibold text-slate-950"
                          onCommit={(val) => onUpdateRow(row.id, { technicien: val })}
                        />
                      </td>

                      {/* H: COUT (Yellow #FFF34F) */}
                      <td className="border-r border-slate-300 bg-[#FFF34F] p-0">
                        <NumericCell
                          value={row.cout}
                          ariaLabel={`Coût ligne ${displayNum}`}
                          className="font-medium text-slate-950"
                          onCommit={(val) => onUpdateRow(row.id, { cout: val })}
                        />
                      </td>

                      {/* I: ACOMPTE (Blue #5B9BD5) */}
                      <td className="border-r border-slate-300 bg-[#5B9BD5] p-0">
                        <NumericCell
                          value={row.acompte}
                          ariaLabel={`Acompte ligne ${displayNum}`}
                          className="font-medium text-slate-950"
                          onCommit={(val) => onUpdateRow(row.id, { acompte: val })}
                        />
                      </td>

                      {/* J: RESTE (White when value > 0, Red #EF4444 when empty/settled) */}
                      <td
                        className={`border-r border-slate-300 p-0 ${
                          reste !== null && reste > 0 ? 'bg-white' : 'bg-[#EF4444]'
                        }`}
                      >
                        <NumericCell
                          value={reste}
                          ariaLabel={`Reste à payer ligne ${displayNum}`}
                          className={
                            reste !== null && reste > 0
                              ? alertReste
                                ? 'font-bold text-red-600'
                                : 'font-semibold text-slate-900'
                              : 'text-transparent'
                          }
                          onCommit={(val) =>
                            onUpdateRow(row.id, { resteManual: val })
                          }
                        />
                      </td>

                      {/* K: SOLDE (Green #70AD47) */}
                      <td className="border-r border-slate-300 bg-[#70AD47] p-0">
                        <NumericCell
                          value={row.solde}
                          ariaLabel={`Solde ligne ${displayNum}`}
                          className="font-semibold text-slate-950"
                          onCommit={(val) =>
                            onUpdateRow(row.id, {
                              solde: val,
                              resteManual: val && val > 0 ? null : row.resteManual,
                            })
                          }
                        />
                      </td>

                      {/* L: COMMENTAIRE */}
                      <td className="border-r border-slate-300 p-0">
                        <TextCell
                          value={row.commentaire}
                          listId="proteck-comments"
                          uppercase
                          placeholder="Statut..."
                          ariaLabel={`Commentaire ligne ${displayNum}`}
                          className={
                            row.commentaire.toUpperCase().includes('EN COURS')
                              ? 'font-semibold text-amber-800'
                              : row.commentaire.toUpperCase().includes('RELANCER')
                                ? 'font-semibold text-red-700'
                                : row.commentaire.toUpperCase().includes('SOLDE')
                                  ? 'font-medium text-emerald-800'
                                  : 'text-slate-800'
                          }
                          onCommit={(val) => onUpdateRow(row.id, { commentaire: val })}
                        />
                      </td>

                      {/* Row Actions */}
                      <td className="px-2 py-1 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {canSettle && (
                            <button
                              type="button"
                              onClick={() => onSettleRow(row.id)}
                              title="Marquer soldé (copie le coût dans Solde vert)"
                              aria-label={`Solder la ligne ${displayNum}`}
                              className="inline-flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-1.5 py-1 text-[10px] font-semibold text-emerald-800 transition-colors hover:bg-emerald-100"
                            >
                              <Check className="h-3 w-3" aria-hidden="true" />
                              <span>Solder</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onDeleteRow(row.id)}
                            title="Supprimer cette ligne"
                            aria-label={`Supprimer la ligne ${displayNum}`}
                            className="inline-flex rounded p-1 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Totals Row */}
            <tfoot>
              <tr className="border-t-2 border-slate-900 bg-slate-900 text-xs font-semibold text-white">
                <td className="border-r border-slate-700 px-2 py-2.5 text-center font-mono text-[11px] text-slate-400">
                  Σ
                </td>
                <td className="border-r border-slate-700 px-2.5 py-2.5 text-center text-[11px] text-slate-400">
                  —
                </td>
                {showClientColumns && (
                  <td
                    colSpan={4}
                    className="border-r border-slate-700 px-3 py-2.5 text-slate-300"
                  >
                    TOTAL {sheetName} ({stats.entryCount} dossiers)
                  </td>
                )}
                <td className="border-r border-slate-700 px-2.5 py-2.5">
                  {showClientColumns ? '' : `TOTAL (${stats.entryCount})`}
                </td>
                <td className="border-r border-slate-700 px-2.5 py-2.5 text-center text-slate-300">
                  —
                </td>
                <td className="border-r border-slate-700 px-2.5 py-2.5 text-right font-mono text-[#FFF34F] tabular-nums">
                  {formatAmount(stats.totalCout)}
                </td>
                <td className="border-r border-slate-700 px-2.5 py-2.5 text-right font-mono text-sky-300 tabular-nums">
                  {formatAmount(stats.totalAcompte)}
                </td>
                <td className="border-r border-slate-700 px-2.5 py-2.5 text-right font-mono text-red-300 tabular-nums">
                  {formatAmount(stats.totalReste)}
                </td>
                <td className="border-r border-slate-700 px-2.5 py-2.5 text-right font-mono text-emerald-300 tabular-nums">
                  {formatAmount(stats.totalSolde)}
                </td>
                <td colSpan={2} className="px-2.5 py-2.5 text-slate-300 tabular-nums">
                  Recouvrement : {stats.tauxRecouvrement}%
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Color legend line */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-1 text-xs text-slate-600">
        <span className="font-medium text-slate-800">Règles Africa Engie :</span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-xs border border-slate-300 bg-[#FFF34F]" />
          Technicien & Coût
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-xs border border-slate-300 bg-[#5B9BD5]" />
          Acompte versé
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-xs border border-slate-300 bg-white" />
          Reste dû (calculé automatiquement)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-xs border border-slate-300 bg-[#EF4444]" />
          Aucun reste actif / soldé
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-xs border border-slate-300 bg-[#70AD47]" />
          Montant total soldé
        </span>
      </div>
    </div>
  );
}
