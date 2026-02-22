import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Printer, MapPin, Calendar, Package, Mail, Pencil, X, Check, Loader2, AlertCircle, Star, Clock, Lock, Download, User, ChevronDown, ChevronUp } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";
import { BUILD_PLATE_OPTIONS } from "@/lib/printerBuildPlates";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Contributor = Tables<"contributors">;

const statusLabels: Record<string, string> = {
  unassigned: "Não atribuído",
  assigned: "Atribuído",
  printing: "A imprimir",
  printed: "Impresso",
  shipped: "Enviado",
  complete: "Concluído",
};

const Portal = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [contributor, setContributor] = useState<Contributor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editBuildPlatePreset, setEditBuildPlatePreset] = useState("");
  const [editBuildPlateCustom, setEditBuildPlateCustom] = useState("");
  const [saving, setSaving] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [recovering, setRecovering] = useState(false);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);
  const [authStep, setAuthStep] = useState<"email" | "set-password" | "login">("email");
  const [password, setPassword] = useState("");
  const [contributorName, setContributorName] = useState("");
  const { toast } = useToast();
  const [assignedParts, setAssignedParts] = useState<any[]>([]);
  const [updatingPartId, setUpdatingPartId] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Nenhum token de acesso fornecido. Verifique o link no seu email.");
      setLoading(false);
      return;
    }

    const fetchContributor = async () => {
      const { data, error: err } = await supabase
        .from("contributors").select("*").eq("token", token).maybeSingle();

      if (err || !data) {
        setError("Link inválido ou expirado. Verifique o seu email para o link correto.");
        setLoading(false);
        return;
      }

      setContributor(data);

      // Save volunteer name to localStorage for Navbar
      localStorage.setItem("volunteer_name", data.name);

      // Fetch assigned parts from new system (project_instance_parts)
      const { data: partsData, error: partsError } = await supabase
        .from("project_instance_parts")
        .select("*, project_instances(name, initiative_id, initiatives(name))")
        .eq("assigned_contributor_id", data.id);

      if (partsError) {
        console.error("Error fetching parts:", partsError);
      }

      setAssignedParts(partsData ?? []);
      setLoading(false);
    };

    fetchContributor();
  }, [token]);

  const startEdit = (field: string, currentValue: string) => {
    setEditingField(field);
    setEditValue(currentValue);
    if (field === "build_plate_size") {
      const preset = BUILD_PLATE_OPTIONS.find((o) => o.value && o.value !== "outro" && currentValue === o.value);
      if (preset) {
        setEditBuildPlatePreset(preset.value);
        setEditBuildPlateCustom("");
      } else {
        setEditBuildPlatePreset(currentValue ? "outro" : "");
        setEditBuildPlateCustom(currentValue && currentValue !== "—" ? currentValue : "");
      }
    }
  };

  const saveEdit = async () => {
    if (!contributor || !editingField) return;
    setSaving(true);
    const valueToSave =
      editingField === "build_plate_size"
        ? editBuildPlatePreset === "outro"
          ? editBuildPlateCustom.trim() || null
          : editBuildPlatePreset || null
        : editValue;
    const payload = editingField === "build_plate_size" ? { build_plate_size: valueToSave } : { [editingField]: editValue };
    const { error: err } = await supabase
      .from("contributors")
      .update(payload)
      .eq("id", contributor.id)
      .eq("token", token!);
    if (err) {
      toast({ title: "Falha na atualização", description: err.message, variant: "destructive" });
    } else {
      setContributor({ ...contributor, ...payload });
      toast({ title: "Dados Atualizados!", description: "Obrigado por manter o seu perfil de missão atualizado." });
    }
    setEditingField(null);
    setSaving(false);
  };

  const updatePartStatus = async (partId: string, newStatus: string) => {
    if (!contributor) return;
    setUpdatingPartId(partId);
    const { error: err } = await supabase
      .from("project_instance_parts")
      .update({ status: newStatus })
      .eq("id", partId)
      .eq("assigned_contributor_id", contributor.id);
    if (err) {
      toast({ title: "Erro ao atualizar estado", description: err.message, variant: "destructive" });
    } else {
      setAssignedParts((prev) =>
        prev.map((p) => (p.id === partId ? { ...p, status: newStatus } : p))
      );
      toast({ title: "Estado atualizado!", description: statusLabels[newStatus] });
    }
    setUpdatingPartId(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  const handleEmailCheck = async () => {
    if (!recoveryEmail.includes("@")) return;
    setRecovering(true);
    setRecoveryError(null);
    try {
      const res = await supabase.functions.invoke("contributor-auth", {
        body: { email: recoveryEmail.trim(), action: "check" },
      });
      const data = res.data;
      if (!data?.ok || !data?.exists) {
        setRecoveryError(data?.error || "Não encontrámos nenhum voluntário com esse email. Verifique ou inscreva-se.");
      } else {
        setContributorName(data.name || "");
        setAuthStep(data.has_password ? "login" : "set-password");
      }
    } catch {
      setRecoveryError("Erro de ligação. Tente novamente.");
    }
    setRecovering(false);
  };

  const handlePasswordSubmit = async () => {
    if (!password) return;
    setRecovering(true);
    setRecoveryError(null);
    const action = authStep === "set-password" ? "set-password" : "login";
    try {
      const res = await supabase.functions.invoke("contributor-auth", {
        body: { email: recoveryEmail.trim(), password, action },
      });
      const data = res.data;
      if (data?.ok && data?.token) {
        window.location.href = `/portal?token=${data.token}`;
      } else {
        setRecoveryError(data?.error || res.error?.message || "Erro ao autenticar.");
      }
    } catch {
      setRecoveryError("Erro de ligação. Tente novamente.");
    }
    setRecovering(false);
  };

  if (error || !contributor) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 pb-20 px-6 flex items-center justify-center min-h-[70vh]">
          <div className="text-center max-w-md">
            {authStep === "email" ? (
              <>
                <Mail className="w-12 h-12 text-accent mx-auto mb-4" />
                <h1 className="text-2xl font-black text-foreground mb-2">Aceder ao Meu Portal</h1>
                <p className="text-muted-foreground mb-6">Introduza o email com que se inscreveu.</p>
                <div className="space-y-3 text-left">
                  <Input
                    type="email"
                    placeholder="o.seu.email@exemplo.com"
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleEmailCheck()}
                    className="text-base py-5"
                    autoFocus
                  />
                  {recoveryError && (
                    <p className="text-sm text-destructive flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4" /> {recoveryError}
                    </p>
                  )}
                  <Button onClick={handleEmailCheck} disabled={recovering || !recoveryEmail.includes("@")} className="w-full bg-accent text-accent-foreground hover:bg-emerald-light btn-lift font-semibold">
                    {recovering ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                    Continuar
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Lock className="w-12 h-12 text-accent mx-auto mb-4" />
                <h1 className="text-2xl font-black text-foreground mb-2">
                  {authStep === "set-password" ? `Olá, ${contributorName}!` : `Bem-vindo/a, ${contributorName}!`}
                </h1>
                <p className="text-muted-foreground mb-6">
                  {authStep === "set-password"
                    ? "Defina uma password para aceder ao portal mais facilmente no futuro."
                    : "Introduza a sua password para aceder ao portal."}
                </p>
                <div className="space-y-3 text-left">
                  <Input
                    type="password"
                    placeholder={authStep === "set-password" ? "Escolha uma password" : "A sua password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handlePasswordSubmit()}
                    className="text-base py-5"
                    autoFocus
                    minLength={4}
                  />
                  {recoveryError && (
                    <p className="text-sm text-destructive flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4" /> {recoveryError}
                    </p>
                  )}
                  <Button onClick={handlePasswordSubmit} disabled={recovering || password.length < 4} className="w-full bg-accent text-accent-foreground hover:bg-emerald-light btn-lift font-semibold">
                    {recovering ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                    {authStep === "set-password" ? "Definir Password e Entrar" : "Entrar"}
                  </Button>
                  <button
                    onClick={() => { setAuthStep("email"); setPassword(""); setRecoveryError(null); }}
                    className="text-xs text-muted-foreground hover:text-accent transition-colors w-full text-center mt-2"
                  >
                    ← Voltar ao email
                  </button>
                </div>
              </>
            )}
            <p className="text-xs text-muted-foreground mt-6">
              Ainda não se inscreveu?{" "}
              <Link to="/contribute" className="text-accent hover:underline font-medium">Juntar-me à Missão</Link>
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const experienceLabels: Record<string, string> = {
    beginner: "🔰 Iniciante",
    intermediate: "Intermédio",
    expert: "⭐ Experiente",
  };

  const fields = [
    { key: "name", label: "Nome", icon: Mail, value: contributor.name },
    { key: "location", label: "Localização", icon: MapPin, value: contributor.location },
    { key: "printer_models", label: "Impressora(s)", icon: Printer, value: ((contributor as any).printer_models ?? []).join(", ") || "—", editable: false },
    { key: "build_plate_size", label: "Build plate (mm)", icon: Printer, value: (contributor as any).build_plate_size || "—", editable: true },
    { key: "experience_level", label: "Experiência", icon: Star, value: experienceLabels[(contributor as any).experience_level] || "Intermédio", editable: false },
    { key: "availability", label: "Disponibilidade", icon: Calendar, value: contributor.availability },
    { key: "turnaround_time", label: "Tempo de entrega", icon: Clock, value: (contributor as any).turnaround_time || "Não definido" },
    { key: "shipping_carrier", label: "Envio", icon: Package, value: contributor.can_ship ? (contributor.shipping_carrier || "Qualquer transportadora") : "Não envia" },
  ];

  const statusColor: Record<string, string> = {
    unassigned: "bg-muted text-muted-foreground",
    assigned: "bg-accent/10 text-accent",
    printing: "bg-accent/20 text-accent",
    printed: "bg-success/20 text-success",
    shipped: "bg-primary/10 text-primary",
    complete: "bg-success/10 text-success",
  };

  // Separate active and completed parts
  const activeParts = assignedParts.filter(part =>
    ["assigned", "printing", "printed", "shipped"].includes(part.status)
  );
  const completedParts = assignedParts.filter(part => part.status === "complete");

  // Group active parts by project
  const partsByProject: Record<string, any[]> = {};
  activeParts.forEach(part => {
    const projectName = part.project_instances?.name || "Sem projeto";
    if (!partsByProject[projectName]) {
      partsByProject[projectName] = [];
    }
    partsByProject[projectName].push(part);
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-28 pb-20 px-6">
        <div className="max-w-2xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <div className="mb-8">
              <h1 className="text-3xl font-black text-foreground mb-1">Bem-vindo/a de volta, {contributor.name}!</h1>
              <p className="text-muted-foreground">O seu perfil de missão e atribuições</p>
            </div>

            <Tabs defaultValue="dados" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="dados" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Dados Pessoais
                </TabsTrigger>
                <TabsTrigger value="atribuicoes" className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Atribuições
                </TabsTrigger>
              </TabsList>

              <TabsContent value="dados">
                <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
                  <div className="flex gap-2 mb-4 flex-wrap">
                    {(contributor as any).build_plate_size && (
                      <Badge variant="secondary" className="text-xs">Build plate: {(contributor as any).build_plate_size}</Badge>
                    )}
                    {(contributor as any).build_volume_ok ? (
                      <Badge className="bg-accent/10 text-accent">✓ Volume ≥ 256mm</Badge>
                    ) : (
                      <Badge className="bg-destructive/10 text-destructive">⚠ Volume não confirmado</Badge>
                    )}
                    {(contributor as any).willing_to_collaborate && (
                      <Badge className="bg-accent/10 text-accent">🤝 Disponível para colaborar</Badge>
                    )}
                  </div>
                  <div className="space-y-3">
                    {fields.map((field) => (
                      <div key={field.key} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                        <div className="flex items-center gap-3">
                          <field.icon className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">{field.label}</p>
                            {editingField === field.key ? (
                              field.key === "build_plate_size" ? (
                                <div className="mt-1 space-y-2">
                                  <Select value={editBuildPlatePreset || "_"} onValueChange={(v) => setEditBuildPlatePreset(v === "_" ? "" : v)}>
                                    <SelectTrigger className="h-8 text-sm w-48"><SelectValue placeholder="Tamanho" /></SelectTrigger>
                                    <SelectContent>
                                      {BUILD_PLATE_OPTIONS.map((o) => (
                                        <SelectItem key={o.value || "_"} value={o.value || "_"}>{o.label}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  {editBuildPlatePreset === "outro" && (
                                    <Input value={editBuildPlateCustom} onChange={(e) => setEditBuildPlateCustom(e.target.value)} placeholder="ex.: 200×200×180" className="h-8 text-sm w-48" />
                                  )}
                                  <div className="flex items-center gap-2">
                                    <button onClick={saveEdit} disabled={saving} className="text-accent hover:text-emerald-light"><Check className="w-4 h-4" /></button>
                                    <button onClick={() => setEditingField(null)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
                                  </div>
                                </div>
                              ) : (
                              <div className="flex items-center gap-2 mt-1">
                                <Input value={editValue} onChange={(e) => setEditValue(e.target.value)} className="h-8 text-sm w-48" autoFocus />
                                <button onClick={saveEdit} disabled={saving} className="text-accent hover:text-emerald-light"><Check className="w-4 h-4" /></button>
                                <button onClick={() => setEditingField(null)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
                              </div>
                              )
                            ) : (
                              <p className="text-sm font-medium text-foreground">{field.value}</p>
                            )}
                          </div>
                        </div>
                        {editingField !== field.key && field.key !== "shipping_carrier" && (field as any).editable !== false && (
                          <button onClick={() => startEdit(field.key, field.value)} className="text-muted-foreground hover:text-accent transition-colors">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="atribuicoes">
                <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
                  {assignedParts.length === 0 ? (
                    <div className="text-center py-8">
                      <Package className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
                      <p className="text-muted-foreground text-sm">Sem atribuições ainda? A sua missão aguarda!</p>
                      <p className="text-muted-foreground/60 text-xs mt-1">Iremos notificá-lo quando encontrarmos uma correspondência.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Active parts grouped by project */}
                      {activeParts.length > 0 && (
                        <div className="space-y-4">
                          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Atribuições Ativas</h3>
                          {Object.entries(partsByProject).map(([projectName, parts]) => (
                            <div key={projectName} className="space-y-2">
                              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                {projectName}
                              </h4>
                              {parts.map((part) => (
                                <div key={part.id} className="p-3 bg-muted/30 rounded-xl space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-foreground">{part.part_name}</span>
                                    <Badge className={statusColor[part.status] ?? ""}>
                                      {statusLabels[part.status] ?? part.status}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                                    {part.project_instances?.initiatives?.name && (
                                      <span>{part.project_instances.initiatives.name}</span>
                                    )}
                                    {part.material && (
                                      <Badge variant="secondary" className="text-[10px]">{part.material}</Badge>
                                    )}
                                    {part.category && (
                                      <span>· {part.category}</span>
                                    )}
                                  </div>
                                  {part.file_url && (
                                    <a
                                      href={part.file_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
                                    >
                                      <Download className="w-3.5 h-3.5" />
                                      Descarregar ficheiro para impressão
                                    </a>
                                  )}
                                  <div className="flex items-center gap-2 pt-1 flex-wrap">
                                    <span className="text-xs text-muted-foreground">Atualizar estado:</span>
                                    {updatingPartId === part.id ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                                    ) : (
                                      <>
                                        {part.status !== "printing" && (
                                          <button
                                            onClick={() => updatePartStatus(part.id, "printing")}
                                            className="text-xs px-2 py-0.5 rounded-full border border-accent text-accent hover:bg-accent/10 transition-colors"
                                          >
                                            A imprimir
                                          </button>
                                        )}
                                        {part.status !== "printed" && (
                                          <button
                                            onClick={() => updatePartStatus(part.id, "printed")}
                                            className="text-xs px-2 py-0.5 rounded-full border border-success text-success hover:bg-success/10 transition-colors"
                                          >
                                            Impresso
                                          </button>
                                        )}
                                        {part.status !== "shipped" && (
                                          <button
                                            onClick={() => updatePartStatus(part.id, "shipped")}
                                            className="text-xs px-2 py-0.5 rounded-full border border-primary text-primary hover:bg-primary/10 transition-colors"
                                          >
                                            Enviado
                                          </button>
                                        )}
                                      </>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Completed parts history - collapsible */}
                      {completedParts.length > 0 && (
                        <Collapsible open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
                          <CollapsibleTrigger className="flex items-center justify-between w-full py-2 px-3 bg-muted/20 rounded-lg hover:bg-muted/30 transition-colors">
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                                Histórico
                              </h3>
                              <Badge variant="secondary" className="text-[10px]">
                                {completedParts.length} {completedParts.length === 1 ? "peça" : "peças"}
                              </Badge>
                            </div>
                            {isHistoryOpen ? (
                              <ChevronUp className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-muted-foreground" />
                            )}
                          </CollapsibleTrigger>
                          <CollapsibleContent className="mt-3 space-y-2">
                            {completedParts.map((part) => (
                              <div key={part.id} className="p-3 bg-muted/20 rounded-xl space-y-2 opacity-70">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium text-foreground">{part.part_name}</span>
                                  <Badge className={statusColor[part.status] ?? ""}>
                                    {statusLabels[part.status] ?? part.status}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                                  {part.project_instances?.name && (
                                    <span>Projeto: {part.project_instances.name}</span>
                                  )}
                                  {part.project_instances?.initiatives?.name && (
                                    <span>· {part.project_instances.initiatives.name}</span>
                                  )}
                                  {part.material && (
                                    <Badge variant="secondary" className="text-[10px]">{part.material}</Badge>
                                  )}
                                </div>
                              </div>
                            ))}
                          </CollapsibleContent>
                        </Collapsible>
                      )}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Portal;
