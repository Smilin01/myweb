/*
  # Complete Database Setup for John Smilin DS Business Platform

  1. New Tables
    - `profiles` - User profile information extending auth.users
    - `contacts` - Contact form submissions from landing page
    - `customers` - Customer management data
    - `influencers` - Referral program influencer data
    - `invoices` - Invoice generation and management
    - `referral_clicks` - Tracking referral link clicks

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated user access
    - Create trigger for automatic profile creation

  3. Functions
    - Auto-create profile when user signs up
    - Update timestamp triggers
*/

-- Create profiles table to extend auth.users
CREATE TABLE IF NOT EXISTS profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email text UNIQUE NOT NULL,
  full_name text DEFAULT 'John Smilin DS',
  business_name text DEFAULT 'John Smilin DS - Digital Solutions',
  phone text,
  bio text DEFAULT 'Full-Stack Developer & SaaS Creator specializing in transforming ideas into powerful digital solutions.',
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create contacts table for landing page form submissions
CREATE TABLE IF NOT EXISTS contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  project_type text NOT NULL,
  description text NOT NULL,
  budget text,
  referral_code text,
  status text DEFAULT 'new',
  created_at timestamptz DEFAULT now()
);

-- Create customers table for business management
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  project_type text NOT NULL,
  request_date text NOT NULL,
  advance_date text,
  deadline text,
  status text DEFAULT 'new',
  payment_status text DEFAULT 'pending',
  payment_proof_url text,
  referral_source text,
  created_at timestamptz DEFAULT now()
);

-- Create influencers table for referral management
CREATE TABLE IF NOT EXISTS influencers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  social_handles text NOT NULL,
  contact_info text NOT NULL,
  referral_code text UNIQUE NOT NULL,
  total_referrals integer DEFAULT 0,
  commission_rate numeric DEFAULT 10.0,
  created_at timestamptz DEFAULT now()
);

-- Create invoices table for invoice generation
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  invoice_number text UNIQUE NOT NULL,
  items jsonb NOT NULL DEFAULT '[]',
  subtotal numeric DEFAULT 0,
  tax numeric DEFAULT 0,
  total numeric DEFAULT 0,
  status text DEFAULT 'pending',
  due_date text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create referral_clicks table for tracking
CREATE TABLE IF NOT EXISTS referral_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_code text NOT NULL,
  ip_address text,
  user_agent text,
  converted boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE influencers ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_clicks ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create policies for business data access (John's business data)
CREATE POLICY "Authenticated users can manage contacts"
  ON contacts
  FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage customers"
  ON customers
  FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage influencers"
  ON influencers
  FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage invoices"
  ON invoices
  FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage referral clicks"
  ON referral_clicks
  FOR ALL
  TO authenticated
  USING (true);

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'John Smilin DS')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for profiles updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON contacts(created_at);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_influencers_referral_code ON influencers(referral_code);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_referral_clicks_code ON referral_clicks(referral_code);