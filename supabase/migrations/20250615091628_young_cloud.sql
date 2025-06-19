/*
  # Allow anonymous contact form submissions

  1. Security Changes
    - Add RLS policy to allow anonymous users to insert into contacts table
    - This enables the contact form on the landing page to work for unauthenticated visitors
    - Maintains security by only allowing INSERT operations for anonymous users
*/

-- Allow anonymous users to submit contact forms
CREATE POLICY "Allow anonymous contact submissions"
  ON contacts
  FOR INSERT
  TO anon
  WITH CHECK (true);