# Frontend: Curriculum Page — Implementation Prompt

Implement the Program Curriculum page for vocational program planning. The page shows a table of modules with weekly hours per week column (W1, W2, … Wn). Admins can view, update, and reset the curriculum.

---

## API Endpoints

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/v1/programs/:id/curriculum` | Teacher, Admin | Fetch curriculum with modules and weekly hours |
| PUT | `/api/v1/programs/:id/curriculum` | Admin only | Update curriculum (program settings + module weekly overrides) |
| DELETE | `/api/v1/programs/:id/curriculum` | Admin only | Reset curriculum (clear custom overrides, redistribute hours) |
| PUT | `/api/v1/modules/:id` | Admin only | Update a single module (e.g. `weeklyOverrides`) |

---

## GET Curriculum Response

```json
{
  "status": "success",
  "message": "Curriculum fetched successfully",
  "data": {
    "program": {
      "_id": "...",
      "name": "Front-end Development",
      "description": "...",
      "durationWeeks": 32,
      "startDate": "2024-09-01T00:00:00.000Z",
      "holidays": ["2024-12-25", "2025-01-01"]
    },
    "modules": [
      {
        "_id": "...",
        "name": "HTML/CSS",
        "contactHours": 60,
        "assessmentHours": 20,
        "durationWeeks": 6,
        "startWeek": 7,
        "effectiveWeeklyHours": { "7": 10, "8": 10, "9": 10, "10": 10, "11": 10, "12": 10 }
      }
    ],
    "totalWeeks": 32,
    "weekLabels": ["01.09.2024 - 07.09.2024", ...]
  }
}
```

- `effectiveWeeklyHours`: All weeks in the module's range (`startWeek` to `startWeek + durationWeeks - 1`). Empty cells have `0`. Always render an `<input>` for every cell so the user can add hours manually.

---

## PUT Curriculum Request

```json
{
  "durationWeeks": 32,
  "startDate": "2024-09-01",
  "holidays": ["2024-12-25", "2025-01-01"],
  "modules": [
    {
      "moduleId": "<module _id>",
      "weeklyOverrides": { "7": 10, "8": 10, "9": 10, "10": 0, "11": 0, "12": 0 }
    }
  ]
}
```

- All fields optional. Omit `modules` to update only program settings.
- `weeklyOverrides` merges with existing (incoming weeks overwrite).

---

## DELETE Curriculum

No body. Resets all module `weeklyOverrides` to an even distribution based on `contactHours + assessmentHours`. Returns the same structure as GET.

---

## Weekly Hours Table UI

1. **Columns**: One per week (1 to `totalWeeks`). Use `weekLabels` for headers if available, or `W1`, `W2`, etc.
2. **Rows**: One per module. For each module, show `effectiveWeeklyHours[week]` for weeks in that module's range (`startWeek` … `startWeek + durationWeeks - 1`).
3. **Editable cells**: Use `<input type="number" min="0">` for every cell—both filled and empty (`0` or `""`). Never use `<span>` for empty cells.
4. **Validation**: Sum of weekly hours per module must equal `contactHours + assessmentHours`. Show `module.weekly_hours_invalid` when the API returns this error.
5. **Week range**: Only send weeks in the module's range (`startWeek` to `startWeek + durationWeeks - 1`). Backend ignores extra weeks and filters stored data to range. See **docs/WEEKLY_OVERRIDES_SPEC.md**.

---

## Error Handling (i18n)

Use `messageKey` from API error responses to show translated messages. See **docs/CURRICULUM_PAGE_ERROR_TRANSLATIONS.md** for the full map (ka/en).

---

## Done Criteria

- [ ] Curriculum page loads via GET, displays program info, modules, and weekly hours table
- [ ] Every week cell is an editable input (including empty ones)
- [ ] Admin can update curriculum via PUT (program settings and/or module overrides)
- [ ] Admin can reset curriculum via DELETE with confirmation
- [ ] API errors shown using `messageKey` translations (Georgian/English)
- [ ] Optional: optimistic UI or debounced save when editing cells
