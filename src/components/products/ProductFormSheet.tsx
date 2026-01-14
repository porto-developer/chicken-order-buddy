import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCategories } from "@/hooks/useCategories";
import { useCreateProduct, useUpdateProduct } from "@/hooks/useProducts";
import { Product } from "@/types/database";

interface ProductFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
}

export function ProductFormSheet({ open, onOpenChange, product }: ProductFormSheetProps) {
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");

  const { data: categories } = useCategories();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  const isEditing = !!product;

  useEffect(() => {
    if (product) {
      setName(product.name);
      setCategoryId(product.category_id || "none");
      setPrice(product.price.toString());
      setStock(product.stock.toString());
    } else {
      setName("");
      setCategoryId("");
      setPrice("");
      setStock("0");
    }
  }, [product, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      name: name.trim(),
      category_id: categoryId && categoryId !== "none" ? categoryId : null,
      price: parseFloat(price) || 0,
      stock: parseInt(stock) || 0,
    };

    if (isEditing && product) {
      await updateProduct.mutateAsync({ id: product.id, ...data });
    } else {
      await createProduct.mutateAsync(data);
    }

    onOpenChange(false);
  };

  const isPending = createProduct.isPending || updateProduct.isPending;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-auto rounded-t-3xl">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-xl">
            {isEditing ? "Editar Produto" : "Novo Produto"}
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Produto</Label>
            <Input
              id="name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Frango Frito 500g"
              className="input-touch"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="input-touch">
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem categoria</SelectItem>
                {categories?.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Preço (R$)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={e => setPrice(e.target.value)}
                placeholder="0,00"
                className="input-touch"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stock">Estoque</Label>
              <Input
                id="stock"
                type="number"
                min="0"
                value={stock}
                onChange={e => setStock(e.target.value)}
                placeholder="0"
                className="input-touch"
                required
              />
            </div>
          </div>

          <div className="pt-4">
            <Button
              type="submit"
              className="w-full btn-touch"
              disabled={!name.trim() || isPending}
            >
              {isPending ? "Salvando..." : isEditing ? "Atualizar" : "Criar Produto"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
