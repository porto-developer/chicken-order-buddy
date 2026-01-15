-- Add discount column to orders table
ALTER TABLE orders ADD COLUMN discount DECIMAL(10, 2) DEFAULT 0 NOT NULL;

-- Add comment to describe the column
COMMENT ON COLUMN orders.discount IS 'Discount amount applied to the order (e.g., from delivery apps)';
