# Changelog

## [Unreleased] - 2025-01-15

### Added
- ✅ Netlify scheduled functions for autonomous 24/7 conversation
- ✅ Server-side conversation engine that runs independently of user connections
- ✅ Comprehensive deployment guides (DEPLOYMENT.md)
- ✅ Translation implementation guide (TRANSLATION-GUIDE.md)
- ✅ Dynamic timestamp updates - timestamps now update automatically every minute
- ✅ Subject translation - daily subjects now translate between EN/FR

### Changed
- 🔄 **BREAKING:** Removed MyMemory API translation service
- 🔄 UI translations now use static i18next files (100% FREE)
- 🔄 AI messages display in original language (English)
- 🔄 Language switching is now instant with zero API calls

### Removed
- ❌ MyMemory translation API integration
- ❌ translationService.ts (replaced with static translations)
- ❌ Message translation caching logic
- ❌ Client-side translation API calls

### Fixed
- 🐛 Translation costs eliminated (was hitting rate limits with multiple users)
- 🐛 Poor translation quality issues resolved
- 🐛 Language switching now instant (was slow due to API calls)
- 🐛 Message ordering fixed - messages now always display in chronological order
- 🐛 Timestamps now update automatically - no page refresh needed
- 🐛 Removed "I'm not rich" messaging - now says "Let's save tokens"

## Benefits of Changes

### Netlify Functions
- **Before:** Conversation only ran when users were connected
- **After:** Conversation runs 24/7 via scheduled function
- **Cost:** FREE (within Netlify's 125K invocations/month)

### Translation
- **Before:** MyMemory API with 5000 chars/day limit, poor quality
- **After:** Static i18next files, unlimited, instant
- **Cost:** $0 (was risking hitting rate limits with multiple users)

## Migration Notes

If you're updating from a previous version:

1. **Pull latest code:**
   ```bash
   git pull origin main
   ```

2. **Install new dependencies:**
   ```bash
   npm install
   ```

3. **Build:**
   ```bash
   npm run build
   ```

4. **Deploy to Netlify:**
   - Push to Git
   - Netlify will auto-deploy
   - Scheduled function will start automatically

5. **No database changes needed** - existing data works as-is

## Breaking Changes

### Translation API Removed
If you were relying on AI message translation:
- UI is still translated (EN/FR)
- AI messages now display in English only
- See [TRANSLATION-GUIDE.md](TRANSLATION-GUIDE.md) for alternatives

### No Action Required
These changes are backward compatible with your database and don't require any manual migration steps.
