import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Minus, ShoppingCart, Trash2, Edit2 } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { useSalesTypes } from "@/hooks/useSalesTypes";
import { useCreateOrder } from "@/hooks/useOrders";
import { getProductPrice } from "@/hooks/useProductPrices";
import { CartItem, Product, SalesType } from "@/types/database";
import { toast } from "sonner";

interface NewOrderSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewOrderSheet({ open, onOpenChange }: NewOrderSheetProps) {
  const [step, setStep] = useState<'type' | 'products' | 'review'>('type');
  const [selectedType, setSelectedType] = useState<SalesType | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [notes, setNotes] = useState("");
  const [customTotal, setCustomTotal] = useState<string>("");
  const [isEditingTotal, setIsEditingTotal] = useState(false);
  
  const { data: products } = useProducts();
  const { data: salesTypes } = useSalesTypes();
  const createOrder = useCreateOrder();

  const availableProducts = products?.filter(p => p.stock > 0) || [];
  
  // Calculate total from cart items using their specific unit prices
  const calculatedTotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  
  // Use custom total if set, otherwise use calculated total
  const total = customTotal !== "" ? parseFloat(customTotal) || 0 : calculatedTotal;

  // Reset custom total when cart changes
  useEffect(() => {
    if (!isEditingTotal) {
      setCustomTotal("");
    }
  }, [cart, isEditingTotal]);

  const getPrice = (product: Product): number => {
    if (!selectedType) return product.price;
    return getProductPrice(product, selectedType.id);
  };

  const addToCart = (product: Product) => {
    const unitPrice = getPrice(product);
    const existing = cart.find(item => item.product.id === product.id);
    if (existing) {
      if (existing.quantity < product.stock) {
        setCart(cart.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ));
      } else {
        toast.error("Estoque insuficiente");
      }
    } else {
      setCart([...cart, { product, quantity: 1, unitPrice }]);
    }
  };

  const updateQuantity = (productId: string, delta: number) => {
    const item = cart.find(i => i.product.id === productId);
    if (!item) return;
    
    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      setCart(cart.filter(i => i.product.id !== productId));
    } else if (newQty <= item.product.stock) {
      setCart(cart.map(i =>
        i.product.id === productId ? { ...i, quantity: newQty } : i
      ));
    } else {
      toast.error("Estoque insuficiente");
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(i => i.product.id !== productId));
  };

  const handleSubmit = async () => {
    if (!selectedType || cart.length === 0) return;
    
    await createOrder.mutateAsync({
      sales_type_id: selectedType.id,
      customer_name: customerName || undefined,
      notes: notes || undefined,
      items: cart,
      customTotal: customTotal !== "" ? total : undefined,
    });

    // Reset
    handleClose();
  };

  const handleClose = () => {
    setStep('type');
    setSelectedType(null);
    setCart([]);
    setCustomerName("");
    setNotes("");
    setCustomTotal("");
    setIsEditingTotal(false);
    onOpenChange(false);
  };

  const handleTotalEdit = () => {
    setCustomTotal(calculatedTotal.toFixed(2));
    setIsEditingTotal(true);
  };

  const handleTotalBlur = () => {
    setIsEditingTotal(false);
    if (customTotal === "" || parseFloat(customTotal) === calculatedTotal) {
      setCustomTotal("");
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="text-xl">
            {step === 'type' && "Tipo de Venda"}
            {step === 'products' && "Adicionar Produtos"}
            {step === 'review' && "Revisar Pedido"}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4">
          {/* Step 1: Sales Type */}
          {step === 'type' && (
            <div className="grid grid-cols-2 gap-3">
              {salesTypes?.map(type => (
                <button
                  key={type.id}
                  className={`card-touch p-6 text-center transition-all ${
                    selectedType?.id === type.id
                      ? "ring-2 ring-primary bg-accent"
                      : "hover:bg-accent/50"
                  }`}
                  onClick={() => setSelectedType(type)}
                >
                  <span className="text-lg font-medium">{type.name}</span>
                </button>
              ))}
            </div>
          )}

          {/* Step 2: Products */}
          {step === 'products' && (
            <div className="space-y-3">
              {availableProducts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum produto em estoque
                </div>
              ) : (
                availableProducts.map(product => {
                  const cartItem = cart.find(i => i.product.id === product.id);
                  const displayPrice = getPrice(product);
                  const hasCustomPrice = selectedType && product.product_prices?.some(
                    pp => pp.sales_type_id === selectedType.id
                  );
                  
                  return (
                    <div key={product.id} className="card-touch flex items-center gap-3">
                      <div className="flex-1">
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-muted-foreground">
                          R$ {displayPrice.toFixed(2)}
                          {hasCustomPrice && (
                            <span className="ml-1 text-xs text-primary">(preço {selectedType?.name})</span>
                          )}
                          {" "}• {product.stock} em estoque
                        </div>
                      </div>
                      
                      {cartItem ? (
                        <div className="flex items-center gap-2">
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-10 w-10 rounded-full"
                            onClick={() => updateQuantity(product.id, -1)}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="w-8 text-center font-semibold">
                            {cartItem.quantity}
                          </span>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-10 w-10 rounded-full"
                            onClick={() => updateQuantity(product.id, 1)}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="icon"
                          className="h-10 w-10 rounded-full"
                          onClick={() => addToCart(product)}
                        >
                          <Plus className="w-5 h-5" />
                        </Button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Step 3: Review */}
          {step === 'review' && (
            <div className="space-y-4">
              <div className="card-touch">
                <div className="text-sm text-muted-foreground mb-1">Tipo de Venda</div>
                <div className="font-medium">{selectedType?.name}</div>
              </div>

              <div className="card-touch space-y-3">
                <div className="text-sm text-muted-foreground">Itens do Pedido</div>
                {cart.map(item => (
                  <div key={item.product.id} className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="font-medium">{item.product.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {item.quantity}x R$ {item.unitPrice.toFixed(2)}
                      </div>
                    </div>
                    <div className="font-semibold">
                      R$ {(item.unitPrice * item.quantity).toFixed(2)}
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive"
                      onClick={() => removeFromCart(item.product.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                
                <div className="border-t pt-3">
                  <div className="flex justify-between items-center text-sm text-muted-foreground mb-2">
                    <span>Subtotal</span>
                    <span>R$ {calculatedTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total Final</span>
                    {isEditingTotal ? (
                      <div className="flex items-center gap-2">
                        <span>R$</span>
                        <Input
                          type="number"
                          step="0.01"
                          value={customTotal}
                          onChange={e => setCustomTotal(e.target.value)}
                          onBlur={handleTotalBlur}
                          className="w-24 h-8 text-right"
                          autoFocus
                        />
                      </div>
                    ) : (
                      <button
                        className="flex items-center gap-2 text-xl font-bold text-primary hover:underline"
                        onClick={handleTotalEdit}
                      >
                        R$ {total.toFixed(2)}
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {customTotal !== "" && parseFloat(customTotal) !== calculatedTotal && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Valor ajustado manualmente (original: R$ {calculatedTotal.toFixed(2)})
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <Input
                  placeholder="Nome do cliente (opcional)"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="input-touch"
                />
                <Textarea
                  placeholder="Observações (opcional)"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer with actions */}
        <div className="sticky bottom-0 bg-card border-t p-4 space-y-3">
          {/* Cart summary when on products step */}
          {step === 'products' && cart.length > 0 && (
            <div className="flex items-center justify-between bg-accent rounded-xl p-3">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-primary" />
                <span className="font-medium">{cart.length} item(s)</span>
              </div>
              <span className="font-bold text-primary">R$ {calculatedTotal.toFixed(2)}</span>
            </div>
          )}

          <div className="flex gap-3">
            {step !== 'type' && (
              <Button
                variant="outline"
                className="flex-1 btn-touch"
                onClick={() => setStep(step === 'review' ? 'products' : 'type')}
              >
                Voltar
              </Button>
            )}
            
            {step === 'type' && (
              <Button
                className="flex-1 btn-touch"
                disabled={!selectedType}
                onClick={() => setStep('products')}
              >
                Continuar
              </Button>
            )}
            
            {step === 'products' && (
              <Button
                className="flex-1 btn-touch"
                disabled={cart.length === 0}
                onClick={() => setStep('review')}
              >
                Revisar Pedido
              </Button>
            )}
            
            {step === 'review' && (
              <Button
                className="flex-1 btn-touch"
                disabled={createOrder.isPending}
                onClick={handleSubmit}
              >
                {createOrder.isPending ? "Criando..." : "Criar Pedido"}
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
