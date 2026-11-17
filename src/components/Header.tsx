import type { AppView } from '../types/curriculum';

interface HeaderProps {
  activeView: AppView;
  onNavigate: (view: AppView) => void;
  continueLabel: string;
  onContinueLearning: () => void;
}

const NAV_ITEMS: Array<{ id: AppView; label: string }> = [
  { id: 'learn', label: '課程學習' },
  { id: 'map', label: '課程地圖' },
  { id: 'playground', label: '自由實驗室' },
  { id: 'progress', label: '學習紀錄' },
];

export function Header({
  activeView,
  onNavigate,
  continueLabel,
  onContinueLearning,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-4 sm:gap-8">
        {/* Zone 1: Single-element brand wordmark */}
        <button
          type="button"
          onClick={() => onNavigate('learn')}
          className="text-lg font-bold tracking-tight text-slate-900 hover:text-sky-700 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-600 cursor-pointer"
        >
          PyStep 學院
        </button>

        {/* Zone 2: Clean single-line navigation links */}
        <nav
          aria-label="主要導覽"
          className="hidden md:flex items-center gap-7 text-sm font-medium"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`relative py-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-600 ${
                  isActive
                    ? 'text-slate-950 font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {item.label}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 -bottom-[17px] h-0.5 bg-sky-600"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Single primary action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onContinueLearning}
            className="px-4 py-2 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 active:bg-sky-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
          >
            {continueLabel}
          </button>
        </div>
      </div>

      {/* Compact mobile nav bar */}
      <nav
        aria-label="行動版導覽"
        className="flex md:hidden items-center justify-around border-t border-slate-100 px-2 py-1.5 bg-white"
      >
        {NAV_ITEMS.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 cursor-pointer ${
                isActive
                  ? 'text-sky-700 bg-sky-50 font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
}
