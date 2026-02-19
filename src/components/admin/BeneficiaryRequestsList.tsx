import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, Plus, X } from "lucide-react";
import { Accessibility } from "lucide-react";
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
import { PORTUGAL_REGIONS } from "@/lib/regions";

const BENEFICIARY_TYPES = [
  { value: "ate_8", label: "Criança até 8 anos" },
  { value: "mais_8", label: "Criança >8 anos" },
  { value: "adulto", label: "Adulto" },
];

const STATUS_LABELS: Record<string, string> = {
  pendente: "Pendente",
  em_avaliacao: "Em Avaliação",
  aprovado: "Aprovado",
  em_andamento: "Em andamento",
  concluido: "Concluído",
};

const STATUS_COLORS: Record<string, string> = {
  pendente: "bg-muted text-muted-foreground",
  em_avaliacao: "bg-accent/10 text-accent",
  aprovado: "bg-primary/10 text-primary",
  em_andamento: "bg-accent/20 text-accent",
  concluido: "bg-success/10 text-success",
};

const emptyForm = {
  contact_name: "",
  contact_email: "",
  contact_phone: "",
  region: "centro",
  beneficiary_type: "ate_8",
  beneficiary_age: "",
  description: "",
  how_found_us: "",
};

const BeneficiaryRequestsList = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["admin-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("beneficiary_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updateField = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleCreate = async () => {
    if (!form.contact_name.trim() || !form.contact_email.trim() || !form.beneficiary_age.trim() || !form.description.trim()) {
      toast({ title: "Preenche os campos obrigatórios", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("beneficiary_requests").insert({
      contact_name: form.contact_name.trim(),
      contact_email: form.contact_email.trim(),
      contact_phone: form.contact_phone.trim() || null,
      region: form.region,
      beneficiary_type: form.beneficiary_type,
      beneficiary_age: form.beneficiary_age.trim(),
      description: form.description.trim(),
      how_found_us: form.how_found_us.trim() || null,
      status: "pendente",
    });
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Pedido criado!" });
      queryClient.invalidateQueries({ queryKey: ["admin-requests"] });
      setForm(emptyForm);
      setShowCreateDialog(false);
    }
    setSaving(false);
  };

  const handleStatusChange = async (requestId: string, status: string) => {
    const { error } = await supabase
      .from("beneficiary_requests")
      .update({ status })
      .eq("id", requestId);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      queryClient.invalidateQueries({ queryKey: ["admin-requests"] });
      if (selectedRequest?.id === requestId) {
        setSelectedRequest((prev: any) => ({ ...prev, status }));
      }
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedRequest) return;
    setSavingNotes(true);
    const { error } = await supabase
      .from("beneficiary_requests")
      .update({ notes })
      .eq("id", selectedRequest.id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Notas guardadas" });
      queryClient.invalidateQueries({ queryKey: ["admin-requests"] });
    }
    setSavingNotes(false);
  };

  const typeLabel = (type: string) =>
    BENEFICIARY_TYPES.find((t) => t.value === type)?.label ?? type;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
          Pedidos de Beneficiários ({requests.length})
        </h3>
        <Button size="sm" onClick={() => setShowCreateDialog(true)} className="gap-1.5">
          <Plus className="w-4 h-4" /> Novo Pedido
        </Button>
      </div>

      {isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground mx-auto" />
      ) : requests.length === 0 ? (
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
                {requests.map((r: any) => (
                  <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="p-4">
                      <p className="font-medium text-foreground">{r.contact_name}</p>
                      <p className="text-xs text-muted-foreground">{r.contact_email}</p>
                    </td>
                    <td className="p-4"><Badge variant="secondary">{r.region}</Badge></td>
                    <td className="p-4 hidden sm:table-cell text-muted-foreground">{typeLabel(r.beneficiary_type)}</td>
                    <td className="p-4 hidden sm:table-cell text-muted-foreground">{r.beneficiary_age}</td>
                    <td className="p-4">
                      <Badge className={`text-[10px] ${STATUS_COLORS[r.status] ?? ""}`}>
                        {STATUS_LABELS[r.status] ?? r.status}
                      </Badge>
                    </td>
                    <td className="p-4 hidden md:table-cell text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString("pt-PT")}
                    </td>
                    <td className="p-4 text-right">
                      <Button
                        variant="ghost" size="sm"
                        className="text-muted-foreground hover:text-foreground"
                        onClick={() => { setSelectedRequest(r); setNotes(r.notes ?? ""); }}
                      >
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

      {/* Request detail dialog */}
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
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Tipo</p>
                  <p>{typeLabel(selectedRequest.beneficiary_type)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Idade</p>
                  <p>{selectedRequest.beneficiary_age}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Como nos encontrou</p>
                  <p>{selectedRequest.how_found_us || "—"}</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Descrição</p>
                <p className="text-muted-foreground">{selectedRequest.description}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Estado</p>
                <Select value={selectedRequest.status} onValueChange={(v) => handleStatusChange(selectedRequest.id, v)}>
                  <SelectTrigger className="w-48 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value} className="text-xs">{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Notas internas</p>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full text-sm border border-input rounded-md p-2 bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Adiciona notas internas sobre este pedido..."
                />
                <Button size="sm" className="mt-2" onClick={handleSaveNotes} disabled={savingNotes}>
                  {savingNotes ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Guardar notas"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Pedido recebido em {new Date(selectedRequest.created_at).toLocaleDateString("pt-PT")}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create request dialog */}
      <Dialog open={showCreateDialog} onOpenChange={(open) => { setShowCreateDialog(open); if (!open) setForm(emptyForm); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Pedido</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Nome do contacto *</label>
                <Input value={form.contact_name} onChange={(e) => updateField("contact_name", e.target.value)} placeholder="Nome completo" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Email *</label>
                <Input value={form.contact_email} onChange={(e) => updateField("contact_email", e.target.value)} placeholder="email@exemplo.pt" type="email" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Telefone</label>
                <Input value={form.contact_phone} onChange={(e) => updateField("contact_phone", e.target.value)} placeholder="+351 9xx xxx xxx" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Região *</label>
                <Select value={form.region} onValueChange={(v) => updateField("region", v)}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PORTUGAL_REGIONS.map((r) => (
                      <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Tipo de beneficiário *</label>
                <Select value={form.beneficiary_type} onValueChange={(v) => updateField("beneficiary_type", v)}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BENEFICIARY_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Idade *</label>
                <Input value={form.beneficiary_age} onChange={(e) => updateField("beneficiary_age", e.target.value)} placeholder="ex: 5 anos" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Como nos encontrou</label>
                <Input value={form.how_found_us} onChange={(e) => updateField("how_found_us", e.target.value)} placeholder="ex: redes sociais" />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Descrição da situação *</label>
                <textarea
                  value={form.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  rows={3}
                  className="w-full text-sm border border-input rounded-md p-2 bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Descreve brevemente a situação do beneficiário..."
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancelar</Button>
              <Button onClick={handleCreate} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Criar Pedido"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BeneficiaryRequestsList;
