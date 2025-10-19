-- ============================================
-- BILINGUAL SCHEMA FOR IA ECHOES
-- Messages are stored in both English and French
-- ============================================

-- Create conversations table (unchanged - language neutral)
CREATE TABLE IF NOT EXISTS conversations (
  id BIGSERIAL PRIMARY KEY,
  conversation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  subject TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create messages_en table for English messages
CREATE TABLE IF NOT EXISTS messages_en (
  id BIGSERIAL PRIMARY KEY,
  conversation_id BIGINT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender TEXT NOT NULL CHECK (sender IN ('ChatGPT', 'Claude', 'Human')),
  content TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  message_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(conversation_id, message_order)
);

-- Create messages_fr table for French messages
CREATE TABLE IF NOT EXISTS messages_fr (
  id BIGSERIAL PRIMARY KEY,
  conversation_id BIGINT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender TEXT NOT NULL CHECK (sender IN ('ChatGPT', 'Claude', 'Human')),
  content TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  message_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(conversation_id, message_order)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_conversations_date ON conversations(conversation_date DESC);

CREATE INDEX IF NOT EXISTS idx_messages_en_conversation_id ON messages_en(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_en_order ON messages_en(conversation_id, message_order);

CREATE INDEX IF NOT EXISTS idx_messages_fr_conversation_id ON messages_fr(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_fr_order ON messages_fr(conversation_id, message_order);

-- Create a unique constraint to ensure one conversation per day
CREATE UNIQUE INDEX IF NOT EXISTS idx_conversations_unique_date ON conversations(conversation_date);

-- Enable Row Level Security (RLS)
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages_en ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages_fr ENABLE ROW LEVEL SECURITY;

-- Create policies to allow public read access
CREATE POLICY "Allow public read access to conversations"
  ON conversations FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access to messages_en"
  ON messages_en FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access to messages_fr"
  ON messages_fr FOR SELECT
  USING (true);

-- Create policies to allow insert
CREATE POLICY "Allow public insert to conversations"
  ON conversations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public insert to messages_en"
  ON messages_en FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public insert to messages_fr"
  ON messages_fr FOR INSERT
  WITH CHECK (true);

-- Create a function to get or create today's conversation (unchanged)
CREATE OR REPLACE FUNCTION get_or_create_today_conversation(p_subject TEXT)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_conversation_id BIGINT;
BEGIN
  -- Try to get today's conversation
  SELECT id INTO v_conversation_id
  FROM conversations
  WHERE conversation_date = CURRENT_DATE;

  -- If not found, create it
  IF v_conversation_id IS NULL THEN
    INSERT INTO conversations (conversation_date, subject)
    VALUES (CURRENT_DATE, p_subject)
    RETURNING id INTO v_conversation_id;
  END IF;

  RETURN v_conversation_id;
END;
$$;

-- ============================================
-- MIGRATION SCRIPT: Copy existing messages to both tables
-- Run this AFTER creating the new tables to migrate existing data
-- ============================================

-- Copy existing messages to messages_en (assuming current messages are in English)
INSERT INTO messages_en (conversation_id, sender, content, timestamp, message_order, created_at)
SELECT conversation_id, sender, content, timestamp, message_order, created_at
FROM messages
ON CONFLICT (conversation_id, message_order) DO NOTHING;

-- Note: You'll need to translate existing messages to French manually or using a script
-- For now, we'll just copy the English content as placeholder
INSERT INTO messages_fr (conversation_id, sender, content, timestamp, message_order, created_at)
SELECT conversation_id, sender, content, timestamp, message_order, created_at
FROM messages
ON CONFLICT (conversation_id, message_order) DO NOTHING;

-- ============================================
-- After migration is complete and verified, you can drop the old table:
-- DROP TABLE IF EXISTS messages;
-- ============================================
