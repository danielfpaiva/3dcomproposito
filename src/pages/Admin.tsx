import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Printer, Users, Target, TrendingUp, LogOut, Plus, Loader2,
  BarChart3, Package, Armchair, ChevronDown,
} from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type Contributor = Tables<"contributors">;
type WheelchairProject = Tables<"wheelchair_projects">;
type Part = Tables<"parts">;

const Admin = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: stats } = useDashboardStats();
  const [activeTab, setActiveTab] = useState<"overview" | "contributors" | "projects">("overview");

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [authLoading, user, navigate]);

  // Fetch contributors
  const { data: contributors = [], isLoading: contribLoading } = useQuery({
    queryKey: ["admin-contributors"],
    queryFn: async () => {
      const { data, error } = await supabase.from("contributors").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Contributor[];
    },
    enabled: !!user,
  });

  // Fetch projects with parts count
  const { data: projects = [], isLoading: projLoading } = useQuery({
    queryKey: ["admin-projects"],
    queryFn: async () => {
      const { data, error } = await supabase.from("wheelchair_projects").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as WheelchairProject[];
    },
    enabled: !!user,
  });

  const { data: parts = [] } = useQuery({
    queryKey: ["admin-parts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("parts").select("*");
      if (error) throw error;
      return data as Part[];
    },
    enabled: !!user,
  });

  // Create project
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectParts, setNewProjectParts] = useState("");
  const createProject = async () => {
    if (!newProjectName.trim()) return;
    const { error } = await supabase.from("wheelchair_projects").insert({
      name: newProjectName,
      target_parts: parseInt(newProjectParts) || 0,
      status: "planning",
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Project created!" });
      setNewProjectName("");
      setNewProjectParts("");
      queryClient.invalidateQueries({ queryKey: ["admin-projects"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!user) return null;

  const statCards = [
    { label: "Contributors", value: stats?.total_contributors ?? 0, icon: Users, color: "text-accent" },
    { label: "Projects", value: stats?.total_projects ?? 0, icon: Armchair, color: "text-emerald-light" },
    { label: "Completed", value: stats?.wheelchairs_completed ?? 0, icon: Target, color: "text-success" },
    { label: "Parts Done", value: stats?.parts_completed ?? 0, icon: Package, color: "text-navy-light" },
  ];

  const tabs = [
    { id: "overview" as const, label: "Overview", icon: BarChart3 },
    { id: "contributors" as const, label: "Contributors", icon: Users },
    { id: "projects" as const, label: "Projects", icon: Armchair },
  ];

  const getProjectParts = (projectId: string) => parts.filter((p) => p.project_id === projectId);

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-navy-deep/95 backdrop-blur-md border-b border-navy-light/20">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
              <Printer className="w-4 h-4 text-accent-foreground" />
            </div>
            <span className="text-sm font-bold text-primary-foreground">Command Center</span>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut} className="text-primary-foreground/60 hover:text-primary-foreground hover:bg-navy-light/30">
            <LogOut className="w-4 h-4 mr-1" /> Sign Out
          </Button>
        </div>
      </header>

      <div className="pt-20 pb-12 px-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-black text-foreground mb-1">Mission Control</h1>
          <p className="text-muted-foreground mb-8">Welcome, Commander. Here's the status of operations.</p>

          {/* Stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {statCards.map((s) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-xl border border-border p-5"
              >
                <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
                <p className="text-2xl font-black text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-6 bg-muted/50 rounded-xl p-1 w-fit">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Overview tab */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent contributors */}
              <div className="bg-card rounded-2xl border border-border p-6">
                <h3 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wider">Recent Contributors</h3>
                {contribLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground mx-auto" />
                ) : contributors.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No contributors yet.</p>
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

              {/* Projects overview */}
              <div className="bg-card rounded-2xl border border-border p-6">
                <h3 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wider">Projects</h3>
                {projLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground mx-auto" />
                ) : projects.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No active projects. Time to ignite a new mission!</p>
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
                              {p.status}
                            </Badge>
                          </div>
                          <div className="w-full bg-muted rounded-full h-1.5">
                            <div
                              className="h-1.5 rounded-full bg-accent transition-all"
                              style={{ width: `${pParts.length ? (done / pParts.length) * 100 : 0}%` }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{done}/{pParts.length} parts complete</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Contributors tab */}
          {activeTab === "contributors" && (
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left p-4 font-semibold text-foreground">Name</th>
                      <th className="text-left p-4 font-semibold text-foreground">Location</th>
                      <th className="text-left p-4 font-semibold text-foreground hidden sm:table-cell">Printer</th>
                      <th className="text-left p-4 font-semibold text-foreground hidden md:table-cell">Availability</th>
                      <th className="text-left p-4 font-semibold text-foreground hidden lg:table-cell">Ships</th>
                      <th className="text-left p-4 font-semibold text-foreground">Region</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contributors.map((c) => (
                      <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="p-4">
                          <p className="font-medium text-foreground">{c.name}</p>
                          <p className="text-xs text-muted-foreground">{c.email}</p>
                        </td>
                        <td className="p-4 text-muted-foreground">{c.location}</td>
                        <td className="p-4 text-muted-foreground hidden sm:table-cell">{c.printer_model}</td>
                        <td className="p-4 text-muted-foreground hidden md:table-cell">{c.availability}</td>
                        <td className="p-4 hidden lg:table-cell">
                          {c.can_ship ? <Badge className="bg-accent/10 text-accent">Yes</Badge> : <span className="text-muted-foreground">No</span>}
                        </td>
                        <td className="p-4"><Badge variant="secondary">{c.region}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {contributors.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No contributors in this region yet. Be the first to ignite the impact!</p>
                )}
              </div>
            </div>
          )}

          {/* Projects tab */}
          {activeTab === "projects" && (
            <div className="space-y-6">
              {/* Create project */}
              <div className="bg-card rounded-2xl border border-border p-6">
                <h3 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wider">Create New Project</h3>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input
                    placeholder="Project name (e.g. Wheelchair Model A)"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    placeholder="Target parts"
                    type="number"
                    value={newProjectParts}
                    onChange={(e) => setNewProjectParts(e.target.value)}
                    className="w-32"
                  />
                  <Button onClick={createProject} className="bg-accent text-accent-foreground hover:bg-emerald-light btn-lift font-semibold">
                    <Plus className="w-4 h-4 mr-1" /> Create
                  </Button>
                </div>
              </div>

              {/* Project list */}
              {projects.map((project) => {
                const pParts = getProjectParts(project.id);
                const done = pParts.filter((pt) => pt.status === "complete").length;
                return (
                  <div key={project.id} className="bg-card rounded-2xl border border-border p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-foreground">{project.name}</h3>
                        {project.description && <p className="text-sm text-muted-foreground">{project.description}</p>}
                      </div>
                      <Badge className={project.status === "complete" ? "bg-success/10 text-success" : project.status === "active" ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground"}>
                        {project.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mb-3 text-sm text-muted-foreground">
                      <span>Target: {project.target_parts} parts</span>
                      <span>Tracked: {pParts.length} parts</span>
                      <span>Complete: {done}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-accent to-emerald-light transition-all"
                        style={{ width: `${pParts.length ? (done / pParts.length) * 100 : 0}%` }}
                      />
                    </div>
                    {pParts.length > 0 && (
                      <div className="mt-4 space-y-1">
                        {pParts.map((part) => (
                          <div key={part.id} className="flex items-center justify-between text-sm py-1.5 border-b border-border last:border-0">
                            <span className="text-foreground">{part.part_name}</span>
                            <Badge className={
                              part.status === "complete" ? "bg-success/10 text-success" :
                              part.status === "printed" ? "bg-success/20 text-success" :
                              part.status === "assigned" || part.status === "printing" ? "bg-accent/10 text-accent" :
                              "bg-muted text-muted-foreground"
                            }>{part.status}</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;
