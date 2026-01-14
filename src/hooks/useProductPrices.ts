import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProductPrice } from "@/types/database";
import { toast } from "sonner";

export function useProductPrices(productId?: string) {
  return useQuery({
    queryKey: ["product_prices", productId],
    queryFn: async () => {
      let query = supabase.from("product_prices").select("*");
      
      if (productId) {
        query = query.eq("product_id", productId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as ProductPrice[];
    },
    enabled: !!productId || productId === undefined,
  });
}

interface UpsertProductPriceInput {
  product_id: string;
  sales_type_id: string;
  price: number;
}

export function useUpsertProductPrice() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: UpsertProductPriceInput) => {
      const { data, error } = await supabase
        .from("product_prices")
        .upsert(input, { onConflict: 'product_id,sales_type_id' })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["product_prices", variables.product_id] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Preço salvo!");
    },
    onError: () => {
      toast.error("Erro ao salvar preço");
    },
  });
}

export function useDeleteProductPrice() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ productId, salesTypeId }: { productId: string; salesTypeId: string }) => {
      const { error } = await supabase
        .from("product_prices")
        .delete()
        .eq("product_id", productId)
        .eq("sales_type_id", salesTypeId);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["product_prices", variables.productId] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

// Helper function to get the price for a product based on sales type
export function getProductPrice(product: { price: number; product_prices?: ProductPrice[] }, salesTypeId: string): number {
  const specificPrice = product.product_prices?.find(pp => pp.sales_type_id === salesTypeId);
  return specificPrice ? specificPrice.price : product.price;
}
