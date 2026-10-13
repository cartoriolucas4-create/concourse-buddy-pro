import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, ExternalLink, Plus, Trash2 } from "lucide-react";
import { AppLayout, Panel } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useStore } from "@/lib/store";
import { daysToExam } from "@/lib/derive";
import { uid } from "@/lib/study";
import type { Concurso, ConcursoStatus, Priority } from "@/lib/types";

export const Route = createFileRoute("/concursos")({
  head: () => ({
    meta: [
      { title: "Meus concursos — Central de Estudos" },
      { name: "description", content: "Cadastre concursos, datas de prova, inscrições e contagem regressiva." },
      { property: "og:title", content: "Meus concursos — Central de Estudos" },
      { property: "og:description", content: "Agenda de concursos com contador para a prova." },
    ],
  }),
  component: Concursos,
});

const STATUSES: ConcursoStatus[] = ["Pesquisando", "Estudando", "Inscrição aberta", "Inscrito", "Prova realizada", "Finalizado"];

function Concursos() {
  const { state, update } = useStore();
  const add = () =>
    update((d) =>
      void d.concursos.push({
        id: uid(), name: "Novo concurso", orgao: "", cargo: "", banca: "", examDate: "", inscriptionStart: "", inscriptionEnd: "",
        local: "", status: "Pesquisando", priority: "media", editalUrl: "", notes: "",
      }),
    );

  return (
    <AppLayout title="Meus concursos" actions={<Button size="sm" onClick={add}><Plus className="size-4" /> Concurso</Button>}>
      <div className="grid gap-4 xl:grid-cols-2">
        {state.concursos.map((c, i) => {
          const set = <K extends keyof Concurso>(k: K, v: Concurso[K]) => update((d) => void (d.concursos[i][k] = v));
          const left = daysToExam(c.examDate);
          const insc = daysToExam(c.inscriptionEnd);
          const subjects = state.subjects.filter((s) => s.concursoIds.includes(c.id));
          return (
            <Panel key={c.id}>
              <div className="flex items-start gap-3">
                <Input value={c.name} onChange={(e) => set("name", e.target.value)} className="font-display text-base font-semibold" />
                {left !== null && left >= 0 && (
                  <div className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-center text-primary-foreground">
                    <p className="font-display text-xl font-semibold leading-none">{left}</p>
                    <p className="text-[10px]">dias p/ prova</p>
                  </div>
                )}
              </div>
              {insc !== null && insc >= 0 && insc <= 7 && (
                <p className="mt-3 flex items-center gap-2 rounded-md bg-warning/25 px-3 py-2 text-sm text-warning-foreground">
                  <AlertTriangle className="size-4" /> Inscrições encerram em {insc} {insc === 1 ? "dia" : "dias"}.
                </p>
              )}
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                <F label="Órgão"><Input value={c.orgao} onChange={(e) => set("orgao", e.target.value)} className="h-8" /></F>
                <F label="Cargo"><Input value={c.cargo} onChange={(e) => set("cargo", e.target.value)} className="h-8" /></F>
                <F label="Banca"><Input value={c.banca} onChange={(e) => set("banca", e.target.value)} className="h-8" /></F>
                <F label="Data da prova"><Input type="date" value={c.examDate} onChange={(e) => set("examDate", e.target.value)} className="h-8" /></F>
                <F label="Inscrição — início"><Input type="date" value={c.inscriptionStart} onChange={(e) => set("inscriptionStart", e.target.value)} className="h-8" /></F>
                <F label="Inscrição — prazo"><Input type="date" value={c.inscriptionEnd} onChange={(e) => set("inscriptionEnd", e.target.value)} className="h-8" /></F>
                <F label="Local da prova"><Input value={c.local} onChange={(e) => set("local", e.target.value)} className="h-8" /></F>
                <F label="Status">
                  <select value={c.status} onChange={(e) => set("status", e.target.value as ConcursoStatus)} className="h-8 rounded-md border border-input bg-background px-1 text-sm">
                    {STATUSES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </F>
                <F label="Prioridade">
                  <select value={c.priority} onChange={(e) => set("priority", e.target.value as Priority)} className="h-8 rounded-md border border-input bg-background px-1 text-sm">
                    <option value="alta">Alta</option><option value="media">Média</option><option value="baixa">Baixa</option>
                  </select>
                </F>
              </div>
              <div className="mt-2 flex gap-2">
                <Input value={c.editalUrl} onChange={(e) => set("editalUrl", e.target.value)} placeholder="Link do edital" className="h-8" />
                {c.editalUrl && <Button asChild size="sm" variant="outline"><a href={c.editalUrl} target="_blank" rel="noreferrer"><ExternalLink className="size-4" /></a></Button>}
              </div>
              <Textarea value={c.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Observações" rows={2} className="mt-2 text-sm" />
              <div className="mt-3">
                <p className="label-caps mb-1">Matérias associadas</p>
                <div className="flex flex-wrap gap-1">
                  {state.subjects.map((s) => {
                    const on = s.concursoIds.includes(c.id);
                    return (
                      <button key={s.id}
                        onClick={() => update((d) => { const x = d.subjects.find((y) => y.id === s.id)!; x.concursoIds = on ? x.concursoIds.filter((y) => y !== c.id) : [...x.concursoIds, c.id]; })}
                        className={`rounded-full border px-2 py-0.5 text-[11px] ${on ? "border-primary bg-accent text-accent-foreground" : "border-border text-muted-foreground"}`}>
                        {s.name}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">{subjects.length} matérias neste concurso</p>
              </div>
              <div className="mt-2 flex justify-between">
                <Button size="sm" variant="outline" onClick={() => update((d) => void (d.activeConcursoId = c.id))}>Tornar ativo</Button>
                <Button size="sm" variant="ghost" onClick={() => update((d) => { d.concursos.splice(i, 1); if (d.activeConcursoId === c.id) d.activeConcursoId = "all"; })}><Trash2 className="size-4" /></Button>
              </div>
            </Panel>
          );
        })}
      </div>
    </AppLayout>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-1"><span className="label-caps">{label}</span>{children}</label>;
}
