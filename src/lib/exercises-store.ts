import { useSyncExternalStore } from "react";

/**
 * Store MOCKADO da biblioteca de exercícios do treinador.
 *
 * Simula a futura tabela `exercises`. Persiste em localStorage e sincroniza a
 * Biblioteca. Futuro Supabase: trocar read()/write() por listMyExercises/
 * createExercise/deleteExercise.
 */

const STORAGE_KEY = "rfp:exercises:v2";

export type MockExercise = {
  id: string;
  name: string;
  muscleGroup: string;
  description: string;
  videoUrl: string;
  createdAt: string;
};

const SEED: MockExercise[] = [];

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
