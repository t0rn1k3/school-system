# weeklyOverrides — Backend Specification

## Sum validation

- **Rule:** `sum(weeklyOverrides) === contactHours + assessmentHours`
- **Tolerance:** `Math.abs(sum - expected) < 0.01` (floating point)
- **Excluded:** `independentHours` are not part of the expected sum

## Week range

- **Valid weeks:** `startWeek` to `startWeek + durationWeeks - 1` (inclusive)
- **Sum:** Only weeks in this range are counted. Extra weeks in the payload are **ignored** (not rejected).
- **Storage:** Only weeks in range are stored. Extra weeks are filtered out before save.
- **Frontend:** Filter to module range before sending to avoid sending irrelevant data. Backend will ignore extras anyway.

## Merge behavior

| Context | Behavior |
|---------|----------|
| **Create** | Payload is the complete set, or we auto-generate. Stored filtered to range. |
| **Update** | **MERGE.** Incoming weeks overwrite; weeks not in payload keep existing values. Validation runs on the **final merged** object. Stored filtered to range. |
| **PUT /curriculum** | Same merge as module update. Validates merged, filters to range, saves. |

## Key format

- **JSON:** Keys are always strings (`"7"`, `"8"`, etc.)
- **Backend:** Accepts both string and numeric week keys; normalizes via `String(k)` and `parseInt(String(k), 10)`
- **Values:** Parsed as numbers. `""`, `null`, `undefined` → `0`

## Error responses

| Condition | messageKey |
|-----------|------------|
| Sum ≠ contactHours + assessmentHours | `module.weekly_hours_invalid` |
| Other module validation | `module.validation` |
| Learning outcomes required | `module.learning_outcome_required` |
| Module not found | `module.not_found` |
| Program not found | `module.program_not_found` |

## Logging

On sum validation failure, the backend logs:

- `contactHours`, `assessmentHours`
- `expected` (contact + assessment)
- `computedSum`
- `startWeek`, `endWeek`
- `weeklyOverridesKeys` (list of keys in payload)
