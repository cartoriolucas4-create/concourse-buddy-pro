import type { AppState, PlanItem, Subject } from "./types";
import { addDaysISO, dayIdForDate, daysBetween, fromISO, startOfWeekISO, todayISO } from "./study";

export interface PlannedSlot {
  key: string;
  date: string;
  dayId: string;
  slotIndex: number;
  item: PlanItem;
  subject: Subject | undefined;
}

export function subjectsForActive(state: AppState): Subject[] {
  const id = state.activeConcursoId;
  return state.subjects.filter(
    (s) => id === "all" || s.concursoIds.length === 0 || s.concursoIds.includes(id),
  );
}

export function plannedForDate(state: AppState, date: string): PlannedSlot[] {
  const dayId = dayIdForDate(date, state);
  if (!dayId) return [];
  const row = state.plan[dayId] ?? [];
  const allowed = new Set(subjectsForActive(state).map((s) => s.id));
  return row
    .map((item, slotIndex) => ({ item, slotIndex }))
    .filter((r): r is { item: PlanItem; slotIndex: number } => Boolean(r.item))
    .filter((r) => allowed.has(r.item.subjectId))
    .map((r) => ({
      key: `${date}:${dayId}:${r.slotIndex}`,
      date,
      dayId,
      slotIndex: r.slotIndex,
      item: r.item,
      subject: state.subjects.find((s) => s.id === r.item.subjectId),
    }));
}

export function sessionsForDate(state: AppState, date: string) {
  return state.sessions.filter((s) => s.date === date);
}

export interface Pendencia {
  key: string;
  kind: "planejado" | "revisao";
  date: string;
  dayId: string;
  subjectId: string;
  topic?: string;
  label: string;
  refId?: string;
}

/** Pendências = itens planejados no passado sem registro + revisões vencidas. */
export function pendencias(state: AppState, lookbackDays = 21): Pendencia[] {
  const today = todayISO();
  const out: Pendencia[] = [];
  const overrides = new Map(state.pendenciaOverrides.map((o) => [o.key, o]));

  for (let i = 1; i <= lookbackDays; i++) {
    const date = addDaysISO(today, -i);
    for (const slot of plannedForDate(state, date)) {
      const ov = overrides.get(slot.key);
      if (ov && ov.action !== "aberta") continue;
      const studied = state.sessions.some((s) => s.date === date && s.subjectId === slot.item.subjectId);
      if (studied) continue;
      out.push({
        key: slot.key,
        kind: "planejado",
        date,
        dayId: slot.dayId,
        subjectId: slot.item.subjectId,
        label: `Planejado para ${slot.dayId} — não realizado`,
      });
    }
  }

  for (const r of state.revisoes) {
    if (r.done) continue;
    if (r.date >= today) continue;
    out.push({
      key: `rev:${r.id}`,
      kind: "revisao",
      date: r.date,
      dayId: dayIdForDate(r.date, state),
      subjectId: r.subjectId,
      topic: r.topic,
      label: "Revisão vencida",
      refId: r.id,
    });
  }

  return out.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function revisoesForDate(state: AppState, date: string) {
  return state.revisoes.filter((r) => !r.done && r.date <= date);
}

export function minutesOnDate(state: AppState, date: string) {
  return sessionsForDate(state, date).reduce((acc, s) => acc + s.minutes, 0);
}

export function minutesInRange(state: AppState, from: string, to: string) {
  return state.sessions
    .filter((s) => s.date >= from && s.date <= to)
    .reduce((acc, s) => acc + s.minutes, 0);
}

export function weekStats(state: AppState, anchor = todayISO()) {
  const start = startOfWeekISO(anchor);
  const end = addDaysISO(start, 6);
  const sessions = state.sessions.filter((s) => s.date >= start && s.date <= end);
  let plannedMinutes = 0;
  let plannedSessions = 0;
  for (let i = 0; i < 7; i++) {
    const date = addDaysISO(start, i);
    for (const slot of plannedForDate(state, date)) {
      plannedMinutes += slot.item.minutes;
      plannedSessions += 1;
    }
  }
  const doneMinutes = sessions.reduce((a, s) => a + s.minutes, 0);
  const studiedDays = new Set(sessions.map((s) => s.date)).size;
  const subjectsStudied = new Set(sessions.map((s) => s.subjectId)).size;
  return {
    start,
    end,
    plannedMinutes,
    plannedSessions,
    doneMinutes,
    doneSessions: sessions.length,
    studiedDays,
    subjectsStudied,
    aderencia: plannedSessions ? Math.round((sessions.length / plannedSessions) * 100) : 0,
    revisoesFeitas: state.revisoes.filter((r) => r.done && r.date >= start && r.date <= end).length,
  };
}

export function editalProgress(state: AppState) {
  const id = state.activeConcursoId;
  const items = state.edital.filter((e) => id === "all" || e.concursoId === id);
  const leaves = items.filter((e) => !items.some((c) => c.parentId === e.id));
  const total = leaves.length;
  const done = leaves.filter((e) => e.status === "concluido").length;
  const bySubject = new Map<string, { total: number; done: number }>();
  for (const leaf of leaves) {
    const cur = bySubject.get(leaf.subjectId) ?? { total: 0, done: 0 };
    cur.total += 1;
    if (leaf.status === "concluido") cur.done += 1;
    bySubject.set(leaf.subjectId, cur);
  }
  return {
    total,
    done,
    percent: total ? Math.round((done / total) * 100) : 0,
    pending: total - done,
    bySubject: [...bySubject.entries()].map(([subjectId, v]) => ({
      subjectId,
      ...v,
      percent: v.total ? Math.round((v.done / v.total) * 100) : 0,
    })),
  };
}

export function daysToExam(examDate: string) {
  if (!examDate) return null;
  return daysBetween(todayISO(), examDate);
}

export function upcomingReminders(state: AppState, limit = 5) {
  const today = todayISO();
  return state.reminders
    .filter((r) => !r.done && r.date >= today)
    .sort((a, b) => (a.date === b.date ? a.time.localeCompare(b.time) : a.date < b.date ? -1 : 1))
    .slice(0, limit);
}

export function monthLabel(iso: string) {
  return fromISO(iso).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}
