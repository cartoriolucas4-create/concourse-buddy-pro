import type { AppState, DayMode, Plan, Subject } from "./types";

export const uid = () => Math.random().toString(36).slice(2, 10);

export const WEEK_LABELS = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];

export function daysForMode(mode: DayMode, custom?: string[]): string[] {
  switch (mode) {
    case "mon-sun":
      return ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
    case "sun-sat":
      return ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
    case "mon-fri":
      return ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"];
    case "cycle7":
      return ["Dia 1", "Dia 2", "Dia 3", "Dia 4", "Dia 5", "Dia 6", "Dia 7"];
    case "custom":
      return custom && custom.length ? custom : ["Dia 1", "Dia 2", "Dia 3"];
  }
}

export const todayISO = () => toISO(new Date());

export function toISO(d: Date) {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function fromISO(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function fmtBR(iso: string) {
  if (!iso) return "—";
  const d = fromISO(iso);
  return d.toLocaleDateString("pt-BR");
}

export function fmtMinutes(min: number) {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  if (h <= 0) return `${m}min`;
  return `${h}h${m > 0 ? `${m}`.padStart(2, "0") : ""}`;
}

export function daysBetween(fromIso: string, toIso: string) {
  const a = fromISO(fromIso).getTime();
  const b = fromISO(toIso).getTime();
  return Math.round((b - a) / 86400000);
}

export function addDaysISO(iso: string, n: number) {
  const d = fromISO(iso);
  d.setDate(d.getDate() + n);
  return toISO(d);
}

/** Qual "dia" do planejamento corresponde a uma data. */
export function dayIdForDate(iso: string, state: AppState): string {
  const { dayMode, days, cycleAnchor } = state.settings;
  if (dayMode === "cycle7" || dayMode === "custom") {
    const diff = daysBetween(cycleAnchor, iso);
    const len = days.length || 1;
    const idx = ((diff % len) + len) % len;
    return days[idx];
  }
  const label = WEEK_LABELS[fromISO(iso).getDay()];
  return days.includes(label) ? label : "";
}

export function normalizePlan(plan: Plan, days: string[], slots: number): Plan {
  const next: Plan = {};
  for (const day of days) {
    const row = plan[day] ?? [];
    next[day] = Array.from({ length: slots }, (_, i) => row[i] ?? null);
  }
  return next;
}

export function subjectById(state: AppState, id: string): Subject | undefined {
  return state.subjects.find((s) => s.id === id);
}

export function startOfWeekISO(iso: string) {
  const d = fromISO(iso);
  const diff = (d.getDay() + 6) % 7; // segunda como início
  d.setDate(d.getDate() - diff);
  return toISO(d);
}

export function weekDatesISO(startIso: string) {
  return Array.from({ length: 7 }, (_, i) => addDaysISO(startIso, i));
}

export const SUBJECT_COLORS = [
  "#0f766e",
  "#b45309",
  "#1d4ed8",
  "#be123c",
  "#7c3aed",
  "#0e7490",
  "#4d7c0f",
  "#a21caf",
];
