import { Printer, Heart } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-navy-deep border-t border-navy-light/10 py-10 px-6">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-accent/20 flex items-center justify-center">
            <Printer className="w-4 h-4 text-accent" />
          </div>
          <span className="text-sm font-semibold text-primary-foreground/70">PrintImpact Connect</span>
        </Link>

        <p className="text-xs text-primary-foreground/30 flex items-center gap-1">
          Made with <Heart className="w-3 h-3 text-accent/60" /> for communities that build together
        </p>
      </div>
    </footer>
  );
};

export default Footer;
