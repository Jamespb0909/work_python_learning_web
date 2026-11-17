import { useState } from 'react';
import { Award, CheckCircle2, RotateCcw, ArrowRight } from 'lucide-react';
import { ALL_LESSONS, CURRICULUM_STAGES } from '../data/curriculum';
import type { UserProgress } from '../types/curriculum';

interface ProgressViewProps {
  progress: UserProgress;
  nextIncompleteLessonId: string;
  onSelectLesson: (lessonId: string) => void;
  onResetProgress: () => void;
}

export function ProgressView({
  progress,
  nextIncompleteLessonId,
  onSelectLesson,
  onResetProgress,
}: ProgressViewProps) {
  const [confirmReset, setConfirmReset] = useState(false);

  const totalLessons = ALL_LESSONS.length;
  const completedCount = progress.completedLessonIds.length;
  const completionPct = Math.round((completedCount / totalLessons) * 100);

  return (
    <main className="max-w-[1000px] mx-auto px-4 sm:px-8 py-8 space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-950">我的學習紀錄</h1>
          <p className="text-sm text-slate-600">
            追蹤每一個 Python 基礎階段的掌握度與已獲得的里程碑。
          </p>
        </div>

        <button
          type="button"
          onClick={() => onSelectLesson(nextIncompleteLessonId)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold transition-colors cursor-pointer"
        >
          <span>繼續學習</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* 4-column summary metrics */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs text-slate-500 mb-1">總學習進度</div>
          <div className="text-2xl font-bold text-slate-950 tabular-nums">
            {completionPct}%
          </div>
          <div className="text-xs text-slate-600 mt-1 tabular-nums">
            已完成 {completedCount} / {totalLessons} 課
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs text-slate-500 mb-1">累積學習經驗</div>
          <div className="text-2xl font-bold text-sky-700 tabular-nums">
            {progress.xp} XP
          </div>
          <div className="text-xs text-slate-600 mt-1">完成任務自動累積</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs text-slate-500 mb-1">目前連勝紀錄</div>
          <div className="text-2xl font-bold text-emerald-700 tabular-nums">
            {progress.streak} 題
          </div>
          <div className="text-xs text-slate-600 mt-1 tabular-nums">
            最佳紀錄：{progress.bestStreak} 題
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs text-slate-500 mb-1">階段里程碑</div>
          <div className="text-2xl font-bold text-slate-950 tabular-nums">
            {
              CURRICULUM_STAGES.filter((s) =>
                s.lessons.every((l) => progress.completedLessonIds.includes(l.id))
              ).length
            }{' '}
            / {CURRICULUM_STAGES.length}
          </div>
          <div className="text-xs text-slate-600 mt-1">完成整階段即解鎖</div>
        </div>
      </section>

      {/* Stage Milestones */}
      <section className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
        <div className="px-6 py-4">
          <h2 className="text-base font-bold text-slate-900">各階段掌握度與里程碑</h2>
        </div>

        {CURRICULUM_STAGES.map((stage) => {
          const stageDone = stage.lessons.filter((l) =>
            progress.completedLessonIds.includes(l.id)
          ).length;
          const stageTotal = stage.lessons.length;
          const isStageComplete = stageDone === stageTotal;
          const pct = Math.round((stageDone / stageTotal) * 100);

          return (
            <div key={stage.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="font-semibold text-sky-700">第 {stage.number} 階段</span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">{stageDone} / {stageTotal} 課完成</span>
                </div>
                <h3 className="text-base font-semibold text-slate-900">{stage.title}</h3>
                <div className="w-full max-w-md h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isStageComplete ? 'bg-emerald-600' : 'bg-sky-600'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              <div className="sm:text-right shrink-0">
                {isStageComplete ? (
                  <div className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700">
                    <Award className="w-4 h-4" />
                    <span>{stage.milestoneTitle}</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                    <CheckCircle2 className="w-4 h-4 text-slate-300" />
                    <span>完成全部 3 課解鎖「{stage.milestoneTitle}」</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </section>

      {/* Safe Inline Reset Progress Control */}
      <div className="pt-2 flex items-center justify-end">
        {!confirmReset ? (
          <button
            type="button"
            onClick={() => setConfirmReset(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-medium transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>重置學習紀錄</span>
          </button>
        ) : (
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3.5 py-2">
            <span className="text-xs text-slate-700">確定清除所有已完成的課程與 XP 嗎？</span>
            <button
              type="button"
              onClick={() => {
                onResetProgress();
                setConfirmReset(false);
              }}
              className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer"
            >
              確認重置
            </button>
            <button
              type="button"
              onClick={() => setConfirmReset(false)}
              className="px-2.5 py-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium cursor-pointer"
            >
              取消
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
