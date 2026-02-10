import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { Printer, LogIn } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    if (isLogin) {
      const { error } = await signIn(email, password);
      if (error) {
        toast({ title: "Falha no login", description: error.message, variant: "destructive" });
      } else {
        navigate("/admin");
      }
    } else {
      const { error } = await signUp(email, password, fullName);
      if (error) {
        toast({ title: "Falha no registo", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Verifique o seu email", description: "Enviámos-lhe um link de confirmação." });
      }
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-navy-gradient flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center mx-auto mb-4">
            <Printer className="w-6 h-6 text-accent-foreground" />
          </div>
          <h1 className="text-2xl font-black text-primary-foreground">
            {isLogin ? "Bem-vindo de volta, Comandante" : "Junte-se ao Centro de Comando"}
          </h1>
          <p className="text-sm text-primary-foreground/50 mt-1">
            {isLogin ? "Inicie sessão para gerir missões" : "Crie a sua conta de organizador"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card rounded-2xl border border-border p-6 space-y-4">
          {!isLogin && (
            <div>
              <Label htmlFor="fullName">Nome Completo</Label>
              <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="O seu nome" required />
            </div>
          )}
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@exemplo.com" required />
          </div>
          <div>
            <Label htmlFor="password">Palavra-passe</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
          </div>
          <Button type="submit" disabled={submitting} className="w-full bg-accent text-accent-foreground hover:bg-emerald-light btn-lift font-semibold">
            <LogIn className="w-4 h-4 mr-2" />
            {isLogin ? "Entrar" : "Criar Conta"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            {isLogin ? "Precisa de uma conta?" : "Já tem conta?"}{" "}
            <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-accent font-medium hover:underline">
              {isLogin ? "Registar" : "Entrar"}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Auth;
