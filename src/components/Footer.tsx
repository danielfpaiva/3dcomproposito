import { Heart } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-navy-deep border-t border-navy-light/10 py-10 px-6">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="3D com Propósito" className="w-7 h-7 rounded-md" />
          <span className="text-sm font-semibold text-primary-foreground/70">3D com Propósito</span>
        </Link>

        <p className="text-xs text-primary-foreground/30 flex items-center gap-1">
          Feito com <Heart className="w-3 h-3 text-accent/60" /> para comunidades que constroem juntas
        </p>
      </div>
    </footer>
  );
};

export default Footer;
