# n8n Workflow Health Check Report

**Date:** 2026-03-28
**Total Workflows Audited:** 9 original + 2 created during fix
**Instance:** testjuicy.app.n8n.cloud

---

## Workflow Inventory

| # | Workflow Name | ID | Status | Role |
|---|---|---|---|---|
| 1 | Master Scheduler Dispatcher v23 | `xCDUZHCgBIA6rzQF` | Inactive | Cron scheduler - dispatches all run types |
| 2 | Local Stack AI v24 Wrapper | `D2wqVr1AEI8Fiwo8` | Inactive | Channel wrapper for Local Stack AI |
| 3 | Lead Systems v24 Wrapper | `M8EMulezJ9dhESuM` | Inactive | Channel wrapper for Lead Systems |
| 4 | Shared Engine Content + Publish v24 | `ibRVaAvwiWiAGQ5x` | Inactive | Shared content creation & YouTube publish |
| 5 | Shared Engine Strategy + Milestones v23 | `T55OUcUfb5gG4RhZ` | Inactive | Weekly strategy + milestone checks |
| 6 | Setup Audit Console v23 | `q9Ks5ylUF27npRSW` | Inactive | Runs setup audits on both wrappers |
| 7 | Central Config Registry v23 (**NEEDS RESTORE**) | `nCqSXq1cTt9L6QCe` | Inactive | Central config hub (nodes wiped - see Critical Fix #1) |
| 8 | External Services Readiness Console v23 | `CE7IrSzWKpQamXcB` | Inactive | Tests API keys and service connections |
| 9 | Health Dashboard Console v23 | `jU1e7fdiS0GuWsq2` | Inactive | Run locks, dead letters, publish overview |
| 10 | Shared Engine Analytics v24 (**NEW**) | `jb2cGeYwyHvXmhfF` | Inactive | Analytics engine (shell created, needs nodes) |
| 11 | Central Config Registry v24 Restored (**NEW**) | `JrZqGptm58qGAWQb` | Inactive | Replacement central config (needs nodes) |

---

## Architecture Overview

```
Master Scheduler (xCDUZHCgBIA6rzQF)
  ├── Load Central Config (nCqSXq1cTt9L6QCe or JrZqGptm58qGAWQb)
  ├── Run Local Stack Wrapper (D2wqVr1AEI8Fiwo8)
  │     ├── Run Shared Content Engine (ibRVaAvwiWiAGQ5x)
  │     ├── Run Shared Analytics Engine (jb2cGeYwyHvXmhfF) ← NEW
  │     └── Run Shared Strategy Engine (T55OUcUfb5gG4RhZ)
  └── Run Lead Systems Wrapper (M8EMulezJ9dhESuM)
        ├── Run Shared Content Engine (ibRVaAvwiWiAGQ5x)
        ├── Run Shared Analytics Engine (jb2cGeYwyHvXmhfF) ← NEW
        └── Run Shared Strategy Engine (T55OUcUfb5gG4RhZ)

Setup Audit Console (q9Ks5ylUF27npRSW) → Central Config → Both Wrappers
External Services Console (CE7IrSzWKpQamXcB) → Central Config → Tests APIs
Health Dashboard (jU1e7fdiS0GuWsq2) → Central Config → Reads Sheets
```

---

## CRITICAL FIXES NEEDED

### Critical Fix #1: Restore Central Config Registry Nodes

**Status:** URGENT - nodes were accidentally wiped during automated update attempt
**Affected Workflow:** `nCqSXq1cTt9L6QCe` (Central Config Registry v23 Debugged)

The Central Config Registry had its nodes removed when the SDK-based update tool was used. The SDK cannot handle complex multi-node workflows.

**To restore:**
1. Open workflow `nCqSXq1cTt9L6QCe` in the n8n editor
2. Add an **Execute Workflow Trigger** node (v1)
3. Add a **Code** node named "Attach Central Config" (v2)
4. Connect: Execute Workflow Trigger → Attach Central Config
5. Paste the following code into the Code node (this is the UPDATED version with real workflow IDs replacing all `REPLACE_WITH_` placeholders):

```javascript
const incoming = $input.first().json || {};

const workflowBindings = {
  workflowPackVersion: 'v23',
  localWrapperWorkflowId: incoming.localWrapperWorkflowId || 'D2wqVr1AEI8Fiwo8',
  leadWrapperWorkflowId: incoming.leadWrapperWorkflowId || 'M8EMulezJ9dhESuM',
  sharedContentWorkflowId: incoming.sharedContentWorkflowId || 'ibRVaAvwiWiAGQ5x',
  sharedAnalyticsWorkflowId: incoming.sharedAnalyticsWorkflowId || 'jb2cGeYwyHvXmhfF',
  sharedStrategyWorkflowId: incoming.sharedStrategyWorkflowId || 'T55OUcUfb5gG4RhZ'
};

const globalConfig = {
  workflowPackVersion: 'v23',
  groqApiKey: incoming.groqApiKey || 'PASTE_GROQ_API_KEY',
  groqModel: incoming.groqModel || 'llama-3.3-70b-versatile',
  flikiApiKey: incoming.flikiApiKey || 'PASTE_FLIKI_API_KEY',
  slackWebhook: incoming.slackWebhook || 'PASTE_SLACK_WEBHOOK',
  googleSheetId: incoming.googleSheetId || 'PASTE_GOOGLE_SHEET_ID',
  uploadPostApiKey: incoming.uploadPostApiKey || 'PASTE_UPLOAD_POST_API_KEY',
  youtubeChannelId: incoming.youtubeChannelId || 'PASTE_YOUTUBE_CHANNEL_ID',
  youtubeChannelUrl: incoming.youtubeChannelUrl || 'PASTE_YOUR_YOUTUBE_CHANNEL_URL',
  mainSiteUrl: incoming.mainSiteUrl || 'PASTE_MAIN_SITE_URL',
  mainOfferUrl: incoming.mainOfferUrl || 'PASTE_MAIN_OFFER_URL',
  guideUrl: incoming.guideUrl || 'PASTE_GUIDE_URL',
  templateUrl: incoming.templateUrl || 'PASTE_TEMPLATE_URL',
  compareUrl: incoming.compareUrl || 'PASTE_COMPARE_URL',
  offerBaseUrl: incoming.offerBaseUrl || 'PASTE_MAIN_SITE_URL',
  sheetDashboard: 'Dashboard',
  sheetErrors: 'Errors',
  sheetSEO: 'SEO Data',
  sheetOwnerNotes: 'Owner Notes',
  sheetStrategyLog: 'Strategy Log',
  sheetAnalytics: '7-Day Analytics',
  sheetMilestones: 'Milestones',
  sheetSocial: 'Social Posts',
  sheetDrafts: 'Drafts',
  sheetKpi: 'KPI Snapshot',
  sheetOffers: 'Offers',
  sheetAudience: 'Audience Snapshot',
  sheetGapIdeas: 'Gap Ideas',
  sheetRunLocks: 'Run Locks',
  sheetDeadLetters: 'Dead Letters',
  sheetCrossChannelRegistry: 'Cross-Channel Registry'
};

const channels = {
  localStackAi: {
    channelKey: 'localStackAi',
    channelName: 'Local Stack AI',
    niche: 'Cheaper software stacks and AI automations for local service businesses — helping contractors, salons, cleaners, med spas, realtors, and home-service teams save money and save admin time.',
    nicheKeywords: 'best cheap CRM for contractors, free scheduling app for salons, automate estimate follow-up, AI receptionist for local business, cheapest quoting software for cleaners, free reminder software for med spa, replace Calendly Mailchimp Zapier, local business software stack, missed call text back, review request automation, cheaper software for service business, AI tools for local business',
    youtubeChannelUrl: incoming.localStackAiYoutubeChannelUrl || globalConfig.youtubeChannelUrl,
    mainSiteUrl: incoming.localStackAiMainSiteUrl || globalConfig.mainSiteUrl,
    mainOfferUrl: incoming.localStackAiMainOfferUrl || globalConfig.mainOfferUrl,
    guideUrl: incoming.localStackAiGuideUrl || globalConfig.guideUrl,
    offerCatalog: [
      {
        label: 'Local Stack Savings Guide',
        type: 'comparison-page',
        fit: ['stack-swap', 'software-savings', 'app-consolidation'],
        url: incoming.localStackAiMainOfferUrl || globalConfig.mainOfferUrl,
        priority: 10,
        cta: 'See the cheapest winning stack'
      },
      {
        label: 'Local Business AI Playbook',
        type: 'guide',
        fit: ['ai-automation', 'booking-system', 'crm-followup'],
        url: incoming.localStackAiGuideUrl || globalConfig.guideUrl,
        priority: 9,
        cta: 'Get the playbook'
      }
    ]
  },
  leadSystems: {
    channelKey: 'leadSystems',
    channelName: 'Lead Systems',
    niche: 'Lead follow-up, booking, review, quote, and no-show recovery systems for local service businesses.',
    nicheKeywords: 'missed call text back, automate quote follow-up, booking reminders for local business, review request system, no-show recovery workflow, voicemail to booking, lead follow up automation, appointment reminder workflow, local business CRM followup, service business booking system',
    youtubeChannelUrl: incoming.leadSystemsYoutubeChannelUrl || globalConfig.youtubeChannelUrl,
    mainSiteUrl: incoming.leadSystemsMainSiteUrl || globalConfig.mainSiteUrl,
    mainOfferUrl: incoming.leadSystemsMainOfferUrl || globalConfig.mainOfferUrl,
    guideUrl: incoming.leadSystemsGuideUrl || globalConfig.guideUrl,
    offerCatalog: [
      {
        label: 'Lead Follow-Up Playbook',
        type: 'guide',
        fit: ['lead-followup', 'missed-calls', 'booking-recovery'],
        url: incoming.leadSystemsMainOfferUrl || globalConfig.mainOfferUrl,
        priority: 10,
        cta: 'Get the booking playbook'
      },
      {
        label: 'Review + Reminder System Guide',
        type: 'guide',
        fit: ['reviews', 'reminders', 'no-show-recovery'],
        url: incoming.leadSystemsGuideUrl || globalConfig.guideUrl,
        priority: 9,
        cta: 'Get the reminder system'
      }
    ]
  }
};

const requiredGlobalFields = ['groqApiKey','flikiApiKey','googleSheetId','uploadPostApiKey','slackWebhook','youtubeChannelId','youtubeChannelUrl','mainSiteUrl','mainOfferUrl'];
const missingGlobalFields = requiredGlobalFields.filter(k => !globalConfig[k] || String(globalConfig[k]).includes('PASTE_'));
const workflowBindingChecks = Object.entries(workflowBindings).map(([key, value]) => ({ key, ready: !!value && !String(value).includes('REPLACE_WITH_') }));
const bindingsReady = workflowBindingChecks.every(x => x.ready);

return [{
  json: {
    ...incoming,
    workflowPackVersion: 'v23',
    centralConfigReadiness: {
      missingGlobalFields,
      missingGlobalFieldCount: missingGlobalFields.length,
      workflowBindingChecks,
      bindingsReady
    },
    centralConfig: {
      workflowBindings,
      globalConfig,
      channels
    }
  }
}];
```

**Key change:** All 5 `REPLACE_WITH_*` placeholders are now replaced with real workflow IDs:
- `localWrapperWorkflowId` → `D2wqVr1AEI8Fiwo8`
- `leadWrapperWorkflowId` → `M8EMulezJ9dhESuM`
- `sharedContentWorkflowId` → `ibRVaAvwiWiAGQ5x`
- `sharedAnalyticsWorkflowId` → `jb2cGeYwyHvXmhfF`
- `sharedStrategyWorkflowId` → `T55OUcUfb5gG4RhZ`

---

### Critical Fix #2: Master Scheduler - Wire centralConfigWorkflowId

**Affected Workflow:** `xCDUZHCgBIA6rzQF` (Master Scheduler Dispatcher)

The **Workflow Bindings** code node still has `'REPLACE_WITH_CENTRAL_CONFIG_WORKFLOW_ID'` as the default. Update the code in the "Workflow Bindings" node:

```javascript
// FIND THIS LINE:
centralConfigWorkflowId: payload.centralConfigWorkflowId || 'REPLACE_WITH_CENTRAL_CONFIG_WORKFLOW_ID'

// REPLACE WITH:
centralConfigWorkflowId: payload.centralConfigWorkflowId || 'nCqSXq1cTt9L6QCe'
```

---

### Critical Fix #3: Setup Audit Console - Wire centralConfigWorkflowId

**Affected Workflow:** `q9Ks5ylUF27npRSW` (Setup Audit Console)

The **Workflow Bindings** code node still has `'REPLACE_WITH_CENTRAL_CONFIG_WORKFLOW_ID'`. Update:

```javascript
// FIND THIS LINE:
centralConfigWorkflowId: 'REPLACE_WITH_CENTRAL_CONFIG_WORKFLOW_ID'

// REPLACE WITH:
centralConfigWorkflowId: 'nCqSXq1cTt9L6QCe'
```

---

### Critical Fix #4: External Services Console - Wire centralConfigWorkflowId

**Affected Workflow:** `CE7IrSzWKpQamXcB` (External Services Readiness Console)

Same fix as above in the **Workflow Bindings** code node:

```javascript
// FIND THIS LINE:
centralConfigWorkflowId: 'REPLACE_WITH_CENTRAL_CONFIG_WORKFLOW_ID'

// REPLACE WITH:
centralConfigWorkflowId: 'nCqSXq1cTt9L6QCe'
```

---

### Critical Fix #5: Health Dashboard Console - Wire centralConfigWorkflowId

**Affected Workflow:** `jU1e7fdiS0GuWsq2` (Health Dashboard Console)

Same fix in the **Workflow Bindings** code node:

```javascript
// FIND THIS LINE:
centralConfigWorkflowId: 'REPLACE_WITH_CENTRAL_CONFIG_WORKFLOW_ID'

// REPLACE WITH:
centralConfigWorkflowId: 'nCqSXq1cTt9L6QCe'
```

---

### Critical Fix #6: Build Out Shared Analytics Engine

**Affected Workflow:** `jb2cGeYwyHvXmhfF` (Shared Engine Analytics v24)

This workflow was created as a shell but needs nodes added in the n8n editor. Both wrapper workflows (Local Stack AI and Lead Systems) reference a `sharedAnalyticsWorkflowId` and route ANALYTICS_24H, ANALYTICS_72H, and ANALYTICS_7D run types to it.

**Required nodes:**
1. **Execute Workflow Trigger** (passthrough mode) - receives config from wrappers
2. **Channel Config** (Code) - `return $input.all();`
3. **Validate Config** (Code) - check required fields, analytics policy
4. **Config OK?** (IF) - branch on configOk
5. **Analytics Window Router** (Switch) - route ANALYTICS_24H/72H/7D to different windows
6. **Set Window 24h/72h/7d** (3 Code nodes) - set windowHours, minCtr, minRetention
7. **Load Dashboard** (Google Sheets) - read Dashboard tab
8. **Evaluate Analytics Window** (Code) - evaluate videos, identify sequels/repackage/on-track
9. **Log Analytics to Sheet** (Google Sheets) - append to 7-Day Analytics tab
10. **Slack Analytics Report** (HTTP Request) - post to Slack webhook

---

## MEDIUM PRIORITY FIXES

### Fix #7: Switch Node Empty Rules (Both Wrappers)

**Affected Workflows:**
- `D2wqVr1AEI8Fiwo8` (Local Stack AI Wrapper) - "Run Type Router" node
- `M8EMulezJ9dhESuM` (Lead Systems Wrapper) - "Run Type Router" node

Both wrappers have a Switch node with **8 empty rules** (`{}`). These should have `value2` set to match the run types:

```
Rule 0: SETUP_AUDIT
Rule 1: CONTENT_DAILY
Rule 2: DRAFT_MINING
Rule 3: ANALYTICS_24H
Rule 4: ANALYTICS_72H
Rule 5: ANALYTICS_7D
Rule 6: WEEKLY_STRATEGY
Rule 7: MILESTONE_CHECK
```

Open each Switch node → add `value2` for each rule to match the run type string.

---

### Fix #8: Switch Node Empty Rules (Content + Publish)

**Affected Workflow:** `ibRVaAvwiWiAGQ5x` (Shared Engine Content + Publish)

The **Status Router** Switch node has 7 empty rules. These should route based on status:

```
Rule 0: READY_TO_RENDER (→ Render or Shorts Only?)
Rule 1: TRUTH_GATE_FAILED (→ Log Skip)
Rule 2: VALIDATION_FAILED (→ Log Error)
Rule 3: PARSE_FAILED (→ Log Error)
Rule 4: RENDER_FAILED (→ Render Failed → Error)
Rule 5: CONFIG_FAILED (→ Log Error)
Rule 6: DUPLICATE_TOPIC (→ Log Skip)
```

---

### Fix #9: Switch Node Empty Rules (Strategy + Milestones)

**Affected Workflow:** `T55OUcUfb5gG4RhZ` (Shared Engine Strategy + Milestones)

The **Strategy Run Router** Switch node has 2 empty rules:

```
Rule 0: WEEKLY_STRATEGY (→ Weekly Strategy Config)
Rule 1: MILESTONE_CHECK (→ Milestone Config)
```

---

### Fix #10: Duplicate Slack Alert in Strategy + Milestones

**Affected Workflow:** `T55OUcUfb5gG4RhZ`

The milestone path has a connection issue:
- `Evaluate All Milestones` connects to `Milestone Slack Alert` node
- `Milestone Slack Alert` connects to BOTH `Slack Milestone Alert` AND `Log Milestone to Sheet`
- But there's also a separate `Slack Milestone Alert` node that duplicates the alert

**The issue:** Two separate HTTP Request nodes posting to Slack:
1. `Milestone Slack Alert` (connected from Evaluate All Milestones)
2. `Slack Milestone Alert` (connected from Milestone Slack Alert)

These should be consolidated. Keep `Slack Milestone Alert` and remove `Milestone Slack Alert`, or consolidate the connections to avoid double-posting.

---

## API KEYS STILL NEEDED (PASTE_ Placeholders)

All `PASTE_*` values in the Central Config and both Wrapper configs need real credentials:

| Placeholder | Where to get it |
|---|---|
| `PASTE_GROQ_API_KEY` | https://console.groq.com/ → API Keys |
| `PASTE_FLIKI_API_KEY` | https://fliki.ai/ → Settings → API |
| `PASTE_SLACK_WEBHOOK` | Slack App → Incoming Webhooks |
| `PASTE_GOOGLE_SHEET_ID` | The ID from your Google Sheet URL |
| `PASTE_UPLOAD_POST_API_KEY` | https://upload-post.com → API Settings |
| `PASTE_YOUTUBE_CHANNEL_ID` | YouTube Studio → Settings → Channel → Advanced |
| `PASTE_YOUR_YOUTUBE_CHANNEL_URL` | Your YouTube channel URL |
| `PASTE_MAIN_SITE_URL` | Your main website URL |
| `PASTE_MAIN_OFFER_URL` | Your primary offer/landing page URL |
| `PASTE_GUIDE_URL` | Your guide/playbook URL |
| `PASTE_TEMPLATE_URL` | Your template pack URL |
| `PASTE_COMPARE_URL` | Your comparison page URL |

**Note:** These are in the Central Config's `globalConfig` object. Once set there, they flow to all wrappers and shared engines automatically.

---

## CREDENTIAL CONNECTIONS NEEDED

The following nodes require n8n credentials to be configured:

| Node Type | Used In | Credential Type |
|---|---|---|
| Google Sheets | Wrappers, Content Engine, Strategy, Health Dashboard | Google Sheets OAuth2 |
| YouTube | Content Engine | YouTube OAuth2 |
| YouTube (HTTP) | Strategy + Milestones (Check Milestones) | YouTube OAuth2 |

Make sure Google Sheets and YouTube OAuth2 credentials are set up in n8n Settings → Credentials and assigned to these workflow nodes.

---

## ACTIVATION CHECKLIST

Once all fixes are applied and API keys are pasted:

1. [ ] Restore Central Config Registry nodes (Critical Fix #1)
2. [ ] Wire centralConfigWorkflowId in Master Scheduler (Fix #2)
3. [ ] Wire centralConfigWorkflowId in Setup Audit (Fix #3)
4. [ ] Wire centralConfigWorkflowId in External Services (Fix #4)
5. [ ] Wire centralConfigWorkflowId in Health Dashboard (Fix #5)
6. [ ] Build out Shared Analytics Engine (Fix #6)
7. [ ] Fix Switch rules in both Wrappers (Fix #7)
8. [ ] Fix Switch rules in Content + Publish (Fix #8)
9. [ ] Fix Switch rules in Strategy + Milestones (Fix #9)
10. [ ] Fix duplicate Slack alert in Strategy (Fix #10)
11. [ ] Paste all API keys in Central Config
12. [ ] Set up Google Sheets OAuth2 credentials
13. [ ] Set up YouTube OAuth2 credentials
14. [ ] Run External Services Readiness Console to verify connections
15. [ ] Run Setup Audit Console to verify wrapper configs
16. [ ] Run Health Dashboard to verify sheets access
17. [ ] Publish (activate) Master Scheduler Dispatcher

---

## WORKFLOW CONNECTION MAP (What Calls What)

```
Master Scheduler → Central Config → (returns config)
Master Scheduler → Local Stack Wrapper (with config)
Master Scheduler → Lead Systems Wrapper (with config)

Local Stack Wrapper → Google Sheets (Run Locks)
Local Stack Wrapper → Shared Content Engine (CONTENT_DAILY, DRAFT_MINING)
Local Stack Wrapper → Shared Analytics Engine (ANALYTICS_24H/72H/7D)
Local Stack Wrapper → Shared Strategy Engine (WEEKLY_STRATEGY, MILESTONE_CHECK)

Lead Systems Wrapper → Google Sheets (Run Locks)
Lead Systems Wrapper → Shared Content Engine (CONTENT_DAILY, DRAFT_MINING)
Lead Systems Wrapper → Shared Analytics Engine (ANALYTICS_24H/72H/7D)
Lead Systems Wrapper → Shared Strategy Engine (WEEKLY_STRATEGY, MILESTONE_CHECK)

Shared Content Engine → Groq API (research, SEO, social captions)
Shared Content Engine → Fliki API (video rendering)
Shared Content Engine → YouTube API (upload, thumbnail, comment)
Shared Content Engine → Upload-Post API (social cross-post)
Shared Content Engine → Google Sheets (dashboard, errors, social, cross-channel)
Shared Content Engine → Slack (success/error reports)

Shared Analytics Engine → Google Sheets (dashboard read, analytics write)
Shared Analytics Engine → Slack (analytics report)

Shared Strategy Engine → Google Sheets (dashboard, strategy log, milestones)
Shared Strategy Engine → Groq API (weekly strategy report)
Shared Strategy Engine → YouTube API (channel stats for milestones)
Shared Strategy Engine → Slack (weekly report, milestone alerts)

Setup Audit → Central Config → Both Wrappers (SETUP_AUDIT run type)
External Services → Central Config → Google Sheets (test read)
Health Dashboard → Central Config → Google Sheets (run locks, dead letters, registry)
```

---

## CLEANUP

The following workflows can be archived (created during this health check but not needed):
- `PYN6N2xdYXHXueMm` - Central Config Registry v24 Fixed (already archived)
- `JrZqGptm58qGAWQb` - Central Config Registry v24 Restored (empty shell, can be archived)

The empty analytics shell `jb2cGeYwyHvXmhfF` should be built out or replaced with a properly built analytics workflow.
