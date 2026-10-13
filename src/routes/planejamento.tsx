import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { ArrowDown, ArrowUp, Copy, GripVertical, Pause, Play, Plus, Save, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { AppLayout, Panel } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useStore } from "@/lib/store";
import { subjectsForActive } from "@/lib/derive";
import { fmtMinutes, normalizePlan, uid } from "@/lib/study";
import type { PlanItem, Subject } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/planejamento")({
  head: () => ({
    meta: [
      { title: "Planejamento — Central de Estudos" },
      { name: "description", content: "Organize a semana arrastando matérias, salve semanas modelo e use o ciclo de estudos." },
      { property: "og:title", content: "Planejamento — Central de Estudos" },
      { property: "og:description", content: "Planejamento semanal com arrastar e soltar e ciclo de estudos." },
    ],
  }),
  component: Planejamento,
});

function Planejamento() {
  const { state, update } = useStore();
  return (
    <AppLayout
      title="Planejamento"
      subtitle={state.cycle.enabled ? "Modo ciclo ativo" : "Planejamento semanal ativo"}
      actions={
        <div className="hidden items-center gap-2 text-xs sm:flex">
          Semanal
          <Switch
            checked={state.cycle.enabled}
            onCheckedChange={(v) => update((d) => void (d.cycle.enabled = v))}
            aria-label="Alternar modo ciclo"
          />
          Ciclo
        </div>
      }
    >
      <Tabs defaultValue={state.cycle.enabled ? "ciclo" : "semana"}>
        <TabsList>
          <TabsTrigger value="semana">Semana</TabsTrigger>
          <TabsTrigger value="ciclo">Ciclo de estudos</TabsTrigger>
          <TabsTrigger value="modelos">Semanas modelo</TabsTrigger>
        </TabsList>
        <TabsContent value="semana" className="mt-4">
          <WeekBoard />
        </TabsContent>
        <TabsContent value="ciclo" className="mt-4">
          <CycleEditor />
        </TabsContent>
        <TabsContent value="modelos" className="mt-4">
          <Templates />
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}

/* ---------------- Semana (drag & drop) ---------------- */

function WeekBoard() {
  const { state, update } = useStore();
  const { days, slots } = state.settings;
  const plan = normalizePlan(state.plan, days, slots);
  const subjects = subjectsForActive(state).filter((s) => s.active);
  const [dragging, setDragging] = useState<{ subject: Subject; minutes: number } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor),
  );

  const counts = new Map<string, number>();
  for (const d of days) for (const it of plan[d]) if (it) counts.set(it.subjectId, (counts.get(it.subjectId) ?? 0) + 1);

  const onStart = (e: DragStartEvent) => {
    const data = e.active.data.current as { subjectId: string; minutes: number } | undefined;
    const sub = state.subjects.find((s) => s.id === data?.subjectId);
    if (sub && data) setDragging({ subject: sub, minutes: data.minutes });
  };

  const onEnd = (e: DragEndEvent) => {
    setDragging(null);
    if (!e.over) return;
    const [, toDay, toIdxS] = String(e.over.id).split("|");
    const toIdx = Number(toIdxS);
    const src = String(e.active.id).split("|");
    update((d) => {
      d.plan = normalizePlan(d.plan, d.settings.days, d.settings.slots);
      if (src[0] === "palette") {
        d.plan[toDay][toIdx] = { id: uid(), subjectId: src[1], minutes: d.settings.defaultSessionMinutes };
        return;
      }
      const fromDay = src[1];
      const fromIdx = Number(src[2]);
      if (fromDay === toDay && fromIdx === toIdx) return;
      const a = d.plan[fromDay][fromIdx];
      d.plan[fromDay][fromIdx] = d.plan[toDay][toIdx];
      d.plan[toDay][toIdx] = a;
    });
  };

  const mutate = (day: string, idx: number, fn: (row: (PlanItem | null)[]) => void) =>
    update((d) => {
      d.plan = normalizePlan(d.plan, d.settings.days, d.settings.slots);
      fn(d.plan[day]);
    });

  const totalMinutes = days.reduce((acc, d) => acc + plan[d].reduce((a, it) => a + (it?.minutes ?? 0), 0), 0);

  return (
    <DndContext sensors={sensors} onDragStart={onStart} onDragEnd={onEnd} onDragCancel={() => setDragging(null)}>
      <div className="grid gap-4 xl:grid-cols-[1fr_260px]">
        <div className="overflow-x-auto">
          <div
            className="sheet-grid grid min-w-[760px] bg-card"
            style={{ gridTemplateColumns: `90px repeat(${days.length}, minmax(130px, 1fr))` }}
          >
            <div className="border-b border-r border-grid bg-muted/60 p-2 label-caps">Ordem</div>
            {days.map((d) => (
              <div key={d} className="border-b border-r border-grid bg-muted/60 p-2 text-center font-display text-sm font-semibold last:border-r-0">
                {d}
                <p className="text-[10px] font-normal text-muted-foreground">
                  {fmtMinutes(plan[d].reduce((a, it) => a + (it?.minutes ?? 0), 0))}
                </p>
              </div>
            ))}
            {Array.from({ length: slots }, (_, idx) => (
              <Row key={idx}>
                <div className="flex items-center border-b border-r border-grid px-2 text-xs text-muted-foreground">
                  {idx + 1}ª matéria
                </div>
                {days.map((day) => (
                  <Slot key={day} day={day} idx={idx}>
                    {plan[day][idx] && (
                      <Card
                        day={day}
                        idx={idx}
                        item={plan[day][idx]!}
                        subject={state.subjects.find((s) => s.id === plan[day][idx]!.subjectId)}
                        onRemove={() => mutate(day, idx, (r) => void (r[idx] = null))}
                        onDuplicate={() =>
                          mutate(day, idx, (r) => {
                            const empty = r.findIndex((x) => !x);
                            if (empty === -1) return void toast.error("Sem espaço vazio neste dia");
                            r[empty] = { ...r[idx]!, id: uid() };
                          })
                        }
                        onMove={(dir) =>
                          mutate(day, idx, (r) => {
                            const j = idx + dir;
                            if (j < 0 || j >= r.length) return;
                            [r[idx], r[j]] = [r[j], r[idx]];
                          })
                        }
                        onMinutes={(m) => mutate(day, idx, (r) => void (r[idx]!.minutes = m))}
                      />
                    )}
                  </Slot>
                ))}
              </Row>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Total planejado: {fmtMinutes(totalMinutes)} · Meta semanal: {state.settings.weeklyGoalHours}h. Arraste para trocar de lugar; no celular, segure e arraste.
          </p>
        </div>

        <Panel title="Matérias (arraste para a grade)">
          <ul className="space-y-2">
            {subjects.map((s) => (
              <PaletteItem key={s.id} subject={s} count={counts.get(s.id) ?? 0} />
            ))}
          </ul>
          <p className="mt-3 text-[11px] text-muted-foreground">A frequência é só uma sugestão — mude como quiser.</p>
        </Panel>
      </div>

      <DragOverlay dropAnimation={{ duration: 180 }}>
        {dragging && (
          <div
            className="rounded-md border-l-4 bg-card px-3 py-2 text-sm font-medium shadow-[var(--shadow-lift)]"
            style={{ borderLeftColor: dragging.subject.color, transform: "rotate(-2deg)" }}
          >
            {dragging.subject.name}
            <span className="ml-2 text-xs text-muted-foreground">{fmtMinutes(dragging.minutes)}</span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function Slot({ day, idx, children }: { day: string; idx: number; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: `slot|${day}|${idx}` });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "min-h-[76px] border-b border-r border-grid p-1.5 transition-colors",
        isOver && "drop-active",
      )}
    >
      {children}
    </div>
  );
}

function Card({
  day,
  idx,
  item,
  subject,
  onRemove,
  onDuplicate,
  onMove,
  onMinutes,
}: {
  day: string;
  idx: number;
  item: PlanItem;
  subject?: Subject;
  onRemove: () => void;
  onDuplicate: () => void;
  onMove: (dir: number) => void;
  onMinutes: (m: number) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `cell|${day}|${idx}`,
    data: { subjectId: item.subjectId, minutes: item.minutes },
  });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "group relative h-full rounded-md border-l-4 bg-muted/50 px-2 py-1.5 text-xs transition-opacity",
        isDragging && "opacity-30",
      )}
      style={{ borderLeftColor: subject?.color }}
    >
      <div className="flex items-start gap-1">
        <button
          {...listeners}
          {...attributes}
          className="mt-0.5 cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
          aria-label={`Arrastar ${subject?.name}`}
        >
          <GripVertical className="size-3.5" />
        </button>
        <p className="flex-1 font-medium leading-tight">{subject?.name ?? "Matéria removida"}</p>
      </div>
      <div className="mt-1 flex items-center gap-1">
        <input
          type="number"
          min={5}
          step={5}
          value={item.minutes}
          onChange={(e) => onMinutes(Number(e.target.value) || 0)}
          className="w-12 rounded border border-input bg-background px-1 text-[11px]"
          aria-label="Minutos planejados"
        />
        <span className="text-[10px] text-muted-foreground">min</span>
        <div className="ml-auto flex opacity-100 transition-opacity lg:opacity-0 lg:group-hover:opacity-100">
          <IconBtn label="Subir" onClick={() => onMove(-1)}><ArrowUp className="size-3" /></IconBtn>
          <IconBtn label="Descer" onClick={() => onMove(1)}><ArrowDown className="size-3" /></IconBtn>
          <IconBtn label="Duplicar" onClick={onDuplicate}><Copy className="size-3" /></IconBtn>
          <IconBtn label="Remover" onClick={onRemove}><X className="size-3" /></IconBtn>
        </div>
      </div>
    </div>
  );
}

function IconBtn({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} aria-label={label} className="rounded p-0.5 text-muted-foreground hover:bg-background hover:text-foreground">
      {children}
    </button>
  );
}

function PaletteItem({ subject, count }: { subject: Subject; count: number }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette|${subject.id}`,
    data: { subjectId: subject.id, minutes: 60 },
  });
  const ok = count >= subject.frequency;
  return (
    <li
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        "flex cursor-grab touch-none items-center gap-2 rounded-md border border-border bg-background px-2 py-1.5 text-sm",
        isDragging && "opacity-40",
      )}
    >
      <span className="size-2.5 rounded-full" style={{ backgroundColor: subject.color }} />
      <span className="flex-1 truncate">{subject.name}</span>
      <span className={cn("text-[11px] tabular-nums", ok ? "text-success" : "text-muted-foreground")}>
        {count}/{subject.frequency}x
      </span>
    </li>
  );
}

/* ---------------- Ciclo ---------------- */

function CycleEditor() {
  const { state, update } = useStore();
  const { cycle } = state;
  const [addId, setAddId] = useState("");
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
      <Panel
        title="Sequência do ciclo"
        right={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => update((d) => void (d.cycle.paused = !d.cycle.paused))}>
              {cycle.paused ? <Play className="size-4" /> : <Pause className="size-4" />}
              {cycle.paused ? "Retomar" : "Pausar"}
            </Button>
          </div>
        }
      >
        <ol className="space-y-2">
          {cycle.items.map((it, i) => {
            const sub = state.subjects.find((s) => s.id === it.subjectId);
            const current = i === cycle.currentIndex % Math.max(1, cycle.items.length);
            return (
              <li
                key={it.id}
                className={cn(
                  "flex items-center gap-3 rounded-lg border border-border px-3 py-2",
                  current && "border-primary bg-accent",
                )}
              >
                <span className="w-6 font-display text-sm text-muted-foreground">{i + 1}</span>
                <span className="size-2.5 rounded-full" style={{ backgroundColor: sub?.color }} />
                <span className="flex-1 text-sm font-medium">{sub?.name}</span>
                {current && <span className="text-[11px] text-primary">próximo</span>}
                <Input
                  type="number"
                  className="h-8 w-20"
                  value={it.minutes}
                  onChange={(e) => update((d) => void (d.cycle.items[i].minutes = Number(e.target.value) || 0))}
                  aria-label="Duração em minutos"
                />
                <IconBtn label="Subir" onClick={() => update((d) => { if (i > 0) [d.cycle.items[i - 1], d.cycle.items[i]] = [d.cycle.items[i], d.cycle.items[i - 1]]; })}>
                  <ArrowUp className="size-4" />
                </IconBtn>
                <IconBtn label="Descer" onClick={() => update((d) => { if (i < d.cycle.items.length - 1) [d.cycle.items[i + 1], d.cycle.items[i]] = [d.cycle.items[i], d.cycle.items[i + 1]]; })}>
                  <ArrowDown className="size-4" />
                </IconBtn>
                <IconBtn label="Definir como próximo" onClick={() => update((d) => void (d.cycle.currentIndex = i))}>
                  <Play className="size-4" />
                </IconBtn>
                <IconBtn label="Remover" onClick={() => update((d) => void d.cycle.items.splice(i, 1))}>
                  <Trash2 className="size-4" />
                </IconBtn>
              </li>
            );
          })}
        </ol>
        <div className="mt-3 flex gap-2">
          <select
            value={addId}
            onChange={(e) => setAddId(e.target.value)}
            className="h-9 flex-1 rounded-md border border-input bg-background px-2 text-sm"
          >
            <option value="">Inserir matéria…</option>
            {state.subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <Button
            disabled={!addId}
            onClick={() => {
              update((d) => void d.cycle.items.push({ id: uid(), subjectId: addId, minutes: d.settings.defaultSessionMinutes, done: false }));
              setAddId("");
            }}
          >
            <Plus className="size-4" /> Inserir
          </Button>
        </div>
      </Panel>
      <Panel title="Como funciona">
        <p className="text-sm text-muted-foreground">
          O ciclo não depende do dia da semana. Se você não estudar hoje, ele simplesmente espera — a próxima matéria continua a mesma.
        </p>
        <div className="mt-4 flex items-center justify-between rounded-lg bg-muted/60 p-3 text-sm">
          Usar ciclo na tela Hoje
          <Switch checked={cycle.enabled} onCheckedChange={(v) => update((d) => void (d.cycle.enabled = v))} />
        </div>
      </Panel>
    </div>
  );
}

/* ---------------- Semanas modelo ---------------- */

function Templates() {
  const { state, update } = useStore();
  const [name, setName] = useState("");
  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      <Panel title="Salvar semana atual como modelo">
        <div className="flex gap-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Semana intensiva" />
          <Button
            onClick={() => {
              update((d) =>
                void d.templates.push({
                  id: uid(),
                  name: name.trim() || `Modelo ${d.templates.length + 1}`,
                  days: d.settings.days,
                  slots: d.settings.slots,
                  plan: normalizePlan(d.plan, d.settings.days, d.settings.slots),
                }),
              );
              setName("");
              toast.success("Semana modelo salva");
            }}
          >
            <Save className="size-4" />
          </Button>
        </div>
      </Panel>
      <div className="grid gap-3 md:grid-cols-2">
        {state.templates.map((t, i) => (
          <Panel key={t.id}>
            <Input
              value={t.name}
              onChange={(e) => update((d) => void (d.templates[i].name = e.target.value))}
              className="mb-3 font-display font-semibold"
              aria-label="Nome do modelo"
            />
            <ul className="mb-3 space-y-1 text-xs">
              {t.days.map((day) => (
                <li key={day} className="flex gap-2">
                  <span className="w-16 shrink-0 text-muted-foreground">{day}</span>
                  <span className="truncate">
                    {(t.plan[day] ?? [])
                      .filter(Boolean)
                      .map((it) => state.subjects.find((s) => s.id === it!.subjectId)?.name)
                      .join(" · ") || "—"}
                  </span>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={() => {
                  update((d) => {
                    d.plan = normalizePlan(JSON.parse(JSON.stringify(t.plan)), d.settings.days, d.settings.slots);
                  });
                  toast.success(`Modelo "${t.name}" aplicado à semana`);
                }}
              >
                Aplicar à semana
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  update((d) => {
                    d.templates[i].plan = normalizePlan(d.plan, d.settings.days, d.settings.slots);
                    d.templates[i].days = d.settings.days;
                  })
                }
              >
                Atualizar com semana atual
              </Button>
              <Button size="sm" variant="ghost" onClick={() => update((d) => void d.templates.push({ ...JSON.parse(JSON.stringify(t)), id: uid(), name: `${t.name} (cópia)` }))}>
                <Copy className="size-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => update((d) => void d.templates.splice(i, 1))}>
                <Trash2 className="size-4" />
              </Button>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}
