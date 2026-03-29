# Build: Shared Engine Analytics v24

## Workflow ID
`jb2cGeYwyHvXmhfF` (created as empty shell during health check)

## Purpose
Both wrappers (Local Stack AI and Lead Systems) route ANALYTICS_24H, ANALYTICS_72H, and ANALYTICS_7D run types to this shared analytics engine. It evaluates recent video performance and recommends actions (sequel, repackage title/thumbnail, repackage hook, or hold).

## Node Structure

### 1. Execute Workflow Trigger (v1.1)
- Mode: passthrough
- Receives full config from wrapper

### 2. Channel Config (Code v2)
```javascript
return $input.all();
```

### 3. Validate Config (Code v2)
```javascript
const cfg = items[0].json || {};
const missing = [];
const REQUIRED = ['niche','groqApiKey','slackWebhook','googleSheetId','youtubeChannelId'];
for (const f of REQUIRED) {
  if (!cfg[f] || String(cfg[f]).includes('PASTE_')) missing.push(f);
}
const policyIssues = [];
if (cfg.analyticsEnabled === false || cfg.channelAllowAnalytics === false) policyIssues.push('ANALYTICS_DISABLED');
if (cfg.maintenanceMode) policyIssues.push('MAINTENANCE_MODE');
if (cfg.channelEnabled === false) policyIssues.push('CHANNEL_DISABLED');
return [{
  json: {
    ...cfg,
    configOk: missing.length === 0 && policyIssues.length === 0,
    configError: [
      missing.length ? 'MISSING: ' + missing.join(', ') : '',
      policyIssues.length ? 'POLICY: ' + policyIssues.join(', ') : ''
    ].filter(Boolean).join(' | '),
    runId: cfg.runId || ('analytics_' + Date.now()),
    startedAt: cfg.startedAt || new Date().toISOString(),
    workflowPackVersion: cfg.workflowPackVersion || 'v24'
  }
}];
```

### 4. Config OK? (IF v2)
- Condition: `{{ $json.configOk }}` equals `true`
- TRUE → Analytics Window Router
- FALSE → Config Fail Log

### 5. Config Fail Log (Code v2)
```javascript
return [{ json: { ...items[0].json, status:'CONFIG_FAILED', errorStep:'Validate Config', errorMessage:items[0].json.configError||'Unknown', timestamp:new Date().toISOString(), needsIntervention:true } }];
```

### 6. Log Error (Google Sheets v4)
- Operation: Append
- Document ID: `{{ $('Channel Config').first().json.googleSheetId }}`
- Sheet: `{{ $('Channel Config').first().json.sheetDeadLetters || 'Errors' }}`
- Columns: date, runId, status, errorStep, errorMessage, channelName, lockKey, workflowPackVersion

### 7. Slack Error (HTTP Request v4.1)
- POST to `{{ $('Channel Config').first().json.slackWebhook }}`

### 8. Analytics Window Router (Switch v2)
- Data type: string
- Value: `{{ $json.requestedRunType || $json.runType }}`
- Rules:
  - Output 0: `ANALYTICS_24H`
  - Output 1: `ANALYTICS_72H`
  - Output 2: `ANALYTICS_7D`
- Fallback: extra

### 9. Set Window 24h (Code v2)
```javascript
return [{ json: { ...items[0].json, windowHours: 24, windowLabel: '24h', minCtr: items[0].json.analyticsWindow24hMinCtr || 3.2, minRetention: items[0].json.analyticsWindowMinRetention || 30 } }];
```

### 10. Set Window 72h (Code v2)
```javascript
return [{ json: { ...items[0].json, windowHours: 72, windowLabel: '72h', minCtr: items[0].json.analyticsWindow72hMinCtr || 4.0, minRetention: items[0].json.analyticsWindowMinRetention || 30 } }];
```

### 11. Set Window 7d (Code v2)
```javascript
return [{ json: { ...items[0].json, windowHours: 168, windowLabel: '7d', minCtr: items[0].json.analyticsWindow7dMinCtr || 4.5, minRetention: items[0].json.analyticsWindowStrongRetention || 42 } }];
```

### 12. Load Dashboard (Google Sheets v4)
- Document ID: `{{ $json.googleSheetId }}`
- Sheet: `{{ $json.sheetDashboard || 'Dashboard' }}`
- onError: continueRegularOutput

### 13. Evaluate Analytics Window (Code v2)
```javascript
const cfg = $('Validate Config').first().json || {};
const windowHours = Number($json.windowHours || 168);
const windowLabel = $json.windowLabel || '7d';
const minCtr = Number($json.minCtr || 4.0);
const minRetention = Number($json.minRetention || 30);
const repackageCtr = Number(cfg.repackageLowCtrThreshold || 2.9);
const repackageRetention = Number(cfg.repackageLowRetentionThreshold || 26);
const sequelCtr = Number(cfg.sequelStrongCtrThreshold || 5.0);
const sequelRetention = Number(cfg.sequelStrongRetentionThreshold || 38);
const sequelViews = Number(cfg.sequelStrongViewThreshold || 900);
const aggressiveScore = Number(cfg.aggressiveFollowupScore || 8.2);
const aggressiveViews = Number(cfg.aggressiveFollowupViews || 500);

const now = Date.now();
const cutoff = now - windowHours * 3600000;

let rows = [];
try {
  rows = $input.all().map(i => i.json || {}).filter(r => {
    const d = new Date(r.date || r.Date || r.publishedAt || 0).getTime();
    return d && d >= cutoff;
  });
} catch(e) {}

const evaluated = rows.map(r => {
  const title = String(r.title || r.Title || r.longVideoTitle || '');
  const views = Number(r.realViews || r.views || r.Views || 0);
  const ctr = Number(r.thumbCtr || r.ctrPrediction || r.CtrPrediction || 0);
  const retention = Number(r.realAvgRetention || r.avgRetention || r.AvgRetention || 0);
  const score = Number(r.finalBusinessScore || r.cashCowScore || r.score || r.Score || 0);
  const videoId = r.youtubeVideoId || r.youtubeUrl || '';

  let action = 'HOLD';
  const reasons = [];

  if (ctr >= sequelCtr && retention >= sequelRetention && views >= sequelViews) {
    action = 'SEQUEL';
    reasons.push('Strong performer across all metrics');
  } else if (score >= aggressiveScore && views >= aggressiveViews) {
    action = 'AGGRESSIVE_FOLLOWUP';
    reasons.push('High score with decent views');
  } else if (ctr > 0 && ctr < repackageCtr) {
    action = 'REPACKAGE_TITLE_THUMB';
    reasons.push('CTR below threshold');
  } else if (retention > 0 && retention < repackageRetention) {
    action = 'REPACKAGE_HOOK';
    reasons.push('Retention below threshold');
  } else if (views > 0 && ctr >= minCtr && retention >= minRetention) {
    action = 'ON_TRACK';
    reasons.push('Metrics within acceptable range');
  }

  return { title, views, ctr, retention, score, videoId, action, reasons: reasons.join('; '), windowLabel };
});

const actions = {
  sequel: evaluated.filter(e => e.action === 'SEQUEL'),
  aggressiveFollowup: evaluated.filter(e => e.action === 'AGGRESSIVE_FOLLOWUP'),
  repackageTitle: evaluated.filter(e => e.action === 'REPACKAGE_TITLE_THUMB'),
  repackageHook: evaluated.filter(e => e.action === 'REPACKAGE_HOOK'),
  onTrack: evaluated.filter(e => e.action === 'ON_TRACK'),
  hold: evaluated.filter(e => e.action === 'HOLD')
};

const summary = [
  windowLabel + ' Analytics Window: ' + evaluated.length + ' videos evaluated.',
  actions.sequel.length ? 'SEQUEL candidates: ' + actions.sequel.map(e => e.title).join(', ') : '',
  actions.aggressiveFollowup.length ? 'AGGRESSIVE FOLLOWUP: ' + actions.aggressiveFollowup.map(e => e.title).join(', ') : '',
  actions.repackageTitle.length ? 'REPACKAGE (title/thumb): ' + actions.repackageTitle.map(e => e.title).join(', ') : '',
  actions.repackageHook.length ? 'REPACKAGE (hook): ' + actions.repackageHook.map(e => e.title).join(', ') : '',
  actions.onTrack.length ? actions.onTrack.length + ' videos on track.' : '',
  actions.hold.length ? actions.hold.length + ' videos on hold (no real data yet).' : ''
].filter(Boolean).join('\n');

return [{ json: {
  ...cfg,
  windowLabel,
  windowHours,
  videosEvaluated: evaluated.length,
  evaluated,
  actions,
  analyticsSummary: summary,
  analyticsComplete: true,
  timestamp: new Date().toISOString()
} }];
```

### 14. Log Analytics to Sheet (Google Sheets v4)
- Operation: Append
- Document ID: `{{ $('Channel Config').first().json.googleSheetId }}`
- Sheet: `{{ $('Channel Config').first().json.sheetAnalytics || '7-Day Analytics' }}`
- Columns: date, window, videosEvaluated, sequelCandidates, repackageCandidates, onTrack, summary, channelName, workflowPackVersion

### 15. Slack Analytics Report (HTTP Request v4.1)
- POST to `{{ $('Channel Config').first().json.slackWebhook }}`

## Connections
```
Execute Workflow Trigger → Channel Config → Validate Config → Config OK?
Config OK? (TRUE) → Analytics Window Router
Config OK? (FALSE) → Config Fail Log → Log Error → Slack Error
Analytics Window Router (0) → Set Window 24h → Load Dashboard
Analytics Window Router (1) → Set Window 72h → Load Dashboard
Analytics Window Router (2) → Set Window 7d → Load Dashboard
Load Dashboard → Evaluate Analytics Window → Log Analytics to Sheet
                                           → Slack Analytics Report
```
