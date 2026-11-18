import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { CheckCircle2, Heart, Volume2, X, XCircle } from "lucide-react";
import { Button } from "./Button";
import { Modal } from "./Modal";
import { englishUnits } from "../course/english-course";
import { getTasks, grade, type Progress } from "../lib/progress";
import { asset, cn } from "../lib/utils";
import { speakEnglish } from "../lib/speech";

type Props = {
  module: number; lesson: number; progress: Progress;
  setProgress: Dispatch<SetStateAction<Progress>>; onExit: () => void;
};

function sound(path: string) {
  void new Audio(asset(path)).play().catch(() => undefined);
}

export default function Quiz({ module, lesson, progress, setProgress, onExit }: Props) {
  const tasks = getTasks(module, lesson);
  const initialCompleted = useRef(new Set(progress.completed));
  const [practice, setPractice] = useState(() => tasks.every((task) => initialCompleted.current.has(task.key)));
  const [index, setIndex] = useState(() => Math.max(0, tasks.findIndex((task) => !initialCompleted.current.has(task.key))));
  const [selected, setSelected] = useState<number>();
  const [status, setStatus] = useState<"none" | "correct" | "wrong">("none");
  const [exitOpen, setExitOpen] = useState(false);
  const [heartsOpen, setHeartsOpen] = useState(false);
  const [speechError, setSpeechError] = useState(false);
  const [earned, setEarned] = useState(0);
  const busy = useRef(false);
  const task = tasks[index];
  const lessonTitle = englishUnits[module - 1].lessons[lesson].title;
  const percentage = Math.min(100, (index + (status === "correct" ? 1 : 0)) / tasks.length * 100);

  const choose = (option: number) => {
    if (status !== "none" || !task || exitOpen || heartsOpen) return;
    setSelected(option);
    const text = task.options[option].text;
    if (/^[a-z]/i.test(text)) speakEnglish(text);
  };

  const check = () => {
    if (busy.current || selected === undefined || !task || exitOpen || heartsOpen) return;
    if (status === "wrong") { setStatus("none"); setSelected(undefined); return; }
    if (status === "correct") {
      setIndex((value) => value + 1); setStatus("none"); setSelected(undefined); return;
    }
    if (!practice && progress.hearts === 0) { setHeartsOpen(true); return; }
    busy.current = true;
    const correct = task.options[selected].correct;
    setProgress((previous) => grade(previous, task.key, correct, practice));
    if (correct) {
      if (practice || !progress.completed.includes(task.key)) setEarned((value) => value + 10);
      setStatus("correct"); sound("/correct.wav");
    } else { setStatus("wrong"); sound("/incorrect.wav"); }
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!task || exitOpen || heartsOpen) return;
      if (event.repeat) return;
      if (/^[1-3]$/.test(event.key)) { event.preventDefault(); choose(Number(event.key) - 1); }
      if (event.key === "Enter") { event.preventDefault(); check(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  useEffect(() => { if (!task) sound("/finish.mp3"); }, [task]);
  useEffect(() => { busy.current = false; }, [status, index]);

  if (!task) return (
    <div className="flex min-h-dvh flex-col">
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-6 px-6 py-12 text-center">
        <img src={asset("/finish.svg")} alt="Урок завершён" className="h-28 w-28" />
        <h1 className="text-3xl font-extrabold text-neutral-700">Отличная работа!<br />Урок завершён.</h1>
        <p className="text-neutral-500">{lessonTitle}{practice ? " · Повторение" : ""}</p>
        <div className="grid w-full grid-cols-2 gap-4">
          <div className="rounded-2xl border-2 border-amber-400 p-5 font-extrabold text-amber-500"><p className="mb-3 text-xs uppercase">Очки опыта</p><p className="text-3xl">+{earned} XP</p></div>
          <div className="rounded-2xl border-2 border-rose-400 p-5 font-extrabold text-rose-500"><p className="mb-3 text-xs uppercase">Сердечки</p><p className="text-3xl">♥ {progress.hearts}</p></div>
        </div>
      </main>
      <footer className="flex flex-wrap justify-center gap-4 border-t-2 p-6">
        <Button onClick={() => { setPractice(true); setIndex(0); setStatus("none"); setSelected(undefined); setEarned(0); }}>Повторить урок</Button>
        <Button variant="secondary" onClick={onExit}>Продолжить</Button>
      </footer>
    </div>
  );

  const correctAnswer = task.options.find((option) => option.correct)!.text;
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center gap-5 px-6 pt-6 lg:gap-8 lg:px-10 lg:pt-12">
        <button aria-label="Выйти из урока" onClick={() => setExitOpen(true)} className="rounded p-1 text-slate-500"><X /></button>
        <div className="h-4 flex-1 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label="Прогресс урока" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(percentage)}><div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${percentage}%` }} /></div>
        <div className="flex shrink-0 items-center gap-2 font-extrabold text-rose-500" aria-label={`Сердечки: ${progress.hearts}`}><Heart className="fill-rose-500" />{progress.hearts}</div>
      </header>
      <main className="mx-auto flex w-full max-w-[650px] flex-1 flex-col justify-center gap-7 px-6 py-10 lg:py-16">
        <p className="text-center text-xs font-bold uppercase tracking-wide text-neutral-400">Модуль {module} · {lessonTitle}{practice ? " · Повторение" : ""}</p>
        <h1 className="text-center text-xl font-extrabold leading-snug text-neutral-700 lg:text-left lg:text-3xl">{task.type === "ASSIST" ? "Выбери русский перевод" : task.question}</h1>
        {task.type === "ASSIST" && <div className="flex items-center gap-4">
          <img src={asset("/mascot.svg")} alt="Талисман GLingo" className="h-14 w-14" />
          <div className="flex items-center gap-3 rounded-2xl border-2 p-3">
            <button aria-label={`Прослушать слово ${task.question}`} className="rounded-lg p-2 text-sky-500 hover:bg-sky-50" onClick={() => setSpeechError(!speakEnglish(task.question))}><Volume2 /></button>
            <span lang="en">{task.question}</span>
          </div>
        </div>}
        {speechError && <p role="status" className="text-sm text-amber-700">Браузер не поддерживает озвучку. Можно продолжить без звука.</p>}
        <div className={cn("grid gap-3", task.type === "ASSIST" ? "grid-cols-1" : "grid-cols-2 lg:grid-cols-3")}>
          {task.options.map((option, optionIndex) => <button key={option.text} type="button" aria-pressed={selected === optionIndex} disabled={status !== "none"} onClick={() => choose(optionIndex)} className={cn(
            "rounded-2xl border-2 border-b-4 p-4 text-neutral-600 transition hover:bg-slate-50 active:border-b-2 lg:p-5",
            selected === optionIndex && "border-sky-300 bg-sky-100 text-sky-600 hover:bg-sky-100",
            selected === optionIndex && status === "correct" && "border-green-400 bg-green-100 text-green-600",
            selected === optionIndex && status === "wrong" && "border-rose-400 bg-rose-100 text-rose-600",
          )}>
            {option.imageSrc && <img src={asset(option.imageSrc)} alt={option.text} className="mx-auto mb-4 h-20 w-full object-contain lg:h-36" />}
            <div className="flex items-center justify-between gap-2"><span lang={task.type === "SELECT" ? "en" : "ru"} className="min-w-0 flex-1 break-words text-sm lg:text-base">{option.text}</span><span aria-hidden className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 text-xs text-neutral-400">{optionIndex + 1}</span></div>
          </button>)}
        </div>
        {practice && <p className="text-center text-sm font-bold text-green-600">Повторение восстанавливает сердечки. Ошибки их не отнимают.</p>}
      </main>
      <footer className={cn("border-t-2", status === "correct" && "border-green-100 bg-green-100", status === "wrong" && "border-rose-100 bg-rose-100")}>
        <div className="mx-auto flex min-h-28 max-w-6xl flex-wrap items-center justify-between gap-5 px-6 py-5 lg:min-h-36 lg:px-10">
          {status !== "none" && <div role="status" className={cn("flex min-w-0 items-center gap-4", status === "correct" ? "text-green-600" : "text-rose-600")}>
            {status === "correct" ? <CheckCircle2 className="h-8 w-8 shrink-0" /> : <XCircle className="h-8 w-8 shrink-0" />}
            <div><p className="text-lg font-extrabold lg:text-2xl">{status === "correct" ? "Верно!" : "Попробуй ещё раз."}</p><p className="mt-1 text-sm">{status === "wrong" ? "Правильный ответ: " : ""}{correctAnswer}</p></div>
          </div>}
          <Button variant={status === "wrong" ? "danger" : "secondary"} className="ml-auto" size="lg" disabled={selected === undefined} onClick={check}>{status === "none" ? "Проверить" : status === "correct" ? "Дальше" : "Ещё раз"}</Button>
        </div>
      </footer>
      {(exitOpen || heartsOpen) && <Modal titleId="quiz-dialog-title" onClose={() => { setExitOpen(false); setHeartsOpen(false); }}>
          <img src={asset(exitOpen ? "/mascot_sad.svg" : "/heart.svg")} alt="" className="mx-auto mb-5 h-20 w-20" />
          <h2 id="quiz-dialog-title" className="text-2xl font-extrabold text-neutral-700">{exitOpen ? "Завершить занятие?" : "Сердечки закончились"}</h2>
          <p className="my-5 text-neutral-500">{exitOpen ? "Сохранённые ответы останутся в твоём прогрессе." : "Продолжи в режиме повторения: правильные ответы восстановят сердечки."}</p>
          <div className="flex flex-col gap-3">
            <Button variant="primary" autoFocus onClick={() => { if (heartsOpen) setPractice(true); setExitOpen(false); setHeartsOpen(false); }}>{exitOpen ? "Продолжить урок" : "Потренироваться"}</Button>
            <Button variant="dangerOutline" onClick={onExit}>Выйти из урока</Button>
          </div>
      </Modal>}
    </div>
  );
}
