# Fix: Duplicate Slack Alert in Strategy + Milestones

## Affected Workflow
- Shared Engine Strategy + Milestones v23 Debugged (`T55OUcUfb5gG4RhZ`)

## Problem
The milestone evaluation path has two separate Slack HTTP Request nodes that both fire:

1. `Milestone Slack Alert` (node name) - an HTTP Request node at position [480, 848]
   - Connected FROM: `Evaluate All Milestones`
   - Connected TO: `Slack Milestone Alert` + `Log Milestone to Sheet`

2. `Slack Milestone Alert` (node name) - another HTTP Request node at position [240, 832]
   - Connected FROM: `Milestone Slack Alert` (yes, confusingly)

This means a Slack message is posted TWICE for every milestone check.

## Fix
Remove the `Milestone Slack Alert` node (the one at [480, 848]) and reconnect:

1. `Evaluate All Milestones` → `Slack Milestone Alert` (direct)
2. `Evaluate All Milestones` → `Log Milestone to Sheet` (direct)

OR simply disconnect the `Slack Milestone Alert` node from the `Milestone Slack Alert` chain
so only one Slack post happens per milestone check.
