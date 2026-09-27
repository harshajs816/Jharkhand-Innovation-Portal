/**
 * seedAllUniversityData.js
 * Seeds expertise, labs, researchAreas for all 6 universities
 * that were registered without this data.
 *
 *   node scripts/seedAllUniversityData.js
 */

require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const connectDB         = require("../config/db");
const UniversityProfile = require("../models/UniversityModels/UniversityProfile");

const DATA = [
  {
    name: "BIT Mesra",
    expertise: [
      "IoT Sensor Networks", "Environmental Engineering", "Water Quality Analysis",
      "Machine Learning", "Public Health", "Chemistry",
      "GIS & Remote Sensing", "Computer Science", "Civil Engineering",
    ],
    labs: [
      { name: "IoT & Embedded Systems Lab",   department: "Electronics & Communication" },
      { name: "Advanced IoT Lab",              department: "Electronics & Communication" },
      { name: "Environmental Analysis Lab",    department: "Civil & Environmental Engineering" },
      { name: "Water Testing Lab",             department: "Civil & Environmental Engineering" },
      { name: "AI & Data Science Lab",         department: "Computer Science & Engineering" },
      { name: "GIS Remote Sensing Studio",     department: "Civil Engineering" },
    ],
    researchAreas: [
      { name: "Smart Water Monitoring",       description: "Real-time IoT monitoring of urban water quality" },
      { name: "Heavy Metal Detection",        description: "Arsenic, Lead, Fluoride detection in groundwater" },
      { name: "AI Environmental Analytics",   description: "ML-based prediction of contamination events" },
      { name: "Urban Infrastructure",         description: "GIS-based urban water distribution mapping" },
    ],
    facultyExpertise: [
      { area: "Water Quality Analysis & Remediation",      facultyName: "Dr. Priya Sharma",    department: "Civil & Environmental Engineering" },
      { area: "IoT Sensor Networks & Embedded Systems",    facultyName: "Prof. Anil Kumar",     department: "Electronics & Communication" },
      { area: "Machine Learning for Environmental Data",   facultyName: "Dr. Sunita Verma",     department: "Computer Science & Engineering" },
      { area: "Groundwater Hydrology",                     facultyName: "Dr. Rajesh Pandey",    department: "Civil Engineering" },
      { area: "Heavy Metal Detection & Spectroscopy",      facultyName: "Prof. Kavita Singh",   department: "Applied Chemistry" },
    ],
  },

  {
    name: "IIT (ISM) Dhanbad",
    expertise: [
      "Mining Engineering", "Electrical Engineering", "Solar Energy",
      "Power Systems", "Environmental Science", "Civil Engineering",
      "Rural Electrification", "Renewable Energy", "Smart Grid",
    ],
    labs: [
      { name: "Solar Energy Lab",             department: "Electrical Engineering" },
      { name: "Power Electronics Lab",         department: "Electrical Engineering" },
      { name: "Smart Grid Lab",               department: "Power Systems" },
      { name: "Environmental Testing Centre", department: "Civil Engineering" },
      { name: "Mining Research Lab",          department: "Mining Engineering" },
      { name: "Renewable Energy Systems Lab", department: "Electrical Engineering" },
    ],
    researchAreas: [
      { name: "Rural Electrification",      description: "Solar micro-grids for villages" },
      { name: "Solar Micro-Grid",            description: "Off-grid solar systems for remote areas" },
      { name: "Coal Mine Rehabilitation",    description: "Environmental restoration of mining areas" },
      { name: "Clean Energy Solutions",      description: "Biogas, solar and wind energy integration" },
    ],
    facultyExpertise: [
      { area: "Solar Energy Systems",       facultyName: "Dr. R. K. Sharma",    department: "Electrical Engineering" },
      { area: "Rural Electrification",      facultyName: "Prof. Manoj Kumar",   department: "Power Systems" },
      { area: "Environmental Engineering",  facultyName: "Dr. Anita Das",       department: "Civil Engineering" },
    ],
  },

  {
    name: "NIT Jamshedpur",
    expertise: [
      "Civil Engineering", "Sanitation Infrastructure", "Public Health",
      "Community Mobilisation", "Urban Planning", "Waste Management",
      "Structural Engineering", "Behaviour Science",
    ],
    labs: [
      { name: "Civil & Structural Lab",        department: "Civil Engineering" },
      { name: "Sanitation Research Centre",    department: "Environmental Engineering" },
      { name: "Urban Planning Studio",         department: "Civil Engineering" },
      { name: "Water & Waste Treatment Lab",   department: "Civil Engineering" },
      { name: "Public Health Lab",             department: "Environmental Engineering" },
    ],
    researchAreas: [
      { name: "ODF Implementation",           description: "Open Defecation Free village programmes" },
      { name: "Community Toilet Design",      description: "Low-cost durable toilet construction" },
      { name: "Solid Waste Management",       description: "Source segregation and composting systems" },
      { name: "Urban Drainage",               description: "Stormwater and sewage management" },
    ],
    facultyExpertise: [
      { area: "Sanitation Infrastructure",    facultyName: "Dr. S. K. Mishra",   department: "Civil Engineering" },
      { area: "Public Health Engineering",    facultyName: "Prof. Renu Singh",   department: "Environmental Engineering" },
      { area: "Community Mobilisation",       facultyName: "Dr. P. K. Das",      department: "Humanities & Social Sciences" },
    ],
  },

  {
    name: "BAU Ranchi",
    expertise: [
      "Agriculture Science", "Irrigation Technology", "Soil Science",
      "Data Analytics", "Horticulture", "Precision Farming",
      "IoT in Agriculture", "Water Management", "Crop Science",
    ],
    labs: [
      { name: "Agriculture Hydro Lab",          department: "Agricultural Engineering" },
      { name: "Soil Testing Lab",               department: "Soil Science" },
      { name: "AgriTech Innovation Centre",     department: "Agricultural Engineering" },
      { name: "Drip Irrigation Research Unit",  department: "Agronomy" },
      { name: "Crop Science Lab",              department: "Agronomy" },
      { name: "Weather & Climate Station",      department: "Agronomy" },
    ],
    researchAreas: [
      { name: "Smart Irrigation",                  description: "IoT-based drip irrigation with soil sensors" },
      { name: "Soil Health Monitoring",             description: "Digital soil health cards and remediation" },
      { name: "Climate-Resilient Agriculture",      description: "Drought and flood tolerant crop varieties" },
      { name: "Organic Farming",                    description: "Bio-fertiliser and natural pest management" },
    ],
    facultyExpertise: [
      { area: "Precision Agriculture & IoT",   facultyName: "Dr. Meena Tigga",     department: "Agricultural Engineering" },
      { area: "Soil Science & Fertility",      facultyName: "Prof. B. K. Oraon",   department: "Soil Science" },
      { area: "Water Management in Agriculture", facultyName: "Dr. A. K. Choudhary", department: "Agronomy" },
    ],
  },

  {
    name: "Ranchi University",
    expertise: [
      "Social Science", "Community Development", "Public Administration",
      "Rural Livelihoods", "Tribal Studies", "Education Technology",
      "Behavioural Science", "Gender Studies", "Health Education",
    ],
    labs: [
      { name: "Social Research Centre",  department: "Sociology" },
      { name: "Rural Development Lab",   department: "Rural Studies" },
      { name: "EdTech Studio",           department: "Education" },
      { name: "Community Health Unit",   department: "Public Health" },
      { name: "Tribal Studies Archive",  department: "Tribal Studies" },
    ],
    researchAreas: [
      { name: "Tribal Welfare",              description: "Tribal rights, forest governance and livelihood" },
      { name: "Rural Education",             description: "Digital literacy and school dropout prevention" },
      { name: "Community Health",            description: "ASHA worker training and maternal health" },
      { name: "Gender & Social Inclusion",   description: "Women-led SHGs and social mobility" },
    ],
    facultyExpertise: [
      { area: "Tribal Studies & Rural Development",   facultyName: "Prof. Arvind Singh",    department: "Sociology" },
      { area: "Education Technology",                 facultyName: "Dr. Anjali Kumari",     department: "Education" },
      { area: "Community Health & Epidemiology",      facultyName: "Dr. S. N. Pandey",      department: "Public Health" },
    ],
  },

  {
    name: "XLRI Jamshedpur",
    expertise: [
      "Management", "Corporate Social Responsibility", "Supply Chain",
      "Social Entrepreneurship", "Public Policy", "Behaviour Change Communication",
      "Social Impact Measurement", "NGO Management",
    ],
    labs: [
      { name: "Social Innovation Lab",   department: "Business & Society" },
      { name: "Business Analytics Studio", department: "Strategy" },
      { name: "CSR Research Cell",       department: "Business & Society" },
      { name: "Behaviour Change Unit",   department: "Communications" },
    ],
    researchAreas: [
      { name: "Social Impact Measurement",        description: "Theory of change and outcome evaluation" },
      { name: "Industry-NGO Partnerships",         description: "CSR programme design and monitoring" },
      { name: "Behaviour Change for Sanitation",   description: "Nudge-based ODF behaviour campaigns" },
      { name: "Rural Market Linkages",             description: "SHG to market supply chain models" },
    ],
    facultyExpertise: [
      { area: "Corporate Social Responsibility",    facultyName: "Dr. Priya Thomas",     department: "Business & Society" },
      { area: "Social Entrepreneurship",            facultyName: "Prof. K. R. Nair",     department: "Strategy" },
      { area: "Behaviour Change Communication",     facultyName: "Dr. Sneha Gupta",      department: "Communications" },
    ],
  },
];

async function seed() {
  await connectDB();
  console.log("\n🌱  Seeding university expertise, labs & research areas...\n");

  for (const d of DATA) {
    const result = await UniversityProfile.findOneAndUpdate(
      { universityName: d.name },
      {
        $set: {
          expertise:          d.expertise,
          labs:               d.labs,
          researchAreas:      d.researchAreas,
          facultyExpertise:   d.facultyExpertise,
        },
      },
      { new: true }
    );

    if (result) {
      console.log(`✅  ${d.name}`);
      console.log(`    expertise: ${result.expertise?.length} | labs: ${result.labs?.length} | research: ${result.researchAreas?.length} | faculty: ${result.facultyExpertise?.length}`);
    } else {
      console.log(`❌  NOT FOUND: ${d.name}`);
    }
  }

  console.log("\n✅  Done — all universities now have full profile data.\n");
  process.exit(0);
}

seed().catch(e => { console.error(e.message); process.exit(1); });
