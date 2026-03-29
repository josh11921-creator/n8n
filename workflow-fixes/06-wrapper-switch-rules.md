# Fix: Run Type Router Switch Node Rules

## Affected Workflows
- Local Stack AI v24 Wrapper (`D2wqVr1AEI8Fiwo8`) - "Run Type Router" node
- Lead Systems v24 Wrapper (`M8EMulezJ9dhESuM`) - "Run Type Router" node

## Problem
Both Switch nodes have 8 rules but all are empty `{}`. The `value2` field is missing, so no routing happens.

## Fix
Open each Switch node and set the `value2` for each rule:

| Output Index | Rule value2 | Routes To |
|---|---|---|
| 0 | `SETUP_AUDIT` | Return Setup Audit |
| 1 | `CONTENT_DAILY` | Run Shared Content Engine |
| 2 | `DRAFT_MINING` | Run Shared Content Engine |
| 3 | `ANALYTICS_24H` | Run Shared Analytics Engine |
| 4 | `ANALYTICS_72H` | Run Shared Analytics Engine |
| 5 | `ANALYTICS_7D` | Run Shared Analytics Engine |
| 6 | `WEEKLY_STRATEGY` | Run Shared Strategy Engine |
| 7 | `MILESTONE_CHECK` | Run Shared Strategy Engine |

The fallback output should go to "Skip Unsupported Run" (already connected).
