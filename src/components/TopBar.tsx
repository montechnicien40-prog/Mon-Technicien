import { FileSpreadsheet } from 'lucide-react';

export type AppView = 'grid' | 'finance' | 'technicians';

interface TopBarProps {
  activeView: AppView;
  onChangeView: (view: AppView) => void;
  onOpenExport: () => void;
}

export function TopBar({ activeView, onChangeView, onOpenExport }: TopBarProps) {
  const navItems: { id: AppView; label: string }[] = [
    { id: 'grid', label: 'Africa Engie' },
    { id: 'finance', label: 'Synthèse Financière' },
    { id: 'technicians', label: 'Techniciens' },
  ];

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-8 border-b border-slate-200 bg-white px-6 py-3.5">
      <button
        type="button"
        onClick={() => onChangeView('grid')}
        className="text-left text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
      >
        Africa Engie
      </button>

      <nav aria-label="Navigation principale" className="hidden md:flex items-center gap-6">
        {navItems.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChangeView(item.id)}
              className={`relative py-1 text-sm font-medium whitespace-nowrap shrink-0 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 ${
                isActive
                  ? 'text-slate-900 after:absolute after:inset-x-0 after:-bottom-3.5 after:h-0.5 after:bg-emerald-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={onOpenExport}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-800 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
        >
          <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
          <span>Exporter en Excel</span>
        </button>
      </div>
    </header>
  );
}
