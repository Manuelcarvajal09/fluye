"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { X, Check, Languages, Lightbulb } from "lucide-react";
import { IcoBolt, IcoFlame, IcoHeart, IcoTarget } from "../Icons";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { GradedStep, Step, Mode } from "@/lib/types";
import { TYPE_LABEL, plain } from "@/lib/types";
import { checkTyped } from "@/lib/answer";
import { speak, stopSpeaking } from "@/lib/audio/tts";
import { AudioButton, Bar, Highlight, TypeChip } from "../ui";
import { MyMascot, useLook } from "../Coach";
import { Confetti } from "../Confetti";
import { Burst, FloatUp } from "../Burst";
import { playSfx } from "@/lib/audio/sfx";
import { correctSay, doneSay, wrongSay, type Say } from "@/lib/motivation";
import { levelFromXp, levelTitle } from "@/lib/game";
import { SpeakPanel, type SpeakResult } from "../SpeakPanel";
import { classifyError, ERROR_LABEL, newAttemptId, type ErrorCategory } from "@/lib/grading";
import { Gem } from "../Nav";
import { useCelebrations } from "../Coach";
import { RepairStep, TaskStep } from "./MissionSteps";
import { ListenStory } from "./ListenStory";
import { readSavedSession, SAVE_KEY, type Saved, type SessionMeta } from "@/lib/sessionSave";

type Grade = 1 | 2 | 3 | 4;
type Feedback = { ok: boolean; grade: Grade; correctText?: string; note?: string; close?: boolean; say?: Say; revealed?: boolean; kind?: "graded" | "self"; given?: string } | null;
type Toast = { id: number; text: string; kind: "goal" | "mission" };

const HEARTS = 5;
/** true mientras se muestra la corrección: el personaje del enunciado baja a la barra de respuesta. */
const Answered = createContext(false);
const graded = (s: Step): s is GradedStep => "isNew" in s;
const modeOf = (s: GradedStep): Mode => s.kind as Mode;

export function SessionRunner({ initial, lessonId, streak: initialStreak, goal, dayXp: initialDayXp, totalXp, name, meta, resume = false }: { initial: Step[]; lessonId?: string; streak: number; goal: number; dayXp: number; totalXp: number; name: string; meta: SessionMeta; resume?: boolean }) {
  const reduce = useReducedMotion();
  const first = name.split(" ")[0] || undefined;
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [wrongRow, setWrongRow] = useState(0);
  const [answered, setAnswered] = useState(0);
  // Corazones de la sesión: bajan con cada fallo, pero nunca bloquean el estudio.
  const [hearts, setHearts] = useState(HEARTS);
  const [milestone, setMilestone] = useState<number | null>(null);
  const [queue, setQueue] = useState<Step[]>(initial);
  const [i, setI] = useState(0);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [xp, setXp] = useState(0);
  const [dayXp, setDayXp] = useState(initialDayXp);
  const [streak, setStreak] = useState(initialStreak);
  const [stats, setStats] = useState({ right: 0, total: 0, learned: 0 });
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [errs, setErrs] = useState<Partial<Record<ErrorCategory, number>>>({});
  const [gems, setGems] = useState(0);
  const [lessonScore, setLessonScore] = useState({ right: 0, total: 0 });
  const requeued = useRef(new Set<string>());
  const submitted = useRef(new Set<string>());
  const started = useRef(0);
  const pending = useRef<Promise<unknown>[]>([]);
  // La lección se fija al montar: si el servidor vuelve a renderizar con otra, no debe cambiar aquí.
  const lesson = useRef(lessonId);
  const finished = useRef(false);
  const sessionMeta = useRef(meta);
  const [shownMeta, setShownMeta] = useState(meta);

  // Reanudar una sesión interrumpida (recarga, cierre de pestaña, sin conexión).
  useEffect(() => {
    if (!resume) return;
    const saved = readSavedSession();
    if (!saved) return;
    sessionMeta.current = saved.meta;
    lesson.current = saved.lessonId;
    /* eslint-disable react-hooks/set-state-in-effect -- restaurar estado guardado una sola vez al montar */
    setShownMeta(saved.meta);
    setQueue(saved.queue);
    setI(saved.i);
    setXp(saved.xp);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [resume]);

  // Registro de la sesión (idempotente por id) para contar sesiones y constancia.
  useEffect(() => {
    const m = sessionMeta.current;
    void fetch("/api/session", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: m.id, kind: m.kind, missionId: m.trackId, minutes: m.minutes, steps: initial.length }) }).catch(() => {});
  }, [initial.length]);

  const step = queue[i];
  const done = i >= queue.length;

  // Progreso real de la sesión: se envía al ocultar/cerrar la página y al salir, para que una sesión a medias cuente como tal.
  const progressRef = useRef({ i: 0, n: 0 });
  useEffect(() => {
    progressRef.current = { i, n: queue.length };
  }, [i, queue.length]);
  useEffect(() => {
    const send = () => {
      const { i: done, n } = progressRef.current;
      if (!done || finished.current) return;
      const m = sessionMeta.current;
      const body = JSON.stringify({ id: m.id, kind: m.kind, minutes: m.minutes, steps: n, done });
      if (navigator.sendBeacon) navigator.sendBeacon("/api/session", new Blob([body], { type: "application/json" }));
    };
    const onHide = () => document.visibilityState === "hidden" && send();
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", send);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", send);
      send();
    };
  }, []);

  useEffect(() => {
    try {
      if (i >= queue.length) localStorage.removeItem(SAVE_KEY);
      else if (i > 0) localStorage.setItem(SAVE_KEY, JSON.stringify({ meta: sessionMeta.current, queue, i, xp, lessonId: lesson.current, savedAt: Date.now() } satisfies Saved));
    } catch {}
  }, [i, queue, xp]);
  const progress = queue.length ? i / queue.length : 1;

  useEffect(() => {
    started.current = Date.now();
    return () => {
      stopSpeaking();
    };
  }, [i]);

  const toast = useCallback((text: string, kind: Toast["kind"]) => {
    const id = Math.random();
    setToasts((t) => [...t, { id, text, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  /** Envía la calificación a FSRS. No bloquea la interfaz. */
  const submit = useCallback(
    (s: GradedStep, grade: Grade, ok: boolean, fb?: Feedback) => {
      const ms = Date.now() - started.current;
      const key = s.item.id + s.kind;
      // Un reintento dentro de la misma sesión es práctica: no vuelve a tocar FSRS ni suma puntos.
      if (submitted.current.has(key)) {
        setStats((st) => ({ ...st, right: st.right + (ok ? 1 : 0), total: st.total + 1 }));
        return;
      }
      submitted.current.add(key);
      const isNew = s.isNew && !requeued.current.has(key);
      const attemptId = newAttemptId();
      // Error útil por categoría (para micro-práctica y el cierre de la sesión).
      let category: ErrorCategory | null = null;
      if (!ok && fb?.kind !== "self") category = s.kind === "listen" ? "comprehension" : s.kind === "prod" && fb?.given ? classifyError(fb.correctText ?? "", fb.given) : "vocab";
      if (category) setErrs((e) => ({ ...e, [category!]: (e[category!] ?? 0) + 1 }));
      const errors = category ? [{ category, expected: fb?.correctText?.slice(0, 200), given: fb?.given?.slice(0, 200) }] : undefined;
      const body = JSON.stringify({ itemId: s.item.id, mode: modeOf(s), grade, correct: ok, isNew, ms, attemptId, firstTry: true, revealed: !!fb?.revealed, kind: fb?.kind ?? "graded", errors });
      const send = () => fetch("/api/review", { method: "POST", headers: { "content-type": "application/json" }, body });
      // Reintenta una vez con el MISMO attemptId: el servidor no duplica si el primero sí llegó.
      const p = send()
        .catch(() => new Promise<Response>((r) => setTimeout(() => r(send()), 1500)))
        .then((r) => (r.ok ? r.json() : null))
        .then((r) => {
          if (!r) return;
          setDayXp(r.dayXp);
          if (r.goalReached) {
            setStreak(r.streak);
            toast(`¡Meta diaria cumplida! Racha de ${r.streak} ${r.streak === 1 ? "día" : "días"} 🔥`, "goal");
          }
          for (const m of r.missions ?? []) toast(`Misión completada: ${m} (+20 XP)`, "mission");
          if (r.gained) setXp((x) => x + r.gained);
          if (r.gems) setGems((g) => g + r.gems);
        })
        .catch(() => {});
      pending.current.push(p);
      setStats((st) => ({ right: st.right + (ok ? 1 : 0), total: st.total + 1, learned: st.learned + (s.isNew && s.kind === "recog" && !requeued.current.has(key) ? 1 : 0) }));
      // Lo fallado vuelve al final de la sesión (una vez), como en Anki "Again".
      if (grade === 1 && !requeued.current.has(key)) {
        requeued.current.add(key);
        setQueue((q) => [...q, { ...s, isNew: false }]);
      }
    },
    [toast],
  );

  const next = useCallback(() => {
    setFeedback(null);
    setI((n) => n + 1);
  }, []);

  /** Al terminar la sesión, guarda la lección (una sola vez). */
  useEffect(() => {
    if (!done || finished.current) return;
    finished.current = true;
    stopSpeaking();
    void fetch("/api/session", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: sessionMeta.current.id, kind: sessionMeta.current.kind, minutes: sessionMeta.current.minutes, done: queue.length, finished: true }) }).catch(() => {});
    if (lesson.current)
      void fetch("/api/lesson", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ lessonId: lesson.current, score: lessonScore.total ? lessonScore.right / lessonScore.total : 1 }),
      }).catch(() => {});
  }, [done, lessonScore]);

  const handleAnswer = (ok: boolean, grade: Grade, extra?: Partial<NonNullable<Feedback>>) => {
    const nextCombo = ok ? combo + 1 : 0;
    const nextWrong = ok ? 0 : wrongRow + 1;
    setCombo(nextCombo);
    setBestCombo((b) => Math.max(b, nextCombo));
    setWrongRow(nextWrong);
    setAnswered((a) => a + 1);
    if (!ok) setHearts((h) => Math.max(0, h - 1));
    const say = ok ? correctSay(nextCombo, first, answered, extra?.close) : wrongSay(nextWrong, first, answered);
    playSfx(ok ? (nextCombo >= 5 && nextCombo % 5 === 0 ? "streak" : "ok") : "bad");
    if (ok && nextCombo >= 5 && nextCombo % 5 === 0) {
      setMilestone(nextCombo);
      setTimeout(() => setMilestone((m) => (m === nextCombo ? null : m)), 2000);
    }
    setFeedback({ ok, grade, ...extra, say });
    if (step.kind === "question") setLessonScore((s2) => ({ right: s2.right + (ok ? 1 : 0), total: s2.total + 1 }));
  };

  if (done) return <Finish xp={xp} stats={stats} streak={streak} dayXp={dayXp} goal={goal} totalXp={totalXp} name={first} bestCombo={bestCombo} errs={errs} gems={gems} meta={shownMeta} hearts={hearts} />;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-4 pt-[max(env(safe-area-inset-top),1rem)] 2xl:max-w-3xl">
      <header className="flex items-center gap-3 py-2">
        <Link href="/hoy" aria-label="Salir de la sesión" className="grid h-10 w-10 place-items-center rounded-xl text-muted hover:bg-surface-2">
          <X size={26} aria-hidden />
        </Link>
        <Bar value={progress} max={1} label="Progreso de la sesión" className="h-4" />
        {combo >= 3 && (
          <span key={combo} className="animate-pop flex items-center gap-1 rounded-full bg-fire-soft px-2.5 py-1 text-sm font-black text-fire" aria-label={`${combo} aciertos seguidos`}>
            <IcoFlame size={20} className="flame" /> {combo}
          </span>
        )}
        <span className="flex items-center gap-0.5 font-black text-bad" aria-label={`${hearts} de ${HEARTS} corazones`}>
          <span key={hearts} className={hearts < HEARTS ? "heart-lost inline-flex" : "inline-flex"}>
            <IcoHeart size={24} className={hearts === 0 ? "opacity-40 grayscale" : ""} />
          </span>
          {hearts}
        </span>
        <span key={xp} className={`flex items-center gap-0.5 font-black text-accent ${xp ? "bump" : ""}`} aria-label={`${xp} XP ganados`}>
          <IcoBolt size={24} /> {xp}
        </span>
      </header>

      {milestone && (
        <div aria-live="polite" className="banner-in pointer-events-none fixed left-1/2 top-20 z-50">
          <div className="relative flex items-center gap-2 rounded-3xl bg-fire px-5 py-3 text-xl font-black text-white shadow-card">
            <Burst kind="fire" count={14} spread={90} size={18} />
            <IcoFlame size={30} className="flame" /> ¡{milestone} seguidas!
          </div>
        </div>
      )}

      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 top-16 z-50 flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div key={t.id} className={`animate-pop relative flex items-center gap-3 rounded-2xl px-4 py-2 font-extrabold shadow-card ${t.kind === "goal" ? "bg-fire text-white" : "bg-accent text-white"}`}>
            <Burst kind={t.kind === "goal" ? "stars" : "mix"} count={12} spread={80} />
            {t.kind === "goal" && <MyMascot mood="cheer" size={44} animate="hop" />}
            {t.text}
          </div>
        ))}
      </div>

      <main className="flex flex-1 flex-col pb-4">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={i}
            initial={reduce ? false : { opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduce ? undefined : { opacity: 0, x: -40 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="flex flex-1 flex-col"
          >
            <Answered.Provider value={!!feedback}>
              <StepView step={step} feedback={feedback} onAnswer={handleAnswer} onNext={next} />
            </Answered.Provider>
          </motion.div>
        </AnimatePresence>
      </main>

      {feedback && (
        <FeedbackBar
          fb={feedback}
          gradable={graded(step)}
          onContinue={(grade) => {
            if (graded(step)) submit(step, grade, feedback.ok, feedback);
            next();
          }}
        />
      )}
    </div>
  );
}

function StepView({ step, feedback, onAnswer, onNext }: { step: Step; feedback: Feedback; onAnswer: (ok: boolean, grade: Grade, extra?: Partial<NonNullable<Feedback>>) => void; onNext: () => void }) {
  switch (step.kind) {
    case "story":
      return <ListenStory lesson={step.lesson} onNext={onNext} label={`Escucha · ${step.lesson.level}`} />;
    case "question":
      return (
        <Choice
          title="Comprensión"
          prompt={<p className="text-2xl font-extrabold">{step.q.q}</p>}
          options={step.q.options}
          answer={step.q.answer}
          locked={!!feedback}
          onPick={(ok) => onAnswer(ok, ok ? 3 : 1, { correctText: step.q.options[step.q.answer], note: step.q.why_es })}
        />
      );
    case "intro":
      return <Intro step={step} onNext={onNext} />;
    case "repair":
      return <RepairStep phrases={step.phrases} onNext={onNext} />;
    case "task":
      return <TaskStep task={step.task} onNext={onNext} />;
    case "recog":
      return (
        <Choice
          title="¿Qué significa?"
          isNew={step.isNew}
          prompt={
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <AudioButton text={step.item.term} autoPlayKey={step.item.id} />
                <div>
                  <p className="text-3xl font-black">{step.item.term}</p>
                  {step.item.ipa && <p className="font-mono text-muted">{step.item.ipa}</p>}
                </div>
              </div>
              <p className="text-lg text-muted">
                <Highlight text={step.item.ex[0].en} />
              </p>
            </div>
          }
          options={step.options}
          answer={step.answer}
          locked={!!feedback}
          onPick={(ok) => onAnswer(ok, ok ? 3 : 1, { correctText: step.options[step.answer], note: step.item.note })}
        />
      );
    case "listen":
      return (
        <Choice
          title="Escucha: ¿qué expresión dice?"
          isNew={step.isNew}
          prompt={
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="flex gap-3">
                <AudioButton text={plain(step.ex.en)} size="lg" autoPlayKey={step.item.id + "l"} />
                <AudioButton text={plain(step.ex.en)} size="lg" slow />
              </div>
              {feedback && (
                <p className="text-center text-lg">
                  <Highlight text={step.ex.en} />
                  <span className="mt-1 block text-base text-muted">{step.ex.es}</span>
                </p>
              )}
            </div>
          }
          options={step.options}
          answer={step.answer}
          locked={!!feedback}
          onPick={(ok) => onAnswer(ok, ok ? 3 : 1, { correctText: step.options[step.answer] })}
        />
      );
    case "prod":
      return <Produce step={step} feedback={feedback} onAnswer={onAnswer} />;
    case "speak":
      return <Speak step={step} feedback={feedback} onAnswer={onAnswer} onSkip={onNext} />;
  }
}

function StepTitle({ children, isNew }: { children: React.ReactNode; isNew?: boolean }) {
  const answered = useContext(Answered);
  return (
    <div className="mb-5 flex items-end gap-1">
      <span className={`speaker ${answered ? "is-away" : ""}`} aria-hidden>
        <MyMascot size={68} mood={isNew ? "wow" : "happy"} animate="bob" />
      </span>
      <h1 className="speech flex min-w-0 flex-wrap items-center gap-2 text-lg font-black">
        {isNew && <span className="chip bg-accent-soft text-accent">NUEVO</span>}
        {children}
      </h1>
    </div>
  );
}

function Choice({ title, prompt, options, answer, locked, onPick, isNew }: { title: string; prompt: React.ReactNode; options: string[]; answer: number; locked: boolean; onPick: (ok: boolean) => void; isNew?: boolean }) {
  const [picked, setPicked] = useState<number | null>(null);
  const pick = useCallback(
    (n: number) => {
      if (locked || picked !== null) return;
      setPicked(n);
      onPick(n === answer);
    },
    [locked, picked, onPick, answer],
  );
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const n = Number(e.key) - 1;
      if (n >= 0 && n < options.length && !(e.target instanceof HTMLInputElement)) pick(n);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [options.length, pick]);
  return (
    <section className="flex flex-1 flex-col">
      <StepTitle isNew={isNew}>{title}</StepTitle>
      <div className="mb-6">{prompt}</div>
      <div className="mt-auto grid gap-3 pb-2 sm:mt-0">
        {options.map((o, n) => {
          const state = picked === null ? undefined : n === answer ? "right" : n === picked ? "wrong" : undefined;
          return (
            <button key={n} type="button" className={`option flex items-center gap-3 ${state === "wrong" ? "animate-shake" : ""}`} data-state={state} onClick={() => pick(n)} disabled={locked && picked === null}>
              <span className="hidden h-7 w-7 shrink-0 place-items-center rounded-lg border-2 border-line text-sm text-muted sm:grid">{n + 1}</span>
              <span>{o}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function Intro({ step, onNext }: { step: Extract<Step, { kind: "intro" }>; onNext: () => void }) {
  const it = step.item;
  return (
    <section className="flex flex-1 flex-col">
      <StepTitle isNew>Expresión nueva</StepTitle>
      <article className="card flex flex-col gap-4 p-5">
        <div className="flex items-start gap-3">
          <AudioButton text={it.term} autoPlayKey={it.id + "i"} />
          <div className="min-w-0">
            <p className="text-3xl font-black leading-tight">{it.term}</p>
            <p className="flex flex-wrap items-center gap-2 text-muted">
              {it.ipa && <span className="font-mono">{it.ipa}</span>}
              <TypeChip type={it.type} />
              <span className="chip">{it.level}</span>
            </p>
          </div>
        </div>
        <p className="text-2xl font-extrabold text-brand-ink">{it.es}</p>
        <p className="text-muted">
          <Languages size={16} className="mr-1 inline" aria-hidden />
          <span lang="en">{it.def}</span>
        </p>
        <ul className="flex flex-col gap-3">
          {it.ex.map((e, n) => (
            <li key={n} className="flex items-start gap-3 rounded-2xl bg-surface-2 p-3">
              <AudioButton text={plain(e.en)} size="sm" />
              <div>
                <p lang="en" className="text-lg font-semibold">
                  <Highlight text={e.en} />
                </p>
                <p className="text-muted">{e.es}</p>
              </div>
            </li>
          ))}
        </ul>
        {it.note && (
          <p className="flex gap-2 rounded-2xl bg-fire-soft p-3 text-sm">
            <Lightbulb size={18} className="shrink-0 text-fire" aria-hidden /> {it.note}
          </p>
        )}
      </article>
      <button type="button" className="btn btn-primary mt-auto w-full sm:mt-6" onClick={onNext} autoFocus>
        ¡Entendido!
      </button>
    </section>
  );
}

function Produce({ step, feedback, onAnswer }: { step: Extract<Step, { kind: "prod" }>; feedback: Feedback; onAnswer: (ok: boolean, grade: Grade, extra?: Partial<NonNullable<Feedback>>) => void }) {
  const [value, setValue] = useState("");
  const reveal = feedback ? step.answer : undefined;
  const prompt = (
    <div className="flex flex-col gap-3">
      <p className="text-lg font-bold text-muted">{step.ex.es}</p>
      <p lang="en" className="text-2xl font-bold leading-relaxed">
        <Highlight text={step.ex.en} hide reveal={reveal} />
      </p>
      <p className="text-sm text-muted">
        Pista: <b>{step.item.es}</b>
      </p>
    </div>
  );
  if (step.options)
    return (
      <Choice
        title="Completa la frase"
        isNew={step.isNew}
        prompt={prompt}
        options={step.options}
        answer={step.options.indexOf(step.answer)}
        locked={!!feedback}
        onPick={(ok) => {
          onAnswer(ok, ok ? 3 : 1, { correctText: step.answer });
          void speak(plain(step.ex.en));
        }}
      />
    );
  return (
    <section className="flex flex-1 flex-col">
      <StepTitle>Escríbelo en inglés</StepTitle>
      <div className="mb-6">{prompt}</div>
      <form
        className="mt-auto flex flex-col gap-3 sm:mt-0"
        onSubmit={(e) => {
          e.preventDefault();
          if (feedback) return;
          const r = checkTyped(value, step.answer);
          onAnswer(r !== "wrong", r === "exact" ? 3 : r === "close" ? 2 : 1, { correctText: step.answer, close: r === "close", given: value });
          void speak(plain(step.ex.en));
        }}
      >
        <label htmlFor="typed" className="sr-only">
          Tu respuesta
        </label>
        <input
          id="typed"
          autoFocus
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          lang="en"
          disabled={!!feedback}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="h-14 rounded-2xl border-2 border-line bg-surface px-4 text-xl font-bold outline-none focus:border-accent"
          placeholder="Escribe la expresión…"
        />
        {!feedback && (
          <div className="grid grid-cols-2 gap-3">
            <button type="button" className="btn btn-ghost" onClick={() => onAnswer(false, 1, { correctText: step.answer, revealed: true })}>
              No me acuerdo
            </button>
            <button type="submit" className="btn btn-primary" disabled={!value.trim()}>
              Comprobar
            </button>
          </div>
        )}
      </form>
    </section>
  );
}

function Speak({ step, feedback, onAnswer, onSkip }: { step: Extract<Step, { kind: "speak" }>; feedback: Feedback; onAnswer: (ok: boolean, grade: Grade, extra?: Partial<NonNullable<Feedback>>) => void; onSkip: () => void }) {
  const result = (r: SpeakResult) => {
    // La autoevaluación manda; el reconocimiento solo baja la nota si claramente no entendió.
    // Autoevaluación: lo que entienda el reconocedor es orientativo y nunca castiga tu memoria ni tu progreso.
    const grade: Grade = r.self === 3 ? 3 : r.self === 2 ? 2 : 1;
    onAnswer(grade > 1, grade, { kind: "self", note: r.ratio !== null ? `Esto entendió el reconocedor: ${Math.round(r.ratio * 100)} % de las palabras (orientativo).` : undefined });
  };
  return (
    <section className="flex flex-1 flex-col">
      <StepTitle>Dilo en voz alta</StepTitle>
      <p lang="en" className="mb-1 text-2xl font-bold">
        <Highlight text={step.ex.en} />
      </p>
      <p className="mb-5 text-muted">{step.ex.es}</p>
      {!feedback && <SpeakPanel target={step.ex.en} onResult={result} />}
      {!feedback && (
        <button type="button" className="mt-auto pt-6 text-center font-bold text-muted underline sm:mt-6" onClick={onSkip}>
          Ahora no puedo hablar
        </button>
      )}
    </section>
  );
}

function FeedbackBar({ fb, gradable, onContinue }: { fb: NonNullable<Feedback>; gradable: boolean; onContinue: (g: Grade) => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => ref.current?.focus(), []);
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Enter" && !(e.target instanceof HTMLButtonElement) && onContinue(fb.grade);
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [fb.grade, onContinue]);
  return (
    <div role="status" className={`pb-safe sticky bottom-0 -mx-4 mt-auto px-4 pt-3 animate-pop ${fb.ok ? "bg-good-soft" : "bg-bad-soft"}`}>
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center gap-3">
          <span className="relative shrink-0">
            {fb.ok && <Burst kind={fb.say?.mood === "cheer" ? "mix" : "stars"} count={fb.say?.mood === "cheer" ? 14 : 9} spread={58} size={14} />}
            <MyMascot mood={fb.say?.mood ?? (fb.ok ? "happy" : "oops")} size={72} animate={fb.ok ? "hop" : "none"} />
          </span>
          <div className="relative min-w-0">
            {fb.ok && <FloatUp className="text-lg text-accent">+10 XP</FloatUp>}
            <p className={`flex items-center gap-2 text-xl font-black ${fb.ok ? "text-good" : "text-bad"}`}>
              {fb.ok ? <Check size={24} aria-hidden strokeWidth={3} className="shrink-0" /> : <X size={24} aria-hidden strokeWidth={3} className="shrink-0" />}
              {fb.say?.text ?? (fb.ok ? "¡Bien!" : "Respuesta correcta:")}
            </p>
            {!fb.ok && <p className="text-sm font-bold">Respuesta correcta:</p>}
          </div>
        </div>
        {fb.correctText && (!fb.ok || fb.close) && <p className="mt-1 text-lg font-bold">{fb.correctText}</p>}
        {fb.note && <p className="mt-1 text-sm">{fb.note}</p>}
        <div className="mt-3 flex gap-2 pb-2">
          {gradable && fb.ok && (
            <>
              <button type="button" className="btn btn-ghost h-12 px-3 text-sm" onClick={() => onContinue(2)} title="Me costó: repásalo antes">
                Me costó
              </button>
              <button type="button" className="btn btn-ghost h-12 px-3 text-sm" onClick={() => onContinue(4)} title="Muy fácil: espacia más">
                Fácil
              </button>
            </>
          )}
          <button ref={ref} type="button" className={`btn grow ${fb.ok ? "btn-primary" : "btn-bad"}`} onClick={() => onContinue(fb.grade)}>
            Continuar
          </button>
        </div>
      </div>
    </div>
  );
}

function Finish({ xp, stats, streak, dayXp, goal, totalXp, name, bestCombo, errs, gems, meta, hearts }: { hearts: number; xp: number; stats: { right: number; total: number; learned: number }; streak: number; dayXp: number; goal: number; totalXp: number; name?: string; bestCombo: number; errs: Partial<Record<ErrorCategory, number>>; gems: number; meta: SessionMeta }) {
  const topErr = (Object.entries(errs) as [ErrorCategory, number][]).sort((a, b) => b[1] - a[1])[0];
  const celebrate = useCelebrations();
  const look = useLook();
  const acc = stats.total ? stats.right / stats.total : 1;
  const before = levelFromXp(totalXp);
  const after = levelFromXp(totalXp + xp);
  const leveled = after.level > before.level;
  const say = useMemo(() => doneSay(acc, name, stats.total + xp), [acc, name, stats.total, xp]);
  const [shown, setShown] = useState(0);
  useEffect(() => {
    playSfx(leveled ? "level" : "done");
    // Cuenta animada de XP.
    const id = setInterval(() => setShown((n) => (n >= xp ? (clearInterval(id), xp) : Math.min(xp, n + Math.max(1, Math.ceil(xp / 25))))), 40);
    return () => clearInterval(id);
  }, [xp, leveled]);
  const cards = [
    { label: "XP", value: `+${shown}`, cls: "text-accent", icon: <IcoBolt size={30} /> },
    { label: "Precisión", value: `${Math.round(acc * 100)}%`, cls: "text-good", icon: <IcoTarget size={30} /> },
    { label: "Racha", value: `${streak}`, cls: "text-fire", icon: <IcoFlame size={30} className="flame" /> },
    { label: hearts === HEARTS ? "¡Sin fallos!" : "Corazones", value: `${hearts}/${HEARTS}`, cls: "text-bad", icon: <IcoHeart size={30} /> },
  ];
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center gap-5 px-4 py-10 text-center">
      {celebrate && <Confetti count={leveled ? 110 : 70} />}
      <div className="relative grid place-items-center">
        <svg aria-hidden viewBox="0 0 200 200" className="rays absolute h-64 w-64 opacity-60 motion-reduce:hidden">
          {Array.from({ length: 12 }, (_, k) => (
            <path key={k} d="M100 100 L92 0 L108 0 Z" transform={`rotate(${k * 30} 100 100)`} style={{ fill: k % 2 ? "var(--brand-soft)" : "var(--accent-soft)" }} />
          ))}
        </svg>
        <Burst kind="mix" count={18} spread={120} size={18} />
        <MyMascot mood="cheer" size={170} animate="hop" className="relative" />
      </div>
      <h1 className="text-4xl font-black">¡Sesión terminada!</h1>
      <p className="rounded-2xl border-2 border-line bg-surface px-4 py-3 text-lg font-extrabold shadow-card">
        <span className="sr-only">{look.name} dice: </span>
        {say.text}
      </p>
      {leveled && (
        <p className="animate-pop relative rounded-2xl bg-accent px-5 py-3 text-lg font-black text-white shadow-card">
          <Burst kind="stars" count={16} spread={110} size={18} />
          🏆 ¡Subiste al nivel {after.level}! {levelTitle(after.level)}
        </p>
      )}
      <p className="text-muted">
        {stats.learned > 0 ? `Aprendiste ${stats.learned} ${stats.learned === 1 ? "expresión nueva" : "expresiones nuevas"}. ` : ""}
        {bestCombo >= 3 ? `Tu mejor racha de aciertos: ${bestCombo}. ` : ""}
        Tus repasos ya quedaron programados.
      </p>
      <div className="stagger grid w-full grid-cols-2 gap-3 sm:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="card flex flex-col items-center gap-1 p-4">
            <span className={c.cls}>{c.icon}</span>
            <span className={`text-3xl font-black ${c.cls}`}>{c.value}</span>
            <span className="text-sm font-bold text-muted">{c.label}</span>
          </div>
        ))}
      </div>
      <div className="w-full">
        <p className="mb-2 text-sm font-bold text-muted">
          Meta de hoy: {Math.min(dayXp, goal)} / {goal} XP
        </p>
        <Bar value={dayXp} max={goal} color="var(--fire)" label="Meta diaria" />
      </div>
      <div className="w-full">
        <p className="mb-2 text-sm font-bold text-muted">
          Nivel {after.level} · {levelTitle(after.level)} · {after.into}/{after.span} XP
        </p>
        <Bar value={after.into} max={after.span} color="var(--accent)" label="Progreso de nivel" />
      </div>
      {gems > 0 && (
        <p className="animate-pop flex items-center gap-2 rounded-full bg-accent-soft px-4 py-2 font-black text-accent">
          <Gem size={18} /> +{gems} gemas
        </p>
      )}
      {topErr && (
        <div className="module w-full p-4 text-left">
          <p className="font-black">Para la próxima: {ERROR_LABEL[topErr[0]].toLowerCase()}</p>
          <p className="text-sm text-muted">
            Hoy fue lo que más te costó ({topErr[1]} {topErr[1] === 1 ? "vez" : "veces"}). Lo verás de nuevo en tus repasos{topErr[0] === "preposition" || topErr[0] === "article" || topErr[0] === "word_order" || topErr[0] === "tense" ? "; también puedes hacer una micro-práctica en «Corrige la frase»." : "."}
          </p>
          {(topErr[0] === "preposition" || topErr[0] === "article" || topErr[0] === "word_order" || topErr[0] === "tense") && (
            <Link href="/practicar/corrige" className="btn btn-ghost mt-3 h-11 min-h-11">
              Micro-práctica de 2 minutos
            </Link>
          )}
        </div>
      )}
      {meta.kind === "mission" && meta.roleplayId && (
        <Link href={`/practicar/roleplay/${meta.roleplayId}`} className="btn btn-accent w-full">
          Misión final: la conversación
        </Link>
      )}
      <div className="flex w-full flex-col gap-3 sm:flex-row">
        <Link href="/hoy" className="btn btn-primary grow">
          Volver a Hoy
        </Link>
        <Link href="/sesion?min=5" className="btn btn-ghost grow">
          Otra ronda de 5 min
        </Link>
      </div>
    </main>
  );
}

export { TYPE_LABEL };
