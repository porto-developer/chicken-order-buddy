-- Create product_prices table for different prices per sales type
CREATE TABLE public.product_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    sales_type_id UUID REFERENCES public.sales_types(id) ON DELETE CASCADE NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(product_id, sales_type_id)
);

-- Enable RLS with public access
ALTER TABLE public.product_prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access for product_prices" ON public.product_prices FOR ALL USING (true) WITH CHECK (true);