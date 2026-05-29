import { useSyncExternalStore } from "react";

/**
 * Store MOCKADO da biblioteca de exercícios do treinador.
 *
 * Simula a futura tabela `exercises`. Persiste em localStorage e sincroniza a
 * Biblioteca. Futuro Supabase: trocar read()/write() por listMyExercises/
 * createExercise/deleteExercise.
 */

const STORAGE_KEY = "rfp:exercises";

export type MockExercise = {
  id: string;
  name: string;
  muscleGroup: string;
  description: string;
  videoUrl: string;
  createdAt: string;
};

const SEED: MockExercise[] = [
  { id: "x1", name: "Agachamento Livre", muscleGroup: "Inferiores", description: "Core ativado, calcanhares firmes, descida controlada.", videoUrl: "https://www.youtube.com/watch?v=3Y2U3Agkvbs", createdAt: "2026-04-01T10:00:00.000Z" },
  { id: "x2", name: "Leg Press 45º", muscleGroup: "Inferiores", description: "Amplitude máxima sem tirar a lombar do encosto.", videoUrl: "https://www.youtube.com/watch?v=waAxlYvtCcI", createdAt: "2026-04-02T10:00:00.000Z" },
  { id: "x3", name: "Stiff", muscleGroup: "Posterior", description: "Quadril para trás, lombar neutra.", videoUrl: "https://www.youtube.com/watch?v=vXPbKrYIEaQ", createdAt: "2026-04-03T10:00:00.000Z" },
  { id: "x4", name: "Supino Reto", muscleGroup: "Peitoral", description: "Escápulas retraídas, controle na descida.", videoUrl: "", createdAt: "2026-04-04T10:00:00.000Z" },
  { id: "x5", name: "Pulley Frente", muscleGroup: "Costas", description: "Puxe com os cotovelos, não com as mãos.", videoUrl: "", createdAt: "2026-04-05T10:00:00.000Z" },
  { id: "x6", name: "Desenvolvimento", muscleGroup: "Ombros", description: "Sem hiperestender a lombar.", videoUrl: "", createdAt: "2026-04-06T10:00:00.000Z" },
];

const listeners = new Set<() => void>();
let cache: MockExercise[] | null = null;
let idSeq = 0;

function read(): MockExercise[] {
  if (cache) return cache;
  if (typeof window === "undefined") {
    cache = SEED;
    return cache;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    cache = raw ? (JSON.parse(raw) as MockExercise[]) : SEED;
  } catch {
    cache = SEED;
  }
  return cache;
}

function write(next: MockExercise[]) {
  cache = next;
  if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  listeners.forEach((l) => l());
}

export function addExercise(input: { name: string; muscleGroup: string; description: string; videoUrl: string }): MockExercise {
  const created: MockExercise = { ...input, id: `local-${Date.now()}-${idSeq++}`, createdAt: new Date().toISOString() };
  write([created, ...read()]);
  return created;
}

export function removeExercise(id: string) {
  write(read().filter((e) => e.id !== id));
}

export function resetExercises() {
  write(SEED);
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
function getSnapshot() {
  return read();
}
function getServerSnapshot(): MockExercise[] {
  return SEED;
}

export function useExercises() {
  const exercises = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return { exercises, add: addExercise, remove: removeExercise, reset: resetExercises };
}
