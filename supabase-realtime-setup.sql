-- Enable Realtime for the messages table
-- This allows clients to receive real-time updates when new messages are inserted

-- First, enable the Realtime publication for the messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Optional: If you want to enable Realtime for conversations table as well
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;

-- Verify that Realtime is enabled
-- You should see 'messages' and 'conversations' in the list
SELECT tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime';
