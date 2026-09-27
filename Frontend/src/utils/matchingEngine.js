/**
 * matchingEngine.js
 * AI University Matching Engine for Jharkhand Innovation Portal
 *
 * Scoring model (max 100 raw points → normalized to 45–98%):
 *   Factor 1 – Skill overlap          : up to 45 pts  (9 pts per matching skill, max 5)
 *   Factor 2 – Category / domain match: up to 20 pts
 *   Factor 3 – Lab availability       : up to 15 pts
 *   Factor 4 – Research area alignment: up to 10 pts
 *   Factor 5 – Urgency / priority bonus: up to 7 pts
 *   Factor 6 – Location proximity     : up to 3 pts
 */

// ── Domain → keyword map ──────────────────────────────────────────────────────
const CATEGORY_KEYWORDS = {
  'water-management':  ['water', 'hydro', 'aqua', 'irrigation', 'groundwater', 'quality', 'contamination', 'filtration', 'iot'],
  'agriculture':       ['agri', 'farm', 'crop', 'soil', 'irrigation', 'horticulture', 'precision', 'food'],
  'healthcare':        ['health', 'medical', 'clinical', 'telemedicine', 'nutrition', 'public health', 'bio'],
  'education':         ['edtech', 'education', 'digital', 'learning', 'school', 'networking', 'community'],
  'sanitation':        ['sanitation', 'toilet', 'waste', 'drainage', 'odf', 'hygiene', 'civil', 'public health'],
  'energy':            ['energy', 'solar', 'power', 'renewable', 'electrification', 'grid', 'electrical'],
  'environment':       ['environment', 'ecology', 'pollution', 'forest', 'climate', 'biodiversity', 'waste'],
  'rural-livelihoods': ['rural', 'livelihood', 'community', 'social', 'tribal', 'shg', 'skill'],
  'urban-development': ['urban', 'infrastructure', 'planning', 'smart city', 'traffic', 'slum'],
  'public-admin':      ['governance', 'public admin', 'policy', 'management', 'administration'],
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Case-insensitive fuzzy inclusion check */
const fuzzyMatch = (source, target) =>
  source.toLowerCase().includes(target.toLowerCase()) ||
  target.toLowerCase().includes(source.toLowerCase());

/** Check if any item in listA loosely matches any item in listB */
const listsOverlap = (listA = [], listB = []) =>
  listA.some(a => listB.some(b => fuzzyMatch(a, b)));

/** Normalize raw score (0–100) to a display percentage in range [low, high] */
const normalize = (raw, maxRaw, low = 45, high = 98) => {
  const ratio = Math.min(raw / maxRaw, 1);
  return Math.round(low + ratio * (high - low));
};

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * calculateUniversityMatch
 * @param {object} challenge  – challenge object (needs aiAnalysis.requiredSkills, category, urgency, district)
 * @param {Array}  universityList – array of university objects
 * @returns {Array} sorted array of { universityId, universityName, matchScore, reasons, details }
 */
export const calculateUniversityMatch = (challenge, universityList = []) => {
  if (!challenge) return [];

  const requiredSkills  = challenge.aiAnalysis?.requiredSkills || [];
  const category        = challenge.category || '';
  const district        = challenge.district || '';
  const urgency         = challenge.urgency  || 'medium';
  const priorityScore   = challenge.aiAnalysis?.priorityScore || 50;
  const categoryWords   = CATEGORY_KEYWORDS[category] || [];

  const MAX_RAW = 100;

  const scored = universityList.map(univ => {
    let raw = 0;
    const reasons = [];
    const details = {
      skillMatches:    [],
      categoryMatch:   false,
      labMatches:      [],
      researchMatches: [],
      locationMatch:   false,
    };

    // ── Factor 1: Skill overlap (9 pts each, max 5 skills = 45 pts) ──────────
    const matchedSkills = requiredSkills.filter(skill =>
      (univ.expertise || []).some(exp => fuzzyMatch(exp, skill))
    );
    const skillPts = Math.min(matchedSkills.length, 5) * 9;
    raw += skillPts;
    if (matchedSkills.length > 0) {
      details.skillMatches = matchedSkills;
      matchedSkills.slice(0, 3).forEach(s =>
        reasons.push(`${s} expertise available`)
      );
    }

    // ── Factor 2: Category / domain match (up to 20 pts) ────────────────────
    const domainMatchCount = (univ.expertise || []).filter(exp =>
      categoryWords.some(kw => fuzzyMatch(exp, kw))
    ).length;

    if (domainMatchCount >= 3) {
      raw += 20;
      details.categoryMatch = true;
      reasons.push(`Strong domain focus in ${category.replace(/-/g, ' ')}`);
    } else if (domainMatchCount >= 1) {
      raw += 10;
      details.categoryMatch = true;
      reasons.push(`Relevant experience in ${category.replace(/-/g, ' ')}`);
    }

    // ── Factor 3: Lab availability (5 pts each, max 3 = 15 pts) ─────────────
    const matchedLabs = (univ.labs || []).filter(lab =>
      categoryWords.some(kw => fuzzyMatch(lab, kw)) ||
      requiredSkills.some(s => fuzzyMatch(lab, s))
    );
    const labPts = Math.min(matchedLabs.length, 3) * 5;
    raw += labPts;
    if (matchedLabs.length > 0) {
      details.labMatches = matchedLabs;
      matchedLabs.slice(0, 2).forEach(l => reasons.push(`${l} on campus`));
    }

    // ── Factor 4: Research area alignment (5 pts each, max 2 = 10 pts) ──────
    const matchedResearch = (univ.researchAreas || []).filter(r =>
      categoryWords.some(kw => fuzzyMatch(r, kw)) ||
      requiredSkills.some(s => fuzzyMatch(r, s))
    );
    const researchPts = Math.min(matchedResearch.length, 2) * 5;
    raw += researchPts;
    if (matchedResearch.length > 0) {
      details.researchMatches = matchedResearch;
      reasons.push(`Active research: ${matchedResearch[0]}`);
    }

    // ── Factor 5: Urgency / priority bonus (up to 7 pts) ────────────────────
    if (urgency === 'critical' && raw > 30) {
      raw += 7;
      reasons.push('Equipped for critical-priority deployment');
    } else if (urgency === 'high' && raw > 20) {
      raw += 4;
    }

    // ── Factor 6: Location (same district = 3 pts) ───────────────────────────
    if (univ.district === district) {
      raw += 3;
      details.locationMatch = true;
      reasons.push(`Located in ${district} — faster field deployment`);
    }

    const matchScore = normalize(raw, MAX_RAW);

    return {
      universityId:   univ.id,
      universityName: univ.name,
      shortName:      univ.shortName || univ.name,
      location:       univ.location  || univ.district,
      accreditation:  univ.accreditation || '',
      type:           univ.type || '',
      facultyCount:   univ.facultyCount || 0,
      activeProjects: univ.activeProjects || 0,
      matchScore,
      rawScore: raw,
      reasons: reasons.length > 0
        ? reasons.slice(0, 5)
        : ['General research infrastructure available'],
      details,
    };
  });

  return scored.sort((a, b) => b.matchScore - a.matchScore);
};
