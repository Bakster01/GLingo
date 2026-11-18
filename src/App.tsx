import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { ArrowLeft, Check, ChevronDown, Heart, Menu, Star, X, Zap } from "lucide-react";
import { englishUnits, courseStats } from "./course/english-course";
import { Button } from "./components/Button";
import { Modal } from "./components/Modal";
import Quiz from "./components/Quiz";
import { getTasks, lessonPercentage, questionKey, refillHearts, type Progress } from "./lib/progress";
import { useProgress } from "./lib/useProgress";
import { asset, cn } from "./lib/utils";

type Page = "courses" | "learn" | "progress" | "quests" | "shop" | "lesson";
type Route = { page: Page; module: number; lesson: number };
const goals = [20, 50, 100, 250, 500, 1000];

function readRoute(): Route {
  const [page, moduleText, lessonText] = window.location.hash.replace(/^#\/?/, "").split("/");
  const module = Number(moduleText) === 2 ? 2 : 1;
  const lesson = Number(lessonText);
  if (page === "lesson" && Number.isInteger(lesson) && lesson >= 0 && lesson < englishUnits[module - 1].lessons.length) return { page, module, lesson };
  if (["courses", "learn", "progress", "quests", "shop"].includes(page)) return { page: page as Page, module, lesson: 0 };
  return { page: "courses", module: 1, lesson: 0 };
}

const go = (page: Page, module = 1, lesson = 0) => { window.location.hash = `/${page}/${module}${page === "lesson" ? `/${lesson}` : ""}`; };

function Bar({ value, label }: { value: number; label: string }) {
  return <div className="h-3 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(100, Math.round(value))}><div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} /></div>;
}

function Goals({ points }: { points: number }) {
  return <section className="rounded-2xl border-2 p-5"><h2 className="mb-5 text-lg font-extrabold text-neutral-700">Цели</h2><div className="space-y-6">{goals.map((goal) => <div key={goal} className="flex items-center gap-4"><img src={asset("/points.svg")} alt="" className="h-9 w-9" /><div className="flex-1 space-y-2"><p className="text-sm font-bold text-neutral-600">Набрать {goal} XP</p><Bar value={points / goal * 100} label={`Набрать ${goal} XP`} /></div></div>)}</div></section>;
}

function Navigation({ page, activeModule, onClose }: { page: Page; activeModule: number; onClose?: () => void }) {
  return <>
    <a href="#/courses" onClick={onClose} className="mb-8 flex items-center gap-3 px-3 pt-5"><img src={asset("/mascot.svg")} alt="Талисман GLingo" className="h-10 w-10" /><span className="text-3xl font-black tracking-wide text-green-600">GLingo</span></a>
    <nav className="space-y-2" aria-label="Главное меню">{([
      ["learn", "Учиться", "learn.svg"], ["progress", "Мой прогресс", "leaderboard.svg"], ["quests", "Цели", "quests.svg"], ["shop", "Магазин", "shop.svg"],
    ] as const).map(([target, title, icon]) => <a key={target} href={`#/${target}/${activeModule}`} onClick={onClose} className={cn("flex min-h-14 items-center gap-4 rounded-xl border-2 border-transparent px-4 py-3 text-sm font-extrabold uppercase text-slate-500 hover:bg-slate-100", page === target && "border-sky-300 bg-sky-100 text-sky-500")}><img src={asset(`/${icon}`)} alt="" className="h-8 w-8" />{title}</a>)}</nav>
    <a href="#/courses" onClick={onClose} className="mt-6 block px-4 text-sm font-bold text-green-600">Выбрать модуль</a>
  </>;
}

function CoursePicker({ progress, setProgress }: { progress: Progress; setProgress: Dispatch<SetStateAction<Progress>> }) {
  return <section className="mx-auto max-w-3xl px-5 py-6 lg:py-10">
    <p className="mb-2 text-sm font-extrabold uppercase tracking-widest text-green-600">Английский язык</p>
    <h1 className="text-3xl font-black text-neutral-700">Spotlight · 8-й класс</h1>
    <p className="mt-4 max-w-2xl leading-relaxed text-neutral-500">Выбери модуль и раздел учебника. Каждый модуль можно начать отдельно. Переводы и выражения — из словарика WL1–WL7.</p>
    <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">{englishUnits.map((unit) => {
      const done = unit.lessons.filter((_, index) => lessonPercentage(progress, unit.module, index) === 100).length;
      return <button key={unit.module} className="group overflow-hidden rounded-2xl border-2 border-b-4 text-left transition hover:border-green-400 hover:bg-green-50" onClick={() => { setProgress((previous) => ({ ...previous, activeModule: unit.module })); go("learn", unit.module); }}>
        <img src={asset(unit.image)} alt={unit.description} className="h-40 w-full object-cover sm:h-44" />
        <div className="space-y-3 p-5"><h2 className="text-xl font-extrabold text-neutral-700">Модуль {unit.module}</h2><p className="font-bold text-neutral-500">{unit.description}</p><p className="text-sm text-neutral-400">Слов и выражений: {unit.lessons.reduce((sum, lesson) => sum + lesson.words.length, 0)} · тренировок: {unit.lessons.length}</p><Bar value={done / unit.lessons.length * 100} label={`Прогресс модуля ${unit.module}`} /><p className="text-sm font-extrabold text-green-600">{done ? `Пройдено ${done} из ${unit.lessons.length}` : "Начать обучение →"}</p></div>
      </button>;
    })}</div>
    <p className="mt-7 text-sm leading-relaxed text-neutral-400">Прогресс сохраняется в этом браузере. Без регистрации и подписки.</p>
  </section>;
}

function LessonMap({ module, progress }: { module: number; progress: Progress }) {
  const unit = englishUnits[module - 1];
  const nextIndex = unit.lessons.findIndex((_, index) => lessonPercentage(progress, module, index) < 100);
  const groups = new Map<string, number[]>();
  unit.lessons.forEach((lesson, index) => { groups.set(lesson.sectionCode, [...(groups.get(lesson.sectionCode) ?? []), index]); });
  return <section>
    <header className="mb-6 flex items-center gap-3 border-b-2 pb-4">
      <button aria-label="Выбрать модуль" onClick={() => go("courses")} className="rounded-xl p-2 text-neutral-400 hover:bg-slate-50"><ArrowLeft /></button>
      <h1 className="flex-1 text-center text-lg font-extrabold text-neutral-500">{unit.title}</h1>
    </header>
    <p className="mb-6 text-sm leading-relaxed text-neutral-500">Продолжай по порядку или открой нужный раздел учебника.</p>
    {nextIndex >= 0 && <Button variant="secondary" className="mb-6 w-full" onClick={() => go("lesson", module, nextIndex)}>Продолжить обучение</Button>}
    {nextIndex === -1 && <div className="mb-6 rounded-2xl bg-green-50 p-5 text-center font-bold text-green-700">Модуль пройден! Повторяй слова, чтобы закрепить результат.</div>}
    <div className="space-y-5">{[...groups].map(([code, indices]) => {
      const first = unit.lessons[indices[0]];
      const active = indices.includes(nextIndex);
      const completed = indices.filter((index) => lessonPercentage(progress, module, index) === 100).length;
      return <details key={code} open={active} className="group rounded-2xl border-2 border-green-500">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl bg-green-500 p-5 text-white"><div><h2 className="text-lg font-extrabold">{code} · {first.sectionTitle}</h2><p className="mt-2 text-sm text-green-50">{first.source} · {completed}/{indices.length} тренировок</p></div><ChevronDown className="h-6 w-6 shrink-0 transition group-open:rotate-180" /></summary>
        <div className="flex flex-col items-center overflow-hidden px-4 pb-8 pt-6">{indices.map((index, position) => {
          const percent = lessonPercentage(progress, module, index);
          const done = percent === 100;
          const current = index === nextIndex;
          const offset = [0, -35, -70, -35, 0, 35, 70, 35][position % 8];
          return <div key={index} className={cn("flex w-40 flex-col items-center", current ? "mt-12" : "mt-5")} style={{ transform: `translateX(${offset}px)` }}>
            <div className="relative">
              {current && <span className="absolute -top-10 left-1/2 -translate-x-1/2 rounded-xl border-2 bg-white px-3 py-2 text-xs font-black uppercase text-green-500">Начать</span>}
              <button aria-label={unit.lessons[index].title} onClick={() => go("lesson", module, index)} className={cn("flex h-[74px] w-[74px] items-center justify-center rounded-full border-b-8 transition active:border-b-4", done || current ? "border-green-600 bg-green-500 text-white hover:bg-green-400" : "border-neutral-300 bg-neutral-200 text-neutral-400 hover:bg-neutral-100", current && "outline outline-[6px] outline-offset-4 outline-slate-100")}>
                {done ? <Check className="h-10 w-10 stroke-[4]" /> : <Star className={cn("h-9 w-9", current && "fill-white")} />}
              </button>
            </div>
            <p className="mt-4 text-center text-sm font-bold text-neutral-600">{unit.lessons[index].title}</p>
            {percent > 0 && !done && <p className="mt-1 text-xs font-bold text-green-600">{percent}%</p>}
          </div>;
        })}</div>
      </details>;
    })}</div>
  </section>;
}

function PersonalProgress({ progress }: { progress: Progress }) {
  const completed = new Set(progress.completed);
  const learned = englishUnits.reduce((sum, unit) => sum + unit.lessons.flatMap((lesson) => lesson.words).filter((word) =>
    ["SELECT", "ASSIST"].every((type) => completed.has(questionKey(unit.module, word.en, word.ru, type)))
  ).length, 0);
  return <section><img src={asset("/leaderboard.svg")} alt="" className="mx-auto h-24 w-24" /><h1 className="my-6 text-center text-3xl font-extrabold text-neutral-700">Мой прогресс</h1>
    <div className="mb-7 grid grid-cols-2 gap-4"><div className="rounded-2xl border-2 p-5 text-center"><p className="text-3xl font-black text-green-500">{learned}</p><p className="mt-2 text-sm text-neutral-500">из {courseStats.words} слов и выражений</p></div><div className="rounded-2xl border-2 p-5 text-center"><p className="text-3xl font-black text-amber-500">{progress.points}</p><p className="mt-2 text-sm text-neutral-500">очков опыта</p></div></div>
    <p className="mb-6 text-sm leading-relaxed text-neutral-500">Слово считается изученным после правильного перевода в обе стороны.</p>
    <div className="space-y-5">{englishUnits.map((unit) => {
      const tasks = unit.lessons.flatMap((_, index) => getTasks(unit.module, index));
      const done = tasks.filter((task) => completed.has(task.key)).length;
      return <div key={unit.module} className="space-y-4 rounded-2xl border-2 p-5"><h2 className="font-extrabold text-neutral-700">{unit.title}</h2><Bar value={done / tasks.length * 100} label={unit.title} /><p className="text-sm text-neutral-500">Выполнено {done} из {tasks.length} заданий</p><Button size="sm" variant="secondaryOutline" onClick={() => go("learn", unit.module)}>Открыть модуль</Button></div>;
    })}</div>
  </section>;
}

export default function App() {
  const { progress, setProgress, storageUnavailable } = useProgress();
  const [route, setRoute] = useState(readRoute);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    const onHashChange = () => { setRoute(readRoute()); setMenuOpen(false); window.scrollTo(0, 0); };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);
  useEffect(() => {
    if (route.page === "learn" || route.page === "lesson") setProgress((previous) => previous.activeModule === route.module ? previous : { ...previous, activeModule: route.module });
  }, [route.page, route.module, setProgress]);

  if (route.page === "lesson") return <>
    {storageUnavailable && <p role="alert" className="bg-amber-50 p-3 text-center text-sm text-amber-800">Браузер не разрешает сохранение прогресса. Можно заниматься в этой сессии.</p>}
    <Quiz key={`${route.module}:${route.lesson}`} module={route.module} lesson={route.lesson} progress={progress} setProgress={setProgress} onExit={() => go("learn", route.module)} />
  </>;

  const module = route.page === "learn" ? route.module : progress.activeModule;
  return <div className="min-h-dvh">
    <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r-2 bg-white p-4 lg:flex"><Navigation page={route.page} activeModule={module} /><p className="mt-auto px-4 pb-3 text-xs leading-relaxed text-neutral-400">Твой прогресс хранится в этом браузере.</p></aside>
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between bg-green-500 px-4 text-white lg:hidden"><button aria-label="Открыть меню" onClick={() => setMenuOpen(true)} className="rounded p-1"><Menu /></button><a href="#/courses" className="text-xl font-black">GLingo</a><span className="flex items-center gap-1 text-sm font-extrabold"><Heart className="h-5 w-5 fill-white" />{progress.hearts}</span></header>
    <div className="lg:pl-64">
      {storageUnavailable && <p role="alert" className="bg-amber-50 p-3 text-center text-sm text-amber-800">Браузер не разрешает сохранение прогресса. Можно заниматься в этой сессии.</p>}
      {route.page === "courses" ? <CoursePicker progress={progress} setProgress={setProgress} /> : <div className="mx-auto flex max-w-6xl items-start gap-10 px-5 py-7 lg:px-8">
        <main className="min-w-0 flex-1">
          {route.page === "learn" && <LessonMap module={module} progress={progress} />}
          {route.page === "progress" && <PersonalProgress progress={progress} />}
          {route.page === "quests" && <><img src={asset("/quests.svg")} alt="" className="mx-auto h-24 w-24" /><h1 className="my-6 text-center text-3xl font-extrabold text-neutral-700">Цели</h1><p className="mb-6 text-center text-neutral-500">Тренируйся и набирай очки опыта.</p><Goals points={progress.points} /></>}
          {route.page === "shop" && <><img src={asset("/shop.svg")} alt="" className="mx-auto h-24 w-24" /><h1 className="my-6 text-center text-3xl font-extrabold text-neutral-700">Магазин</h1><p className="mb-7 text-center text-neutral-500">Обменивай очки опыта на сердечки.</p><div className="flex flex-wrap items-center gap-4 border-y-2 py-6"><img src={asset("/heart.svg")} alt="" className="h-14 w-14" /><h2 className="flex-1 font-extrabold text-neutral-600">Пополнить сердечки</h2><Button disabled={progress.hearts === 5 || progress.points < 10} onClick={() => setProgress(refillHearts)}>{progress.hearts === 5 ? "Полный запас" : "10 XP"}</Button></div><p className="my-6 text-sm leading-relaxed text-neutral-500">Повторение пройденных уроков тоже восстанавливает сердечки. Подписка и оплата не нужны.</p><Button variant="secondary" onClick={() => go("learn", module)}>Открыть уроки</Button></>}
        </main>
        <aside className="sticky top-7 hidden w-72 shrink-0 space-y-5 xl:block">
          <div className="flex items-center justify-between px-2 font-extrabold"><button onClick={() => go("courses")} aria-label="Выбрать модуль"><img src={asset("/en.svg")} alt="Английский" className="h-7 w-10 rounded border" /></button><span className="flex items-center gap-2 text-amber-500"><Zap className="fill-amber-400" />{progress.points}</span><span className="flex items-center gap-2 text-rose-500"><Heart className="fill-rose-500" />{progress.hearts}</span></div>
          <section className="rounded-2xl border-2 p-5"><h2 className="mb-3 font-extrabold text-green-600">Spotlight · 8-й класс</h2><p className="text-sm leading-relaxed text-neutral-500">Слова и выражения из модулей 1–2. Выбирай нужный раздел и переводи в обе стороны.</p></section>
          {route.page !== "quests" && <Goals points={progress.points} />}
        </aside>
      </div>}
      <footer className="mx-auto max-w-5xl px-5 pb-6 pt-10 text-center text-xs leading-relaxed text-neutral-400">GLingo · Spotlight 8 · Модули 1–2<br /><a className="underline underline-offset-2" href="https://github.com/Bakster01/GLingo" target="_blank" rel="noreferrer">Исходный код</a></footer>
    </div>
    {menuOpen && <Modal titleId="mobile-menu-title" onClose={() => setMenuOpen(false)}><div className="mb-2 flex items-center justify-between"><h2 id="mobile-menu-title" className="font-extrabold text-neutral-600">Меню обучения</h2><button aria-label="Закрыть меню" onClick={() => setMenuOpen(false)}><X /></button></div><Navigation page={route.page} activeModule={module} onClose={() => setMenuOpen(false)} /></Modal>}
  </div>;
}
