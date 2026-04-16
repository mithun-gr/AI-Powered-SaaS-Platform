-- Drop existing tables and types to avoid conflicts if re-running
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS requests CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TYPE IF EXISTS invoice_status CASCADE;
DROP TYPE IF EXISTS request_status CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

-- Create enum for User Roles
CREATE TYPE user_role AS ENUM ('client', 'admin');

-- Create enum for Request Statuses
CREATE TYPE request_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');

-- Create enum for Invoice Statuses
CREATE TYPE invoice_status AS ENUM ('pending', 'paid', 'overdue');

-- Create Users Table (extends Supabase auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY, -- Will map to auth.users.id
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role user_role DEFAULT 'client'::user_role,
  two_factor_enabled BOOLEAN DEFAULT false,
  two_factor_secret TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for Users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid() = id);
-- Simplified admin check using JWT metadata to prevent any recursive queries entirely
CREATE POLICY "Admins can view all users" ON users FOR SELECT USING ( (auth.jwt() ->> 'role') = 'admin' );

-- Create Requests Table
CREATE TABLE requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES users(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  service_type TEXT NOT NULL,
  budget_min NUMERIC NOT NULL DEFAULT 0,
  budget_max NUMERIC NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  urgency TEXT,
  preferred_time TIMESTAMP WITH TIME ZONE,
  status request_status DEFAULT 'pending'::request_status,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for Requests
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clients can view own requests" ON requests FOR SELECT USING (auth.uid() = client_id);
CREATE POLICY "Clients can create requests" ON requests FOR INSERT WITH CHECK (auth.uid() = client_id);
CREATE POLICY "Admins can manage all requests" ON requests FOR ALL USING ( (auth.jwt() ->> 'role') = 'admin' );

-- Create Invoices Table
CREATE TABLE invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES users(id) NOT NULL,
  request_id UUID REFERENCES requests(id),
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  status invoice_status DEFAULT 'pending'::invoice_status,
  description TEXT NOT NULL,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for Invoices
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clients can view own invoices" ON invoices FOR SELECT USING (auth.uid() = client_id);
CREATE POLICY "Admins can manage all invoices" ON invoices FOR ALL USING ( (auth.jwt() ->> 'role') = 'admin' );
