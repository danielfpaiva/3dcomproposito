import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ArrowLeft, ArrowRight, Check, User, MapPin, Printer, Calendar, Mail, Package } from "lucide-react";

const steps = [
  { id: 1, label: "Your Name", icon: User },
  { id: 2, label: "Location", icon: MapPin },
  { id: 3, label: "Printer", icon: Printer },
  { id: 4, label: "Availability", icon: Calendar },
  { id: 5, label: "Shipping", icon: Package },
  { id: 6, label: "Activate", icon: Mail },
];

const printerModels = [
  "Prusa i3 MK3S+",
  "Prusa MINI+",
  "Creality Ender 3 V2",
  "Creality CR-10",
  "Bambu Lab X1 Carbon",
  "Bambu Lab P1S",
  "Anycubic Kobra 2",
  "Voron 2.4",
  "Other",
];

const availabilityOptions = [
  "Weekdays (9am–5pm)",
  "Evenings (5pm–10pm)",
  "Weekends only",
  "Flexible / Anytime",
  "Limited (a few hours/week)",
];

const Contribute = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    printer: "",
    availability: "",
    canShip: false,
    shippingCarrier: "",
    email: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const updateField = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return formData.name.trim().length > 0;
      case 2: return formData.location.trim().length > 0;
      case 3: return formData.printer.length > 0;
      case 4: return formData.availability.length > 0;
      case 5: return true;
      case 6: return formData.email.includes("@");
      default: return false;
    }
  };

  const handleNext = () => {
    if (currentStep === 6) {
      setSubmitted(true);
      return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, 6));
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
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="text-center max-w-md"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.4, delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-6"
            >
              <Check className="w-10 h-10 text-accent" />
            </motion.div>
            <h1 className="text-3xl font-black text-foreground mb-3">
              Mission Accomplished!
            </h1>
            <p className="text-muted-foreground mb-2">
              Welcome aboard, <span className="font-semibold text-foreground">{formData.name}</span>.
            </p>
            <p className="text-muted-foreground text-sm mb-8">
              Check <span className="font-medium text-foreground">{formData.email}</span> for your unique contributor link and project assignment details.
            </p>
            <div className="bg-card border border-border rounded-xl p-6 text-left space-y-3">
              <h3 className="text-sm font-bold text-foreground mb-3">Your Contribution Summary</h3>
              {[
                { label: "Location", value: formData.location },
                { label: "Printer", value: formData.printer },
                { label: "Availability", value: formData.availability },
                { label: "Can Ship Parts", value: formData.canShip ? `Yes — ${formData.shippingCarrier || "Any carrier"}` : "No" },
              ].map((item) => (
                <div key={item.label} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-medium text-foreground">{item.value}</span>
                </div>
              ))}
            </div>
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
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-3xl font-black text-foreground mb-2">Join the Mission</h1>
            <p className="text-muted-foreground">
              Tell us about your setup — takes under 2 minutes
            </p>
          </div>

          {/* Step indicators */}
          <div className="flex items-center justify-center gap-2 mb-10">
            {steps.map((step) => (
              <div
                key={step.id}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                  step.id === currentStep
                    ? "bg-accent/10 text-accent border border-accent/20"
                    : step.id < currentStep
                    ? "bg-accent/5 text-accent/60"
                    : "text-muted-foreground/40"
                }`}
              >
                {step.id < currentStep ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <step.icon className="w-3 h-3" />
                )}
                <span className="hidden sm:inline">{step.label}</span>
              </div>
            ))}
          </div>

          {/* Form card */}
          <div className="bg-card rounded-2xl border border-border p-8 shadow-sm min-h-[280px] flex flex-col">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="flex-1"
              >
                {currentStep === 1 && (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-base font-bold text-foreground">What's your name?</Label>
                      <p className="text-sm text-muted-foreground mt-1 mb-3">So we know who's making the magic happen.</p>
                    </div>
                    <Input
                      placeholder="e.g., Sarah Johnson"
                      value={formData.name}
                      onChange={(e) => updateField("name", e.target.value)}
                      className="text-base py-5"
                      autoFocus
                    />
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-base font-bold text-foreground">Where are you located?</Label>
                      <p className="text-sm text-muted-foreground mt-1 mb-3">City or zip code — helps us match you with nearby projects.</p>
                    </div>
                    <Input
                      placeholder="e.g., Portland, OR or 97201"
                      value={formData.location}
                      onChange={(e) => updateField("location", e.target.value)}
                      className="text-base py-5"
                      autoFocus
                    />
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-base font-bold text-foreground">What printer do you have?</Label>
                      <p className="text-sm text-muted-foreground mt-1 mb-3">This helps us determine which parts you can print.</p>
                    </div>
                    <Select value={formData.printer} onValueChange={(v) => updateField("printer", v)}>
                      <SelectTrigger className="text-base py-5">
                        <SelectValue placeholder="Select your printer model" />
                      </SelectTrigger>
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
                      <Label className="text-base font-bold text-foreground">When are you available to print?</Label>
                      <p className="text-sm text-muted-foreground mt-1 mb-3">Rough availability so we can plan timelines.</p>
                    </div>
                    <div className="space-y-2">
                      {availabilityOptions.map((opt) => (
                        <button
                          key={opt}
                          onClick={() => updateField("availability", opt)}
                          className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all duration-200 ${
                            formData.availability === opt
                              ? "bg-accent/10 border-accent/30 text-accent"
                              : "bg-background border-border text-foreground hover:border-accent/20"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {currentStep === 5 && (
                  <div className="space-y-5">
                    <div>
                      <Label className="text-base font-bold text-foreground">Can you ship printed parts?</Label>
                      <p className="text-sm text-muted-foreground mt-1 mb-3">Optional — some projects need parts shipped to assembly points.</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id="canShip"
                        checked={formData.canShip}
                        onCheckedChange={(v) => updateField("canShip", !!v)}
                      />
                      <Label htmlFor="canShip" className="text-sm font-medium text-foreground cursor-pointer">
                        Yes, I can post parts
                      </Label>
                    </div>
                    <AnimatePresence>
                      {formData.canShip && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Input
                            placeholder="Preferred carrier (e.g., USPS, FedEx)"
                            value={formData.shippingCarrier}
                            onChange={(e) => updateField("shippingCarrier", e.target.value)}
                            className="text-base py-5"
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {currentStep === 6 && (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-base font-bold text-foreground">Activate your contribution</Label>
                      <p className="text-sm text-muted-foreground mt-1 mb-3">
                        Enter your email to receive your unique contributor link and project assignments.
                      </p>
                    </div>
                    <Input
                      type="email"
                      placeholder="your.email@example.com"
                      value={formData.email}
                      onChange={(e) => updateField("email", e.target.value)}
                      className="text-base py-5"
                      autoFocus
                    />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
              <Button
                variant="ghost"
                onClick={handleBack}
                disabled={currentStep === 1}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back
              </Button>

              <div className="text-xs text-muted-foreground">
                {currentStep} of {steps.length}
              </div>

              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="bg-accent text-accent-foreground hover:bg-emerald-light btn-lift font-semibold"
              >
                {currentStep === 6 ? "Activate" : "Next"}
                {currentStep < 6 && <ArrowRight className="w-4 h-4 ml-1" />}
                {currentStep === 6 && <Check className="w-4 h-4 ml-1" />}
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
