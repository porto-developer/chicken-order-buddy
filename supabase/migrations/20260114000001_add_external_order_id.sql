-- Add external_order_id column to orders table
ALTER TABLE orders ADD COLUMN external_order_id VARCHAR(100);

-- Add comment to describe the column
COMMENT ON COLUMN orders.external_order_id IS 'Order ID from external delivery apps (iFood, Rappi, Uber Eats, etc.)';

-- Create index for faster lookups by external order ID
CREATE INDEX idx_orders_external_order_id ON orders(external_order_id) WHERE external_order_id IS NOT NULL;
