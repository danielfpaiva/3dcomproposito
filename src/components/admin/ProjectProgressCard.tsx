import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { Database } from "@/integrations/supabase/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Package, AlertTriangle, Trash2, Loader2 } from "lucide-react";

interface Part {
  id: string;
  part_name: string;
  status: string;
  category?: string | null;
  material?: string | null;
  assigned_contributor_id?: string | null;
}

interface ProjectProgressCardProps {
  project: {
    id: string;
    name: string;
    description?: string | null;
    status: string;
  };
  parts: Part[];
  onSelect: () => void;
  isSelected: boolean;
}

type ProjectStatus = Database["public"]["Enums"]["project_status"];

const ProjectProgressCard = ({ project, parts, onSelect, isSelected }: ProjectProgressCardProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deleting, setDeleting] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const done = parts.filter((p) => p.status === "complete").length;
  const unassigned = parts.filter((p) => p.status === "unassigned").length;
  const inProgress = parts.filter((p) => ["assigned", "printing", "printed", "shipped"].includes(p.status)).length;
  const progress = parts.length ? Math.round((done / parts.length) * 100) : 0;

  const handleStatusChange = async (newStatus: ProjectStatus) => {
    setUpdatingStatus(true);
    const { error } = await supabase.from("wheelchair_projects").update({ status: newStatus }).eq("id", project.id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      queryClient.invalidateQueries({ queryKey: ["admin-projects"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    }
    setUpdatingStatus(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    // Delete parts first, then project
    await supabase.from("parts").delete().eq("project_id", project.id);
    const { error } = await supabase.from("wheelchair_projects").delete().eq("id", project.id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Projeto eliminado", description: `${project.name} foi removido.` });
      queryClient.invalidateQueries({ queryKey: ["admin-projects"] });
      queryClient.invalidateQueries({ queryKey: ["admin-parts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    }
    setDeleting(false);
  };

  return (
    <div
      onClick={onSelect}
      className={`w-full text-left bg-card rounded-2xl border-2 p-5 transition-all hover:shadow-md cursor-pointer ${
        isSelected ? "border-accent shadow-md" : "border-border"
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-base font-bold text-foreground">{project.name}</h3>
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <Select value={project.status} onValueChange={handleStatusChange} disabled={updatingStatus}>
            <SelectTrigger className="h-7 text-xs w-[120px]">
              {updatingStatus ? <Loader2 className="w-3 h-3 animate-spin" /> : <SelectValue />}
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="planning">Planeamento</SelectItem>
              <SelectItem value="active">Ativo</SelectItem>
              <SelectItem value="complete">Concluído</SelectItem>
            </SelectContent>
          </Select>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Eliminar projeto?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação irá eliminar "{project.name}" e todas as suas {parts.length} peças. Esta ação não pode ser revertida.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {project.description && (
        <p className="text-xs text-muted-foreground mb-2">{project.description}</p>
      )}

      <Progress value={progress} className="h-2 mb-2" />

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Package className="w-3 h-3" /> {done}/{parts.length} concluídas
        </span>
        {inProgress > 0 && (
          <span className="text-accent">{inProgress} em progresso</span>
        )}
        {unassigned > 0 && (
          <span className="flex items-center gap-1 text-destructive">
            <AlertTriangle className="w-3 h-3" /> {unassigned} por atribuir
          </span>
        )}
      </div>
    </div>
  );
};

export default ProjectProgressCard;
