-- Add 'no-cash' value to payment_method ENUM type
ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'no-cash';
