import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { AppLayout, Panel } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { addDaysISO, fmtBR, fmtMinutes, startOfWeekISO, todayISO } from "@/lib/study";

export const Route = createFileRoute("/historico")({
  head: () => ({
    meta: [
      { title: "Histórico de estudos — Central de Estudos" },
      { name: "description", content: "Todo o seu histórico real de estudos, com filtros por período, matéria e concurso." },
      { property: "og:title", content: "Histórico de estudos — Central de Estudos" },
      { property: "og:description", content: "Planejado × realizado e diário de estudos." },
    ],
  }),
  component: Historico,
});

function Historico() {
  const { state, update } = useStore();
  const [period, setPeriod] = useState<"dia" | "semana" | "mes" | "tudo">("semana");
  const [subjectId, setSubjectId] = useState("");
  const [concursoId, setConcursoId] = useState("");
  const today = todayISO();
  const from = { dia: today, semana: startOfWeekISO(today), mes: today.slice(0, 8) + "01", tudo: "0000" }[period];
  const list = state.sessions
    .filter((s) => s.date >= from && (!subjectId || s.subjectId === subjectId) && (!concursoId || s.concursoId === concursoId))
    .sort((a, b) => b.date.localeCompare(a.date));
  const total = list.reduce((a, s) => a + s.minutes, 0);

  return (
    <AppLayout title="Histórico de estudos" subtitle={`${list.length} sessões · ${fmtMinutes(total)}`}>
      <div className="mb-4 flex flex-wrap gap-2">
        {(["dia", "semana", "mes", "tudo"] as const).map((p) => (
          <Button key={p} size="sm" variant={period === p ? "default" : "outline"} onClick={() => setPeriod(p)}>
            {{ dia: "Hoje", semana: "Semana", mes: "Mês", tudo: "Tudo" }[p]}
          </Button>
        ))}
        <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className="h-8 rounded-md border border-input bg-background px-2 text-sm">
          <option value="">Todas as matérias</option>
          {state.subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={concursoId} onChange={(e) => setConcursoId(e.target.value)} className="h-8 rounded-md border border-input bg-background px-2 text-sm">
          <option value="">Todos os concursos</option>
          {state.concursos.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <Panel className="overflow-x-auto p-0 lg:p-0">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-muted/60 text-left">
            <tr className="label-caps">
              <th className="px-4 py-2">Data</th><th className="px-4 py-2">Matéria</th><th className="px-4 py-2">Assunto</th>
              <th className="px-4 py-2">Tempo</th><th className="px-4 py-2">Planejado × realizado</th><th className="px-4 py-2">Obs.</th><th />
            </tr>
          </thead>
          <tbody>
            {list.map((s) => {
              const sub = state.subjects.find((x) => x.id === s.subjectId);
              const weekday = new Date(s.date + "T12:00").toLocaleDateString("pt-BR", { weekday: "long" });
              return (
                <tr key={s.id} className="border-t border-grid">
                  <td className="px-4 py-2 tabular-nums">{fmtBR(s.date)}</td>
                  <td className="px-4 py-2"><span className="mr-2 inline-block size-2 rounded-full" style={{ backgroundColor: sub?.color }} />{sub?.name}</td>
                  <td className="px-4 py-2">{s.topic || "—"}</td>
                  <td className="px-4 py-2 tabular-nums">{fmtMinutes(s.minutes)}</td>
                  <td className="px-4 py-2 text-xs text-muted-foreground">
                    {s.plannedDayId ? `Planejado para ${s.plannedDayId}, realizado na ${weekday}` : "Estudo avulso"}
                  </td>
                  <td className="px-4 py-2 text-xs text-muted-foreground">{s.note}</td>
                  <td className="px-2"><button aria-label="Excluir" onClick={() => update((d) => void (d.sessions = d.sessions.filter((x) => x.id !== s.id)))} className="text-muted-foreground hover:text-destructive"><Trash2 className="size-4" /></button></td>
                </tr>
              );
            })}
            {list.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Nenhum estudo no período.</td></tr>}
          </tbody>
        </table>
      </Panel>
      <p className="mt-2 text-xs text-muted-foreground">O histórico real nunca é alterado por mudanças no planejamento. {addDaysISO(today, 0) && ""}</p>
    </AppLayout>
  );
}
