import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppLayout, Bar, Panel } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStore } from "@/lib/store";
import { editalProgress, subjectsForActive } from "@/lib/derive";
import { addDaysISO, todayISO, uid } from "@/lib/study";
import type { EditalStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/edital")({
  head: () => ({
    meta: [
      { title: "Meu edital — Central de Estudos" },
      { name: "description", content: "Controle o conteúdo do edital por matéria, assunto e subassunto." },
      { property: "og:title", content: "Meu edital — Central de Estudos" },
      { property: "og:description", content: "Acompanhe o progresso do edital." },
    ],
  }),
  component: Edital,
});

const STATUS: { v: EditalStatus; label: string; cls: string }[] = [
  { v: "nao-iniciado", label: "Não iniciado", cls: "bg-muted text-muted-foreground" },
  { v: "em-andamento", label: "Em andamento", cls: "bg-warning/25 text-warning-foreground" },
  { v: "concluido", label: "Concluído", cls: "bg-success/20 text-success" },
  { v: "revisao-pendente", label: "Revisão pendente", cls: "bg-primary/15 text-primary" },
];

function Edital() {
  const { state, update } = useStore();
  const prog = editalProgress(state);
  const subjects = subjectsForActive(state);
  const concursoId = state.activeConcursoId === "all" ? state.concursos[0]?.id ?? "" : state.activeConcursoId;
  const items = state.edital.filter((e) => state.activeConcursoId === "all" || e.concursoId === state.activeConcursoId);
  const [filter, setFilter] = useState<"all" | "pend" | "done">("all");

  const cycleStatus = (id: string) =>
    update((d) => {
      const it = d.edital.find((x) => x.id === id);
      if (!it) return;
      const idx = STATUS.findIndex((s) => s.v === it.status);
      it.status = STATUS[(idx + 1) % STATUS.length].v;
      if (it.status === "concluido") {
        d.revisoes.push({ id: uid(), subjectId: it.subjectId, topic: it.title, date: addDaysISO(todayISO(), d.settings.revisionIntervals[1] ?? 7), done: false });
        toast.success(`Revisão agendada para ${it.title}`);
      }
    });

  const addItem = (subjectId: string, parentId: string | null) =>
    update((d) => void d.edital.push({ id: uid(), concursoId, subjectId, title: parentId ? "Novo subassunto" : "Novo assunto", parentId, status: "nao-iniciado" }));

  const visible = (status: EditalStatus) =>
    filter === "all" || (filter === "done" ? status === "concluido" : status !== "concluido");

  return (
    <AppLayout title="Meu edital" subtitle={`${prog.done} de ${prog.total} conteúdos concluídos`}>
      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <div className="space-y-4">
          <Panel title="Progresso geral">
            <p className="font-display text-4xl font-semibold">{prog.percent}%</p>
            <div className="mt-2"><Bar percent={prog.percent} /></div>
            <p className="mt-2 text-xs text-muted-foreground">{prog.pending} conteúdos pendentes</p>
          </Panel>
          <Panel title="Por matéria">
            <ul className="space-y-3">
              {prog.bySubject.map((b) => {
                const s = state.subjects.find((x) => x.id === b.subjectId);
                return (
                  <li key={b.subjectId}>
                    <div className="mb-1 flex justify-between text-sm"><span>{s?.name}</span><span className="tabular-nums">{b.percent}%</span></div>
                    <Bar percent={b.percent} color={s?.color} />
                  </li>
                );
              })}
            </ul>
          </Panel>
        </div>

        <div className="space-y-4">
          <div className="flex gap-2">
            {(["all", "pend", "done"] as const).map((f) => (
              <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)}>
                {{ all: "Todos", pend: "Pendentes", done: "Concluídos" }[f]}
              </Button>
            ))}
            <span className="ml-auto self-center text-xs text-muted-foreground">Clique no status para alterar</span>
          </div>
          {subjects.map((s) => {
            const topics = items.filter((e) => e.subjectId === s.id && !e.parentId);
            return (
              <Panel key={s.id} title={s.name} right={<Button size="sm" variant="ghost" onClick={() => addItem(s.id, null)}><Plus className="size-4" /> Assunto</Button>}>
                {topics.length === 0 && <p className="text-sm text-muted-foreground">Nenhum assunto cadastrado.</p>}
                <ul className="space-y-3">
                  {topics.map((t) => {
                    const subs = items.filter((e) => e.parentId === t.id);
                    const done = subs.filter((x) => x.status === "concluido").length;
                    const pct = subs.length ? Math.round((done / subs.length) * 100) : t.status === "concluido" ? 100 : 0;
                    return (
                      <li key={t.id} className="rounded-lg border border-border">
                        <ItemRow item={t} onStatus={() => cycleStatus(t.id)} bold extra={<span className="w-10 text-right text-xs tabular-nums text-muted-foreground">{pct}%</span>} onAdd={() => addItem(s.id, t.id)} />
                        <ul className="border-t border-border">
                          {subs.filter((x) => visible(x.status)).map((x) => (
                            <ItemRow key={x.id} item={x} onStatus={() => cycleStatus(x.id)} />
                          ))}
                        </ul>
                      </li>
                    );
                  })}
                </ul>
              </Panel>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );

  function ItemRow({ item, onStatus, bold, extra, onAdd }: { item: (typeof items)[number]; onStatus: () => void; bold?: boolean; extra?: React.ReactNode; onAdd?: () => void }) {
    const st = STATUS.find((s) => s.v === item.status)!;
    return (
      <div className={cn("flex items-center gap-2 px-3 py-1.5", !bold && "pl-8")}>
        <input
          defaultValue={item.title}
          onBlur={(e) => update((d) => { const x = d.edital.find((y) => y.id === item.id); if (x) x.title = e.target.value; })}
          className={cn("min-w-0 flex-1 bg-transparent text-sm outline-none", bold && "font-medium")}
          aria-label="Título"
        />
        {extra}
        <button onClick={onStatus} className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", st.cls)}>{st.label}</button>
        {onAdd && <button onClick={onAdd} aria-label="Adicionar subassunto" className="text-muted-foreground hover:text-foreground"><Plus className="size-4" /></button>}
        <button onClick={() => update((d) => void (d.edital = d.edital.filter((y) => y.id !== item.id && y.parentId !== item.id)))} aria-label="Excluir" className="text-muted-foreground hover:text-destructive"><Trash2 className="size-3.5" /></button>
      </div>
    );
  }
}

// evita aviso de import não usado em alguns linters
void Input;
