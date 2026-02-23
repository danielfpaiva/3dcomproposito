import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Loader2, ChevronRight, ChevronLeft, Package, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PartAssignmentSelect from "./PartAssignmentSelect";
import { ResendAllocationEmails } from "./ResendAllocationEmails";
import type { Tables } from "@/integrations/supabase/types";

type Initiative = Tables<"initiatives">;
type ProjectInstance = Tables<"project_instances"> & {
  initiatives: { name: string } | null;
  beneficiary_requests: { contact_name: string; region: string } | null;
};
type ProjectInstancePart = Tables<"project_instance_parts">;

interface Contributor {
  id: string;
  name: string;
  printer_models: string[];
  region?: string;
  materials?: string[];
  experience_level?: string;
  build_volume_ok?: boolean;
  build_plate_size?: string | null;
}

const statusLabels: Record<string, string> = {
  planning: "Planeamento",
  in_progress: "Em curso",
  completed: "Concluído",
  cancelled: "Cancelado",
};

const statusColors: Record<string, string> = {
  planning: "bg-muted text-muted-foreground",
  in_progress: "bg-accent/20 text-accent",
  completed: "bg-success/20 text-success",
  cancelled: "bg-destructive/20 text-destructive",
};

const partStatusLabels: Record<string, string> = {
  unassigned: "Não atribuído",
  assigned: "Atribuído",
  printing: "A imprimir",
  printed: "Impresso",
  shipped: "Enviado",
  complete: "Concluído",
};

const partStatusColors: Record<string, string> = {
  unassigned: "bg-muted text-muted-foreground",
  assigned: "bg-primary/10 text-primary",
  printing: "bg-accent/20 text-accent",
  printed: "bg-success/20 text-success",
  shipped: "bg-primary/20 text-primary",
  complete: "bg-success/30 text-success",
};

const PROJECT_STATUSES = ["planning", "in_progress", "completed", "cancelled"];

// --- Sub-component: project card with live part counts ---
type ProjectCardProject = Tables<"project_instances"> & {
  initiatives: { name: string } | null;
  beneficiary_requests: { contact_name: string; region: string } | null;
};

const ProjectCard = ({
  project,
  onSelect,
  isSelected = false,
}: {
  project: ProjectCardProject;
  onSelect: () => void;
  isSelected?: boolean;
}) => {
  const { data: partCounts } = useQuery({
    queryKey: ["project-instance-part-counts", project.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_instance_parts")
        .select("status")
        .eq("project_instance_id", project.id);
      if (error) throw error;
      const total = data.length;
      const done = data.filter((p) => ["printed", "shipped", "complete"].includes(p.status)).length;
      return { total, done };
    },
  });

  const total = partCounts?.total ?? 0;
  const done = partCounts?.done ?? 0;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left bg-card border rounded-xl p-4 transition-all ${
        isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
      }`}
    >
      <div className="flex items-center gap-2 flex-wrap mb-1">
        <span className="font-medium text-sm">{project.name}</span>
        <Badge className={`text-[10px] ${statusColors[project.status] ?? ""}`}>
          {statusLabels[project.status] ?? project.status}
        </Badge>
      </div>
      <div className="text-xs text-muted-foreground space-y-0.5">
        {project.initiatives?.name && <p>{project.initiatives.name}</p>}
        {project.beneficiary_requests?.contact_name && (
          <p>Pedido: {project.beneficiary_requests.contact_name} — {project.beneficiary_requests.region}</p>
        )}
      </div>
      {total > 0 && (
        <div className="mt-2">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
            <span>{done}/{total} peças concluídas</span>
            <span>{pct}%</span>
          </div>
          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}
    </button>
  );
};

const ProjectInstancesList = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newInitiativeId, setNewInitiativeId] = useState("");
  const [newRequestId, setNewRequestId] = useState("");
  const [creating, setCreating] = useState(false);
  const [updatingPartId, setUpdatingPartId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<ProjectInstance | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch initiatives (for dropdown)
  const { data: initiatives = [] } = useQuery({
    queryKey: ["initiatives"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("initiatives")
        .select("*")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data as Initiative[];
    },
  });

  // Fetch pending/approved requests for dropdown
  const { data: openRequests = [] } = useQuery({
    queryKey: ["open-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("beneficiary_requests")
        .select("id, contact_name, region, status")
        .in("status", ["pendente", "em_avaliacao", "aprovado"])
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch project instances
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["project-instances"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_instances")
        .select("*, initiatives(name), beneficiary_requests(contact_name, region)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ProjectInstance[];
    },
  });

  // Fetch parts for selected project
  const { data: parts = [], isLoading: loadingParts } = useQuery({
    queryKey: ["project-instance-parts", selectedId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_instance_parts")
        .select("*")
        .eq("project_instance_id", selectedId!)
        .order("created_at");
      if (error) throw error;
      return data as ProjectInstancePart[];
    },
    enabled: !!selectedId,
  });

  // Fetch contributors for assignment
  const { data: contributors = [] } = useQuery({
    queryKey: ["admin-contributors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contributors")
        .select("id, name, printer_models, region, materials, experience_level, build_volume_ok, build_plate_size")
        .order("name");
      if (error) throw error;
      return data as Contributor[];
    },
  });

  // Fetch IDs of contributors already allocated in selected project
  const { data: allocatedContributorIds = [] } = useQuery({
    queryKey: ["allocated-contributor-ids", selectedId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_instance_parts")
        .select("assigned_contributor_id")
        .eq("project_instance_id", selectedId!)
        .not("assigned_contributor_id", "is", null);
      if (error) throw error;
      // Return unique IDs
      return [...new Set(data.map((p) => p.assigned_contributor_id!))];
    },
    enabled: !!selectedId,
  });

  const selectedProject = projects.find((p) => p.id === selectedId);

  // Create project from initiative
  const handleCreate = async () => {
    if (!newProjectName.trim() || !newInitiativeId || !newRequestId) return;
    setCreating(true);

    // 1. Create project instance
    const { data: project, error: projError } = await supabase
      .from("project_instances")
      .insert({
        name: newProjectName.trim(),
        initiative_id: newInitiativeId,
        request_id: newRequestId,
        status: "planning",
      })
      .select()
      .single();

    if (projError || !project) {
      toast({ title: "Erro ao criar projeto", description: projError?.message, variant: "destructive" });
      setCreating(false);
      return;
    }

    // 2. Copy parts from initiative template
    const { data: templateParts, error: tplError } = await supabase
      .from("initiative_parts")
      .select("*")
      .eq("initiative_id", newInitiativeId)
      .order("sort_order");

    if (tplError) {
      toast({ title: "Projeto criado mas erro ao copiar peças", description: tplError.message, variant: "destructive" });
    } else if (templateParts && templateParts.length > 0) {
      const partsToInsert = templateParts.map((tp) => ({
        project_instance_id: project.id,
        initiative_part_id: tp.id,
        part_name: tp.part_name,
        category: tp.category,
        material: tp.material,
        file_url: tp.file_url,
        status: "unassigned" as const,
      }));
      const { error: partsError } = await supabase.from("project_instance_parts").insert(partsToInsert);
      if (partsError) {
        toast({ title: "Projeto criado mas erro nas peças", description: partsError.message, variant: "destructive" });
      }
    }

    // 3. Update request status to em_andamento
    const { error: reqError } = await supabase
      .from("beneficiary_requests")
      .update({ status: "em_andamento" })
      .eq("id", newRequestId);

    if (reqError) {
      console.error("Failed to update request status:", reqError);
    }

    toast({ title: "Projeto criado!", description: `${newProjectName} criado com ${templateParts?.length ?? 0} peças.` });
    queryClient.invalidateQueries({ queryKey: ["project-instances"] });
    queryClient.invalidateQueries({ queryKey: ["open-requests"] });
    queryClient.invalidateQueries({ queryKey: ["beneficiary-requests"] });
    setShowCreateDialog(false);
    setNewProjectName("");
    setNewInitiativeId("");
    setNewRequestId("");
    setCreating(false);
  };

  // Update project status
  const handleProjectStatusChange = async (projectId: string, status: string) => {
    const project = projects.find((p) => p.id === projectId);

    const { error } = await supabase
      .from("project_instances")
      .update({ status: status as "planning" | "in_progress" | "completed" | "cancelled" })
      .eq("id", projectId);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }

    // Update request status based on project status
    if (project?.request_id) {
      let requestStatus: string | null = null;

      if (status === "planning") {
        requestStatus = "aprovado"; // Back to approved when planning
      } else if (status === "in_progress") {
        requestStatus = "em_andamento";
      } else if (status === "completed") {
        requestStatus = "concluido";
      } else if (status === "cancelled") {
        requestStatus = "cancelado";
      }

      if (requestStatus) {
        const { error: reqError } = await supabase
          .from("beneficiary_requests")
          .update({ status: requestStatus })
          .eq("id", project.request_id);

        if (reqError) {
          console.error("Failed to update request status:", reqError);
        }
      }
    }

    queryClient.invalidateQueries({ queryKey: ["project-instances"] });
    queryClient.invalidateQueries({ queryKey: ["beneficiary-requests"] });
  };

  // Delete project
  const handleDeleteProject = async () => {
    if (!projectToDelete) return;

    setDeleting(true);

    // Delete all parts first (CASCADE should handle this, but being explicit)
    const { error: partsError } = await supabase
      .from("project_instance_parts")
      .delete()
      .eq("project_instance_id", projectToDelete.id);

    if (partsError) {
      toast({ title: "Erro ao apagar peças", description: partsError.message, variant: "destructive" });
      setDeleting(false);
      return;
    }

    // Delete the project
    const { error: projectError } = await supabase
      .from("project_instances")
      .delete()
      .eq("id", projectToDelete.id);

    if (projectError) {
      toast({ title: "Erro ao apagar projeto", description: projectError.message, variant: "destructive" });
      setDeleting(false);
      return;
    }

    // Update request status back to pending if it was linked
    if (projectToDelete.request_id) {
      await supabase
        .from("beneficiary_requests")
        .update({ status: "pendente" })
        .eq("id", projectToDelete.request_id);
    }

    toast({ title: "Projeto apagado!", description: `${projectToDelete.name} foi removido com sucesso.` });
    queryClient.invalidateQueries({ queryKey: ["project-instances"] });
    queryClient.invalidateQueries({ queryKey: ["beneficiary-requests"] });
    queryClient.invalidateQueries({ queryKey: ["open-requests"] });

    setDeleteDialogOpen(false);
    setProjectToDelete(null);
    setSelectedId(null);
    setDeleting(false);
  };

  // Assign contributor to part
  const handleAssignPart = async (partId: string, contributorId: string | null) => {
    setUpdatingPartId(partId);
    const { error } = await supabase
      .from("project_instance_parts")
      .update({
        assigned_contributor_id: contributorId,
        status: contributorId ? "assigned" : "unassigned",
      })
      .eq("id", partId);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      queryClient.invalidateQueries({ queryKey: ["project-instance-parts", selectedId] });
      if (contributorId) {
        // Send email notification
        const { error: emailError } = await supabase.functions.invoke("notify-part-allocated", {
          body: { contributor_id: contributorId, part_ids: [partId] },
          headers: { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        });
        if (emailError) {
          toast({ title: "Aviso", description: "Voluntário atribuído mas o email não foi enviado: " + emailError.message, variant: "destructive" });
        } else {
          toast({ title: "Voluntário atribuído", description: "Email de notificação enviado." });
        }
      }
    }
    setUpdatingPartId(null);
  };

  // Update part status
  const handlePartStatusChange = async (partId: string, status: string) => {
    setUpdatingPartId(partId);
    const { error } = await supabase
      .from("project_instance_parts")
      .update({ status: status as "unassigned" | "assigned" | "printing" | "printed" | "shipped" | "complete" })
      .eq("id", partId);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      queryClient.invalidateQueries({ queryKey: ["project-instance-parts", selectedId] });
    }
    setUpdatingPartId(null);
  };

  // --- LAYOUT: side-by-side (list + detail) ---
  return (
    <div className="space-y-6">
      {/* Create dialog button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground">Projetos</h3>
          <p className="text-sm text-muted-foreground mt-0.5">Projetos criados a partir de iniciativas</p>
        </div>
        <Button size="sm" onClick={() => setShowCreateDialog(true)} className="gap-1.5" disabled={initiatives.length === 0}>
          <Plus className="w-4 h-4" /> Novo Projeto
        </Button>
      </div>

      {initiatives.length === 0 && (
        <div className="text-sm text-muted-foreground bg-muted/30 rounded-xl p-4">
          Não existem iniciativas ativas. Cria primeiro uma iniciativa na tab <strong>Iniciativas</strong>.
        </div>
      )}

      {/* Side-by-side layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: project list (1 column) */}
        <div className="lg:col-span-1 space-y-3">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Projetos ({projects.length})</h3>
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground mx-auto" />
          ) : projects.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Sem projetos. Crie o primeiro acima!</p>
          ) : (
            projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onSelect={() => setSelectedId(project.id === selectedId ? null : project.id)}
                isSelected={project.id === selectedId}
              />
            ))
          )}
        </div>

        {/* RIGHT: project detail (2 columns) */}
        <div className="lg:col-span-2">
          {selectedProject ? (
            <div className="bg-card rounded-2xl border border-border p-6">
              <div className="flex items-center gap-3 mb-6">
                <button onClick={() => setSelectedId(null)} className="lg:hidden text-muted-foreground hover:text-foreground">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-bold text-foreground">{selectedProject.name}</h3>
                      <Select
                        value={selectedProject.status}
                        onValueChange={(v) => handleProjectStatusChange(selectedProject.id, v)}
                      >
                        <SelectTrigger className="w-36 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PROJECT_STATUSES.map((s) => (
                            <SelectItem key={s} value={s} className="text-xs">{statusLabels[s]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <ResendAllocationEmails projectId={selectedProject.id} projectName={selectedProject.name} />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setProjectToDelete(selectedProject);
                          setDeleteDialogOpen(true);
                        }}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {selectedProject.initiatives?.name} · {parts.filter((p) => p.status !== "unassigned").length}/{parts.length} peças atribuídas ·{" "}
                    {parts.filter((p) => ["printed", "shipped", "complete"].includes(p.status)).length} concluídas
                  </p>
                  {selectedProject.beneficiary_requests?.contact_name && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Pedido: {selectedProject.beneficiary_requests.contact_name} — {selectedProject.beneficiary_requests.region}
                    </p>
                  )}
                </div>
              </div>

              {loadingParts ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : parts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="w-8 h-8 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">Sem peças neste projeto.</p>
                </div>
              ) : (
                <div className="border border-border rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Peça</th>
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Material</th>
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Estado</th>
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Voluntário</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {parts.map((part) => (
                        <tr key={part.id} className="bg-card hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-medium">{part.part_name}</div>
                            {part.category && <div className="text-xs text-muted-foreground">{part.category}</div>}
                          </td>
                          <td className="px-4 py-3">
                            {part.material && <Badge variant="secondary" className="text-[10px]">{part.material}</Badge>}
                          </td>
                          <td className="px-4 py-3">
                            {updatingPartId === part.id ? (
                              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                            ) : (
                              <Select
                                value={part.status}
                                onValueChange={(v) => handlePartStatusChange(part.id, v)}
                              >
                                <SelectTrigger className="w-36 h-7 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {Object.entries(partStatusLabels).map(([value, label]) => (
                                    <SelectItem key={value} value={value} className="text-xs">{label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {updatingPartId === part.id ? (
                              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                            ) : (
                              <PartAssignmentSelect
                                value={part.assigned_contributor_id}
                                contributors={contributors}
                                onAssign={(contributorId) => handleAssignPart(part.id, contributorId)}
                                allocatedContributorIds={allocatedContributorIds}
                              />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-card rounded-2xl border border-border p-12 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Seleciona um projeto para ver as peças</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create project dialog */}
      <Dialog open={showCreateDialog} onOpenChange={(open) => { setShowCreateDialog(open); if (!open) { setNewProjectName(""); setNewInitiativeId(""); setNewRequestId(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Projeto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Pedido associado *</label>
              <Select value={newRequestId} onValueChange={setNewRequestId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleciona um pedido" />
                </SelectTrigger>
                <SelectContent>
                  {openRequests.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">Sem pedidos disponíveis</div>
                  ) : (
                    openRequests.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.contact_name} — {r.region} ({r.status})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Iniciativa *</label>
              <Select value={newInitiativeId} onValueChange={setNewInitiativeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleciona uma iniciativa" />
                </SelectTrigger>
                <SelectContent>
                  {initiatives.map((i) => (
                    <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Nome do projeto *</label>
              <Input
                placeholder="ex: Cadeira 1 Norte"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancelar</Button>
              <Button onClick={handleCreate} disabled={creating || !newProjectName.trim() || !newInitiativeId || !newRequestId}>
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Criar Projeto"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Project AlertDialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar Projeto</AlertDialogTitle>
            <AlertDialogDescription>
              Tem a certeza que pretende apagar o projeto <strong>{projectToDelete?.name}</strong>?
              <br /><br />
              Esta ação irá apagar:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>O projeto e todas as suas peças</li>
                <li>Todas as atribuições de voluntários</li>
              </ul>
              <br />
              {projectToDelete?.request_id && (
                <span className="text-amber-600">
                  ⚠️ O pedido de beneficiário associado voltará ao estado "Pendente".
                </span>
              )}
              <br /><br />
              <strong className="text-destructive">Esta ação não pode ser revertida.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProject}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Apagar Projeto
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProjectInstancesList;
