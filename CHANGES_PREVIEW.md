# Flexible Class Levels - Changes Applied ✓

This document shows all changes that were applied to enable school-defined class levels.

---

## 1. Program Model (`model/Academic/Program.js`)

**Add:** `classLevels` array - ordered list of ClassLevel IDs that define progression for this program.

```diff
     subjects: [
       {
         type: Schema.Types.ObjectId,
         ref: "Subject",
         default: [],
       },
     ],
+    // Ordered list of class levels for this program (e.g. Grade 1→2→3→4 or Level 100→200→300→400)
+    classLevels: [
+      {
+        type: Schema.Types.ObjectId,
+        ref: "ClassLevel",
+      },
+    ],
   },
   { timestamps: true },
 );
```

---

## 2. ClassLevel Model (`model/Academic/ClassLever.js`)

**Add:** `order` field - numeric order for sorting (optional; Program's array order can also define progression).

```diff
     name: {
       type: String,
       required: true,
     },
+    order: {
+      type: Number,
+      default: 0,
+    },
     description: {
       type: String,
     },
```

*Note: `order` helps when displaying levels. The Program's `classLevels` array order defines actual progression for promotion.*

---

## 3. Student Model (`model/Academic/Student.js`)

**Change:** `classLevels` and `currentClassLevel` from String to ObjectId (proper references).
**Remove:** Hardcoded `isPromotedToLevel200`, `isPromotedToLevel300`, `isPromotedToLevel400`.

```diff
-    //Classes are from level 1 to 6
-    //keep track of the class level the student is in
-    classLevels: [
-      {
-        type: String,
-        ref: "ClassLevel",
-      },
-    ],
-    currentClassLevel: {
-      type: String,
-      default: function () {
-        return this.classLevels[this.classLevels.length - 1];
-      },
-    },
+    // History of class levels (ObjectIds). Order = progression path.
+    classLevels: [
+      {
+        type: mongoose.Schema.Types.ObjectId,
+        ref: "ClassLevel",
+      },
+    ],
+    // Current class level (references ClassLevel document)
+    currentClassLevel: {
+      type: mongoose.Schema.Types.ObjectId,
+      ref: "ClassLevel",
+    },
     academicYear: {
       type: mongoose.Schema.Types.ObjectId,
       ref: "AcademicYear",
     },
     ...
-    isPromotedToLevel200: {
-      type: Boolean,
-      default: false,
-    },
-    isPromotedToLevel300: {
-      type: Boolean,
-      default: false,
-    },
-    isPromotedToLevel400: {
-      type: Boolean,
-      default: false,
-    },
     isGraduated: {
       type: Boolean,
       default: false,
     },
```

---

## 4. Programs Controller (`controller/academic/programs.js`)

**Update:** Create and update to accept `classLevels` array.

```diff
-  const { name, description } = req.body;
+  const { name, description, duration, classLevels } = req.body;
   ...
   const programCreated = await Program.create({
     name,
     description,
+    ...(duration && { duration }),
+    ...(classLevels && Array.isArray(classLevels) && { classLevels }),
     createdBy: req.userAuth._id,
   });
```

```diff
-  const { name, description, duration } = req.body;
+  const { name, description, duration, classLevels } = req.body;
   ...
   if (duration !== undefined) updateData.duration = duration;
+  if (classLevels !== undefined && Array.isArray(classLevels))
+    updateData.classLevels = classLevels;
   updateData.updatedBy = req.userAuth._id;
```

---

## 5. Students Controller - Promotion Logic (`controller/students/studentsCtrl.js`)

**Replace:** Hardcoded 100→200→300→400 with dynamic logic based on Program's classLevels.

```diff
-  //promote student to next level
-  if (
-    examFound?.academicTerm?.name === "3rd term" &&
-    status === "Passed" &&
-    studentFound.currentClassLevel === "100"
-  ) {
-    studentFound.classLevels.push("200");
-    studentFound.currentClassLevel = "200";
-    await studentFound.save();
-  } else if (
-    examFound?.academicTerm?.name === "3rd term" &&
-    status === "Passed" &&
-    studentFound.currentClassLevel === "200"
-  ) {
-    studentFound.classLevels.push("300");
-    studentFound.currentClassLevel = "300";
-    await studentFound.save();
-  } else if (
-    examFound?.academicTerm?.name === "3rd term" &&
-    status === "Passed" &&
-    studentFound.currentClassLevel === "300"
-  ) {
-    studentFound.classLevels.push("400");
-    studentFound.currentClassLevel = "400";
-    await studentFound.save();
-  } else {
-    return res.status(200).json({
-      status: "success",
-      message: "Student not promoted to next level",
-    });
-  }
+  // Promote student to next level (dynamic - based on program's classLevels)
+  const shouldAttemptPromotion =
+    examFound?.academicTerm?.name === "3rd term" && status === "Passed";
+
+  if (shouldAttemptPromotion && studentFound.program) {
+    const program = await Program.findById(studentFound.program).populate(
+      "classLevels"
+    );
+    const levels = program?.classLevels || [];
+
+    if (levels.length > 0 && studentFound.currentClassLevel) {
+      const currentLevelId =
+        typeof studentFound.currentClassLevel === "object"
+          ? studentFound.currentClassLevel._id
+          : studentFound.currentClassLevel;
+      const currentIndex = levels.findIndex((l) =>
+        l._id.equals(currentLevelId)
+      );
+      const nextLevel = levels[currentIndex + 1];
+
+      if (nextLevel) {
+        studentFound.classLevels.push(nextLevel._id);
+        studentFound.currentClassLevel = nextLevel._id;
+        await studentFound.save();
+      } else if (currentIndex >= 0 && currentIndex === levels.length - 1) {
+        studentFound.isGraduated = true;
+        await studentFound.save();
+      }
+    }
+  }
```

*Also add `const Program = require("../../model/Academic/Program");` at top of file if not present.*

---

## Summary

| File | Change |
|------|--------|
| `Program.js` | Add `classLevels` array (ordered ObjectIds) |
| `ClassLever.js` | Add `order` field (optional) |
| `Student.js` | `classLevels`/`currentClassLevel` → ObjectId; remove isPromotedToLevel200/300/400 |
| `programs.js` | Accept `classLevels` in create/update |
| `studentsCtrl.js` | Dynamic promotion from Program's classLevels; add Program import |

---

## Migration Note

**Existing data:** Students with `currentClassLevel: "100"` (string) and `classLevels: ["100","200"]` will need migration. New schema expects ObjectIds. You may need to run a one-time script to convert string level names to ClassLevel ObjectIds, or start fresh with the new `lms` database.
