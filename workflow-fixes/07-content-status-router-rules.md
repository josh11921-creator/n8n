# Fix: Status Router Switch Node Rules

## Affected Workflow
- Shared Engine Content + Publish v24 Maxed (`ibRVaAvwiWiAGQ5x`) - "Status Router" node

## Problem
The Status Router Switch node has 7 rules but all are empty `{}`. No routing by status works.

## Fix
Open the Switch node and set `value2` for each rule:

| Output Index | Rule value2 | Routes To |
|---|---|---|
| 0 | `READY_TO_RENDER` | Render or Shorts Only? |
| 1 | `TRUTH_GATE_FAILED` | Log Skip |
| 2 | `VALIDATION_FAILED` | Log Error |
| 3 | `PARSE_FAILED` | Log Error |
| 4 | `RENDER_FAILED` | Render Failed → Error |
| 5 | `CONFIG_FAILED` | Log Error |
| 6 | `DUPLICATE_TOPIC` | Log Skip |

The fallback output should also route to Log Error.
