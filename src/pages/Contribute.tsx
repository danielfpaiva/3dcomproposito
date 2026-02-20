import { useState, useEffect } from "react";
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
import { ArrowLeft, ArrowRight, Check, User, MapPin, Printer, Calendar, Mail, Package, Loader2, Star, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PORTUGAL_REGIONS } from "@/lib/regions";
import { getSuggestedBuildPlate } from "@/lib/printerBuildPlates";
import { useQueryClient } from "@tanstack/react-query";

const steps = [
  { id: 1, label: "Nome", icon: User },
  { id: 2, label: "Localização", icon: MapPin },
  { id: 3, label: "Impressora", icon: Printer },
  { id: 4, label: "Materiais", icon: Package },
  { id: 5, label: "Experiência", icon: Star },
  { id: 6, label: "Disponibilidade", icon: Calendar },
  { id: 7, label: "Envio", icon: Package },
  { id: 8, label: "Ativar", icon: Mail },
];

const printerModels = [
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
];

const availabilityOptions = [
  "Dias úteis (9h–17h)",
  "Noites (17h–22h)",
  "Apenas fins de semana",
  "Flexível / Qualquer altura",
  "Limitado (algumas horas/semana)",
];

const experienceLevels = [
  { value: "beginner", label: "Iniciante", description: "Comecei recentemente a imprimir 3D" },
  { value: "intermediate", label: "Intermédio", description: "Já imprimi vários projetos com sucesso" },
  { value: "expert", label: "Experiente", description: "Domino calibração, materiais e projetos complexos" },
];

const turnaroundOptions = [
  { value: "1-2 weeks", label: "1–2 semanas" },
  { value: "2-4 weeks", label: "2–4 semanas" },
  { value: "4-6 weeks", label: "4–6 semanas" },
  { value: "6+ weeks", label: "6+ semanas" },
];

const Contribute = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "", location: "", region: "centro", printers: [] as string[], otherPrinter: "", materials: [] as string[],
    availability: "", canShip: false, shippingCarrier: "", email: "", phone: "",
    buildVolumeOk: false, buildPlateSize: "", buildPlateCustom: "", experienceLevel: "intermediate", turnaroundTime: "", willingToCollaborate: false,
  });
  const [submitted, setSubmitted] = useState(false);
  const [portalLink, setPortalLink] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [settingPassword, setSettingPassword] = useState(false);
  const [passwordSet, setPasswordSet] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateField = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Suggest default build plate when user selects printer(s) and hasn't set one yet
  useEffect(() => {
    const printers = [...formData.printers];
    if (formData.otherPrinter.trim()) printers.push("Outra: " + formData.otherPrinter.trim());
    if (formData.buildPlateSize !== "" || printers.length === 0) return;
    const suggested = getSuggestedBuildPlate(printers);
    if (suggested) setFormData((prev) => ({ ...prev, buildPlateSize: suggested }));
  }, [formData.printers, formData.otherPrinter]);

  const canProceed = () => {
    switch (currentStep) {
      case 1: return formData.name.trim().length > 0;
      case 2: return formData.location.trim().length > 0 && formData.region.length > 0;
      case 3: return formData.printers.length > 0 || formData.otherPrinter.trim().length > 0;
      case 4: return formData.materials.length > 0;
      case 5: return formData.experienceLevel.length > 0;
      case 6: return formData.availability.length > 0;
      case 7: return true;
      case 8: return formData.email.includes("@");
      default: return false;
    }
  };

  const handleNext = async () => {
    if (currentStep < 8) {
      setCurrentStep((prev) => prev + 1);
      return;
    }

    setSubmitting(true);
    const printers = [...formData.printers];
    if (formData.otherPrinter.trim()) printers.push("Outra: " + formData.otherPrinter.trim());
    const buildPlateSize = formData.buildPlateSize === "outro"
      ? (formData.buildPlateCustom.trim() || null)
      : (formData.buildPlateSize || null);
    const { data, error } = await supabase.from("contributors").insert({
      name: formData.name.trim(),
      email: formData.email.trim(),
      location: formData.location.trim(),
      region: formData.region,
      printer_models: printers,
      materials: formData.materials,
      availability: formData.availability,
      can_ship: formData.canShip,
      shipping_carrier: formData.canShip ? formData.shippingCarrier : null,
      phone: formData.phone.trim() || null,
      build_volume_ok: formData.buildVolumeOk,
      build_plate_size: buildPlateSize,
      experience_level: formData.experienceLevel,
      turnaround_time: formData.turnaroundTime || null,
      willing_to_collaborate: formData.willingToCollaborate,
    } as any).select("id, token").single();

    if (error) {
      toast({ title: "Erro ao submeter", description: error.message, variant: "destructive" });
      setSubmitting(false);
      return;
    }

    // Send welcome email
    try {
      const { error: emailError } = await supabase.functions.invoke('volunteer-welcome', {
        body: { contributor_id: data.id }
      });
      if (emailError) {
        console.error('Erro ao enviar email de boas-vindas:', emailError);
      }
    } catch (e) {
      console.error('Erro ao enviar email de boas-vindas:', e);
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

  const handleSetPassword = async () => {
    if (newPassword.length < 4) return;
    setSettingPassword(true);
    try {
      const res = await supabase.functions.invoke("contributor-auth", {
        body: { email: formData.email.trim(), password: newPassword, action: "set-password" },
      });
      if (res.error || res.data?.error) {
        toast({ title: "Erro", description: res.data?.error || "Não foi possível guardar a password.", variant: "destructive" });
      } else {
        setPasswordSet(true);
        toast({ title: "Password definida!", description: "Pode agora entrar no portal com o seu email e password." });
      }
    } catch {
      toast({ title: "Erro de ligação", description: "Tente novamente.", variant: "destructive" });
    }
    setSettingPassword(false);
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

            {!passwordSet ? (
              <div className="bg-card border border-border rounded-xl p-4 mb-6 text-left">
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="w-4 h-4 text-accent" />
                  <p className="text-sm font-bold text-foreground">Criar password de acesso</p>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Defina uma password para aceder ao portal sem precisar do link. Pode sempre entrar em <span className="font-medium text-foreground">/portal</span> com o seu email.
                </p>
                <div className="flex gap-2">
                  <Input
                    type="password"
                    placeholder="Escolha uma password (mín. 4 caracteres)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSetPassword()}
                    className="text-sm"
                    minLength={4}
                  />
                  <Button
                    onClick={handleSetPassword}
                    disabled={settingPassword || newPassword.length < 4}
                    size="sm"
                    className="bg-accent text-accent-foreground hover:bg-emerald-light font-semibold shrink-0"
                  >
                    {settingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-accent/5 border border-accent/20 rounded-xl p-4 mb-6 flex items-center gap-3">
                <Check className="w-5 h-5 text-accent shrink-0" />
                <p className="text-sm text-foreground">
                  Password definida! Pode aceder ao portal com <span className="font-semibold">{formData.email}</span> e a sua password.
                </p>
              </div>
            )}

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

          <div className="flex items-center justify-center gap-1.5 mb-10 flex-wrap">
            {steps.map((step) => (
              <div key={step.id} className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
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
                      <Label className="text-base font-bold text-foreground">Que impressora(s) tem?</Label>
                      <p className="text-sm text-muted-foreground mt-1 mb-3">Selecione todas as impressoras que pode usar. Isto ajuda-nos a determinar que peças pode imprimir.</p>
                    </div>
                    <div className="max-h-[240px] overflow-y-auto space-y-1 pr-1">
                      {(() => {
                        const grouped: Record<string, string[]> = {};
                        printerModels.forEach((m) => {
                          const brand = m.split(" ")[0];
                          if (!grouped[brand]) grouped[brand] = [];
                          grouped[brand].push(m);
                        });
                        return Object.entries(grouped).map(([brand, models]) => (
                          <div key={brand} className="mb-2">
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 sticky top-0 bg-card py-1">{brand}</p>
                            <div className="space-y-1">
                              {models.map((model) => (
                                <button key={model} onClick={() => {
                                  setFormData((prev) => {
                                    const has = prev.printers.includes(model);
                                    return { ...prev, printers: has ? prev.printers.filter((p) => p !== model) : [...prev.printers, model] };
                                  });
                                }}
                                  className={`w-full text-left px-3 py-2 rounded-lg border text-sm font-medium transition-all duration-200 ${
                                    formData.printers.includes(model) ? "bg-accent/10 border-accent/30 text-accent" : "bg-background border-border text-foreground hover:border-accent/20"
                                  }`}>{model}</button>
                              ))}
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                    {(formData.printers.length > 0 || formData.otherPrinter.trim()) && (
                      <p className="text-xs text-accent font-medium">{formData.printers.length + (formData.otherPrinter.trim() ? 1 : 0)} impressora(s) selecionada(s)</p>
                    )}
                    <div className="mt-3">
                      <Label className="text-sm font-medium text-muted-foreground">Não encontra a sua? Escreva aqui:</Label>
                      <Input placeholder="ex.: Minha Marca XYZ 2000" value={formData.otherPrinter} onChange={(e) => setFormData((p) => ({ ...p, otherPrinter: e.target.value }))} className="mt-1 text-base" />
                    </div>
                    <div className="mt-4 space-y-3">
                      <div>
                        <Label className="text-sm font-bold text-foreground">Tamanho do build plate (mm)</Label>
                        <p className="text-xs text-muted-foreground mt-0.5">Largura × profundidade × altura — para alocarmos as peças corretas.</p>
                        <Select value={formData.buildPlateSize || "_"} onValueChange={(v) => setFormData((p) => ({ ...p, buildPlateSize: v === "_" ? "" : v }))}>
                          <SelectTrigger className="mt-2"><SelectValue placeholder="Selecionar tamanho" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="_">Selecionar…</SelectItem>
                            <SelectItem value="180×180×180">180 × 180 × 180</SelectItem>
                            <SelectItem value="220×220×250">220 × 220 × 250</SelectItem>
                            <SelectItem value="256×256×256">256 × 256 × 256</SelectItem>
                            <SelectItem value="300×300×300">300 × 300 × 300</SelectItem>
                            <SelectItem value="outro">Outro (especificar abaixo)</SelectItem>
                          </SelectContent>
                        </Select>
                        {formData.buildPlateSize === "outro" && (
                          <Input placeholder="ex.: 200×200×180" value={formData.buildPlateCustom} onChange={(e) => setFormData((p) => ({ ...p, buildPlateCustom: e.target.value }))} className="mt-2 text-base" />
                        )}
                      </div>
                      <div className="p-3 bg-muted/50 rounded-xl border border-border">
                        <div className="flex items-start gap-3">
                          <Checkbox id="buildVolume" checked={formData.buildVolumeOk} onCheckedChange={(v) => updateField("buildVolumeOk", !!v)} className="mt-0.5" />
                          <Label htmlFor="buildVolume" className="text-sm font-medium text-foreground cursor-pointer leading-snug">
                            A minha impressora tem pelo menos <span className="font-bold text-accent">256 × 256 × 256 mm</span> de volume de impressão
                            <span className="block text-xs text-muted-foreground mt-1">Requisito mínimo para peças TMT. <a href="https://makerworld.com/en/models/2066081-3d-toddler-mobility-trainer" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Ver modelo →</a></span>
                          </Label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 4 && (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-base font-bold text-foreground">Que materiais imprime?</Label>
                      <p className="text-sm text-muted-foreground mt-1 mb-3">Selecione os materiais que a sua impressora suporta.</p>
                    </div>
                    <div className="space-y-2">
                      {["PETG", "TPU"].map((mat) => (
                        <button key={mat} onClick={() => {
                          setFormData((prev) => {
                            const has = prev.materials.includes(mat);
                            return { ...prev, materials: has ? prev.materials.filter((m) => m !== mat) : [...prev.materials, mat] };
                          });
                        }}
                          className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all duration-200 ${
                            formData.materials.includes(mat) ? "bg-accent/10 border-accent/30 text-accent" : "bg-background border-border text-foreground hover:border-accent/20"
                          }`}>{mat}</button>
                      ))}
                    </div>
                  </div>
                )}

                {currentStep === 5 && (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-base font-bold text-foreground">Qual é o seu nível de experiência?</Label>
                      <p className="text-sm text-muted-foreground mt-1 mb-3">Ajuda-nos a atribuir peças adequadas ao seu perfil.</p>
                    </div>
                    <div className="space-y-2">
                      {experienceLevels.map((lvl) => (
                        <button key={lvl.value} onClick={() => updateField("experienceLevel", lvl.value)}
                          className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all duration-200 ${
                            formData.experienceLevel === lvl.value ? "bg-accent/10 border-accent/30 text-accent" : "bg-background border-border text-foreground hover:border-accent/20"
                          }`}>
                          <span className="font-medium">{lvl.label}</span>
                          <span className="block text-xs mt-0.5 opacity-70">{lvl.description}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {currentStep === 6 && (
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
                    <div className="mt-4">
                      <Label className="text-sm font-medium text-foreground mb-2 block">Tempo estimado de entrega</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {turnaroundOptions.map((opt) => (
                          <button key={opt.value} onClick={() => updateField("turnaroundTime", opt.value)}
                            className={`px-3 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200 ${
                              formData.turnaroundTime === opt.value ? "bg-accent/10 border-accent/30 text-accent" : "bg-background border-border text-foreground hover:border-accent/20"
                            }`}>{opt.label}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 7 && (
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
                    <div className="flex items-center gap-3 pt-2">
                      <Checkbox id="willingToCollaborate" checked={formData.willingToCollaborate} onCheckedChange={(v) => updateField("willingToCollaborate", !!v)} />
                      <Label htmlFor="willingToCollaborate" className="text-sm font-medium text-foreground cursor-pointer">
                        Disponível para colaborar com outros makers na minha região
                      </Label>
                    </div>
                  </div>
                )}

                {currentStep === 8 && (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-base font-bold text-foreground">Ative a sua contribuição</Label>
                      <p className="text-sm text-muted-foreground mt-1 mb-3">Introduza o seu email para receber o seu link único de voluntário e atribuições de projetos.</p>
                    </div>
                    <Input type="email" placeholder="o.seu.email@exemplo.com" value={formData.email} onChange={(e) => updateField("email", e.target.value)} className="text-base py-5" autoFocus />
                    <Input type="tel" placeholder="Telefone (opcional)" value={formData.phone} onChange={(e) => updateField("phone", e.target.value)} className="text-base py-5" />
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
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : currentStep === 8 ? "Ativar" : "Seguinte"}
                {!submitting && currentStep < 8 && <ArrowRight className="w-4 h-4 ml-1" />}
                {!submitting && currentStep === 8 && <Check className="w-4 h-4 ml-1" />}
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
