/*
  # Follow-up System for Form Submissions

  1. New Tables
    - `form_followups` - Track follow-up activities for form submissions
    - Enhanced form_notes for follow-up specific notes

  2. Enhanced Features
    - Next follow-up date tracking
    - Priority levels (low, medium, high, urgent)
    - Follow-up status tracking
    - Notes and activity history
    - Automated follow-up reminders

  3. Security
    - Enable RLS on new tables
    - Add policies for authenticated users
    - Create indexes for performance
*/

-- Create form_followups table
CREATE TABLE IF NOT EXISTS form_followups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  next_followup_date date NOT NULL,
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  followup_notes text,
  followup_status text DEFAULT 'scheduled' CHECK (followup_status IN ('scheduled', 'completed', 'overdue', 'cancelled')),
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  created_by text DEFAULT 'system',
  updated_at timestamptz DEFAULT now()
);

-- Add follow-up related fields to contacts table
DO $$
BEGIN
  -- Last follow-up date
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'last_followup_date'
  ) THEN
    ALTER TABLE contacts ADD COLUMN last_followup_date timestamptz;
  END IF;

  -- Next follow-up date
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'next_followup_date'
  ) THEN
    ALTER TABLE contacts ADD COLUMN next_followup_date date;
  END IF;

  -- Follow-up priority
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'followup_priority'
  ) THEN
    ALTER TABLE contacts ADD COLUMN followup_priority text DEFAULT 'medium' CHECK (followup_priority IN ('low', 'medium', 'high', 'urgent'));
  END IF;

  -- Follow-up count
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'followup_count'
  ) THEN
    ALTER TABLE contacts ADD COLUMN followup_count integer DEFAULT 0;
  END IF;
END $$;

-- Enable RLS on new table
ALTER TABLE form_followups ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Authenticated users can manage form followups"
  ON form_followups
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_form_followups_contact_id ON form_followups(contact_id);
CREATE INDEX IF NOT EXISTS idx_form_followups_next_date ON form_followups(next_followup_date);
CREATE INDEX IF NOT EXISTS idx_form_followups_priority ON form_followups(priority);
CREATE INDEX IF NOT EXISTS idx_form_followups_status ON form_followups(followup_status);
CREATE INDEX IF NOT EXISTS idx_contacts_next_followup_date ON contacts(next_followup_date);
CREATE INDEX IF NOT EXISTS idx_contacts_followup_priority ON contacts(followup_priority);

-- Function to create follow-up when status changes to contacted
CREATE OR REPLACE FUNCTION create_followup_on_contacted(
  contact_uuid uuid,
  next_date date,
  priority_level text DEFAULT 'medium',
  notes text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  followup_id uuid;
BEGIN
  -- Create follow-up record
  INSERT INTO form_followups (
    contact_id,
    next_followup_date,
    priority,
    followup_notes,
    followup_status
  ) VALUES (
    contact_uuid,
    next_date,
    priority_level,
    notes,
    'scheduled'
  ) RETURNING id INTO followup_id;
  
  -- Update contact with follow-up info
  UPDATE contacts 
  SET 
    next_followup_date = next_date,
    followup_priority = priority_level,
    followup_count = followup_count + 1,
    last_followup_date = now()
  WHERE id = contact_uuid;
  
  RETURN followup_id;
END;
$$;

-- Function to complete a follow-up
CREATE OR REPLACE FUNCTION complete_followup(
  followup_uuid uuid,
  completion_notes text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  contact_uuid uuid;
BEGIN
  -- Get contact ID and mark follow-up as completed
  UPDATE form_followups 
  SET 
    followup_status = 'completed',
    completed_at = now(),
    followup_notes = CASE 
      WHEN completion_notes IS NOT NULL THEN 
        COALESCE(followup_notes, '') || E'\n\nCompleted: ' || completion_notes
      ELSE followup_notes
    END
  WHERE id = followup_uuid
  RETURNING contact_id INTO contact_uuid;
  
  -- Update contact's last follow-up date
  UPDATE contacts 
  SET last_followup_date = now()
  WHERE id = contact_uuid;
END;
$$;

-- Function to get follow-up dashboard data
CREATE OR REPLACE FUNCTION get_followup_dashboard()
RETURNS TABLE (
  total_followups bigint,
  overdue_followups bigint,
  today_followups bigint,
  this_week_followups bigint,
  high_priority_followups bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::bigint as total_followups,
    COUNT(CASE WHEN next_followup_date < CURRENT_DATE AND followup_status = 'scheduled' THEN 1 END)::bigint as overdue_followups,
    COUNT(CASE WHEN next_followup_date = CURRENT_DATE AND followup_status = 'scheduled' THEN 1 END)::bigint as today_followups,
    COUNT(CASE WHEN next_followup_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days' AND followup_status = 'scheduled' THEN 1 END)::bigint as this_week_followups,
    COUNT(CASE WHEN priority IN ('high', 'urgent') AND followup_status = 'scheduled' THEN 1 END)::bigint as high_priority_followups
  FROM form_followups;
END;
$$;

-- Function to get follow-up list with contact details
CREATE OR REPLACE FUNCTION get_followups_with_contacts(
  status_filter text DEFAULT 'scheduled',
  priority_filter text DEFAULT NULL,
  date_filter text DEFAULT NULL
)
RETURNS TABLE (
  followup_id uuid,
  contact_id uuid,
  contact_name text,
  contact_email text,
  contact_phone text,
  project_type text,
  contact_status text,
  next_followup_date date,
  priority text,
  followup_notes text,
  followup_status text,
  created_at timestamptz,
  completed_at timestamptz,
  days_until_followup integer,
  is_overdue boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.id as followup_id,
    c.id as contact_id,
    c.name as contact_name,
    c.email as contact_email,
    c.phone as contact_phone,
    c.project_type,
    c.status as contact_status,
    f.next_followup_date,
    f.priority,
    f.followup_notes,
    f.followup_status,
    f.created_at,
    f.completed_at,
    (f.next_followup_date - CURRENT_DATE)::integer as days_until_followup,
    (f.next_followup_date < CURRENT_DATE AND f.followup_status = 'scheduled')::boolean as is_overdue
  FROM form_followups f
  JOIN contacts c ON c.id = f.contact_id
  WHERE (status_filter IS NULL OR f.followup_status = status_filter)
    AND (priority_filter IS NULL OR f.priority = priority_filter)
    AND (date_filter IS NULL OR 
         (date_filter = 'overdue' AND f.next_followup_date < CURRENT_DATE AND f.followup_status = 'scheduled') OR
         (date_filter = 'today' AND f.next_followup_date = CURRENT_DATE) OR
         (date_filter = 'this_week' AND f.next_followup_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'))
  ORDER BY 
    CASE WHEN f.followup_status = 'scheduled' AND f.next_followup_date < CURRENT_DATE THEN 1 ELSE 2 END,
    CASE f.priority 
      WHEN 'urgent' THEN 1 
      WHEN 'high' THEN 2 
      WHEN 'medium' THEN 3 
      WHEN 'low' THEN 4 
    END,
    f.next_followup_date ASC;
END;
$$;

-- Function to update follow-up status automatically
CREATE OR REPLACE FUNCTION update_overdue_followups()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE form_followups 
  SET followup_status = 'overdue'
  WHERE next_followup_date < CURRENT_DATE 
    AND followup_status = 'scheduled';
END;
$$;

-- Function to get contact follow-up history
CREATE OR REPLACE FUNCTION get_contact_followup_history(contact_uuid uuid)
RETURNS TABLE (
  followup_id uuid,
  next_followup_date date,
  priority text,
  followup_notes text,
  followup_status text,
  created_at timestamptz,
  completed_at timestamptz,
  created_by text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.id as followup_id,
    f.next_followup_date,
    f.priority,
    f.followup_notes,
    f.followup_status,
    f.created_at,
    f.completed_at,
    f.created_by
  FROM form_followups f
  WHERE f.contact_id = contact_uuid
  ORDER BY f.created_at DESC;
END;
$$;

-- Trigger to update follow-up status when contact status changes
CREATE OR REPLACE FUNCTION update_followup_on_contact_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- If contact is converted or rejected, complete all pending follow-ups
  IF NEW.status IN ('converted', 'rejected') AND OLD.status != NEW.status THEN
    UPDATE form_followups 
    SET 
      followup_status = 'completed',
      completed_at = now(),
      followup_notes = COALESCE(followup_notes, '') || E'\n\nAuto-completed due to status change to: ' || NEW.status
    WHERE contact_id = NEW.id AND followup_status = 'scheduled';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for contact status changes
DROP TRIGGER IF EXISTS update_followup_on_status_change ON contacts;
CREATE TRIGGER update_followup_on_status_change
  AFTER UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_followup_on_contact_status_change();

-- Create trigger to update updated_at on form_followups
CREATE OR REPLACE FUNCTION update_followup_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_form_followups_updated_at ON form_followups;
CREATE TRIGGER update_form_followups_updated_at
  BEFORE UPDATE ON form_followups
  FOR EACH ROW
  EXECUTE FUNCTION update_followup_updated_at();