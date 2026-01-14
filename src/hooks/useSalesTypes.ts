import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SalesType } from "@/types/database";
import { toast } from "sonner";

export function useSalesTypes() {
  return useQuery({
    queryKey: ["sales_types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales_types")
        .select("*")
        .order("name");
      
      if (error) throw error;
      return data as SalesType[];
    },
  });
}

export function useCreateSalesType() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from("sales_types")
        .insert({ name })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales_types"] });
      toast.success("Tipo de venda criado!");
    },
    onError: () => {
      toast.error("Erro ao criar tipo de venda");
    },
  });
}

export function useUpdateSalesType() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { data, error } = await supabase
        .from("sales_types")
        .update({ name })
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales_types"] });
      toast.success("Tipo de venda atualizado!");
    },
    onError: () => {
      toast.error("Erro ao atualizar tipo de venda");
    },
  });
}

export function useDeleteSalesType() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("sales_types")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales_types"] });
      toast.success("Tipo de venda excluído!");
    },
    onError: () => {
      toast.error("Erro ao excluir tipo de venda");
    },
  });
}
