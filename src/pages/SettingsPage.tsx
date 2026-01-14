import { useState } from "react";
import { Plus, Settings, Edit2, Trash2, Truck } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  useSalesTypes, 
  useCreateSalesType, 
  useUpdateSalesType, 
  useDeleteSalesType 
} from "@/hooks/useSalesTypes";
import { SalesType } from "@/types/database";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function SettingsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingType, setEditingType] = useState<SalesType | null>(null);
  const [name, setName] = useState("");

  const { data: salesTypes, isLoading } = useSalesTypes();
  const createSalesType = useCreateSalesType();
  const updateSalesType = useUpdateSalesType();
  const deleteSalesType = useDeleteSalesType();

  const handleOpenForm = (salesType?: SalesType) => {
    if (salesType) {
      setEditingType(salesType);
      setName(salesType.name);
    } else {
      setEditingType(null);
      setName("");
    }
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingType(null);
    setName("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingType) {
      await updateSalesType.mutateAsync({ id: editingType.id, name: name.trim() });
    } else {
      await createSalesType.mutateAsync(name.trim());
    }
    handleCloseForm();
  };

  const isPending = createSalesType.isPending || updateSalesType.isPending;

  return (
    <div className="page-container">
      <PageHeader 
        title="Configurações" 
        subtitle="Tipos de venda e mais"
      />

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Truck className="w-5 h-5" />
            Tipos de Venda
          </h2>
          <Button
            size="sm"
            onClick={() => handleOpenForm()}
          >
            <Plus className="w-4 h-4 mr-1" />
            Adicionar
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="card-touch animate-pulse">
                <div className="h-5 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : salesTypes?.length === 0 ? (
          <EmptyState
            icon={Settings}
            title="Nenhum tipo de venda"
            description="Adicione tipos como 'Retirada', 'iFood', etc."
            actionLabel="Adicionar Tipo"
            onAction={() => handleOpenForm()}
          />
        ) : (
          <div className="space-y-3">
            {salesTypes?.map(salesType => (
              <div key={salesType.id} className="card-touch flex items-center gap-3">
                <div className="flex-1">
                  <span className="font-medium">{salesType.name}</span>
                </div>
                
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-10 w-10"
                    onClick={() => handleOpenForm(salesType)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-10 w-10 text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir tipo de venda?</AlertDialogTitle>
                        <AlertDialogDescription>
                          "{salesType.name}" será excluído permanentemente.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive hover:bg-destructive/90"
                          onClick={() => deleteSalesType.mutate(salesType.id)}
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <Dialog open={isFormOpen} onOpenChange={handleCloseForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingType ? "Editar Tipo de Venda" : "Novo Tipo de Venda"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: iFood, Keeta, Retirada..."
              className="input-touch"
              autoFocus
            />
            <Button
              type="submit"
              className="w-full btn-touch"
              disabled={!name.trim() || isPending}
            >
              {isPending ? "Salvando..." : editingType ? "Atualizar" : "Criar"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
