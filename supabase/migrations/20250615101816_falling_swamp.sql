/*
  # Forms Management System Enhancements

  1. Enhanced Tables
    - Add metadata fields to contacts table for better tracking
    - Create form_notes table for internal communication
    - Add indexes for better performance

  2. Security
    - Update RLS policies for new functionality
    - Add policies for form_notes table

  3. Functions
    - Add function to calculate conversion rates
    - Add function to get referral performance metrics
*/

-- Add metadata fields to contacts table
DO $$
BEGIN
  -- Add IP address tracking
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'ip_address'
  ) THEN
    ALTER TABLE contacts ADD COLUMN ip_address text;
  END IF;

  -- Add user agent tracking
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'user_agent'
  ) THEN
    ALTER TABLE contacts ADD COLUMN user_agent text;
  END IF;

  -- Add timeline field for project deadline
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'timeline'
  ) THEN
    ALTER TABLE contacts ADD COLUMN timeline text;
  END IF;

  -- Add updated_at field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE contacts ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Create form_notes table for internal communication
CREATE TABLE IF NOT EXISTS form_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid REFERENCES contacts(id) ON DELETE CASCADE,
  note text NOT NULL,
  created_by text DEFAULT 'system',
  created_at timestamptz DEFAULT now()
);

-- Create status_history table to track status changes
CREATE TABLE IF NOT EXISTS contact_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid REFERENCES contacts(id) ON DELETE CASCADE,
  old_status text,
  new_status text NOT NULL,
  changed_by text DEFAULT 'system',
  changed_at timestamptz DEFAULT now()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status);
CREATE INDEX IF NOT EXISTS idx_contacts_project_type ON contacts(project_type);
CREATE INDEX IF NOT EXISTS idx_contacts_referral_code ON contacts(referral_code);
CREATE INDEX IF NOT EXISTS idx_contacts_updated_at ON contacts(updated_at);
CREATE INDEX IF NOT EXISTS idx_form_notes_contact_id ON form_notes(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_status_history_contact_id ON contact_status_history(contact_id);

-- Enable RLS on new tables
ALTER TABLE form_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_status_history ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for form_notes
CREATE POLICY "Authenticated users can manage form notes"
  ON form_notes
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Add RLS policies for contact_status_history
CREATE POLICY "Authenticated users can view status history"
  ON contact_status_history
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert status history"
  ON contact_status_history
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create trigger to update updated_at on contacts
CREATE OR REPLACE FUNCTION update_contacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_contacts_updated_at_trigger ON contacts;
CREATE TRIGGER update_contacts_updated_at_trigger
  BEFORE UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_contacts_updated_at();

-- Create trigger to track status changes
CREATE OR REPLACE FUNCTION track_contact_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO contact_status_history (contact_id, old_status, new_status)
    VALUES (NEW.id, OLD.status, NEW.status);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS track_contact_status_change_trigger ON contacts;
CREATE TRIGGER track_contact_status_change_trigger
  AFTER UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION track_contact_status_change();

-- Function to calculate conversion rate
CREATE OR REPLACE FUNCTION get_conversion_rate()
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_contacts integer;
  converted_contacts integer;
  conversion_rate numeric;
BEGIN
  SELECT COUNT(*) INTO total_contacts FROM contacts;
  SELECT COUNT(*) INTO converted_contacts FROM contacts WHERE status = 'converted';
  
  IF total_contacts = 0 THEN
    RETURN 0;
  END IF;
  
  conversion_rate := (converted_contacts::numeric / total_contacts::numeric) * 100;
  RETURN ROUND(conversion_rate, 2);
END;
$$;

-- Function to get referral performance metrics
CREATE OR REPLACE FUNCTION get_referral_performance(ref_code text DEFAULT NULL)
RETURNS TABLE (
  referral_code text,
  total_clicks bigint,
  total_submissions bigint,
  total_conversions bigint,
  conversion_rate numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rc.referral_code,
    COUNT(rc.id) as total_clicks,
    COUNT(c.id) as total_submissions,
    COUNT(CASE WHEN c.status = 'converted' THEN 1 END) as total_conversions,
    CASE 
      WHEN COUNT(c.id) = 0 THEN 0
      ELSE ROUND((COUNT(CASE WHEN c.status = 'converted' THEN 1 END)::numeric / COUNT(c.id)::numeric) * 100, 2)
    END as conversion_rate
  FROM referral_clicks rc
  LEFT JOIN contacts c ON c.referral_code = rc.referral_code
  WHERE (ref_code IS NULL OR rc.referral_code = ref_code)
  GROUP BY rc.referral_code
  ORDER BY total_conversions DESC, total_submissions DESC;
END;
$$;

-- Function to get form submission stats
CREATE OR REPLACE FUNCTION get_form_stats()
RETURNS TABLE (
  total_submissions bigint,
  today_submissions bigint,
  pending_followups bigint,
  conversion_rate numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_submissions,
    COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 END) as today_submissions,
    COUNT(CASE WHEN status IN ('new', 'contacted') THEN 1 END) as pending_followups,
    get_conversion_rate() as conversion_rate
  FROM contacts;
END;
$$;