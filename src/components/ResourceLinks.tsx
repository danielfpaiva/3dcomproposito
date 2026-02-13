import { FileText, Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TMT_MAKERWORLD_URL, TMT_MAKER_GUIDE_URL } from "@/lib/resources";

interface ResourceLinksProps {
  variant?: "card" | "inline";
  className?: string;
}

const ResourceLinks = ({ variant = "card", className = "" }: ResourceLinksProps) => {
  if (variant === "inline") {
    return (
      <div className={`flex flex-wrap gap-2 ${className}`}>
        <a href={TMT_MAKER_GUIDE_URL} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm" className="gap-1.5">
            <Download className="w-3.5 h-3.5" /> Guia do Maker (PDF)
          </Button>
        </a>
        <a href={TMT_MAKERWORLD_URL} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm" className="gap-1.5">
            <ExternalLink className="w-3.5 h-3.5" /> Ficheiros STL (MakerWorld)
          </Button>
        </a>
      </div>
    );
  }

  return (
    <div className={`bg-card rounded-2xl border border-border p-6 shadow-sm ${className}`}>
      <h2 className="text-sm font-bold text-foreground mb-1 uppercase tracking-wider flex items-center gap-2">
        <FileText className="w-4 h-4 text-accent" />
        Recursos do Projeto TMT
      </h2>
      <p className="text-xs text-muted-foreground mb-4">
        Guia de impressão e ficheiros STL para o Toddler Mobility Trainer.
      </p>
      <div className="space-y-2">
        <a href={TMT_MAKER_GUIDE_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/60 transition-colors group">
          <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-destructive" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground group-hover:text-accent transition-colors">TMT Maker Guide</p>
            <p className="text-xs text-muted-foreground">Guia completo de impressão e montagem (PDF)</p>
          </div>
          <Download className="w-4 h-4 text-muted-foreground group-hover:text-accent shrink-0" />
        </a>
        <a href={TMT_MAKERWORLD_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/60 transition-colors group">
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
            <ExternalLink className="w-5 h-5 text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground group-hover:text-accent transition-colors">Ficheiros STL — MakerWorld</p>
            <p className="text-xs text-muted-foreground">Download dos modelos 3D e perfis de impressão</p>
          </div>
          <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-accent shrink-0" />
        </a>
      </div>
    </div>
  );
};

export default ResourceLinks;
