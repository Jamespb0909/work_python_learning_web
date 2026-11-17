import { useState, useEffect } from 'react';
import { CheckCircle2, ChevronDown, ChevronRight, Circle } from 'lucide-react';
import type { Stage } from '../types/curriculum';

interface SyllabusSidebarProps {
  stages: Stage[];
  currentLessonId: string;
  completedLessonIds: string[];
  xp: number;
  streak: number;
  onSelectLesson: (lessonId: string) => void;
}

export function SyllabusSidebar({
  stages,
  currentLessonId,
  completedLessonIds,
  xp,
  streak,
  onSelectLesson,
}: SyllabusSidebarProps) {
  const activeStage = stages.find((s) =>
    s.lessons.some((l) => l.id === currentLessonId)
  );
  const [expandedStageIds, setExpandedStageIds] = useState<Record<string, boolean>>(() => ({
    [activeStage?.id ?? 'stage-1']: true,
  }));

  useEffect(() => {
    if (activeStage) {
      setExpandedStageIds((prev) => ({ ...prev, [activeStage.id]: true }));
    }
  }, [activeStage]);

  const toggleStage = (stageId: string) => {
    setExpandedStageIds((prev) => ({
      ...prev,
      [stageId]: !prev[stageId],
    }));
  };

  const totalLessons = stages.reduce((sum, s) => sum + s.lessons.length, 0);
  const completedCount = completedLessonIds.length;
  const progressPct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  return (
    <aside
      aria-label="課程階段目錄"
      className="w-full lg:w-[296px] shrink-0 bg-white border border-slate-200 rounded-xl flex flex-col overflow-hidden"
    >
      {/* Top Progress Summary */}
      <div className="p-5 border-b border-slate-200 bg-slate-50/60">
        <div className="flex items-baseline justify-between mb-2">
          <h2 className="text-sm font-semibold text-slate-900">課程學習路徑</h2>
          <span className="text-xs font-mono tabular-nums text-slate-600">
            {completedCount} / {totalLessons} 課
          </span>
        </div>
        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-sky-600 transition-all duration-300 rounded-full"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-600 tabular-nums">
          <span>累積經驗 {xp} XP</span>
          <span aria-hidden="true">·</span>
          <span>連續完成 {streak} 題</span>
        </div>
      </div>

      {/* Collapsible 4 Stages */}
      <div className="divide-y divide-slate-100">
        {stages.map((stage) => {
          const isExpanded = Boolean(expandedStageIds[stage.id]);
          const stageCompletedCount = stage.lessons.filter((l) =>
            completedLessonIds.includes(l.id)
          ).length;
          const stageAllDone = stageCompletedCount === stage.lessons.length;

          return (
            <div key={stage.id}>
              <button
                type="button"
                onClick={() => toggleStage(stage.id)}
                aria-expanded={isExpanded}
                className="w-full px-5 py-3.5 flex items-start justify-between gap-3 text-left hover:bg-slate-50 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-sky-600"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-0.5">
                    <span className="font-medium text-sky-700">階段 {stage.number}</span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">
                      {stageCompletedCount}/{stage.lessons.length} 完成
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-slate-900 truncate">
                    {stage.title}
                  </div>
                </div>
                <span className="mt-1 text-slate-400 shrink-0">
                  {stageAllDone && !isExpanded ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" aria-label="階段已完成" />
                  ) : isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </span>
              </button>

              {isExpanded && (
                <ul className="pb-2.5 px-3 space-y-1">
                  {stage.lessons.map((lesson) => {
                    const isCompleted = completedLessonIds.includes(lesson.id);
                    const isCurrent = lesson.id === currentLessonId;
                    const modeLabel = lesson.mode === 'drag-blocks' ? '積木' : '填空';

                    return (
                      <li key={lesson.id}>
                        <button
                          type="button"
                          onClick={() => onSelectLesson(lesson.id)}
                          className={`w-full px-3 py-2.5 rounded-lg flex items-center gap-3 text-left transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-sky-600 ${
                            isCurrent
                              ? 'bg-sky-50 text-sky-950 font-semibold'
                              : 'text-slate-700 hover:bg-slate-50 hover:text-slate-950'
                          }`}
                        >
                          <span className="shrink-0">
                            {isCompleted ? (
                              <CheckCircle2
                                className="w-4 h-4 text-emerald-600"
                                aria-label="已完成"
                              />
                            ) : (
                              <Circle
                                className={`w-4 h-4 ${
                                  isCurrent ? 'text-sky-600' : 'text-slate-300'
                                }`}
                                aria-label="未完成"
                              />
                            )}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm truncate">{lesson.title}</div>
                            <div className="text-xs text-slate-500 font-normal flex items-center gap-1.5">
                              <span className="font-mono tabular-nums">{lesson.orderLabel}</span>
                              <span aria-hidden="true">·</span>
                              <span>{modeLabel}</span>
                            </div>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
