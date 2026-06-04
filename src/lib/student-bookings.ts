import { useSyncExternalStore } from "react";

/**
 * Store MOCKADO das reservas feitas pelo aluno.
 *
 * Simula o aluno reservando um horário (futuro: insert em `appointments` com
 * status pendente). Persiste em localStorage e sincroniza a tela de agenda.
 */

const STORAGE_KEY = "rfp:student-bookings:v2";

/** Chave de um horário: `${date}|${time}` (ex.: "MAI 28|07:00"). */
export type SlotKey = string;
export const slotKey = (date: string, time: string): SlotKey => `${date}|${time}`;

const listeners = new Set<() => void>();
let cache: SlotKey[] | null = null;

function read(): SlotKey[] {
  if (cache) return cache;
  if (typeof window === "undefined") {
    cache = [];
    return cache;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    cache = raw ? (JSON.parse(raw) as SlotKey[]) : [];
  } catch {
    cache = [];
  }
  return cache;
}

function write(next: SlotKey[]) {
  cache = next;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  listeners.forEach((l) => l());
}

/** Reserva/cancela um horário. Retorna true se ficou reservado. */
export function toggleBooking(key: SlotKey): boolean {
  const current = read();
  if (current.includes(key)) {
    write(current.filter((k) => k !== key));
    return false;
  }
  write([...current, key]);
  return true;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot() {
  return read();
}

function getServerSnapshot(): SlotKey[] {
  return [];
}

export function useStudentBookings() {
  const bookings = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return {
    bookings,
    isBooked: (key: SlotKey) => bookings.includes(key),
    toggle: toggleBooking,
  };
}
