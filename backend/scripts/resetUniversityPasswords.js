/**
 * resetUniversityPasswords.js
 * Resets passwords for all 6 university accounts using simple,
 * PowerShell-safe passwords (no special characters).
 *
 *   node scripts/resetUniversityPasswords.js
 */

require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const mongoose  = require("mongoose");
const bcrypt    = require("bcryptjs");
const connectDB = require("../config/db");

// ── Simple passwords — no @ or special chars to avoid PowerShell issues ──────
const ACCOUNTS = [
  { email: "anjali@bitmesra.ac.in",           password: "bitmesra2026",    university: "BIT Mesra"          },
  { email: "rajan@iitism.ac.in",              password: "iitism2026",      university: "IIT (ISM) Dhanbad"  },
  { email: "suresh@nitjsr.ac.in",             password: "nitjsr2026",      university: "NIT Jamshedpur"     },
  { email: "meena@bauranchi.ac.in",           password: "bauranchi2026",   university: "BAU Ranchi"         },
  { email: "arvind@ranchiuniversity.ac.in",   password: "ranchiuniv2026",  university: "Ranchi University"  },
  { email: "priya@xlri.ac.in",               password: "xlri2026",        university: "XLRI Jamshedpur"    },
];

async function run() {
  await connectDB();
  console.log("\n🔑  Resetting university passwords...\n");

  const db = mongoose.connection.db;

  for (const acc of ACCOUNTS) {
    const user = await db.collection("users").findOne({ email: acc.email });
    if (!user) {
      console.log("NOT FOUND:", acc.email);
      continue;
    }

    const salt = await bcrypt.genSalt(12);
    const hash = await bcrypt.hash(acc.password, salt);

    await db.collection("users").updateOne(
      { _id: user._id },
      { $set: { password: hash, isActive: true } }
    );

    // Verify immediately
    const ok = await bcrypt.compare(acc.password, hash);
    console.log(ok ? "✅ RESET OK" : "❌ HASH MISMATCH", "-", acc.university);
    console.log("   Email   :", acc.email);
    console.log("   Password:", acc.password);
    console.log("");
  }

  console.log("═".repeat(55));
  console.log("  ALL UNIVERSITY LOGIN CREDENTIALS");
  console.log("═".repeat(55));
  ACCOUNTS.forEach(a => {
    console.log(`  ${a.university.padEnd(22)} ${a.email}`);
    console.log(`  ${"Password:".padEnd(22)} ${a.password}`);
    console.log("  " + "─".repeat(51));
  });
  console.log("\n  Login URL: http://localhost:5173/university/login\n");

  process.exit(0);
}

run().catch(e => { console.error("Error:", e.message); process.exit(1); });
