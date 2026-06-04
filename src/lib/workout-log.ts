import { useSyncExternalStore } from "react";

/**
 * Store MOCKADO de treinos concluídos.
 *
 * Simula a futura tabela `workout_logs` do Supabase: hoje persiste em
 * localStorage e sincroniza todas as telas do aluno (Treino do Dia,
 * Evolução, Progresso) via useSyncExternalStore.
 *
 * Para conectar ao backend, basta trocar read()/write() por chamadas a
 * server functions (ex.: logWorkout / getMyWorkoutLogs) — a API do hook
 * `useWorkoutLog` pode permanecer igual.
 */

const STORAGE_KEY = "rfp:workout-log:v2";

export type WorkoutLogEntry = {
  /** id do treino concluído (DayWorkout.id no mock; workout_id no banco) */
  dayId: string;
  /** ISO timestamp da conclusão */
  completedAt: string;
};

const listeners = new Set<() => void>();
let cache: WorkoutLogEntry[] | null = null;

function read(): WorkoutLogEntry[] {
  if (cache) return cache;
  if (typeof window === "undefined") {
    cache = [];
    return cache;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    cache = raw ? (JSON.parse(raw) as WorkoutLogEntry[]) : [];
  } catch {
    cache = [];
  }
  return cache;
}

function write(next: WorkoutLogEntry[]) {
  cache = next;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  listeners.forEach((l) => l());
}

/** Marca/desmarca um treino como concluído. Retorna o novo estado (true = concluído). */
export function toggleWorkoutCompletion(dayId: string): boolean {
  const current = read();
  const exists = current.some((e) => e.dayId === dayId);
  if (exists) {
    write(current.filter((e) => e.dayId !== dayId));
    return false;
  }
  write([...current, { dayId, completedAt: new Date().toISOString() }]);
  return true;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot() {
  return read();
}

function getServerSnapshot(): WorkoutLogEntry[] {
  return [];
}

export function useWorkoutLog() {
  const log = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return {
    log,
    completedCount: log.length,
    isCompleted: (dayId: string) => log.some((e) => e.dayId === dayId),
    toggle: toggleWorkoutCompletion,
  };
}
