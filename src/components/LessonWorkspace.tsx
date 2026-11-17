import { useEffect, useState } from 'react';
import { Lightbulb, Play, RotateCcw, ArrowLeft, ArrowRight } from 'lucide-react';
import {
  ALL_LESSONS,
  CURRICULUM_STAGES,
  getLessonById,
  getNextLesson,
  getStageById,
} from '../data/curriculum';
import { runPythonCode } from '../engine/pythonRunner';
import type {
  ExecutionResult,
  Lesson,
  LessonValidationResult,
  UserProgress,
} from '../types/curriculum';
import { DragBlocksEditor } from './DragBlocksEditor';
import { FeedbackConsole } from './FeedbackConsole';
import { FillBlankEditor } from './FillBlankEditor';
import { SyllabusSidebar } from './SyllabusSidebar';
import { SyntaxSpotlight } from './SyntaxSpotlight';

interface LessonWorkspaceProps {
  currentLessonId: string;
  progress: UserProgress;
  onSelectLesson: (lessonId: string) => void;
  onCompleteLesson: (lesson: Lesson) => { xpAwarded: number; stageCompletedTitle: string | null };
}

function assembleCodeFromLesson(
  lesson: Lesson,
  slotAssignments: Record<string, string>,
  blankValues: Record<string, string>
): string {
  const blocksById = new Map((lesson.blocks ?? []).map((b) => [b.id, b.code]));

  return lesson.lines
    .map((line) => {
      const indentStr = '    '.repeat(line.indent);
      const body = line.segments
        .map((seg) => {
          if (seg.type === 'text') return seg.value;
          if (seg.type === 'slot') {
            const blockId = slotAssignments[seg.id];
            return blockId ? (blocksById.get(blockId) ?? '') : '';
          }
          if (seg.type === 'blank') {
            return (blankValues[seg.id] ?? '').trim();
          }
          return '';
        })
        .join('');
      return `${indentStr}${body}`;
    })
    .join('\n');
}

export function LessonWorkspace({
  currentLessonId,
  progress,
  onSelectLesson,
  onCompleteLesson,
}: LessonWorkspaceProps) {
  const lesson = getLessonById(currentLessonId);
  const stage = getStageById(lesson.stageId);
  const nextLesson = getNextLesson(lesson.id);
  const currentIdx = ALL_LESSONS.findIndex((l) => l.id === lesson.id);
  const prevLesson = currentIdx > 0 ? ALL_LESSONS[currentIdx - 1] : null;

  const [slotAssignments, setSlotAssignments] = useState<Record<string, string>>({});
  const [blankValues, setBlankValues] = useState<Record<string, string>>({});
  const [execution, setExecution] = useState<ExecutionResult | null>(null);
  const [validation, setValidation] = useState<LessonValidationResult | null>(null);
  const [revealedHintCount, setRevealedHintCount] = useState<number>(0);
  const [xpEarnedThisRun, setXpEarnedThisRun] = useState<number>(0);
  const [stageJustCompletedTitle, setStageJustCompletedTitle] = useState<string | null>(null);

  useEffect(() => {
    setSlotAssignments({});
    setBlankValues({});
    setExecution(null);
    setValidation(null);
    setRevealedHintCount(0);
    setXpEarnedThisRun(0);
    setStageJustCompletedTitle(null);
  }, [lesson.id]);

  const handleAssignSlot = (slotId: string, blockId: string) => {
    setSlotAssignments((prev) => {
      const next = { ...prev };
      // If block was already placed in another slot, move it cleanly
      for (const [existingSlot, existingBlock] of Object.entries(next)) {
        if (existingBlock === blockId) {
          delete next[existingSlot];
        }
      }
      next[slotId] = blockId;
      return next;
    });
  };

  const handleClearSlot = (slotId: string) => {
    setSlotAssignments((prev) => {
      const next = { ...prev };
      delete next[slotId];
      return next;
    });
  };

  const handleChangeBlank = (blankId: string, value: string) => {
    setBlankValues((prev) => ({ ...prev, [blankId]: value }));
  };

  const handleReset = () => {
    setSlotAssignments({});
    setBlankValues({});
    setExecution(null);
    setValidation(null);
    setRevealedHintCount(0);
    setXpEarnedThisRun(0);
    setStageJustCompletedTitle(null);
  };

  const handleRunAndCheck = () => {
    // Check if any required slot or blank is empty first for gentler UX
    const missingSlots = lesson.lines.some((line) =>
      line.segments.some((seg) => seg.type === 'slot' && !slotAssignments[seg.id])
    );
    const missingBlanks = lesson.lines.some((line) =>
      line.segments.some((seg) => seg.type === 'blank' && !(blankValues[seg.id] ?? '').trim())
    );

    if (missingSlots || missingBlanks) {
      setExecution(null);
      setValidation({
        passed: false,
        headline: '還有空白處尚未完成喔',
        feedback:
          lesson.mode === 'drag-blocks'
            ? '請先將下方的積木放入所有虛線插槽中，再點擊「執行並檢查」。'
            : '請先填滿程式碼中所有的輸入框，再點擊「執行並檢查」。',
      });
      return;
    }

    const blocksById = new Map((lesson.blocks ?? []).map((b) => [b.id, b.code]));
    const slotValues: Record<string, string> = {};
    for (const [slotId, blockId] of Object.entries(slotAssignments)) {
      slotValues[slotId] = blocksById.get(blockId) ?? '';
    }

    const assembledCode = assembleCodeFromLesson(lesson, slotAssignments, blankValues);
    const execResult = runPythonCode(assembledCode);
    setExecution(execResult);

    const checkResult = lesson.validate({
      assembledCode,
      slotValues,
      blankValues,
      execution: execResult,
    });
    setValidation(checkResult);

    if (checkResult.passed) {
      const reward = onCompleteLesson(lesson);
      setXpEarnedThisRun(reward.xpAwarded);
      setStageJustCompletedTitle(reward.stageCompletedTitle);
    } else {
      setXpEarnedThisRun(0);
      setStageJustCompletedTitle(null);
    }
  };

  const handleRevealHint = () => {
    setRevealedHintCount((prev) => Math.min(lesson.hints.length, prev + 1));
  };

  const isCompleted = progress.completedLessonIds.includes(lesson.id);

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-6 lg:py-8 flex flex-col lg:flex-row items-start gap-8">
      {/* Left Navigation Rail */}
      <SyllabusSidebar
        stages={CURRICULUM_STAGES}
        currentLessonId={lesson.id}
        completedLessonIds={progress.completedLessonIds}
        xp={progress.xp}
        streak={progress.streak}
        onSelectLesson={onSelectLesson}
      />

      {/* Main Interactive Stage */}
      <main className="flex-1 min-w-0 w-full space-y-6">
        {/* Clean Unboxed Lesson Header */}
        <section className="bg-white border border-slate-200 rounded-xl p-6 sm:p-7 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sky-700">
                第 {stage.number} 階段：{stage.title}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">課程 {lesson.orderLabel}</span>
              <span aria-hidden="true">·</span>
              <span>{lesson.mode === 'drag-blocks' ? '拖拽積木練習' : '程式碼填空練習'}</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">+{lesson.xpReward} XP</span>
            </div>
            {isCompleted && (
              <span className="text-emerald-700 font-semibold">已完成本課</span>
            )}
          </div>

          <div className="space-y-2 max-w-3xl">
            <h1 className="text-2xl sm:text-[26px] font-bold tracking-tight text-slate-950 text-balance">
              {lesson.title}
            </h1>
            <p className="text-[15px] leading-relaxed text-slate-700">
              {lesson.conceptSummary}
            </p>
          </div>

          <SyntaxSpotlight
            caption={lesson.syntaxSpotlight.caption}
            tokens={lesson.syntaxSpotlight.tokens}
          />
        </section>

        {/* Two-Zone Interactive Workbench */}
        <section className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Left 7 cols: Task & Code Workbench */}
          <div className="xl:col-span-7 space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900 mb-1">
                    動手實作任務
                  </h2>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {lesson.taskPrompt}
                  </p>
                </div>
              </div>

              {lesson.mode === 'drag-blocks' ? (
                <DragBlocksEditor
                  lines={lesson.lines}
                  blocks={lesson.blocks ?? []}
                  slotAssignments={slotAssignments}
                  onAssignSlot={handleAssignSlot}
                  onClearSlot={handleClearSlot}
                />
              ) : (
                <FillBlankEditor
                  lines={lesson.lines}
                  blankValues={blankValues}
                  onChangeBlank={handleChangeBlank}
                  onSubmitRun={handleRunAndCheck}
                />
              )}

              {/* Hint Drawer (Progressive Disclosure) */}
              {revealedHintCount > 0 && (
                <div className="bg-sky-50/70 border border-sky-200 rounded-lg p-4 space-y-2">
                  <div className="text-xs font-semibold text-sky-900 flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-sky-700" />
                    <span>學習提示（已顯示 {revealedHintCount} / {lesson.hints.length}）</span>
                  </div>
                  <ul className="space-y-1.5 text-sm text-sky-950">
                    {lesson.hints.slice(0, revealedHintCount).map((hint, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {idx + 1}. {hint}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Primary Action Controls */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>重置</span>
                  </button>

                  {revealedHintCount < lesson.hints.length && (
                    <button
                      type="button"
                      onClick={handleRevealHint}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <Lightbulb className="w-4 h-4 text-amber-600" />
                      <span>
                        {revealedHintCount === 0 ? '查看提示' : '再看一個提示'}
                      </span>
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleRunAndCheck}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>執行並檢查</span>
                </button>
              </div>
            </div>

            {/* Bottom Prev / Next Lesson Navigation */}
            <div className="flex items-center justify-between gap-4 pt-1">
              {prevLesson ? (
                <button
                  type="button"
                  onClick={() => onSelectLesson(prevLesson.id)}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-950 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>上一課：{prevLesson.title}</span>
                </button>
              ) : (
                <span />
              )}

              {nextLesson && (
                <button
                  type="button"
                  onClick={() => onSelectLesson(nextLesson.id)}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-950 transition-colors cursor-pointer"
                >
                  <span>下一課：{nextLesson.title}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Right 5 cols: Real-Time Feedback & Memory Inspector */}
          <div className="xl:col-span-5">
            <FeedbackConsole
              expectedOutput={lesson.expectedOutputDisplay}
              execution={execution}
              validation={validation}
              xpEarnedThisRun={xpEarnedThisRun}
              streak={progress.streak}
              hasNextLesson={Boolean(nextLesson)}
              stageJustCompletedTitle={stageJustCompletedTitle}
              onNextLesson={() => {
                if (nextLesson) onSelectLesson(nextLesson.id);
              }}
              onShowHint={handleRevealHint}
            />
          </div>
        </section>
      </main>
    </div>
  );
}
