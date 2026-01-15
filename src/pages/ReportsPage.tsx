import { useState, useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import { useOrders } from "@/hooks/useOrders";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  TrendingUp,
  ShoppingBag,
  DollarSign,
  Package,
  Calendar,
} from "lucide-react";
import { format, startOfDay, endOfDay, subDays, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";

type DateRange = "today" | "yesterday" | "last7days" | "last30days" | "all";

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState<DateRange>("today");
  const { data: orders, isLoading } = useOrders();

  // Filter orders by date range
  const filteredOrders = useMemo(() => {
    if (!orders) return [];

    const now = new Date();
    let startDate: Date;
    let endDate: Date = endOfDay(now);

    switch (dateRange) {
      case "today":
        startDate = startOfDay(now);
        break;
      case "yesterday":
        startDate = startOfDay(subDays(now, 1));
        endDate = endOfDay(subDays(now, 1));
        break;
      case "last7days":
        startDate = startOfDay(subDays(now, 6));
        break;
      case "last30days":
        startDate = startOfDay(subDays(now, 29));
        break;
      case "all":
        return orders;
      default:
        startDate = startOfDay(now);
    }

    return orders.filter((order) => {
      const orderDate = new Date(order.created_at);
      return isWithinInterval(orderDate, { start: startDate, end: endDate });
    });
  }, [orders, dateRange]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const completedOrders = filteredOrders.filter(
      (o) => o.status === "completed" || o.status === "picked_up"
    );

    const totalRevenue = completedOrders.reduce((sum, order) => sum + order.total, 0);
    const totalOrders = completedOrders.length;
    const averageTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Products sold
    const productsSold: Record<string, { quantity: number; revenue: number }> = {};
    completedOrders.forEach((order) => {
      order.order_items?.forEach((item) => {
        if (!productsSold[item.product_name]) {
          productsSold[item.product_name] = { quantity: 0, revenue: 0 };
        }
        productsSold[item.product_name].quantity += item.quantity;
        productsSold[item.product_name].revenue += item.quantity * item.unit_price;
      });
    });

    // Sales by type
    const salesByType: Record<string, { count: number; revenue: number }> = {};
    completedOrders.forEach((order) => {
      const typeName = order.sales_type?.name || "Sem tipo";
      if (!salesByType[typeName]) {
        salesByType[typeName] = { count: 0, revenue: 0 };
      }
      salesByType[typeName].count += 1;
      salesByType[typeName].revenue += order.total;
    });

    // Sales by status
    const salesByStatus: Record<string, number> = {};
    filteredOrders.forEach((order) => {
      salesByStatus[order.status] = (salesByStatus[order.status] || 0) + 1;
    });

    return {
      totalRevenue,
      totalOrders,
      averageTicket,
      productsSold,
      salesByType,
      salesByStatus,
      totalItems: Object.values(productsSold).reduce((sum, p) => sum + p.quantity, 0),
    };
  }, [filteredOrders]);

  // Prepare chart data
  const topProductsData = Object.entries(metrics.productsSold)
    .sort(([, a], [, b]) => b.quantity - a.quantity)
    .slice(0, 10)
    .map(([name, data]) => ({
      name: name.length > 20 ? name.substring(0, 17) + "..." : name,
      quantidade: data.quantity,
      receita: data.revenue,
    }));

  const salesTypeData = Object.entries(metrics.salesByType).map(([name, data]) => ({
    name,
    pedidos: data.count,
    receita: data.revenue,
  }));

  const statusData = Object.entries(metrics.salesByStatus).map(([status, count]) => {
    const labels: Record<string, string> = {
      pending: "Pendente",
      picked_up: "Retirado",
      completed: "Concluído",
      cancelled: "Cancelado",
    };
    return {
      name: labels[status] || status,
      value: count,
    };
  });

  const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444"];

  const dateRangeButtons: { value: DateRange; label: string }[] = [
    { value: "today", label: "Hoje" },
    { value: "yesterday", label: "Ontem" },
    { value: "last7days", label: "7 dias" },
    { value: "last30days", label: "30 dias" },
    { value: "all", label: "Tudo" },
  ];

  if (isLoading) {
    return (
      <div className="page-container">
        <PageHeader title="Relatórios" subtitle="Carregando..." />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card-touch animate-pulse">
              <div className="h-20 bg-muted rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <PageHeader
        title="Relatórios"
        subtitle={`${filteredOrders.length} pedido${
          filteredOrders.length !== 1 ? "s" : ""
        }`}
        icon={<TrendingUp className="w-6 h-6" />}
      />

      {/* Date Range Filter */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {dateRangeButtons.map((btn) => (
          <Button
            key={btn.value}
            variant={dateRange === btn.value ? "default" : "outline"}
            size="sm"
            onClick={() => setDateRange(btn.value)}
            className="shrink-0"
          >
            {btn.label}
          </Button>
        ))}
      </div>

      {filteredOrders.length === 0 ? (
        <Card className="p-8 text-center">
          <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Nenhum pedido neste período</h3>
          <p className="text-muted-foreground">
            Selecione outro período para ver os relatórios
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Main Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center shrink-0">
                  <DollarSign className="w-5 h-5 text-success" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground">Receita Total</div>
                  <div className="text-lg font-bold text-success truncate">
                    R$ {metrics.totalRevenue.toFixed(2)}
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <ShoppingBag className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground">Pedidos</div>
                  <div className="text-lg font-bold truncate">
                    {metrics.totalOrders}
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground">Ticket Médio</div>
                  <div className="text-lg font-bold text-blue-500 truncate">
                    R$ {metrics.averageTicket.toFixed(2)}
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0">
                  <Package className="w-5 h-5 text-orange-500" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground">Itens Vendidos</div>
                  <div className="text-lg font-bold text-orange-500 truncate">
                    {metrics.totalItems}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Top Products Chart */}
          {topProductsData.length > 0 && (
            <Card className="p-4">
              <h3 className="text-sm font-semibold mb-4">Produtos Mais Vendidos</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topProductsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    style={{ fontSize: "12px" }}
                  />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number, name: string) => {
                      if (name === "receita") return `R$ ${value.toFixed(2)}`;
                      return value;
                    }}
                    labelFormatter={(label) => `Produto: ${label}`}
                  />
                  <Bar dataKey="quantidade" fill="#10b981" name="Quantidade" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* Sales by Type */}
          {salesTypeData.length > 0 && (
            <Card className="p-4">
              <h3 className="text-sm font-semibold mb-4">Vendas por Tipo</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={salesTypeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" orientation="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip
                    formatter={(value: number, name: string) => {
                      if (name === "receita") return `R$ ${value.toFixed(2)}`;
                      return value;
                    }}
                  />
                  <Bar yAxisId="left" dataKey="pedidos" fill="#3b82f6" name="Pedidos" />
                  <Bar
                    yAxisId="right"
                    dataKey="receita"
                    fill="#10b981"
                    name="Receita (R$)"
                  />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* Status Breakdown */}
          {statusData.length > 0 && (
            <Card className="p-4">
              <h3 className="text-sm font-semibold mb-4">Status dos Pedidos</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* Products List */}
          {Object.keys(metrics.productsSold).length > 0 && (
            <Card className="p-4">
              <h3 className="text-sm font-semibold mb-3">Detalhamento por Produto</h3>
              <div className="space-y-2">
                {Object.entries(metrics.productsSold)
                  .sort(([, a], [, b]) => b.revenue - a.revenue)
                  .map(([name, data]) => (
                    <div
                      key={name}
                      className="flex items-center justify-between p-2 bg-accent/50 rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{name}</div>
                        <div className="text-xs text-muted-foreground">
                          {data.quantity} unidade{data.quantity !== 1 ? "s" : ""}
                        </div>
                      </div>
                      <div className="text-right ml-2">
                        <div className="font-bold text-success">
                          R$ {data.revenue.toFixed(2)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          R$ {(data.revenue / data.quantity).toFixed(2)}/un
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
