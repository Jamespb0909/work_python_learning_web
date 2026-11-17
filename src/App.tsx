/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useMemo, useState } from 'react';
import { CurriculumMapView } from './components/CurriculumMapView';
import { Header } from './components/Header';
import { LessonWorkspace } from './components/LessonWorkspace';
import { PlaygroundView } from './components/PlaygroundView';
import { ProgressView } from './components/ProgressView';
import { ALL_LESSONS, getStageById } from './data/curriculum';
import type { AppView, Lesson, UserProgress } from './types/curriculum';

const STORAGE_PROGRESS_KEY = 'pystep_progress_v1';
const STORAGE_CURRENT_LESSON_KEY = 'pystep_current_lesson_v1';

const DEFAULT_PROGRESS: UserProgress = {
  completedLessonIds: [],
  xp: 0,
  streak: 0,
  bestStreak: 0,
  lastCompletedDate: null,
};

function loadInitialProgress(): UserProgress {
  try {
    const raw = localStorage.getItem(STORAGE_PROGRESS_KEY);
    if (!raw) return DEFAULT_PROGRESS;
    const parsed = JSON.parse(raw) as Partial<UserProgress>;
    return {
      completedLessonIds: Array.isArray(parsed.completedLessonIds) ? parsed.completedLessonIds : [],
      xp: typeof parsed.xp === 'number' ? parsed.xp : 0,
      streak: typeof parsed.streak === 'number' ? parsed.streak : 0,
      bestStreak: typeof parsed.bestStreak === 'number' ? parsed.bestStreak : 0,
      lastCompletedDate:
        typeof parsed.lastCompletedDate === 'string' ? parsed.lastCompletedDate : null,
    };
  } catch {
    return DEFAULT_PROGRESS;
  }
}

function loadInitialLessonId(): string {
  try {
    const saved = localStorage.getItem(STORAGE_CURRENT_LESSON_KEY);
    if (saved && ALL_LESSONS.some((l) => l.id === saved)) {
      return saved;
    }
  } catch {
    // Ignore storage read failures
  }
  return ALL_LESSONS[0].id;
}

export default function App() {
  const [activeView, setActiveView] = useState<AppView>('learn');
  const [currentLessonId, setCurrentLessonId] = useState<string>(loadInitialLessonId);
  const [progress, setProgress] = useState<UserProgress>(loadInitialProgress);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_PROGRESS_KEY, JSON.stringify(progress));
    } catch {
      // Ignore storage write failures
    }
  }, [progress]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_CURRENT_LESSON_KEY, currentLessonId);
    } catch {
      // Ignore storage write failures
    }
  }, [currentLessonId]);

  const nextIncompleteLessonId = useMemo(() => {
    const firstIncomplete = ALL_LESSONS.find(
      (l) => !progress.completedLessonIds.includes(l.id)
    );
    return firstIncomplete ? firstIncomplete.id : ALL_LESSONS[0].id;
  }, [progress.completedLessonIds]);

  const handleSelectLesson = (lessonId: string) => {
    setCurrentLessonId(lessonId);
    setActiveView('learn');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleContinueLearning = () => {
    setCurrentLessonId(nextIncompleteLessonId);
    setActiveView('learn');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCompleteLesson = (
    lesson: Lesson
  ): { xpAwarded: number; stageCompletedTitle: string | null } => {
    const alreadyCompleted = progress.completedLessonIds.includes(lesson.id);
    const updatedCompletedIds = alreadyCompleted
      ? progress.completedLessonIds
      : [...progress.completedLessonIds, lesson.id];

    const xpAwarded = alreadyCompleted ? 0 : lesson.xpReward;
    const nextStreak = alreadyCompleted ? progress.streak : progress.streak + 1;
    const nextBestStreak = Math.max(progress.bestStreak, nextStreak);

    const stage = getStageById(lesson.stageId);
    const stageWasAlreadyDone = stage.lessons.every((l) =>
      progress.completedLessonIds.includes(l.id)
    );
    const stageIsNowDone = stage.lessons.every((l) => updatedCompletedIds.includes(l.id));
    const stageCompletedTitle =
      !stageWasAlreadyDone && stageIsNowDone ? stage.milestoneTitle : null;

    setProgress({
      completedLessonIds: updatedCompletedIds,
      xp: progress.xp + xpAwarded,
      streak: nextStreak,
      bestStreak: nextBestStreak,
      lastCompletedDate: new Date().toISOString().slice(0, 10),
    });

    return { xpAwarded, stageCompletedTitle };
  };

  const handleResetProgress = () => {
    setProgress(DEFAULT_PROGRESS);
    setCurrentLessonId(ALL_LESSONS[0].id);
  };

  const continueLabel =
    progress.completedLessonIds.length === 0
      ? '開始第 1 課'
      : progress.completedLessonIds.length === ALL_LESSONS.length
        ? '複習課程'
        : `繼續學習`;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Header
        activeView={activeView}
        onNavigate={(view) => {
          setActiveView(view);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        continueLabel={continueLabel}
        onContinueLearning={handleContinueLearning}
      />

      <div className="flex-1">
        {activeView === 'learn' && (
          <LessonWorkspace
            currentLessonId={currentLessonId}
            progress={progress}
            onSelectLesson={handleSelectLesson}
            onCompleteLesson={handleCompleteLesson}
          />
        )}

        {activeView === 'map' && (
          <CurriculumMapView
            completedLessonIds={progress.completedLessonIds}
            currentLessonId={currentLessonId}
            onSelectLesson={handleSelectLesson}
          />
        )}

        {activeView === 'playground' && <PlaygroundView />}

        {activeView === 'progress' && (
          <ProgressView
            progress={progress}
            nextIncompleteLessonId={nextIncompleteLessonId}
            onSelectLesson={handleSelectLesson}
            onResetProgress={handleResetProgress}
          />
        )}
      </div>
    </div>
  );
}
