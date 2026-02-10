import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Printer, Menu, X, Shield } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-navy-deep/95 backdrop-blur-md border-b border-navy-light/20">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
            <Printer className="w-5 h-5 text-accent-foreground" />
          </div>
          <span className="text-lg font-bold text-primary-foreground tracking-tight">
            PrintImpact <span className="text-accent font-medium">Connect</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          <Link to="/">
            <Button variant="ghost" size="sm" className={`text-primary-foreground/70 hover:text-primary-foreground hover:bg-navy-light/30 ${isActive("/") ? "text-primary-foreground bg-navy-light/20" : ""}`}>
              Painel
            </Button>
          </Link>
          <Link to="/auth">
            <Button variant="ghost" size="sm" className={`text-primary-foreground/70 hover:text-primary-foreground hover:bg-navy-light/30 ${isActive("/auth") || isActive("/admin") ? "text-primary-foreground bg-navy-light/20" : ""}`}>
              <Shield className="w-3.5 h-3.5 mr-1" /> Organizadores
            </Button>
          </Link>
          <Link to="/contribute">
            <Button size="sm" className="bg-accent text-accent-foreground hover:bg-emerald-light btn-lift font-semibold">
              Juntar-me à Missão
            </Button>
          </Link>
        </div>

        <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden text-primary-foreground/70 hover:text-primary-foreground">
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="md:hidden bg-navy-deep border-t border-navy-light/20 overflow-hidden">
            <div className="px-6 py-4 flex flex-col gap-2">
              <Link to="/" onClick={() => setMobileOpen(false)}>
                <Button variant="ghost" className="w-full justify-start text-primary-foreground/70 hover:text-primary-foreground hover:bg-navy-light/30">Painel</Button>
              </Link>
              <Link to="/auth" onClick={() => setMobileOpen(false)}>
                <Button variant="ghost" className="w-full justify-start text-primary-foreground/70 hover:text-primary-foreground hover:bg-navy-light/30">
                  <Shield className="w-4 h-4 mr-2" /> Organizadores
                </Button>
              </Link>
              <Link to="/contribute" onClick={() => setMobileOpen(false)}>
                <Button className="w-full bg-accent text-accent-foreground hover:bg-emerald-light font-semibold">Juntar-me à Missão</Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
