import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { Loader2, TrendingUp, DollarSign, Calendar, Users, ArrowUpRight, ArrowDownRight, Filter } from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths, parseISO, differenceInMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

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

const durationMonths: Record<string, number> = {
  "3_months": 3,
  "6_months": 6,
  "1_year": 12,
  "2_years": 24,
};

const parseTicketValue = (value: string): number => {
  return parseFloat(value.replace(/[^\d,]/g, "").replace(",", ".")) || 0;
};

// Calcula MRR baseado na frequência de pagamento
// Se ticketValue é o valor TOTAL do contrato: MRR = total / duração
// Se ticketValue é o valor de CADA PARCELA: MRR depende da frequência
const calculateMRR = (ticketValue: number, duration: number, paymentFrequency: string): number => {
  // Assumindo que ticketValue é o valor TOTAL do contrato
  // MRR normalizado = valor total / duração em meses
  // (independente da frequência de pagamento)
  return ticketValue / duration;
  
  // Se ticketValue fosse o valor de cada parcela, usaríamos:
  // switch (paymentFrequency) {
  //   case "monthly": return ticketValue;
  //   case "quarterly": return ticketValue / 3;
  //   case "biannual": return ticketValue / 6;
  //   case "annual": return ticketValue / 12;
  //   case "one_time": return ticketValue / duration;
  //   default: return ticketValue / duration;
  // }
};

const COLORS = ["#1a2332", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function Analytics() {
  const [periodFilter, setPeriodFilter] = useState<string>("6_months");
  const [productFilter, setProductFilter] = useState<string>("all");
  const [durationFilter, setDurationFilter] = useState<string>("all");

  const { data: allContracts = [], isLoading } = useQuery<Contract[]>({
    queryKey: ["/api/contracts"],
    refetchOnMount: true,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Aplicar filtros
  const filteredContracts = allContracts.filter((contract) => {
    // Filtro de produto
    if (productFilter !== "all" && contract.product !== productFilter) {
      return false;
    }

    // Filtro de duração
    if (durationFilter !== "all" && contract.contractDuration !== durationFilter) {
      return false;
    }

    // Filtro de período (baseado em startDate)
    if (periodFilter !== "all") {
      const contractDate = parseISO(contract.startDate);
      const now = new Date();
      const monthsAgo = {
        "1_month": 1,
        "3_months": 3,
        "6_months": 6,
        "1_year": 12,
        "2_years": 24,
      }[periodFilter];

      if (monthsAgo) {
        const cutoffDate = subMonths(now, monthsAgo);
        if (contractDate < cutoffDate) {
          return false;
        }
      }
    }

    return true;
  });

  // Calcular métricas
  const totalContracts = filteredContracts.length;
  
  // Faturamento total
  const totalRevenue = filteredContracts.reduce((sum, contract) => {
    return sum + parseTicketValue(contract.ticketValue);
  }, 0);

  // MRR (Monthly Recurring Revenue)
  const mrr = filteredContracts.reduce((sum, contract) => {
    const ticketValue = parseTicketValue(contract.ticketValue);
    const duration = durationMonths[contract.contractDuration] || 12;
    return sum + calculateMRR(ticketValue, duration, contract.paymentFrequency);
  }, 0);

  // Contratos por mês (dinâmico baseado no filtro)
  const getMonthsForPeriod = () => {
    const monthsCount = {
      "1_month": 1,
      "3_months": 3,
      "6_months": 6,
      "1_year": 12,
      "2_years": 24,
      "all": 12, // Se "all", mostra últimos 12 meses por padrão
    }[periodFilter] || 6;

    return Array.from({ length: monthsCount }, (_, i) => {
      const date = subMonths(new Date(), monthsCount - 1 - i);
      return {
        month: format(date, "MMM/yy", { locale: ptBR }),
        date: date,
      };
    });
  };

  const monthsToDisplay = getMonthsForPeriod();

  const contractsByMonth = monthsToDisplay.map(({ month, date }) => {
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    
    const monthContracts = filteredContracts.filter((contract) => {
      const contractDate = parseISO(contract.startDate);
      return contractDate >= monthStart && contractDate <= monthEnd;
    });

    const revenue = monthContracts.reduce((sum, contract) => {
      return sum + parseTicketValue(contract.ticketValue);
    }, 0);

    const monthMrr = monthContracts.reduce((sum, contract) => {
      const ticketValue = parseTicketValue(contract.ticketValue);
      const duration = durationMonths[contract.contractDuration] || 12;
      return sum + calculateMRR(ticketValue, duration, contract.paymentFrequency);
    }, 0);

    return {
      month,
      contratos: monthContracts.length,
      faturamento: revenue,
      mrr: monthMrr,
    };
  });

  // Contratos por produto
  const productStats = filteredContracts.reduce((acc, contract) => {
    const product = contract.product || "Outros";
    if (!acc[product]) {
      acc[product] = { count: 0, revenue: 0 };
    }
    acc[product].count++;
    acc[product].revenue += parseTicketValue(contract.ticketValue);
    return acc;
  }, {} as Record<string, { count: number; revenue: number }>);

  const productData = Object.entries(productStats).map(([name, stats]) => ({
    name,
    value: stats.count,
    revenue: stats.revenue,
  }));

  // Contratos por duração
  const durationStats = filteredContracts.reduce((acc, contract) => {
    const duration = contract.contractDuration;
    const label = {
      "3_months": "3 Meses",
      "6_months": "6 Meses",
      "1_year": "1 Ano",
      "2_years": "2 Anos",
    }[duration] || "Outros";
    
    if (!acc[label]) {
      acc[label] = 0;
    }
    acc[label]++;
    return acc;
  }, {} as Record<string, number>);

  const durationData = Object.entries(durationStats).map(([name, value]) => ({
    name,
    value,
  }));

  // Crescimento MRR
  const mrrGrowth = contractsByMonth.length > 1 && contractsByMonth[contractsByMonth.length - 2].mrr > 0
    ? ((contractsByMonth[contractsByMonth.length - 1].mrr - contractsByMonth[contractsByMonth.length - 2].mrr) / 
       contractsByMonth[contractsByMonth.length - 2].mrr) * 100
    : 0;

  // Ticket médio
  const averageTicket = totalContracts > 0 ? totalRevenue / totalContracts : 0;

  // Obter lista de produtos únicos
  const uniqueProducts = Array.from(new Set(allContracts.map(c => c.product)));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
        <p className="text-muted-foreground">
          Visão completa do desempenho do negócio e métricas financeiras
        </p>
      </div>

      {/* Filtros */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Filtros</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Período</label>
            <Select value={periodFilter} onValueChange={setPeriodFilter}>
              <SelectTrigger data-testid="select-period-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1_month">Último mês</SelectItem>
                <SelectItem value="3_months">Últimos 3 meses</SelectItem>
                <SelectItem value="6_months">Últimos 6 meses</SelectItem>
                <SelectItem value="1_year">Último ano</SelectItem>
                <SelectItem value="2_years">Últimos 2 anos</SelectItem>
                <SelectItem value="all">Todo o período</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Produto</label>
            <Select value={productFilter} onValueChange={setProductFilter}>
              <SelectTrigger data-testid="select-product-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os produtos</SelectItem>
                {uniqueProducts.map((product) => (
                  <SelectItem key={product} value={product}>
                    {product}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Duração</label>
            <Select value={durationFilter} onValueChange={setDurationFilter}>
              <SelectTrigger data-testid="select-duration-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as durações</SelectItem>
                <SelectItem value="3_months">3 Meses</SelectItem>
                <SelectItem value="6_months">6 Meses</SelectItem>
                <SelectItem value="1_year">1 Ano</SelectItem>
                <SelectItem value="2_years">2 Anos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {filteredContracts.length < allContracts.length && (
          <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
            <p className="text-sm text-blue-700">
              Exibindo {filteredContracts.length} de {allContracts.length} contratos
            </p>
          </div>
        )}
      </Card>

      {/* Cards de Métricas Principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturamento Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalRevenue.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              {totalContracts} contratos ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MRR</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mrr.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {mrrGrowth >= 0 ? (
                <>
                  <ArrowUpRight className="h-3 w-3 text-green-600" />
                  <span className="text-green-600">+{mrrGrowth.toFixed(1)}%</span>
                </>
              ) : (
                <>
                  <ArrowDownRight className="h-3 w-3 text-red-600" />
                  <span className="text-red-600">{mrrGrowth.toFixed(1)}%</span>
                </>
              )}
              vs mês anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {averageTicket.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              Por contrato
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalContracts}</div>
            <p className="text-xs text-muted-foreground">
              Contratos ativos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Faturamento e MRR ao longo do tempo */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Evolução de Faturamento e MRR</CardTitle>
            <CardDescription>
              Últimos 6 meses - Faturamento total vs Receita Recorrente Mensal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={contractsByMonth}>
                <defs>
                  <linearGradient id="colorFaturamento" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1a2332" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#1a2332" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorMRR" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(value: number) =>
                    value.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })
                  }
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="faturamento"
                  stroke="#1a2332"
                  fillOpacity={1}
                  fill="url(#colorFaturamento)"
                  name="Faturamento"
                />
                <Area
                  type="monotone"
                  dataKey="mrr"
                  stroke="#10b981"
                  fillOpacity={1}
                  fill="url(#colorMRR)"
                  name="MRR"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Contratos por mês */}
        <Card>
          <CardHeader>
            <CardTitle>Novos Contratos por Mês</CardTitle>
            <CardDescription>
              Quantidade de contratos fechados nos últimos 6 meses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={contractsByMonth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="contratos" fill="#1a2332" name="Contratos" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribuição por Produto */}
        <Card>
          <CardHeader>
            <CardTitle>Contratos por Produto</CardTitle>
            <CardDescription>
              Distribuição de contratos entre produtos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={productData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {productData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Duração dos Contratos */}
        <Card>
          <CardHeader>
            <CardTitle>Duração dos Contratos</CardTitle>
            <CardDescription>
              Distribuição por período contratual
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={durationData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={80} />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#3b82f6" name="Contratos" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Produtos por Receita */}
        <Card>
          <CardHeader>
            <CardTitle>Top Produtos por Receita</CardTitle>
            <CardDescription>
              Produtos ordenados por faturamento total
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {productData
                .sort((a, b) => b.revenue - a.revenue)
                .slice(0, 5)
                .map((product, index) => (
                  <div key={product.name} className="flex items-center gap-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">{product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {product.value} contrato{product.value !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="font-medium">
                      {product.revenue.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
