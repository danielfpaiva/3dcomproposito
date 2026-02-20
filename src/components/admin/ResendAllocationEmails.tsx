import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Mail, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ResendAllocationEmailsProps {
  projectId: string;
  projectName?: string;
}

/**
 * Component to resend allocation emails to volunteers in a specific project.
 * Only sends to volunteers who have parts assigned in this project.
 */
export const ResendAllocationEmails = ({ projectId, projectName }: ResendAllocationEmailsProps) => {
  const { toast } = useToast();
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [results, setResults] = useState<{ success: number; failed: number }>({ success: 0, failed: 0 });

  // Fetch allocated parts for THIS PROJECT ONLY, grouped by contributor
  const { data: allocations = [], isLoading } = useQuery({
    queryKey: ["allocated-parts-for-resend", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_instance_parts")
        .select("assigned_contributor_id, id, part_name")
        .eq("project_instance_id", projectId)
        .not("assigned_contributor_id", "is", null);

      if (error) throw error;

      // Group by contributor
      const grouped = (data || []).reduce((acc: Record<string, string[]>, row) => {
        const contributorId = row.assigned_contributor_id!;
        if (!acc[contributorId]) {
          acc[contributorId] = [];
        }
        acc[contributorId].push(row.id);
        return acc;
      }, {});

      return Object.entries(grouped).map(([contributorId, partIds]) => ({
        contributorId,
        partIds,
        partsCount: partIds.length,
      }));
    },
    enabled: false, // Only fetch when user opens dialog
  });

  const handleResendAll = async () => {
    if (!allocations.length) {
      toast({ title: "Nenhuma alocação encontrada", variant: "default" });
      return;
    }

    setSending(true);
    setProgress({ current: 0, total: allocations.length });
    setResults({ success: 0, failed: 0 });

    let successCount = 0;
    let failedCount = 0;

    for (let i = 0; i < allocations.length; i++) {
      const { contributorId, partIds } = allocations[i];
      setProgress({ current: i + 1, total: allocations.length });

      try {
        const { error } = await supabase.functions.invoke("notify-part-allocated", {
          body: { contributor_id: contributorId, part_ids: partIds },
        });

        if (error) {
          console.error(`Failed for contributor ${contributorId}:`, error);
          failedCount++;
        } else {
          successCount++;
        }
      } catch (err) {
        console.error(`Exception for contributor ${contributorId}:`, err);
        failedCount++;
      }

      setResults({ success: successCount, failed: failedCount });

      // Delay 1s between emails to avoid rate limiting
      if (i < allocations.length - 1) {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }

    setSending(false);
    toast({
      title: "Envio concluído!",
      description: `✅ ${successCount} enviados, ❌ ${failedCount} falharam`,
      variant: successCount > 0 ? "default" : "destructive",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        A carregar...
      </div>
    );
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Mail className="w-4 h-4" />
          Reenviar E-mails de Alocação
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Reenviar e-mails de alocação?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              Este script vai enviar e-mails aos voluntários que têm peças atribuídas{" "}
              {projectName && (
                <>
                  no projeto <strong>{projectName}</strong>
                </>
              )}.
            </p>
            <p>
              Total: <strong>{allocations.length} voluntário{allocations.length !== 1 ? 's' : ''}</strong> receberá
              {allocations.length !== 1 ? 'ão' : ''} notificação com as suas peças alocadas.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-900 text-sm">
              <AlertCircle className="w-4 h-4 inline mr-1" />
              <strong>Atenção:</strong> Voluntários que já receberam e-mail receberão novamente.
            </div>
            {sending && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm space-y-2">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  <span>
                    A enviar... {progress.current}/{progress.total}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1 text-green-700">
                    <CheckCircle2 className="w-3 h-3" />
                    {results.success} enviados
                  </span>
                  <span className="flex items-center gap-1 text-red-700">
                    <AlertCircle className="w-3 h-3" />
                    {results.failed} falharam
                  </span>
                </div>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={sending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleResendAll} disabled={sending || !allocations.length}>
            {sending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                A enviar...
              </>
            ) : (
              <>
                <Mail className="w-4 h-4 mr-2" />
                Enviar {allocations.length} e-mails
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
