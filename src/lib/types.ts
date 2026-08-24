export type DayMode = "mon-sun" | "sun-sat" | "mon-fri" | "cycle7" | "custom";

export type Priority = "alta" | "media" | "baixa";

export interface Subject {
  id: string;
  name: string;
  area: string;
  color: string;
  priority: Priority;
  active: boolean;
  note: string;
  frequency: number; // vezes por semana (sugestão)
  concursoIds: string[];
}

export interface PlanItem {
  id: string;
  subjectId: string;
  minutes: number;
}

/** plan[dayId][slotIndex] = PlanItem | null */
export type Plan = Record<string, (PlanItem | null)[]>;

export interface WeekTemplate {
  id: string;
  name: string;
  days: string[];
  slots: number;
  plan: Plan;
}

export interface CycleItem {
  id: string;
  subjectId: string;
  minutes: number;
  done: boolean;
}

export interface Cycle {
  enabled: boolean;
  paused: boolean;
  currentIndex: number;
  items: CycleItem[];
}

export type ConcursoStatus =
  | "Pesquisando"
  | "Estudando"
  | "Inscrição aberta"
  | "Inscrito"
  | "Prova realizada"
  | "Finalizado";

export interface Concurso {
  id: string;
  name: string;
  orgao: string;
  cargo: string;
  banca: string;
  examDate: string;
  inscriptionStart: string;
  inscriptionEnd: string;
  local: string;
  status: ConcursoStatus;
  priority: Priority;
  editalUrl: string;
  notes: string;
}

export type EditalStatus = "nao-iniciado" | "em-andamento" | "concluido" | "revisao-pendente";

export interface EditalItem {
  id: string;
  concursoId: string;
  subjectId: string;
  title: string;
  parentId: string | null;
  status: EditalStatus;
}

export type ReminderCategory =
  | "Estudo"
  | "Concurso"
  | "Edital"
  | "Revisão"
  | "Administrativo"
  | "Pessoal";

export interface Reminder {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  priority: Priority;
  category: ReminderCategory;
  done: boolean;
  concursoId: string | null;
}

export interface StudySession {
  id: string;
  date: string; // ISO yyyy-mm-dd
  subjectId: string;
  topic: string;
  minutes: number;
  note: string;
  plannedDayId: string | null;
  concursoId: string | null;
}

export interface Revisao {
  id: string;
  subjectId: string;
  topic: string;
  date: string;
  done: boolean;
}

export type PendenciaAction = "aberta" | "concluida" | "ignorada" | "reagendada";

export interface PendenciaOverride {
  key: string; // `${date}:${dayId}:${slotIndex}`
  action: PendenciaAction;
  newDate?: string;
}

export interface Settings {
  dayMode: DayMode;
  days: string[];
  slots: number;
  weeklyGoalHours: number;
  monthlyGoalHours: number;
  dailyGoalHours: number;
  defaultSessionMinutes: number;
  revisionIntervals: number[];
  remindersEnabled: boolean;
  theme: "light" | "dark";
  dashboardCards: Record<string, boolean>;
  cycleAnchor: string; // data base para dias em ciclo
  configured: boolean;
}

export interface AppState {
  settings: Settings;
  subjects: Subject[];
  plan: Plan;
  templates: WeekTemplate[];
  cycle: Cycle;
  concursos: Concurso[];
  activeConcursoId: string | "all";
  edital: EditalItem[];
  reminders: Reminder[];
  sessions: StudySession[];
  revisoes: Revisao[];
  pendenciaOverrides: PendenciaOverride[];
}
