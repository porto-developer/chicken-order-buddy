import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/types/database";
import { toast } from "sonner";

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, category:categories(*)")
        .order("name");
      
      if (error) throw error;
      return data as Product[];
    },
  });
}

interface CreateProductInput {
  name: string;
  category_id: string | null;
  price: number;
  stock: number;
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: CreateProductInput) => {
      const { data, error } = await supabase
        .from("products")
        .insert(input)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Produto criado!");
    },
    onError: () => {
      toast.error("Erro ao criar produto");
    },
  });
}

interface UpdateProductInput {
  id: string;
  name: string;
  category_id: string | null;
  price: number;
  stock: number;
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateProductInput) => {
      const { data, error } = await supabase
        .from("products")
        .update(input)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Produto atualizado!");
    },
    onError: () => {
      toast.error("Erro ao atualizar produto");
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Produto excluído!");
    },
    onError: () => {
      toast.error("Erro ao excluir produto");
    },
  });
}

export function useUpdateStock() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, stock }: { id: string; stock: number }) => {
      const { data, error } = await supabase
        .from("products")
        .update({ stock })
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}
