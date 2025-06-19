/*
  # Fix Referral Management Metrics

  1. Database Functions
    - Fix get_referral_metrics function to properly calculate totals
    - Ensure commission tracking is working correctly
    - Fix data aggregation for dashboard display

  2. Data Integrity
    - Update existing commission data
    - Fix referral counting logic
    - Ensure proper relationships between tables
*/

-- Drop and recreate the referral metrics function with proper logic
DROP FUNCTION IF EXISTS get_referral_metrics();

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
    (SELECT COUNT(*) FROM influencers)::bigint as total_influencers,
    (SELECT COUNT(DISTINCT customer_id) FROM commission_tracking)::bigint as total_referrals,
    (SELECT COALESCE(SUM(commission_amount), 0) FROM commission_tracking WHERE commission_status = 'pending')::decimal(10,2) as total_pending_commissions,
    (SELECT COALESCE(SUM(commission_amount), 0) FROM commission_tracking WHERE commission_status = 'paid')::decimal(10,2) as total_paid_commissions;
END;
$$;

-- Fix the referrer commission summary function
DROP FUNCTION IF EXISTS get_referrer_commission_summary(uuid);

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
    -- Count total referrals for this influencer
    (SELECT COUNT(DISTINCT ct.customer_id) FROM commission_tracking ct WHERE ct.referrer_id = referrer_uuid)::bigint as total_referrals,
    -- Count active projects
    (SELECT COUNT(DISTINCT ct.customer_id) 
     FROM commission_tracking ct 
     JOIN customers c ON c.id = ct.customer_id 
     WHERE ct.referrer_id = referrer_uuid AND c.status IN ('new', 'in_progress'))::bigint as active_projects,
    -- Total commission earned
    (SELECT COALESCE(SUM(ct.commission_amount), 0) FROM commission_tracking ct WHERE ct.referrer_id = referrer_uuid)::decimal(10,2) as total_commission_earned,
    -- Unpaid commission
    (SELECT COALESCE(SUM(ct.commission_amount), 0) FROM commission_tracking ct WHERE ct.referrer_id = referrer_uuid AND ct.commission_status = 'pending')::decimal(10,2) as unpaid_commission,
    -- Average project value
    (SELECT COALESCE(AVG(ct.project_value), 0) FROM commission_tracking ct WHERE ct.referrer_id = referrer_uuid)::decimal(10,2) as average_project_value,
    -- Conversion rate (referrals vs clicks)
    CASE 
      WHEN (SELECT COUNT(*) FROM referral_clicks rc JOIN influencers i ON i.referral_code = rc.referral_code WHERE i.id = referrer_uuid) > 0 
      THEN ROUND(
        ((SELECT COUNT(DISTINCT ct.customer_id) FROM commission_tracking ct WHERE ct.referrer_id = referrer_uuid)::numeric / 
         (SELECT COUNT(*) FROM referral_clicks rc JOIN influencers i ON i.referral_code = rc.referral_code WHERE i.id = referrer_uuid)::numeric) * 100, 2
      )
      ELSE 0
    END::numeric as conversion_rate;
END;
$$;

-- Function to sync commission data for existing customers
CREATE OR REPLACE FUNCTION sync_commission_data()
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
  -- Process all customers with referral sources
  FOR customer_rec IN 
    SELECT * FROM customers 
    WHERE referral_source IS NOT NULL AND referral_source != ''
  LOOP
    -- Extract referral code
    IF customer_rec.referral_source LIKE 'Referral:%' THEN
      referral_code_clean := TRIM(SUBSTRING(customer_rec.referral_source FROM 'Referral: (.*)'));
    ELSE
      referral_code_clean := customer_rec.referral_source;
    END IF;
    
    -- Find matching influencer
    SELECT * INTO influencer_rec FROM influencers WHERE referral_code = referral_code_clean;
    
    IF influencer_rec.id IS NOT NULL THEN
      -- Calculate commission
      commission_amount := (customer_rec.project_value * influencer_rec.commission_rate / 100);
      
      -- Insert or update commission tracking
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
        customer_rec.id,
        influencer_rec.commission_rate,
        customer_rec.project_value,
        commission_amount,
        'pending',
        customer_rec.created_at
      )
      ON CONFLICT (referrer_id, customer_id) DO UPDATE SET
        commission_rate = EXCLUDED.commission_rate,
        project_value = EXCLUDED.project_value,
        commission_amount = EXCLUDED.commission_amount;
      
      -- Update influencer total referrals
      UPDATE influencers 
      SET total_referrals = (
        SELECT COUNT(DISTINCT ct.customer_id) 
        FROM commission_tracking ct 
        WHERE ct.referrer_id = influencer_rec.id
      )
      WHERE id = influencer_rec.id;
    END IF;
  END LOOP;
END;
$$;

-- Function to get commission data with customer details (fixed)
DROP FUNCTION IF EXISTS get_referrer_commissions_with_customers(uuid);

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

-- Run the sync function to update existing data
SELECT sync_commission_data();

-- Update all influencer total referrals counts
UPDATE influencers 
SET total_referrals = (
  SELECT COUNT(DISTINCT ct.customer_id) 
  FROM commission_tracking ct 
  WHERE ct.referrer_id = influencers.id
);