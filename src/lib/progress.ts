import { englishUnits, buildLessonChallenges } from "../course/english-course";

export type Progress = { schema: 1; completed: string[]; hearts: number; points: number; activeModule: number };
export const freshProgress = (): Progress => ({ schema: 1, completed: [], hearts: 5, points: 0, activeModule: 1 });
export const questionKey = (module: number, en: string, ru: string, type: string) => JSON.stringify([module, en, ru, type]);
export type QuizTask = ReturnType<typeof buildLessonChallenges>[number] & { key: string };
const taskCache = new Map<string, QuizTask[]>();
export const getTasks = (module: number, lesson: number): QuizTask[] => {
  const cacheKey = `${module}:${lesson}`;
  const cached = taskCache.get(cacheKey);
  if (cached) return cached;
  const unit = englishUnits[module - 1];
  const words = unit.lessons[lesson].words;
  const tasks = buildLessonChallenges(words, unit.lessons.flatMap((entry) => entry.words)).map((task, index) => ({
    ...task, key: questionKey(module, words[index % words.length].en, words[index % words.length].ru, task.type),
  }));
  taskCache.set(cacheKey, tasks);
  return tasks;
};
const knownKeys = new Set(englishUnits.flatMap((unit) => unit.lessons.flatMap((lesson) =>
  lesson.words.flatMap((word) => ["SELECT", "ASSIST"].map((type) => questionKey(unit.module, word.en, word.ru, type)))
)));

export function parseProgress(value: string | null): Progress {
  try {
    const parsed = JSON.parse(value ?? "null");
    if (!parsed || parsed.schema !== 1 || !Array.isArray(parsed.completed)) return freshProgress();
    return {
      schema: 1,
      completed: [...new Set<string>(parsed.completed.filter((key: unknown) => typeof key === "string" && knownKeys.has(key)))],
      hearts: Number.isFinite(parsed.hearts) ? Math.min(5, Math.max(0, Math.floor(parsed.hearts))) : 5,
      points: Number.isFinite(parsed.points) ? Math.min(1_000_000_000, Math.max(0, Math.floor(parsed.points))) : 0,
      activeModule: parsed.activeModule === 2 ? 2 : 1,
    };
  } catch { return freshProgress(); }
}

export function grade(progress: Progress, key: string, correct: boolean, practice = false): Progress {
  if (!knownKeys.has(key)) throw new Error("Неизвестное задание");
  if (!practice && progress.hearts === 0) return progress;
  if (!correct) return practice ? progress : { ...progress, hearts: Math.max(0, progress.hearts - 1) };
  const alreadyCompleted = progress.completed.includes(key);
  return {
    ...progress,
    completed: alreadyCompleted ? progress.completed : [...progress.completed, key],
    points: progress.points + (!alreadyCompleted || practice ? 10 : 0),
    hearts: practice ? Math.min(5, progress.hearts + 1) : progress.hearts,
  };
};

export const refillHearts = (progress: Progress): Progress => progress.hearts < 5 && progress.points >= 10
  ? { ...progress, hearts: 5, points: progress.points - 10 } : progress;

export const lessonPercentage = (progress: Progress, module: number, lesson: number) => {
  const tasks = getTasks(module, lesson);
  return Math.round(tasks.filter((task) => progress.completed.includes(task.key)).length / tasks.length * 100);
};
