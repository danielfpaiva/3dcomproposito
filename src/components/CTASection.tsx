import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const CTASection = () => {
  return (
    <section className="py-20 px-6 bg-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="max-w-3xl mx-auto text-center bg-navy-gradient rounded-3xl p-12 relative overflow-hidden"
      >
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, hsl(0 0% 100%) 1px, transparent 0)`,
          backgroundSize: '32px 32px',
        }} />
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 mb-6">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span className="text-xs font-semibold text-emerald-light">Cada impressora faz a diferença</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-primary-foreground mb-4">
            Pronto para fazer a diferença?
          </h2>
          <p className="text-primary-foreground/60 mb-8 max-w-lg mx-auto leading-relaxed">
            Registe a sua impressora 3D, partilhe a sua disponibilidade e seja associado
            a projetos de cadeiras de rodas que precisam das suas competências.
          </p>

          <Link to="/contribute">
            <Button
              size="lg"
              className="bg-accent text-accent-foreground hover:bg-emerald-light btn-lift font-bold text-base px-8 py-6 rounded-xl glow-accent"
            >
              Juntar-me à Missão
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </motion.div>
    </section>
  );
};

export default CTASection;
