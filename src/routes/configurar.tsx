import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppLayout, Panel } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useStore } from "@/lib/store";
import { daysForMode, normalizePlan, todayISO } from "@/lib/study";
import type { DayMode } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/configurar")({
  head: () => ({
    meta: [
      { title: "Configurar minha central — Central de Estudos" },
      { name: "description", content: "Defina estrutura dos dias, matérias por dia, metas, revisões, dashboard e aparência." },
      { property: "og:title", content: "Configurar minha central" },
      { property: "og:description", content: "Personalize a forma como você organiza seus estudos." },
    ],
  }),
  component: Configurar,
});

const MODES: { v: DayMode; label: string; hint: string }[] = [
  { v: "mon-sun", label: "Segunda a domingo", hint: "Semana tradicional" },
  { v: "sun-sat", label: "Domingo a sábado", hint: "Começa no domingo" },
  { v: "mon-fri", label: "Segunda a sexta", hint: "Fins de semana livres" },
  { v: "cycle7", label: "Dia 1 a Dia 7", hint: "Ciclo independente do calendário" },
  { v: "custom", label: "Personalizada", hint: "Você define os dias" },
];

const CARD_LABELS: Record<string, string> = {
  hoje: "Hoje", semana: "Semana", aderencia: "Aderência", edital: "Edital",
  pendencias: "Pendências", revisoes: "Revisões", concursos: "Concursos", lembretes: "Lembretes",
};

function Configurar() {
  const { state, update, reset } = useStore();
  const s = state.settings;
  const navigate = useNavigate();
  const [customDays, setCustomDays] = useState(s.dayMode === "custom" ? s.days.join(", ") : "Dia A, Dia B, Dia C, Dia D");
  const set = (fn: (x: typeof s) => void) => update((d) => fn(d.settings));

  const applyMode = (mode: DayMode, custom?: string[]) =>
    update((d) => {
      const days = daysForMode(mode, custom);
      // preserva matérias quando o nome do dia coincide; caso contrário, mapeia pela posição
      const oldDays = d.settings.days;
      const plan: typeof d.plan = {};
      days.forEach((day, i) => (plan[day] = d.plan[day] ?? d.plan[oldDays[i]] ?? []));
      d.settings.dayMode = mode;
      d.settings.days = days;
      d.settings.cycleAnchor = todayISO();
      d.plan = normalizePlan(plan, days, d.settings.slots);
    });

  return (
    <AppLayout title="Configurar minha central" subtitle="Tudo pode ser mudado depois — a central se adapta a você.">
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="1. Estrutura dos dias" className="lg:col-span-2">
          <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {MODES.map((m) => (
              <button key={m.v} onClick={() => applyMode(m.v, m.v === "custom" ? customDays.split(",").map((x) => x.trim()).filter(Boolean) : undefined)}
                className={cn("rounded-lg border p-3 text-left transition-colors", s.dayMode === m.v ? "border-primary bg-accent" : "border-border hover:bg-muted")}>
                <p className="text-sm font-medium">{m.label}</p>
                <p className="text-[11px] text-muted-foreground">{m.hint}</p>
              </button>
            ))}
          </div>
          {s.dayMode === "custom" && (
            <div className="mt-3 flex gap-2">
              <Input value={customDays} onChange={(e) => setCustomDays(e.target.value)} placeholder="Nomes separados por vírgula" />
              <Button onClick={() => applyMode("custom", customDays.split(",").map((x) => x.trim()).filter(Boolean))}>Aplicar</Button>
            </div>
          )}
          <div className="mt-3 flex flex-wrap gap-1">
            {s.days.map((d) => <span key={d} className="rounded-md bg-muted px-2 py-1 text-xs">{d}</span>)}
          </div>
        </Panel>

        <Panel title="2. Matérias por dia">
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <Button key={n} variant={s.slots === n ? "default" : "outline"} size="sm"
                onClick={() => update((d) => { d.settings.slots = n; d.plan = normalizePlan(d.plan, d.settings.days, n); })}>
                {n}
              </Button>
            ))}
            <Input type="number" min={1} max={12} value={s.slots} className="h-8 w-20"
              onChange={(e) => { const n = Math.max(1, Math.min(12, Number(e.target.value) || 1)); update((d) => { d.settings.slots = n; d.plan = normalizePlan(d.plan, d.settings.days, n); }); }} aria-label="Quantidade personalizada" />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Os espaços não são obrigatórios — pode deixar vazios.</p>
        </Panel>

        <Panel title="3. Metas e sessões">
          <div className="grid grid-cols-2 gap-3">
            <Num label="Meta diária (h)" value={s.dailyGoalHours} onChange={(v) => set((x) => void (x.dailyGoalHours = v))} />
            <Num label="Meta semanal (h)" value={s.weeklyGoalHours} onChange={(v) => set((x) => void (x.weeklyGoalHours = v))} />
            <Num label="Meta mensal (h)" value={s.monthlyGoalHours} onChange={(v) => set((x) => void (x.monthlyGoalHours = v))} />
            <Num label="Sessão padrão (min)" value={s.defaultSessionMinutes} onChange={(v) => set((x) => void (x.defaultSessionMinutes = v))} />
          </div>
        </Panel>

        <Panel title="4. Revisões e lembretes">
          <label className="grid gap-1 text-sm">
            <span className="label-caps">Intervalos padrão (dias)</span>
            <Input defaultValue={s.revisionIntervals.join(", ")} onBlur={(e) => set((x) => void (x.revisionIntervals = e.target.value.split(",").map((n) => Number(n.trim())).filter((n) => n > 0)))} />
          </label>
          <div className="mt-3 flex items-center justify-between text-sm">
            Ativar lembretes
            <Switch checked={s.remindersEnabled} onCheckedChange={(v) => set((x) => void (x.remindersEnabled = v))} />
          </div>
          <div className="mt-3 flex items-center justify-between text-sm">
            Usar ciclo de estudos em vez da semana
            <Switch checked={state.cycle.enabled} onCheckedChange={(v) => update((d) => void (d.cycle.enabled = v))} />
          </div>
        </Panel>

        <Panel title="5. Dashboard e aparência">
          <p className="label-caps mb-2">Cards visíveis</p>
          <div className="grid grid-cols-2 gap-2">
            {Object.keys(CARD_LABELS).map((k) => (
              <label key={k} className="flex items-center justify-between rounded-md bg-muted/60 px-3 py-1.5 text-sm">
                {CARD_LABELS[k]}
                <Switch checked={s.dashboardCards[k] ?? true} onCheckedChange={(v) => set((x) => void (x.dashboardCards[k] = v))} />
              </label>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <Button size="sm" variant={s.theme === "light" ? "default" : "outline"} onClick={() => set((x) => void (x.theme = "light"))}>Tema claro</Button>
            <Button size="sm" variant={s.theme === "dark" ? "default" : "outline"} onClick={() => set((x) => void (x.theme = "dark"))}>Tema escuro</Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">As cores das matérias são definidas em Minhas matérias.</p>
        </Panel>
      </div>

      <div className="mt-6 flex flex-wrap justify-between gap-2">
        <Button variant="ghost" onClick={() => { if (confirm("Apagar todos os dados e restaurar o exemplo?")) reset(); }}>Restaurar dados de exemplo</Button>
        <Button onClick={() => { set((x) => void (x.configured = true)); toast.success("Central configurada"); navigate({ to: "/planejamento" }); }}>
          Salvar e ir para o planejamento
        </Button>
      </div>
    </AppLayout>
  );
}

function Num({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="grid gap-1">
      <span className="label-caps">{label}</span>
      <Input type="number" min={0} value={value} onChange={(e) => onChange(Number(e.target.value) || 0)} />
    </label>
  );
}
