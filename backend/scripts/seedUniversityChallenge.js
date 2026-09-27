/**
 * seedUniversityChallenge.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Creates 1 mock challenge in the University Challenge model.
 * The challenge is assigned to the university whose email you pass as argument.
 *
 * Usage:
 *   node scripts/seedUniversityChallenge.js anjali@bitmesra.ac.in
 *
 * Or without argument — defaults to the first university user found in DB.
 * ─────────────────────────────────────────────────────────────────────────────
 */

require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const mongoose          = require("mongoose");
const connectDB         = require("../config/db");
const Challenge         = require("../models/UniversityModels/Challenge");
const User              = require("../models/User");
const UniversityProfile = require("../models/UniversityModels/UniversityProfile");

async function seed() {
  try {
    await connectDB();
    console.log("🌱  Connected to MongoDB …");

    // ── Find target university ─────────────────────────────────────────────
    const email = process.argv[2];            // optional CLI arg
    let universityName = "BIT Mesra";         // fallback default

    if (email) {
      const user = await User.findOne({ email: email.trim().toLowerCase(), role: "university" });
      if (!user) {
        console.error(`❌  No university user found with email: ${email}`);
        process.exit(1);
      }
      const profile = await UniversityProfile.findOne({ userId: user._id });
      if (!profile) {
        console.error(`❌  No UniversityProfile found for ${email}. Register first.`);
        process.exit(1);
      }
      universityName = profile.universityName;
      console.log(`✅  Found university: ${universityName}`);
    } else {
      // Find first university in DB
      const firstUni = await User.findOne({ role: "university" });
      if (firstUni) {
        const profile = await UniversityProfile.findOne({ userId: firstUni._id });
        if (profile) universityName = profile.universityName;
      }
      console.log(`ℹ️   No email arg given. Using: "${universityName}"`);
    }

    // ── Check for existing challenge ───────────────────────────────────────
    const exists = await Challenge.findOne({
      assignedUniversity: universityName,
      title: "Smart Water Quality Monitoring System for Ranchi Urban Wards",
    });
    if (exists) {
      console.log(`⚠️   Challenge already exists (id: ${exists._id}). Skipping.`);
      process.exit(0);
    }

    // ── Create the mock challenge ──────────────────────────────────────────
    const challenge = await Challenge.create({
      title: "Smart Water Quality Monitoring System for Ranchi Urban Wards",

      description:
        "Groundwater contamination with heavy metals (Arsenic, Lead, Fluoride) has been " +
        "detected in 12 wards of Ranchi city. Over 45,000 residents rely on these sources " +
        "for daily drinking water. Existing manual testing is infrequent (quarterly) and " +
        "fails to capture real-time contamination events caused by industrial discharge and " +
        "monsoon runoff. The Jharkhand Urban Infrastructure Development Authority (JUIDA) " +
        "requires a technology-driven solution that provides continuous, automated monitoring " +
        "with citizen-facing alerts. The solution must be scalable to 50+ monitoring points " +
        "within 18 months and integrate with the state's existing GIS infrastructure.",

      category: "Water",
      district: "Ranchi",
      priority: "high",
      assignedUniversity: universityName,
      status: "assigned",

      deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
    });

    // ── Print result ──────────────────────────────────────────────────────
    console.log("\n✅  Mock challenge created successfully!");
    console.log("─".repeat(60));
    console.log(`  ID          : ${challenge._id}`);
    console.log(`  Title       : ${challenge.title}`);
    console.log(`  Category    : ${challenge.category}`);
    console.log(`  District    : ${challenge.district}`);
    console.log(`  Priority    : ${challenge.priority}`);
    console.log(`  Status      : ${challenge.status}`);
    console.log(`  Assigned to : ${challenge.assignedUniversity}`);
    console.log(`  Deadline    : ${challenge.deadline.toDateString()}`);
    console.log("─".repeat(60));
    console.log("\nLog in to the university dashboard to accept or reject this challenge.");

    process.exit(0);
  } catch (err) {
    console.error("❌  Seed failed:", err.message);
    process.exit(1);
  }
}

seed();
