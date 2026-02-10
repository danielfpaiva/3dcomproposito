import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ArrowLeft, ArrowRight, Check, User, MapPin, Printer, Calendar, Mail, Package, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PORTUGAL_REGIONS } from "@/lib/regions";
import { useQueryClient } from "@tanstack/react-query";

const steps = [
  { id: 1, label: "Nome", icon: User },
  { id: 2, label: "Localização", icon: MapPin },
  { id: 3, label: "Impressora", icon: Printer },
  { id: 4, label: "Disponibilidade", icon: Calendar },
  { id: 5, label: "Envio", icon: Package },
  { id: 6, label: "Ativar", icon: Mail },
];

const printerModels = [
  "Prusa i3 MK3S+", "Prusa MINI+", "Creality Ender 3 V2", "Creality CR-10",
  "Bambu Lab X1 Carbon", "Bambu Lab P1S", "Anycubic Kobra 2", "Voron 2.4", "Outra",
];

const availabilityOptions = [
  "Dias úteis (9h–17h)",
  "Noites (17h–22h)",
  "Apenas fins de semana",
  "Flexível / Qualquer altura",
  "Limitado (algumas horas/semana)",
];

const Contribute = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "", location: "", region: "centro", printer: "", availability: "",
    canShip: false, shippingCarrier: "", email: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [portalLink, setPortalLink] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateField = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return formData.name.trim().length > 0;
      case 2: return formData.location.trim().length > 0 && formData.region.length > 0;
      case 3: return formData.printer.length > 0;
      case 4: return formData.availability.length > 0;
      case 5: return true;
      case 6: return formData.email.includes("@");
      default: return false;
    }
  };

  const handleNext = async () => {
    if (currentStep < 6) {
      setCurrentStep((prev) => prev + 1);
      return;
    }

    setSubmitting(true);
    const { data, error } = await supabase.from("contributors").insert({
      name: formData.name.trim(),
      email: formData.email.trim(),
      location: formData.location.trim(),
      region: formData.region,
      printer_model: formData.printer,
      availability: formData.availability,
      can_ship: formData.canShip,
      shipping_carrier: formData.canShip ? formData.shippingCarrier : null,
    }).select("token").single();

    if (error) {
      toast({ title: "Erro ao submeter", description: error.message, variant: "destructive" });
      setSubmitting(false);
      return;
    }

    setPortalLink(`${window.location.origin}/portal?token=${data.token}`);
    queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    queryClient.invalidateQueries({ queryKey: ["regional-stats"] });
    setSubmitted(true);
    setSubmitting(false);
  };

  const handleBack = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const slideVariants = {
    enter: { opacity: 0, x: 30 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -30 },
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 pb-20 px-6 flex items-center justify-center min-h-[80vh]">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }} className="text-center max-w-md">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.4, delay: 0.2, type: "spring", stiffness: 200 }} className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-accent" />
            </motion.div>
            <h1 className="text-3xl font-black text-foreground mb-3">Missão Cumprida!</h1>
            <p className="text-muted-foreground mb-2">Bem-vindo/a a bordo, <span className="font-semibold text-foreground">{formData.name}</span>.</p>
            <p className="text-muted-foreground text-sm mb-6">Guarde o link do seu portal para gerir a sua contribuição e ver as atribuições:</p>
            <div className="bg-card border border-border rounded-xl p-4 mb-6">
              <p className="text-xs text-muted-foreground mb-1">O Seu Link do Portal</p>
              <p className="text-sm font-mono text-accent break-all">{portalLink}</p>
            </div>
            <a href={portalLink}>
              <Button className="bg-accent text-accent-foreground hover:bg-emerald-light btn-lift font-semibold">
                Ir para o Meu Portal
              </Button>
            </a>
          </motion.div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-28 pb-20 px-6">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-black text-foreground mb-2">Juntar-me à Missão</h1>
            <p className="text-muted-foreground">Conte-nos sobre o seu equipamento — demora menos de 2 minutos</p>
          </div>

          <div className="flex items-center justify-center gap-2 mb-10">
            {steps.map((step) => (
              <div key={step.id} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                step.id === currentStep ? "bg-accent/10 text-accent border border-accent/20"
                : step.id < currentStep ? "bg-accent/5 text-accent/60" : "text-muted-foreground/40"
              }`}>
                {step.id < currentStep ? <Check className="w-3 h-3" /> : <step.icon className="w-3 h-3" />}
                <span className="hidden sm:inline">{step.label}</span>
              </div>
            ))}
          </div>

          <div className="bg-card rounded-2xl border border-border p-8 shadow-sm min-h-[280px] flex flex-col">
            <AnimatePresence mode="wait">
              <motion.div key={currentStep} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.2 }} className="flex-1">
                {currentStep === 1 && (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-base font-bold text-foreground">Como se chama?</Label>
                      <p className="text-sm text-muted-foreground mt-1 mb-3">Para sabermos quem está a fazer a magia acontecer.</p>
                    </div>
                    <Input placeholder="ex.: João Silva" value={formData.name} onChange={(e) => updateField("name", e.target.value)} className="text-base py-5" autoFocus />
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-base font-bold text-foreground">Onde se encontra?</Label>
                      <p className="text-sm text-muted-foreground mt-1 mb-3">Cidade ou código postal — ajuda-nos a associá-lo a projetos próximos.</p>
                    </div>
                    <Input placeholder="ex.: Porto ou 4000-001" value={formData.location} onChange={(e) => updateField("location", e.target.value)} className="text-base py-5" autoFocus />
                    <div>
                      <Label className="text-sm font-medium text-foreground">Região</Label>
                      <Select value={formData.region} onValueChange={(v) => updateField("region", v)}>
                        <SelectTrigger className="mt-1"><SelectValue placeholder="Selecionar região" /></SelectTrigger>
                        <SelectContent>
                          {PORTUGAL_REGIONS.map((r) => (
                            <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-base font-bold text-foreground">Que impressora tem?</Label>
                      <p className="text-sm text-muted-foreground mt-1 mb-3">Isto ajuda-nos a determinar que peças pode imprimir.</p>
                    </div>
                    <Select value={formData.printer} onValueChange={(v) => updateField("printer", v)}>
                      <SelectTrigger className="text-base py-5"><SelectValue placeholder="Selecionar modelo de impressora" /></SelectTrigger>
                      <SelectContent>
                        {printerModels.map((model) => (
                          <SelectItem key={model} value={model}>{model}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {currentStep === 4 && (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-base font-bold text-foreground">Quando está disponível para imprimir?</Label>
                      <p className="text-sm text-muted-foreground mt-1 mb-3">Disponibilidade aproximada para planearmos os prazos.</p>
                    </div>
                    <div className="space-y-2">
                      {availabilityOptions.map((opt) => (
                        <button key={opt} onClick={() => updateField("availability", opt)}
                          className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all duration-200 ${
                            formData.availability === opt ? "bg-accent/10 border-accent/30 text-accent" : "bg-background border-border text-foreground hover:border-accent/20"
                          }`}>{opt}</button>
                      ))}
                    </div>
                  </div>
                )}

                {currentStep === 5 && (
                  <div className="space-y-5">
                    <div>
                      <Label className="text-base font-bold text-foreground">Pode enviar peças impressas?</Label>
                      <p className="text-sm text-muted-foreground mt-1 mb-3">Opcional — alguns projetos precisam que as peças sejam enviadas para pontos de montagem.</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Checkbox id="canShip" checked={formData.canShip} onCheckedChange={(v) => updateField("canShip", !!v)} />
                      <Label htmlFor="canShip" className="text-sm font-medium text-foreground cursor-pointer">Sim, posso enviar peças</Label>
                    </div>
                    <AnimatePresence>
                      {formData.canShip && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}>
                          <Input placeholder="Transportadora preferida (ex.: CTT, DPD)" value={formData.shippingCarrier} onChange={(e) => updateField("shippingCarrier", e.target.value)} className="text-base py-5" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {currentStep === 6 && (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-base font-bold text-foreground">Ative a sua contribuição</Label>
                      <p className="text-sm text-muted-foreground mt-1 mb-3">Introduza o seu email para receber o seu link único de voluntário e atribuições de projetos.</p>
                    </div>
                    <Input type="email" placeholder="o.seu.email@exemplo.com" value={formData.email} onChange={(e) => updateField("email", e.target.value)} className="text-base py-5" autoFocus />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
              <Button variant="ghost" onClick={handleBack} disabled={currentStep === 1} className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
              </Button>
              <div className="text-xs text-muted-foreground">{currentStep} de {steps.length}</div>
              <Button onClick={handleNext} disabled={!canProceed() || submitting} className="bg-accent text-accent-foreground hover:bg-emerald-light btn-lift font-semibold">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : currentStep === 6 ? "Ativar" : "Seguinte"}
                {!submitting && currentStep < 6 && <ArrowRight className="w-4 h-4 ml-1" />}
                {!submitting && currentStep === 6 && <Check className="w-4 h-4 ml-1" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Contribute;
