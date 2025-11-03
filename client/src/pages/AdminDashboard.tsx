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
  Webhook,
  Plus,
  Users,
  BarChart3,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import WebhookSettings from "./WebhookSettings";
import NewContract from "./NewContract";
import UserManagement from "./UserManagement";
import Analytics from "./Analytics";

type Contract = {
  id: string;
  clientName: string;
  clientPhone: string;
  companyName: string;
  document: string;
  contractDuration: string;
  product: string;
  ticketValue: string;
  pdfUrl: string;
  submittedAt: string;
  startDate: string;
  paymentFrequency: string;
};

const durationLabels: Record<string, string> = {
  "3_months": "3 Meses",
  "6_months": "6 Meses",
  "1_year": "1 Ano",
  "2_years": "2 Anos",
};

const durationMonths: Record<string, number> = {
  "3_months": 3,
  "6_months": 6,
  "1_year": 12,
  "2_years": 24,
};

function getContractStatus(startDate: string, duration: string): {
  status: "active" | "expiring" | "expired";
  daysRemaining: number;
  expirationDate: Date;
} {
  const contractStartDate = new Date(startDate);
  const months = durationMonths[duration] || 12;
  const expirationDate = new Date(contractStartDate);
  expirationDate.setMonth(expirationDate.getMonth() + months);
  
  const now = new Date();
  const daysRemaining = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  let status: "active" | "expiring" | "expired" = "active";
  if (daysRemaining < 0) {
    status = "expired";
  } else if (daysRemaining <= 30) {
    status = "expiring";
  }
  
  return { status, daysRemaining, expirationDate };
}

export default function AdminDashboard() {
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "active" | "new" | "users" | "settings" | "analytics">("analytics");
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

  const activeContracts = contracts.filter((contract) => {
    const { status } = getContractStatus(contract.startDate, contract.contractDuration);
    return status === "active" || status === "expiring";
  });

  const displayedContracts = activeTab === "active" ? activeContracts.filter(
    (contract) =>
      contract.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.clientPhone.includes(searchTerm) ||
      contract.product.toLowerCase().includes(searchTerm.toLowerCase())
  ) : filteredContracts;

  const thisMonthContracts = contracts.filter((contract) => {
    const contractDate = new Date(contract.startDate);
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
            onClick={() => setActiveTab("analytics")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium ${
              activeTab === "analytics"
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover-elevate"
            }`}
            data-testid="nav-analytics"
          >
            <BarChart3 className="w-5 h-5" />
            Analytics
          </button>
          <button
            onClick={() => setActiveTab("all")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium ${
              activeTab === "all"
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover-elevate"
            }`}
            data-testid="nav-all-contracts"
          >
            <FileText className="w-5 h-5" />
            Todos os Contratos
          </button>
          <button
            onClick={() => setActiveTab("active")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium ${
              activeTab === "active"
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover-elevate"
            }`}
            data-testid="nav-active-contracts"
          >
            <Calendar className="w-5 h-5" />
            Contratos Ativos
          </button>
          <button
            onClick={() => setActiveTab("new")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium ${
              activeTab === "new"
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover-elevate"
            }`}
            data-testid="nav-new-contract"
          >
            <Plus className="w-5 h-5" />
            Novo Contrato
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium ${
              activeTab === "users"
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover-elevate"
            }`}
            data-testid="nav-users"
          >
            <Users className="w-5 h-5" />
            Usuários
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium ${
              activeTab === "settings"
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover-elevate"
            }`}
            data-testid="nav-settings"
          >
            <Webhook className="w-5 h-5" />
            Webhook
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
            <h1 className="text-2xl font-bold">
              {activeTab === "analytics" && "Analytics"}
              {activeTab === "all" && "Todos os Contratos"}
              {activeTab === "active" && "Contratos Ativos"}
              {activeTab === "new" && "Novo Contrato"}
              {activeTab === "users" && "Gerenciar Usuários"}
              {activeTab === "settings" && "Configurações"}
            </h1>
            {activeTab === "active" && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>{activeContracts.length} contrato{activeContracts.length !== 1 ? "s" : ""} ativo{activeContracts.length !== 1 ? "s" : ""}</span>
              </div>
            )}
          </div>
        </header>

        <div className="p-8">
          {activeTab === "analytics" ? (
            <Analytics />
          ) : activeTab === "settings" ? (
            <WebhookSettings />
          ) : activeTab === "users" ? (
            <UserManagement />
          ) : activeTab === "new" ? (
            <NewContract onContractCreated={() => setActiveTab("analytics")} />
          ) : (
            <>
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
            ) : displayedContracts.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium">Nenhum contrato encontrado</p>
                <p className="text-muted-foreground">
                  {searchTerm ? "Tente uma busca diferente" : activeTab === "active" ? "Nenhum contrato ativo no momento" : "Os contratos enviados aparecerão aqui"}
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
                      <TableHead>Valor</TableHead>
                      <TableHead>Data de Início</TableHead>
                      {activeTab === "active" && <TableHead>Status</TableHead>}
                      <TableHead>PDF</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayedContracts.map((contract) => {
                      const { status, daysRemaining, expirationDate } = getContractStatus(
                        contract.startDate,
                        contract.contractDuration
                      );
                      
                      return (
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
                          <TableCell data-testid={`cell-ticket-${contract.id}`}>
                            {contract.ticketValue}
                          </TableCell>
                          <TableCell data-testid={`cell-date-${contract.id}`}>
                            {format(new Date(contract.startDate), "dd/MM/yyyy", { locale: ptBR })}
                          </TableCell>
                          {activeTab === "active" && (
                            <TableCell data-testid={`cell-status-${contract.id}`}>
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                  {status === "active" && (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-700">
                                      <span className="w-1.5 h-1.5 rounded-full bg-green-600"></span>
                                      Ativo
                                    </span>
                                  )}
                                  {status === "expiring" && (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-500/10 text-orange-700">
                                      <span className="w-1.5 h-1.5 rounded-full bg-orange-600"></span>
                                      Expirando
                                    </span>
                                  )}
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {daysRemaining > 0 ? `${daysRemaining} dia${daysRemaining !== 1 ? "s" : ""} restante${daysRemaining !== 1 ? "s" : ""}` : "Expirado"}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  Expira: {format(expirationDate, "dd/MM/yyyy", { locale: ptBR })}
                                </span>
                              </div>
                            </TableCell>
                          )}
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(`/api/storage/${contract.pdfUrl}`, "_blank")}
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
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
            </>
          )}
        </div>
      </main>

      <Dialog open={!!selectedContract} onOpenChange={() => setSelectedContract(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Contrato</DialogTitle>
          </DialogHeader>
          {selectedContract && (() => {
            const { status, daysRemaining, expirationDate } = getContractStatus(
              selectedContract.startDate,
              selectedContract.contractDuration
            );
            
            return (
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
                  <p className="text-sm font-medium text-muted-foreground">Razão Social</p>
                  <p className="text-lg">{selectedContract.companyName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">CPF/CNPJ</p>
                  <p className="text-lg">{selectedContract.document}</p>
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
                  <p className="text-sm font-medium text-muted-foreground">Valor do Ticket</p>
                  <p className="text-lg font-semibold text-primary">{selectedContract.ticketValue}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Frequência de Pagamento</p>
                  <p className="text-lg">
                    {selectedContract.paymentFrequency === "monthly" && "Mensal (12x/ano)"}
                    {selectedContract.paymentFrequency === "quarterly" && "Trimestral (4x/ano)"}
                    {selectedContract.paymentFrequency === "biannual" && "Semestral (2x/ano)"}
                    {selectedContract.paymentFrequency === "annual" && "Anual (1x/ano)"}
                    {selectedContract.paymentFrequency === "one_time" && "À Vista (Pagamento Único)"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Data de Início do Contrato</p>
                  <p className="text-lg">
                    {format(new Date(selectedContract.startDate), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Cadastrado no Sistema</p>
                  <p className="text-lg text-muted-foreground">
                    {format(new Date(selectedContract.submittedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50 border">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Status do Contrato</p>
                  <div className="flex items-center gap-2 mb-2">
                    {status === "active" && (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium bg-green-500/10 text-green-700 border border-green-200">
                        <span className="w-2 h-2 rounded-full bg-green-600"></span>
                        Ativo
                      </span>
                    )}
                    {status === "expiring" && (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium bg-orange-500/10 text-orange-700 border border-orange-200">
                        <span className="w-2 h-2 rounded-full bg-orange-600"></span>
                        Expirando em Breve
                      </span>
                    )}
                    {status === "expired" && (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium bg-red-500/10 text-red-700 border border-red-200">
                        <span className="w-2 h-2 rounded-full bg-red-600"></span>
                        Expirado
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {daysRemaining > 0 ? (
                      <>
                        <strong>{daysRemaining} dia{daysRemaining !== 1 ? "s" : ""}</strong> restante{daysRemaining !== 1 ? "s" : ""} até expirar
                      </>
                    ) : (
                      <>Expirou há <strong>{Math.abs(daysRemaining)} dia{Math.abs(daysRemaining) !== 1 ? "s" : ""}</strong></>
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Data de expiração: <strong>{format(expirationDate, "dd/MM/yyyy", { locale: ptBR })}</strong>
                  </p>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={() => window.open(`/api/storage/${selectedContract.pdfUrl}`, "_blank")}
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
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
