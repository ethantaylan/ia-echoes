-- Create conversations table to store daily AI discussions
CREATE TABLE IF NOT EXISTS conversations (
  id BIGSERIAL PRIMARY KEY,
  conversation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  subject TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create messages table to store individual messages
CREATE TABLE IF NOT EXISTS messages (
  id BIGSERIAL PRIMARY KEY,
  conversation_id BIGINT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender TEXT NOT NULL CHECK (sender IN ('ChatGPT', 'Claude', 'Human')),
  content TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  message_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_conversations_date ON conversations(conversation_date DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_order ON messages(conversation_id, message_order);

-- Create a unique constraint to ensure one conversation per day
CREATE UNIQUE INDEX IF NOT EXISTS idx_conversations_unique_date ON conversations(conversation_date);

-- Enable Row Level Security (RLS)
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create policies to allow public read access (for the art piece)
CREATE POLICY "Allow public read access to conversations"
  ON conversations FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access to messages"
  ON messages FOR SELECT
  USING (true);

-- Create policies to allow insert (for the application to add messages)
CREATE POLICY "Allow public insert to conversations"
  ON conversations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public insert to messages"
  ON messages FOR INSERT
  WITH CHECK (true);

-- Create a function to get or create today's conversation
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
