import { useState } from 'react';
import { ArrowRight, CheckCircle2, Circle, Code2 } from 'lucide-react';
import { CURRICULUM_STAGES } from '../data/curriculum';

interface CurriculumMapViewProps {
  completedLessonIds: string[];
  currentLessonId: string;
  onSelectLesson: (lessonId: string) => void;
}

export function CurriculumMapView({
  completedLessonIds,
  currentLessonId,
  onSelectLesson,
}: CurriculumMapViewProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const totalCount = CURRICULUM_STAGES.reduce((acc, s) => acc + s.lessons.length, 0);

  return (
    <main className="max-w-[1200px] mx-auto px-4 sm:px-8 py-8 space-y-10">
      {/* Split Hero Header with Generated Illustration */}
      <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch">
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center space-y-4">
          <div className="text-xs font-medium text-sky-700 flex items-center gap-2">
            <span>Python 基礎四階段課程架構</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">共 {totalCount} 堂互動實作課</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-950 text-balance leading-tight">
            從第一行輸出開始，一步步建立紮實的 Python 思維
          </h1>
          <p className="text-[15px] leading-relaxed text-slate-600 max-w-xl">
            每一個階段只專注在核心觀念，透過「積木拖拽組裝」與「程式碼填空」交替練習，搭配即時執行與變數追蹤，讓學習過程清楚且有成就感。
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => onSelectLesson(currentLessonId)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap"
            >
              <span>進入目前課程</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <span className="text-xs text-slate-500 tabular-nums">
              目前進度：{completedLessonIds.length} / {totalCount} 課已完成
            </span>
          </div>
        </div>

        <div className="lg:col-span-5 bg-slate-100 border-t lg:border-t-0 lg:border-l border-slate-200 relative min-h-[220px]">
          {!imgFailed ? (
            <img
              src="/src/assets/images/hero_python_curriculum_1794896614233.jpg"
              alt="Python 基礎課程邏輯模組與資料流動示意圖"
              referrerPolicy="no-referrer"
              onError={() => setImgFailed(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-gradient-to-br from-slate-100 to-sky-50 text-slate-700">
              <Code2 className="w-10 h-10 text-sky-600 mb-3" />
              <span className="text-sm font-semibold">PyStep 漸進式學習架構</span>
            </div>
          )}
        </div>
      </section>

      {/* Clear 4-Stage Progressive Tracks */}
      <section className="space-y-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-xl font-bold text-slate-950">由淺入深的四個學習階段</h2>
          <p className="text-sm text-slate-500">點擊任意課程卡片即可直接開始或複習</p>
        </div>

        <div className="space-y-6">
          {CURRICULUM_STAGES.map((stage) => {
            const doneCount = stage.lessons.filter((l) =>
              completedLessonIds.includes(l.id)
            ).length;

            return (
              <div
                key={stage.id}
                className="bg-white border border-slate-200 rounded-xl p-6 space-y-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="space-y-1 max-w-2xl">
                    <div className="text-xs font-medium text-sky-700 flex items-center gap-2">
                      <span>第 {stage.number} 階段</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums text-slate-500">
                        完成 {doneCount} / {stage.lessons.length} 課
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">{stage.title}</h3>
                    <p className="text-sm text-slate-600">{stage.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {stage.lessons.map((lesson) => {
                    const isCompleted = completedLessonIds.includes(lesson.id);
                    const isCurrent = lesson.id === currentLessonId;

                    return (
                      <button
                        key={lesson.id}
                        type="button"
                        onClick={() => onSelectLesson(lesson.id)}
                        className={`text-left p-4 rounded-xl border transition-all flex flex-col justify-between gap-4 cursor-pointer focus-visible:outline-2 focus-visible:outline-sky-600 ${
                          isCurrent
                            ? 'bg-sky-50/70 border-sky-300'
                            : isCompleted
                              ? 'bg-slate-50/60 border-slate-200 hover:border-slate-300 hover:bg-white'
                              : 'bg-white border-slate-200 hover:border-sky-300 hover:bg-slate-50/50'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                            <span className="font-mono tabular-nums font-medium text-slate-700">
                              課程 {lesson.orderLabel}
                            </span>
                            <span className="flex items-center gap-1">
                              {isCompleted ? (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  <span className="text-emerald-700 font-medium">已完成</span>
                                </>
                              ) : isCurrent ? (
                                <>
                                  <Circle className="w-3.5 h-3.5 text-sky-600 fill-sky-600/20" />
                                  <span className="text-sky-700 font-medium">目前進度</span>
                                </>
                              ) : (
                                <span>未完成</span>
                              )}
                            </span>
                          </div>

                          <h4 className="text-base font-semibold text-slate-900">
                            {lesson.title}
                          </h4>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            {lesson.subtitle}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                          <span>
                            {lesson.mode === 'drag-blocks' ? '拖拽積木' : '程式填空'}
                          </span>
                          <span className="font-mono tabular-nums">+{lesson.xpReward} XP</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
