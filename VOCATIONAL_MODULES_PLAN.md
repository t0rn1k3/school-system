# Vocational Schools: Modules, Criteria & Auto-Graduation Plan

## Overview

Georgian vocational schools use **modules** (e.g. HTML/CSS, JavaScript) with **criteria** (checklist). A student must pass **all criteria** in a module to pass it. Graduation happens when all modules in the program are passed.

---

## 1. Data Model

### 1.1 Module (new)

A module is a unit within a program (e.g. "HTML/CSS", "JavaScript", "React").

```
Module:
  - name (String)
  - description (String)
  - program (ref Program)
  - criteria (Array of { id, name, description })
  - order (Number) - for display order
  - createdBy (ref Admin)
```

**Example criteria for HTML/CSS module:**
- "Creates semantic HTML structure"
- "Uses CSS Grid/Flexbox correctly"
- "Implements responsive design"
- "Follows accessibility basics"

### 1.2 Program (update)

Add `modules` array (ordered list of Module refs). Keep `subjects` for backward compatibility or migrate to modules.

```
Program:
  - modules: [ref Module]  // ordered, defines what student must complete
  - ...existing fields
```

### 1.3 Exam (update)

Link Exam to **Module** (in addition to or instead of Subject for vocational).

```
Exam:
  - module (ref Module) - optional, for vocational
  - subject (ref Subject) - optional, keep for compatibility
  - passCriteriaType: "percentage" | "all-criteria"
    - "percentage" = current behaviour (score >= passMark%)
    - "all-criteria" = all criteria must be passed
  - ...existing fields
```

### 1.4 ExamResult (update)

Store per-criterion results when `passCriteriaType === "all-criteria"`.

```
ExamResult:
  - criterionResults: [{
      criterionId: String,
      criterionName: String,
      passed: Boolean,
      notes: String (optional)
    }]
  - For "all-criteria": status = Passed if ALL criterionResults.passed === true
  - ...existing fields (score, grade, submittedFile, etc.)
```

---

## 2. API & Flow

### 2.1 Module CRUD

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/modules` | POST | Create module (program, name, criteria) |
| `/api/v1/modules` | GET | List modules (filter by program) |
| `/api/v1/modules/:id` | GET | Get single module |
| `/api/v1/modules/:id` | PUT | Update module (criteria, name, etc.) |
| `/api/v1/modules/:id` | DELETE | Soft delete module |

### 2.2 Exam creation (update)

When creating exam for vocational:
- Select **module** (instead of or in addition to subject)
- Set `passCriteriaType`: "all-criteria" for criterion-based modules, "percentage" for theory quizzes
- If "all-criteria", criteria come from the module

### 2.3 Student takes exam

- **Quiz**: Same as now (questions, answers)
- **Project**: Same as now (upload ZIP)

### 2.4 Teacher grades (update)

**For project-submission + all-criteria:**
- `PUT /api/v1/teachers/exam-results/:id/grade-project` — **extend** to accept:
  ```json
  {
    "criterionResults": [
      { "criterionId": "c1", "criterionName": "Semantic HTML", "passed": true },
      { "criterionId": "c2", "criterionName": "CSS Grid", "passed": false },
      ...
    ]
  }
  ```
- If any `passed: false` → status = "Failed"
- If all `passed: true` → status = "Passed"

**For quiz + percentage:** Keep current logic.

### 2.5 Automatic graduation

**Rule:** Student graduates when they have **Passed** results for **all modules** in their program.

**When to check:**
- After a teacher publishes an exam result (student passed)
- Optionally: cron job or on-demand endpoint

**Logic:**
1. Get student's program
2. Get program's modules
3. For each module: find latest ExamResult where exam.module = that module, status = "Passed"
4. If all modules have at least one Passed result → set `student.isGraduated = true`, `student.yearGraduated = current year`

**Edge case:** One module might have multiple exams (e.g. quiz + project). Rule: module is passed if **any** exam for that module is passed? Or **all** exams for that module? — *Assume: module passed = at least one passed exam for that module.*

---

## 3. Implementation Phases

### Phase 3a: Module & Criteria
1. Create `Module` model with `criteria` array
2. Add `modules` to Program
3. Module CRUD API (routes, controller)
4. Update Exam: add `module` ref, `passCriteriaType`

### Phase 3b: Criterion-based grading
1. Update ExamResult: add `criterionResults`
2. Extend `grade-project`: accept `criterionResults`, compute status from all-criteria
3. For Quiz with all-criteria: either map questions to criteria, or use percentage for now

### Phase 3c: Automatic graduation
1. Add `checkAndGraduateStudent(studentId)` helper
2. Call it when teacher publishes exam result (if Passed)
3. Optional: `GET /api/v1/students/:id/graduation-status` for preview

---

## 4. Frontend Impact

- **Module management:** Create/edit modules with criteria list
- **Exam form:** Select module, set passCriteriaType
- **Grade project form:** Checklist of criteria, teacher marks each pass/fail
- **Student progress:** Show which modules passed, which pending
- **Graduation:** Show "Eligible for graduation" when all modules passed

---

## 5. Migration Notes

- Existing exams use `subject`; new vocational exams use `module`
- Programs can have both `subjects` and `modules` during transition
- Graduation only considers modules; if program has no modules yet, fall back to manual graduation

---

## 6. Simplified Criterion ID

Criteria can use simple IDs like `c1`, `c2` or Mongo ObjectIds. Store in Module as:
```javascript
criteria: [
  { id: "c1", name: "Creates semantic HTML", description: "..." },
  { id: "c2", name: "Uses CSS Grid", description: "..." }
]
```
