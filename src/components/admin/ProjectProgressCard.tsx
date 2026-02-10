import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Package, AlertTriangle } from "lucide-react";

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

const statusLabels: Record<string, string> = {
  planning: "Planeamento",
  active: "Ativo",
  complete: "Concluído",
};

const ProjectProgressCard = ({ project, parts, onSelect, isSelected }: ProjectProgressCardProps) => {
  const done = parts.filter((p) => p.status === "complete").length;
  const unassigned = parts.filter((p) => p.status === "unassigned").length;
  const inProgress = parts.filter((p) => ["assigned", "printing", "printed", "shipped"].includes(p.status)).length;
  const progress = parts.length ? Math.round((done / parts.length) * 100) : 0;

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left bg-card rounded-2xl border-2 p-5 transition-all hover:shadow-md ${
        isSelected ? "border-accent shadow-md" : "border-border"
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-base font-bold text-foreground">{project.name}</h3>
          {project.description && (
            <p className="text-xs text-muted-foreground mt-0.5">{project.description}</p>
          )}
        </div>
        <Badge
          className={
            project.status === "complete"
              ? "bg-success/10 text-success"
              : project.status === "active"
              ? "bg-accent/10 text-accent"
              : "bg-muted text-muted-foreground"
          }
        >
          {statusLabels[project.status] ?? project.status}
        </Badge>
      </div>

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
    </button>
  );
};

export default ProjectProgressCard;
