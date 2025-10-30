import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/Logo";
import { Check, FileText, Upload, Loader2 } from "lucide-react";

const contractFormSchema = z.object({
  clientName: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  clientPhone: z.string().min(10, "Número de telefone inválido"),
  contractDuration: z.enum(["3_months", "6_months", "1_year", "2_years"], {
    required_error: "Por favor, selecione o tempo de contrato",
  }),
  product: z.string().min(2, "Por favor, selecione um produto"),
  ticketValue: z.string().min(1, "Valor do ticket é obrigatório"),
  pdfUrl: z.string().min(1, "PDF é obrigatório"),
});

type ContractFormData = z.infer<typeof contractFormSchema>;

const durationLabels = {
  "3_months": "3 Meses",
  "6_months": "6 Meses",
  "1_year": "1 Ano",
  "2_years": "2 Anos",
};

export default function LandingPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ContractFormData>({
    resolver: zodResolver(contractFormSchema),
    defaultValues: {
      clientName: "",
      clientPhone: "",
      product: "",
      ticketValue: "",
      pdfUrl: "",
    },
  });

  const createContractMutation = useMutation({
    mutationFn: async (data: ContractFormData) => {
      return apiRequest("POST", "/api/contracts", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      setSubmitted(true);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao enviar contrato",
        description: error.message || "Ocorreu um erro. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione apenas arquivos PDF",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    setUploadingPdf(true);

    try {
      const uploadUrlResponse = await apiRequest("POST", "/api/objects/upload", {});
      const uploadUrlData = await uploadUrlResponse.json();
      const { uploadURL } = uploadUrlData;

      if (!uploadURL) {
        throw new Error("Não foi possível gerar URL de upload");
      }

      const uploadResponse = await fetch(uploadURL, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": "application/pdf",
        },
      });

      if (!uploadResponse.ok) {
        throw new Error("Falha no upload do PDF");
      }

      // Extract the base URL without query parameters
      const baseUrl = uploadURL.split("?")[0];
      
      const pdfUrlResponse = await apiRequest("POST", "/api/contracts/pdf", {
        pdfUrl: baseUrl,
      });
      const pdfUrlData = await pdfUrlResponse.json();

      if (!pdfUrlData?.pdfUrl) {
        throw new Error("URL do PDF não foi retornada");
      }

      form.setValue("pdfUrl", pdfUrlData.pdfUrl);
      
      toast({
        title: "PDF enviado com sucesso",
        description: "Seu contrato foi carregado.",
      });
    } catch (error: any) {
      toast({
        title: "Erro no upload",
        description: error.message || "Falha ao enviar o PDF",
        variant: "destructive",
      });
      setSelectedFile(null);
    } finally {
      setUploadingPdf(false);
    }
  };

  const onSubmit = (data: ContractFormData) => {
    createContractMutation.mutate(data);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1a2332] via-[#1a2332] to-[#0f1419]">
        <header className="bg-sidebar py-6 px-8 border-b border-sidebar-border">
          <Logo />
        </header>
        <div className="flex items-center justify-center py-24 px-4">
          <Card className="max-w-md w-full p-12 text-center shadow-2xl">
            <div className="mb-6 flex justify-center">
              <div className="rounded-full bg-green-500/10 p-4">
                <Check className="w-16 h-16 text-green-500" />
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-3">Contrato Enviado com Sucesso!</h1>
            <p className="text-muted-foreground text-lg mb-8">
              Você receberá uma confirmação em breve
            </p>
            <Button
              onClick={() => {
                setSubmitted(false);
                form.reset();
                setSelectedFile(null);
              }}
              variant="outline"
              className="w-full"
              data-testid="button-new-contract"
            >
              Enviar Outro Contrato
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a2332] via-[#1a2332] to-[#0f1419]">
      <header className="bg-sidebar py-6 px-8 border-b border-sidebar-border">
        <div className="max-w-7xl mx-auto">
          <Logo />
        </div>
      </header>

      <section className="py-16 px-4">
        <div className="max-w-2xl mx-auto text-center text-white mb-12">
          <h1 className="text-5xl font-bold mb-4 tracking-tight">
            Formalize Seu Contrato
          </h1>
          <p className="text-xl opacity-90">
            Preencha as informações abaixo para formalizar seu contrato de forma rápida e segura
          </p>
        </div>
      </section>

      <section className="pb-24 px-4">
        <Card className="max-w-md mx-auto shadow-2xl p-8 md:p-12">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="clientName" className="uppercase tracking-wide text-sm font-medium">
                1. Nome do Cliente
              </Label>
              <Input
                id="clientName"
                {...form.register("clientName")}
                placeholder="Digite o nome completo"
                className="h-12 text-base"
                data-testid="input-client-name"
              />
              {form.formState.errors.clientName && (
                <p className="text-sm text-destructive">{form.formState.errors.clientName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientPhone" className="uppercase tracking-wide text-sm font-medium">
                2. Número do Cliente
              </Label>
              <Input
                id="clientPhone"
                {...form.register("clientPhone")}
                type="tel"
                placeholder="(00) 00000-0000"
                className="h-12 text-base"
                data-testid="input-client-phone"
              />
              {form.formState.errors.clientPhone && (
                <p className="text-sm text-destructive">{form.formState.errors.clientPhone.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="uppercase tracking-wide text-sm font-medium">
                3. Tempo de Contrato
              </Label>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(durationLabels).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => form.setValue("contractDuration", value as any)}
                    className={`
                      p-4 rounded-lg border-2 transition-all hover-elevate
                      ${
                        form.watch("contractDuration") === value
                          ? "border-primary bg-primary/5 text-primary font-semibold"
                          : "border-border hover:border-primary/50"
                      }
                    `}
                    data-testid={`button-duration-${value}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {form.formState.errors.contractDuration && (
                <p className="text-sm text-destructive">{form.formState.errors.contractDuration.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="product" className="uppercase tracking-wide text-sm font-medium">
                4. Produto Comprado
              </Label>
              <Select
                value={form.watch("product")}
                onValueChange={(value) => form.setValue("product", value)}
              >
                <SelectTrigger className="h-12 text-base" data-testid="select-product">
                  <SelectValue placeholder="Selecione um produto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Consultoria Empresarial">Consultoria Empresarial</SelectItem>
                  <SelectItem value="Assessoria Jurídica">Assessoria Jurídica</SelectItem>
                  <SelectItem value="Gestão de Projetos">Gestão de Projetos</SelectItem>
                  <SelectItem value="Planejamento Estratégico">Planejamento Estratégico</SelectItem>
                  <SelectItem value="Auditoria e Compliance">Auditoria e Compliance</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.product && (
                <p className="text-sm text-destructive">{form.formState.errors.product.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="ticketValue" className="uppercase tracking-wide text-sm font-medium">
                5. Valor do Ticket
              </Label>
              <Input
                id="ticketValue"
                {...form.register("ticketValue")}
                placeholder="R$ 0,00"
                className="h-12 text-base"
                data-testid="input-ticket-value"
              />
              {form.formState.errors.ticketValue && (
                <p className="text-sm text-destructive">{form.formState.errors.ticketValue.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="uppercase tracking-wide text-sm font-medium">
                6. Upload do Contrato Assinado (PDF)
              </Label>
              <div className="relative">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="pdf-upload"
                  data-testid="input-pdf-upload"
                />
                <label
                  htmlFor="pdf-upload"
                  className={`
                    flex flex-col items-center justify-center
                    border-2 border-dashed rounded-lg py-8 px-4
                    cursor-pointer transition-all hover-elevate
                    ${selectedFile ? "border-green-500 bg-green-500/5" : "border-border hover:border-primary/50"}
                  `}
                >
                  {uploadingPdf ? (
                    <>
                      <Loader2 className="w-12 h-12 mb-3 text-primary animate-spin" />
                      <p className="text-sm font-medium">Enviando PDF...</p>
                    </>
                  ) : selectedFile ? (
                    <>
                      <FileText className="w-12 h-12 mb-3 text-green-500" />
                      <p className="text-sm font-medium text-green-600">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">Clique para alterar</p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-12 h-12 mb-3 text-muted-foreground" />
                      <p className="text-sm font-medium">Arraste o PDF ou clique para selecionar</p>
                      <p className="text-xs text-muted-foreground mt-1">Apenas arquivos .pdf</p>
                    </>
                  )}
                </label>
              </div>
              {form.formState.errors.pdfUrl && (
                <p className="text-sm text-destructive">{form.formState.errors.pdfUrl.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-14 text-lg font-semibold"
              disabled={createContractMutation.isPending || uploadingPdf || !selectedFile}
              data-testid="button-submit-contract"
            >
              {createContractMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Enviar Contrato"
              )}
            </Button>
          </form>
        </Card>
      </section>
    </div>
  );
}
