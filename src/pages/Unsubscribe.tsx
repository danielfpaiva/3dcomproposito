import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, Loader2, UserX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Unsubscribe = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [contributor, setContributor] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [deactivating, setDeactivating] = useState(false);
  const [deactivated, setDeactivated] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Token inválido. Verifique o link no email.");
      setLoading(false);
      return;
    }

    const fetchContributor = async () => {
      const { data, error: fetchError } = await supabase
        .from("contributors")
        .select("id, name, email, is_active")
        .eq("token", token)
        .maybeSingle();

      if (fetchError || !data) {
        setError("Voluntário não encontrado. Verifique o link.");
      } else {
        setContributor(data);
        if (data.is_active === false) {
          setDeactivated(true);
        }
      }
      setLoading(false);
    };

    fetchContributor();
  }, [token]);

  const handleDeactivate = async () => {
    if (!token || !contributor) return;

    setDeactivating(true);
    const { error: updateError } = await supabase
      .from("contributors")
      .update({ is_active: false })
      .eq("token", token);

    if (updateError) {
      toast({
        title: "Erro ao desativar conta",
        description: updateError.message,
        variant: "destructive",
      });
    } else {
      setDeactivated(true);
      toast({
        title: "Conta desativada",
        description: "A sua conta de voluntário foi desativada com sucesso.",
      });
    }
    setDeactivating(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-gradient flex items-center justify-center px-6">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-accent mx-auto mb-4" />
          <p className="text-primary-foreground">A carregar...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-navy-gradient flex items-center justify-center px-6">
        <div className="w-full max-w-md bg-card rounded-2xl border border-border p-8 text-center">
          <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-black text-foreground mb-2">Erro</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (deactivated) {
    return (
      <div className="min-h-screen bg-navy-gradient flex items-center justify-center px-6">
        <div className="w-full max-w-md bg-card rounded-2xl border border-border p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-black text-foreground mb-2">Conta Desativada</h1>
          <p className="text-muted-foreground mb-6">
            A sua conta de voluntário <strong>{contributor?.name}</strong> foi desativada com sucesso.
          </p>
          <div className="bg-muted/50 rounded-lg p-4 mb-6">
            <p className="text-sm text-muted-foreground">
              <strong>O que isto significa:</strong>
            </p>
            <ul className="text-sm text-muted-foreground mt-2 space-y-1 text-left">
              <li>• Não receberá mais notificações de peças</li>
              <li>• Não aparecerá nas listas de atribuição</li>
              <li>• Pode voltar a ativar a conta contactando-nos</li>
            </ul>
          </div>
          <p className="text-sm text-muted-foreground">
            Para voltar a juntar-se à iniciativa, entre em contacto connosco através de{" "}
            <a href="mailto:geral@3dcomproposito.pt" className="text-accent hover:underline">
              geral@3dcomproposito.pt
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy-gradient flex items-center justify-center px-6">
      <div className="w-full max-w-md bg-card rounded-2xl border border-border p-8">
        <UserX className="w-16 h-16 text-orange-500 mx-auto mb-4" />
        <h1 className="text-2xl font-black text-foreground mb-2 text-center">Sair da Iniciativa</h1>
        <p className="text-muted-foreground mb-6 text-center">
          Olá, <strong>{contributor?.name}</strong>!
        </p>

        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-6">
          <p className="text-sm text-orange-900 dark:text-orange-200 font-medium mb-2">
            ⚠️ Tem a certeza?
          </p>
          <p className="text-sm text-orange-800 dark:text-orange-300">
            Ao desativar a sua conta de voluntário:
          </p>
          <ul className="text-sm text-orange-800 dark:text-orange-300 mt-2 space-y-1">
            <li>• Deixará de receber notificações de peças</li>
            <li>• Não aparecerá nas listas de atribuição</li>
            <li>• As peças atualmente atribuídas serão realocadas</li>
          </ul>
        </div>

        <div className="bg-muted/50 rounded-lg p-4 mb-6">
          <p className="text-sm text-muted-foreground">
            <strong>Não se preocupe:</strong>
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Pode sempre voltar a juntar-se à iniciativa mais tarde! Basta contactar-nos e
            reativamos a sua conta.
          </p>
        </div>

        <div className="space-y-3">
          <Button
            onClick={handleDeactivate}
            disabled={deactivating}
            variant="destructive"
            className="w-full font-semibold"
          >
            {deactivating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                A desativar...
              </>
            ) : (
              <>
                <UserX className="w-4 h-4 mr-2" />
                Desativar Conta de Voluntário
              </>
            )}
          </Button>

          <Button
            onClick={() => window.history.back()}
            variant="outline"
            className="w-full"
            disabled={deactivating}
          >
            Cancelar e Voltar
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-6">
          Dúvidas? Contacte{" "}
          <a href="mailto:geral@3dcomproposito.pt" className="text-accent hover:underline">
            geral@3dcomproposito.pt
          </a>
        </p>
      </div>
    </div>
  );
};

export default Unsubscribe;
