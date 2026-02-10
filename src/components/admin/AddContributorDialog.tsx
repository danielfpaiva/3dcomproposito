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
  // Bambu Lab
  "Bambu Lab A1 mini", "Bambu Lab A1", "Bambu Lab P1S", "Bambu Lab P1P",
  "Bambu Lab X1C", "Bambu Lab X1E", "Bambu Lab X1", "Bambu Lab H2S",
  "Bambu Lab H2D", "Bambu Lab P2S", "Bambu Lab A2",
  // Prusa
  "Prusa MK4S", "Prusa MK4", "Prusa MK3S+", "Prusa MINI+", "Prusa XL",
  "Prusa Core One",
  // Creality
  "Creality Ender 3 V3", "Creality Ender 3 V2", "Creality Ender 3 S1",
  "Creality CR-10 SE", "Creality CR-10", "Creality K1 Max", "Creality K1C",
  "Creality K1", "Creality K2 Plus",
  // Elegoo
  "Elegoo Neptune 4 Pro", "Elegoo Neptune 4 Plus", "Elegoo Neptune 4",
  "Elegoo Neptune 3 Pro", "Elegoo Neptune 3 Plus",
  // QIDI
  "QIDI X-Max 3", "QIDI X-Plus 3", "QIDI X-Smart 3",
  "QIDI Q1 Pro",
  // Anycubic
  "Anycubic Kobra 3", "Anycubic Kobra 2 Pro", "Anycubic Kobra 2",
  "Anycubic Vyper",
  // Voron
  "Voron 2.4", "Voron Trident", "Voron 0.2",
  // Outras
  "FlashForge Adventurer 5M Pro", "FlashForge Adventurer 5M",
  "Artillery Sidewinder X4 Plus", "Sovol SV08",
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
    phone: "",
    materials: ["PETG"] as string[],
    build_volume_ok: false,
    experience_level: "intermediate",
    turnaround_time: "",
    willing_to_collaborate: false,
  });

  const resetForm = () =>
    setForm({ name: "", email: "", location: "", region: "centro", printer_model: "", availability: "Disponível", can_ship: false, phone: "", materials: ["PETG"], build_volume_ok: false, experience_level: "intermediate", turnaround_time: "", willing_to_collaborate: false });

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
      phone: form.phone.trim() || null,
      materials: form.materials,
      build_volume_ok: form.build_volume_ok,
      experience_level: form.experience_level,
      turnaround_time: form.turnaround_time || null,
      willing_to_collaborate: form.willing_to_collaborate,
    } as any);
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
            <Label htmlFor="phone">Telefone</Label>
            <Input id="phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Opcional" />
          </div>
          <div className="grid gap-1.5">
            <Label>Materiais</Label>
            <div className="flex gap-2">
              {["PETG", "TPU"].map((mat) => (
                <button key={mat} onClick={() => {
                  const has = form.materials.includes(mat);
                  setForm({ ...form, materials: has ? form.materials.filter((m) => m !== mat) : [...form.materials, mat] });
                }}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                    form.materials.includes(mat) ? "bg-accent/10 border-accent/30 text-accent" : "border-border text-foreground hover:border-accent/20"
                  }`}>{mat}</button>
              ))}
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="availability">Disponibilidade</Label>
            <Input id="availability" value={form.availability} onChange={(e) => setForm({ ...form, availability: e.target.value })} placeholder="Ex: Fins de semana" />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="can_ship" checked={form.can_ship} onCheckedChange={(v) => setForm({ ...form, can_ship: !!v })} />
            <Label htmlFor="can_ship" className="text-sm">Pode enviar peças por correio</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="build_volume_ok" checked={form.build_volume_ok} onCheckedChange={(v) => setForm({ ...form, build_volume_ok: !!v })} />
            <Label htmlFor="build_volume_ok" className="text-sm">Volume ≥ 256×256×256mm</Label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Experiência</Label>
              <Select value={form.experience_level} onValueChange={(v) => setForm({ ...form, experience_level: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Iniciante</SelectItem>
                  <SelectItem value="intermediate">Intermédio</SelectItem>
                  <SelectItem value="expert">Experiente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Turnaround</Label>
              <Select value={form.turnaround_time} onValueChange={(v) => setForm({ ...form, turnaround_time: v })}>
                <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-2 weeks">1–2 semanas</SelectItem>
                  <SelectItem value="2-4 weeks">2–4 semanas</SelectItem>
                  <SelectItem value="4-6 weeks">4–6 semanas</SelectItem>
                  <SelectItem value="6+ weeks">6+ semanas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="willing_to_collaborate" checked={form.willing_to_collaborate} onCheckedChange={(v) => setForm({ ...form, willing_to_collaborate: !!v })} />
            <Label htmlFor="willing_to_collaborate" className="text-sm">Disponível para colaborar</Label>
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
