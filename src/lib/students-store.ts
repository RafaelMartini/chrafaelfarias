import { useSyncExternalStore } from "react";
import { students as seedStudents } from "@/lib/mock-data";

/**
 * Store MOCKADO de alunos do treinador.
 *
 * Simula a futura tabela `profiles` (alunos vinculados ao trainer). Persiste
 * em localStorage e sincroniza Dashboard + Alunos. Futuro Supabase: trocar
 * read()/write() por listMyStudents/createStudent.
 */

const STORAGE_KEY = "rfp:students";

export type MockStudent = {
  id: string;
  name: string;
  initials: string;
  plan: string;
  week: string;
  status: "active" | "missed" | "new";
  compliance: number;
  lastWorkout: string;
  phone: string;
  goal: string;
  createdAt: string;
};

const GOAL_BY_PLAN: Record<string, string> = {
  Hipertrofia: "Ganho de massa",
  "Hipertrofia A2": "Ganho de massa",
  Emagrecimento: "Perda de gordura",
  Powerlifting: "Força máxima",
  Condicionamento: "Condicionamento",
  HIIT: "Resistência",
};

function buildSeed(): MockStudent[] {
  return seedStudents.map((s, i) => ({
    ...s,
    phone: `(11) 9${(8000 + i * 137).toString().padStart(4, "0")}-${(1000 + i * 311).toString().slice(0, 4)}`,
    goal: GOAL_BY_PLAN[s.plan] ?? "Saúde geral",
    createdAt: `2026-0${((i % 4) + 1)}-${String(5 + i * 3).padStart(2, "0")}T10:00:00.000Z`,
  }));
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const listeners = new Set<() => void>();
let cache: MockStudent[] | null = null;
let idSeq = 0;

function read(): MockStudent[] {
  if (cache) return cache;
  if (typeof window === "undefined") {
    cache = buildSeed();
    return cache;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    cache = raw ? (JSON.parse(raw) as MockStudent[]) : buildSeed();
  } catch {
    cache = buildSeed();
  }
  return cache;
}

function write(next: MockStudent[]) {
  cache = next;
  if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  listeners.forEach((l) => l());
}

export function addStudent(input: { name: string; phone: string; goal: string; plan: string }): MockStudent {
  const created: MockStudent = {
    id: `local-${Date.now()}-${idSeq++}`,
    name: input.name,
    initials: initials(input.name),
    plan: input.plan || "Hipertrofia",
    week: "Semana 1/12",
    status: "new",
    compliance: 100,
    lastWorkout: "—",
    phone: input.phone,
    goal: input.goal,
    createdAt: new Date().toISOString(),
  };
  write([created, ...read()]);
  return created;
}

export function removeStudent(id: string) {
  write(read().filter((s) => s.id !== id));
}

export function resetStudents() {
  write(buildSeed());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
function getSnapshot() {
  return read();
}
let serverSnap: MockStudent[] | null = null;
function getServerSnapshot(): MockStudent[] {
  if (!serverSnap) serverSnap = buildSeed();
  return serverSnap;
}

export function useStudents() {
  const students = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return { students, add: addStudent, remove: removeStudent, reset: resetStudents };
}
