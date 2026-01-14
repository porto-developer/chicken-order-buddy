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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useCategories } from "@/hooks/useCategories";
import { useCreateProduct, useUpdateProduct } from "@/hooks/useProducts";
import { useSalesTypes } from "@/hooks/useSalesTypes";
import { useProductPrices, useUpsertProductPrice, useDeleteProductPrice } from "@/hooks/useProductPrices";
import { Product } from "@/types/database";
import { Trash2 } from "lucide-react";

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
  const [customPrices, setCustomPrices] = useState<Record<string, string>>({});

  const { data: categories } = useCategories();
  const { data: salesTypes } = useSalesTypes();
  const { data: productPrices } = useProductPrices(product?.id);
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const upsertPrice = useUpsertProductPrice();
  const deletePrice = useDeleteProductPrice();

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
      setCustomPrices({});
    }
  }, [product, open]);

  // Load existing custom prices when editing
  useEffect(() => {
    if (productPrices) {
      const prices: Record<string, string> = {};
      productPrices.forEach(pp => {
        prices[pp.sales_type_id] = pp.price.toString();
      });
      setCustomPrices(prices);
    }
  }, [productPrices]);

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
      
      // Save custom prices
      for (const salesTypeId of Object.keys(customPrices)) {
        const priceValue = parseFloat(customPrices[salesTypeId]);
        if (!isNaN(priceValue) && priceValue > 0) {
          await upsertPrice.mutateAsync({
            product_id: product.id,
            sales_type_id: salesTypeId,
            price: priceValue,
          });
        }
      }
    } else {
      const newProduct = await createProduct.mutateAsync(data);
      
      // Save custom prices for new product
      for (const salesTypeId of Object.keys(customPrices)) {
        const priceValue = parseFloat(customPrices[salesTypeId]);
        if (!isNaN(priceValue) && priceValue > 0) {
          await upsertPrice.mutateAsync({
            product_id: newProduct.id,
            sales_type_id: salesTypeId,
            price: priceValue,
          });
        }
      }
    }

    onOpenChange(false);
  };

  const handleCustomPriceChange = (salesTypeId: string, value: string) => {
    setCustomPrices(prev => ({
      ...prev,
      [salesTypeId]: value,
    }));
  };

  const handleRemoveCustomPrice = async (salesTypeId: string) => {
    if (product) {
      await deletePrice.mutateAsync({ productId: product.id, salesTypeId });
    }
    setCustomPrices(prev => {
      const updated = { ...prev };
      delete updated[salesTypeId];
      return updated;
    });
  };

  const isPending = createProduct.isPending || updateProduct.isPending;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl overflow-y-auto">
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
              <Label htmlFor="price">Preço Base (R$)</Label>
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

          {/* Custom Prices per Sales Type */}
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="custom-prices" className="border rounded-xl px-4">
              <AccordionTrigger className="py-3">
                <span className="text-sm font-medium">
                  Preços por Tipo de Venda
                  {Object.keys(customPrices).length > 0 && (
                    <span className="ml-2 text-xs text-primary">
                      ({Object.keys(customPrices).length} configurado{Object.keys(customPrices).length !== 1 ? 's' : ''})
                    </span>
                  )}
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                <p className="text-xs text-muted-foreground mb-3">
                  Configure preços diferentes para cada tipo de venda (ex: taxas de delivery)
                </p>
                <div className="space-y-3">
                  {salesTypes?.map(type => (
                    <div key={type.id} className="flex items-center gap-2">
                      <Label className="w-24 text-sm truncate">{type.name}</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={customPrices[type.id] || ""}
                        onChange={e => handleCustomPriceChange(type.id, e.target.value)}
                        placeholder={price || "Preço base"}
                        className="flex-1 h-10"
                      />
                      {customPrices[type.id] && (
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-10 w-10 text-destructive shrink-0"
                          onClick={() => handleRemoveCustomPrice(type.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="pt-4 pb-8">
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
