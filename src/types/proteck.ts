export type SheetName =
  | 'INSTALLATION'
  | 'VISITE'
  | 'PROSPECTION'
  | 'MAINTENANCE'
  | 'SAV'
  | 'DEPANNAGE'
  | 'CREANCE';

export const SHEET_NAMES: SheetName[] = [
  'INSTALLATION',
  'VISITE',
  'PROSPECTION',
  'MAINTENANCE',
  'SAV',
  'DEPANNAGE',
  'CREANCE',
];

export const SHEET_DESCRIPTIONS: Record<SheetName, string> = {
  INSTALLATION: 'Suivi des chantiers, maisons, boutiques et installations complètes',
  VISITE: 'Visites techniques sur site, relevés et diagnostics préalables',
  PROSPECTION: 'Prospections commerciales, devis émis et opportunités en cours',
  MAINTENANCE: 'Contrats de maintenance préventive et interventions planifiées',
  SAV: 'Service après-vente, garanties et remplacements matériels',
  DEPANNAGE: 'Interventions urgentes, pannes et remises en service',
  CREANCE: 'Suivi des soldes impayés, échéances et recouvrements clients',
};

export const PROJECT_TYPES = [
  'MAISON',
  'CHANTIER',
  'ETABLISSEMENT',
  'BOUTIQUE',
  'MAGASIN',
  'ACHAT',
  'BUREAU',
  'ENTREPOT',
  'IMMEUBLE',
] as const;

export const COMMENT_SUGGESTIONS = [
  'TERMINEE',
  'TERMINEE/SOLDE',
  'EN COURS',
  'EN ATTENTE',
  'A RELANCER',
  'ANNULEE',
] as const;

export type RowKind = 'entry' | 'separator' | 'header';

export interface SheetRow {
  id: string;
  rowNumber?: number;
  kind: RowKind;
  date: string;
  client: string;
  contact: string;
  localisation: string;
  projet: string;
  typeProjet: string;
  technicien: string;
  cout: number | null;
  acompte: number | null;
  solde: number | null;
  resteManual?: number | null;
  resteAlert?: boolean;
  commentaire: string;
  groupLabel?: string;
}

export type WorkbookData = Record<SheetName, SheetRow[]>;

export interface SheetStats {
  entryCount: number;
  terminatedCount: number;
  inProgressCount: number;
  waitingCount: number;
  totalCout: number;
  totalAcompte: number;
  totalReste: number;
  totalSolde: number;
  totalEncaisse: number;
  tauxRecouvrement: number;
}
