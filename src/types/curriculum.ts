export type ExerciseMode = 'drag-blocks' | 'fill-blank';

export type AppView = 'learn' | 'map' | 'playground' | 'progress';

export interface SyntaxToken {
  code: string;
  role: 'keyword' | 'function' | 'string' | 'number' | 'variable' | 'operator' | 'punctuation';
  label: string;
  explanation: string;
}

export type CodeSegment =
  | {
      type: 'text';
      value: string;
    }
  | {
      type: 'slot';
      id: string;
      placeholder: string;
      minWidthCh?: number;
    }
  | {
      type: 'blank';
      id: string;
      placeholder: string;
      hint?: string;
      widthCh?: number;
    };

export interface CodeLineTemplate {
  lineNumber: number;
  indent: number; // number of 4-space indentation levels
  segments: CodeSegment[];
}

export interface DraggableBlock {
  id: string;
  code: string;
  category: 'keyword' | 'function' | 'value' | 'operator' | 'variable';
}

export interface VariableSnapshot {
  name: string;
  valueDisplay: string;
  typeName: string;
}

export interface PythonRuntimeError {
  line: number;
  type: string;
  message: string;
  friendlyHint: string;
}

export interface ExecutionResult {
  success: boolean;
  output: string[];
  variables: VariableSnapshot[];
  error?: PythonRuntimeError;
  stepsExecuted: number;
}

export interface LessonValidationContext {
  assembledCode: string;
  slotValues: Record<string, string>;
  blankValues: Record<string, string>;
  execution: ExecutionResult;
}

export interface LessonValidationResult {
  passed: boolean;
  headline: string;
  feedback: string;
  takeaway?: string;
}

export interface Lesson {
  id: string;
  stageId: string;
  orderLabel: string;
  title: string;
  subtitle: string;
  mode: ExerciseMode;
  xpReward: number;
  estimatedMinutes: number;
  conceptSummary: string;
  syntaxSpotlight: {
    tokens: SyntaxToken[];
    caption: string;
  };
  taskPrompt: string;
  expectedOutputDisplay: string[];
  lines: CodeLineTemplate[];
  blocks?: DraggableBlock[];
  hints: string[];
  validate: (ctx: LessonValidationContext) => LessonValidationResult;
}

export interface Stage {
  id: string;
  number: number;
  title: string;
  description: string;
  milestoneTitle: string;
  milestoneDescription: string;
  lessons: Lesson[];
}

export interface UserProgress {
  completedLessonIds: string[];
  xp: number;
  streak: number;
  bestStreak: number;
  lastCompletedDate: string | null;
}
