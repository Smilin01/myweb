/*
  # Fix Referral Commission System

  1. Database Functions
    - Fix referrer commission summary function
    - Create commission tracking when customers are created from referrals
    - Update referral counts properly
    - Fix data fetching for dashboard

  2. Commission Calculation
    - Automatic commission creation when customers are added with referral codes
    - Proper commission tracking based on project values
    - Update referrer statistics

  3. Data Integrity
    - Ensure all referral data is properly linked
    - Fix existing data relationships
    - Update referrer total counts
*/

-- Fix the referrer commission summary function
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
DECLARE
  referrer_code text;
BEGIN
  -- Get the referrer's code
  SELECT referral_code INTO referrer_code FROM influencers WHERE id = referrer_uuid;
  
  RETURN QUERY
  SELECT 
    -- Count customers created from this referrer's code
    COUNT(DISTINCT c.id)::bigint as total_referrals,
    -- Count active projects (customers with non-completed status)
    COUNT(DISTINCT CASE WHEN c.status IN ('new', 'in_progress') THEN c.id END)::bigint as active_projects,
    -- Total commission earned (from commission_tracking table)
    COALESCE(SUM(ct.commission_amount), 0)::decimal(10,2) as total_commission_earned,
    -- Unpaid commission
    COALESCE(SUM(CASE WHEN ct.commission_status = 'pending' THEN ct.commission_amount ELSE 0 END), 0)::decimal(10,2) as unpaid_commission,
    -- Average project value
    COALESCE(AVG(c.project_value), 0)::decimal(10,2) as average_project_value,
    -- Conversion rate (customers vs clicks)
    CASE 
      WHEN COUNT(rc.id) > 0 THEN ROUND((COUNT(DISTINCT c.id)::numeric / COUNT(DISTINCT rc.id)::numeric) * 100, 2)
      ELSE 0
    END::numeric as conversion_rate
  FROM influencers i
  LEFT JOIN customers c ON (c.referral_source = 'Referral: ' || i.referral_code OR c.referral_source = i.referral_code)
  LEFT JOIN commission_tracking ct ON ct.referrer_id = i.id AND ct.customer_id = c.id
  LEFT JOIN referral_clicks rc ON rc.referral_code = i.referral_code
  WHERE i.id = referrer_uuid
  GROUP BY i.id, i.referral_code;
END;
$$;

-- Function to create commission tracking when customer is created with referral
CREATE OR REPLACE FUNCTION create_commission_for_referral(customer_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  customer_rec record;
  influencer_rec record;
  commission_amount decimal(10,2);
  referral_code_clean text;
BEGIN
  -- Get customer details
  SELECT * INTO customer_rec FROM customers WHERE id = customer_uuid;
  
  -- Extract referral code from referral_source
  IF customer_rec.referral_source IS NOT NULL THEN
    -- Handle both formats: "Referral: CODE" and just "CODE"
    IF customer_rec.referral_source LIKE 'Referral:%' THEN
      referral_code_clean := TRIM(SUBSTRING(customer_rec.referral_source FROM 'Referral: (.*)'));
    ELSE
      referral_code_clean := customer_rec.referral_source;
    END IF;
    
    -- Get influencer details
    SELECT * INTO influencer_rec FROM influencers WHERE referral_code = referral_code_clean;
    
    IF influencer_rec.id IS NOT NULL THEN
      -- Calculate commission based on project value
      commission_amount := (customer_rec.project_value * influencer_rec.commission_rate / 100);
      
      -- Create commission tracking record
      INSERT INTO commission_tracking (
        referrer_id,
        customer_id,
        commission_rate,
        project_value,
        commission_amount,
        commission_status,
        earned_date
      ) VALUES (
        influencer_rec.id,
        customer_uuid,
        influencer_rec.commission_rate,
        customer_rec.project_value,
        commission_amount,
        'pending',
        now()
      )
      ON CONFLICT (referrer_id, customer_id) DO UPDATE SET
        commission_rate = EXCLUDED.commission_rate,
        project_value = EXCLUDED.project_value,
        commission_amount = EXCLUDED.commission_amount;
      
      -- Update influencer's total referrals count
      UPDATE influencers 
      SET total_referrals = (
        SELECT COUNT(DISTINCT c.id)
        FROM customers c 
        WHERE c.referral_source = 'Referral: ' || influencer_rec.referral_code 
           OR c.referral_source = influencer_rec.referral_code
      )
      WHERE id = influencer_rec.id;
    END IF;
  END IF;
END;
$$;

-- Add unique constraint to prevent duplicate commission tracking
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'commission_tracking_referrer_customer_unique'
  ) THEN
    ALTER TABLE commission_tracking 
    ADD CONSTRAINT commission_tracking_referrer_customer_unique 
    UNIQUE (referrer_id, customer_id);
  END IF;
END $$;

-- Trigger to create commission when customer is inserted
CREATE OR REPLACE FUNCTION trigger_create_commission_on_customer_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Create commission tracking if customer has referral source
  PERFORM create_commission_for_referral(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new customers
DROP TRIGGER IF EXISTS create_commission_on_customer_insert ON customers;
CREATE TRIGGER create_commission_on_customer_insert
  AFTER INSERT ON customers
  FOR EACH ROW
  EXECUTE FUNCTION trigger_create_commission_on_customer_insert();

-- Trigger to update commission when customer is updated
CREATE OR REPLACE FUNCTION trigger_update_commission_on_customer_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Update commission if project value or referral source changed
  IF OLD.project_value IS DISTINCT FROM NEW.project_value OR 
     OLD.referral_source IS DISTINCT FROM NEW.referral_source THEN
    PERFORM create_commission_for_referral(NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for customer updates
DROP TRIGGER IF EXISTS update_commission_on_customer_update ON customers;
CREATE TRIGGER update_commission_on_customer_update
  AFTER UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_commission_on_customer_update();

-- Function to update all referrer statistics
CREATE OR REPLACE FUNCTION update_all_referrer_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  influencer_rec record;
BEGIN
  FOR influencer_rec IN SELECT id, referral_code FROM influencers LOOP
    -- Update total referrals count
    UPDATE influencers 
    SET total_referrals = (
      SELECT COUNT(DISTINCT c.id)
      FROM customers c 
      WHERE c.referral_source = 'Referral: ' || influencer_rec.referral_code 
         OR c.referral_source = influencer_rec.referral_code
    )
    WHERE id = influencer_rec.id;
    
    -- Create commission tracking for existing customers
    PERFORM create_commission_for_referral(c.id)
    FROM customers c 
    WHERE (c.referral_source = 'Referral: ' || influencer_rec.referral_code 
           OR c.referral_source = influencer_rec.referral_code)
      AND NOT EXISTS (
        SELECT 1 FROM commission_tracking ct 
        WHERE ct.referrer_id = influencer_rec.id AND ct.customer_id = c.id
      );
  END LOOP;
END;
$$;

-- Function to get commission data with customer details
CREATE OR REPLACE FUNCTION get_referrer_commissions_with_customers(referrer_uuid uuid)
RETURNS TABLE (
  commission_id uuid,
  customer_id uuid,
  customer_name text,
  customer_email text,
  project_type text,
  project_value decimal(10,2),
  commission_rate decimal(5,2),
  commission_amount decimal(10,2),
  commission_status text,
  earned_date timestamptz,
  paid_date timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ct.id as commission_id,
    c.id as customer_id,
    c.name as customer_name,
    c.email as customer_email,
    c.project_type,
    ct.project_value,
    ct.commission_rate,
    ct.commission_amount,
    ct.commission_status,
    ct.earned_date,
    ct.paid_date
  FROM commission_tracking ct
  JOIN customers c ON c.id = ct.customer_id
  WHERE ct.referrer_id = referrer_uuid
  ORDER BY ct.earned_date DESC;
END;
$$;

-- Update existing data to fix referral tracking
DO $$
BEGIN
  -- Update all referrer statistics
  PERFORM update_all_referrer_stats();
  
  -- Update customers with referral codes to have proper referral_source format
  UPDATE customers 
  SET referral_source = 'Referral: ' || referral_source
  WHERE referral_source IS NOT NULL 
    AND referral_source != '' 
    AND referral_source NOT LIKE 'Referral:%'
    AND EXISTS (SELECT 1 FROM influencers WHERE referral_code = customers.referral_source);
END $$;

-- Function to get referral performance metrics
CREATE OR REPLACE FUNCTION get_referral_metrics()
RETURNS TABLE (
  total_influencers bigint,
  total_referrals bigint,
  total_pending_commissions decimal(10,2),
  total_paid_commissions decimal(10,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT i.id)::bigint as total_influencers,
    COUNT(DISTINCT c.id)::bigint as total_referrals,
    COALESCE(SUM(CASE WHEN ct.commission_status = 'pending' THEN ct.commission_amount ELSE 0 END), 0)::decimal(10,2) as total_pending_commissions,
    COALESCE(SUM(CASE WHEN ct.commission_status = 'paid' THEN ct.commission_amount ELSE 0 END), 0)::decimal(10,2) as total_paid_commissions
  FROM influencers i
  LEFT JOIN customers c ON (c.referral_source = 'Referral: ' || i.referral_code OR c.referral_source = i.referral_code)
  LEFT JOIN commission_tracking ct ON ct.referrer_id = i.id AND ct.customer_id = c.id;
END;
$$;