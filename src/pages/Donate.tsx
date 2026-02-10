import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Heart, Package, Truck, Sparkles, Check, Loader2, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const impactCards = [
  { amount: "10€", description: "1kg de PETG", detail: "≈ 3 peças de uma cadeira", icon: Package },
  { amount: "350€", description: "1 cadeira completa", detail: "Filamento + envios + montagem", icon: Heart },
  { amount: "15€", description: "Custos de envio", detail: "Enviar peças ao ponto de montagem", icon: Truck },
];

const methods = [
  { value: "mbway", label: "MBWay" },
  { value: "transferencia", label: "Transferência Bancária" },
  { value: "paypal", label: "PayPal" },
  { value: "outro", label: "Outro" },
];

const Donate = () => {
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const [form, setForm] = useState({
    name: "", email: "", amount: "", method: "mbway", message: "", publicName: false,
  });

  const updateField = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!form.amount || isNaN(Number(form.amount))) {
      toast({ title: "Valor inválido", description: "Indique um valor numérico.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("donations" as any).insert({
      donor_name: form.name.trim() || null,
      donor_email: form.email.trim() || null,
      amount_cents: Math.round(Number(form.amount) * 100),
      method: form.method,
      message: form.message.trim() || null,
      public_name: form.publicName,
    } as any);

    if (error) {
      toast({ title: "Erro ao registar", description: error.message, variant: "destructive" });
      setSubmitting(false);
      return;
    }
    setSubmitted(true);
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="pt-28 pb-16 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 mb-6">
              <Heart className="w-3.5 h-3.5 text-accent" />
              <span className="text-xs font-semibold text-accent">Cada euro faz a diferença</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-foreground mb-4">
              Apoie a <span className="text-gradient-hero">Missão</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto leading-relaxed">
              Não tem impressora 3D? Pode ajudar de outra forma — o filamento, os envios e a logística precisam de apoio financeiro para que cada cadeira chegue a quem precisa.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Impact Cards */}
      <section className="pb-12 px-6">
        <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4">
          {impactCards.map((card, i) => (
            <motion.div key={card.amount} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.1 }}
              className="bg-card rounded-2xl border border-border p-6 text-center bg-card-hover">
              <card.icon className="w-8 h-8 text-accent mx-auto mb-3" />
              <p className="text-2xl font-black text-foreground mb-1">{card.amount}</p>
              <p className="text-sm font-semibold text-foreground mb-1">{card.description}</p>
              <p className="text-xs text-muted-foreground">{card.detail}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Contact CTA */}
      <section className="pb-12 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="bg-navy-gradient rounded-2xl p-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-[0.03]" style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, hsl(0 0% 100%) 1px, transparent 0)`,
              backgroundSize: '32px 32px',
            }} />
            <div className="relative z-10">
              <MessageCircle className="w-10 h-10 text-accent mx-auto mb-4" />
              <h2 className="text-2xl font-black text-primary-foreground mb-2">Quer contribuir?</h2>
              <p className="text-primary-foreground/60 mb-6 max-w-md mx-auto text-sm">
                Entre em contacto com o Gabriel da Smart 3D para combinar a melhor forma de ajudar. MBWay, transferência ou PayPal — o que for mais fácil para si.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a href="https://www.instagram.com/smart3d_pt?igsh=MWliNmVibGFyMXM2ZA==" target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="bg-accent text-accent-foreground hover:bg-emerald-light btn-lift font-bold">
                    <MessageCircle className="w-4 h-4 mr-2" /> Contactar via Instagram
                  </Button>
                </a>
                <Button size="lg" variant="outline" onClick={() => setShowForm(!showForm)}
                  className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10">
                  {showForm ? "Esconder formulário" : "Registar donativo"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Optional Form */}
      {showForm && (
        <section className="pb-16 px-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg mx-auto">
            {submitted ? (
              <div className="bg-card rounded-2xl border border-border p-8 text-center">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }}
                  className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-accent" />
                </motion.div>
                <h3 className="text-xl font-black text-foreground mb-2">Obrigado pelo apoio!</h3>
                <p className="text-sm text-muted-foreground">O seu donativo foi registado. Juntos fazemos a diferença. 💚</p>
              </div>
            ) : (
              <div className="bg-card rounded-2xl border border-border p-8 space-y-4">
                <h3 className="text-lg font-bold text-foreground mb-1">Registar Donativo</h3>
                <p className="text-xs text-muted-foreground mb-4">Opcional — ajuda-nos a acompanhar o impacto. Todos os campos são opcionais exceto o valor.</p>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm">Nome (opcional)</Label>
                    <Input placeholder="João Silva" value={form.name} onChange={(e) => updateField("name", e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-sm">Email (opcional)</Label>
                    <Input type="email" placeholder="joao@email.com" value={form.email} onChange={(e) => updateField("email", e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm">Valor (€) *</Label>
                    <Input type="number" placeholder="10" value={form.amount} onChange={(e) => updateField("amount", e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-sm">Método</Label>
                    <Select value={form.method} onValueChange={(v) => updateField("method", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {methods.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="text-sm">Mensagem (opcional)</Label>
                  <Textarea placeholder="Uma palavra de apoio..." value={form.message} onChange={(e) => updateField("message", e.target.value)} className="resize-none" rows={2} />
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox id="publicName" checked={form.publicName} onCheckedChange={(v) => updateField("publicName", !!v)} />
                  <Label htmlFor="publicName" className="text-sm cursor-pointer">Autorizo mostrar o meu nome publicamente como apoiante</Label>
                </div>

                <Button onClick={handleSubmit} disabled={submitting} className="w-full bg-accent text-accent-foreground hover:bg-emerald-light btn-lift font-bold">
                  {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Heart className="w-4 h-4 mr-2" />}
                  Registar Donativo
                </Button>
              </div>
            )}
          </motion.div>
        </section>
      )}

      <Footer />
    </div>
  );
};

export default Donate;
