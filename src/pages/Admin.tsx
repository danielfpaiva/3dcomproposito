import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Printer, Users, Target, LogOut, Plus, Loader2,
  BarChart3, Package, Armchair, ChevronLeft,
} from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import ProjectProgressCard from "@/components/admin/ProjectProgressCard";
import ProjectPartsList from "@/components/admin/ProjectPartsList";
import AddContributorDialog from "@/components/admin/AddContributorDialog";
import ContributorsFilters from "@/components/admin/ContributorsFilters";

const Admin = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: stats } = useDashboardStats();
  const [activeTab, setActiveTab] = useState<"overview" | "contributors" | "projects">("overview");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [filterSearch, setFilterSearch] = useState("");
  const [filterRegion, setFilterRegion] = useState("all");
  const [filterPrinter, setFilterPrinter] = useState("all");
  const [filterMaterial, setFilterMaterial] = useState("all");

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [authLoading, user, navigate]);

  const { data: contributors = [], isLoading: contribLoading } = useQuery({
    queryKey: ["admin-contributors"],
    queryFn: async () => {
      const { data, error } = await supabase.from("contributors").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: projects = [], isLoading: projLoading } = useQuery({
    queryKey: ["admin-projects"],
    queryFn: async () => {
      const { data, error } = await supabase.from("wheelchair_projects").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: parts = [] } = useQuery({
    queryKey: ["admin-parts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("parts").select("*");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: templates = [] } = useQuery({
    queryKey: ["part-templates"],
    queryFn: async () => {
      const { data, error } = await supabase.from("part_templates").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const printerModels = useMemo(() => [...new Set(contributors.map((c) => c.printer_model))].sort(), [contributors]);
  const filteredContributors = useMemo(() => {
    return contributors.filter((c) => {
      if (filterSearch && !c.name.toLowerCase().includes(filterSearch.toLowerCase())) return false;
      if (filterRegion !== "all" && c.region !== filterRegion) return false;
      if (filterPrinter !== "all" && c.printer_model !== filterPrinter) return false;
      if (filterMaterial !== "all" && !(c as any).materials?.includes(filterMaterial)) return false;
      return true;
    });
  }, [contributors, filterSearch, filterRegion, filterPrinter, filterMaterial]);

  const [newProjectName, setNewProjectName] = useState("");
  const [creatingProject, setCreatingProject] = useState(false);

  const createProjectWithParts = async () => {
    if (!newProjectName.trim() || creatingProject) return;
    setCreatingProject(true);

    // Create project with target_parts = template count
    const { data: project, error: projError } = await supabase
      .from("wheelchair_projects")
      .insert({ name: newProjectName, target_parts: templates.length || 24, status: "planning" })
      .select()
      .single();

    if (projError || !project) {
      toast({ title: "Erro", description: projError?.message ?? "Erro ao criar projeto", variant: "destructive" });
      setCreatingProject(false);
      return;
    }

    // Create all TMT parts for this project
    const partsToInsert = templates.map((t) => ({
      project_id: project.id,
      part_name: t.part_name,
      category: t.category,
      material: t.material,
      status: "unassigned" as const,
    }));

    if (partsToInsert.length > 0) {
      const { error: partsError } = await supabase.from("parts").insert(partsToInsert);
      if (partsError) {
        toast({ title: "Projeto criado, mas erro nas peças", description: partsError.message, variant: "destructive" });
      }
    }

    toast({ title: "Missão Criada!", description: `${project.name} com ${partsToInsert.length} peças TMT.` });
    setNewProjectName("");
    setCreatingProject(false);
    setSelectedProjectId(project.id);
    queryClient.invalidateQueries({ queryKey: ["admin-projects"] });
    queryClient.invalidateQueries({ queryKey: ["admin-parts"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!user) return null;

  const statusLabels: Record<string, string> = {
    planning: "Planeamento", active: "Ativo", complete: "Concluído",
  };

  const statCards = [
    { label: "Voluntários", value: stats?.total_contributors ?? 0, icon: Users, color: "text-accent" },
    { label: "Projetos", value: stats?.total_projects ?? 0, icon: Armchair, color: "text-emerald-light" },
    { label: "Concluídos", value: stats?.wheelchairs_completed ?? 0, icon: Target, color: "text-success" },
    { label: "Peças Feitas", value: stats?.parts_completed ?? 0, icon: Package, color: "text-navy-light" },
  ];

  const tabs = [
    { id: "overview" as const, label: "Visão Geral", icon: BarChart3 },
    { id: "contributors" as const, label: "Voluntários", icon: Users },
    { id: "projects" as const, label: "Projetos", icon: Armchair },
  ];

  const getProjectParts = (projectId: string) => parts.filter((p) => p.project_id === projectId);
  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const selectedParts = selectedProjectId ? getProjectParts(selectedProjectId) : [];



  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 bg-navy-deep/95 backdrop-blur-md border-b border-navy-light/20">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
              <Printer className="w-4 h-4 text-accent-foreground" />
            </div>
            <span className="text-sm font-bold text-primary-foreground">Centro de Comando</span>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut} className="text-primary-foreground/60 hover:text-primary-foreground hover:bg-navy-light/30">
            <LogOut className="w-4 h-4 mr-1" /> Sair
          </Button>
        </div>
      </header>

      <div className="pt-20 pb-12 px-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-black text-foreground mb-1">Controlo de Missão</h1>
          <p className="text-muted-foreground mb-8">Bem-vindo, Comandante. Aqui está o estado das operações.</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {statCards.map((s) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl border border-border p-5">
                <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
                <p className="text-2xl font-black text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </motion.div>
            ))}
          </div>

          <div className="flex gap-1 mb-6 bg-muted/50 rounded-xl p-1 w-fit">
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => { setActiveTab(tab.id); setSelectedProjectId(null); }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}>
                <tab.icon className="w-4 h-4" /> {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-card rounded-2xl border border-border p-6">
                <h3 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wider">Voluntários Recentes</h3>
                {contribLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground mx-auto" />
                ) : contributors.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Ainda sem voluntários.</p>
                ) : (
                  <div className="space-y-2">
                    {contributors.slice(0, 5).map((c) => (
                      <div key={c.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                        <div>
                          <p className="text-sm font-medium text-foreground">{c.name}</p>
                          <p className="text-xs text-muted-foreground">{c.location} · {c.printer_model}</p>
                        </div>
                        <Badge variant="secondary" className="text-xs">{c.region}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-card rounded-2xl border border-border p-6">
                <h3 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wider">Projetos</h3>
                {projLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground mx-auto" />
                ) : projects.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Sem projetos ativos. Hora de iniciar uma nova missão!</p>
                ) : (
                  <div className="space-y-3">
                    {projects.slice(0, 5).map((p) => {
                      const pParts = getProjectParts(p.id);
                      const done = pParts.filter((pt) => pt.status === "complete").length;
                      return (
                        <div key={p.id} className="p-3 bg-muted/30 rounded-xl">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-foreground">{p.name}</span>
                            <Badge className={p.status === "complete" ? "bg-success/10 text-success" : p.status === "active" ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground"}>
                              {statusLabels[p.status] ?? p.status}
                            </Badge>
                          </div>
                          <div className="w-full bg-muted rounded-full h-1.5">
                            <div className="h-1.5 rounded-full bg-accent transition-all" style={{ width: `${pParts.length ? (done / pParts.length) * 100 : 0}%` }} />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{done}/{pParts.length} peças concluídas</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "contributors" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <ContributorsFilters
                  search={filterSearch}
                  onSearchChange={setFilterSearch}
                  region={filterRegion}
                  onRegionChange={setFilterRegion}
                  printer={filterPrinter}
                  onPrinterChange={setFilterPrinter}
                  printerModels={printerModels}
                  material={filterMaterial}
                  onMaterialChange={setFilterMaterial}
                />
                <AddContributorDialog />
              </div>
              <div className="bg-card rounded-2xl border border-border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                     <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="text-left p-4 font-semibold text-foreground">Nome</th>
                        <th className="text-left p-4 font-semibold text-foreground">Localização</th>
                        <th className="text-left p-4 font-semibold text-foreground hidden sm:table-cell">Impressora</th>
                        <th className="text-left p-4 font-semibold text-foreground hidden sm:table-cell">Materiais</th>
                        <th className="text-left p-4 font-semibold text-foreground hidden md:table-cell">Telefone</th>
                        <th className="text-left p-4 font-semibold text-foreground hidden lg:table-cell">Envia</th>
                        <th className="text-left p-4 font-semibold text-foreground">Região</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const regionOrder = ["norte", "centro", "lisboa", "alentejo", "algarve", "acores", "madeira"];
                        const regionNames: Record<string, string> = { norte: "Norte", centro: "Centro", lisboa: "Lisboa", alentejo: "Alentejo", algarve: "Algarve", acores: "Açores", madeira: "Madeira" };
                        const grouped = filteredContributors.reduce<Record<string, typeof filteredContributors>>((acc, c) => {
                          const r = c.region || "outro";
                          if (!acc[r]) acc[r] = [];
                          acc[r].push(c);
                          return acc;
                        }, {});
                        const sortedRegions = Object.keys(grouped).sort((a, b) => (regionOrder.indexOf(a) === -1 ? 99 : regionOrder.indexOf(a)) - (regionOrder.indexOf(b) === -1 ? 99 : regionOrder.indexOf(b)));
                        return sortedRegions.map((region) => (
                          <>
                            <tr key={`header-${region}`} className="bg-muted/50">
                              <td colSpan={7} className="p-3 text-xs font-bold text-foreground uppercase tracking-wider">
                                {regionNames[region] ?? region} ({grouped[region].length})
                              </td>
                            </tr>
                            {grouped[region].map((c) => (
                              <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                                <td className="p-4">
                                  <p className="font-medium text-foreground">{c.name}</p>
                                  <p className="text-xs text-muted-foreground">{c.email}</p>
                                </td>
                                <td className="p-4 text-muted-foreground">{c.location}</td>
                                <td className="p-4 text-muted-foreground hidden sm:table-cell">{c.printer_model}</td>
                                <td className="p-4 hidden sm:table-cell">
                                  <div className="flex gap-1">
                                    {((c as any).materials ?? ["PETG"]).map((m: string) => (
                                      <Badge key={m} className={m === "TPU" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" : "bg-accent/10 text-accent"}>{m}</Badge>
                                    ))}
                                  </div>
                                </td>
                                <td className="p-4 text-muted-foreground hidden md:table-cell">{(c as any).phone || "—"}</td>
                                <td className="p-4 hidden lg:table-cell">
                                  {c.can_ship ? <Badge className="bg-accent/10 text-accent">Sim</Badge> : <span className="text-muted-foreground">Não</span>}
                                </td>
                                <td className="p-4"><Badge variant="secondary">{c.region}</Badge></td>
                              </tr>
                            ))}
                          </>
                        ));
                      })()}
                    </tbody>
                  </table>
                  {filteredContributors.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      {contributors.length === 0 ? "Ainda sem voluntários. Adicione o primeiro!" : "Nenhum voluntário corresponde aos filtros."}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "projects" && (
            <div className="space-y-6">
              {/* Create new project */}
              <div className="bg-card rounded-2xl border border-border p-6">
                <h3 className="text-sm font-bold text-foreground mb-3 uppercase tracking-wider">Criar Novo Projeto TMT</h3>
                <p className="text-xs text-muted-foreground mb-4">Ao criar um projeto, as 24 peças do 3D Toddler Mobility Trainer serão automaticamente adicionadas.</p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input
                    placeholder="Nome do projeto (ex.: Cadeira Lisboa #1)"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    className="flex-1"
                    onKeyDown={(e) => e.key === "Enter" && createProjectWithParts()}
                  />
                  <Button
                    onClick={createProjectWithParts}
                    disabled={creatingProject || !newProjectName.trim()}
                    className="bg-accent text-accent-foreground hover:bg-emerald-light btn-lift font-semibold"
                  >
                    {creatingProject ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />}
                    Criar com {templates.length || 24} Peças
                  </Button>
                </div>
              </div>

              {/* Project list + detail */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-3">
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Projetos ({projects.length})</h3>
                  {projLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground mx-auto" />
                  ) : projects.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">Sem projetos. Crie o primeiro acima!</p>
                  ) : (
                    projects.map((p) => (
                      <ProjectProgressCard
                        key={p.id}
                        project={p}
                        parts={getProjectParts(p.id)}
                        onSelect={() => setSelectedProjectId(p.id === selectedProjectId ? null : p.id)}
                        isSelected={p.id === selectedProjectId}
                      />
                    ))
                  )}
                </div>

                <div className="lg:col-span-2">
                  {selectedProject ? (
                    <div className="bg-card rounded-2xl border border-border p-6">
                      <div className="flex items-center gap-3 mb-6">
                        <button onClick={() => setSelectedProjectId(null)} className="lg:hidden text-muted-foreground hover:text-foreground">
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <div>
                          <h3 className="text-lg font-bold text-foreground">{selectedProject.name}</h3>
                          <p className="text-xs text-muted-foreground">
                            {selectedParts.filter((p) => p.status === "complete").length}/{selectedParts.length} peças concluídas ·{" "}
                            {selectedParts.filter((p) => p.status === "unassigned").length} por atribuir
                          </p>
                        </div>
                      </div>
                      <ProjectPartsList parts={selectedParts} contributors={contributors} />
                    </div>
                  ) : (
                    <div className="bg-card rounded-2xl border border-border p-12 flex items-center justify-center">
                      <div className="text-center">
                        <Package className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">Selecione um projeto para gerir as peças</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;
