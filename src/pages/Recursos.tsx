import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ResourceLinks from "@/components/ResourceLinks";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { TMT_3DMOBILITY_URL } from "@/lib/resources";
import { ExternalLink, Printer } from "lucide-react";

const Recursos = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-28 pb-20 px-6">
        <div className="max-w-2xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-black text-foreground mb-2">Recursos para Makers</h1>
              <p className="text-muted-foreground">Tudo o que precisa para imprimir as peças do Toddler Mobility Trainer.</p>
            </div>

            <ResourceLinks className="mb-6" />

            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm mb-6">
              <h2 className="text-sm font-bold text-foreground mb-3 uppercase tracking-wider">Informação Importante</h2>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <Printer className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                  <span>Volume mínimo de impressão: <strong className="text-foreground">256 × 256 × 256 mm</strong></span>
                </li>
                <li className="flex gap-2">
                  <Printer className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                  <span>Materiais necessários: <strong className="text-foreground">PETG</strong> (estrutura) e <strong className="text-foreground">TPU</strong> (peças macias)</span>
                </li>
                <li className="flex gap-2">
                  <ExternalLink className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                  <span>Mais informações em <a href={TMT_3DMOBILITY_URL} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline font-medium">3DMobility.org</a></span>
                </li>
              </ul>
            </div>

            <div className="text-center">
              <Link to="/contribute">
                <Button className="bg-accent text-accent-foreground hover:bg-emerald-light btn-lift font-semibold">
                  Juntar-me à Missão
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Recursos;
