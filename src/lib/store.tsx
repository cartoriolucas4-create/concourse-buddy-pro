import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AppState } from "./types";
import { addDaysISO, daysForMode, normalizePlan, todayISO, uid } from "./study";

const STORAGE_KEY = "central-estudos-v1";

function seed(): AppState {
  const today = todayISO();
  const days = daysForMode("mon-sun");
  const subjects = [
    { name: "Direito Penal", area: "Direito", color: "#0f766e", freq: 3 },
    { name: "Direito Constitucional", area: "Direito", color: "#1d4ed8", freq: 2 },
    { name: "Direito Administrativo", area: "Direito", color: "#b45309", freq: 2 },
    { name: "Processo Penal", area: "Direito", color: "#be123c", freq: 2 },
    { name: "Português", area: "Básicas", color: "#4d7c0f", freq: 2 },
    { name: "Informática", area: "Básicas", color: "#7c3aed", freq: 1 },
  ].map((s, i) => ({
    id: `sub-${i + 1}`,
    name: s.name,
    area: s.area,
    color: s.color,
    priority: (i < 2 ? "alta" : i < 4 ? "media" : "baixa") as "alta" | "media" | "baixa",
    active: true,
    note: "",
    frequency: s.freq,
    concursoIds: ["conc-1"],
  }));

  const item = (subjectId: string, minutes: number) => ({ id: uid(), subjectId, minutes });
  const plan = {
    Segunda: [item("sub-1", 90), item("sub-2", 60), item("sub-5", 60)],
    Terça: [item("sub-3", 90), item("sub-6", 45), item("sub-1", 60)],
    Quarta: [item("sub-2", 90), item("sub-5", 60), item("sub-4", 60)],
    Quinta: [item("sub-1", 90), item("sub-3", 60), null],
    Sexta: [item("sub-4", 90), item("sub-2", 60), item("sub-6", 45)],
    Sábado: [item("sub-5", 60), null, null],
    Domingo: [null, null, null],
  };

  const edital = [
    ["sub-1", "Teoria do Crime", ["Tipicidade", "Ilicitude", "Culpabilidade", "Concurso de pessoas"]],
    ["sub-1", "Penas", ["Espécies de pena", "Aplicação da pena"]],
    ["sub-2", "Direitos Fundamentais", ["Direitos individuais", "Direitos sociais", "Nacionalidade"]],
    ["sub-2", "Organização do Estado", ["Repartição de competências"]],
    ["sub-3", "Atos Administrativos", ["Atributos", "Invalidação"]],
    ["sub-4", "Inquérito Policial", ["Instauração", "Prazos"]],
    ["sub-5", "Gramática", ["Crase", "Concordância", "Regência"]],
    ["sub-6", "Segurança da Informação", ["Malwares", "Backup"]],
  ] as [string, string, string[]][];

  const editalItems = edital.flatMap(([subjectId, topic, subs], i) => {
    const parentId = `ed-${i}`;
    return [
      {
        id: parentId,
        concursoId: "conc-1",
        subjectId,
        title: topic,
        parentId: null,
        status: (i < 3 ? "em-andamento" : "nao-iniciado") as
          | "em-andamento"
          | "nao-iniciado",
      },
      ...subs.map((title, j) => ({
        id: `ed-${i}-${j}`,
        concursoId: "conc-1",
        subjectId,
        title,
        parentId,
        status: (i < 2 && j < 2 ? "concluido" : j === 0 ? "em-andamento" : "nao-iniciado") as
          | "concluido"
          | "em-andamento"
          | "nao-iniciado",
      })),
    ];
  });

  return {
    settings: {
      dayMode: "mon-sun",
      days,
      slots: 3,
      weeklyGoalHours: 25,
      monthlyGoalHours: 100,
      dailyGoalHours: 4,
      defaultSessionMinutes: 60,
      revisionIntervals: [1, 7, 15, 30],
      remindersEnabled: true,
      theme: "light",
      dashboardCards: {
        hoje: true,
        semana: true,
        edital: true,
        pendencias: true,
        revisoes: true,
        concursos: true,
        lembretes: true,
        aderencia: true,
      },
      cycleAnchor: today,
      configured: false,
    },
    subjects,
    plan: normalizePlan(plan, days, 3),
    templates: [
      { id: "tpl-1", name: "Semana modelo padrão", days, slots: 3, plan: normalizePlan(plan, days, 3) },
    ],
    cycle: {
      enabled: false,
      paused: false,
      currentIndex: 0,
      items: subjects.map((s) => ({ id: uid(), subjectId: s.id, minutes: 90, done: false })),
    },
    concursos: [
      {
        id: "conc-1",
        name: "Polícia Federal — Agente",
        orgao: "Polícia Federal",
        cargo: "Agente de Polícia Federal",
        banca: "Cebraspe",
        examDate: addDaysISO(today, 87),
        inscriptionStart: addDaysISO(today, -10),
        inscriptionEnd: addDaysISO(today, 4),
        local: "Brasília — DF",
        status: "Estudando",
        priority: "alta",
        editalUrl: "",
        notes: "",
      },
    ],
    activeConcursoId: "conc-1",
    edital: editalItems,
    reminders: [
      {
        id: uid(),
        title: "Fazer inscrição no concurso",
        description: "Gerar GRU e pagar taxa",
        date: addDaysISO(today, 2),
        time: "10:00",
        priority: "alta",
        category: "Concurso",
        done: false,
        concursoId: "conc-1",
      },
      {
        id: uid(),
        title: "Conferir edital retificado",
        description: "",
        date: today,
        time: "",
        priority: "media",
        category: "Edital",
        done: false,
        concursoId: "conc-1",
      },
    ],
    sessions: [
      {
        id: uid(),
        date: addDaysISO(today, -1),
        subjectId: "sub-1",
        topic: "Culpabilidade",
        minutes: 87,
        note: "",
        plannedDayId: null,
        concursoId: "conc-1",
      },
      {
        id: uid(),
        date: addDaysISO(today, -2),
        subjectId: "sub-2",
        topic: "Direitos individuais",
        minutes: 65,
        note: "",
        plannedDayId: null,
        concursoId: "conc-1",
      },
      {
        id: uid(),
        date: addDaysISO(today, -3),
        subjectId: "sub-5",
        topic: "Crase",
        minutes: 55,
        note: "",
        plannedDayId: null,
        concursoId: "conc-1",
      },
    ],
    revisoes: [
      { id: uid(), subjectId: "sub-1", topic: "Culpabilidade", date: today, done: false },
      { id: uid(), subjectId: "sub-5", topic: "Crase", date: today, done: false },
      { id: uid(), subjectId: "sub-2", topic: "Nacionalidade", date: addDaysISO(today, -2), done: false },
    ],
    pendenciaOverrides: [],
  };
}

type Ctx = {
  state: AppState;
  hydrated: boolean;
  update: (fn: (draft: AppState) => void) => void;
  reset: () => void;
};

const StoreContext = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => seed());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setState({ ...seed(), ...(JSON.parse(raw) as AppState) });
    } catch {
      /* ignora dados inválidos */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage cheio */
    }
  }, [state, hydrated]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("dark", state.settings.theme === "dark");
  }, [state.settings.theme]);

  const update = useCallback((fn: (draft: AppState) => void) => {
    setState((prev) => {
      const draft = JSON.parse(JSON.stringify(prev)) as AppState;
      fn(draft);
      return draft;
    });
  }, []);

  const reset = useCallback(() => setState(seed()), []);

  const value = useMemo(() => ({ state, hydrated, update, reset }), [state, hydrated, update, reset]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore precisa estar dentro de StoreProvider");
  return ctx;
}
