import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Order, OrderStatus, CartItem } from "@/types/database";
import { toast } from "sonner";

export function useOrders() {
  return useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, sales_type:sales_types(*), order_items(*)")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Order[];
    },
  });
}

interface CreateOrderInput {
  sales_type_id: string;
  customer_name?: string;
  notes?: string;
  items: CartItem[];
  customTotal?: number;
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: CreateOrderInput) => {
      // Calculate total from cart items using their unit prices
      const calculatedTotal = input.items.reduce(
        (sum, item) => sum + item.unitPrice * item.quantity, 
        0
      );
      
      // Use custom total if provided, otherwise use calculated total
      const total = input.customTotal !== undefined ? input.customTotal : calculatedTotal;

      // Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          sales_type_id: input.sales_type_id,
          customer_name: input.customer_name || null,
          notes: input.notes || null,
          total,
          status: 'pending' as OrderStatus,
        })
        .select()
        .single();
      
      if (orderError) throw orderError;

      // Create order items with the actual unit prices used
      const orderItems = input.items.map(item => ({
        order_id: order.id,
        product_id: item.product.id,
        product_name: item.product.name,
        quantity: item.quantity,
        unit_price: item.unitPrice,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);
      
      if (itemsError) throw itemsError;

      // Update stock for each product
      for (const item of input.items) {
        const newStock = Math.max(0, item.product.stock - item.quantity);
        await supabase
          .from("products")
          .update({ stock: newStock })
          .eq("id", item.product.id);
      }

      return order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Pedido criado com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao criar pedido");
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status, restoreStock }: { id: string; status: OrderStatus; restoreStock?: boolean }) => {
      // If cancelling, restore stock
      if (restoreStock) {
        const { data: orderItems } = await supabase
          .from("order_items")
          .select("*, product:products(*)")
          .eq("order_id", id);
        
        if (orderItems) {
          for (const item of orderItems) {
            if (item.product) {
              const newStock = item.product.stock + item.quantity;
              await supabase
                .from("products")
                .update({ stock: newStock })
                .eq("id", item.product_id);
            }
          }
        }
      }

      const { data, error } = await supabase
        .from("orders")
        .update({ status })
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      
      const messages: Record<OrderStatus, string> = {
        pending: "Pedido marcado como pendente",
        picked_up: "Pedido marcado como retirado",
        completed: "Pedido concluído!",
        cancelled: "Pedido cancelado",
      };
      toast.success(messages[variables.status]);
    },
    onError: () => {
      toast.error("Erro ao atualizar pedido");
    },
  });
}

export function useDeleteOrder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, restoreStock }: { id: string; restoreStock: boolean }) => {
      // Restore stock if needed
      if (restoreStock) {
        const { data: orderItems } = await supabase
          .from("order_items")
          .select("*, product:products(*)")
          .eq("order_id", id);
        
        if (orderItems) {
          for (const item of orderItems) {
            if (item.product) {
              const newStock = item.product.stock + item.quantity;
              await supabase
                .from("products")
                .update({ stock: newStock })
                .eq("id", item.product_id);
            }
          }
        }
      }

      const { error } = await supabase
        .from("orders")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Pedido excluído!");
    },
    onError: () => {
      toast.error("Erro ao excluir pedido");
    },
  });
}
