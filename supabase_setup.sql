-- ARVEN Contract System Database Schema
-- Run this SQL in your Supabase SQL Editor to set up the database

-- Create users table for admin authentication
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create contracts table
CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  contract_duration TEXT NOT NULL,
  product TEXT NOT NULL,
  pdf_url TEXT NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create webhook_config table
CREATE TABLE IF NOT EXISTS webhook_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  is_active TEXT NOT NULL DEFAULT 'true',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create an initial admin user (password: admin123)
-- IMPORTANT: Change this password after first login!
-- Password is hashed with bcrypt (10 rounds)
INSERT INTO users (email, password) 
VALUES ('admin@arven.com', '$2b$10$YQ8JxvVxGV3hZr.qZk5LKOtB7VlqXrJ5PgFqCGdM8nFjDxSH.0Yp.')
ON CONFLICT (email) DO NOTHING;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_contracts_submitted_at ON contracts(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Enable Row Level Security (RLS) - optional but recommended
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_config ENABLE ROW LEVEL SECURITY;

-- Create policies to allow service role access (your backend)
CREATE POLICY "Enable all access for service role" ON users
  FOR ALL USING (true);

CREATE POLICY "Enable all access for service role" ON contracts
  FOR ALL USING (true);

CREATE POLICY "Enable all access for service role" ON webhook_config
  FOR ALL USING (true);
