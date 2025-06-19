/*
  # Flexible Commission Structure System

  1. Enhanced Influencer Table
    - Add commission_type field (percentage/fixed)
    - Add fixed_rate field for flat fee commissions
    - Add commission_calculation_method for percentage types
    - Add commission_trigger for when commission is earned

  2. Commission Override System
    - Add commission overrides for specific referrals
    - Support custom commission structures per campaign

  3. Enhanced Commission Tracking
    - Track commission method used for each earning
    - Support mixed commission calculations
    - Maintain audit trail of commission changes

  4. Advanced Analytics
    - Performance comparison by commission type
    - Recommendations for optimal commission structure
    - Financial reporting by commission method
*/

-- Add new fields to influencers table for flexible commission structure
DO $$
BEGIN
  -- Commission type: 'percentage' or 'fixed'
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'influencers' AND column_name = 'commission_type'
  ) THEN
    ALTER TABLE influencers ADD COLUMN commission_type text DEFAULT 'percentage' CHECK (commission_type IN ('percentage', 'fixed'));
  END IF;

  -- Fixed rate amount for flat fee commissions
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'influencers' AND column_name = 'fixed_rate'
  ) THEN
    ALTER TABLE influencers ADD COLUMN fixed_rate decimal(10,2) DEFAULT 0;
  END IF;

  -- For percentage commissions: 'project_value', 'payments_received', 'first_payment'
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'influencers' AND column_name = 'commission_calculation_method'
  ) THEN
    ALTER TABLE influencers ADD COLUMN commission_calculation_method text DEFAULT 'payments_received' 
    CHECK (commission_calculation_method IN ('project_value', 'payments_received', 'first_payment'));
  END IF;

  -- When commission is earned: 'signup', 'first_payment', 'project_completion'
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'influencers' AND column_name = 'commission_trigger'
  ) THEN
    ALTER TABLE influencers ADD COLUMN commission_trigger text DEFAULT 'first_payment'
    CHECK (commission_trigger IN ('signup', 'first_payment', 'project_completion'));
  END IF;

  -- Maximum commission cap for percentage-based (optional)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'influencers' AND column_name = 'commission_cap'
  ) THEN
    ALTER TABLE influencers ADD COLUMN commission_cap decimal(10,2);
  END IF;

  -- Minimum commission guarantee for percentage-based (optional)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'influencers' AND column_name = 'commission_minimum'
  ) THEN
    ALTER TABLE influencers ADD COLUMN commission_minimum decimal(10,2);
  END IF;
END $$;

-- Create commission_overrides table for custom commission structures
CREATE TABLE IF NOT EXISTS commission_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  influencer_id uuid NOT NULL REFERENCES influencers(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  referral_code text, -- For campaign-specific overrides
  commission_type text NOT NULL CHECK (commission_type IN ('percentage', 'fixed')),
  commission_rate decimal(5,2), -- For percentage overrides
  fixed_rate decimal(10,2), -- For fixed rate overrides
  commission_calculation_method text DEFAULT 'payments_received',
  commission_trigger text DEFAULT 'first_payment',
  commission_cap decimal(10,2),
  commission_minimum decimal(10,2),
  description text, -- Reason for override
  valid_from timestamptz DEFAULT now(),
  valid_until timestamptz,
  created_at timestamptz DEFAULT now(),
  created_by text DEFAULT 'system'
);

-- Add commission method tracking to commission_tracking table
DO $$
BEGIN
  -- Track which commission method was used
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'commission_tracking' AND column_name = 'commission_method_used'
  ) THEN
    ALTER TABLE commission_tracking ADD COLUMN commission_method_used text;
  END IF;

  -- Track calculation details
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'commission_tracking' AND column_name = 'calculation_details'
  ) THEN
    ALTER TABLE commission_tracking ADD COLUMN calculation_details jsonb;
  END IF;

  -- Reference to override if used
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'commission_tracking' AND column_name = 'override_id'
  ) THEN
    ALTER TABLE commission_tracking ADD COLUMN override_id uuid REFERENCES commission_overrides(id);
  END IF;
END $$;

-- Enable RLS on new table
ALTER TABLE commission_overrides ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for commission_overrides
CREATE POLICY "Authenticated users can manage commission overrides"
  ON commission_overrides
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_commission_overrides_influencer_id ON commission_overrides(influencer_id);
CREATE INDEX IF NOT EXISTS idx_commission_overrides_customer_id ON commission_overrides(customer_id);
CREATE INDEX IF NOT EXISTS idx_commission_overrides_referral_code ON commission_overrides(referral_code);
CREATE INDEX IF NOT EXISTS idx_commission_overrides_valid_dates ON commission_overrides(valid_from, valid_until);

-- Function to get effective commission structure for an influencer/customer combination
CREATE OR REPLACE FUNCTION get_effective_commission_structure(
  influencer_uuid uuid,
  customer_uuid uuid DEFAULT NULL,
  ref_code text DEFAULT NULL
)
RETURNS TABLE (
  commission_type text,
  commission_rate decimal(5,2),
  fixed_rate decimal(10,2),
  commission_calculation_method text,
  commission_trigger text,
  commission_cap decimal(10,2),
  commission_minimum decimal(10,2),
  override_id uuid,
  override_description text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  override_rec record;
  influencer_rec record;
BEGIN
  -- First check for specific overrides
  SELECT * INTO override_rec
  FROM commission_overrides co
  WHERE co.influencer_id = influencer_uuid
    AND (customer_uuid IS NULL OR co.customer_id = customer_uuid OR co.customer_id IS NULL)
    AND (ref_code IS NULL OR co.referral_code = ref_code OR co.referral_code IS NULL)
    AND (co.valid_from IS NULL OR co.valid_from <= now())
    AND (co.valid_until IS NULL OR co.valid_until >= now())
  ORDER BY 
    CASE WHEN co.customer_id = customer_uuid THEN 1 ELSE 2 END,
    CASE WHEN co.referral_code = ref_code THEN 1 ELSE 2 END,
    co.created_at DESC
  LIMIT 1;

  -- If override found, return override structure
  IF override_rec.id IS NOT NULL THEN
    RETURN QUERY
    SELECT 
      override_rec.commission_type,
      override_rec.commission_rate,
      override_rec.fixed_rate,
      override_rec.commission_calculation_method,
      override_rec.commission_trigger,
      override_rec.commission_cap,
      override_rec.commission_minimum,
      override_rec.id,
      override_rec.description;
    RETURN;
  END IF;

  -- Otherwise return default influencer structure
  SELECT * INTO influencer_rec FROM influencers WHERE id = influencer_uuid;
  
  IF influencer_rec.id IS NOT NULL THEN
    RETURN QUERY
    SELECT 
      influencer_rec.commission_type,
      influencer_rec.commission_rate,
      influencer_rec.fixed_rate,
      influencer_rec.commission_calculation_method,
      influencer_rec.commission_trigger,
      influencer_rec.commission_cap,
      influencer_rec.commission_minimum,
      NULL::uuid,
      NULL::text;
  END IF;
END;
$$;

-- Enhanced commission calculation function
CREATE OR REPLACE FUNCTION calculate_flexible_commission(
  influencer_uuid uuid,
  customer_uuid uuid,
  payment_amount decimal DEFAULT NULL,
  project_value decimal DEFAULT NULL
)
RETURNS TABLE (
  commission_amount decimal(10,2),
  commission_method text,
  calculation_details jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  commission_structure record;
  calculated_amount decimal(10,2) := 0;
  method_used text;
  details jsonb := '{}';
  customer_rec record;
BEGIN
  -- Get customer details
  SELECT * INTO customer_rec FROM customers WHERE id = customer_uuid;
  
  -- Get effective commission structure
  SELECT * INTO commission_structure 
  FROM get_effective_commission_structure(influencer_uuid, customer_uuid);
  
  IF commission_structure.commission_type = 'fixed' THEN
    -- Fixed rate commission
    calculated_amount := commission_structure.fixed_rate;
    method_used := 'Fixed Rate';
    details := jsonb_build_object(
      'type', 'fixed',
      'fixed_rate', commission_structure.fixed_rate,
      'trigger', commission_structure.commission_trigger
    );
    
  ELSIF commission_structure.commission_type = 'percentage' THEN
    -- Percentage-based commission
    method_used := 'Percentage';
    
    IF commission_structure.commission_calculation_method = 'project_value' THEN
      calculated_amount := (COALESCE(project_value, customer_rec.project_value, 0) * commission_structure.commission_rate / 100);
      details := jsonb_build_object(
        'type', 'percentage',
        'rate', commission_structure.commission_rate,
        'base_amount', COALESCE(project_value, customer_rec.project_value, 0),
        'method', 'project_value'
      );
      
    ELSIF commission_structure.commission_calculation_method = 'payments_received' THEN
      calculated_amount := (COALESCE(payment_amount, 0) * commission_structure.commission_rate / 100);
      details := jsonb_build_object(
        'type', 'percentage',
        'rate', commission_structure.commission_rate,
        'base_amount', COALESCE(payment_amount, 0),
        'method', 'payments_received'
      );
      
    ELSIF commission_structure.commission_calculation_method = 'first_payment' THEN
      -- Check if this is the first payment
      IF NOT EXISTS (SELECT 1 FROM commission_tracking WHERE customer_id = customer_uuid AND referrer_id = influencer_uuid) THEN
        calculated_amount := (COALESCE(payment_amount, 0) * commission_structure.commission_rate / 100);
        details := jsonb_build_object(
          'type', 'percentage',
          'rate', commission_structure.commission_rate,
          'base_amount', COALESCE(payment_amount, 0),
          'method', 'first_payment'
        );
      ELSE
        calculated_amount := 0;
        details := jsonb_build_object(
          'type', 'percentage',
          'rate', commission_structure.commission_rate,
          'method', 'first_payment',
          'note', 'Commission already earned for first payment'
        );
      END IF;
    END IF;
    
    -- Apply cap and minimum
    IF commission_structure.commission_cap IS NOT NULL AND calculated_amount > commission_structure.commission_cap THEN
      calculated_amount := commission_structure.commission_cap;
      details := details || jsonb_build_object('capped_at', commission_structure.commission_cap);
    END IF;
    
    IF commission_structure.commission_minimum IS NOT NULL AND calculated_amount < commission_structure.commission_minimum THEN
      calculated_amount := commission_structure.commission_minimum;
      details := details || jsonb_build_object('minimum_applied', commission_structure.commission_minimum);
    END IF;
  END IF;
  
  -- Add override information if applicable
  IF commission_structure.override_id IS NOT NULL THEN
    details := details || jsonb_build_object(
      'override_used', true,
      'override_id', commission_structure.override_id,
      'override_description', commission_structure.override_description
    );
  END IF;
  
  RETURN QUERY
  SELECT calculated_amount, method_used, details;
END;
$$;

-- Function to get commission performance analytics by type
CREATE OR REPLACE FUNCTION get_commission_performance_analytics(
  date_from date DEFAULT NULL,
  date_to date DEFAULT NULL
)
RETURNS TABLE (
  commission_type text,
  total_commissions bigint,
  total_amount decimal(10,2),
  average_commission decimal(10,2),
  min_commission decimal(10,2),
  max_commission decimal(10,2),
  total_influencers bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(ct.commission_method_used, 'Unknown') as commission_type,
    COUNT(ct.id)::bigint as total_commissions,
    COALESCE(SUM(ct.commission_amount), 0)::decimal(10,2) as total_amount,
    COALESCE(AVG(ct.commission_amount), 0)::decimal(10,2) as average_commission,
    COALESCE(MIN(ct.commission_amount), 0)::decimal(10,2) as min_commission,
    COALESCE(MAX(ct.commission_amount), 0)::decimal(10,2) as max_commission,
    COUNT(DISTINCT ct.referrer_id)::bigint as total_influencers
  FROM commission_tracking ct
  WHERE (date_from IS NULL OR DATE(ct.earned_date) >= date_from)
    AND (date_to IS NULL OR DATE(ct.earned_date) <= date_to)
  GROUP BY ct.commission_method_used
  ORDER BY total_amount DESC;
END;
$$;

-- Function to recommend optimal commission structure
CREATE OR REPLACE FUNCTION recommend_commission_structure(influencer_uuid uuid)
RETURNS TABLE (
  recommendation text,
  current_performance jsonb,
  suggested_structure jsonb,
  reasoning text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  influencer_rec record;
  performance_data record;
  avg_project_value decimal(10,2);
  conversion_rate numeric;
  total_referrals bigint;
BEGIN
  -- Get influencer details
  SELECT * INTO influencer_rec FROM influencers WHERE id = influencer_uuid;
  
  -- Get performance metrics
  SELECT 
    COUNT(DISTINCT ct.customer_id) as total_referrals,
    AVG(ct.project_value) as avg_project_value,
    AVG(ct.commission_amount) as avg_commission,
    SUM(ct.commission_amount) as total_earned
  INTO performance_data
  FROM commission_tracking ct
  WHERE ct.referrer_id = influencer_uuid;
  
  -- Calculate conversion rate
  SELECT 
    CASE 
      WHEN COUNT(rc.id) > 0 THEN 
        ROUND((COUNT(DISTINCT ct.customer_id)::numeric / COUNT(rc.id)::numeric) * 100, 2)
      ELSE 0
    END
  INTO conversion_rate
  FROM referral_clicks rc
  JOIN influencers i ON i.referral_code = rc.referral_code
  LEFT JOIN commission_tracking ct ON ct.referrer_id = i.id
  WHERE i.id = influencer_uuid;
  
  -- Generate recommendations based on performance
  IF performance_data.total_referrals >= 10 THEN
    IF performance_data.avg_project_value > 5000 THEN
      -- High-value projects: suggest percentage with cap
      RETURN QUERY
      SELECT 
        'percentage_with_cap'::text,
        jsonb_build_object(
          'current_type', influencer_rec.commission_type,
          'avg_project_value', performance_data.avg_project_value,
          'avg_commission', performance_data.avg_commission,
          'conversion_rate', conversion_rate
        ),
        jsonb_build_object(
          'commission_type', 'percentage',
          'commission_rate', LEAST(influencer_rec.commission_rate, 8.0),
          'commission_cap', GREATEST(performance_data.avg_commission * 1.2, 500),
          'calculation_method', 'payments_received'
        ),
        'High average project value suggests percentage commission with cap to control costs while maintaining motivation.'::text;
        
    ELSIF performance_data.avg_project_value < 2000 THEN
      -- Low-value projects: suggest fixed rate
      RETURN QUERY
      SELECT 
        'fixed_rate'::text,
        jsonb_build_object(
          'current_type', influencer_rec.commission_type,
          'avg_project_value', performance_data.avg_project_value,
          'avg_commission', performance_data.avg_commission,
          'conversion_rate', conversion_rate
        ),
        jsonb_build_object(
          'commission_type', 'fixed',
          'fixed_rate', GREATEST(performance_data.avg_commission, 100),
          'commission_trigger', 'first_payment'
        ),
        'Low average project value suggests fixed rate commission for predictable costs and simpler calculations.'::text;
        
    ELSE
      -- Medium-value projects: suggest percentage with minimum
      RETURN QUERY
      SELECT 
        'percentage_with_minimum'::text,
        jsonb_build_object(
          'current_type', influencer_rec.commission_type,
          'avg_project_value', performance_data.avg_project_value,
          'avg_commission', performance_data.avg_commission,
          'conversion_rate', conversion_rate
        ),
        jsonb_build_object(
          'commission_type', 'percentage',
          'commission_rate', influencer_rec.commission_rate,
          'commission_minimum', GREATEST(performance_data.avg_commission * 0.8, 75),
          'calculation_method', 'payments_received'
        ),
        'Medium project values suggest percentage commission with minimum guarantee for consistent earnings.'::text;
    END IF;
  ELSE
    -- Insufficient data: suggest current structure with monitoring
    RETURN QUERY
    SELECT 
      'monitor_current'::text,
      jsonb_build_object(
        'current_type', influencer_rec.commission_type,
        'total_referrals', performance_data.total_referrals,
        'conversion_rate', conversion_rate
      ),
      jsonb_build_object(
        'commission_type', influencer_rec.commission_type,
        'note', 'Continue with current structure'
      ),
      'Insufficient referral data for optimization. Continue monitoring performance before making changes.'::text;
  END IF;
END;
$$;

-- Update existing influencers with default flexible commission settings
UPDATE influencers 
SET 
  commission_type = 'percentage',
  commission_calculation_method = 'payments_received',
  commission_trigger = 'first_payment'
WHERE commission_type IS NULL;

-- Update commission tracking records to include method used
UPDATE commission_tracking 
SET commission_method_used = 'Percentage'
WHERE commission_method_used IS NULL;