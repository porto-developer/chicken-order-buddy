import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { PaymentStatusBadge } from "@/components/PaymentStatusBadge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useOrders,
  useUpdateOrderStatus,
  useUpdateOrder,
  useDeleteOrder,
} from "@/hooks/useOrders";
import { OrderStatus } from "@/types/database";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Package, Check, X, Trash2, Edit, Save } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface OrderDetailsSheetProps {
  orderId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrderDetailsSheet({
  orderId,
  open,
  onOpenChange,
}: OrderDetailsSheetProps) {
  const { data: orders } = useOrders();
  const updateStatus = useUpdateOrderStatus();
  const updateOrder = useUpdateOrder();
  const deleteOrder = useDeleteOrder();

  const order = orders?.find((o) => o.id === orderId);
  
  const [isEditingPayment, setIsEditingPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>("");

  if (!order) return null;

  const handleStatusChange = (status: OrderStatus) => {
    const restoreStock = status === "cancelled" && order.status !== "cancelled";
    updateStatus.mutate({ id: order.id, status, restoreStock });
  };

  const handleDelete = () => {
    const restoreStock =
      order.status !== "cancelled" && order.status !== "completed";
    deleteOrder.mutate({ id: order.id, restoreStock });
    onOpenChange(false);
  };

  const canMarkPickedUp = order.status === "pending";
  const canMarkCompleted =
    order.status === "pending" || order.status === "picked_up";
  const canCancel = order.status === "pending" || order.status === "picked_up";

  const handleSavePayment = async () => {
    if (!order) return;
    
    await updateOrder.mutateAsync({
      id: order.id,
      data: {
        payment_method: paymentMethod === "none" ? undefined : paymentMethod,
      },
    });
    
    setIsEditingPayment(false);
  };

  const handleStartEditPayment = () => {
    setPaymentMethod(order?.payment_method || "none");
    setIsEditingPayment(true);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[85vh] rounded-t-3xl p-0 flex flex-col"
      >
        <SheetHeader className="p-4 border-b shrink-0">
          <div className="flex items-center justify-between mr-5">
            <SheetTitle className="text-xl">
              Pedido #{order.id.slice(-4).toUpperCase()}
            </SheetTitle>
            <div className="flex gap-2">
              <StatusBadge status={order.status} />
              {order.status !== 'cancelled' && (
                <PaymentStatusBadge paymentMethod={order.payment_method} />
              )}
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
          {/* Order Info */}
          <div className="card-touch space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tipo de Venda</span>
              <span className="font-medium">{order.sales_type?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Data/Hora</span>
              <span className="font-medium">
                {format(new Date(order.created_at), "dd/MM/yyyy HH:mm", {
                  locale: ptBR,
                })}
              </span>
            </div>
            {order.customer_name && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cliente</span>
                <span className="font-medium">{order.customer_name}</span>
              </div>
            )}
            {order.external_order_id && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">ID Externo</span>
                <span className="font-medium font-mono text-sm">
                  {order.external_order_id}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-muted-foreground">Forma de Pagamento</span>
              {!isEditingPayment ? (
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {order.payment_method || "Não informada"}
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={handleStartEditPayment}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger className="w-40 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Não informada</SelectItem>
                      <SelectItem value="PIX">PIX</SelectItem>
                      <SelectItem value="Crédito">Crédito</SelectItem>
                      <SelectItem value="Débito">Débito</SelectItem>
                      <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                      <SelectItem value="Delivery">Delivery</SelectItem>
                      <SelectItem value="Fiado">Fiado</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-green-600"
                    onClick={handleSavePayment}
                    disabled={updateOrder.isPending}
                  >
                    <Save className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => setIsEditingPayment(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Items */}
          <div className="card-touch">
            <h3 className="font-semibold mb-3">Itens do Pedido</h3>
            <div className="space-y-3">
              {order.order_items?.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center"
                >
                  <div>
                    <div className="font-medium">{item.product_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {item.quantity}x R$ {item.unit_price.toFixed(2)}
                    </div>
                  </div>
                  <div className="font-semibold">
                    R$ {(item.quantity * item.unit_price).toFixed(2)}
                  </div>
                </div>
              ))}
              <div className="border-t pt-3 space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">
                    R$ {(order.total + (order.discount || 0)).toFixed(2)}
                  </span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Desconto</span>
                    <span className="font-medium text-success">
                      - R$ {order.discount.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="font-bold">Total</span>
                  <span className="text-xl font-bold text-primary">
                    R$ {order.total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="card-touch">
              <h3 className="font-semibold mb-2">Observações</h3>
              <p className="text-muted-foreground">{order.notes}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="shrink-0 bg-card border-t p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {canMarkPickedUp && (
              <Button
                variant="secondary"
                className="btn-touch"
                onClick={() => handleStatusChange("picked_up")}
              >
                <Package className="w-5 h-5 mr-2" />
                Retirado
              </Button>
            )}

            {canMarkCompleted && (
              <Button
                className="btn-touch bg-success hover:bg-success/90"
                onClick={() => handleStatusChange("completed")}
              >
                <Check className="w-5 h-5 mr-2" />
                Concluir
              </Button>
            )}

            {canCancel && (
              <Button
                variant="outline"
                className="btn-touch text-destructive border-destructive hover:bg-destructive/10"
                onClick={() => handleStatusChange("cancelled")}
              >
                <X className="w-5 h-5 mr-2" />
                Cancelar
              </Button>
            )}
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                className="w-full btn-touch text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-5 h-5 mr-2" />
                Excluir Pedido
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir pedido?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. O estoque será restaurado se
                  o pedido não estiver concluído.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive hover:bg-destructive/90"
                  onClick={handleDelete}
                >
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </SheetContent>
    </Sheet>
  );
}
