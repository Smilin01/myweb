/*
  # Create function to increment referral count

  1. New Functions
    - `increment_referral_count` - Safely increments the total_referrals count for an influencer
  
  2. Security
    - Function is accessible to authenticated users
    - Uses proper error handling
*/

-- Create function to increment referral count
CREATE OR REPLACE FUNCTION increment_referral_count(ref_code text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE influencers 
  SET total_referrals = total_referrals + 1 
  WHERE referral_code = ref_code;
  
  -- Check if any rows were updated
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Referral code % not found', ref_code;
  END IF;
END;
$$;