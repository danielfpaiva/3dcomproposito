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
  BarChart3, Package, Armchair, ChevronLeft, Heart, Accessibility, UserPlus, Link2, Eye,
  ArrowUpDown, ChevronUp, ChevronDown,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import ProjectProgressCard from "@/components/admin/ProjectProgressCard";
import ProjectPartsList from "@/components/admin/ProjectPartsList";
import AddContributorDialog from "@/components/admin/AddContributorDialog";
import ContributorsFilters from "@/components/admin/ContributorsFilters";
import AllocateVolunteerDialog from "@/components/admin/AllocateVolunteerDialog";

const PORTAL_BASE = "https://impact-print-connect.lovable.app";

const Admin = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const copyPortalLink = async (token: string) => {
    const url = `${PORTAL_BASE}/portal?token=${encodeURIComponent(token)}`;
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copiado", description: "Pode colar no email ou mensagem ao voluntário." });
    } catch {
      toast({ title: "Erro ao copiar", variant: "destructive" });
    }
  };
  const queryClient = useQueryClient();
  const { data: stats } = useDashboardStats();
  const [activeTab, setActiveTab] = useState<"overview" | "contributors" | "projects" | "requests" | "donations">("overview");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [filterSearch, setFilterSearch] = useState("");
  const [filterRegion, setFilterRegion] = useState("all");
  const [filterPrinter, setFilterPrinter] = useState("all");
  const [filterMaterial, setFilterMaterial] = useState("all");
  const [filterExperience, setFilterExperience] = useState("all");
  const [filterBuildVolume, setFilterBuildVolume] = useState("all");
  const [filterCanShip, setFilterCanShip] = useState("all");
  const [sortKey, setSortKey] = useState<"name" | "location" | "printer" | "materials" | "experience" | "turnaround" | "can_ship" | "region">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [groupBy, setGroupBy] = useState<"none" | "region" | "experience" | "can_ship">("region");
  const [allocateDialogOpen, setAllocateDialogOpen] = useState(false);
  const [allocateContributor, setAllocateContributor] = useState<typeof contributors[0] | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [authLoading, user, navigate]);

  const { data: contributors = [], isLoading: contribLoading } = useQuery({
    queryKey: ["admin-contributors"],
    queryFn: async () => {
      // Fetch all contributors (Supabase default limit is 100; request up to 5000)
      const { data, error } = await supabase
        .from("contributors")
        .select("*")
        .order("created_at", { ascending: false })
        .range(0, 4999);
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

  const { data: beneficiaryRequests = [], isLoading: requestsLoading } = useQuery({
    queryKey: ["admin-beneficiary-requests"],
    queryFn: async () => {
      const { data, error } = await supabase.from("beneficiary_requests" as any).select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!user,
  });

  const { data: donations = [], isLoading: donationsLoading } = useQuery({
    queryKey: ["admin-donations"],
    queryFn: async () => {
      const { data, error } = await supabase.from("donations" as any).select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
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

  const printerModels = useMemo(() => [...new Set(contributors.flatMap((c) => (c as any).printer_models ?? []))].sort(), [contributors]);
  const filteredContributors = useMemo(() => {
    return contributors.filter((c) => {
      if (filterSearch && !c.name.toLowerCase().includes(filterSearch.toLowerCase())) return false;
      if (filterRegion !== "all" && c.region !== filterRegion) return false;
      if (filterPrinter !== "all" && !((c as any).printer_models ?? []).includes(filterPrinter)) return false;
      if (filterMaterial !== "all" && !(c as any).materials?.includes(filterMaterial)) return false;
      if (filterExperience !== "all" && (c as any).experience_level !== filterExperience) return false;
      if (filterBuildVolume === "ok" && !(c as any).build_volume_ok) return false;
      if (filterBuildVolume === "not_ok" && (c as any).build_volume_ok) return false;
      if (filterCanShip === "yes" && !c.can_ship) return false;
      if (filterCanShip === "no" && c.can_ship) return false;
      return true;
    });
  }, [contributors, filterSearch, filterRegion, filterPrinter, filterMaterial, filterExperience, filterBuildVolume, filterCanShip]);

  const getSortValue = (c: (typeof contributors)[0], key: typeof sortKey): string | number | boolean => {
    switch (key) {
      case "name": return c.name.toLowerCase();
      case "location": return c.location.toLowerCase();
      case "printer": return ((c as any).printer_models ?? []).join(",").toLowerCase();
      case "materials": return ((c as any).materials ?? ["PETG"]).join(",").toLowerCase();
      case "experience": {
        const o: Record<string, number> = { beginner: 0, intermediate: 1, expert: 2 };
        return o[(c as any).experience_level] ?? 1;
      }
      case "turnaround": return ((c as any).turnaround_time ?? "").toLowerCase();
      case "can_ship": return c.can_ship ? 1 : 0;
      case "region": return (c.region ?? "").toLowerCase();
      default: return "";
    }
  };

  const sortedContributors = useMemo(() => {
    const list = [...filteredContributors];
    list.sort((a, b) => {
      const va = getSortValue(a, sortKey);
      const vb = getSortValue(b, sortKey);
      const cmp = typeof va === "number" && typeof vb === "number"
        ? va - vb
        : String(va).localeCompare(String(vb), "pt");
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [filteredContributors, sortKey, sortDir]);

  const regionOrder = ["norte", "centro", "lisboa", "alentejo", "algarve", "acores", "madeira"];
  const regionNames: Record<string, string> = { norte: "Norte", centro: "Centro", lisboa: "Lisboa", alentejo: "Alentejo", algarve: "Algarve", acores: "Açores", madeira: "Madeira" };
  const experienceOrder = ["beginner", "intermediate", "expert"];
  const experienceNames: Record<string, string> = { beginner: "🔰 Iniciante", intermediate: "Intermédio", expert: "⭐ Experiente" };

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
    { id: "requests" as const, label: "Pedidos", icon: Accessibility },
    { id: "donations" as const, label: "Donativos", icon: Heart },
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
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-primary-foreground/60 hover:text-primary-foreground hover:bg-navy-light/30">
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
                          <p className="text-xs text-muted-foreground">{c.location} · {((c as any).printer_models ?? []).join(", ") || "—"}</p>
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
                  experience={filterExperience}
                  onExperienceChange={setFilterExperience}
                  buildVolume={filterBuildVolume}
                  onBuildVolumeChange={setFilterBuildVolume}
                  canShip={filterCanShip}
                  onCanShipChange={setFilterCanShip}
                />
                <AddContributorDialog />
              </div>
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <span className="text-sm text-muted-foreground">Agrupar por:</span>
                <Select value={groupBy} onValueChange={(v: "none" | "region" | "experience" | "can_ship") => setGroupBy(v)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    <SelectItem value="region">Região</SelectItem>
                    <SelectItem value="experience">Experiência</SelectItem>
                    <SelectItem value="can_ship">Envia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="bg-card rounded-2xl border border-border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        {[
                          { key: "name" as const, label: "Nome", className: "text-left" },
                          { key: "location" as const, label: "Localização", className: "text-left" },
                          { key: "printer" as const, label: "Impressora", className: "text-left hidden sm:table-cell" },
                          { key: "materials" as const, label: "Materiais", className: "text-left hidden sm:table-cell" },
                          { key: "experience" as const, label: "Experiência", className: "text-left hidden md:table-cell" },
                          { key: "turnaround" as const, label: "Turnaround", className: "text-left hidden md:table-cell" },
                          { key: "can_ship" as const, label: "Envia", className: "text-left hidden lg:table-cell" },
                          { key: "region" as const, label: "Região", className: "text-left" },
                        ].map(({ key, label, className }) => (
                          <th key={key} className={`p-4 font-semibold text-foreground ${className}`}>
                            <button
                              type="button"
                              onClick={() => {
                                setSortKey(key);
                                setSortDir((d) => (sortKey === key ? (d === "asc" ? "desc" : "asc") : "asc"));
                              }}
                              className="flex items-center gap-1 hover:text-accent transition-colors"
                            >
                              {label}
                              {sortKey === key ? (sortDir === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />) : <ArrowUpDown className="w-3.5 h-3.5 opacity-50" />}
                            </button>
                          </th>
                        ))}
                        <th className="text-right p-4 font-semibold text-foreground">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const renderRow = (c: (typeof contributors)[0]) => (
                          <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                            <td className="p-4">
                              <div className="flex items-center gap-1.5">
                                <p className="font-medium text-foreground">{c.name}</p>
                                {!(c as any).build_volume_ok && (
                                  <span title="Volume de impressão não confirmado" className="text-destructive text-xs">⚠️</span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">{c.email}</p>
                            </td>
                            <td className="p-4 text-muted-foreground">{c.location}</td>
                            <td className="p-4 text-muted-foreground hidden sm:table-cell">
                              <span>{((c as any).printer_models ?? []).join(", ") || "—"}</span>
                              {(c as any).build_plate_size && <span className="block text-xs text-muted-foreground/80 mt-0.5">{(c as any).build_plate_size} mm</span>}
                            </td>
                            <td className="p-4 hidden sm:table-cell">
                              <div className="flex gap-1">
                                {((c as any).materials ?? ["PETG"]).map((m: string) => (
                                  <Badge key={m} className={m === "TPU" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" : "bg-accent/10 text-accent"}>{m}</Badge>
                                ))}
                              </div>
                            </td>
                            <td className="p-4 hidden md:table-cell">
                              <Badge variant="secondary" className="text-xs">
                                {(c as any).experience_level === "expert" ? "⭐ Experiente" : (c as any).experience_level === "beginner" ? "🔰 Iniciante" : "Intermédio"}
                              </Badge>
                            </td>
                            <td className="p-4 text-muted-foreground text-xs hidden md:table-cell">{(c as any).turnaround_time || "—"}</td>
                            <td className="p-4 hidden lg:table-cell">
                              {c.can_ship ? <Badge className="bg-accent/10 text-accent">Sim</Badge> : <span className="text-muted-foreground">Não</span>}
                            </td>
                            <td className="p-4"><Badge variant="secondary">{c.region}</Badge></td>
                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                {(c as any).token && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    title="Copiar link do portal"
                                    onClick={() => copyPortalLink((c as any).token)}
                                  >
                                    <Link2 className="w-3.5 h-3.5" />
                                  </Button>
                                )}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 text-xs gap-1"
                                  onClick={() => {
                                    setAllocateContributor(c);
                                    setAllocateDialogOpen(true);
                                  }}
                                >
                                  <UserPlus className="w-3.5 h-3.5" />
                                  Alocar
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );

                        if (groupBy === "none") {
                          return sortedContributors.map(renderRow);
                        }

                        const grouped = sortedContributors.reduce<Record<string, typeof sortedContributors>>((acc, c) => {
                          let groupKey: string;
                          if (groupBy === "region") {
                            groupKey = c.region || "outro";
                          } else if (groupBy === "experience") {
                            groupKey = (c as any).experience_level ?? "intermediate";
                          } else {
                            groupKey = c.can_ship ? "sim" : "nao";
                          }
                          if (!acc[groupKey]) acc[groupKey] = [];
                          acc[groupKey].push(c);
                          return acc;
                        }, {});

                        const sortedGroupKeys =
                          groupBy === "region"
                            ? Object.keys(grouped).sort((a, b) => (regionOrder.indexOf(a) === -1 ? 99 : regionOrder.indexOf(a)) - (regionOrder.indexOf(b) === -1 ? 99 : regionOrder.indexOf(b)))
                            : groupBy === "experience"
                              ? Object.keys(grouped).sort((a, b) => experienceOrder.indexOf(a) - experienceOrder.indexOf(b))
                              : ["sim", "nao"].filter((k) => grouped[k]?.length);

                        return sortedGroupKeys.flatMap((groupKey) => {
                          const rows = grouped[groupKey] ?? [];
                          const headerLabel =
                            groupBy === "region"
                              ? (regionNames[groupKey] ?? groupKey)
                              : groupBy === "experience"
                                ? (experienceNames[groupKey] ?? groupKey)
                                : groupKey === "sim"
                                  ? "Sim"
                                  : "Não";
                          return [
                            <tr key={`header-${groupKey}`} className="bg-muted/50">
                              <td colSpan={9} className="p-3 text-xs font-bold text-foreground uppercase tracking-wider">
                                {headerLabel} ({rows.length})
                              </td>
                            </tr>,
                            ...rows.map(renderRow),
                          ];
                        });
                      })()}
                    </tbody>
                  </table>
                  {sortedContributors.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      {contributors.length === 0 ? "Ainda sem voluntários. Adicione o primeiro!" : "Nenhum voluntário corresponde aos filtros."}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <AllocateVolunteerDialog
            open={allocateDialogOpen}
            onOpenChange={setAllocateDialogOpen}
            contributor={allocateContributor}
            projects={projects}
            parts={parts}
          />

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
                      <ProjectPartsList parts={selectedParts} contributors={contributors as any} />
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

          {activeTab === "requests" && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Pedidos de Beneficiários ({beneficiaryRequests.length})</h3>
              {requestsLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground mx-auto" />
              ) : beneficiaryRequests.length === 0 ? (
                <div className="bg-card rounded-2xl border border-border p-12 text-center">
                  <Accessibility className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Ainda sem pedidos de ajuda.</p>
                </div>
              ) : (
                <div className="bg-card rounded-2xl border border-border overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted/30">
                          <th className="text-left p-4 font-semibold text-foreground">Nome</th>
                          <th className="text-left p-4 font-semibold text-foreground">Região</th>
                          <th className="text-left p-4 font-semibold text-foreground hidden sm:table-cell">Tipo</th>
                          <th className="text-left p-4 font-semibold text-foreground hidden sm:table-cell">Idade</th>
                          <th className="text-left p-4 font-semibold text-foreground">Estado</th>
                          <th className="text-left p-4 font-semibold text-foreground hidden md:table-cell">Data</th>
                          <th className="text-right p-4 font-semibold text-foreground w-20">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {beneficiaryRequests.map((r: any) => (
                          <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                            <td className="p-4">
                              <p className="font-medium text-foreground">{r.contact_name}</p>
                              <p className="text-xs text-muted-foreground">{r.contact_email}</p>
                            </td>
                            <td className="p-4"><Badge variant="secondary">{r.region}</Badge></td>
                            <td className="p-4 hidden sm:table-cell text-muted-foreground">{r.beneficiary_type === "ate_8" ? "Criança até 8 anos" : r.beneficiary_type === "mais_8" ? "Criança >8 anos" : r.beneficiary_type === "crianca" ? "Criança" : r.beneficiary_type === "adulto" ? "Adulto" : r.beneficiary_type}</td>
                            <td className="p-4 hidden sm:table-cell text-muted-foreground">{r.beneficiary_age}</td>
                            <td className="p-4">
                              <Badge className={
                                r.status === "aprovado" ? "bg-success/10 text-success" :
                                r.status === "em_avaliacao" ? "bg-accent/10 text-accent" :
                                r.status === "concluido" ? "bg-accent/10 text-accent" :
                                "bg-muted text-muted-foreground"
                              }>
                                {r.status === "pendente" ? "Pendente" : r.status === "em_avaliacao" ? "Em Avaliação" : r.status === "aprovado" ? "Aprovado" : r.status === "concluido" ? "Concluído" : r.status}
                              </Badge>
                            </td>
                            <td className="p-4 hidden md:table-cell text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString("pt-PT")}</td>
                            <td className="p-4 text-right">
                              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" onClick={() => setSelectedRequest(r)} title="Ver detalhes">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Detalhes do pedido</DialogTitle>
              </DialogHeader>
              {selectedRequest && (
                <div className="space-y-5 text-sm">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Contacto</p>
                    <p className="font-medium text-foreground">{selectedRequest.contact_name}</p>
                    <p className="text-muted-foreground">{selectedRequest.contact_email}</p>
                    {selectedRequest.contact_phone && <p className="text-muted-foreground">{selectedRequest.contact_phone}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Região</p>
                      <Badge variant="secondary">{selectedRequest.region}</Badge>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Estado</p>
                      <Badge className={
                        selectedRequest.status === "aprovado" ? "bg-success/10 text-success" :
                        selectedRequest.status === "em_avaliacao" ? "bg-accent/10 text-accent" :
                        selectedRequest.status === "concluido" ? "bg-accent/10 text-accent" :
                        "bg-muted text-muted-foreground"
                      }>
                        {selectedRequest.status === "pendente" ? "Pendente" : selectedRequest.status === "em_avaliacao" ? "Em Avaliação" : selectedRequest.status === "aprovado" ? "Aprovado" : selectedRequest.status === "concluido" ? "Concluído" : selectedRequest.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Tipo de beneficiário</p>
                      <p className="text-foreground">
                        {selectedRequest.beneficiary_type === "ate_8" ? "Criança até 8 anos" : selectedRequest.beneficiary_type === "mais_8" ? "Criança com mais de 8 anos" : selectedRequest.beneficiary_type === "crianca" ? "Criança" : selectedRequest.beneficiary_type === "adulto" ? "Adulto" : selectedRequest.beneficiary_type}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Idade</p>
                      <p className="text-foreground">{selectedRequest.beneficiary_age}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Descrição da necessidade</p>
                    <p className="text-foreground whitespace-pre-wrap">{selectedRequest.description}</p>
                  </div>
                  {selectedRequest.how_found_us && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Como nos encontrou</p>
                      <p className="text-foreground">{selectedRequest.how_found_us}</p>
                    </div>
                  )}
                  {selectedRequest.notes && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Notas (organizador)</p>
                      <p className="text-foreground whitespace-pre-wrap">{selectedRequest.notes}</p>
                    </div>
                  )}
                  <div className="pt-2 border-t border-border flex gap-4 text-xs text-muted-foreground">
                    <span>Criado: {new Date(selectedRequest.created_at).toLocaleString("pt-PT")}</span>
                    {selectedRequest.updated_at !== selectedRequest.created_at && (
                      <span>Atualizado: {new Date(selectedRequest.updated_at).toLocaleString("pt-PT")}</span>
                    )}
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {activeTab === "donations" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Donativos ({donations.length})</h3>
                {donations.length > 0 && (
                  <Badge className="bg-accent/10 text-accent text-sm">
                    Total: {(donations.reduce((sum: number, d: any) => sum + (d.amount_cents || 0), 0) / 100).toFixed(2)}€
                  </Badge>
                )}
              </div>
              {donationsLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground mx-auto" />
              ) : donations.length === 0 ? (
                <div className="bg-card rounded-2xl border border-border p-12 text-center">
                  <Heart className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Ainda sem donativos registados.</p>
                </div>
              ) : (
                <div className="bg-card rounded-2xl border border-border overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted/30">
                          <th className="text-left p-4 font-semibold text-foreground">Doador</th>
                          <th className="text-left p-4 font-semibold text-foreground">Valor</th>
                          <th className="text-left p-4 font-semibold text-foreground hidden sm:table-cell">Método</th>
                          <th className="text-left p-4 font-semibold text-foreground hidden md:table-cell">Mensagem</th>
                          <th className="text-left p-4 font-semibold text-foreground hidden md:table-cell">Data</th>
                        </tr>
                      </thead>
                      <tbody>
                        {donations.map((d: any) => (
                          <tr key={d.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                            <td className="p-4">
                              <p className="font-medium text-foreground">{d.donor_name || "Anónimo"}</p>
                              {d.donor_email && <p className="text-xs text-muted-foreground">{d.donor_email}</p>}
                            </td>
                            <td className="p-4 font-bold text-accent">{(d.amount_cents / 100).toFixed(2)}€</td>
                            <td className="p-4 hidden sm:table-cell">
                              <Badge variant="secondary" className="text-xs capitalize">{d.method}</Badge>
                            </td>
                            <td className="p-4 hidden md:table-cell text-xs text-muted-foreground max-w-[200px] truncate">{d.message || "—"}</td>
                            <td className="p-4 hidden md:table-cell text-xs text-muted-foreground">{new Date(d.created_at).toLocaleDateString("pt-PT")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;
