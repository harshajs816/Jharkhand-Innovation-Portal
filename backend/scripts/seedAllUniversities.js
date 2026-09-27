/**
 * seedAllUniversities.js
 * Registers all 6 universities used in the application.
 * Safe to run multiple times — skips existing emails, resets passwords.
 *
 *   node scripts/seedAllUniversities.js
 */

require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const mongoose          = require("mongoose");
const bcrypt            = require("bcryptjs");
const connectDB         = require("../config/db");
const User              = require("../models/User");
const UniversityProfile = require("../models/UniversityModels/UniversityProfile");

// ── University seed data ──────────────────────────────────────────────────────
const UNIVERSITIES = [
  // ── 1. BIT Mesra ────────────────────────────────────────────────────────────
  {
    user: {
      name:     "Dr. Anjali Sharma",
      email:    "anjali@bitmesra.ac.in",
      password: "BITMesra@123",
    },
    profile: {
      universityName:     "BIT Mesra",
      universityCode:     "BITM",
      registrationNumber: "UGC-BITS-1955",
      establishedYear:    1955,
      universityType:     "deemed",
      accreditation:      "NAAC A++",
      website:            "https://www.bitmesra.ac.in",
      contactEmail:       "anjali@bitmesra.ac.in",
      contactPhone:       "+91 6512275444",
      address:            "BIT Mesra, Mesra, Ranchi - 835215",
      city:               "Ranchi",
      district:           "Ranchi",
      state:              "Jharkhand",
      pincode:            "835215",
      description:
        "Birla Institute of Technology Mesra is a premier deemed university offering engineering, science and technology programs. Known for strong IoT, environmental and computer science research.",
    },
  },

  // ── 2. IIT (ISM) Dhanbad ────────────────────────────────────────────────────
  {
    user: {
      name:     "Prof. Rajan Kumar",
      email:    "rajan@iitism.ac.in",
      password: "IITDhanbad@123",
    },
    profile: {
      universityName:     "IIT (ISM) Dhanbad",
      universityCode:     "IITISM",
      registrationNumber: "UGC-IIT-1926",
      establishedYear:    1926,
      universityType:     "central",
      accreditation:      "NAAC A+",
      website:            "https://www.iitism.ac.in",
      contactEmail:       "rajan@iitism.ac.in",
      contactPhone:       "+91 3262235030",
      address:            "IIT (ISM), Dhanbad - 826004",
      city:               "Dhanbad",
      district:           "Dhanbad",
      state:              "Jharkhand",
      pincode:            "826004",
      description:
        "Indian Institute of Technology (ISM) Dhanbad — IIT specialising in mining, electrical and solar energy engineering. Leading research in rural electrification and clean energy.",
    },
  },

  // ── 3. NIT Jamshedpur ───────────────────────────────────────────────────────
  {
    user: {
      name:     "Dr. Suresh Mishra",
      email:    "suresh@nitjsr.ac.in",
      password: "NITJamshedpur@123",
    },
    profile: {
      universityName:     "NIT Jamshedpur",
      universityCode:     "NITJ",
      registrationNumber: "UGC-NIT-1960",
      establishedYear:    1960,
      universityType:     "central",
      accreditation:      "NAAC A",
      website:            "https://www.nitjsr.ac.in",
      contactEmail:       "suresh@nitjsr.ac.in",
      contactPhone:       "+91 6572374000",
      address:            "NIT Campus, Adityapur, Jamshedpur - 831014",
      city:               "Jamshedpur",
      district:           "East Singhbhum",
      state:              "Jharkhand",
      pincode:            "831014",
      description:
        "National Institute of Technology Jamshedpur — excellence in civil, sanitation and structural engineering. Key research areas include ODF implementation and community toilet design.",
    },
  },

  // ── 4. BAU Ranchi ───────────────────────────────────────────────────────────
  {
    user: {
      name:     "Dr. Meena Tigga",
      email:    "meena@bauranchi.ac.in",
      password: "BAURanchi@123",
    },
    profile: {
      universityName:     "BAU Ranchi",
      universityCode:     "BAUR",
      registrationNumber: "UGC-BAU-1980",
      establishedYear:    1980,
      universityType:     "state",
      accreditation:      "NAAC B+",
      website:            "https://www.bauranchi.ac.in",
      contactEmail:       "meena@bauranchi.ac.in",
      contactPhone:       "+91 6512450066",
      address:            "Birsa Agricultural University, Kanke, Ranchi - 834006",
      city:               "Ranchi",
      district:           "Ranchi",
      state:              "Jharkhand",
      pincode:            "834006",
      description:
        "Birsa Agricultural University Ranchi — leading agricultural sciences university in Jharkhand. Specialises in smart irrigation, soil health monitoring and climate-resilient agriculture.",
    },
  },

  // ── 5. Ranchi University ────────────────────────────────────────────────────
  {
    user: {
      name:     "Prof. Arvind Singh",
      email:    "arvind@ranchiuniversity.ac.in",
      password: "RanchiUniv@123",
    },
    profile: {
      universityName:     "Ranchi University",
      universityCode:     "RU",
      registrationNumber: "UGC-RU-1960",
      establishedYear:    1960,
      universityType:     "state",
      accreditation:      "NAAC B+",
      website:            "https://www.ranchiuniversity.ac.in",
      contactEmail:       "arvind@ranchiuniversity.ac.in",
      contactPhone:       "+91 6512204240",
      address:            "Ranchi University, Ranchi - 834008",
      city:               "Ranchi",
      district:           "Ranchi",
      state:              "Jharkhand",
      pincode:            "834008",
      description:
        "Ranchi University — state university focusing on social sciences, tribal welfare and rural livelihoods. Active research in rural education, community health and gender inclusion.",
    },
  },

  // ── 6. XLRI Jamshedpur ──────────────────────────────────────────────────────
  {
    user: {
      name:     "Dr. Priya Thomas",
      email:    "priya@xlri.ac.in",
      password: "XLRI@123",
    },
    profile: {
      universityName:     "XLRI Jamshedpur",
      universityCode:     "XLRI",
      registrationNumber: "UGC-XLRI-1949",
      establishedYear:    1949,
      universityType:     "deemed",
      accreditation:      "NAAC A+",
      website:            "https://www.xlri.ac.in",
      contactEmail:       "priya@xlri.ac.in",
      contactPhone:       "+91 6572398000",
      address:            "XLRI C.H. Area (East), Jamshedpur - 831001",
      city:               "Jamshedpur",
      district:           "East Singhbhum",
      state:              "Jharkhand",
      pincode:            "831001",
      description:
        "XLRI Jamshedpur — premier management institution focused on social innovation, CSR and behaviour change communication. Research in social impact measurement and industry-NGO partnerships.",
    },
  },
];

// ── Main ──────────────────────────────────────────────────────────────────────
async function seed() {
  await connectDB();
  console.log("\n🌱  Seeding universities...\n");

  const results = [];

  for (const entry of UNIVERSITIES) {
    const { user: userData, profile: profileData } = entry;

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hash = await bcrypt.hash(userData.password, salt);

    // Upsert user (update if email exists, create otherwise)
    let user = await User.findOne({ email: userData.email });

    if (user) {
      // Reset password and ensure active
      await User.updateOne(
        { _id: user._id },
        { password: hash, isActive: true, name: userData.name }
      );
      results.push({ status: "UPDATED", ...userData, universityName: profileData.universityName });
    } else {
      user = await User.create({
        name:     userData.name,
        email:    userData.email,
        password: hash,
        role:     "university",
        isActive: true,
      });
      results.push({ status: "CREATED", ...userData, universityName: profileData.universityName });
    }

    // Upsert profile
    const existing = await UniversityProfile.findOne({ userId: user._id });
    if (existing) {
      // Update key fields but keep existing data intact
      await UniversityProfile.updateOne(
        { userId: user._id },
        {
          $set: {
            universityName:  profileData.universityName,
            universityCode:  profileData.universityCode,
            universityType:  profileData.universityType,
            accreditation:   profileData.accreditation,
            city:            profileData.city,
            district:        profileData.district,
            state:           profileData.state,
            contactEmail:    profileData.contactEmail,
          },
        }
      );
    } else {
      await UniversityProfile.create({ userId: user._id, ...profileData });
    }
  }

  // ── Print credentials table ───────────────────────────────────────────────
  console.log("╔══════════════════════════════════════════════════════════════════════════╗");
  console.log("║              UNIVERSITY LOGIN CREDENTIALS                               ║");
  console.log("╠══════════════════════════════════════════════════════════════════════════╣");

  results.forEach((r) => {
    console.log(`║  [${r.status}]`);
    console.log(`║  University : ${r.universityName}`);
    console.log(`║  Email      : ${r.email}`);
    console.log(`║  Password   : ${r.password}`);
    console.log("║  ─────────────────────────────────────────────────────────────────────");
  });

  console.log("╚══════════════════════════════════════════════════════════════════════════╝");
  console.log("\n✅  All done! Use /university/login to sign in.\n");

  process.exit(0);
}

seed().catch((e) => {
  console.error("❌  Seed failed:", e.message);
  process.exit(1);
});
