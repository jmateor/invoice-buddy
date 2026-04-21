import { useState, ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

interface GuiaUsoProps {
  titulo: string;
  pasos: { titulo: string; descripcion: string }[];
  tip?: ReactNode;
  storageKey?: string;
  defaultOpen?: boolean;
}

export default function GuiaUso({ titulo, pasos, tip, storageKey, defaultOpen = false }: GuiaUsoProps) {
  const [open, setOpen] = useState(() => {
    if (!storageKey) return defaultOpen;
    const v = typeof window !== "undefined" ? localStorage.getItem(`guia:${storageKey}`) : null;
    return v === null ? defaultOpen : v === "1";
  });

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (storageKey) localStorage.setItem(`guia:${storageKey}`, next ? "1" : "0");
  };

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="p-3">
        <button
          onClick={toggle}
          className="w-full flex items-center justify-between gap-2 text-left"
        >
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-primary shrink-0" />
            <span className="font-medium text-sm">{titulo}</span>
          </div>
          {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>
        <div className={cn("grid transition-all", open ? "grid-rows-[1fr] mt-3" : "grid-rows-[0fr]")}>
          <div className="overflow-hidden">
            <ol className="space-y-2 text-sm">
              {pasos.map((p, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                    {i + 1}
                  </span>
                  <div>
                    <div className="font-medium text-foreground">{p.titulo}</div>
                    <div className="text-muted-foreground text-xs">{p.descripcion}</div>
                  </div>
                </li>
              ))}
            </ol>
            {tip && (
              <div className="mt-3 text-xs text-muted-foreground border-t border-primary/10 pt-2">
                💡 {tip}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
