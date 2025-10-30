import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/Logo";
import { FileText, Lock, Shield } from "lucide-react";

export default function LandingPage() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a2332] to-[#2a3f5f] flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full p-8 md:p-12 text-center space-y-8">
        <div className="flex justify-center">
          <Logo className="h-16" />
        </div>

        <div className="space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            Sistema de Contratos ARVEN
          </h1>
          <p className="text-lg text-muted-foreground">
            Sistema privado de gestão de contratos
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 py-8">
          <div className="flex flex-col items-center gap-3">
            <div className="p-4 rounded-full bg-primary/10">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-semibold">Acesso Restrito</h3>
            <p className="text-sm text-muted-foreground">
              Apenas usuários autorizados podem acessar o sistema
            </p>
          </div>

          <div className="flex flex-col items-center gap-3">
            <div className="p-4 rounded-full bg-primary/10">
              <FileText className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-semibold">Gestão Completa</h3>
            <p className="text-sm text-muted-foreground">
              Gerencie todos os contratos em um só lugar
            </p>
          </div>

          <div className="flex flex-col items-center gap-3">
            <div className="p-4 rounded-full bg-primary/10">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-semibold">100% Seguro</h3>
            <p className="text-sm text-muted-foreground">
              Dados protegidos com criptografia e backup
            </p>
          </div>
        </div>

        <div className="pt-4">
          <Button
            size="lg"
            onClick={() => navigate("/login")}
            className="w-full md:w-auto px-8"
            data-testid="button-go-to-login"
          >
            <Lock className="w-5 h-5 mr-2" />
            Acessar Sistema
          </Button>
        </div>

        <p className="text-sm text-muted-foreground pt-4">
          Não tem acesso? Entre em contato com o administrador.
        </p>
      </Card>
    </div>
  );
}
