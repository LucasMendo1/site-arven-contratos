import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, CheckCircle2, FileText } from "lucide-react";
import { queryClient } from "@/lib/queryClient";

const contractSchema = z.object({
  clientName: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  clientPhone: z.string().min(10, "Telefone inválido"),
  contractDuration: z.string().min(1, "Selecione a duração"),
  product: z.string().min(1, "Selecione um produto"),
  ticketValue: z.string().min(1, "Digite o valor do ticket"),
});

type ContractForm = z.infer<typeof contractSchema>;

export default function NewContract() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedPdf, setUploadedPdf] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const form = useForm<ContractForm>({
    resolver: zodResolver(contractSchema),
    defaultValues: {
      clientName: "",
      clientPhone: "",
      contractDuration: "",
      product: "",
      ticketValue: "",
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione um arquivo PDF",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploading(true);

      const uploadResponse = await fetch("/api/objects/upload", {
        method: "POST",
      });

      if (!uploadResponse.ok) {
        throw new Error("Falha ao obter URL de upload");
      }

      const { uploadURL, objectPath } = await uploadResponse.json();

      const uploadFileResponse = await fetch(uploadURL, {
        method: "PUT",
        headers: {
          "Content-Type": "application/pdf",
        },
        body: file,
      });

      if (!uploadFileResponse.ok) {
        throw new Error("Falha ao fazer upload do arquivo");
      }

      const aclResponse = await fetch("/api/contracts/pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ objectPath }),
      });

      if (!aclResponse.ok) {
        throw new Error("Falha ao processar PDF");
      }

      const { pdfUrl: finalPdfUrl } = await aclResponse.json();
      setUploadedPdf(finalPdfUrl);

      toast({
        title: "PDF enviado com sucesso",
        description: "O arquivo foi carregado corretamente",
      });
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Erro no upload",
        description: error.message || "Não foi possível fazer upload do PDF",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (data: ContractForm) => {
    if (!uploadedPdf) {
      toast({
        title: "PDF obrigatório",
        description: "Por favor, faça upload do contrato assinado",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch("/api/contracts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          pdfUrl: uploadedPdf,
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao criar contrato");
      }

      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });

      toast({
        title: "Contrato criado com sucesso!",
        description: "O contrato foi registrado no sistema",
      });

      form.reset();
      setUploadedPdf(null);
    } catch (error: any) {
      toast({
        title: "Erro ao criar contrato",
        description: error.message || "Tente novamente mais tarde",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Novo Contrato</h2>
        <p className="text-muted-foreground">
          Preencha os dados do cliente e faça upload do contrato assinado
        </p>
      </div>

      <Card className="p-6">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="clientName">Nome do Cliente *</Label>
              <Input
                id="clientName"
                placeholder="Ex: João Silva"
                {...form.register("clientName")}
                data-testid="input-client-name"
              />
              {form.formState.errors.clientName && (
                <p className="text-sm text-destructive">{form.formState.errors.clientName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientPhone">Telefone *</Label>
              <Input
                id="clientPhone"
                placeholder="(00) 00000-0000"
                {...form.register("clientPhone")}
                data-testid="input-client-phone"
              />
              {form.formState.errors.clientPhone && (
                <p className="text-sm text-destructive">{form.formState.errors.clientPhone.message}</p>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="contractDuration">Duração do Contrato *</Label>
              <Select
                value={form.watch("contractDuration")}
                onValueChange={(value) => form.setValue("contractDuration", value)}
              >
                <SelectTrigger data-testid="select-duration">
                  <SelectValue placeholder="Selecione a duração" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3_months">3 Meses</SelectItem>
                  <SelectItem value="6_months">6 Meses</SelectItem>
                  <SelectItem value="1_year">1 Ano</SelectItem>
                  <SelectItem value="2_years">2 Anos</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.contractDuration && (
                <p className="text-sm text-destructive">{form.formState.errors.contractDuration.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="product">Produto *</Label>
              <Select
                value={form.watch("product")}
                onValueChange={(value) => form.setValue("product", value)}
              >
                <SelectTrigger data-testid="select-product">
                  <SelectValue placeholder="Selecione o produto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Core">Core</SelectItem>
                  <SelectItem value="Tráfego Pago">Tráfego Pago</SelectItem>
                  <SelectItem value="Automações">Automações</SelectItem>
                  <SelectItem value="Sites">Sites</SelectItem>
                  <SelectItem value="Outros">Outros</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.product && (
                <p className="text-sm text-destructive">{form.formState.errors.product.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ticketValue">Valor do Ticket *</Label>
            <Input
              id="ticketValue"
              placeholder="R$ 0,00"
              {...form.register("ticketValue")}
              data-testid="input-ticket-value"
            />
            {form.formState.errors.ticketValue && (
              <p className="text-sm text-destructive">{form.formState.errors.ticketValue.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="pdf-upload">Contrato Assinado (PDF) *</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              {uploadedPdf ? (
                <div className="flex flex-col items-center gap-3">
                  <CheckCircle2 className="w-12 h-12 text-green-600" />
                  <div>
                    <p className="font-medium text-green-700">PDF enviado com sucesso</p>
                    <p className="text-sm text-muted-foreground">Arquivo pronto para envio</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setUploadedPdf(null)}
                  >
                    Remover arquivo
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <FileText className="w-12 h-12 mx-auto text-muted-foreground" />
                  <div>
                    <p className="font-medium mb-1">Clique para selecionar o PDF</p>
                    <p className="text-sm text-muted-foreground">Apenas arquivos PDF</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isUploading}
                    onClick={() => document.getElementById("pdf-upload")?.click()}
                    data-testid="button-upload-pdf"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Selecionar PDF
                      </>
                    )}
                  </Button>
                  <input
                    id="pdf-upload"
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting || !uploadedPdf}
              className="flex-1"
              data-testid="button-submit-contract"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Criando Contrato...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Criar Contrato
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
