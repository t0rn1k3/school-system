#!/usr/bin/env node
/**
 * Migration: Convert flat criteria to learningOutcomes for existing modules.
 * Run: node scripts/migrateCriteriaToLearningOutcomes.js
 *
 * For each module that has criteria but no learningOutcomes:
 * - Creates one default Learning Outcome ("საერთო კრიტერიუმები")
 * - Moves all existing criteria into that LO
 * - Sets learningOutcomes: [defaultLO]
 */

require("dotenv").config();
const mongoose = require("mongoose");
const Module = require("../model/Academic/Module");
const { migrateCriteriaToLearningOutcomes } = require("../utils/learningOutcomesUtils");

const MONGODB_URI = process.env.DATABASE_URL || process.env.MONGO_URL || "mongodb://localhost:27017/school";

async function run() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    const modules = await Module.find({
      isDeleted: { $ne: true },
      $or: [
        { learningOutcomes: { $exists: false } },
        { learningOutcomes: { $size: 0 } },
      ],
      criteria: { $exists: true, $ne: [] },
    });

    console.log(`Found ${modules.length} module(s) with flat criteria to migrate`);

    let migrated = 0;
    for (const mod of modules) {
      const criteria = mod.criteria || [];
      if (criteria.length === 0) continue;

      const learningOutcomes = migrateCriteriaToLearningOutcomes(criteria);
      await Module.findByIdAndUpdate(mod._id, {
        learningOutcomes,
      });
      migrated++;
      console.log(`  Migrated: ${mod.name} (${criteria.length} criteria → 1 LO)`);
    }

    console.log(`Done. Migrated ${migrated} module(s).`);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

run();
