# Subscriber & Revenue Growth Upgrade — v24 Workflow Changes

## What Changed (Summary)

Five workflow updates were applied directly to your n8n instance to maximize subscriber growth and revenue velocity while staying simple, high-ROI, TOS-safe, and failsafe.

| Workflow | ID | Change | Impact |
|---|---|---|---|
| **Central Config Registry** | `nCqSXq1cTt9L6QCe` | Routes to FULL engines + adds growth config | Everything downstream now actually works |
| **Master Scheduler** | `xCDUZHCgBIA6rzQF` | 7-day content, 2x strategy, daily milestones | +40% more content output per week |
| **Local Stack Wrapper** | `D2wqVr1AEI8Fiwo8` | Routes to full engines instead of stubs | Content actually gets created and published |
| **Lead Systems Wrapper** | `M8EMulezJ9dhESuM` | Routes to full engines instead of stubs | Second channel actually produces videos |
| **Published/Activated** | All above | Published to production | Schedules fire automatically |

---

## Critical Fix: Stub Engines → Full Engines

### Before (broken)
The Central Config was routing content to `ZHXBmDQ7mhI8lEoH` (a stub that just returns "CONTENT_COMPLETE" without doing anything) and strategy to `pMFr3Sgak21AIOPx` (another stub).

### After (working)
- **Content** → `ibRVaAvwiWiAGQ5x` (Shared Engine Content + Publish v24 Maxed) — the full pipeline with AI research, Fliki video rendering, YouTube upload, SEO optimization, thumbnail generation, social cross-posting
- **Strategy** → `T55OUcUfb5gG4RhZ` (Shared Engine Strategy + Milestones v23 Debugged) — weekly strategy reports, cash scorecards, milestone tracking (YPP, affiliate readiness, revenue targets)

---

## Schedule Changes (More Content, Faster Feedback)

### Before
| Trigger | Schedule |
|---|---|
| Content | 10am weekdays only (5 days) |
| Strategy | Monday 9am only |
| Milestones | 9am daily |

### After
| Trigger | Schedule | Why |
|---|---|---|
| **Content** | **9am every day (7 days)** | 40% more videos per week. YouTube rewards consistent daily posting. |
| Draft Mining | 3pm weekdays | Unchanged — builds content queue |
| **Strategy** | **Mon + Thu 8am** | Twice-weekly course corrections. Catch declining trends mid-week. |
| **Milestones** | **8am daily** | Earlier check, before content runs |
| 24h Analytics | 12pm daily | Unchanged |
| 72h Analytics | 1pm daily | Unchanged |
| 7-Day Analytics | 11am daily | Unchanged |

---

## Growth Config Added to Central Config

New global config fields that tune the system for faster growth:

```
contentFrequency: 'daily'           — runs content 7 days/week
maxVideosPerDay: 1                  — safe, sustainable pace
enableSequelTracking: true          — turns winners into series
enableCrossPost: true               — auto-post to TikTok/IG/FB
socialOnlyForWinners: true          — only cross-post high scorers (TOS safe)
socialMinScore: 8.5                 — quality threshold for social
winnerPatternShare: 0.7             — 70% of videos use winning formulas
secondaryPatternShare: 0.2          — 20% use second-best patterns
experimentPatternShare: 0.1         — 10% test new angles
subscriberCtaTemplate               — consistent subscribe CTA in every video
subscribeReminder                   — pinned comment subscribe nudge
affiliateCapEnabled: true           — prevents affiliate spam
maxAffiliateVideosPerThree: 2       — max 2 of every 3 can be affiliate
moneyMixTargets: 70/20/10          — buyer intent / authority / experiments
```

---

## What You Need To Do (One-Time Setup)

### 1. Add Google Sheets OAuth2 Credentials
The full Content Engine and Strategy Engine need Google Sheets access. In your n8n instance:
1. Go to **Credentials** → **New Credential** → **Google Sheets OAuth2 API**
2. Connect your Google account
3. Open workflow `ibRVaAvwiWiAGQ5x` (Content Engine) and assign the credential to all Google Sheets nodes
4. Open workflow `T55OUcUfb5gG4RhZ` (Strategy Engine) and assign the credential to all Google Sheets nodes
5. Publish both workflows after adding credentials

### 2. Add YouTube OAuth2 Credentials
1. Go to **Credentials** → **New Credential** → **YouTube OAuth2 API**
2. Connect your YouTube channel
3. Assign to YouTube Upload nodes in the Content Engine
4. Re-publish `ibRVaAvwiWiAGQ5x`

### 3. Replace Demo API Keys in Central Config
Open the Central Config workflow and replace the demo values:
- `groqApiKey` — your Groq API key
- `flikiApiKey` — your Fliki API key
- `slackWebhook` — your Slack webhook URL
- `googleSheetId` — your Google Sheet ID
- `uploadPostApiKey` — your Upload-Post API key
- `youtubeChannelId` — your YouTube channel ID
- `youtubeChannelUrl` — your YouTube channel URL
- `mainSiteUrl`, `mainOfferUrl`, `guideUrl` — your actual URLs

### 4. Verify Activation
All these workflows should show as **Active** in n8n:
- [x] Central Config Registry (`nCqSXq1cTt9L6QCe`) — Published
- [x] Master Scheduler (`xCDUZHCgBIA6rzQF`) — Published
- [x] Local Stack Wrapper (`D2wqVr1AEI8Fiwo8`) — Published
- [x] Lead Systems Wrapper (`M8EMulezJ9dhESuM`) — Published
- [ ] Content Engine (`ibRVaAvwiWiAGQ5x`) — Needs credentials first
- [ ] Strategy Engine (`T55OUcUfb5gG4RhZ`) — Needs credentials first
- [x] Analytics Engine (`7MbU3Q9mCewtH7xw`) — Already published

---

## Revenue Path: What These Changes Unlock

### Immediate (Week 1-2)
- Daily content output across both channels
- Pattern Engine picks proven winners 70% of the time
- Every video gets SEO-optimized title, description, tags
- AI thumbnails generated for every upload
- Subscriber CTA in every video + pinned comment

### Short-term (Week 3-8)
- 2x weekly strategy reports catch what's working/failing
- Milestone tracker alerts when you hit YPP thresholds
- Affiliate readiness alerts tell you exactly when to sign up
- Cross-channel dedupe prevents topic overlap between channels

### Medium-term (Month 2-4)
- YPP monetization (1,000 subs + 4,000 watch hours)
- Affiliate links in top video descriptions
- PDF product launch when audience hits threshold
- Social cross-posting multiplies reach for winners

---

## Safety & TOS Compliance

- **No spam**: 1 video per channel per day, quality-gated
- **No clickbait**: Title + Truth Gate blocks misleading language
- **No fake engagement**: Social cross-posting only for genuine high-scoring content
- **Authenticity Gate**: Every video must include honest downsides and concrete examples
- **Budget Guard**: Fliki credit tracking prevents overspending
- **Maintenance Mode**: One-toggle kill switch for everything
- **Error logging**: All failures go to Google Sheets + Slack

---

## Failsafe Architecture

| Layer | Protection |
|---|---|
| Config validation | Blocks runs with missing API keys |
| Setup audit | Pre-flight check for all integrations |
| Policy gates | Maintenance mode, channel disable, test mode |
| Quality gates | Score minimums, originality, trust, authenticity |
| Budget guard | Monthly Fliki credit limits with reserve for winners |
| Cross-channel dedupe | Prevents duplicate topics across channels |
| Error routing | All failures logged + Slack alerts |
| Affiliate cap | Max 2/3 videos can be affiliate-focused |
