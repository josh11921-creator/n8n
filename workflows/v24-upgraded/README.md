# v24 Maxed — Subscriber & Revenue Upgrade Pack

Complete upgrade to all 7 workflows in the pack. Designed around one goal:
**maximum subscribers and revenue as fast as possible**, while remaining TOS-safe, simple, and fully automated.

---

## What Changed (vs v24 Basic)

### Shared Engine Content v24 Maxed (`ZHXBmDQ7mhI8lEoH`)

**Before:** Stub — returned `CONTENT_COMPLETE` without doing anything.

**After:**
- Calls Groq LLM (`llama-3.3-70b-versatile`) to generate real content per run
- `CONTENT_DAILY`: generates title + 3 A/B variants, SEO description with pinned CTA, 10 tags, thumbnail concept, 60-sec Shorts hook script, opening hook sentence, estimated CTR, best post time
- `CONTENT_SHORTS` (new): generates scroll-stopping hook, punchy 60-sec script, hashtags, thumbnail text
- `DRAFT_MINING`: mines 5 high-gap video ideas with search volume tier, competition tier, gap score 0-100, offer fit
- Picks a random keyword from `nicheKeywords` each run for variety
- Falls back to smart demo data if Groq API key not set yet
- Attaches all CTAs from offer catalog including `shortsCta` variants

### Shared Engine Strategy v24 Maxed (`pMFr3Sgak21AIOPx`)

**Before:** Stub — returned static string.

**After:**
- `WEEKLY_STRATEGY`: Groq generates a full weekly brief — week theme, 3-video plan (Mon/Wed/Fri), gap opportunities with scores, revenue strategy with CTA placement, thumbnail trend, posting schedule, subscriber growth tip
- `MILESTONE_CHECK`: Groq generates milestone velocity targets (subs/day to hit each milestone), content frequency recommendation, revenue unlock timing, prioritised action
- Includes `milestoneTargets` array (100 → 500 → 1K → 2.5K → 5K → 10K) with revenue estimates and action steps at each level
- Falls back to smart demo data if Groq not configured

### Shared Engine Analytics v24 Maxed (`7MbU3Q9mCewtH7xw`)

**Before:** Stub — returned `ANALYTICS_COMPLETE` without computing anything.

**After:**
- Computes real metrics: total views, total subs, subs/day velocity, avg CTR, avg watch time, total offer clicks, offer CVR
- Scores every video (40% subs, 30% CTR, 20% offer clicks, 10% comments) to rank top performers
- Identifies win signals (CTR > 9%, strong sub-per-video, CVR > 1.5%) and loss signals (CTR < 6%, low watch time, low offer CVR)
- Calls Groq to interpret results: `interpretation`, `topAction`, `doubleDownOn`, `stopDoing`, `revenueOpportunity`
- Outputs `slackDigest` string ready for Slack webhook
- Uses realistic demo data seed when Google Sheets not connected yet

### Central Config Registry v24 Maxed (`nCqSXq1cTt9L6QCe`)

**Changes:**
- Adds `emailCaptureUrl` field — channel-level and global
- Sharpened CTAs: "See the exact stack that saves $300/mo — free guide", "Stop no-shows: get the free reminder system", "Copy the missed-call text-back template free"
- Added `shortsCta` to every offer catalog entry
- Added free email course as 3rd offer entry (email-capture type)
- Added `schedule` config block with cron overrides for every trigger
- Added `velocityTargets` block (subsPerDayTarget, offerCvrTarget, avgCtrTarget, videosPerWeekTarget, shortsPerWeekTarget)
- `isUnset` now catches demo placeholders and example.com URLs, raising readiness score correctly
- Added `readinessScore` (0-100%) and `setupHint` to help debug missing keys
- `shortsEnabled` flag per channel

### Master Scheduler Dispatcher v24 Maxed (`xCDUZHCgBIA6rzQF`)

**Changes:**
- Added **Shorts Content trigger** — runs `CONTENT_SHORTS` at 3pm Tue+Thu
- Added **Evening Content trigger** — runs `CONTENT_DAILY` at 7pm Mon+Wed+Fri (doubles output volume)
- Total content runs per week: 5 morning + 3 evening + 2 Shorts = **10 runs/week** vs 5 before
- All existing triggers preserved

### Wrappers v24 Maxed (`D2wqVr1AEI8Fiwo8` + `M8EMulezJ9dhESuM`)

**Changes:**
- Added `CONTENT_SHORTS` to routing table (routes to content engine)
- Added `shortsEnabled` gate — skips with dead-letter if shorts disabled per channel
- `isUnset` now also catches `demo-` prefixed and `example.com` values
- Added **Slack win alert node**: when analytics run detects `subsPerDay >= velocityTargets.subsPerDayTarget`, posts a Slack win notification with channel name, velocity, offer CVR, and top action
- Win alert skips gracefully if Slack webhook is placeholder

---

## Apply to n8n

```bash
export N8N_BASE_URL=https://your-n8n-instance.com
export N8N_API_KEY=your_api_key
bash workflows/v24-upgraded/apply-upgrades.sh
```

---

## Setup Checklist (after applying)

1. Open **Central Config Registry** and add your real values:
   - `groqApiKey` — get free at console.groq.com
   - `googleSheetId` — your tracking spreadsheet
   - `slackWebhook` — for daily alerts
   - `mainOfferUrl`, `guideUrl`, `emailCaptureUrl` — your lead gen URLs
   - `youtubeChannelId`, `youtubeChannelUrl`
   - `uploadPostApiKey` (for auto-publishing)
   - `flikiApiKey` (for video generation)

2. **Activate Master Scheduler** (`xCDUZHCgBIA6rzQF`) — this starts all automation

3. Run **Manual Start** → verify `CONTENT_DAILY` runs end-to-end

4. Check **7-Day Analytics** after first week to see velocity and win/loss signals

---

## Run Type Reference

| Run Type | Trigger | Engine | Output |
|---|---|---|---|
| `CONTENT_DAILY` | 10am weekdays + 7pm Mon/Wed/Fri | Content | AI title, 3 variants, description, tags, Shorts script, CTA |
| `CONTENT_SHORTS` | 3pm Tue+Thu | Content | Hook, 60-sec script, hashtags, thumbnail text |
| `DRAFT_MINING` | 3pm weekdays | Content | 5 gap-scored video ideas with offer fit |
| `ANALYTICS_24H` | 12pm daily | Analytics | 24h metrics, win/loss signals, AI interpretation |
| `ANALYTICS_72H` | 1pm daily | Analytics | 72h metrics |
| `ANALYTICS_7D` | 11am daily | Analytics | 7-day metrics, Slack digest |
| `WEEKLY_STRATEGY` | Monday 9am | Strategy | Week theme, 3-video plan, gap opportunities, revenue strategy |
| `MILESTONE_CHECK` | 9am daily | Strategy | Velocity to next milestone, content frequency, top action |

---

## Revenue Model at Each Milestone

| Subs | Revenue Estimate | Primary Action |
|---|---|---|
| 100 | $0/mo | Focus on output volume (3 vids/wk) |
| 500 | $50-100/mo | Pin CTA in every description + start email list |
| 1,000 | $100-300/mo | Enable YouTube Partner + push lead magnet |
| 2,500 | $300-600/mo | Mid-roll ads + paid guide launch |
| 5,000 | $600-1,500/mo | Community + sponsorships + consultation upsell |
| 10,000 | $1,500-4,000/mo | Affiliate partnerships + high-ticket offer + courses |
