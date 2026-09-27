require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const mongoose     = require('mongoose')
const bcrypt       = require('bcryptjs')
const connectDB    = require('../config/db')
const User         = require('../models/User')
const Challenge    = require('../models/CitizenModels/Challenge')
const Notification = require('../models/CitizenModels/Notification')
const SuccessStory = require('../models/CitizenModels/SuccessStory')
const PilotFeedback= require('../models/CitizenModels/')

// ── Seed data ────────────────────────────────────────────────────────────────

const USERS = [
  {
    name: 'Rajesh Kumar', email: 'rajesh@example.com', password: 'password123',
    phone: '+91 98765 43210', district: 'Ranchi', role: 'citizen',
    address: 'Ward 14, Harmu Housing Colony, Ranchi',
    badges: [
      { id:'b1', name:'Civic Catalyst',    icon:'🏆', desc:'Your challenge led to a deployed solution',    earned: true,  earnedAt: new Date('2026-05-15') },
      { id:'b2', name:'Community Leader',  icon:'👑', desc:'Received 100+ community endorsements',         earned: true,  earnedAt: new Date('2026-04-10') },
      { id:'b3', name:'Early Adopter',     icon:'🌱', desc:'Among the first 100 platform registrations',   earned: true,  earnedAt: new Date('2025-03-15') },
      { id:'b4', name:'Impact Maker',      icon:'⚡', desc:'Have 5 challenges reach Deployed status',      earned: false },
      { id:'b5', name:'Problem Solver',    icon:'🔬', desc:'Collaborate on a university research team',    earned: false },
      { id:'b6', name:'District Champion', icon:'🎯', desc:'Top contributor in your district for a month', earned: false },
    ],
    totalSubmitted: 12, challengesSolved: 3, totalUpvotes: 145,
  },
  {
    name: 'Priya Devi',   email: 'priya@example.com',  password: 'password123',
    phone: '+91 87654 32109', district: 'Khunti', role: 'citizen',
    address: 'Gram Panchayat Office, Khunti',
  },
  {
    name: 'Admin User',   email: 'admin@jharkhand.gov.in', password: 'admin@2026',
    phone: '+91 99999 00000', district: 'Ranchi', role: 'admin',
  },
]

const CHALLENGES_SEED = [
  {
    title: 'Contaminated Drinking Water in Ward 14',
    description: 'The groundwater in Ward 14 of Harmu Colony has been contaminated with heavy metals. Residents report foul smell and visible discolouration. Multiple children have fallen ill over the past 3 months.',
    category: 'water-management', subCategory: 'Drinking Water',
    urgency: 'high', district: 'Ranchi', city: 'Ranchi',
    address: 'Ward 14, Harmu Colony', affectedPeople: 2500,
    latitude: 23.3441, longitude: 85.3096,
    existingAttempts: 'Panchayat filed a complaint in 2025 but no action taken.',
    expectedSolution: 'Technology-based solution',
    status: 'under-review',
    isPublic: true,
    aiAnalysis: {
      category: 'Water Management → Drinking Water',
      priorityScore: 87, severity: 'High',
      estimatedImpact: 'Approximately 2,500 residents may be affected.',
      requiredSkills: ['Environmental Engineering','Chemistry','Public Health','IoT Sensing','Hydrology'],
      suggestedSolutions: ['Real-time water quality monitoring','Bioremediation pilot','Community RO plant','Heavy metal filtration'],
      duplicatesFound: 3,
    },
    timeline: [
      { status: 'submitted',    date: new Date('2026-07-18'), note: 'Challenge submitted by citizen.' },
      { status: 'ai-analysis',  date: new Date('2026-07-18'), note: 'AI scored 87/100 – High Priority.' },
      { status: 'under-review', date: new Date('2026-07-20'), note: 'Under admin review for validation.' },
    ],
  },
  {
    title: 'Lack of Digital Infrastructure in Tribal Schools',
    description: '12 tribal schools in Khunti district have no computers or internet. Students are missing out on digital education entirely. Teachers are also untrained in digital tools.',
    category: 'education', subCategory: 'Digital Access',
    urgency: 'medium', district: 'Khunti', city: 'Khunti',
    address: 'Block Education Office, Khunti', affectedPeople: 1200,
    latitude: 23.0713, longitude: 85.2842,
    existingAttempts: 'District administration submitted a proposal but funding was not approved.',
    expectedSolution: 'Technology-based solution',
    status: 'university-accepted',
    isPublic: true,
    aiAnalysis: {
      category: 'Education → Digital Access',
      priorityScore: 78, severity: 'Medium',
      estimatedImpact: 'Approximately 1,200 students may benefit.',
      requiredSkills: ['EdTech','Computer Science','Networking','Pedagogy','Community Development'],
      suggestedSolutions: ['Low-cost tablet program','Community WiFi mesh','Offline digital content kits','e-Learning portal'],
      duplicatesFound: 1,
    },
    timeline: [
      { status: 'submitted',           date: new Date('2026-06-10'), note: 'Challenge submitted.' },
      { status: 'ai-analysis',         date: new Date('2026-06-10'), note: 'AI scored 78/100 – Medium.' },
      { status: 'under-review',        date: new Date('2026-06-12'), note: 'Admin review started.' },
      { status: 'validated',           date: new Date('2026-06-15'), note: 'Validated by Dept of Education.' },
      { status: 'university-matching', date: new Date('2026-06-20'), note: 'Routing to HEIs with EdTech expertise.' },
      { status: 'university-accepted', date: new Date('2026-07-28'), note: 'BIT Mesra accepted the challenge.' },
    ],
    assignedUniversity: 'BIT Mesra',
  },
  {
    title: 'Smart Irrigation System for Small Farmers',
    description: 'Small and marginal farmers in Torpa block lack access to modern irrigation. Water wastage is high and crop yield is below average due to unscientific irrigation methods.',
    category: 'agriculture', subCategory: 'Irrigation',
    urgency: 'medium', district: 'Khunti', city: 'Torpa',
    address: 'Torpa Block, Khunti', affectedPeople: 600,
    latitude: 22.9648, longitude: 85.1154,
    expectedSolution: 'Technology-based solution',
    status: 'prototype',
    isPublic: true,
    aiAnalysis: {
      category: 'Agriculture → Irrigation',
      priorityScore: 82, severity: 'Medium',
      estimatedImpact: '600+ farmers may benefit from improved crop yields.',
      requiredSkills: ['IoT','Agriculture Science','Data Analytics','Civil Engineering','Hydrology'],
      suggestedSolutions: ['Smart irrigation sensors','Predictive water management','Solar-powered pumps','Soil moisture monitoring'],
      duplicatesFound: 0,
    },
    timeline: [
      { status: 'submitted',              date: new Date('2026-04-05'), note: 'Challenge submitted.' },
      { status: 'ai-analysis',            date: new Date('2026-04-05'), note: 'AI scored 82/100.' },
      { status: 'under-review',           date: new Date('2026-04-07'), note: 'Admin review.' },
      { status: 'validated',              date: new Date('2026-04-10'), note: 'Validated.' },
      { status: 'university-matching',    date: new Date('2026-04-15'), note: 'Routed to Agriculture universities.' },
      { status: 'university-accepted',    date: new Date('2026-05-01'), note: 'BAU Ranchi accepted.' },
      { status: 'team-formed',            date: new Date('2026-05-10'), note: '6-member multidisciplinary team formed.' },
      { status: 'proposal-submitted',     date: new Date('2026-05-25'), note: 'Research proposal approved.' },
      { status: 'industry-collaboration', date: new Date('2026-06-10'), note: 'AgriTech startup onboarded.' },
      { status: 'prototype',              date: new Date('2026-08-01'), note: 'Prototype under testing in Torpa.' },
    ],
    assignedUniversity: 'BAU Ranchi',
    assignedIndustry:   'AgroTech Startup',
  },
  {
    title: 'Open Defecation in Panchayat Villages',
    description: 'Several villages under Gumla block still practice open defecation due to lack of sanitation facilities. Women and children are especially vulnerable to health risks.',
    category: 'sanitation', subCategory: 'Open Defecation',
    urgency: 'critical', district: 'Gumla', city: 'Gumla',
    address: 'Gumla Block Panchayats', affectedPeople: 3000,
    expectedSolution: 'Infrastructure development',
    status: 'completed',
    isPublic: true,
    aiAnalysis: {
      category: 'Sanitation → Open Defecation',
      priorityScore: 95, severity: 'Critical',
      estimatedImpact: '3,000 villagers and 14 panchayats.',
      requiredSkills: ['Civil Engineering','Public Health','Community Mobilisation','Behaviour Science'],
      suggestedSolutions: ['Community toilet construction','Behaviour change campaigns','SHG-led maintenance model','Bio-toilets'],
      duplicatesFound: 5,
    },
    timeline: [
      { status: 'submitted',              date: new Date('2025-12-01'), note: 'Challenge submitted.' },
      { status: 'ai-analysis',            date: new Date('2025-12-01'), note: 'AI scored 95/100 – Critical.' },
      { status: 'under-review',           date: new Date('2025-12-03'), note: 'Admin review.' },
      { status: 'validated',              date: new Date('2025-12-05'), note: 'Validated.' },
      { status: 'university-matching',    date: new Date('2025-12-10'), note: 'Matched with NIT Jamshedpur.' },
      { status: 'university-accepted',    date: new Date('2025-12-15'), note: 'Accepted.' },
      { status: 'team-formed',            date: new Date('2025-12-20'), note: 'Team formed.' },
      { status: 'proposal-submitted',     date: new Date('2026-01-05'), note: 'Proposal approved.' },
      { status: 'industry-collaboration', date: new Date('2026-01-20'), note: 'CSR partner onboarded.' },
      { status: 'prototype',              date: new Date('2026-02-15'), note: 'Prototype toilets built.' },
      { status: 'pilot-testing',          date: new Date('2026-03-01'), note: 'Pilot in 3 panchayats.' },
      { status: 'deployed',               date: new Date('2026-05-01'), note: '47 community toilets deployed.' },
      { status: 'impact-measured',        date: new Date('2026-06-20'), note: 'ODF status achieved in 12/14 panchayats.' },
      { status: 'completed',              date: new Date('2026-07-10'), note: 'Challenge marked complete.' },
    ],
    assignedUniversity: 'NIT Jamshedpur',
    assignedIndustry:   'CSR – Tata Group',
  },
  {
    title: 'Frequent Power Outages in Rural Areas',
    description: 'Villages in Latehar face 12–16 hour daily power cuts impacting livelihoods, education, and healthcare. Solar micro-grid could provide a sustainable solution.',
    category: 'energy', subCategory: 'Rural Electrification',
    urgency: 'medium', district: 'Latehar', city: 'Latehar',
    affectedPeople: 800,
    expectedSolution: 'Technology-based solution',
    status: 'deployed', isPublic: true,
    aiAnalysis: {
      category: 'Energy → Rural Electrification',
      priorityScore: 80, severity: 'Medium',
      estimatedImpact: '800 households may be electrified.',
      requiredSkills: ['Electrical Engineering','Solar Technology','Power Systems','IoT'],
      suggestedSolutions: ['Solar micro-grid','Smart metering','Community LED street lights','Biogas plant'],
      duplicatesFound: 2,
    },
    timeline: [
      { status: 'submitted',              date: new Date('2025-10-01'), note: 'Submitted.' },
      { status: 'ai-analysis',            date: new Date('2025-10-01'), note: 'AI scored 80/100.' },
      { status: 'under-review',           date: new Date('2025-10-03'), note: 'Review.' },
      { status: 'validated',              date: new Date('2025-10-06'), note: 'Validated.' },
      { status: 'university-matching',    date: new Date('2025-10-12'), note: 'Matching.' },
      { status: 'university-accepted',    date: new Date('2025-10-20'), note: 'IIT (ISM) Dhanbad accepted.' },
      { status: 'team-formed',            date: new Date('2025-11-01'), note: 'Team formed.' },
      { status: 'proposal-submitted',     date: new Date('2025-11-15'), note: 'Proposal approved.' },
      { status: 'industry-collaboration', date: new Date('2025-12-01'), note: 'Solar startup onboarded.' },
      { status: 'prototype',              date: new Date('2026-01-10'), note: 'Prototype installed in 2 villages.' },
      { status: 'pilot-testing',          date: new Date('2026-02-01'), note: 'Pilot testing in 6 villages.' },
      { status: 'deployed',               date: new Date('2026-04-22'), note: 'Solar micro-grid deployed to all 6 villages.' },
    ],
    assignedUniversity: 'IIT (ISM) Dhanbad',
    assignedIndustry:   'Solar Startup',
  },
  // Public feed challenges (different submitters)
  {
    title: 'Poor Road Connectivity to Adivasi Hamlets',
    description: '6 hamlets in Chaibasa block have no all-weather road. Medical emergencies are life-threatening. Women in labour have died en route to hospital.',
    category: 'rural-livelihoods', subCategory: 'MGNREGS',
    urgency: 'high', district: 'West Singhbhum', city: 'Chaibasa',
    affectedPeople: 1500, status: 'validated', isPublic: true,
    aiAnalysis: { category: 'Rural Livelihoods → Infrastructure', priorityScore: 85, severity: 'High',
      estimatedImpact: '1,500 residents in 6 hamlets.', requiredSkills: ['Civil Engineering','Rural Development','GIS'],
      suggestedSolutions: ['All-weather road construction','Temporary bridge','MGNREGS project proposal'],
      duplicatesFound: 0 },
    timeline: [
      { status: 'submitted',    date: new Date('2026-07-01'), note: 'Submitted.' },
      { status: 'ai-analysis',  date: new Date('2026-07-01'), note: 'AI scored 85/100.' },
      { status: 'under-review', date: new Date('2026-07-03'), note: 'Review.' },
      { status: 'validated',    date: new Date('2026-07-08'), note: 'Validated.' },
    ],
  },
  {
    title: 'No Primary Health Centre in 5 Villages',
    description: 'Pregnant women travel 30+ km for delivery. No PHC within accessible range. Three maternal deaths in 2025 were reported.',
    category: 'healthcare', subCategory: 'Primary Care',
    urgency: 'critical', district: 'Simdega', city: 'Simdega',
    affectedPeople: 4500, status: 'university-matching', isPublic: true,
    aiAnalysis: { category: 'Healthcare → Primary Care', priorityScore: 93, severity: 'Critical',
      estimatedImpact: '4,500 residents across 5 villages.',
      requiredSkills: ['Public Health','Telemedicine','Bio-Medical Engineering','Community Health'],
      suggestedSolutions: ['Telemedicine kiosks','Mobile health vans','ASHA worker digital tools','Nutrition tracking app'],
      duplicatesFound: 1 },
    timeline: [
      { status: 'submitted',           date: new Date('2026-06-20'), note: 'Submitted.' },
      { status: 'ai-analysis',         date: new Date('2026-06-20'), note: 'AI scored 93/100.' },
      { status: 'under-review',        date: new Date('2026-06-22'), note: 'Review.' },
      { status: 'validated',           date: new Date('2026-06-25'), note: 'Validated.' },
      { status: 'university-matching', date: new Date('2026-07-05'), note: 'Matching with medical colleges.' },
    ],
  },
  {
    title: 'Soil Degradation in Plateau Farmlands',
    description: 'Decades of unscientific farming has led to severe soil degradation in Hazaribagh plateau. Crop yield has dropped 40% in 10 years.',
    category: 'agriculture', subCategory: 'Soil Health',
    urgency: 'medium', district: 'Hazaribagh', city: 'Hazaribagh',
    affectedPeople: 2200, status: 'under-review', isPublic: true,
    aiAnalysis: { category: 'Agriculture → Soil Health', priorityScore: 74, severity: 'Medium',
      estimatedImpact: '2,200 farmers affected.',
      requiredSkills: ['Agriculture Science','Soil Science','Data Analytics','GIS'],
      suggestedSolutions: ['Soil health cards digitisation','Organic farming training','Cover crop rotation','Bio-fertiliser production'],
      duplicatesFound: 0 },
    timeline: [
      { status: 'submitted',    date: new Date('2026-07-25'), note: 'Submitted.' },
      { status: 'ai-analysis',  date: new Date('2026-07-25'), note: 'AI scored 74/100.' },
      { status: 'under-review', date: new Date('2026-07-27'), note: 'Review.' },
    ],
  },
  {
    title: 'Child Malnutrition in Anganwadi Clusters',
    description: 'SAM (Severe Acute Malnutrition) levels remain alarmingly high in Gumla Anganwadi clusters. 1 in 4 children under 5 is malnourished.',
    category: 'healthcare', subCategory: 'Maternal Health',
    urgency: 'critical', district: 'Gumla', city: 'Gumla',
    affectedPeople: 3200, status: 'validated', isPublic: true,
    aiAnalysis: { category: 'Healthcare → Maternal Health', priorityScore: 91, severity: 'Critical',
      estimatedImpact: '3,200 children and mothers.',
      requiredSkills: ['Nutrition Science','Public Health','Community Health','Behaviour Science'],
      suggestedSolutions: ['Community nutrition programme','Fortified food distribution','POSHAN tracker app','ASHA training'],
      duplicatesFound: 2 },
    timeline: [
      { status: 'submitted',    date: new Date('2026-07-10'), note: 'Submitted.' },
      { status: 'ai-analysis',  date: new Date('2026-07-10'), note: 'AI scored 91/100 – Critical.' },
      { status: 'under-review', date: new Date('2026-07-12'), note: 'Review.' },
      { status: 'validated',    date: new Date('2026-07-15'), note: 'Validated.' },
    ],
  },
]

const SUCCESS_STORIES = [
  {
    title:       'Smart Irrigation deployed in Khunti',
    impact:      '500+ Farmers benefited',
    description: 'IoT-based smart irrigation sensors deployed across 120 acres, reducing water usage by 40% and increasing crop yield by 25%. 500+ small and marginal farmers now benefit from data-driven irrigation.',
    district:    'Khunti', category: 'Agriculture',
    image:       'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=400&h=200&fit=crop',
    university:  'BAU Ranchi', industry: 'AgroTech Startup',
    completedDate: new Date('2026-05-15'),
  },
  {
    title:       'Community Toilets in Gumla Panchayats',
    impact:      '3,000 villagers impacted',
    description: '47 community toilets built across 14 panchayats. ODF (Open Defecation Free) status achieved in 12 panchayats. Women report significant improvement in safety and dignity.',
    district:    'Gumla', category: 'Sanitation',
    image:       'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=400&h=200&fit=crop',
    university:  'NIT Jamshedpur', industry: 'CSR – Tata Group',
    completedDate: new Date('2026-07-10'),
  },
  {
    title:       'Solar Micro-Grid in Latehar Villages',
    impact:      '800 households electrified',
    description: 'Solar micro-grid provides 18 hours of clean electricity to 800 households in 6 villages, eliminating reliance on expensive diesel generators and reducing carbon emissions.',
    district:    'Latehar', category: 'Energy',
    image:       'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=400&h=200&fit=crop',
    university:  'IIT (ISM) Dhanbad', industry: 'Solar Startup',
    completedDate: new Date('2026-04-22'),
  },
]

// ── Main seeder ───────────────────────────────────────────────────────────────
async function seed() {
  try {
    await connectDB()
    console.log('🌱  Starting seed...')

    // Clear existing
    await Promise.all([
      User.deleteMany({}),
      Challenge.deleteMany({}),
      Notification.deleteMany({}),
      SuccessStory.deleteMany({}),
      PilotFeedback.deleteMany({}),
    ])
    console.log('🗑️   Cleared existing data.')

    // Create users
    const createdUsers = await User.insertMany(
      await Promise.all(USERS.map(async u => {
        const salt = await bcrypt.genSalt(12)
        const hash = await bcrypt.hash(u.password, salt)
        return { ...u, password: hash }
      }))
    )
    const citizenUser = createdUsers.find(u => u.email === 'rajesh@example.com')
    const priyaUser   = createdUsers.find(u => u.email === 'priya@example.com')
    console.log(`👥  Created ${createdUsers.length} users.`)

    // Assign submittedBy — first 4 challenges to Rajesh, rest to Priya
    const challengeDocs = CHALLENGES_SEED.map((c, i) => ({
      ...c,
      submittedBy: i < 5 ? citizenUser._id : priyaUser._id,
      // Clear timeline — will re-add properly
      timeline: [],
    }))

    // Insert challenges one by one so the pre-save hook runs (auto challengeId + timeline)
    const createdChallenges = []
    for (const data of challengeDocs) {
      const ch = new Challenge(data)
      // Override auto timeline with seeded one
      const seedTimeline = CHALLENGES_SEED[challengeDocs.indexOf(data)].timeline
      ch.timeline = seedTimeline.map(t => ({ ...t, updatedBy: undefined }))
      await ch.save()
      createdChallenges.push(ch)
    }
    console.log(`📋  Created ${createdChallenges.length} challenges.`)

    // Add cross-endorsements (simulate community engagement)
    for (const ch of createdChallenges) {
      const endorsers  = [citizenUser._id, priyaUser._id]
      const countToAdd = Math.floor(Math.random() * 80) + 5
      ch.endorsements  = endorsers
      ch.endorseCount  = countToAdd
      await ch.save()
    }

    // Create success stories (link to matching challenges)
    const storiesWithLinks = SUCCESS_STORIES.map((s, i) => ({
      ...s,
      challenge: createdChallenges[i + 2]?._id,  // link to challenges 2,3,4
    }))
    const createdStories = await SuccessStory.insertMany(storiesWithLinks)
    console.log(`🏆  Created ${createdStories.length} success stories.`)

    // Create notifications for Rajesh
    await Notification.insertMany([
      { user: citizenUser._id, type: 'status',      title: 'Challenge Status Updated', message: `${createdChallenges[0].challengeId} moved to Under Review`, icon: '📋', read: false, createdAt: new Date(Date.now() - 2*60*60*1000) },
      { user: citizenUser._id, type: 'endorsement', title: 'New Endorsement',           message: `5 new citizens endorsed your challenge ${createdChallenges[1].challengeId}`, icon: '👍', read: false, createdAt: new Date(Date.now() - 4*60*60*1000) },
      { user: citizenUser._id, type: 'university',  title: 'University Accepted',        message: `BIT Mesra accepted ${createdChallenges[1].challengeId} for research`, icon: '🎓', read: false, createdAt: new Date(Date.now() - 24*60*60*1000) },
      { user: citizenUser._id, type: 'ai',          title: 'AI Analysis Complete',       message: `${createdChallenges[0].challengeId} scored 87/100 – High Priority`, icon: '🤖', read: true, createdAt: new Date(Date.now() - 3*24*60*60*1000) },
      { user: citizenUser._id, type: 'badge',       title: 'New Badge Earned!',          message: 'You earned the Community Leader badge 👑', icon: '🏅', read: true, createdAt: new Date(Date.now() - 5*24*60*60*1000) },
      { user: citizenUser._id, type: 'feedback',    title: 'Feedback Request',           message: `Please rate the deployed solution for ${createdChallenges[4].challengeId}`, icon: '⭐', read: true, createdAt: new Date(Date.now() - 7*24*60*60*1000) },
    ])
    console.log('🔔  Created notifications.')

    // Update Rajesh's stats
    await User.findByIdAndUpdate(citizenUser._id, {
      totalSubmitted: 12, challengesSolved: 3, totalUpvotes: 145,
    })

    console.log('\n✅  Seed complete!')
    console.log('─'.repeat(50))
    console.log('🔑  Login credentials:')
    console.log('   Citizen  → rajesh@example.com   / password123')
    console.log('   Citizen2 → priya@example.com    / password123')
    console.log('   Admin    → admin@jharkhand.gov.in / admin@2026')
    console.log('─'.repeat(50))

    process.exit(0)
  } catch (err) {
    console.error('❌  Seed failed:', err)
    process.exit(1)
  }
}

seed()
