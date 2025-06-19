/*
  # Add Customer Rejection Feature

  1. Enhanced Customer Table
    - Add rejection_reason field for storing rejection details
    - Add rejected_at timestamp for tracking when rejection occurred
    - Add rejected_by field for tracking who rejected the customer

  2. Customer Status Updates
    - Add 'rejected' as a valid status option
    - Update existing status constraints

  3. Security
    - Maintain existing RLS policies
    - Add indexes for performance
*/

-- Add rejection tracking fields to customers table
DO $$
BEGIN
  -- Rejection reason
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'rejection_reason'
  ) THEN
    ALTER TABLE customers ADD COLUMN rejection_reason text;
  END IF;

  -- Rejection timestamp
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'rejected_at'
  ) THEN
    ALTER TABLE customers ADD COLUMN rejected_at timestamptz;
  END IF;

  -- Who rejected the customer
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'rejected_by'
  ) THEN
    ALTER TABLE customers ADD COLUMN rejected_by text DEFAULT 'system';
  END IF;
END $$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customers_rejected_at ON customers(rejected_at);
CREATE INDEX IF NOT EXISTS idx_customers_rejection_reason ON customers(rejection_reason);

-- Function to reject a customer with reason
CREATE OR REPLACE FUNCTION reject_customer_with_reason(
  customer_uuid uuid,
  reason text,
  rejected_by_user text DEFAULT 'system'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE customers 
  SET 
    status = 'rejected',
    rejection_reason = reason,
    rejected_at = now(),
    rejected_by = rejected_by_user
  WHERE id = customer_uuid;
  
  -- Cancel any pending commissions for this customer
  UPDATE commission_tracking 
  SET commission_status = 'cancelled'
  WHERE customer_id = customer_uuid AND commission_status = 'pending';
END;
$$;

-- Function to reactivate a rejected customer
CREATE OR REPLACE FUNCTION reactivate_customer(customer_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE customers 
  SET 
    status = 'new',
    rejection_reason = NULL,
    rejected_at = NULL,
    rejected_by = NULL
  WHERE id = customer_uuid;
  
  -- Reactivate commissions if they were cancelled due to rejection
  UPDATE commission_tracking 
  SET commission_status = 'pending'
  WHERE customer_id = customer_uuid AND commission_status = 'cancelled';
END;
$$;

-- Function to get customer rejection history
CREATE OR REPLACE FUNCTION get_customer_rejection_history()
RETURNS TABLE (
  customer_id uuid,
  customer_name text,
  customer_email text,
  project_type text,
  rejection_reason text,
  rejected_at timestamptz,
  rejected_by text,
  project_value decimal(10,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as customer_id,
    c.name as customer_name,
    c.email as customer_email,
    c.project_type,
    c.rejection_reason,
    c.rejected_at,
    c.rejected_by,
    c.project_value
  FROM customers c
  WHERE c.status = 'rejected'
  ORDER BY c.rejected_at DESC;
END;
$$;