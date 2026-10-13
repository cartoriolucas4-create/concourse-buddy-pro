import { createFileRoute } from "@tanstack/react-router";
import { AppLayout, Bar, Panel, Stat } from "@/components/AppLayout";
import { useStore } from "@/lib/store";
import {
  daysToExam,
  editalProgress,
  minutesOnDate,
  pendencias,
  plannedForDate,
  revisoesForDate,
  sessionsForDate,
  upcomingReminders,
  weekStats,
} from "@/lib/derive";
import { addDaysISO, fmtBR, fmtMinutes, todayISO } from "@/lib/study";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Central de Estudos" },
      { name: "description", content: "Visão geral: hoje, semana, edital, pendências, revisões, provas e lembretes." },
      { property: "og:title", content: "Dashboard — Central de Estudos" },
      { property: "og:description", content: "Seu relatório semanal e progresso no edital." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { state } = useStore();
  const cards = state.settings.dashboardCards;
  const today = todayISO();
  const week = weekStats(state);
  const prev = weekStats(state, addDaysISO(today, -7));
  const prog = editalProgress(state);
  const todayMin = minutesOnDate(state, today);
  const planned = plannedForDate(state, today);
  const doneToday = planned.filter((p) => sessionsForDate(state, today).some((s) => s.subjectId === p.item.subjectId)).length;
  const goal = state.settings.dailyGoalHours * 60;
  const weekGoal = state.settings.weeklyGoalHours * 60;
  const concluded = state.edital.filter((e) => e.status === "concluido").length;
  const exams = state.concursos.filter((c) => c.examDate && (daysToExam(c.examDate) ?? -1) >= 0).sort((a, b) => a.examDate.localeCompare(b.examDate));
  const diff = week.doneMinutes - prev.doneMinutes;

  return (
    <AppLayout title="Dashboard" subtitle={`Semana de ${fmtBR(week.start)} a ${fmtBR(week.end)}`}>
      {cards.hoje && (
        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="Hoje — estudado" value={fmtMinutes(todayMin)} hint={`meta ${fmtMinutes(goal)}`} tone="primary" />
          <Stat label="Progresso da meta" value={`${goal ? Math.round((todayMin / goal) * 100) : 0}%`} />
          <Stat label="Matérias planejadas" value={`${planned.length}`} />
          <Stat label="Matérias concluídas" value={`${doneToday}/${planned.length}`} tone="success" />
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {cards.semana && (
          <Panel title="Minha semana" className="lg:col-span-2">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Kv k="Horas planejadas" v={fmtMinutes(week.plannedMinutes)} />
              <Kv k="Horas realizadas" v={fmtMinutes(week.doneMinutes)} />
              <Kv k="Sessões" v={`${week.doneSessions}`} />
              <Kv k="Dias estudados" v={`${week.studiedDays}/7`} />
              <Kv k="Matérias estudadas" v={`${week.subjectsStudied}`} />
              <Kv k="Conteúdos concluídos" v={`${concluded}`} />
              <Kv k="Revisões realizadas" v={`${week.revisoesFeitas}`} />
              <Kv k="Pendências" v={`${pendencias(state).length}`} />
            </div>
            <div className="mt-4">
              <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                <span>Meta semanal {state.settings.weeklyGoalHours}h</span>
                <span>{weekGoal ? Math.round((week.doneMinutes / weekGoal) * 100) : 0}%</span>
              </div>
              <Bar percent={weekGoal ? (week.doneMinutes / weekGoal) * 100 : 0} />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Semana anterior: {fmtMinutes(prev.doneMinutes)} ({diff >= 0 ? "+" : "−"}{fmtMinutes(Math.abs(diff))}) · {prev.doneSessions} sessões
            </p>
          </Panel>
        )}

        {cards.aderencia && (
          <Panel title="Aderência ao planejamento">
            <p className="font-display text-4xl font-semibold">{week.aderencia}%</p>
            <p className="mt-1 text-sm text-muted-foreground">Planejado: {week.plannedSessions} sessões · Realizado: {week.doneSessions}</p>
            <p className="mt-3 text-xs text-muted-foreground">Apenas um retrato da sua rotina — não é nota.</p>
          </Panel>
        )}

        {cards.edital && (
          <Panel title="Edital">
            <p className="font-display text-3xl font-semibold">{prog.percent}% concluído</p>
            <div className="mt-2"><Bar percent={prog.percent} /></div>
            <ul className="mt-4 space-y-2">
              {prog.bySubject.map((b) => {
                const s = state.subjects.find((x) => x.id === b.subjectId);
                return (
                  <li key={b.subjectId} className="text-xs">
                    <div className="mb-0.5 flex justify-between"><span>{s?.name}</span><span>{b.percent}%</span></div>
                    <Bar percent={b.percent} color={s?.color} />
                  </li>
                );
              })}
            </ul>
          </Panel>
        )}

        {(cards.pendencias || cards.revisoes) && (
          <div className="grid gap-4">
            {cards.pendencias && <Stat label="Pendências" value={`${pendencias(state).length}`} hint="itens em aberto" tone="warning" />}
            {cards.revisoes && <Stat label="Revisões" value={`${revisoesForDate(state, today).length}`} hint="para hoje" tone="primary" />}
          </div>
        )}

        {cards.concursos && (
          <Panel title="Próximas provas">
            {exams.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma prova agendada.</p>}
            <ul className="space-y-2">
              {exams.map((c) => (
                <li key={c.id} className="flex items-center justify-between text-sm">
                  <span>{c.name}<br /><span className="text-xs text-muted-foreground">{fmtBR(c.examDate)}</span></span>
                  <span className="font-display text-lg font-semibold">{daysToExam(c.examDate)}d</span>
                </li>
              ))}
            </ul>
          </Panel>
        )}

        {cards.lembretes && (
          <Panel title="Próximos compromissos">
            <ul className="space-y-2 text-sm">
              {upcomingReminders(state).map((r) => (
                <li key={r.id} className="flex justify-between gap-2">
                  <span className="truncate">{r.title}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{fmtBR(r.date)}</span>
                </li>
              ))}
            </ul>
          </Panel>
        )}
      </div>
    </AppLayout>
  );
}

function Kv({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <p className="text-[11px] text-muted-foreground">{k}</p>
      <p className="font-display text-xl font-semibold">{v}</p>
    </div>
  );
}
