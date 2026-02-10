import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PORTUGAL_REGIONS } from "@/lib/regions";
import { Plus, Loader2 } from "lucide-react";

const PRINTER_MODELS = [
  "Bambu Lab A1 mini",
  "Bambu Lab A1",
  "Bambu Lab P1S",
  "Bambu Lab X1C",
  "Prusa MK4",
  "Prusa Mini",
  "Creality Ender 3",
  "Creality K1",
  "Outro",
];

const AddContributorDialog = () => {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    name: "",
    email: "",
    location: "",
    region: "centro",
    printer_model: "",
    availability: "Disponível",
    can_ship: false,
  });

  const resetForm = () =>
    setForm({ name: "", email: "", location: "", region: "centro", printer_model: "", availability: "Disponível", can_ship: false });

  const handleSave = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.location.trim() || !form.printer_model) {
      toast({ title: "Campos obrigatórios", description: "Preencha nome, email, localização e impressora.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("contributors").insert({
      name: form.name.trim(),
      email: form.email.trim(),
      location: form.location.trim(),
      region: form.region,
      printer_model: form.printer_model,
      availability: form.availability,
      can_ship: form.can_ship,
    });
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Voluntário adicionado!", description: `${form.name} registado com sucesso.` });
      queryClient.invalidateQueries({ queryKey: ["admin-contributors"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      resetForm();
      setOpen(false);
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-accent text-accent-foreground hover:bg-emerald-light btn-lift font-semibold">
          <Plus className="w-4 h-4 mr-1" /> Adicionar Voluntário
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Voluntário</DialogTitle>
          <DialogDescription>Registar manualmente um voluntário que contactou por outro canal.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-1.5">
            <Label htmlFor="name">Nome *</Label>
            <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome completo" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="email">Email *</Label>
            <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@exemplo.com" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="location">Localização *</Label>
              <Input id="location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Cidade" />
            </div>
            <div className="grid gap-1.5">
              <Label>Região</Label>
              <Select value={form.region} onValueChange={(v) => setForm({ ...form, region: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PORTUGAL_REGIONS.map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label>Impressora *</Label>
            <Select value={form.printer_model} onValueChange={(v) => setForm({ ...form, printer_model: v })}>
              <SelectTrigger><SelectValue placeholder="Selecionar modelo" /></SelectTrigger>
              <SelectContent>
                {PRINTER_MODELS.map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="availability">Disponibilidade</Label>
            <Input id="availability" value={form.availability} onChange={(e) => setForm({ ...form, availability: e.target.value })} placeholder="Ex: Fins de semana" />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="can_ship" checked={form.can_ship} onCheckedChange={(v) => setForm({ ...form, can_ship: !!v })} />
            <Label htmlFor="can_ship" className="text-sm">Pode enviar peças por correio</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-accent text-accent-foreground hover:bg-emerald-light">
            {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />}
            Adicionar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddContributorDialog;
