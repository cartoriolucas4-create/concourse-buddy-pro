import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { AppLayout, Panel } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useStore } from "@/lib/store";
import { addDaysISO, fmtBR, todayISO, uid } from "@/lib/study";

export const Route = createFileRoute("/revisoes")({
  head: () => ({
    meta: [
      { title: "Revisões — Central de Estudos" },
      { name: "description", content: "Agende e acompanhe revisões simples dos assuntos estudados." },
      { property: "og:title", content: "Revisões — Central de Estudos" },
      { property: "og:description", content: "Revisões do dia e próximas revisões." },
    ],
  }),
  component: Revisoes,
});

function Revisoes() {
  const { state, update } = useStore();
  const today = todayISO();
  const [subjectId, setSubjectId] = useState(state.subjects[0]?.id ?? "");
  const [topic, setTopic] = useState("");
  const [date, setDate] = useState(addDaysISO(today, state.settings.revisionIntervals[0] ?? 1));
  const open = state.revisoes.filter((r) => !r.done).sort((a, b) => a.date.localeCompare(b.date));
  const dueToday = open.filter((r) => r.date <= today).length;

  return (
    <AppLayout title="Revisões" subtitle={`🔄 ${dueToday} revisões para hoje`}>
      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <Panel title="Nova revisão">
          <div className="grid gap-2">
            <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className="h-9 rounded-md border border-input bg-background px-2 text-sm">
              {state.subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <Input placeholder="Assunto" value={topic} onChange={(e) => setTopic(e.target.value)} />
            <div className="flex flex-wrap gap-1">
              {state.settings.revisionIntervals.map((n) => (
                <Button key={n} size="sm" variant="outline" onClick={() => setDate(addDaysISO(today, n))}>+{n}d</Button>
              ))}
            </div>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <Button disabled={!topic.trim()} onClick={() => { update((d) => void d.revisoes.push({ id: uid(), subjectId, topic: topic.trim(), date, done: false })); setTopic(""); }}>Agendar revisão</Button>
          </div>
        </Panel>
        <Panel title="Próximas revisões">
          {open.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma revisão agendada.</p>}
          <ul className="divide-y divide-border">
            {open.map((r) => {
              const sub = state.subjects.find((s) => s.id === r.subjectId);
              return (
                <li key={r.id} className="flex items-center gap-3 py-2.5">
                  <Checkbox onCheckedChange={() => update((d) => void (d.revisoes.find((x) => x.id === r.id)!.done = true))} aria-label="Revisão feita" />
                  <span className="size-2.5 rounded-full" style={{ backgroundColor: sub?.color }} />
                  <div className="flex-1 text-sm"><span className="font-medium">{sub?.name}</span> — {r.topic}</div>
                  {r.date <= today && <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] text-primary">{r.date < today ? "vencida" : "hoje"}</span>}
                  <Input type="date" value={r.date} onChange={(e) => update((d) => void (d.revisoes.find((x) => x.id === r.id)!.date = e.target.value))} className="h-8 w-36" aria-label={`Data (${fmtBR(r.date)})`} />
                  <button aria-label="Excluir" onClick={() => update((d) => void (d.revisoes = d.revisoes.filter((x) => x.id !== r.id)))} className="text-muted-foreground hover:text-destructive"><Trash2 className="size-4" /></button>
                </li>
              );
            })}
          </ul>
        </Panel>
      </div>
    </AppLayout>
  );
}
