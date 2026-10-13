import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppLayout, Panel } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStore } from "@/lib/store";
import { pendencias } from "@/lib/derive";
import { addDaysISO, fmtBR, todayISO, uid } from "@/lib/study";

export const Route = createFileRoute("/pendencias")({
  head: () => ({
    meta: [
      { title: "Pendências — Central de Estudos" },
      { name: "description", content: "O que ficou em aberto: reagende, conclua, ignore ou leve ao ciclo." },
      { property: "og:title", content: "Pendências — Central de Estudos" },
      { property: "og:description", content: "Reorganize o que ficou aberto sem culpa." },
    ],
  }),
  component: Pendencias,
});

function Pendencias() {
  const { state, update } = useStore();
  const list = pendencias(state);
  const [dates, setDates] = useState<Record<string, string>>({});
  const days = state.settings.days;

  const close = (key: string, action: "concluida" | "ignorada" | "reagendada") =>
    update((d) => {
      d.pendenciaOverrides = d.pendenciaOverrides.filter((o) => o.key !== key);
      d.pendenciaOverrides.push({ key, action });
    });

  return (
    <AppLayout title="Pendências" subtitle="Uma pendência é só algo que ficou aberto — não um atraso.">
      <Panel>
        {list.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Nada em aberto. 🎉</p>
        ) : (
          <ul className="divide-y divide-border">
            {list.map((p) => {
              const sub = state.subjects.find((s) => s.id === p.subjectId);
              return (
                <li key={p.key} className="flex flex-wrap items-center gap-3 py-3">
                  <span className="h-9 w-1.5 rounded-full" style={{ backgroundColor: sub?.color }} />
                  <div className="min-w-[180px] flex-1">
                    <p className="text-sm font-medium">{p.kind === "revisao" ? `Revisão de ${sub?.name}` : sub?.name}{p.topic ? ` — ${p.topic}` : ""}</p>
                    <p className="text-xs text-muted-foreground">{p.label} · {fmtBR(p.date)}</p>
                  </div>
                  {p.kind === "revisao" ? (
                    <>
                      <Input type="date" className="h-8 w-36" value={dates[p.key] ?? todayISO()} onChange={(e) => setDates({ ...dates, [p.key]: e.target.value })} />
                      <Button size="sm" variant="outline" onClick={() => update((d) => void (d.revisoes.find((r) => r.id === p.refId)!.date = dates[p.key] ?? todayISO()))}>Reagendar</Button>
                      <Button size="sm" onClick={() => update((d) => void (d.revisoes.find((r) => r.id === p.refId)!.done = true))}>Concluída</Button>
                      <Button size="sm" variant="ghost" onClick={() => update((d) => void (d.revisoes = d.revisoes.filter((r) => r.id !== p.refId)))}>Ignorar</Button>
                    </>
                  ) : (
                    <>
                      <select
                        className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                        defaultValue=""
                        onChange={(e) => {
                          const day = e.target.value;
                          if (!day) return;
                          update((d) => {
                            const row = d.plan[day] ?? [];
                            const empty = row.findIndex((x) => !x);
                            if (empty === -1) { toast.error(`${day} está cheio`); return; }
                            row[empty] = { id: uid(), subjectId: p.subjectId, minutes: d.settings.defaultSessionMinutes };
                            d.plan[day] = row;
                            d.pendenciaOverrides.push({ key: p.key, action: "reagendada" });
                          });
                          toast.success(`Movido para ${day}`);
                        }}
                      >
                        <option value="">Mover para dia…</option>
                        {days.map((d) => <option key={d}>{d}</option>)}
                      </select>
                      <Button size="sm" variant="outline" onClick={() => {
                        update((d) => {
                          d.cycle.items.splice(d.cycle.currentIndex + 1, 0, { id: uid(), subjectId: p.subjectId, minutes: d.settings.defaultSessionMinutes, done: false });
                          d.pendenciaOverrides.push({ key: p.key, action: "reagendada" });
                        });
                        toast.success("Adicionado ao próximo do ciclo");
                      }}>Próximo ciclo</Button>
                      <Button size="sm" variant="outline" onClick={() => {
                        update((d) => void d.reminders.push({ id: uid(), title: `Estudar ${sub?.name}`, description: "Pendência reagendada", date: addDaysISO(todayISO(), 1), time: "", priority: "media", category: "Estudo", done: false, concursoId: null }));
                        close(p.key, "reagendada");
                      }}>Reagendar p/ amanhã</Button>
                      <Button size="sm" onClick={() => close(p.key, "concluida")}>Concluída</Button>
                      <Button size="sm" variant="ghost" onClick={() => close(p.key, "ignorada")}>Ignorar</Button>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </AppLayout>
  );
}
