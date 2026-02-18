import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PartAssignmentSelect from "./PartAssignmentSelect";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Link, ExternalLink } from "lucide-react";

interface Part {
  id: string;
  part_name: string;
  status: string;
  category?: string | null;
  material?: string | null;
  file_url?: string | null;
  assigned_contributor_id: string | null;
}

interface Contributor {
  id: string;
  name: string;
  printer_models: string[];
  region?: string;
}

interface ProjectPartsListProps {
  parts: Part[];
  contributors: Contributor[];
}

const statusOptions = [
  { value: "unassigned", label: "Não atribuído" },
  { value: "assigned", label: "Atribuído" },
  { value: "printing", label: "A imprimir" },
  { value: "printed", label: "Impresso" },
  { value: "shipped", label: "Enviado" },
  { value: "complete", label: "Concluído" },
];

const statusColor: Record<string, string> = {
  unassigned: "bg-muted text-muted-foreground",
  assigned: "bg-accent/10 text-accent",
  printing: "bg-accent/20 text-accent",
  printed: "bg-success/20 text-success",
  shipped: "bg-primary/10 text-primary",
  complete: "bg-success/10 text-success",
};

const materialColor: Record<string, string> = {
  PETG: "bg-primary/10 text-primary",
  TPU: "bg-amber-100 text-amber-700",
};

const ProjectPartsList = ({ parts, contributors }: ProjectPartsListProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [editingUrlId, setEditingUrlId] = useState<string | null>(null);
  const [urlDraft, setUrlDraft] = useState<string>("");

  const grouped = {
    Estrutura: parts.filter((p) => p.category === "Estrutura"),
    "Peças Macias": parts.filter((p) => p.category === "Peças Macias"),
    Outras: parts.filter((p) => !p.category || !["Estrutura", "Peças Macias"].includes(p.category)),
  };

  const updatePart = async (partId: string, updates: Record<string, unknown>) => {
    setUpdatingId(partId);
    const { error } = await supabase.from("parts").update(updates).eq("id", partId);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      queryClient.invalidateQueries({ queryKey: ["admin-parts"] });
      const contributorId = updates.assigned_contributor_id as string | null | undefined;
      if (contributorId) {
        // Send email notification
        const { error: emailError } = await supabase.functions.invoke("notify-part-allocated", {
          body: { contributor_id: contributorId, part_ids: [partId] },
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
        });
        if (emailError) {
          console.error("notify-part-allocated error:", emailError);
          toast({
            title: "Aviso",
            description: "Voluntário atribuído mas o email não foi enviado: " + emailError.message,
            variant: "destructive",
          });
        } else {
          toast({ title: "Voluntário atribuído", description: "Email de notificação enviado ao voluntário." });
        }
      }
    }
    setUpdatingId(null);
  };

  const handleAssign = (partId: string, contributorId: string | null) => {
    const newStatus = contributorId ? "assigned" : "unassigned";
    updatePart(partId, { assigned_contributor_id: contributorId, status: newStatus });
  };

  const handleStatusChange = (partId: string, status: string) => {
    const updates: Record<string, unknown> = { status };
    if (status === "unassigned") updates.assigned_contributor_id = null;
    updatePart(partId, updates);
  };

  const startEditUrl = (part: Part) => {
    setEditingUrlId(part.id);
    setUrlDraft(part.file_url ?? "");
  };

  const handleSaveUrl = async (partId: string) => {
    await updatePart(partId, { file_url: urlDraft.trim() || null });
    setEditingUrlId(null);
    setUrlDraft("");
  };

  const renderGroup = (title: string, groupParts: Part[]) => {
    if (groupParts.length === 0) return null;
    return (
      <div key={title} className="mb-6">
        <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
          {title}
          <Badge variant="secondary" className="text-xs">{groupParts.length}</Badge>
        </h4>
        <div className="space-y-1">
          {groupParts.map((part) => (
            <div
              key={part.id}
              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl border border-border transition-colors ${
                part.status === "unassigned" ? "bg-destructive/5" : "bg-muted/20"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {updatingId === part.id && <Loader2 className="w-3 h-3 animate-spin text-accent shrink-0" />}
                <span className="text-sm font-medium text-foreground truncate">{part.part_name}</span>
                {part.material && (
                  <Badge className={`text-[10px] shrink-0 ${materialColor[part.material] ?? ""}`}>
                    {part.material}
                  </Badge>
                )}
                {editingUrlId === part.id ? (
                  <div className="flex items-center gap-1 min-w-0 flex-1">
                    <Input
                      className="h-7 text-xs flex-1"
                      placeholder="https://drive.google.com/..."
                      value={urlDraft}
                      onChange={(e) => setUrlDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveUrl(part.id);
                        if (e.key === "Escape") { setEditingUrlId(null); setUrlDraft(""); }
                      }}
                      autoFocus
                    />
                    <button
                      className="text-xs text-accent hover:underline shrink-0"
                      onClick={() => handleSaveUrl(part.id)}
                    >
                      Guardar
                    </button>
                    <button
                      className="text-xs text-muted-foreground hover:underline shrink-0"
                      onClick={() => { setEditingUrlId(null); setUrlDraft(""); }}
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    className="shrink-0 ml-1"
                    title={part.file_url ? "Editar link do ficheiro" : "Adicionar link do ficheiro"}
                    onClick={() => startEditUrl(part)}
                  >
                    {part.file_url ? (
                      <ExternalLink className="w-3.5 h-3.5 text-accent hover:text-accent/70" />
                    ) : (
                      <Link className="w-3.5 h-3.5 text-muted-foreground hover:text-accent" />
                    )}
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <PartAssignmentSelect
                  value={part.assigned_contributor_id}
                  contributors={contributors}
                  onAssign={(cId) => handleAssign(part.id, cId)}
                  disabled={updatingId === part.id}
                />
                <Select
                  value={part.status}
                  onValueChange={(v) => handleStatusChange(part.id, v)}
                  disabled={updatingId === part.id}
                >
                  <SelectTrigger className="w-[140px] h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div>
      {renderGroup("Estrutura (PETG)", grouped.Estrutura)}
      {renderGroup("Peças Macias (TPU)", grouped["Peças Macias"])}
      {grouped.Outras.length > 0 && renderGroup("Outras", grouped.Outras)}
    </div>
  );
};

export default ProjectPartsList;
