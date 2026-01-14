import { useState } from "react";
import { Plus, ClipboardList, Check, Package, X } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { useOrders, useUpdateOrderStatus } from "@/hooks/useOrders";
import { OrderStatus } from "@/types/database";
import { NewOrderSheet } from "@/components/orders/NewOrderSheet";
import { OrderDetailsSheet } from "@/components/orders/OrderDetailsSheet";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function OrdersPage() {
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const { data: orders, isLoading } = useOrders();
  const updateStatus = useUpdateOrderStatus();

  const pendingOrders = orders?.filter(o => o.status === 'pending') || [];
  const otherOrders = orders?.filter(o => o.status !== 'pending') || [];

  const handleQuickStatus = (orderId: string, currentStatus: OrderStatus, e: React.MouseEvent) => {
    e.stopPropagation();
    
    let newStatus: OrderStatus;
    let restoreStock = false;
    
    if (currentStatus === 'pending') {
      newStatus = 'picked_up';
    } else if (currentStatus === 'picked_up') {
      newStatus = 'completed';
    } else {
      return;
    }
    
    updateStatus.mutate({ id: orderId, status: newStatus, restoreStock });
  };

  return (
    <div className="page-container">
      <PageHeader 
        title="Pedidos" 
        subtitle={`${pendingOrders.length} pendente${pendingOrders.length !== 1 ? 's' : ''}`}
      />

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
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
      ) : (
        <div className="space-y-6">
          {/* Pending Orders Section */}
          {pendingOrders.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                Pendentes
              </h2>
              <div className="space-y-3">
                {pendingOrders.map(order => (
                  <div
                    key={order.id}
                    className="card-touch flex items-center gap-3 cursor-pointer active:bg-accent/50 transition-colors"
                    onClick={() => setSelectedOrderId(order.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-foreground">
                          #{order.id.slice(-4).toUpperCase()}
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
                        {format(new Date(order.created_at), "HH:mm", { locale: ptBR })}
                      </div>
                    </div>
                    
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-12 w-12 rounded-full bg-success hover:bg-success/90 text-success-foreground shrink-0"
                      onClick={(e) => handleQuickStatus(order.id, order.status, e)}
                    >
                      <Package className="w-5 h-5" />
                    </Button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Other Orders Section */}
          {otherOrders.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                Histórico
              </h2>
              <div className="space-y-3">
                {otherOrders.slice(0, 10).map(order => (
                  <div
                    key={order.id}
                    className="card-touch flex items-center gap-3 cursor-pointer active:bg-accent/50 transition-colors opacity-80"
                    onClick={() => setSelectedOrderId(order.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-foreground">
                          #{order.id.slice(-4).toUpperCase()}
                        </span>
                        <StatusBadge status={order.status} />
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {order.sales_type?.name} • R$ {order.total.toFixed(2)}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {format(new Date(order.created_at), "dd/MM HH:mm", { locale: ptBR })}
                      </div>
                    </div>
                    
                    {order.status === 'picked_up' && (
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-12 w-12 rounded-full bg-success hover:bg-success/90 text-success-foreground shrink-0"
                        onClick={(e) => handleQuickStatus(order.id, order.status, e)}
                      >
                        <Check className="w-5 h-5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* FAB for new order */}
      <button
        className="fab"
        onClick={() => setIsNewOrderOpen(true)}
      >
        <Plus className="w-7 h-7" />
      </button>

      <NewOrderSheet 
        open={isNewOrderOpen} 
        onOpenChange={setIsNewOrderOpen} 
      />

      <OrderDetailsSheet
        orderId={selectedOrderId}
        open={!!selectedOrderId}
        onOpenChange={(open) => !open && setSelectedOrderId(null)}
      />
    </div>
  );
}
