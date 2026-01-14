import { useState } from "react";
import { Plus, Package, Edit2, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { useProducts, useDeleteProduct } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { Product } from "@/types/database";
import { ProductFormSheet } from "@/components/products/ProductFormSheet";
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

export default function ProductsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const { data: products, isLoading } = useProducts();
  const { data: categories } = useCategories();
  const deleteProduct = useDeleteProduct();

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingProduct(null);
  };

  const getStockClass = (stock: number) => {
    if (stock === 0) return "stock-zero";
    if (stock <= 5) return "stock-low";
    return "stock-ok";
  };

  // Group products by category
  const productsByCategory = categories?.reduce((acc, cat) => {
    acc[cat.id] = products?.filter(p => p.category_id === cat.id) || [];
    return acc;
  }, {} as Record<string, Product[]>) || {};

  const uncategorizedProducts = products?.filter(p => !p.category_id) || [];

  return (
    <div className="page-container">
      <PageHeader 
        title="Produtos" 
        subtitle={`${products?.length || 0} produto${products?.length !== 1 ? 's' : ''}`}
        action={
          <Button onClick={() => setIsFormOpen(true)} className="h-12 w-12 rounded-full p-0">
            <Plus className="w-6 h-6" />
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="card-touch animate-pulse">
              <div className="h-5 bg-muted rounded w-1/2 mb-2" />
              <div className="h-4 bg-muted rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : products?.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Nenhum produto"
          description="Adicione produtos para começar a criar pedidos"
          actionLabel="Adicionar Produto"
          onAction={() => setIsFormOpen(true)}
        />
      ) : (
        <div className="space-y-6">
          {categories?.map(category => {
            const categoryProducts = productsByCategory[category.id];
            if (!categoryProducts?.length) return null;
            
            return (
              <section key={category.id}>
                <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                  {category.name}
                </h2>
                <div className="space-y-3">
                  {categoryProducts.map(product => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      getStockClass={getStockClass}
                      onEdit={handleEdit}
                      onDelete={() => deleteProduct.mutate(product.id)}
                    />
                  ))}
                </div>
              </section>
            );
          })}

          {uncategorizedProducts.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                Sem Categoria
              </h2>
              <div className="space-y-3">
                {uncategorizedProducts.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    getStockClass={getStockClass}
                    onEdit={handleEdit}
                    onDelete={() => deleteProduct.mutate(product.id)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}


      <ProductFormSheet
        open={isFormOpen}
        onOpenChange={handleCloseForm}
        product={editingProduct}
      />
    </div>
  );
}

interface ProductCardProps {
  product: Product;
  getStockClass: (stock: number) => string;
  onEdit: (product: Product) => void;
  onDelete: () => void;
}

function ProductCard({ product, getStockClass, onEdit, onDelete }: ProductCardProps) {
  return (
    <div className="card-touch flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{product.name}</div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted-foreground">
            R$ {product.price.toFixed(2)}
          </span>
          <span className={getStockClass(product.stock)}>
            {product.stock} un
          </span>
        </div>
      </div>
      
      <div className="flex gap-1">
        <Button
          size="icon"
          variant="ghost"
          className="h-10 w-10"
          onClick={() => onEdit(product)}
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
              <AlertDialogTitle>Excluir produto?</AlertDialogTitle>
              <AlertDialogDescription>
                "{product.name}" será excluído permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive hover:bg-destructive/90"
                onClick={onDelete}
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
