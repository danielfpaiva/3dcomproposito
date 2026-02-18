import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, UserPlus, Copy, Mail, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const PORTAL_BASE = "https://www.3dcomproposito.pt";

interface Contributor {
  id: string;
  name: string;
  region?: string;
  email?: string;
  token?: string;
}

interface Project {
  id: string;
  name: string;
  status: string;
}

interface Part {
  id: string;
  project_id: string;
  part_name: string;
  category?: string | null;
  material?: string | null;
  status: string;
  assigned_contributor_id: string | null;
}

interface AllocateVolunteerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contributor: Contributor | null;
  projects: Project[];
  parts: Part[];
}

const materialColor: Record<string, string> = {
  PETG: "bg-primary/10 text-primary",
  TPU: "bg-amber-100 text-amber-700",
};

const AllocateVolunteerDialog = ({
  open,
  onOpenChange,
  contributor,
  projects,
  parts,
}: AllocateVolunteerDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedPartIds, setSelectedPartIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [allocated, setAllocated] = useState(false);
  const [copied, setCopied] = useState(false);

  const projectParts = useMemo(() => {
    if (!selectedProjectId) return [];
    return parts.filter((p) => p.project_id === selectedProjectId);
  }, [parts, selectedProjectId]);

  const groupedParts = useMemo(() => {
    const byCategory = {
      Estrutura: projectParts.filter((p) => p.category === "Estrutura"),
      "Peças Macias": projectParts.filter((p) => p.category === "Peças Macias"),
      Outras: projectParts.filter(
        (p) => !p.category || !["Estrutura", "Peças Macias"].includes(p.category)
      ),
    };
    return byCategory;
  }, [projectParts]);

  const togglePart = (partId: string) => {
    setSelectedPartIds((prev) => {
      const next = new Set(prev);
      if (next.has(partId)) next.delete(partId);
      else next.add(partId);
      return next;
    });
  };

  const selectAllInProject = () => {
    if (projectParts.length === 0) return;
    setSelectedPartIds((prev) => {
      const next = new Set(prev);
      projectParts.forEach((p) => next.add(p.id));
      return next;
    });
  };

  const clearSelection = () => setSelectedPartIds(new Set());

  const handleOpenChange = (next: boolean) => {
    // Reset state both on open and close
    setSelectedProjectId(null);
    setSelectedPartIds(new Set());
    setAllocated(false);
    setCopied(false);
    onOpenChange(next);
  };

  const portalUrl = contributor?.token
    ? `${PORTAL_BASE}/portal?token=${encodeURIComponent(contributor.token)}`
    : "";

  const copyPortalLink = async () => {
    if (!portalUrl) return;
    try {
      await navigator.clipboard.writeText(portalUrl);
      setCopied(true);
      toast({ title: "Link copiado", description: "Pode colar no email ou mensagem ao voluntário." });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Erro", description: "Não foi possível copiar.", variant: "destructive" });
    }
  };

  const openMailto = () => {
    if (!contributor?.email || !portalUrl) return;
    const subject = encodeURIComponent("Foi-lhe atribuída uma peça — 3D com Propósito");
    const body = encodeURIComponent(
      `Olá ${contributor.name},\n\nFoi-lhe atribuída uma ou mais peças no projeto de impressão 3D solidária.\n\nAceda ao seu portal aqui:\n${portalUrl}\n\nObrigado,\n3D com Propósito`
    );
    window.location.href = `mailto:${contributor.email}?subject=${subject}&body=${body}`;
  };

  const handleSave = async () => {
    if (!contributor || selectedPartIds.size === 0) return;
    setSaving(true);
    const partIds = Array.from(selectedPartIds);
    const { error } = await supabase
      .from("parts")
      .update({
        assigned_contributor_id: contributor.id,
        status: "assigned",
      })
      .in("id", partIds);

    if (error) {
      toast({
        title: "Erro ao atribuir",
        description: error.message,
        variant: "destructive",
      });
      setSaving(false);
      return;
    }

    queryClient.invalidateQueries({ queryKey: ["admin-parts"] });
    queryClient.invalidateQueries({ queryKey: ["admin-projects"] });

    // Send email notification
    const { error: emailError } = await supabase.functions.invoke("notify-part-allocated", {
      body: { contributor_id: contributor.id, part_ids: partIds },
      headers: {
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
    });
    if (emailError) {
      console.error("notify-part-allocated error:", emailError);
      toast({ title: "Aviso", description: "Atribuição guardada mas o email não foi enviado: " + emailError.message, variant: "destructive" });
    }

    setSaving(false);
    setAllocated(true);
  };

  if (!contributor) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md sm:max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-accent" />
            {allocated ? "Link do portal" : "Atribuir voluntário a peças"}
          </DialogTitle>
        </DialogHeader>

        {allocated ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">{contributor.name}</strong> foi atribuído. Envie o link do portal ao voluntário (por email, WhatsApp, etc.).
            </p>
            {portalUrl ? (
              <>
                <div className="p-3 rounded-xl bg-muted/50 border border-border break-all text-xs text-foreground font-mono">
                  {portalUrl}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={copyPortalLink}
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? "Copiado" : "Copiar link"}
                  </Button>
                  {contributor.email && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={openMailto}
                    >
                      <Mail className="w-3.5 h-3.5" />
                      Abrir email
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  &quot;Abrir email&quot; abre o seu cliente de email com o destinatário e uma mensagem sugerida (pode editar antes de enviar).
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                O link do portal não está disponível para este voluntário. Pode copiá-lo na lista de voluntários (ícone de link).
              </p>
            )}
            <DialogFooter>
              <Button onClick={() => handleOpenChange(false)}>Fechar</Button>
            </DialogFooter>
          </div>
        ) : (
          <>
        <div className="space-y-4 flex-1 min-h-0 flex flex-col">
          <div className="p-3 rounded-xl bg-muted/50 border border-border">
            <p className="text-sm font-medium text-foreground">{contributor.name}</p>
            {contributor.region && (
              <Badge variant="secondary" className="mt-1 text-xs">
                {contributor.region}
              </Badge>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Projeto
            </Label>
            <Select
              value={selectedProjectId ?? ""}
              onValueChange={(v) => {
                setSelectedProjectId(v || null);
                setSelectedPartIds(new Set());
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecionar projeto..." />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedProjectId && (
            <>
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Peças a atribuir
                </Label>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={selectAllInProject}
                  >
                    Todas
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={clearSelection}
                  >
                    Limpar
                  </Button>
                </div>
              </div>
              <ScrollArea className="border border-border rounded-xl h-[220px] p-2">
                <div className="space-y-4">
                  {(
                    [
                      ["Estrutura (PETG)", groupedParts.Estrutura],
                      ["Peças Macias (TPU)", groupedParts["Peças Macias"]],
                      ["Outras", groupedParts.Outras],
                    ] as const
                  ).map(([title, groupParts]) =>
                    groupParts.length === 0 ? null : (
                      <div key={title}>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                          {title}
                        </p>
                        <div className="space-y-1">
                          {groupParts.map((part) => (
                            <label
                              key={part.id}
                              className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                            >
                              <Checkbox
                                checked={selectedPartIds.has(part.id)}
                                onCheckedChange={() => togglePart(part.id)}
                              />
                              <span className="text-sm text-foreground truncate flex-1">
                                {part.part_name}
                              </span>
                              {part.material && (
                                <Badge
                                  className={`text-[10px] shrink-0 ${materialColor[part.material] ?? ""}`}
                                >
                                  {part.material}
                                </Badge>
                              )}
                              {part.assigned_contributor_id && part.assigned_contributor_id !== contributor.id && (
                                <span className="text-[10px] text-amber-600 dark:text-amber-400 shrink-0">
                                  (atribuído)
                                </span>
                              )}
                            </label>
                          ))}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </ScrollArea>
            </>
          )}
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || selectedPartIds.size === 0}
            className="bg-accent text-accent-foreground hover:bg-emerald-light"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin mr-1" />
            ) : null}
            Atribuir {selectedPartIds.size > 0 ? `(${selectedPartIds.size})` : ""}
          </Button>
        </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AllocateVolunteerDialog;
