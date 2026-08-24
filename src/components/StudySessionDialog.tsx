import { useEffect, useRef, useState } from "react";
import { Pause, Play, Square } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useStore } from "@/lib/store";
import { fmtMinutes, todayISO, uid } from "@/lib/study";
import type { Subject } from "@/lib/types";

export interface SessionTarget {
  subject: Subject;
  plannedMinutes?: number;
  plannedDayId?: string | null;
  topic?: string;
}

export function StudySessionDialog({
  target,
  onClose,
}: {
  target: SessionTarget | null;
  onClose: () => void;
}) {
  const { state, update } = useStore();
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [topic, setTopic] = useState("");
  const [note, setNote] = useState("");
  const [manual, setManual] = useState("");
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!target) return;
    setSeconds(0);
    setRunning(true);
    setTopic(target.topic ?? "");
    setNote("");
    setManual("");
  }, [target]);

  useEffect(() => {
    if (running) {
      timer.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    }
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [running]);

  if (!target) return null;

  const minutes = manual.trim() ? Number(manual) || 0 : Math.max(1, Math.round(seconds / 60));
  const hh = `${Math.floor(seconds / 3600)}`.padStart(2, "0");
  const mm = `${Math.floor((seconds % 3600) / 60)}`.padStart(2, "0");
  const ss = `${seconds % 60}`.padStart(2, "0");

  const save = () => {
    const today = todayISO();
    update((d) => {
      d.sessions.unshift({
        id: uid(),
        date: today,
        subjectId: target.subject.id,
        topic: topic.trim(),
        minutes,
        note: note.trim(),
        plannedDayId: target.plannedDayId ?? null,
        concursoId: state.activeConcursoId === "all" ? null : state.activeConcursoId,
      });
      if (topic.trim()) {
        const interval = d.settings.revisionIntervals[1] ?? 7;
        const date = new Date();
        date.setDate(date.getDate() + interval);
        d.revisoes.push({
          id: uid(),
          subjectId: target.subject.id,
          topic: topic.trim(),
          date: date.toISOString().slice(0, 10),
          done: false,
        });
      }
    });
    toast.success(`Estudo salvo: ${fmtMinutes(minutes)} de ${target.subject.name}`);
    setRunning(false);
    onClose();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span
              className="size-3 rounded-full"
              style={{ backgroundColor: target.subject.color }}
            />
            {target.subject.name}
          </DialogTitle>
          <DialogDescription>
            {target.plannedMinutes
              ? `Tempo planejado: ${fmtMinutes(target.plannedMinutes)}`
              : "Sessão livre de estudo"}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border border-border bg-muted/40 p-5 text-center">
          <p className="font-display text-4xl font-semibold tabular-nums">
            {hh}:{mm}:{ss}
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <Button variant={running ? "secondary" : "default"} onClick={() => setRunning((r) => !r)}>
              {running ? <Pause className="size-4" /> : <Play className="size-4" />}
              {running ? "Pausar" : "Continuar"}
            </Button>
            <Button variant="outline" onClick={() => setRunning(false)}>
              <Square className="size-4" /> Finalizar
            </Button>
          </div>
        </div>

        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="topic">Assunto estudado</Label>
            <Input
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Ex.: Culpabilidade"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="manual">Tempo estudado (minutos)</Label>
            <Input
              id="manual"
              inputMode="numeric"
              value={manual}
              onChange={(e) => setManual(e.target.value)}
              placeholder={`${minutes}`}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="note">Observação (opcional)</Label>
            <Textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={save}>Salvar estudo — {fmtMinutes(minutes)}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
