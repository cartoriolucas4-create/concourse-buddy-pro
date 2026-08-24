import { Link, useRouterState } from "@tanstack/react-router";
import {
  BookMarked,
  CalendarDays,
  CalendarRange,
  ClipboardList,
  Gauge,
  History,
  ListChecks,
  RotateCcw,
  Settings2,
  Sun,
  Trophy,
  BellRing,
} from "lucide-react";
import type { ReactNode } from "react";
import { useStore } from "@/lib/store";
import { pendencias, revisoesForDate } from "@/lib/derive";
import { todayISO } from "@/lib/study";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const NAV = [
  { to: "/", label: "Hoje", icon: Sun },
  { to: "/dashboard", label: "Dashboard", icon: Gauge },
  { to: "/planejamento", label: "Planejamento", icon: CalendarRange },
  { to: "/materias", label: "Minhas matérias", icon: BookMarked },
  { to: "/edital", label: "Meu edital", icon: ListChecks },
  { to: "/concursos", label: "Meus concursos", icon: Trophy },
  { to: "/lembretes", label: "Lembretes", icon: BellRing },
  { to: "/pendencias", label: "Pendências", icon: ClipboardList },
  { to: "/revisoes", label: "Revisões", icon: RotateCcw },
  { to: "/historico", label: "Histórico", icon: History },
  { to: "/configurar", label: "Configurar", icon: Settings2 },
] as const;

export function AppLayout({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const { state, update, hydrated } = useStore();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const today = todayISO();
  const badges: Record<string, number> = {
    "/pendencias": hydrated ? pendencias(state).length : 0,
    "/revisoes": hydrated ? revisoesForDate(state, today).length : 0,
  };

  return (
    <div className="min-h-screen bg-background lg:flex">
      <aside className="bg-sidebar text-sidebar-foreground lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:shrink-0 lg:border-r lg:border-sidebar-border">
        <div className="flex items-center gap-2 px-4 py-4 lg:py-6">
          <div className="flex size-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <CalendarDays className="size-5" />
          </div>
          <div className="leading-tight">
            <p className="font-display text-sm font-semibold">Central de Estudos</p>
            <p className="text-[11px] text-sidebar-foreground/60">Concurseiro</p>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-2 pb-3 lg:flex-col lg:overflow-visible lg:pb-6">
          {NAV.map((n) => {
            const active = pathname === n.to;
            const badge = badges[n.to] ?? 0;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                )}
              >
                <n.icon className="size-4" />
                <span className="whitespace-nowrap">{n.label}</span>
                {badge > 0 && (
                  <span className="ml-auto rounded-full bg-sidebar-primary px-1.5 text-[10px] font-semibold text-sidebar-primary-foreground">
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
          <div className="flex flex-wrap items-center gap-3 px-4 py-3 lg:px-8">
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-lg font-semibold lg:text-xl">{title}</h1>
              {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={state.activeConcursoId}
                onValueChange={(v) =>
                  update((d) => {
                    d.activeConcursoId = v;
                  })
                }
              >
                <SelectTrigger className="w-[200px] text-xs">
                  <SelectValue placeholder="Concurso ativo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os concursos</SelectItem>
                  {state.concursos.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {actions}
            </div>
          </div>
        </header>
        <main className="px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}

export function Panel({
  title,
  right,
  className,
  children,
}: {
  title?: string;
  right?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn("panel p-4 lg:p-5", className)}>
      {(title || right) && (
        <div className="mb-3 flex items-center justify-between gap-2">
          {title && <h2 className="label-caps">{title}</h2>}
          {right}
        </div>
      )}
      {children}
    </section>
  );
}

export function Stat({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "success" | "warning" | "primary";
}) {
  const toneClass = {
    default: "text-foreground",
    success: "text-success",
    warning: "text-warning",
    primary: "text-primary",
  }[tone];
  return (
    <div className="panel p-4">
      <p className="label-caps">{label}</p>
      <p className={cn("font-display mt-1 text-2xl font-semibold", toneClass)}>{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function Bar({ percent, color }: { percent: number; color?: string }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{
          width: `${Math.min(100, Math.max(0, percent))}%`,
          backgroundColor: color ?? "var(--color-primary)",
        }}
      />
    </div>
  );
}
