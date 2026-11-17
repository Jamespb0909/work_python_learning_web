import {
  AlertCircle,
  ArrowRight,
  Award,
  CheckCircle2,
  Database,
  Lightbulb,
  Terminal,
} from 'lucide-react';
import type { ExecutionResult, LessonValidationResult } from '../types/curriculum';

interface FeedbackConsoleProps {
  expectedOutput: string[];
  execution: ExecutionResult | null;
  validation: LessonValidationResult | null;
  xpEarnedThisRun: number;
  streak: number;
  hasNextLesson: boolean;
  stageJustCompletedTitle?: string | null;
  onNextLesson: () => void;
  onShowHint: () => void;
}

export function FeedbackConsole({
  expectedOutput,
  execution,
  validation,
  xpEarnedThisRun,
  streak,
  hasNextLesson,
  stageJustCompletedTitle,
  onNextLesson,
  onShowHint,
}: FeedbackConsoleProps) {
  return (
    <div className="space-y-4">
      {/* Real-time Motivational Feedback Banner */}
      {validation && (
        <div
          key={validation.headline}
          className={`animate-settle rounded-xl border p-5 ${
            validation.passed
              ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
              : 'bg-amber-50 border-amber-200 text-amber-950'
          }`}
        >
          <div className="flex items-start gap-3">
            <span className="mt-0.5 shrink-0">
              {validation.passed ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-600" />
              )}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                <h3 className="text-base font-bold">{validation.headline}</h3>
                {validation.passed && (
                  <span className="text-xs font-semibold text-emerald-800 font-mono tabular-nums">
                    {xpEarnedThisRun > 0 ? `+${xpEarnedThisRun} XP` : '已完成挑戰'} · 連續 {streak} 題
                  </span>
                )}
              </div>

              <p className="text-sm leading-relaxed opacity-90">{validation.feedback}</p>

              {validation.passed && validation.takeaway && (
                <p className="mt-3 pt-3 border-t border-emerald-200/80 text-xs leading-relaxed text-emerald-900">
                  <span className="font-semibold">學習小筆記：</span>
                  {validation.takeaway}
                </p>
              )}

              {validation.passed && stageJustCompletedTitle && (
                <div className="mt-3 p-3 rounded-lg bg-white/80 border border-emerald-200 flex items-center gap-2.5 text-xs text-emerald-900">
                  <Award className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    <strong className="font-semibold">解鎖階段里程碑：</strong>
                    {stageJustCompletedTitle}
                  </span>
                </div>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-3">
                {validation.passed && hasNextLesson && (
                  <button
                    type="button"
                    onClick={onNextLesson}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <span>前往下一課</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
                {!validation.passed && (
                  <button
                    type="button"
                    onClick={onShowHint}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white border border-amber-300 hover:bg-amber-100/60 text-amber-900 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Lightbulb className="w-3.5 h-3.5" />
                    <span>查看提示線索</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Console Output Panel */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <Terminal className="w-4 h-4 text-slate-500" />
            <span>終端機輸出 (Console)</span>
          </div>
          <span className="text-xs text-slate-500">
            預期目標：{expectedOutput.join(' / ')}
          </span>
        </div>

        <div className="p-4 bg-slate-950 text-slate-100 font-mono text-sm min-h-[116px]">
          {!execution ? (
            <div className="text-slate-500 text-xs leading-relaxed">
              點擊「執行並檢查」後，這裡會即時顯示你的 Python 程式執行結果。
            </div>
          ) : execution.error ? (
            <div className="space-y-1.5">
              {execution.output.length > 0 && (
                <div className="pb-2 mb-2 border-b border-slate-800 space-y-1 text-slate-300">
                  {execution.output.map((line, i) => (
                    <div key={i}>{line}</div>
                  ))}
                </div>
              )}
              <div className="text-rose-400 font-semibold">
                {execution.error.type}: {execution.error.message}
              </div>
              <div className="text-xs text-slate-300 leading-relaxed">
                建議檢查：{execution.error.friendlyHint}
              </div>
            </div>
          ) : execution.output.length === 0 ? (
            <div className="text-slate-400 text-xs">
              程式已執行完成，但沒有印出任何文字（可以使用 print() 輸出結果）。
            </div>
          ) : (
            <div className="space-y-1">
              {execution.output.map((line, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-emerald-400 select-none">&gt;</span>
                  <span className="break-all">{line}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Live Variable Memory Inspector */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <Database className="w-4 h-4 text-slate-500" />
            <span>變數記憶體狀態</span>
          </div>
          <span className="text-xs text-slate-500 tabular-nums">
            {execution ? `${execution.variables.length} 個變數` : '等待執行'}
          </span>
        </div>

        <div className="p-4">
          {!execution || execution.variables.length === 0 ? (
            <p className="text-xs text-slate-500">
              當程式建立或修改變數時，變數的值與資料型別會即時顯示在這裡。
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="pb-2 font-medium">變數名稱</th>
                    <th className="pb-2 font-medium">目前的值</th>
                    <th className="pb-2 font-medium">資料型別</th>
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
