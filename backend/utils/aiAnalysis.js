/**
 * Simulated AI analysis engine.
 * Architecture is designed so a real AI API (Gemini / OpenAI) can be
 * swapped in by replacing the body of `runAIAnalysis`.
 */

const SKILLS_MAP = {
  'agriculture':      ['Agriculture Science','IoT','Data Analytics','Civil Engineering','Hydrology'],
  'water-management': ['Environmental Engineering','Chemistry','Public Health','IoT Sensing','Hydrology'],
  'healthcare':       ['Public Health','Telemedicine','Bio-Medical Engineering','Community Health'],
  'education':        ['EdTech','Computer Science','Networking','Pedagogy','Community Development'],
  'environment':      ['Environmental Science','Chemistry','Ecology','Remote Sensing','GIS'],
  'energy':           ['Electrical Engineering','Solar Technology','Power Systems','IoT'],
  'sanitation':       ['Civil Engineering','Public Health','Community Mobilisation','Behaviour Science'],
  'urban-development':['Urban Planning','Civil Engineering','GIS','Smart City Tech','Traffic Eng.'],
  'accessibility':    ['Human Factors','Assistive Technology','Industrial Design','Policy'],
  'public-admin':     ['Public Policy','e-Governance','Data Science','Law'],
  'rural-livelihoods':['Rural Development','Economics','Agri-Finance','Skill Development'],
  'other':            ['General Engineering','Social Work','Policy Research'],
}

const SOLUTIONS_MAP = {
  'agriculture':      ['Smart irrigation sensors','Predictive crop analytics','Farm mechanisation','Soil health kits'],
  'water-management': ['Real-time water quality monitoring','Bioremediation pilot','Community RO plant','Heavy metal filtration'],
  'healthcare':       ['Telemedicine kiosks','Mobile health vans','ASHA worker digital tools','Nutrition tracking app'],
  'education':        ['Low-cost tablet program','Community WiFi mesh','Offline digital content kits','e-Learning portal'],
  'environment':      ['Air quality sensors','Waste-to-energy plant','Community clean-up drive','Green cover mapping'],
  'energy':           ['Solar micro-grid','Biogas plant','Smart metering','Community LED street lights'],
  'sanitation':       ['Community toilet construction','Behaviour change campaigns','SHG-led maintenance model','Bio-toilets'],
  'urban-development':['Smart traffic management','Pothole detection app','Slum rehabilitation plan','Green corridor'],
  'accessibility':    ['Ramp & lift retrofitting','Sign language kiosks','Accessible transport','Digital screen-readers'],
  'public-admin':     ['Online grievance portal','Blockchain land records','CSC service digitisation','Transparency dashboard'],
  'rural-livelihoods':['SHG digital platform','Microfinance app','Skill development camps','Farmer market linkage'],
  'other':            ['Community needs assessment','Stakeholder consultation','Pilot intervention design'],
}

const SEVERITY_THRESHOLDS = { critical: 90, high: 70, medium: 45 }

/**
 * Deterministic priority score based on urgency + affected people + category
 */
function calcPriority(urgency, affectedPeople, category) {
  const urgencyScore = { critical: 40, high: 30, medium: 20, low: 10 }[urgency] ?? 15
  const impactScore  = Math.min(30, Math.floor((affectedPeople || 0) / 200))
  const catBonus     = ['healthcare','water-management','sanitation'].includes(category) ? 15 : 5
  const noise        = Math.floor(Math.random() * 10)       // slight variation per run
  return Math.min(100, urgencyScore + impactScore + catBonus + noise)
}

function getSeverity(score) {
  if (score >= SEVERITY_THRESHOLDS.critical) return 'Critical'
  if (score >= SEVERITY_THRESHOLDS.high)     return 'High'
  if (score >= SEVERITY_THRESHOLDS.medium)   return 'Medium'
  return 'Low'
}

async function runAIAnalysis(challenge) {
  // Simulate network latency of an external AI call
  await new Promise(r => setTimeout(r, 600))

  const { category, subCategory, urgency, affectedPeople, title } = challenge
  const priorityScore   = calcPriority(urgency, affectedPeople, category)
  const severity        = getSeverity(priorityScore)
  const requiredSkills  = SKILLS_MAP[category]    ?? SKILLS_MAP['other']
  const suggested       = SOLUTIONS_MAP[category] ?? SOLUTIONS_MAP['other']
  const catLabel        = category.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  const subLabel        = subCategory || ''

  return {
    category:          `${catLabel}${subLabel ? ' → ' + subLabel : ''}`,
    priorityScore,
    severity,
    estimatedImpact:   `Approximately ${(affectedPeople || 100).toLocaleString()} residents may be affected.`,
    requiredSkills:    requiredSkills.slice(0, 5),
    suggestedSolutions:suggested.slice(0, 4),
    duplicatesFound:   Math.floor(Math.random() * 4),  // 0–3 simulated
    analyzedAt:        new Date(),
  }
}

module.exports = { runAIAnalysis }
