import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Loader2, ChevronRight, Pencil, Trash2, X, Check, PackageOpen } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Tables } from "@/integrations/supabase/types";

type Initiative = Tables<"initiatives">;
type InitiativePart = Tables<"initiative_parts">;

const MATERIALS = ["PETG", "PLA", "ABS", "ASA", "TPU", "PC", "Nylon"];
const CATEGORIES = ["Estrutura", "Peças Macias", "Outras"];

const InitiativesList = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Selected initiative for drill-down
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Create initiative form
  const [showCreateInitiative, setShowCreateInitiative] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [saving, setSaving] = useState(false);

  // Edit initiative name inline
  const [editingInitiativeId, setEditingInitiativeId] = useState<string | null>(null);
  const [editingInitiativeName, setEditingInitiativeName] = useState("");

  // Add part form
  const [showAddPart, setShowAddPart] = useState(false);
  const [newPartName, setNewPartName] = useState("");
  const [newPartCategory, setNewPartCategory] = useState("");
  const [newPartMaterial, setNewPartMaterial] = useState("PETG");
  const [newPartFileUrl, setNewPartFileUrl] = useState("");
  const [savingPart, setSavingPart] = useState(false);

  // Edit part inline
  const [editingPartId, setEditingPartId] = useState<string | null>(null);
  const [editingPart, setEditingPart] = useState<Partial<InitiativePart>>({});

  // Confirm delete dialog
  const [confirmDelete, setConfirmDelete] = useState<{ type: "initiative" | "part"; id: string; label: string } | null>(null);

  // Fetch initiatives
  const { data: initiatives = [], isLoading } = useQuery({
    queryKey: ["initiatives"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("initiatives")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Initiative[];
    },
  });

  // Fetch parts for selected initiative
  const { data: parts = [], isLoading: loadingParts } = useQuery({
    queryKey: ["initiative-parts", selectedId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("initiative_parts")
        .select("*")
        .eq("initiative_id", selectedId!)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as InitiativePart[];
    },
    enabled: !!selectedId,
  });

  const selectedInitiative = initiatives.find((i) => i.id === selectedId);

  // Create initiative
  const handleCreateInitiative = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    const { error } = await supabase
      .from("initiatives")
      .insert({ name: newName.trim(), description: newDescription.trim() || null });
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Iniciativa criada!" });
      queryClient.invalidateQueries({ queryKey: ["initiatives"] });
      setNewName("");
      setNewDescription("");
      setShowCreateInitiative(false);
    }
    setSaving(false);
  };

  // Save initiative name inline
  const handleSaveInitiativeName = async (id: string) => {
    if (!editingInitiativeName.trim()) return;
    const { error } = await supabase
      .from("initiatives")
      .update({ name: editingInitiativeName.trim() })
      .eq("id", id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      queryClient.invalidateQueries({ queryKey: ["initiatives"] });
      setEditingInitiativeId(null);
    }
  };

  // Toggle initiative active
  const handleToggleActive = async (initiative: Initiative) => {
    const { error } = await supabase
      .from("initiatives")
      .update({ is_active: !initiative.is_active })
      .eq("id", initiative.id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      queryClient.invalidateQueries({ queryKey: ["initiatives"] });
    }
  };

  // Delete initiative
  const handleDeleteInitiative = async (id: string) => {
    const initiative = initiatives.find((i) => i.id === id);
    setConfirmDelete({ type: "initiative", id, label: initiative?.name ?? "esta iniciativa" });
  };

  // Add part
  const handleAddPart = async () => {
    if (!newPartName.trim() || !selectedId) return;
    setSavingPart(true);
    const { error } = await supabase.from("initiative_parts").insert({
      initiative_id: selectedId,
      part_name: newPartName.trim(),
      category: newPartCategory || null,
      material: newPartMaterial || null,
      file_url: newPartFileUrl.trim() || null,
      sort_order: parts.length,
    });
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Peça adicionada!" });
      queryClient.invalidateQueries({ queryKey: ["initiative-parts", selectedId] });
      setNewPartName("");
      setNewPartCategory("");
      setNewPartMaterial("PETG");
      setNewPartFileUrl("");
      setShowAddPart(false);
    }
    setSavingPart(false);
  };

  // Save part inline
  const handleSavePart = async (partId: string) => {
    const { error } = await supabase
      .from("initiative_parts")
      .update(editingPart)
      .eq("id", partId);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      queryClient.invalidateQueries({ queryKey: ["initiative-parts", selectedId] });
      setEditingPartId(null);
      setEditingPart({});
    }
  };

  // Delete part
  const handleDeletePart = async (partId: string) => {
    const part = parts.find((p) => p.id === partId);
    setConfirmDelete({ type: "part", id: partId, label: part?.part_name ?? "esta peça" });
  };

  // Execute confirmed delete
  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;
    if (confirmDelete.type === "initiative") {
      const { error } = await supabase.from("initiatives").delete().eq("id", confirmDelete.id);
      if (error) {
        toast({ title: "Erro", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Iniciativa eliminada." });
        queryClient.invalidateQueries({ queryKey: ["initiatives"] });
        if (selectedId === confirmDelete.id) setSelectedId(null);
      }
    } else {
      const { error } = await supabase.from("initiative_parts").delete().eq("id", confirmDelete.id);
      if (error) {
        toast({ title: "Erro", description: error.message, variant: "destructive" });
      } else {
        queryClient.invalidateQueries({ queryKey: ["initiative-parts", selectedId] });
      }
    }
    setConfirmDelete(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // --- PARTS VIEW ---
  if (selectedId && selectedInitiative) {
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setSelectedId(null); setShowAddPart(false); }}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            ← Iniciativas
          </button>
          <span className="text-muted-foreground">/</span>
          <span className="text-sm font-medium">{selectedInitiative.name}</span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-foreground">{selectedInitiative.name}</h3>
            {selectedInitiative.description && (
              <p className="text-sm text-muted-foreground mt-0.5">{selectedInitiative.description}</p>
            )}
          </div>
          <Button size="sm" onClick={() => setShowAddPart(true)} className="gap-1.5">
            <Plus className="w-4 h-4" /> Adicionar Peça
          </Button>
        </div>

        {/* Add part form */}
        {showAddPart && (
          <div className="bg-muted/30 border border-border rounded-xl p-4 space-y-3">
            <h4 className="text-sm font-medium">Nova Peça</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs text-muted-foreground mb-1 block">Nome da peça *</label>
                <Input
                  placeholder="ex: Pega Direita"
                  value={newPartName}
                  onChange={(e) => setNewPartName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Categoria</label>
                <select
                  value={newPartCategory}
                  onChange={(e) => setNewPartCategory(e.target.value)}
                  className="w-full h-9 px-3 text-sm border border-input rounded-md bg-background"
                >
                  <option value="">— Sem categoria —</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Material</label>
                <select
                  value={newPartMaterial}
                  onChange={(e) => setNewPartMaterial(e.target.value)}
                  className="w-full h-9 px-3 text-sm border border-input rounded-md bg-background"
                >
                  {MATERIALS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-xs text-muted-foreground mb-1 block">URL do ficheiro (opcional)</label>
                <Input
                  placeholder="https://drive.google.com/..."
                  value={newPartFileUrl}
                  onChange={(e) => setNewPartFileUrl(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setShowAddPart(false)}>Cancelar</Button>
              <Button size="sm" onClick={handleAddPart} disabled={savingPart || !newPartName.trim()}>
                {savingPart ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar"}
              </Button>
            </div>
          </div>
        )}

        {/* Parts list */}
        {loadingParts ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : parts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <PackageOpen className="w-8 h-8 mx-auto mb-3 opacity-40" />
            <p className="text-sm">Sem peças ainda. Adiciona a primeira peça acima.</p>
          </div>
        ) : (
          <div className="border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Nome</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Categoria</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Material</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Ficheiro</th>
                  <th className="px-4 py-2.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {parts.map((part) => (
                  <tr key={part.id} className="bg-card hover:bg-muted/20 transition-colors">
                    {editingPartId === part.id ? (
                      <>
                        <td className="px-4 py-2">
                          <Input
                            value={editingPart.part_name ?? part.part_name}
                            onChange={(e) => setEditingPart((p) => ({ ...p, part_name: e.target.value }))}
                            className="h-7 text-sm"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <select
                            value={editingPart.category ?? part.category ?? ""}
                            onChange={(e) => setEditingPart((p) => ({ ...p, category: e.target.value || null }))}
                            className="w-full h-7 px-2 text-sm border border-input rounded-md bg-background"
                          >
                            <option value="">—</option>
                            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </td>
                        <td className="px-4 py-2">
                          <select
                            value={editingPart.material ?? part.material ?? ""}
                            onChange={(e) => setEditingPart((p) => ({ ...p, material: e.target.value || null }))}
                            className="w-full h-7 px-2 text-sm border border-input rounded-md bg-background"
                          >
                            <option value="">—</option>
                            {MATERIALS.map((m) => <option key={m} value={m}>{m}</option>)}
                          </select>
                        </td>
                        <td className="px-4 py-2">
                          <Input
                            value={editingPart.file_url ?? part.file_url ?? ""}
                            onChange={(e) => setEditingPart((p) => ({ ...p, file_url: e.target.value || null }))}
                            className="h-7 text-sm"
                            placeholder="https://..."
                          />
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-1 justify-end">
                            <button onClick={() => handleSavePart(part.id)} className="p-1 text-success hover:bg-success/10 rounded">
                              <Check className="w-4 h-4" />
                            </button>
                            <button onClick={() => { setEditingPartId(null); setEditingPart({}); }} className="p-1 text-muted-foreground hover:bg-muted rounded">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3 font-medium">{part.part_name}</td>
                        <td className="px-4 py-3 text-muted-foreground">{part.category ?? "—"}</td>
                        <td className="px-4 py-3">
                          {part.material && <Badge variant="secondary" className="text-[10px]">{part.material}</Badge>}
                        </td>
                        <td className="px-4 py-3">
                          {part.file_url ? (
                            <a href={part.file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-600 hover:underline">
                              Ver ficheiro
                            </a>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 justify-end">
                            <button
                              onClick={() => { setEditingPartId(part.id); setEditingPart({}); }}
                              className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeletePart(part.id)}
                              className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      {/* Confirm delete dialog (parts view) */}
      <AlertDialog open={!!confirmDelete} onOpenChange={(open) => { if (!open) setConfirmDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tens a certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDelete?.type === "initiative"
                ? `Esta ação irá eliminar a iniciativa "${confirmDelete?.label}" e todas as suas peças. Esta operação não pode ser revertida.`
                : `Esta ação irá eliminar a peça "${confirmDelete?.label}". Esta operação não pode ser revertida.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    );
  }

  // --- INITIATIVES LIST VIEW ---
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground">Iniciativas</h3>
          <p className="text-sm text-muted-foreground mt-0.5">Templates de projetos reutilizáveis</p>
        </div>
        <Button size="sm" onClick={() => setShowCreateInitiative(true)} className="gap-1.5">
          <Plus className="w-4 h-4" /> Nova Iniciativa
        </Button>
      </div>

      {/* Create initiative form */}
      {showCreateInitiative && (
        <div className="bg-muted/30 border border-border rounded-xl p-4 space-y-3">
          <h4 className="text-sm font-medium">Nova Iniciativa</h4>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Nome *</label>
            <Input
              placeholder="ex: Toddler Mobility Trainer (TMT)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateInitiative()}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Descrição (opcional)</label>
            <Input
              placeholder="Breve descrição da iniciativa"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => { setShowCreateInitiative(false); setNewName(""); setNewDescription(""); }}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleCreateInitiative} disabled={saving || !newName.trim()}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Criar"}
            </Button>
          </div>
        </div>
      )}

      {/* Initiatives list */}
      {initiatives.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <PackageOpen className="w-8 h-8 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Sem iniciativas ainda. Cria a primeira acima.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {initiatives.map((initiative) => (
            <div key={initiative.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
              {/* Name — inline edit */}
              <div className="flex-1 min-w-0">
                {editingInitiativeId === initiative.id ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={editingInitiativeName}
                      onChange={(e) => setEditingInitiativeName(e.target.value)}
                      className="h-7 text-sm"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveInitiativeName(initiative.id);
                        if (e.key === "Escape") setEditingInitiativeId(null);
                      }}
                      autoFocus
                    />
                    <button onClick={() => handleSaveInitiativeName(initiative.id)} className="p-1 text-success hover:bg-success/10 rounded">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => setEditingInitiativeId(null)} className="p-1 text-muted-foreground hover:bg-muted rounded">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">{initiative.name}</span>
                    {!initiative.is_active && <Badge variant="secondary" className="text-[10px]">Inativa</Badge>}
                  </div>
                )}
                {initiative.description && (
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{initiative.description}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => { setEditingInitiativeId(initiative.id); setEditingInitiativeName(initiative.name); }}
                  className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
                  title="Editar nome"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleToggleActive(initiative)}
                  className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors text-xs font-medium"
                  title={initiative.is_active ? "Desativar" : "Ativar"}
                >
                  {initiative.is_active ? "Desativar" : "Ativar"}
                </button>
                <button
                  onClick={() => handleDeleteInitiative(initiative.id)}
                  className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors"
                  title="Eliminar"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setSelectedId(initiative.id)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors"
                >
                  Ver peças <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Confirm delete dialog */}
      <AlertDialog open={!!confirmDelete} onOpenChange={(open) => { if (!open) setConfirmDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tens a certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDelete?.type === "initiative"
                ? `Esta ação irá eliminar a iniciativa "${confirmDelete?.label}" e todas as suas peças. Esta operação não pode ser revertida.`
                : `Esta ação irá eliminar a peça "${confirmDelete?.label}". Esta operação não pode ser revertida.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default InitiativesList;
