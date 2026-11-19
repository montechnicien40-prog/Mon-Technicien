import { FormEvent, useState } from 'react';
import { X } from 'lucide-react';
import {
  COMMENT_SUGGESTIONS,
  PROJECT_TYPES,
  SheetName,
  SheetRow,
} from '../types/proteck';
import {
  formatAmount,
  formatTodayIso,
  isoDateToFr,
  parseAmountInput,
} from '../utils/calculations';

interface AddRowModalProps {
  isOpen: boolean;
  sheetName: SheetName;
  knownTechnicians: string[];
  onClose: () => void;
  onAdd: (row: Omit<SheetRow, 'id'>) => void;
}

export function AddRowModal({
  isOpen,
  sheetName,
  knownTechnicians,
  onClose,
  onAdd,
}: AddRowModalProps) {
  const [dateIso, setDateIso] = useState(formatTodayIso);
  const [client, setClient] = useState('');
  const [contact, setContact] = useState('');
  const [localisation, setLocalisation] = useState('');
  const [projet, setProjet] = useState('');
  const [typeProjet, setTypeProjet] = useState('MAISON');
  const [technicien, setTechnicien] = useState('');
  const [coutStr, setCoutStr] = useState('');
  const [acompteStr, setAcompteStr] = useState('');
  const [soldeStr, setSoldeStr] = useState('');
  const [commentaire, setCommentaire] = useState('EN COURS');

  if (!isOpen) return null;

  const cout = parseAmountInput(coutStr);
  const acompte = parseAmountInput(acompteStr);
  const solde = parseAmountInput(soldeStr);
  const previewReste =
    solde && solde > 0
      ? null
      : cout && acompte && cout > acompte
        ? cout - acompte
        : null;

  const handleMarkSoldedQuick = () => {
    if (cout && cout > 0) {
      setSoldeStr(String(cout));
      setCommentaire('TERMINEE/SOLDE');
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onAdd({
      kind: 'entry',
      date: dateIso ? isoDateToFr(dateIso) : '',
      client: client.trim(),
      contact: contact.trim(),
      localisation: localisation.trim(),
      projet: projet.trim(),
      typeProjet: (typeProjet.trim() || 'MAISON').toUpperCase(),
      technicien: technicien.trim().toUpperCase(),
      cout,
      acompte,
      solde,
      commentaire: (commentaire.trim() || 'EN COURS').toUpperCase(),
    });
    setDateIso(formatTodayIso());
    setClient('');
    setContact('');
    setLocalisation('');
    setProjet('');
    setCoutStr('');
    setAcompteStr('');
    setSoldeStr('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-row-title"
    >
      <div className="w-full max-w-xl rounded-xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 id="add-row-title" className="text-base font-semibold text-slate-900">
            Nouveau dossier — Onglet {sheetName}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Date
              </label>
              <input
                type="date"
                value={dateIso}
                onChange={(e) => setDateIso(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Client
              </label>
              <input
                type="text"
                value={client}
                onChange={(e) => setClient(e.target.value)}
                placeholder="Ex: Villa Kouassi"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Contact
              </label>
              <input
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="07 00 00 00 00"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Localisation
              </label>
              <input
                type="text"
                value={localisation}
                onChange={(e) => setLocalisation(e.target.value)}
                placeholder="Ex: Cocody Riviera"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 border-t border-slate-200 pt-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Projet (Col E)
              </label>
              <input
                type="text"
                value={projet}
                onChange={(e) => setProjet(e.target.value)}
                placeholder="Ex: Vidéosurveillance 8 caméras"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Type de projet (Col F)
              </label>
              <input
                type="text"
                list="modal-project-types"
                value={typeProjet}
                onChange={(e) => setTypeProjet(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium uppercase text-slate-900 focus:border-slate-900 focus:outline-none"
              />
              <datalist id="modal-project-types">
                {PROJECT_TYPES.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Technicien (Col G — Jaune)
              </label>
              <input
                type="text"
                list="modal-technicians"
                value={technicien}
                onChange={(e) => setTechnicien(e.target.value)}
                placeholder="HERMAN, GAVOR, MAMADOU..."
                className="w-full rounded-lg border border-slate-300 bg-[#FFF34F]/50 px-3 py-2 text-xs font-semibold uppercase text-slate-900 focus:border-slate-900 focus:outline-none"
              />
              <datalist id="modal-technicians">
                {knownTechnicians.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Coût total (Col H — Jaune)
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={coutStr}
                onChange={(e) => setCoutStr(e.target.value)}
                placeholder="480000"
                className="w-full rounded-lg border border-slate-300 bg-[#FFF34F]/50 px-3 py-2 text-right font-mono text-xs font-medium text-slate-900 tabular-nums focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Acompte (Col I — Bleu)
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={acompteStr}
                onChange={(e) => setAcompteStr(e.target.value)}
                placeholder="200000"
                className="w-full rounded-lg border border-slate-300 bg-[#5B9BD5]/30 px-3 py-2 text-right font-mono text-xs font-medium text-slate-900 tabular-nums focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="block text-xs font-medium text-slate-700">
                  Solde (Col K — Vert)
                </label>
                {cout && cout > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkSoldedQuick}
                    className="text-[11px] font-semibold text-emerald-700 hover:underline"
                  >
                    Tout solder
                  </button>
                )}
              </div>
              <input
                type="text"
                inputMode="numeric"
                value={soldeStr}
                onChange={(e) => setSoldeStr(e.target.value)}
                placeholder="0"
                className="w-full rounded-lg border border-slate-300 bg-[#70AD47]/30 px-3 py-2 text-right font-mono text-xs font-medium text-slate-900 tabular-nums focus:border-slate-900 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Commentaire / Statut (Col L)
              </label>
              <input
                type="text"
                list="modal-comments"
                value={commentaire}
                onChange={(e) => setCommentaire(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs uppercase text-slate-900 focus:border-slate-900 focus:outline-none"
              />
              <datalist id="modal-comments">
                {COMMENT_SUGGESTIONS.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>

            <div className="flex flex-col justify-end">
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
                <span className="text-slate-600">Aperçu Col J (Reste) : </span>
                {previewReste !== null ? (
                  <span className="font-mono font-bold text-red-600 tabular-nums">
                    {formatAmount(previewReste)}
                  </span>
                ) : (
                  <span className="font-medium text-slate-700">
                    Case rouge (aucun reste actif)
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
            >
              Enregistrer dans {sheetName}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
