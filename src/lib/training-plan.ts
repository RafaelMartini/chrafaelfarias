import { useSyncExternalStore } from "react";
import { weekWorkouts, exercises } from "@/lib/mock-data";

/**
 * Store MOCKADO do plano de treino semanal do aluno.
 *
 * É o elo entre o admin (que monta o plano) e o aluno (que executa no dia).
 * Persiste em localStorage e sincroniza as duas telas via useSyncExternalStore.
 *
 * Futuro Supabase: substituir read()/write() por server functions que leem/
 * gravam `workouts` + `workout_exercises` (com o trainer montando e o aluno
 * apenas lendo). A forma de PlanDay/PlanExercise mapeia direto nessas tabelas.
 */

const STORAGE_KEY = "rfp:training-plan";

// Vídeo de demonstração (placeholder) para exercícios sem vídeo real definido.
// O treinador substitui pela URL real na tela "Montar Treino".
const DEMO_VIDEO = "https://www.youtube.com/watch?v=aqz-KE-bpKQ";

// Vídeos reais de execução por exercício (validados via oEmbed do YouTube).
const REAL_VIDEOS: Record<string, string> = {
  e1: "https://www.youtube.com/watch?v=3Y2U3Agkvbs", // Agachamento Livre — Tay Training
  e2: "https://www.youtube.com/watch?v=waAxlYvtCcI", // Leg Press 45º — Treino Mestre
  e7: "https://www.youtube.com/watch?v=vXPbKrYIEaQ", // Stiff — Tay Training
};

export type PlanExercise = {
  id: string;
  name: string;
  description: string;
  videoUrl: string;
  sets: number;
  reps: string;
  load: string;
  rest: string;
};

export type PlanDay = {
  dayId: string;
  dayName: string;
  workoutName: string;
  exercises: PlanExercise[];
};

const DAY_ORDER: { dayId: string; dayName: string }[] = [
  { dayId: "dom", dayName: "DOMINGO" },
  { dayId: "seg", dayName: "SEGUNDA" },
  { dayId: "ter", dayName: "TERÇA" },
  { dayId: "qua", dayName: "QUARTA" },
  { dayId: "qui", dayName: "QUINTA" },
  { dayId: "sex", dayName: "SEXTA" },
  { dayId: "sab", dayName: "SÁBADO" },
];

function buildSeed(): PlanDay[] {
  const exMap = Object.fromEntries(exercises.map((e) => [e.id, e]));
  const byId = Object.fromEntries(weekWorkouts.map((w) => [w.id, w]));
  return DAY_ORDER.map(({ dayId, dayName }) => {
    const w = byId[dayId];
    return {
      dayId,
      dayName,
      workoutName: w?.name ?? "",
      exercises: (w?.exercises ?? []).map((we, i) => {
        const ex = exMap[we.exerciseId];
        return {
          id: `${dayId}-${i}`,
          name: ex?.name ?? "Exercício",
          description: ex?.description ?? "",
          videoUrl: REAL_VIDEOS[we.exerciseId] ?? DEMO_VIDEO,
          sets: we.sets,
          reps: we.reps,
          load: we.load,
          rest: we.rest,
        };
      }),
    };
  });
}

const listeners = new Set<() => void>();
let cache: PlanDay[] | null = null;
let idSeq = 0;

function read(): PlanDay[] {
  if (cache) return cache;
  if (typeof window === "undefined") {
    cache = buildSeed();
    return cache;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    cache = raw ? (JSON.parse(raw) as PlanDay[]) : buildSeed();
  } catch {
    cache = buildSeed();
  }
  return cache;
}

function write(next: PlanDay[]) {
  cache = next;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  listeners.forEach((l) => l());
}

function mutateDay(dayId: string, fn: (day: PlanDay) => PlanDay) {
  write(read().map((d) => (d.dayId === dayId ? fn(d) : d)));
}

export function setWorkoutName(dayId: string, workoutName: string) {
  mutateDay(dayId, (d) => ({ ...d, workoutName }));
}

export function addPlanExercise(dayId: string, exercise: Omit<PlanExercise, "id">) {
  const created: PlanExercise = { ...exercise, id: `ex-${Date.now()}-${idSeq++}` };
  mutateDay(dayId, (d) => ({ ...d, exercises: [...d.exercises, created] }));
  return created;
}

export function updatePlanExercise(dayId: string, exId: string, patch: Partial<Omit<PlanExercise, "id">>) {
  mutateDay(dayId, (d) => ({
    ...d,
    exercises: d.exercises.map((e) => (e.id === exId ? { ...e, ...patch } : e)),
  }));
}

export function removePlanExercise(dayId: string, exId: string) {
  mutateDay(dayId, (d) => ({ ...d, exercises: d.exercises.filter((e) => e.id !== exId) }));
}

export function resetPlan() {
  write(buildSeed());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot() {
  return read();
}

let serverSnapshot: PlanDay[] | null = null;
function getServerSnapshot(): PlanDay[] {
  if (!serverSnapshot) serverSnapshot = buildSeed();
  return serverSnapshot;
}

export function usePlan() {
  const plan = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return {
    plan,
    trainingDaysCount: plan.filter((d) => d.exercises.length > 0).length,
    setWorkoutName,
    addExercise: addPlanExercise,
    updateExercise: updatePlanExercise,
    removeExercise: removePlanExercise,
    reset: resetPlan,
  };
}
