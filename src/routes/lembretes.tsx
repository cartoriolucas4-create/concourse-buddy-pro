import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { AppLayout, Panel } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useStore } from "@/lib/store";
import { fmtBR, todayISO, uid } from "@/lib/study";
import type { Priority, ReminderCategory } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/lembretes")({
  head: () => ({
    meta: [
      { title: "Lembretes — Central de Estudos" },
      { name: "description", content: "Lembretes de inscrição, edital, revisões e tarefas do concurso." },
      { property: "og:title", content: "Lembretes — Central de Estudos" },
      { property: "og:description", content: "Não esqueça suas obrigações do concurso." },
    ],
  }),
  component: Lembretes,
});

const CATS: ReminderCategory[] = ["Estudo", "Concurso", "Edital", "Revisão", "Administrativo", "Pessoal"];

function Lembretes() {
  const { state, update } = useStore();
  const [form, setForm] = useState({ title: "", description: "", date: todayISO(), time: "", priority: "media" as Priority, category: "Estudo" as ReminderCategory });
  const [showDone, setShowDone] = useState(false);
  const list = [...state.reminders].filter((r) => showDone || !r.done).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const today = todayISO();

  return (
    <AppLayout title="Lembretes" subtitle={state.settings.remindersEnabled ? undefined : "Lembretes desativados nas configurações"}>
      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <Panel title="Novo lembrete">
          <div className="grid gap-2">
            <Input placeholder="Título" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <Input placeholder="Descrição" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <div className="grid grid-cols-2 gap-2">
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              <Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as ReminderCategory })} className="h-9 rounded-md border border-input bg-background px-2 text-sm">
                {CATS.map((c) => <option key={c}>{c}</option>)}
              </select>
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })} className="h-9 rounded-md border border-input bg-background px-2 text-sm">
                <option value="alta">Alta</option><option value="media">Média</option><option value="baixa">Baixa</option>
              </select>
            </div>
            <Button disabled={!form.title.trim()} onClick={() => {
              update((d) => void d.reminders.push({ id: uid(), ...form, done: false, concursoId: d.activeConcursoId === "all" ? null : d.activeConcursoId }));
              setForm({ ...form, title: "", description: "" });
            }}>
              <Plus className="size-4" /> Adicionar
            </Button>
          </div>
        </Panel>
        <Panel title="Agenda" right={<button className="text-xs text-muted-foreground underline" onClick={() => setShowDone((v) => !v)}>{showDone ? "Ocultar concluídos" : "Mostrar concluídos"}</button>}>
          {list.length === 0 && <p className="text-sm text-muted-foreground">Nenhum lembrete.</p>}
          <ul className="divide-y divide-border">
            {list.map((r) => (
              <li key={r.id} className="flex items-center gap-3 py-2.5">
                <Checkbox checked={r.done} onCheckedChange={(v) => update((d) => void (d.reminders.find((x) => x.id === r.id)!.done = Boolean(v)))} aria-label="Concluído" />
                <div className={cn("min-w-0 flex-1", r.done && "line-through opacity-60")}>
                  <p className="text-sm font-medium">{r.title}</p>
                  {r.description && <p className="text-xs text-muted-foreground">{r.description}</p>}
                </div>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[11px]">{r.category}</span>
                {r.priority === "alta" && <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-[11px] text-destructive">Alta</span>}
                <span className={cn("w-24 text-right text-xs tabular-nums", r.date < today && !r.done ? "text-warning-foreground" : "text-muted-foreground")}>
                  {fmtBR(r.date)} {r.time}
                </span>
                <button aria-label="Excluir" onClick={() => update((d) => void (d.reminders = d.reminders.filter((x) => x.id !== r.id)))} className="text-muted-foreground hover:text-destructive"><Trash2 className="size-4" /></button>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </AppLayout>
  );
}
