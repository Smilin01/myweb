/*
  # Fix Payment Recording Issues

  1. Ensure payment_history table exists with correct structure
  2. Add proper constraints and defaults
  3. Fix any missing columns or data type issues
  4. Update RLS policies for payment operations
*/

-- Ensure payment_history table has correct structure
CREATE TABLE IF NOT EXISTS payment_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL,
  payment_amount decimal(10,2) NOT NULL CHECK (payment_amount > 0),
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  payment_method text NOT NULL,
  transaction_reference text,
  notes text,
  receipt_url text,
  created_at timestamptz DEFAULT now(),
  created_by text DEFAULT 'system'
);

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'payment_history_customer_id_fkey'
  ) THEN
    ALTER TABLE payment_history 
    ADD CONSTRAINT payment_history_customer_id_fkey 
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Ensure customers table has required payment fields
DO $$
BEGIN
  -- Project value (required field)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'project_value'
  ) THEN
    ALTER TABLE customers ADD COLUMN project_value decimal(10,2) NOT NULL DEFAULT 0;
  END IF;

  -- Total paid amount
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'total_paid_amount'
  ) THEN
    ALTER TABLE customers ADD COLUMN total_paid_amount decimal(10,2) DEFAULT 0;
  END IF;

  -- Payment terms
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'payment_terms'
  ) THEN
    ALTER TABLE customers ADD COLUMN payment_terms text;
  END IF;

  -- Payment method preference
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'payment_method_preference'
  ) THEN
    ALTER TABLE customers ADD COLUMN payment_method_preference text;
  END IF;
END $$;

-- Enable RLS on payment_history if not already enabled
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Authenticated users can manage payment history" ON payment_history;

-- Create comprehensive RLS policies for payment_history
CREATE POLICY "Authenticated users can manage payment history"
  ON payment_history
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create or replace the payment totals update function
CREATE OR REPLACE FUNCTION update_customer_payment_totals()
RETURNS TRIGGER AS $$
BEGIN
  -- Update total paid amount
  UPDATE customers 
  SET total_paid_amount = (
    SELECT COALESCE(SUM(payment_amount), 0) 
    FROM payment_history 
    WHERE customer_id = NEW.customer_id
  )
  WHERE id = NEW.customer_id;
  
  -- Update payment status based on new totals
  UPDATE customers 
  SET payment_status = CASE 
    WHEN total_paid_amount = 0 THEN 'not_started'
    WHEN total_paid_amount >= project_value THEN 'fully_paid'
    WHEN total_paid_amount > 0 AND total_paid_amount < project_value THEN 'partial_paid'
    ELSE 'not_started'
  END
  WHERE id = NEW.customer_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS update_payment_totals_trigger ON payment_history;
CREATE TRIGGER update_payment_totals_trigger
  AFTER INSERT ON payment_history
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_payment_totals();

-- Create or replace the payment summary function
CREATE OR REPLACE FUNCTION get_customer_payment_summary(customer_uuid uuid)
RETURNS TABLE (
  project_value decimal(10,2),
  total_paid decimal(10,2),
  remaining_balance decimal(10,2),
  payment_status text,
  payment_progress numeric,
  total_payments bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.project_value,
    COALESCE(c.total_paid_amount, 0) as total_paid,
    (c.project_value - COALESCE(c.total_paid_amount, 0)) as remaining_balance,
    c.payment_status,
    CASE 
      WHEN c.project_value > 0 THEN ROUND((COALESCE(c.total_paid_amount, 0) / c.project_value) * 100, 2)
      ELSE 0
    END as payment_progress,
    COALESCE(COUNT(ph.id), 0) as total_payments
  FROM customers c
  LEFT JOIN payment_history ph ON ph.customer_id = c.id
  WHERE c.id = customer_uuid
  GROUP BY c.id, c.project_value, c.total_paid_amount, c.payment_status;
END;
$$;

-- Ensure all existing customers have valid project values
UPDATE customers 
SET project_value = 1000 
WHERE project_value IS NULL OR project_value = 0;

-- Ensure all existing customers have valid payment status
UPDATE customers 
SET payment_status = CASE 
  WHEN payment_status IS NULL THEN 'not_started'
  WHEN payment_status = 'pending' THEN 'not_started'
  WHEN payment_status = 'paid' THEN 'fully_paid'
  WHEN payment_status = 'partial' THEN 'partial_paid'
  ELSE payment_status
END
WHERE payment_status IS NULL OR payment_status IN ('pending', 'paid', 'partial');

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payment_history_customer_id ON payment_history(customer_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_payment_date ON payment_history(payment_date);
CREATE INDEX IF NOT EXISTS idx_customers_project_value ON customers(project_value);
CREATE INDEX IF NOT EXISTS idx_customers_payment_status ON customers(payment_status);