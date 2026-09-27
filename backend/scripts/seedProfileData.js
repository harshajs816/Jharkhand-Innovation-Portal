/**
 * seedProfileData.js
 * Seeds Faculty Expertise, Research Areas, Labs, Innovation Centres,
 * Incubation Facilities, and Available Technologies for IET Khandari
 * — all aligned with the Water Quality Monitoring challenge.
 *
 * Usage:
 *   node scripts/seedProfileData.js
 */

require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const connectDB         = require("../config/db");
const UniversityProfile = require("../models/UniversityModels/UniversityProfile");
const User              = require("../models/User");

async function seed() {
  await connectDB();

  const user = await User.findOne({ role: "university" });
  if (!user) { console.error("No university user found."); process.exit(1); }

  const profile = await UniversityProfile.findOne({ userId: user._id });
  if (!profile) { console.error("No UniversityProfile found."); process.exit(1); }

  console.log(`Seeding profile for: ${profile.universityName}`);

  // ── Faculty Expertise ──────────────────────────────────────────────────────
  profile.facultyExpertise = [
    {
      area:        "Water Quality Analysis & Remediation",
      facultyName: "Dr. Priya Sharma",
      department:  "Civil & Environmental Engineering",
    },
    {
      area:        "IoT Sensor Networks & Embedded Systems",
      facultyName: "Prof. Anil Kumar Gupta",
      department:  "Electronics & Communication Engineering",
    },
    {
      area:        "Machine Learning for Environmental Data",
      facultyName: "Dr. Sunita Verma",
      department:  "Computer Science & Engineering",
    },
    {
      area:        "Groundwater Hydrology & Contamination Modelling",
      facultyName: "Dr. Rajesh Pandey",
      department:  "Civil Engineering",
    },
    {
      area:        "Heavy Metal Detection & Spectroscopy",
      facultyName: "Prof. Kavita Singh",
      department:  "Applied Chemistry",
    },
    {
      area:        "GIS & Remote Sensing for Urban Infrastructure",
      facultyName: "Dr. Manish Tiwari",
      department:  "Civil Engineering",
    },
    {
      area:        "Public Health & Epidemiology",
      facultyName: "Dr. Anjali Mishra",
      department:  "Biotechnology",
    },
  ];

  // ── Research Areas ─────────────────────────────────────────────────────────
  profile.researchAreas = [
    {
      name:        "Real-Time Water Quality Monitoring using IoT",
      description: "Development of low-cost wireless sensor nodes for continuous monitoring of pH, turbidity, TDS, heavy metals (As, Pb, F) in urban water distribution networks.",
    },
    {
      name:        "Arsenic & Fluoride Removal Technologies",
      description: "Research on bio-sorbents, nano-composite filters, and electrocoagulation methods for effective removal of arsenic and fluoride from groundwater.",
    },
    {
      name:        "AI-based Predictive Analytics for Contamination Events",
      description: "Using LSTM and anomaly detection models to predict contamination spikes caused by industrial discharge or monsoon runoff using historical sensor data.",
    },
    {
      name:        "Community-Driven Environmental Surveillance",
      description: "Participatory sensing models where citizens report water quality issues via mobile apps integrated with lab-verified sensor data.",
    },
    {
      name:        "GIS-based Groundwater Contamination Mapping",
      description: "Spatial analysis of heavy metal spread patterns in Ranchi's groundwater using GIS and geostatistical interpolation techniques.",
    },
  ];

  // ── Labs ───────────────────────────────────────────────────────────────────
  profile.labs = [
    {
      name:        "Environmental Analysis & Water Testing Lab",
      department:  "Civil & Environmental Engineering",
      incharge:    "Dr. Priya Sharma",
      equipment:   "Atomic Absorption Spectrophotometer (AAS), ICP-MS, BOD Incubator, Turbidity Meter, pH Meter, TDS Analyzer, Fluoride Ion Meter",
      description: "Fully equipped for chemical, biological and heavy metal analysis of water samples. Capable of testing Arsenic, Lead, Fluoride, Nitrate, Coliform and 20+ parameters.",
    },
    {
      name:        "IoT & Embedded Systems Lab",
      department:  "Electronics & Communication Engineering",
      incharge:    "Prof. Anil Kumar Gupta",
      equipment:   "Arduino/Raspberry Pi nodes, ESP32 modules, LoRa transceivers, water quality sensor kits (pH, TDS, turbidity, DO), 3D Printer, Oscilloscopes",
      description: "Prototyping lab for IoT-based remote monitoring systems. Students build end-to-end sensor networks including hardware design, firmware and cloud dashboard.",
    },
    {
      name:        "AI & Data Science Research Lab",
      department:  "Computer Science & Engineering",
      incharge:    "Dr. Sunita Verma",
      equipment:   "GPU Cluster (NVIDIA RTX 3090 ×4), High-performance computing servers, Python/TensorFlow/PyTorch setup",
      description: "Focused on machine learning, time-series forecasting, anomaly detection and NLP. Active projects include water quality prediction and smart city dashboards.",
    },
    {
      name:        "Geotechnical & Hydrology Lab",
      department:  "Civil Engineering",
      incharge:    "Dr. Rajesh Pandey",
      equipment:   "Permeameter, Consolidometer, Hydrometer, Water sampling equipment, Groundwater level sensors, Soil testing kit",
      description: "Supports research in groundwater behaviour, soil-water interaction and aquifer characterisation for contamination spread modelling.",
    },
    {
      name:        "GIS & Remote Sensing Studio",
      department:  "Civil Engineering",
      incharge:    "Dr. Manish Tiwari",
      equipment:   "ArcGIS Pro workstations, QGIS, ERDAS Imagine, Drone (DJI Phantom 4 RTK), GPS survey equipment",
      description: "Used for spatial analysis, urban mapping, and satellite image processing — directly applied to contamination zone mapping in Ranchi wards.",
    },
  ];

  // ── Innovation Centres ─────────────────────────────────────────────────────
  profile.innovationCentres = [
    {
      name:        "Centre for Smart Infrastructure & Urban Technology (CSIUT)",
      description: "Focuses on developing affordable technology solutions for urban civic challenges — water, sanitation, energy, and waste management. Hosts student-faculty joint projects and government-sponsored research.",
    },
    {
      name:        "IET Clean Technology Innovation Hub",
      description: "A collaborative space for environmental engineering and clean-tech innovation. Partners with Jharkhand Urban Infrastructure Development Authority (JUIDA) for field deployments.",
    },
    {
      name:        "Centre for IoT & Cyber-Physical Systems (CIoTCPS)",
      description: "End-to-end IoT product development — from sensor design to cloud platform integration. Currently developing a multi-parameter water quality monitoring module for pilot in Ranchi.",
    },
  ];

  // ── Incubation Facilities ──────────────────────────────────────────────────
  profile.incubationFacilities = [
    {
      name:        "IET Khandari Technology Business Incubator (KTBI)",
      established: 2019,
      focus:       "CleanTech, WaterTech, AgriTech, IoT Startups",
      capacity:    15,
      description: "MSME-recognised incubator supporting early-stage deeptech startups from ideation to MVP. Provides lab access, mentorship, seed funding connections, and DPIIT recognition support. Current cohort includes 2 water-tech startups.",
    },
    {
      name:        "Student Innovation & Entrepreneurship Cell (SIEC)",
      established: 2021,
      focus:       "Social Innovation, Civic Tech, Environmental Solutions",
      capacity:    25,
      description: "Pre-incubation cell for student-led ideas. Supports hackathon teams, provides small prototyping grants up to ₹50,000, and connects promising ideas to KTBI for scaling.",
    },
  ];

  // ── Available Technologies ─────────────────────────────────────────────────
  profile.availableTechnologies = [
    {
      name:        "Low-Cost Multi-Parameter Water Sensor Node (WaterNode v2.0)",
      category:    "IoT / Hardware",
      description: "ESP32-based wireless sensor node measuring pH, TDS, turbidity, dissolved oxygen and temperature. LoRa-enabled for long-range transmission. Battery + solar powered. Field-tested for 6 months in Ranchi pilot.",
      patented:    true,
    },
    {
      name:        "HeavyMetalDetect — Electrochemical Arsenic & Lead Sensor",
      category:    "Analytical Chemistry / Hardware",
      description: "Low-cost screen-printed electrode-based electrochemical sensor for on-site detection of Arsenic (ppb level) and Lead in water without laboratory equipment. Developed in-house.",
      patented:    true,
    },
    {
      name:        "AquaPredict — ML Model for Contamination Forecasting",
      category:    "AI / Software",
      description: "LSTM-based time-series model trained on 3-year Ranchi groundwater data. Predicts heavy metal concentration spikes 48 hours in advance with 87% accuracy. Available as REST API.",
      patented:    false,
    },
    {
      name:        "WaterMap GIS Dashboard",
      category:    "GIS / Web Software",
      description: "Open-source web dashboard integrating real-time sensor data with GIS layers showing contamination hotspots, population exposure zones, and historical trends. Built on Leaflet.js + Node.js.",
      patented:    false,
    },
    {
      name:        "Bio-Sorbent Filter for Fluoride Removal",
      category:    "Environmental Engineering / Material",
      description: "Activated alumina + bone char composite filter media developed and tested at lab scale achieving >95% fluoride removal efficiency. Ready for pilot-scale deployment.",
      patented:    true,
    },
    {
      name:        "CitizenAlert Mobile App (Android + PWA)",
      category:    "Mobile / Software",
      description: "Citizen-facing mobile app for water quality alerts, complaint registration, and nearest safe water source locator. Integrates with WaterNode sensor data. 1200+ downloads in Ranchi pilot.",
      patented:    false,
    },
  ];

  await profile.save();

  console.log("\n✅  Profile data seeded successfully!");
  console.log("─".repeat(55));
  console.log(`  Faculty Expertise    : ${profile.facultyExpertise.length} entries`);
  console.log(`  Research Areas       : ${profile.researchAreas.length} entries`);
  console.log(`  Labs                 : ${profile.labs.length} entries`);
  console.log(`  Innovation Centres   : ${profile.innovationCentres.length} entries`);
  console.log(`  Incubation Facilities: ${profile.incubationFacilities.length} entries`);
  console.log(`  Available Technologies: ${profile.availableTechnologies.length} entries`);
  console.log("─".repeat(55));
  console.log("\nLog in to the university profile page to see the data.\n");

  process.exit(0);
}

seed().catch(e => { console.error("Seed failed:", e.message); process.exit(1); });
