import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/Logo";
import {
  FileText,
  Download,
  Trash2,
  Search,
  LogOut,
  Settings,
  Calendar,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type Contract = {
  id: string;
  clientName: string;
  clientPhone: string;
  contractDuration: string;
  product: string;
  pdfUrl: string;
  submittedAt: string;
};

const durationLabels: Record<string, string> = {
  "3_months": "3 Meses",
  "6_months": "6 Meses",
  "1_year": "1 Ano",
  "2_years": "2 Anos",
};

export default function AdminDashboard() {
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: contracts = [], isLoading } = useQuery<Contract[]>({
    queryKey: ["/api/contracts"],
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/auth/logout", {});
    },
    onSuccess: () => {
      navigate("/login");
    },
  });

  const deleteContractMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/contracts/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      toast({
        title: "Contrato excluído",
        description: "O contrato foi removido com sucesso",
      });
      setSelectedContract(null);
    },
    onError: () => {
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o contrato",
        variant: "destructive",
      });
    },
  });

  const filteredContracts = contracts.filter(
    (contract) =>
      contract.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.clientPhone.includes(searchTerm) ||
      contract.product.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const thisMonthContracts = contracts.filter((contract) => {
    const contractDate = new Date(contract.submittedAt);
    const now = new Date();
    return (
      contractDate.getMonth() === now.getMonth() &&
      contractDate.getFullYear() === now.getFullYear()
    );
  });

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed left-0 top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border">
        <div className="p-6">
          <Logo className="h-10" />
        </div>
        
        <nav className="px-3 space-y-1">
          <button
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-sidebar-accent text-sidebar-accent-foreground font-medium"
            data-testid="nav-contracts"
          >
            <FileText className="w-5 h-5" />
            Contratos
          </button>
          <button
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sidebar-foreground hover-elevate"
            data-testid="nav-settings"
          >
            <Settings className="w-5 h-5" />
            Configurações
          </button>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-sidebar-border">
          <Button
            variant="ghost"
            className="w-full justify-start text-sidebar-foreground"
            onClick={() => logoutMutation.mutate()}
            data-testid="button-logout"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Sair
          </Button>
        </div>
      </aside>

      <main className="ml-64">
        <header className="bg-white border-b px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Contratos</h1>
          </div>
        </header>

        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total de Contratos</p>
                  <p className="text-3xl font-bold" data-testid="stat-total-contracts">
                    {contracts.length}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-green-500/10">
                  <Calendar className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Este Mês</p>
                  <p className="text-3xl font-bold" data-testid="stat-month-contracts">
                    {thisMonthContracts.length}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-blue-500/10">
                  <Download className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">PDFs Recebidos</p>
                  <p className="text-3xl font-bold" data-testid="stat-pdfs">
                    {contracts.length}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <Card className="p-6">
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, telefone ou produto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12"
                  data-testid="input-search"
                />
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredContracts.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium">Nenhum contrato encontrado</p>
                <p className="text-muted-foreground">
                  {searchTerm ? "Tente uma busca diferente" : "Os contratos enviados aparecerão aqui"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead>Duração</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>PDF</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredContracts.map((contract) => (
                      <TableRow key={contract.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium" data-testid={`cell-name-${contract.id}`}>
                          {contract.clientName}
                        </TableCell>
                        <TableCell data-testid={`cell-phone-${contract.id}`}>
                          {contract.clientPhone}
                        </TableCell>
                        <TableCell data-testid={`cell-product-${contract.id}`}>
                          {contract.product}
                        </TableCell>
                        <TableCell data-testid={`cell-duration-${contract.id}`}>
                          {durationLabels[contract.contractDuration]}
                        </TableCell>
                        <TableCell data-testid={`cell-date-${contract.id}`}>
                          {format(new Date(contract.submittedAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(contract.pdfUrl, "_blank")}
                            data-testid={`button-download-${contract.id}`}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedContract(contract)}
                            data-testid={`button-view-${contract.id}`}
                          >
                            Ver
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteContractMutation.mutate(contract.id)}
                            className="text-destructive hover:text-destructive"
                            data-testid={`button-delete-${contract.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        </div>
      </main>

      <Dialog open={!!selectedContract} onOpenChange={() => setSelectedContract(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Contrato</DialogTitle>
          </DialogHeader>
          {selectedContract && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Cliente</p>
                <p className="text-lg font-semibold">{selectedContract.clientName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Telefone</p>
                <p className="text-lg">{selectedContract.clientPhone}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Produto</p>
                <p className="text-lg">{selectedContract.product}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Duração do Contrato</p>
                <p className="text-lg">{durationLabels[selectedContract.contractDuration]}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Data de Envio</p>
                <p className="text-lg">
                  {format(new Date(selectedContract.submittedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => window.open(selectedContract.pdfUrl, "_blank")}
                  className="flex-1"
                  data-testid="button-view-pdf"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Baixar PDF
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => deleteContractMutation.mutate(selectedContract.id)}
                  data-testid="button-delete-contract"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
