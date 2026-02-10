import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Printer, MapPin, Calendar, Package, Mail, Pencil, X, Check, Loader2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

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
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const [assignedParts, setAssignedParts] = useState<Tables<"parts">[]>([]);

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
      const { data: parts } = await supabase
        .from("parts").select("*").eq("assigned_contributor_id", data.id);
      setAssignedParts(parts ?? []);
      setLoading(false);
    };

    fetchContributor();
  }, [token]);

  const startEdit = (field: string, currentValue: string) => {
    setEditingField(field);
    setEditValue(currentValue);
  };

  const saveEdit = async () => {
    if (!contributor || !editingField) return;
    setSaving(true);
    const { error: err } = await supabase
      .from("contributors").update({ [editingField]: editValue })
      .eq("id", contributor.id).eq("token", token!);
    if (err) {
      toast({ title: "Falha na atualização", description: err.message, variant: "destructive" });
    } else {
      setContributor({ ...contributor, [editingField]: editValue });
      toast({ title: "Dados Atualizados!", description: "Obrigado por manter o seu perfil de missão atualizado." });
    }
    setEditingField(null);
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (error || !contributor) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 pb-20 px-6 flex items-center justify-center min-h-[70vh]">
          <div className="text-center max-w-md">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h1 className="text-2xl font-black text-foreground mb-2">Acesso Negado</h1>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Link to="/contribute">
              <Button className="bg-accent text-accent-foreground hover:bg-emerald-light btn-lift font-semibold">
                Juntar-me à Missão
              </Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const fields = [
    { key: "name", label: "Nome", icon: Mail, value: contributor.name },
    { key: "location", label: "Localização", icon: MapPin, value: contributor.location },
    { key: "printer_model", label: "Impressora", icon: Printer, value: contributor.printer_model },
    { key: "availability", label: "Disponibilidade", icon: Calendar, value: contributor.availability },
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

            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm mb-6">
              <h2 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wider">Os Seus Dados</h2>
              <div className="space-y-3">
                {fields.map((field) => (
                  <div key={field.key} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                    <div className="flex items-center gap-3">
                      <field.icon className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">{field.label}</p>
                        {editingField === field.key ? (
                          <div className="flex items-center gap-2 mt-1">
                            <Input value={editValue} onChange={(e) => setEditValue(e.target.value)} className="h-8 text-sm w-48" autoFocus />
                            <button onClick={saveEdit} disabled={saving} className="text-accent hover:text-emerald-light"><Check className="w-4 h-4" /></button>
                            <button onClick={() => setEditingField(null)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
                          </div>
                        ) : (
                          <p className="text-sm font-medium text-foreground">{field.value}</p>
                        )}
                      </div>
                    </div>
                    {editingField !== field.key && field.key !== "shipping_carrier" && (
                      <button onClick={() => startEdit(field.key, field.value)} className="text-muted-foreground hover:text-accent transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
              <h2 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wider">As Suas Atribuições</h2>
              {assignedParts.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">Sem atribuições ainda? A sua missão aguarda!</p>
                  <p className="text-muted-foreground/60 text-xs mt-1">Iremos notificá-lo quando encontrarmos uma correspondência.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {assignedParts.map((part) => (
                    <div key={part.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                      <span className="text-sm font-medium text-foreground">{part.part_name}</span>
                      <Badge className={statusColor[part.status] ?? ""}>
                        {statusLabels[part.status] ?? part.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Portal;
