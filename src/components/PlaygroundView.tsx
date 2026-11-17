import { useState, type KeyboardEvent } from 'react';
import { Database, Play, RotateCcw, Terminal } from 'lucide-react';
import { runPythonCode } from '../engine/pythonRunner';
import type { ExecutionResult } from '../types/curriculum';

const TEMPLATES: Array<{ id: string; title: string; code: string }> = [
  {
    id: 'hello',
    title: '變數與歡迎訊息',
    code: `name = "小華"\nlevel = 3\nprint(f"哈囉，{name}！目前等級：{level}")`,
  },
  {
    id: 'loop',
    title: 'for 迴圈計算總和',
    code: `total = 0\nfor i in range(1, 6):\n    total += i\n    print(f"加上 {i} 後，總和為 {total}")`,
  },
  {
    id: 'grade',
    title: '條件判斷成績等第',
    code: `score = 86\nif score >= 90:\n    print("優等")\nelif score >= 60:\n    print("及格")\nelse:\n    print("待加強")`,
  },
  {
    id: 'func',
    title: '自訂折扣函式',
    code: `def calc_discount(price, rate):\n    return price * rate\n\nfinal_price = calc_discount(500, 0.8)\nprint(f"打八折後：{final_price} 元")`,
  },
];

export function PlaygroundView() {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(TEMPLATES[0].id);
  const [code, setCode] = useState<string>(TEMPLATES[0].code);
  const [execution, setExecution] = useState<ExecutionResult | null>(() =>
    runPythonCode(TEMPLATES[0].code)
  );

  const handleSelectTemplate = (templateId: string) => {
    const found = TEMPLATES.find((t) => t.id === templateId);
    if (!found) return;
    setSelectedTemplateId(found.id);
    setCode(found.code);
    setExecution(runPythonCode(found.code));
  };

  const handleRun = () => {
    setExecution(runPythonCode(code));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const updated = code.slice(0, start) + '    ' + code.slice(end);
      setCode(updated);
      requestAnimationFrame(() => {
        target.selectionStart = target.selectionEnd = start + 4;
      });
    }
  };

  return (
    <main className="max-w-[1200px] mx-auto px-4 sm:px-8 py-8 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-950">Python 自由實驗室</h1>
          <p className="text-sm text-slate-600">
            自由修改或撰寫 Python 程式碼，即時觀察終端機輸出與記憶體變數變化。
          </p>
        </div>

        {/* Segmented Template Picker */}
        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-200/70 rounded-lg">
          {TEMPLATES.map((tpl) => {
            const active = selectedTemplateId === tpl.id;
            return (
              <button
                key={tpl.id}
                type="button"
                onClick={() => handleSelectTemplate(tpl.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-white text-slate-950 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tpl.title}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Code Editor */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
            <span className="font-mono text-xs font-medium text-slate-700">sandbox.py</span>
            <span className="text-xs text-slate-500">支援 Tab 自動縮排 4 格</span>
          </div>

          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            aria-label="Python 程式碼編輯器"
            rows={13}
            className="w-full p-5 bg-slate-900 text-slate-100 font-mono text-sm leading-relaxed focus:outline-none resize-y"
          />

          <div className="px-4 py-3 bg-white border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={() => handleSelectTemplate(selectedTemplateId)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>恢復範本</span>
            </button>

            <button
              type="button"
              onClick={handleRun}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold transition-colors cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>執行程式</span>
            </button>
          </div>
        </div>

        {/* Live Output & Variable Inspector */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <Terminal className="w-4 h-4 text-slate-500" />
                <span>執行結果</span>
              </div>
              {execution && (
                <span className="text-xs text-slate-500 tabular-nums">
                  執行步驟：{execution.stepsExecuted}
                </span>
              )}
            </div>

            <div className="p-4 bg-slate-950 text-slate-100 font-mono text-sm min-h-[150px]">
              {!execution ? (
                <div className="text-slate-500 text-xs">點擊「執行程式」查看輸出結果</div>
              ) : execution.error ? (
                <div className="space-y-1.5">
                  <div className="text-rose-400 font-semibold">
                    {execution.error.type}: {execution.error.message}
                  </div>
                  <div className="text-xs text-slate-300 leading-relaxed">
                    提示：{execution.error.friendlyHint}
                  </div>
                </div>
              ) : execution.output.length === 0 ? (
                <div className="text-slate-400 text-xs">程式執行完畢（無 print 輸出）</div>
              ) : (
                <div className="space-y-1">
                  {execution.output.map((line, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-emerald-400 select-none">&gt;</span>
                      <span>{line}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <Database className="w-4 h-4 text-slate-500" />
                <span>變數記憶體觀察區</span>
              </div>
            </div>

            <div className="p-4">
              {!execution || execution.variables.length === 0 ? (
                <p className="text-xs text-slate-500">尚未建立任何全域變數。</p>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="pb-2 font-medium">名稱</th>
                      <th className="pb-2 font-medium">值</th>
                      <th className="pb-2 font-medium">型別</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
                    {execution.variables.map((v) => (
                      <tr key={v.name}>
                        <td className="py-2 pr-3 font-semibold text-slate-900">{v.name}</td>
                        <td className="py-2 pr-3 text-sky-700">{v.valueDisplay}</td>
                        <td className="py-2 text-slate-500 font-sans">{v.typeName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
