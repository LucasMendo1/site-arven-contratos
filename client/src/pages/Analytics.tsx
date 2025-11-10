/** @jsxImportSource react */
import { useState } from "react";
import type { FC } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { Loader2, TrendingUp, DollarSign, Calendar, Users, ArrowUpRight, ArrowDownRight, Filter } from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths, parseISO, addMonths } from "date-fns";
import { parseTicketValue, calculateMRR, durationMonths } from "@/lib/mrr";
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

interface Stats {
  count: number;
  revenue: number;
}

type ProductStats = Record<string, Stats>;
type DurationStats = Record<string, number>;

type Contract = {
  id: string;
  clientName: string;
  clientPhone: string;
  companyName: string;
  document: string;
  contractDuration: "3_months" | "6_months" | "1_year" | "2_years";
  product: string;
  ticketValue: string;
  pdfUrl: string;
  submittedAt: string;
  startDate: string;
  paymentFrequency: "monthly" | "quarterly" | "biannual" | "annual" | "one_time";
};


const COLORS = ["#1a2332", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

const Analytics: FC = () => {
  const [periodFilter, setPeriodFilter] = useState<string>("6_months");
  const [productFilter, setProductFilter] = useState<string>("all");
  const [durationFilter, setDurationFilter] = useState<string>("all");
  
  const formatStats = (stats: Stats) => ({
    value: stats.count,
    revenue: stats.revenue
  });

  const { data: allContracts = [], isLoading } = useQuery<Contract[]>({
    queryKey: ["/api/contracts"],
    refetchOnMount: true,
  } as const);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Aplicar filtros
  type PeriodFilter = "1_month" | "3_months" | "6_months" | "1_year" | "2_years" | "all";
  
  const periodToMonths: Record<PeriodFilter, number> = {
    "1_month": 1,
    "3_months": 3,
    "6_months": 6,
    "1_year": 12,
    "2_years": 24,
    "all": 12
  };

  const filteredContracts = allContracts.filter((contract: Contract) => {
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
      const monthsAgo = periodToMonths[periodFilter as PeriodFilter];

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
  const totalRevenue = filteredContracts.reduce((sum: number, contract: Contract) => {
    return sum + parseTicketValue(contract.ticketValue);
  }, 0);

  // MRR (Monthly Recurring Revenue)
  const mrr = filteredContracts.reduce((sum: number, contract: Contract) => {
    // Exclui pagamentos one_time do cálculo de receita recorrente
    if (contract.paymentFrequency === "one_time") return sum;

    const ticketValue = parseTicketValue(contract.ticketValue);
    const duration = durationMonths[contract.contractDuration];
    return sum + calculateMRR(ticketValue, duration, contract.paymentFrequency);
  }, 0);

  // Calcular MRR atual (contratos ativos hoje) — considera startDate + duração
  const now = new Date();
  const activeContractsNow = allContracts.filter((contract: Contract) => {
    // respeita filtros de produto e duração, mas ignora filtro de período (usado apenas para views)
    if (productFilter !== "all" && contract.product !== productFilter) return false;
    if (durationFilter !== "all" && contract.contractDuration !== durationFilter) return false;

    // compute start and end
    const start = parseISO(contract.startDate);
    const months = durationMonths[contract.contractDuration] || 1;
    const end = addMonths(start, months);

    // ativo agora se start <= now < end
    return start <= now && now < end;
  });

  const currentMrr = activeContractsNow.reduce((sum: number, contract: Contract) => {
    if (contract.paymentFrequency === "one_time") return sum;
    const ticketValue = parseTicketValue(contract.ticketValue);
    const duration = durationMonths[contract.contractDuration];
    return sum + calculateMRR(ticketValue, duration, contract.paymentFrequency);
  }, 0);

  // Número de contratos recorrentes ativos agora (exclui one_time)
  const activeRecurringCount = activeContractsNow.filter((c) => c.paymentFrequency !== "one_time").length;

  // Ticket médio mensal por contrato (com fallback)
  const ticketMonthlyAvg = activeRecurringCount > 0 ? currentMrr / activeRecurringCount : 0;

  // Contratos por mês (dinâmico baseado no filtro)
  const getMonthsForPeriod = () => {
    const monthsCount = periodToMonths[periodFilter as PeriodFilter] || 6;

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
    
    // contratos ativos naquele mês: start <= monthEnd && end > monthStart
    const monthContracts = filteredContracts.filter((contract: Contract) => {
      const start = parseISO(contract.startDate);
      const months = durationMonths[contract.contractDuration] || 1;
      const end = addMonths(start, months);
      return start <= monthEnd && end > monthStart;
    });

    const revenue = monthContracts.reduce((sum: number, contract: Contract) => {
      return sum + parseTicketValue(contract.ticketValue);
    }, 0);

    const monthMrr = monthContracts.reduce((sum: number, contract: Contract) => {
      // Ignora pagamentos one_time ao computar MRR mensal
      if (contract.paymentFrequency === "one_time") return sum;

      const ticketValue = parseTicketValue(contract.ticketValue);
      const duration = durationMonths[contract.contractDuration];
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
  const productStats = filteredContracts.reduce<ProductStats>((acc, contract) => {
    const product = contract.product || "Outros";
    if (!acc[product]) {
      acc[product] = { count: 0, revenue: 0 };
    }
    acc[product].count++;
    acc[product].revenue += parseTicketValue(contract.ticketValue);
    return acc;
  }, {} as ProductStats);

  const productData = Object.entries(productStats).map(([name, stats]) => ({
    name,
    value: stats.count,
    revenue: stats.revenue,
  }));

  // Contratos por duração
  const durationLabels: Record<Contract['contractDuration'], string> = {
    "3_months": "3 Meses",
    "6_months": "6 Meses",
    "1_year": "1 Ano",
    "2_years": "2 Anos"
  };

  const durationStats = filteredContracts.reduce((acc: DurationStats, contract: Contract) => {
    const label = durationLabels[contract.contractDuration] || "Outros";
    if (!acc[label]) {
      acc[label] = 0;
    }
    acc[label]++;
    return acc;
  }, {});

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
  const uniqueProducts = Array.from(new Set(allContracts.map((c: Contract) => c.product)));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
          <p className="text-muted-foreground">
            Visão completa do desempenho do negócio e métricas financeiras
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-end gap-3 pb-4 border-b">
        <div className="flex-1 min-w-[200px] space-y-1">
          <div className="text-xs text-muted-foreground font-medium" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            PERÍODO
          </div>
          <Select value={periodFilter} onValueChange={setPeriodFilter}>
            <SelectTrigger data-testid="select-period-filter" className="h-9">
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

        <div className="flex-1 min-w-[200px] space-y-1">
          <div className="text-xs text-muted-foreground font-medium" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            PRODUTO
          </div>
          <Select value={productFilter} onValueChange={setProductFilter}>
            <SelectTrigger data-testid="select-product-filter" className="h-9">
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

        <div className="flex-1 min-w-[200px] space-y-1">
          <div className="text-xs text-muted-foreground font-medium" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            DURAÇÃO
          </div>
          <Select value={durationFilter} onValueChange={setDurationFilter}>
            <SelectTrigger data-testid="select-duration-filter" className="h-9">
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

        {filteredContracts.length < allContracts.length && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted text-xs text-muted-foreground">
            <Filter className="w-3 h-3" />
            <span>{filteredContracts.length} de {allContracts.length} contratos</span>
          </div>
        )}
      </div>

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
                  {currentMrr.toLocaleString("pt-BR", {
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
                  {ticketMonthlyAvg.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </div>
                <p className="text-xs text-muted-foreground">
                  Por contrato / mês
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

export default Analytics;
