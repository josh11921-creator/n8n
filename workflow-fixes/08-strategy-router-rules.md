# Fix: Strategy Run Router Switch Node Rules

## Affected Workflow
- Shared Engine Strategy + Milestones v23 Debugged (`T55OUcUfb5gG4RhZ`) - "Strategy Run Router" node

## Problem
The Strategy Run Router Switch node has 2 rules but both are empty `{}`.

## Fix
Open the Switch node and set `value2` for each rule:

| Output Index | Rule value2 | Routes To |
|---|---|---|
| 0 | `WEEKLY_STRATEGY` | Weekly Strategy Config |
| 1 | `MILESTONE_CHECK` | Milestone Config |

The fallback output should be disconnected or route to a "skip unsupported" handler.
