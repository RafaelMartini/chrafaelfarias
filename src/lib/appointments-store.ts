import { useSyncExternalStore } from "react";

/**
 * Store MOCKADO de agendamentos.
 *
 * Simula a futura tabela `appointments` do Supabase: persiste em localStorage
 * e sincroniza Dashboard + Agenda (admin e aluno) via useSyncExternalStore.
 *
 * Para conectar ao backend, troque read()/write() por server functions
 * (listAppointments / createAppointment / updateAppointmentStatus) — a API
 * dos hooks pode permanecer igual.
 */

const STORAGE_KEY = "rfp:appointments";

export type Modality = "presencial" | "online";
export type ApptStatus = "confirmed" | "pending";

export type Appointment = {
  id: string;
  /** 0=Dom .. 6=Sáb, referente à semana exibida */
  dayIndex: number;
  time: string;
  student: string;
  location: string;
  modality: Modality;
  status: ApptStatus;
};

/** Rótulos da semana exibida (mock: 26 mai – 01 jun 2026). */
export const WEEK_DAYS = [
  { index: 0, short: "DOM", label: "DOM 26" },
  { index: 1, short: "SEG", label: "SEG 27" },
  { index: 2, short: "TER", label: "TER 28" },
  { index: 3, short: "QUA", label: "QUA 29" },
  { index: 4, short: "QUI", label: "QUI 30" },
  { index: 5, short: "SEX", label: "SEX 31" },
  { index: 6, short: "SÁB", label: "SÁB 01" },
];

/** Dia "hoje" no mock (segunda, 27 mai). Usado pelo Dashboard. */
export const TODAY_INDEX = 1;

const SEED: Appointment[] = [
  { id: "a1", dayIndex: 1, time: "07:30", student: "Beatriz Santos", location: "Unidade Jardins", modality: "presencial", status: "confirmed" },
  { id: "a2", dayIndex: 1, time: "15:00", student: "Rodrigo Silva", location: "Unidade Pinheiros", modality: "presencial", status: "confirmed" },
  { id: "a3", dayIndex: 2, time: "18:00", student: "Lucas Oliveira", location: "Unidade Jardins", modality: "presencial", status: "confirmed" },
  { id: "a4", dayIndex: 4, time: "08:00", student: "Pedro Henrique", location: "Unidade Jardins", modality: "presencial", status: "pending" },
  { id: "a5", dayIndex: 4, time: "19:30", student: "Ana Costa", location: "Via Zoom", modality: "online", status: "pending" },
];

const listeners = new Set<() => void>();
let cache: Appointment[] | null = null;
let idSeq = 0;

function read(): Appointment[] {
  if (cache) return cache;
  if (typeof window === "undefined") {
    cache = SEED;
    return cache;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    cache = raw ? (JSON.parse(raw) as Appointment[]) : SEED;
  } catch {
    cache = SEED;
  }
  return cache;
}

function write(next: Appointment[]) {
  cache = next;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  listeners.forEach((l) => l());
}

export function addAppointment(appt: Omit<Appointment, "id">): Appointment {
  const created: Appointment = { ...appt, id: `local-${Date.now()}-${idSeq++}` };
  write([...read(), created]);
  return created;
}

export function setAppointmentStatus(id: string, status: ApptStatus) {
  write(read().map((a) => (a.id === id ? { ...a, status } : a)));
}

export function removeAppointment(id: string) {
  write(read().filter((a) => a.id !== id));
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot() {
  return read();
}

function getServerSnapshot(): Appointment[] {
  return SEED;
}

export function useAppointments() {
  const appointments = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const sorted = [...appointments].sort((a, b) => a.dayIndex - b.dayIndex || a.time.localeCompare(b.time));
  return {
    appointments: sorted,
    byDay: (dayIndex: number) => sorted.filter((a) => a.dayIndex === dayIndex),
    add: addAppointment,
    setStatus: setAppointmentStatus,
    remove: removeAppointment,
  };
}

export function dayLabel(dayIndex: number): string {
  return WEEK_DAYS[dayIndex]?.label ?? "";
}
