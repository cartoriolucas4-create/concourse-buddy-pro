import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Play, RotateCcw, BellRing, ClipboardList, CheckCircle2 } from "lucide-react";
import { AppLayout, Bar, Panel, Stat } from "@/components/AppLayout";
import { StudySessionDialog, type SessionTarget } from "@/components/StudySessionDialog";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import {
  daysToExam,
  minutesOnDate,
  pendencias,
  plannedForDate,
  revisoesForDate,
  sessionsForDate,
} from "@/lib/derive";
import { dayIdForDate, fmtMinutes, todayISO } from "@/lib/study";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Hoje — Central de Estudos para Concurseiro" },
      { name: "description", content: "Veja o que está planejado para hoje e comece a estudar." },
      { property: "og:title", content: "Hoje — Central de Estudos" },
      { property: "og:description", content: "Seu plano de estudos do dia em um só lugar." },
    ],
  }),
  component: Hoje,
});

function Hoje() {
  const { state, update } = useStore();
  const [target, setTarget] = useState<SessionTarget | null>(null);
  const today = todayISO();
  const dayId = dayIdForDate(today, state);
  const cycleMode = state.cycle.enabled;
  const planned = plannedForDate(state, today);
  const sessions = sessionsForDate(state, today);
  const studied = minutesOnDate(state, today);
  const goal = state.settings.dailyGoalHours * 60;
  const pct = goal ? Math.round((studied / goal) * 100) : 0;
  const doneSubjects = planned.filter((p) => sessions.some((s) => s.subjectId === p.item.subjectId)).length;
  const revs = revisoesForDate(state, today);
  const pend = pendencias(state);
  const remindersToday = state.reminders.filter((r) => !r.done && r.date === today);
  const nextExam = state.concursos
    .filter((c) => (state.activeConcursoId === "all" || c.id === state.activeConcursoId) && c.examDate)
    .map((c) => ({ c, d: daysToExam(c.examDate)! }))
    .filter((x) => x.d >= 0)
    .sort((a, b) => a.d - b.d)[0];

  const cycleItems = state.cycle.items;
  const cycleCurrent = cycleItems[state.cycle.currentIndex % Math.max(1, cycleItems.length)];

  const dateLabel = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <AppLayout title="Hoje" subtitle={`${dateLabel}${dayId && !cycleMode ? ` · ${dayId}` : ""}`}>
      {!state.settings.configured && (
        <div className="panel mb-6 flex flex-wrap items-center justify-between gap-3 border-primary/40 bg-accent p-4">
          <p className="text-sm">
            <strong>Configure sua central:</strong> estrutura dos dias, matérias por dia e metas.
          </p>
          <Button asChild size="sm">
            <Link to="/configurar">Configurar minha central</Link>
          </Button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Panel title={cycleMode ? "Próximo do ciclo" : "Planejado para hoje"}>
            {cycleMode ? (
              cycleCurrent ? (
                (() => {
                  const sub = state.subjects.find((s) => s.id === cycleCurrent.subjectId);
                  if (!sub) return null;
                  return (
                    <SubjectRow
                      color={sub.color}
                      name={sub.name}
                      minutes={cycleCurrent.minutes}
                      done={false}
                      paused={state.cycle.paused}
                      onStart={() => setTarget({ subject: sub, plannedMinutes: cycleCurrent.minutes })}
                      extra={
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            update((d) => {
                              d.cycle.currentIndex = (d.cycle.currentIndex + 1) % d.cycle.items.length;
                            })
                          }
                        >
                          Avançar
                        </Button>
                      }
                    />
                  );
                })()
              ) : (
                <Empty text="Seu ciclo está vazio." />
              )
            ) : planned.length === 0 ? (
              <Empty text="Nada planejado para hoje. Dia livre — ou estude algo avulso." />
            ) : (
              <ul className="divide-y divide-border">
                {planned.map((p) =>
                  p.subject ? (
                    <SubjectRow
                      key={p.key}
                      color={p.subject.color}
                      name={p.subject.name}
                      minutes={p.item.minutes}
                      done={sessions.some((s) => s.subjectId === p.item.subjectId)}
                      onStart={() =>
                        setTarget({ subject: p.subject!, plannedMinutes: p.item.minutes, plannedDayId: p.dayId })
                      }
                    />
                  ) : null,
                )}
              </ul>
            )}
          </Panel>

          <Panel title="Estudado hoje">
            {sessions.length === 0 ? (
              <Empty text="Nenhum registro ainda." />
            ) : (
              <ul className="space-y-2 text-sm">
                {sessions.map((s) => {
                  const sub = state.subjects.find((x) => x.id === s.subjectId);
                  return (
                    <li key={s.id} className="flex items-center gap-3">
                      <span className="size-2.5 rounded-full" style={{ backgroundColor: sub?.color }} />
                      <span className="font-medium">{sub?.name}</span>
                      <span className="text-muted-foreground">{s.topic}</span>
                      <span className="ml-auto tabular-nums">{fmtMinutes(s.minutes)}</span>
                    </li>
                  );
                })}
              </ul>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              {state.subjects
                .filter((s) => s.active)
                .map((s) => (
                  <Button key={s.id} size="sm" variant="outline" onClick={() => setTarget({ subject: s })}>
                    <span className="size-2 rounded-full" style={{ backgroundColor: s.color }} />
                    {s.name}
                  </Button>
                ))}
            </div>
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel title="Resumo do dia">
            <div className="flex items-end justify-between">
              <p className="font-display text-3xl font-semibold">{fmtMinutes(studied)}</p>
              <p className="text-sm text-muted-foreground">meta {fmtMinutes(goal)}</p>
            </div>
            <div className="mt-3">
              <Bar percent={pct} />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{pct}% da meta</p>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <Mini label="Matérias" value={`${doneSubjects}/${planned.length}`} />
              <Mini label="Pendências" value={`${pend.length}`} />
              <Mini label="Revisões" value={`${revs.length}`} />
              <Mini label="Lembretes" value={`${remindersToday.length}`} />
            </dl>
          </Panel>

          {nextExam && (
            <Stat
              label={nextExam.c.name}
              value={`Faltam ${nextExam.d} dias`}
              hint={`Prova em ${new Date(nextExam.c.examDate + "T12:00").toLocaleDateString("pt-BR")}`}
              tone="primary"
            />
          )}

          <Panel title="Revisões para hoje" right={<RotateCcw className="size-4 text-muted-foreground" />}>
            {revs.length === 0 ? (
              <Empty text="Nenhuma revisão hoje." />
            ) : (
              <ul className="space-y-2 text-sm">
                {revs.map((r) => {
                  const sub = state.subjects.find((x) => x.id === r.subjectId);
                  return (
                    <li key={r.id} className="flex items-center gap-2">
                      <span className="size-2 rounded-full" style={{ backgroundColor: sub?.color }} />
                      <span className="truncate">{sub?.name} — {r.topic}</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="ml-auto size-7"
                        aria-label="Marcar revisão feita"
                        onClick={() =>
                          update((d) => {
                            const x = d.revisoes.find((y) => y.id === r.id);
                            if (x) x.done = true;
                          })
                        }
                      >
                        <CheckCircle2 className="size-4" />
                      </Button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>

          <Panel title="Lembretes de hoje" right={<BellRing className="size-4 text-muted-foreground" />}>
            {remindersToday.length === 0 ? (
              <Empty text="Sem lembretes hoje." />
            ) : (
              <ul className="space-y-1 text-sm">
                {remindersToday.map((r) => (
                  <li key={r.id}>
                    {r.time && <span className="mr-2 tabular-nums text-muted-foreground">{r.time}</span>}
                    {r.title}
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          {pend.length > 0 && (
            <Button asChild variant="outline" className="w-full">
              <Link to="/pendencias">
                <ClipboardList className="size-4" /> Ver {pend.length} pendências
              </Link>
            </Button>
          )}
        </div>
      </div>

      <StudySessionDialog target={target} onClose={() => setTarget(null)} />
    </AppLayout>
  );
}

function SubjectRow({
  color,
  name,
  minutes,
  done,
  paused,
  onStart,
  extra,
}: {
  color: string;
  name: string;
  minutes: number;
  done: boolean;
  paused?: boolean;
  onStart: () => void;
  extra?: React.ReactNode;
}) {
  return (
    <li className="flex items-center gap-4 py-3">
      <span className="h-10 w-1.5 rounded-full" style={{ backgroundColor: color }} />
      <div className="min-w-0 flex-1">
        <p className="font-display font-semibold">{name}</p>
        <p className="text-xs text-muted-foreground">Tempo planejado: {fmtMinutes(minutes)}</p>
      </div>
      {done && <span className="rounded-full bg-success/15 px-2 py-0.5 text-xs text-success">Realizado</span>}
      {extra}
      <Button size="sm" onClick={onStart} disabled={paused}>
        <Play className="size-4" /> {paused ? "Ciclo pausado" : "Iniciar estudo"}
      </Button>
    </li>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/60 px-3 py-2">
      <dt className="text-[11px] text-muted-foreground">{label}</dt>
      <dd className="font-display text-lg font-semibold">{value}</dd>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="py-4 text-sm text-muted-foreground">{text}</p>;
}
