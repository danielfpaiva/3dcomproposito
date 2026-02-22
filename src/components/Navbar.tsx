import { Link, useLocation, useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Shield, Heart, Accessibility, FileText, LogIn, LogOut } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  // Check if volunteer is logged in (has token in URL or localStorage)
  const [isVolunteerLoggedIn, setIsVolunteerLoggedIn] = useState(false);
  const [volunteerName, setVolunteerName] = useState<string>("");

  useEffect(() => {
    const token = searchParams.get("token") || localStorage.getItem("volunteer_token");
    const name = localStorage.getItem("volunteer_name");

    if (token && location.pathname === "/portal") {
      setIsVolunteerLoggedIn(true);
      setVolunteerName(name || "");
      // Save token to localStorage for persistence
      if (searchParams.get("token")) {
        localStorage.setItem("volunteer_token", token);
      }
    } else if (location.pathname !== "/portal") {
      setIsVolunteerLoggedIn(false);
    }
  }, [searchParams, location.pathname]);

  const handleVolunteerLogout = () => {
    localStorage.removeItem("volunteer_token");
    localStorage.removeItem("volunteer_name");
    setIsVolunteerLoggedIn(false);
    setVolunteerName("");
    navigate("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-navy-deep/95 backdrop-blur-md border-b border-navy-light/20">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <img src="/logo.png" alt="3D com Propósito" className="w-9 h-9 rounded-lg group-hover:scale-105 transition-transform duration-200" />
          <span className="text-lg font-bold text-primary-foreground tracking-tight">
            3D com <span className="text-accent font-medium">Propósito</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          <Link to="/">
            <Button variant="ghost" size="sm" className={`text-primary-foreground/70 hover:text-primary-foreground hover:bg-navy-light/30 ${isActive("/") ? "text-primary-foreground bg-navy-light/20" : ""}`}>
              Início
            </Button>
          </Link>
          <Link to="/auth">
            <Button variant="ghost" size="sm" className={`text-primary-foreground/70 hover:text-primary-foreground hover:bg-navy-light/30 ${isActive("/auth") || isActive("/admin") ? "text-primary-foreground bg-navy-light/20" : ""}`}>
              <Shield className="w-3.5 h-3.5 mr-1" /> Organizadores
            </Button>
          </Link>
          <Link to="/donate">
            <Button variant="ghost" size="sm" className={`text-primary-foreground/70 hover:text-primary-foreground hover:bg-navy-light/30 ${isActive("/donate") ? "text-primary-foreground bg-navy-light/20" : ""}`}>
              <Heart className="w-3.5 h-3.5 mr-1" /> Doar
            </Button>
          </Link>
          <Link to="/request">
            <Button variant="ghost" size="sm" className={`text-primary-foreground/70 hover:text-primary-foreground hover:bg-navy-light/30 ${isActive("/request") ? "text-primary-foreground bg-navy-light/20" : ""}`}>
              <Accessibility className="w-3.5 h-3.5 mr-1" /> Pedir Ajuda
            </Button>
          </Link>
          <Link to="/recursos">
            <Button variant="ghost" size="sm" className={`text-primary-foreground/70 hover:text-primary-foreground hover:bg-navy-light/30 ${isActive("/recursos") ? "text-primary-foreground bg-navy-light/20" : ""}`}>
              <FileText className="w-3.5 h-3.5 mr-1" /> Recursos
            </Button>
          </Link>
          {isVolunteerLoggedIn ? (
            <Button
              onClick={handleVolunteerLogout}
              variant="ghost"
              size="sm"
              className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-navy-light/30"
            >
              <LogOut className="w-3.5 h-3.5 mr-1" /> Sair
            </Button>
          ) : (
            <>
              <Link to="/portal">
                <Button variant="ghost" size="sm" className={`text-primary-foreground/70 hover:text-primary-foreground hover:bg-navy-light/30 ${isActive("/portal") ? "text-primary-foreground bg-navy-light/20" : ""}`}>
                  <LogIn className="w-3.5 h-3.5 mr-1" /> Entrar
                </Button>
              </Link>
              <Link to="/contribute">
                <Button size="sm" className="bg-accent text-accent-foreground hover:bg-emerald-light btn-lift font-semibold">
                  Juntar-me à Missão
                </Button>
              </Link>
            </>
          )}
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
                <Button variant="ghost" className="w-full justify-start text-primary-foreground/70 hover:text-primary-foreground hover:bg-navy-light/30">Início</Button>
              </Link>
              <Link to="/auth" onClick={() => setMobileOpen(false)}>
                <Button variant="ghost" className="w-full justify-start text-primary-foreground/70 hover:text-primary-foreground hover:bg-navy-light/30">
                  <Shield className="w-4 h-4 mr-2" /> Organizadores
                </Button>
              </Link>
              <Link to="/donate" onClick={() => setMobileOpen(false)}>
                <Button variant="ghost" className="w-full justify-start text-primary-foreground/70 hover:text-primary-foreground hover:bg-navy-light/30">
                  <Heart className="w-4 h-4 mr-2" /> Doar
                </Button>
              </Link>
              <Link to="/request" onClick={() => setMobileOpen(false)}>
                <Button variant="ghost" className="w-full justify-start text-primary-foreground/70 hover:text-primary-foreground hover:bg-navy-light/30">
                  <Accessibility className="w-4 h-4 mr-2" /> Pedir Ajuda
                </Button>
              </Link>
              <Link to="/recursos" onClick={() => setMobileOpen(false)}>
                <Button variant="ghost" className="w-full justify-start text-primary-foreground/70 hover:text-primary-foreground hover:bg-navy-light/30">
                  <FileText className="w-4 h-4 mr-2" /> Recursos
                </Button>
              </Link>
              {isVolunteerLoggedIn ? (
                <Button
                  onClick={() => {
                    handleVolunteerLogout();
                    setMobileOpen(false);
                  }}
                  variant="ghost"
                  className="w-full justify-start text-primary-foreground/70 hover:text-primary-foreground hover:bg-navy-light/30"
                >
                  <LogOut className="w-4 h-4 mr-2" /> Sair
                </Button>
              ) : (
                <>
                  <Link to="/portal" onClick={() => setMobileOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start text-primary-foreground/70 hover:text-primary-foreground hover:bg-navy-light/30">
                      <LogIn className="w-4 h-4 mr-2" /> Entrar
                    </Button>
                  </Link>
                  <Link to="/contribute" onClick={() => setMobileOpen(false)}>
                    <Button className="w-full bg-accent text-accent-foreground hover:bg-emerald-light font-semibold">Juntar-me à Missão</Button>
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
