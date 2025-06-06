-- ============================================================================
-- ADD PREFERRED PAYMENT METHODS TO BUYERS TABLE
-- Migration to add multiple preferred payment methods support
-- ============================================================================

-- First, update the payment_method enum to include all the new payment methods
ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'mobile_banking';
ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'promptpay';
ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'qr_code_payment';

-- Add the new column for preferred payment methods (array of payment methods)
ALTER TABLE buyers 
ADD COLUMN IF NOT EXISTS preferred_payment_methods payment_method[];

-- Update the buyers table comment for documentation
COMMENT ON COLUMN buyers.preferred_payment_methods IS 'Array of preferred payment methods for the buyer (nullable)';

-- Remove the old single preferred_payment_method column since we now have an array
ALTER TABLE buyers DROP COLUMN IF EXISTS preferred_payment_method;

-- Add an index for better query performance on the new array column
CREATE INDEX IF NOT EXISTS idx_buyers_preferred_payment_methods ON buyers USING GIN (preferred_payment_methods);

-- Update the updated_at timestamp for any existing buyers
UPDATE buyers SET updated_at = NOW() WHERE preferred_payment_methods IS NULL;
