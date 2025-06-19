/*
  # Payment Tracking and Commission Management System

  1. Customer Table Enhancements
    - Add payment tracking fields to customers table
    - Project value, payment status, total paid, remaining balance
    - Payment terms and method preferences

  2. New Payment History Table
    - Track individual payments with full details
    - Payment method, transaction references, receipts
    - Timestamps and notes for each payment

  3. Enhanced Commission System
    - Automatic commission calculation on payments
    - Commission status tracking (pending/paid/cancelled)
    - Commission payment history

  4. Automated Calculations
    - Real-time balance updates
    - Commission triggers on payment receipt
    - Status updates based on payment completion

  5. Security
    - Enable RLS on all new tables
    - Add appropriate policies for authenticated users
    - Create indexes for performance optimization
*/

-- Add payment tracking fields to customers table
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

  -- Enhanced payment status
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'payment_status'
  ) THEN
    -- Update existing payment_status to support new values
    ALTER TABLE customers ALTER COLUMN payment_status DROP DEFAULT;
    ALTER TABLE customers ALTER COLUMN payment_status SET DEFAULT 'not_started';
  END IF;
END $$;

-- Create payment_history table
CREATE TABLE IF NOT EXISTS payment_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  payment_amount decimal(10,2) NOT NULL,
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  payment_method text NOT NULL,
  transaction_reference text,
  notes text,
  receipt_url text,
  created_at timestamptz DEFAULT now(),
  created_by text DEFAULT 'system'
);

-- Create commission_tracking table
CREATE TABLE IF NOT EXISTS commission_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES influencers(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  commission_rate decimal(5,2) NOT NULL,
  project_value decimal(10,2) NOT NULL,
  commission_amount decimal(10,2) NOT NULL,
  commission_status text DEFAULT 'pending' CHECK (commission_status IN ('pending', 'paid', 'cancelled')),
  earned_date timestamptz DEFAULT now(),
  paid_date timestamptz,
  payment_method text,
  payment_reference text,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create commission_payment_history table
CREATE TABLE IF NOT EXISTS commission_payment_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES influencers(id) ON DELETE CASCADE,
  payment_amount decimal(10,2) NOT NULL,
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  payment_method text NOT NULL,
  transaction_reference text,
  commission_ids uuid[] NOT NULL, -- Array of commission IDs being paid
  receipt_url text,
  notes text,
  created_at timestamptz DEFAULT now(),
  created_by text DEFAULT 'system'
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_payment_history_customer_id ON payment_history(customer_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_payment_date ON payment_history(payment_date);
CREATE INDEX IF NOT EXISTS idx_commission_tracking_referrer_id ON commission_tracking(referrer_id);
CREATE INDEX IF NOT EXISTS idx_commission_tracking_customer_id ON commission_tracking(customer_id);
CREATE INDEX IF NOT EXISTS idx_commission_tracking_status ON commission_tracking(commission_status);
CREATE INDEX IF NOT EXISTS idx_commission_payment_history_referrer_id ON commission_payment_history(referrer_id);
CREATE INDEX IF NOT EXISTS idx_customers_project_value ON customers(project_value);
CREATE INDEX IF NOT EXISTS idx_customers_payment_status ON customers(payment_status);

-- Enable RLS on new tables
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_payment_history ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Authenticated users can manage payment history"
  ON payment_history
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can manage commission tracking"
  ON commission_tracking
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can manage commission payments"
  ON commission_payment_history
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Function to calculate remaining balance
CREATE OR REPLACE FUNCTION calculate_remaining_balance(customer_uuid uuid)
RETURNS decimal(10,2)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  project_val decimal(10,2);
  total_paid decimal(10,2);
BEGIN
  SELECT project_value, total_paid_amount 
  INTO project_val, total_paid
  FROM customers 
  WHERE id = customer_uuid;
  
  RETURN COALESCE(project_val, 0) - COALESCE(total_paid, 0);
END;
$$;

-- Function to update payment status based on balance
CREATE OR REPLACE FUNCTION update_payment_status(customer_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  remaining_balance decimal(10,2);
  total_paid decimal(10,2);
  project_val decimal(10,2);
  new_status text;
BEGIN
  SELECT project_value, total_paid_amount 
  INTO project_val, total_paid
  FROM customers 
  WHERE id = customer_uuid;
  
  remaining_balance := COALESCE(project_val, 0) - COALESCE(total_paid, 0);
  
  IF total_paid = 0 THEN
    new_status := 'not_started';
  ELSIF remaining_balance <= 0 THEN
    new_status := 'fully_paid';
  ELSIF total_paid > 0 AND remaining_balance > 0 THEN
    new_status := 'partial_paid';
  ELSE
    new_status := 'not_started';
  END IF;
  
  UPDATE customers 
  SET payment_status = new_status
  WHERE id = customer_uuid;
END;
$$;

-- Function to calculate and create commission when payment is received
CREATE OR REPLACE FUNCTION calculate_commission_on_payment(customer_uuid uuid, payment_amount decimal)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  customer_rec record;
  influencer_rec record;
  commission_amount decimal(10,2);
BEGIN
  -- Get customer details
  SELECT * INTO customer_rec FROM customers WHERE id = customer_uuid;
  
  -- Check if customer has referral source
  IF customer_rec.referral_source IS NOT NULL AND customer_rec.referral_source LIKE 'Referral:%' THEN
    -- Extract referral code
    DECLARE
      referral_code text := TRIM(SUBSTRING(customer_rec.referral_source FROM 'Referral: (.*)'));
    BEGIN
      -- Get influencer details
      SELECT * INTO influencer_rec FROM influencers WHERE referral_code = referral_code;
      
      IF influencer_rec.id IS NOT NULL THEN
        -- Calculate commission based on payment amount
        commission_amount := (payment_amount * influencer_rec.commission_rate / 100);
        
        -- Create or update commission tracking
        INSERT INTO commission_tracking (
          referrer_id,
          customer_id,
          commission_rate,
          project_value,
          commission_amount,
          commission_status
        ) VALUES (
          influencer_rec.id,
          customer_uuid,
          influencer_rec.commission_rate,
          customer_rec.project_value,
          commission_amount,
          'pending'
        )
        ON CONFLICT DO NOTHING; -- Prevent duplicates
      END IF;
    END;
  END IF;
END;
$$;

-- Trigger function to update totals when payment is added
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
  
  -- Update payment status
  PERFORM update_payment_status(NEW.customer_id);
  
  -- Calculate commission if applicable
  PERFORM calculate_commission_on_payment(NEW.customer_id, NEW.payment_amount);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for payment updates
DROP TRIGGER IF EXISTS update_payment_totals_trigger ON payment_history;
CREATE TRIGGER update_payment_totals_trigger
  AFTER INSERT ON payment_history
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_payment_totals();

-- Function to get customer payment summary
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
    c.total_paid_amount,
    calculate_remaining_balance(customer_uuid) as remaining_balance,
    c.payment_status,
    CASE 
      WHEN c.project_value > 0 THEN ROUND((c.total_paid_amount / c.project_value) * 100, 2)
      ELSE 0
    END as payment_progress,
    COUNT(ph.id) as total_payments
  FROM customers c
  LEFT JOIN payment_history ph ON ph.customer_id = c.id
  WHERE c.id = customer_uuid
  GROUP BY c.id, c.project_value, c.total_paid_amount, c.payment_status;
END;
$$;

-- Function to get referrer commission summary
CREATE OR REPLACE FUNCTION get_referrer_commission_summary(referrer_uuid uuid)
RETURNS TABLE (
  total_referrals bigint,
  active_projects bigint,
  total_commission_earned decimal(10,2),
  unpaid_commission decimal(10,2),
  average_project_value decimal(10,2),
  conversion_rate numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT ct.customer_id) as total_referrals,
    COUNT(DISTINCT CASE WHEN c.status IN ('new', 'in_progress') THEN ct.customer_id END) as active_projects,
    COALESCE(SUM(ct.commission_amount), 0) as total_commission_earned,
    COALESCE(SUM(CASE WHEN ct.commission_status = 'pending' THEN ct.commission_amount ELSE 0 END), 0) as unpaid_commission,
    COALESCE(AVG(ct.project_value), 0) as average_project_value,
    CASE 
      WHEN COUNT(rc.id) > 0 THEN ROUND((COUNT(DISTINCT ct.customer_id)::numeric / COUNT(rc.id)::numeric) * 100, 2)
      ELSE 0
    END as conversion_rate
  FROM influencers i
  LEFT JOIN commission_tracking ct ON ct.referrer_id = i.id
  LEFT JOIN customers c ON c.id = ct.customer_id
  LEFT JOIN referral_clicks rc ON rc.referral_code = i.referral_code
  WHERE i.id = referrer_uuid
  GROUP BY i.id;
END;
$$;

-- Function to get commission analytics
CREATE OR REPLACE FUNCTION get_commission_analytics(date_from date DEFAULT NULL, date_to date DEFAULT NULL)
RETURNS TABLE (
  month_year text,
  total_commission_paid decimal(10,2),
  total_commission_pending decimal(10,2),
  number_of_referrers bigint,
  average_commission decimal(10,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    TO_CHAR(DATE_TRUNC('month', ct.earned_date), 'YYYY-MM') as month_year,
    COALESCE(SUM(CASE WHEN ct.commission_status = 'paid' THEN ct.commission_amount ELSE 0 END), 0) as total_commission_paid,
    COALESCE(SUM(CASE WHEN ct.commission_status = 'pending' THEN ct.commission_amount ELSE 0 END), 0) as total_commission_pending,
    COUNT(DISTINCT ct.referrer_id) as number_of_referrers,
    COALESCE(AVG(ct.commission_amount), 0) as average_commission
  FROM commission_tracking ct
  WHERE (date_from IS NULL OR DATE(ct.earned_date) >= date_from)
    AND (date_to IS NULL OR DATE(ct.earned_date) <= date_to)
  GROUP BY DATE_TRUNC('month', ct.earned_date)
  ORDER BY month_year DESC;
END;
$$;

-- Function to mark commissions as paid
CREATE OR REPLACE FUNCTION pay_commissions(
  referrer_uuid uuid,
  commission_ids_to_pay uuid[],
  payment_amount decimal(10,2),
  payment_method text,
  transaction_ref text DEFAULT NULL,
  payment_notes text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  payment_record_id uuid;
BEGIN
  -- Create payment history record
  INSERT INTO commission_payment_history (
    referrer_id,
    payment_amount,
    payment_method,
    transaction_reference,
    commission_ids,
    notes
  ) VALUES (
    referrer_uuid,
    payment_amount,
    payment_method,
    transaction_ref,
    commission_ids_to_pay,
    payment_notes
  ) RETURNING id INTO payment_record_id;
  
  -- Mark commissions as paid
  UPDATE commission_tracking 
  SET 
    commission_status = 'paid',
    paid_date = now(),
    payment_method = pay_commissions.payment_method,
    payment_reference = transaction_ref
  WHERE id = ANY(commission_ids_to_pay);
  
  RETURN payment_record_id;
END;
$$;

-- Function to get outstanding payments (overdue)
CREATE OR REPLACE FUNCTION get_outstanding_payments(days_overdue integer DEFAULT 30)
RETURNS TABLE (
  customer_id uuid,
  customer_name text,
  customer_email text,
  project_value decimal(10,2),
  total_paid decimal(10,2),
  remaining_balance decimal(10,2),
  days_since_deadline integer,
  payment_status text
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
    c.project_value,
    c.total_paid_amount as total_paid,
    calculate_remaining_balance(c.id) as remaining_balance,
    CASE 
      WHEN c.deadline IS NOT NULL THEN DATE_PART('day', CURRENT_DATE - c.deadline::date)::integer
      ELSE NULL
    END as days_since_deadline,
    c.payment_status
  FROM customers c
  WHERE c.payment_status IN ('not_started', 'partial_paid')
    AND calculate_remaining_balance(c.id) > 0
    AND (
      c.deadline IS NULL OR 
      c.deadline::date < (CURRENT_DATE - INTERVAL '1 day' * days_overdue)
    )
  ORDER BY days_since_deadline DESC NULLS LAST, remaining_balance DESC;
END;
$$;

-- Update existing customers to have default project values if needed
UPDATE customers 
SET project_value = 1000 
WHERE project_value = 0 OR project_value IS NULL;

-- Recalculate payment totals for existing customers
DO $$
DECLARE
  customer_record record;
BEGIN
  FOR customer_record IN SELECT id FROM customers LOOP
    PERFORM update_payment_status(customer_record.id);
  END LOOP;
END $$;