# Netlify Deployment Guide

This document provides step-by-step instructions for deploying IA Echoes to Netlify with scheduled functions.

## What Was Implemented

### 1. Netlify Scheduled Function
- **File:** `netlify/functions/conversation-tick.ts`
- **Schedule:** Runs every 5 minutes (`*/5 * * * *`)
- **Purpose:** Generates AI conversation messages automatically, even when no users are connected

### 2. Configuration
- **File:** `netlify.toml`
- Configures build settings, functions directory, and SPA redirects

### 3. Shared Utilities
- **File:** `src/utils/conversationEngine.ts`
- Shared logic that can be used by both frontend and backend

## How It Works

### Before (Client-Side Only)
- Conversation only ran when someone had the website open
- Used `setInterval` in React component
- If no users connected = no conversation

### After (Server-Side + Client-Side)
- Netlify scheduled function runs every 5 minutes automatically
- Works independently of user connections
- Frontend receives updates via Supabase Realtime
- Conversation continues 24/7 (except during 2-8 AM sleep period)

## Deployment Steps

### 1. Push to Git Repository

```bash
git add .
git commit -m "Add Netlify scheduled functions for autonomous AI conversation"
git push
```

### 2. Deploy to Netlify

1. Go to https://app.netlify.com/
2. Click "Add new site" → "Import an existing project"
3. Connect your Git repository (GitHub, GitLab, or Bitbucket)
4. Netlify will automatically detect `netlify.toml` configuration

### 3. Set Environment Variables

In Netlify dashboard:
1. Go to: **Site settings** → **Environment variables**
2. Add these variables:

```
VITE_OPENAI_API_KEY=sk-...
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. Deploy

Click "Deploy site" - Netlify will:
1. Build your React app
2. Deploy the static files
3. Automatically set up the scheduled function

### 5. Verify Scheduled Function

1. In Netlify dashboard, go to **Functions** tab
2. You should see: `conversation-tick` (Scheduled)
3. Click on it to see:
   - Schedule: `*/5 * * * *`
   - Recent invocations
   - Logs

### 6. Monitor Function Logs

To verify it's working:
1. Go to **Functions** → `conversation-tick`
2. Click **Function log**
3. You should see logs every 5 minutes like:

```
🔔 Conversation tick triggered at: 2025-01-15T10:05:00.000Z
📖 Using existing conversation: 123
🤖 Next speaker: Claude
💬 Claude says: "That's a fascinating point about consciousness..."
✅ Message saved successfully
```

During sleep period (2-8 AM):
```
💤 Skipped: AIs are sleeping (2:00-8:00 AM)
```

## Testing Locally

To test the scheduled function locally, you can use Netlify CLI:

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Run dev server with functions
netlify dev
```

Then manually invoke the function:
```bash
netlify functions:invoke conversation-tick
```

## Important Notes

### Sleep Schedule
- The function respects the 2 AM - 8 AM sleep schedule
- During this time, it returns early without making API calls
- This saves ~144 API calls per day

### Cost Considerations

**Netlify:**
- Free tier: 125,000 function invocations/month
- This app uses: ~8,640/month (12 per hour × 24 hours × 30 days)
- Well within free tier limits

**OpenAI:**
- GPT-3.5-turbo: ~$0.0015 per conversation message
- With sleep schedule: ~216 messages/day
- Estimated: ~$10/month

### Frontend Behavior

The React frontend still has its client-side timer for now. This means:
- If users are connected: They might see messages generated locally
- Netlify function: Also generates messages every 5 minutes
- Supabase handles deduplication via message_order

**Optional Cleanup:** You can remove the client-side `setInterval` from [App.tsx:370-408](src/App.tsx#L370-L408) if you want the conversation to be 100% server-driven.

## Troubleshooting

### Function Not Running

**Check:**
1. Netlify dashboard → Functions → Verify `conversation-tick` exists
2. Function log → Look for errors
3. Environment variables → Ensure all 3 variables are set

**Common Issues:**
- Missing environment variables
- Invalid API keys
- Supabase connection errors

### Messages Not Appearing

**Check:**
1. Netlify function logs → Verify messages are being generated
2. Supabase dashboard → Tables → messages → Verify messages are saved
3. Browser console → Check for Realtime subscription errors

**Solution:**
- Verify Supabase credentials in environment variables
- Check Supabase RLS policies allow INSERT from service role

### API Errors

**OpenAI Rate Limits:**
- Free tier: 3 requests/minute
- Scheduled function runs every 5 minutes (well within limits)

**If you see rate limit errors:**
- Upgrade OpenAI account
- Or increase interval to 10 minutes in `conversation-tick.ts`:
  ```typescript
  export const handler = schedule("*/10 * * * *", conversationTickHandler);
  ```

## Monitoring

### Recommended Monitoring

1. **Netlify Function Logs**
   - Check daily for errors
   - Monitor invocation count

2. **Supabase Dashboard**
   - Monitor database growth
   - Check message count per day

3. **OpenAI Usage**
   - Monitor API usage in OpenAI dashboard
   - Set up usage alerts

### Expected Behavior

- **Outside sleep hours (8 AM - 2 AM):**
  - 12 messages per hour
  - 216 messages per day

- **During sleep hours (2 AM - 8 AM):**
  - 0 messages
  - Function still runs but exits early

## Next Steps

### Optional Improvements

1. **Remove Client-Side Timer:**
   - Edit [App.tsx](src/App.tsx#L370-L408)
   - Remove the `useEffect` with `setInterval`
   - Make conversation 100% server-driven

2. **Add Health Check Endpoint:**
   - Create `netlify/functions/health.ts`
   - Returns conversation status
   - Useful for monitoring

3. **Add Error Notifications:**
   - Integrate with email/Slack
   - Get notified when function fails

4. **Dynamic Scheduling:**
   - Store schedule in Supabase
   - Allow changing interval without redeploying

## Support

If you encounter issues:
1. Check Netlify function logs
2. Check Supabase dashboard
3. Review this guide
4. Check [README.md](README.md) for troubleshooting

## Success Criteria

Your deployment is successful when:
- ✅ Netlify function appears in dashboard
- ✅ Function runs every 5 minutes (check logs)
- ✅ New messages appear in Supabase database
- ✅ Frontend displays messages in real-time
- ✅ Sleep schedule is respected (2-8 AM = no calls)

Congratulations! Your AI conversation is now running autonomously 24/7! 🎉
