import type { CodeLineTemplate } from '../types/curriculum';

interface FillBlankEditorProps {
  lines: CodeLineTemplate[];
  blankValues: Record<string, string>;
  onChangeBlank: (blankId: string, value: string) => void;
  onSubmitRun: () => void;
}

export function FillBlankEditor({
  lines,
  blankValues,
  onChangeBlank,
  onSubmitRun,
}: FillBlankEditorProps) {
  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
      <div className="px-4 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <span className="font-mono">main.py</span>
        <span>在空白框中輸入正確程式碼，按 Enter 可直接執行</span>
      </div>

      <div className="p-4 sm:p-5 space-y-2.5 overflow-x-auto">
        {lines.map((line) => (
          <div
            key={line.lineNumber}
            className="flex items-center min-h-[40px] font-mono text-sm leading-relaxed whitespace-nowrap"
          >
            <span className="w-7 shrink-0 text-right pr-3 text-xs text-slate-500 select-none tabular-nums">
              {line.lineNumber}
            </span>

            {line.indent > 0 && (
              <span
                aria-hidden="true"
                className="inline-flex items-center select-none"
                style={{ width: `${line.indent * 2}rem` }}
              >
                {Array.from({ length: line.indent }).map((_, idx) => (
                  <span
                    key={idx}
                    className="inline-block w-8 h-7 border-l border-slate-700/80 ml-1"
                  />
                ))}
              </span>
            )}

            <div className="flex items-center flex-wrap gap-1">
              {line.segments.map((seg, idx) => {
                if (seg.type === 'text') {
                  return (
                    <span key={idx} className="text-slate-100 whitespace-pre">
                      {seg.value}
                    </span>
                  );
                }

                if (seg.type === 'blank') {
                  const val = blankValues[seg.id] ?? '';
                  const widthCh = Math.max(seg.widthCh ?? 10, val.length + 2);
                  return (
                    <input
                      key={seg.id}
                      type="text"
                      value={val}
                      onChange={(e) => onChangeBlank(seg.id, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          onSubmitRun();
                        }
                      }}
                      placeholder={seg.placeholder}
                      aria-label={seg.hint || seg.placeholder}
                      title={seg.hint}
                      spellCheck={false}
                      autoComplete="off"
                      autoCapitalize="off"
                      style={{ width: `${widthCh}ch` }}
                      className="px-2.5 py-1 rounded-md bg-slate-800 border border-slate-600 text-sky-200 placeholder:text-slate-500 font-mono text-sm focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-500/30 transition-all"
                    />
                  );
                }

                return null;
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
