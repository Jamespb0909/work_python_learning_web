import { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import type { SyntaxToken } from '../types/curriculum';

interface SyntaxSpotlightProps {
  caption: string;
  tokens: SyntaxToken[];
}

const ROLE_COLORS: Record<SyntaxToken['role'], string> = {
  keyword: 'text-violet-700 border-violet-200 bg-violet-50/70 hover:bg-violet-100/70',
  function: 'text-sky-700 border-sky-200 bg-sky-50/70 hover:bg-sky-100/70',
  string: 'text-emerald-700 border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100/70',
  number: 'text-amber-700 border-amber-200 bg-amber-50/70 hover:bg-amber-100/70',
  variable: 'text-slate-800 border-slate-300 bg-slate-100/80 hover:bg-slate-200/70',
  operator: 'text-rose-700 border-rose-200 bg-rose-50/70 hover:bg-rose-100/70',
  punctuation: 'text-slate-700 border-slate-200 bg-slate-50 hover:bg-slate-100',
};

export function SyntaxSpotlight({ caption, tokens }: SyntaxSpotlightProps) {
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const safeIndex = selectedIndex < tokens.length ? selectedIndex : 0;
  const activeToken = tokens[safeIndex];

  if (!tokens.length) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="flex items-center gap-2 text-xs font-medium text-slate-600 mb-3">
        <HelpCircle className="w-3.5 h-3.5 text-sky-600 shrink-0" />
        <span>{caption}</span>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-3">
        {tokens.map((token, idx) => {
          const isSelected = idx === safeIndex;
          return (
            <button
              key={`${token.code}-${idx}`}
              type="button"
              onClick={() => setSelectedIndex(idx)}
              className={`px-3 py-1.5 rounded-lg border font-mono text-sm transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-sky-600 ${
                ROLE_COLORS[token.role]
              } ${isSelected ? 'ring-2 ring-sky-500/40 border-sky-500 font-semibold' : ''}`}
            >
              {token.code}
            </button>
          );
        })}
      </div>

      {activeToken && (
        <div className="text-sm text-slate-700 bg-slate-50 border border-slate-200/80 rounded-lg px-4 py-2.5 flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="font-semibold text-slate-900">{activeToken.label}：</span>
          <span>{activeToken.explanation}</span>
        </div>
      )}
    </div>
  );
}
