-- Run this in your Supabase SQL Editor
-- https://supabase.com/dashboard/project/xcgznebgxbeadvztivvp/sql/new

CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  sender TEXT NOT NULL CHECK (sender IN ('user', 'bot')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own messages
CREATE POLICY "Users can view own chat messages"
  ON chat_messages FOR SELECT
  USING (auth.uid()::text = user_id);

-- Allow inserting (backend uses service role, so this is fine)
CREATE POLICY "Allow insert chat messages"
  ON chat_messages FOR INSERT
  WITH CHECK (true);
