import { useState } from "react";
import { Plus, FolderOpen, Edit2, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  useCategories, 
  useCreateCategory, 
  useUpdateCategory, 
  useDeleteCategory 
} from "@/hooks/useCategories";
import { Category } from "@/types/database";
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

export default function CategoriesPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState("");

  const { data: categories, isLoading } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const handleOpenForm = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setName(category.name);
    } else {
      setEditingCategory(null);
      setName("");
    }
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingCategory(null);
    setName("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingCategory) {
      await updateCategory.mutateAsync({ id: editingCategory.id, name: name.trim() });
    } else {
      await createCategory.mutateAsync(name.trim());
    }
    handleCloseForm();
  };

  const isPending = createCategory.isPending || updateCategory.isPending;

  return (
    <div className="page-container">
      <PageHeader 
        title="Categorias" 
        subtitle={`${categories?.length || 0} categoria${categories?.length !== 1 ? 's' : ''}`}
      />

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="card-touch animate-pulse">
              <div className="h-5 bg-muted rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : categories?.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="Nenhuma categoria"
          description="Crie categorias para organizar seus produtos"
          actionLabel="Criar Categoria"
          onAction={() => handleOpenForm()}
        />
      ) : (
        <div className="space-y-3">
          {categories?.map(category => (
            <div key={category.id} className="card-touch flex items-center gap-3">
              <div className="flex-1">
                <span className="font-medium">{category.name}</span>
              </div>
              
              <div className="flex gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-10 w-10"
                  onClick={() => handleOpenForm(category)}
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
                      <AlertDialogTitle>Excluir categoria?</AlertDialogTitle>
                      <AlertDialogDescription>
                        "{category.name}" será excluída. Produtos nesta categoria ficarão sem categoria.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive hover:bg-destructive/90"
                        onClick={() => deleteCategory.mutate(category.id)}
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

      {/* FAB for new category */}
      <button
        className="fab"
        onClick={() => handleOpenForm()}
      >
        <Plus className="w-7 h-7" />
      </button>

      <Dialog open={isFormOpen} onOpenChange={handleCloseForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Editar Categoria" : "Nova Categoria"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Nome da categoria"
              className="input-touch"
              autoFocus
            />
            <Button
              type="submit"
              className="w-full btn-touch"
              disabled={!name.trim() || isPending}
            >
              {isPending ? "Salvando..." : editingCategory ? "Atualizar" : "Criar"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
