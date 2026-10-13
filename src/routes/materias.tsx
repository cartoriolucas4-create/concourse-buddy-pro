import { createFileRoute } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";
import { AppLayout, Panel } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useStore } from "@/lib/store";
import { SUBJECT_COLORS, uid } from "@/lib/study";
import type { Priority } from "@/lib/types";

export const Route = createFileRoute("/materias")({
  head: () => ({
    meta: [
      { title: "Minhas matérias — Central de Estudos" },
      { name: "description", content: "Cadastre matérias, cores, prioridades, frequência semanal e concursos." },
      { property: "og:title", content: "Minhas matérias — Central de Estudos" },
      { property: "og:description", content: "Gerencie as matérias do seu planejamento." },
    ],
  }),
  component: Materias,
});

function Materias() {
  const { state, update } = useStore();
  const add = () =>
    update((d) =>
      void d.subjects.push({
        id: uid(),
        name: "Nova matéria",
        area: "",
        color: SUBJECT_COLORS[d.subjects.length % SUBJECT_COLORS.length],
        priority: "media",
        active: true,
        note: "",
        frequency: 1,
        concursoIds: d.activeConcursoId === "all" ? [] : [d.activeConcursoId],
      }),
    );

  return (
    <AppLayout title="Minhas matérias" subtitle={`${state.subjects.length} cadastradas`} actions={<Button size="sm" onClick={add}><Plus className="size-4" /> Matéria</Button>}>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {state.subjects.map((s, i) => {
          const set = (fn: (x: typeof s) => void) => update((d) => fn(d.subjects[i]));
          return (
            <Panel key={s.id} className={s.active ? "" : "opacity-60"}>
              <div className="flex items-center gap-2">
                <input type="color" value={s.color} onChange={(e) => set((x) => void (x.color = e.target.value))} className="size-8 cursor-pointer rounded border-0 bg-transparent" aria-label="Cor" />
                <Input value={s.name} onChange={(e) => set((x) => void (x.name = e.target.value))} className="font-display font-semibold" aria-label="Nome" />
                <Switch checked={s.active} onCheckedChange={(v) => set((x) => void (x.active = v))} aria-label="Ativa" />
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <label className="grid gap-1">
                  <span className="label-caps">Área</span>
                  <Input value={s.area} onChange={(e) => set((x) => void (x.area = e.target.value))} className="h-8" />
                </label>
                <label className="grid gap-1">
                  <span className="label-caps">Prioridade</span>
                  <select value={s.priority} onChange={(e) => set((x) => void (x.priority = e.target.value as Priority))} className="h-8 rounded-md border border-input bg-background px-1">
                    <option value="alta">Alta</option>
                    <option value="media">Média</option>
                    <option value="baixa">Baixa</option>
                  </select>
                </label>
                <label className="grid gap-1">
                  <span className="label-caps">Vezes/sem.</span>
                  <Input type="number" min={0} value={s.frequency} onChange={(e) => set((x) => void (x.frequency = Number(e.target.value) || 0))} className="h-8" />
                </label>
              </div>
              <div className="mt-3">
                <p className="label-caps mb-1">Concursos</p>
                <div className="flex flex-wrap gap-1">
                  {state.concursos.map((c) => {
                    const on = s.concursoIds.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        onClick={() => set((x) => void (x.concursoIds = on ? x.concursoIds.filter((y) => y !== c.id) : [...x.concursoIds, c.id]))}
                        className={`rounded-full border px-2 py-0.5 text-[11px] ${on ? "border-primary bg-accent text-accent-foreground" : "border-border text-muted-foreground"}`}
                      >
                        {c.name}
                      </button>
                    );
                  })}
                </div>
              </div>
              <Input value={s.note} onChange={(e) => set((x) => void (x.note = e.target.value))} placeholder="Observação" className="mt-3 h-8 text-xs" />
              <div className="mt-2 flex justify-end">
                <Button size="sm" variant="ghost" onClick={() => update((d) => void d.subjects.splice(i, 1))}>
                  <Trash2 className="size-4" /> Excluir
                </Button>
              </div>
            </Panel>
          );
        })}
      </div>
    </AppLayout>
  );
}
