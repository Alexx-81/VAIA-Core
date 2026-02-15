-- Add customer_id column to sales table to link sales with customers
-- This is an optional field - sales can exist without a customer

-- Add customer_id column (nullable)
ALTER TABLE sales
ADD COLUMN customer_id UUID;

-- Add foreign key constraint to customers table
-- ON DELETE SET NULL ensures sales are preserved if customer is deleted
ALTER TABLE sales
ADD CONSTRAINT sales_customer_id_fkey
FOREIGN KEY (customer_id)
REFERENCES customers(id)
ON DELETE SET NULL;

-- Add index for faster queries filtering by customer
CREATE INDEX idx_sales_customer_id ON sales(customer_id);

-- Add column comment
COMMENT ON COLUMN sales.customer_id IS 'Optional reference to the customer who made the purchase';
