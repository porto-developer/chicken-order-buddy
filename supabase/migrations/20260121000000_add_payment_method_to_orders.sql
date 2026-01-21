-- Add payment_method column to orders table
ALTER TABLE orders ADD COLUMN payment_method TEXT;

-- Add comment to describe the column
COMMENT ON COLUMN orders.payment_method IS 'Payment method used for the order (e.g., Dinheiro, Pix, Cartão)';
