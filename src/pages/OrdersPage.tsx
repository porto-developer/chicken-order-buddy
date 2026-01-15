import { useState, useEffect } from "react";
import { Plus, ClipboardList, Check, Package, X, Search } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useOrders, useUpdateOrderStatus } from "@/hooks/useOrders";
import { OrderStatus } from "@/types/database";
import { NewOrderSheet } from "@/components/orders/NewOrderSheet";
import { OrderDetailsSheet } from "@/components/orders/OrderDetailsSheet";
import { format, startOfDay, isToday, isYesterday } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function OrdersPage() {
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const { data: orders, isLoading } = useOrders();
  const updateStatus = useUpdateOrderStatus();

  // Debounce search input (1 second delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 1000);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Filter orders by search query
  const filteredOrders =
    orders?.filter((order) => {
      if (!searchQuery.trim()) return true;

      const query = searchQuery.toLowerCase().trim();
      const customerMatch = order.customer_name?.toLowerCase().includes(query);
      const externalIdMatch = order.external_order_id
        ?.toLowerCase()
        .includes(query);
      const internalIdMatch = order.id.toLowerCase().includes(query);

      return customerMatch || externalIdMatch || internalIdMatch;
    }) || [];

  const pendingOrders = filteredOrders.filter((o) => o.status === "pending");
  const otherOrders = filteredOrders.filter((o) => o.status !== "pending");

  // Group orders by date
  const groupOrdersByDate = (orders: typeof otherOrders) => {
    const groups: Record<string, typeof otherOrders> = {};

    orders.forEach((order) => {
      const date = startOfDay(new Date(order.created_at)).toISOString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(order);
    });

    return groups;
  };

  const groupedOrders = groupOrdersByDate(otherOrders);
  const sortedDates = Object.keys(groupedOrders).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) return "Hoje";
    if (isYesterday(date)) return "Ontem";
    return format(date, "EEEE, dd 'de' MMMM", { locale: ptBR });
  };

  const handleQuickStatus = (
    orderId: string,
    currentStatus: OrderStatus,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();

    let newStatus: OrderStatus;
    let restoreStock = false;

    if (currentStatus === "pending") {
      newStatus = "picked_up";
    } else if (currentStatus === "picked_up") {
      newStatus = "completed";
    } else {
      return;
    }

    updateStatus.mutate({ id: orderId, status: newStatus, restoreStock });
  };

  return (
    <div className="page-container">
      <PageHeader
        title="Pedidos"
        subtitle={`${pendingOrders.length} pendente${
          pendingOrders.length !== 1 ? "s" : ""
        }`}
        action={
          <Button
            onClick={() => setIsNewOrderOpen(true)}
            className="h-12 w-12 rounded-full p-0"
          >
            <Plus className="w-6 h-6" />
          </Button>
        }
      />

      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar por cliente, ou ID do pedido..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-10 input-touch"
          />
          {searchInput && (
            <button
              onClick={() => {
                setSearchInput("");
                setSearchQuery("");
              }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        {searchInput !== searchQuery && searchInput.trim() !== "" && (
          <p className="text-xs text-muted-foreground mt-2">Buscando...</p>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card-touch animate-pulse">
              <div className="h-5 bg-muted rounded w-1/3 mb-2" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : orders?.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Nenhum pedido"
          description="Crie seu primeiro pedido para começar a gerenciar as vendas"
          actionLabel="Criar Pedido"
          onAction={() => setIsNewOrderOpen(true)}
        />
      ) : filteredOrders.length === 0 ? (
        <EmptyState
          icon={Search}
          title="Nenhum resultado"
          description="Não encontramos pedidos com esse cliente ou ID"
          actionLabel="Limpar busca"
          onAction={() => {
            setSearchInput("");
            setSearchQuery("");
          }}
        />
      ) : (
        <div className="space-y-6">
          {/* Pending Orders Section */}
          {pendingOrders.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                Pendentes
              </h2>
              <div className="space-y-3">
                {pendingOrders.map((order) => (
                  <div
                    key={order.id}
                    className="card-touch flex items-center gap-3 cursor-pointer active:bg-accent/50 transition-colors"
                    onClick={() => setSelectedOrderId(order.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-foreground">
                          {order.external_order_id
                            ? `#${order.external_order_id}`
                            : `#${order.id.slice(-4).toUpperCase()}`}
                        </span>
                        <StatusBadge status={order.status} />
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {order.sales_type?.name} • R$ {order.total.toFixed(2)}
                      </div>
                      {order.customer_name && (
                        <div className="text-sm text-muted-foreground truncate">
                          {order.customer_name}
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground mt-1">
                        {format(new Date(order.created_at), "HH:mm", {
                          locale: ptBR,
                        })}
                      </div>
                    </div>

                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-12 w-12 rounded-full bg-success hover:bg-success/90 text-success-foreground shrink-0"
                      onClick={(e) =>
                        handleQuickStatus(order.id, order.status, e)
                      }
                    >
                      <Package className="w-5 h-5" />
                    </Button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Other Orders Section - Grouped by Date */}
          {otherOrders.length > 0 && (
            <section className="space-y-6">
              <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                Histórico
              </h2>

              {sortedDates.map((dateKey) => (
                <div key={dateKey} className="space-y-3">
                  <div className="flex items-center px-1">
                    <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {formatDateHeader(dateKey)} {" - "}
                      <span className="text-xs text-muted-foreground">
                        {groupedOrders[dateKey].length} pedido
                        {groupedOrders[dateKey].length !== 1 ? "s" : ""}
                      </span>
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {groupedOrders[dateKey].map((order) => (
                      <div
                        key={order.id}
                        className="card-touch flex items-center gap-3 cursor-pointer active:bg-accent/50 transition-colors opacity-80"
                        onClick={() => setSelectedOrderId(order.id)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-foreground">
                              {order.external_order_id
                                ? `#${order.external_order_id}`
                                : `#${order.id.slice(-4).toUpperCase()}`}
                            </span>
                            <StatusBadge status={order.status} />
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {order.sales_type?.name} • R${" "}
                            {order.total.toFixed(2)}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {format(new Date(order.created_at), "HH:mm", {
                              locale: ptBR,
                            })}
                          </div>
                        </div>

                        {order.status === "picked_up" && (
                          <Button
                            size="icon"
                            variant="secondary"
                            className="h-12 w-12 rounded-full bg-success hover:bg-success/90 text-success-foreground shrink-0"
                            onClick={(e) =>
                              handleQuickStatus(order.id, order.status, e)
                            }
                          >
                            <Check className="w-5 h-5" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </section>
          )}
        </div>
      )}

      <NewOrderSheet open={isNewOrderOpen} onOpenChange={setIsNewOrderOpen} />

      <OrderDetailsSheet
        orderId={selectedOrderId}
        open={!!selectedOrderId}
        onOpenChange={(open) => !open && setSelectedOrderId(null)}
      />
    </div>
  );
}
