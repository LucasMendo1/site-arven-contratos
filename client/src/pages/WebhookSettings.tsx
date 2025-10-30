import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Loader2, Webhook, CheckCircle2, AlertCircle } from "lucide-react";

interface WebhookConfig {
  id?: string;
  url: string;
  isActive: string;
  updatedAt?: string;
}

export default function WebhookSettings() {
  const { toast } = useToast();
  const [webhookUrl, setWebhookUrl] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { data: config, isLoading } = useQuery<WebhookConfig>({
    queryKey: ["/api/webhook"],
  });

  useEffect(() => {
    if (config) {
      setWebhookUrl(config.url || "");
      setIsActive(config.isActive === "true");
    }
  }, [config]);

  const handleSave = async () => {
    if (!webhookUrl) {
      toast({
        title: "Erro",
        description: "Digite uma URL válida para o webhook",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSaving(true);
      const response = await fetch("/api/webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: webhookUrl,
          isActive: isActive ? "true" : "false",
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao salvar webhook");
      }

      queryClient.invalidateQueries({ queryKey: ["/api/webhook"] });

      toast({
        title: "Webhook Configurado",
        description: "As configurações do webhook foram salvas com sucesso",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message || "Não foi possível salvar as configurações",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Configurações de Webhook</h2>
        <p className="text-muted-foreground">
          Configure um webhook para receber notificações quando novos contratos forem enviados
        </p>
      </div>

      <Card className="p-6">
        <div className="space-y-6">
          <div className="flex items-start gap-4 p-4 rounded-lg bg-blue-50 border border-blue-200">
            <Webhook className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium text-blue-900">Como funciona?</p>
              <p className="text-sm text-blue-700">
                Quando um cliente envia um novo contrato, o sistema automaticamente enviará uma
                requisição POST para a URL configurada com os dados do contrato.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="webhook-url">URL do Webhook</Label>
              <Input
                id="webhook-url"
                type="url"
                placeholder="https://seu-servidor.com/webhook"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                data-testid="input-webhook-url"
              />
              <p className="text-xs text-muted-foreground">
                Digite a URL completa que receberá as notificações (deve começar com http:// ou https://)
              </p>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="space-y-0.5">
                <Label htmlFor="webhook-active">Webhook Ativo</Label>
                <p className="text-sm text-muted-foreground">
                  {isActive ? "Webhook está ativo e enviando notificações" : "Webhook está desativado"}
                </p>
              </div>
              <Switch
                id="webhook-active"
                checked={isActive}
                onCheckedChange={setIsActive}
                data-testid="switch-webhook-active"
              />
            </div>
          </div>

          <div className="pt-4 border-t">
            <h3 className="text-sm font-semibold mb-3">Formato dos Dados Enviados</h3>
            <div className="bg-muted p-4 rounded-lg">
              <pre className="text-xs overflow-x-auto">
{`{
  "event": "contract.created",
  "data": {
    "id": "uuid",
    "clientName": "Nome do Cliente",
    "clientPhone": "(00) 00000-0000",
    "contractDuration": "1_year",
    "product": "Core",
    "ticketValue": "R$ 1.500,00",
    "pdfUrl": "/objects/uploads/...",
    "submittedAt": "2025-10-30T..."
  },
  "timestamp": "2025-10-30T..."
}`}
              </pre>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleSave}
              disabled={isSaving || !webhookUrl}
              className="flex-1"
              data-testid="button-save-webhook"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Salvar Configurações
                </>
              )}
            </Button>
          </div>

          {config?.updatedAt && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertCircle className="w-4 h-4" />
              <span>
                Última atualização: {new Date(config.updatedAt).toLocaleString("pt-BR")}
              </span>
            </div>
          )}
        </div>
      </Card>

      <Card className="p-6 bg-amber-50 border-amber-200">
        <h3 className="text-sm font-semibold mb-2 text-amber-900">⚠️ Importante</h3>
        <ul className="space-y-1 text-sm text-amber-800">
          <li>• A URL deve estar acessível publicamente pela internet</li>
          <li>• O endpoint deve aceitar requisições POST com Content-Type: application/json</li>
          <li>• Recomendamos validar o payload recebido antes de processar</li>
          <li>• O webhook será enviado de forma assíncrona (não bloqueia o envio do contrato)</li>
        </ul>
      </Card>
    </div>
  );
}
