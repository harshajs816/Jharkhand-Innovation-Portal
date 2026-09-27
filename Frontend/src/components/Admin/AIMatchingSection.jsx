import { useContext, useState, useMemo } from 'react';
import { ChallengeContext } from '../../context/ChallengeContext';
import { calculateUniversityMatch } from '../../utils/matchingEngine';
import { mockUniversities } from '../../data/mockData';

// ─────────────────────────────────────────────────────────────────────────────
// Design tokens
// ─────────────────────────────────────────────────────────────────────────────

const scoreTheme = (score) => {
  if (score >= 85) return {
    bar:        'bg-emerald-500',
    barGlow:    'shadow-emerald-500/40',
    text:       'text-emerald-400',
    textBold:   'text-emerald-300',
    border:     'border-emerald-500/30',
    ring:       'ring-emerald-500/20',
    bg:         'bg-emerald-500/10',
    circleBg:   'bg-emerald-500/15',
    circleBorder:'border-emerald-500/60',
    label:      'Excellent',
    labelBg:    'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  };
  if (score >= 70) return {
    bar:        'bg-blue-500',
    barGlow:    'shadow-blue-500/40',
    text:       'text-blue-400',
    textBold:   'text-blue-300',
    border:     'border-blue-500/30',
    ring:       'ring-blue-500/20',
    bg:         'bg-blue-500/10',
    circleBg:   'bg-blue-500/15',
    circleBorder:'border-blue-500/60',
    label:      'Good',
    labelBg:    'bg-blue-500/15 text-blue-300 border-blue-500/30',
  };
  if (score >= 55) return {
    bar:        'bg-amber-500',
    barGlow:    'shadow-amber-500/40',
    text:       'text-amber-400',
    textBold:   'text-amber-300',
    border:     'border-amber-500/30',
    ring:       'ring-amber-500/20',
    bg:         'bg-amber-500/10',
    circleBg:   'bg-amber-500/15',
    circleBorder:'border-amber-500/60',
    label:      'Fair',
    labelBg:    'bg-amber-500/15 text-amber-300 border-amber-500/30',
  };
  return {
    bar:        'bg-slate-500',
    barGlow:    '',
    text:       'text-slate-400',
    textBold:   'text-slate-300',
    border:     'border-slate-600/30',
    ring:       'ring-slate-600/20',
    bg:         'bg-slate-500/10',
    circleBg:   'bg-slate-700',
    circleBorder:'border-slate-600',
    label:      'Low',
    labelBg:    'bg-slate-700 text-slate-400 border-slate-600/40',
  };
};

const URGENCY = {
  critical: 'bg-red-500/15    text-red-400    border-red-500/30',
  high:     'bg-orange-500/15 text-orange-400 border-orange-500/30',
  medium:   'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  low:      'bg-green-500/15  text-green-400  border-green-500/30',
};

const REASON_ICON = (text) => {
  const t = text.toLowerCase();
  if (t.includes('lab'))       return '🧪';
  if (t.includes('research'))  return '🔬';
  if (t.includes('located') || t.includes('district')) return '📍';
  if (t.includes('expertise') || t.includes('skill')) return '✓';
  if (t.includes('critical') || t.includes('deploy')) return '🚀';
  if (t.includes('domain') || t.includes('focus'))    return '🎯';
  return '◆';
};

const cap  = (s)  => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
const fmtCat = (c) => cap(c?.replace(/-/g, ' ') || '');

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

/** Animated width progress bar */
function ProgressBar({ score }) {
  const t = scoreTheme(score);
  return (
    <div className="w-full h-2 bg-slate-700/80 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ease-out ${t.bar}`}
        style={{ width: `${score}%` }}
      />
    </div>
  );
}

/** Circular score badge */
function ScoreBadge({ score }) {
  const t = scoreTheme(score);
  // SVG arc for the filled portion
  const r = 20, cx = 26, cy = 26;
  const circumference = 2 * Math.PI * r;
  const filled = circumference * (score / 100);

  return (
    <div className="relative w-[52px] h-[52px] flex items-center justify-center flex-shrink-0">
      <svg width="52" height="52" viewBox="0 0 52 52" className="-rotate-90">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="4" />
        <circle cx={cx} cy={cy} r={r} fill="none"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circumference - filled}`}
          className={`${t.text.replace('text-', 'stroke-').replace('-400', '-500')}`}
          style={{ transition: 'stroke-dasharray 0.8s ease-out' }}
        />
      </svg>
      <span className={`absolute text-xs font-black tabular-nums ${t.textBold}`}>
        {score}%
      </span>
    </div>
  );
}

/** Single reason bullet with icon */
function ReasonBullet({ text }) {
  const icon = REASON_ICON(text);
  return (
    <div className="flex items-start gap-2 text-xs text-slate-300 leading-snug">
      <span className="flex-shrink-0 mt-0.5 text-[11px]">{icon}</span>
      <span>{text}</span>
    </div>
  );
}

/** Expandable detail chip group */
function ChipGroup({ label, items, chipClass }) {
  return items.length > 0 ? (
    <div>
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item, i) => (
          <span key={i} className={`px-2.5 py-1 rounded-full text-[11px] font-medium border ${chipClass}`}>
            {item}
          </span>
        ))}
      </div>
    </div>
  ) : null;
}

// ─────────────────────────────────────────────────────────────────────────────
// University recommendation card (top-3 style)
// ─────────────────────────────────────────────────────────────────────────────

function RecommendationCard({ match, rank, onAssign, isAssigning, isAssigned }) {
  const [showDetails, setShowDetails] = useState(false);
  const t = scoreTheme(match.matchScore);
  const isTop = rank === 0;

  return (
    <div className={`
      relative rounded-2xl border overflow-hidden
      transition-all duration-200
      ${isAssigned
        ? 'border-emerald-500/40 bg-slate-800/80 ring-1 ring-emerald-500/15'
        : isTop
          ? `border-indigo-500/40 bg-slate-800/90 ring-1 ring-indigo-500/15 shadow-xl shadow-indigo-500/5`
          : 'border-slate-700/60 bg-slate-800/60 hover:border-slate-600/80'
      }
    `}>

      {/* Top gradient line */}
      <div className={`absolute top-0 left-0 right-0 h-[3px] ${
        isAssigned ? 'bg-emerald-500' :
        isTop      ? 'bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500' :
                     t.bar
      }`} />

      <div className="p-5">

        {/* ── Header: rank + name + score ───────────────────────────────────── */}
        <div className="flex items-start gap-3 mb-4">

          {/* Rank number */}
          <div className={`
            flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center
            text-sm font-black
            ${isTop ? 'bg-indigo-600 text-white' : 'bg-slate-700/80 text-slate-400'}
          `}>
            #{rank + 1}
          </div>

          {/* Name + meta */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="text-white font-extrabold text-[15px] leading-tight">
                {match.universityName}
              </h3>
              {isAssigned && (
                <span className="px-2 py-0.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold rounded-full">
                  ✓ ASSIGNED
                </span>
              )}
              {isTop && !isAssigned && (
                <span className="px-2 py-0.5 bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-[10px] font-bold rounded-full">
                  ⭐ BEST MATCH
                </span>
              )}
              <span className={`px-2 py-0.5 border rounded-full text-[10px] font-bold ${t.labelBg}`}>
                {t.label}
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap">
              {match.location     && <span>📍 {match.location}</span>}
              {match.accreditation && <span>🏅 {match.accreditation}</span>}
              {match.type         && <span className="hidden sm:inline">🏛 {match.type}</span>}
            </div>
          </div>

          {/* Circular score */}
          <ScoreBadge score={match.matchScore} />
        </div>

        {/* ── Match score bar ─────────────────────────────────────────────── */}
        <div className="mb-1 flex items-center justify-between">
          <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest">
            Match Strength
          </span>
          <span className={`text-lg font-black tabular-nums ${t.text}`}>
            {match.matchScore}%
          </span>
        </div>
        <ProgressBar score={match.matchScore} />

        {/* ── Quick stats ─────────────────────────────────────────────────── */}
        {(match.facultyCount > 0 || match.activeProjects > 0) && (
          <div className="flex gap-5 mt-4 pb-4 border-b border-slate-700/40">
            {match.facultyCount > 0 && (
              <div>
                <p className="text-sm font-extrabold text-white leading-none">{match.facultyCount}</p>
                <p className="text-[10px] text-slate-500 mt-1">Faculty</p>
              </div>
            )}
            {match.activeProjects > 0 && (
              <div>
                <p className="text-sm font-extrabold text-white leading-none">{match.activeProjects}</p>
                <p className="text-[10px] text-slate-500 mt-1">Active Projects</p>
              </div>
            )}
          </div>
        )}

        {/* ── Why this match — reason bullets ─────────────────────────────── */}
        <div className="mt-4">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
            Why Recommended
          </p>
          <div className="space-y-1.5">
            {match.reasons.map((r, i) => (
              <ReasonBullet key={i} text={r} />
            ))}
          </div>
        </div>

        {/* ── Expandable deep details ──────────────────────────────────────── */}
        {match.details && (
          <>
            <button
              onClick={() => setShowDetails(d => !d)}
              className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-indigo-400 transition-colors font-medium"
            >
              <svg className={`w-3 h-3 transition-transform ${showDetails ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
              {showDetails ? 'Hide details' : 'Show match breakdown'}
            </button>

            {showDetails && (
              <div className="mt-4 pt-4 border-t border-slate-700/40 space-y-4">
                <ChipGroup
                  label="Matched Skills"
                  items={match.details.skillMatches}
                  chipClass="bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                />
                <ChipGroup
                  label="Available Labs"
                  items={match.details.labMatches}
                  chipClass="bg-blue-500/10 border-blue-500/20 text-blue-300"
                />
                <ChipGroup
                  label="Research Alignment"
                  items={match.details.researchMatches}
                  chipClass="bg-purple-500/10 border-purple-500/20 text-purple-300"
                />
              </div>
            )}
          </>
        )}

        {/* ── Assign Now button ────────────────────────────────────────────── */}
        <div className="mt-5">
          {isAssigned ? (
            <div className="w-full py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-semibold text-center">
              ✓ Already assigned to this university
            </div>
          ) : (
            <button
              onClick={() => onAssign(match.universityId, match.universityName)}
              disabled={isAssigning}
              className={`
                w-full py-3 rounded-xl text-sm font-bold tracking-wide
                flex items-center justify-center gap-2
                transition-all duration-150 active:scale-[0.98]
                disabled:opacity-50 disabled:cursor-not-allowed
                ${isTop
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                  : 'bg-slate-700/80 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-600/60 hover:border-slate-500/80'
                }
              `}
            >
              {isAssigning ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Assigning…
                </>
              ) : (
                <>
                  🎓 Assign Now — {match.shortName || match.universityName}
                </>
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Manual fallback input
// ─────────────────────────────────────────────────────────────────────────────

function ManualAssign({ challengeId, onAssign, isAssigning }) {
  const [query,       setQuery]       = useState('');
  const [selected,    setSelected]    = useState(null); // { id, name }
  const [showDropdown,setShowDropdown]= useState(false);

  const suggestions = query.length >= 2
    ? mockUniversities.filter(u =>
        u.name.toLowerCase().includes(query.toLowerCase()) ||
        u.location?.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const handleSelect = (univ) => {
    setSelected({ id: univ.id, name: univ.name });
    setQuery(univ.name);
    setShowDropdown(false);
  };

  const handleManualAssign = () => {
    const target = selected || { id: `MANUAL-${Date.now()}`, name: query.trim() };
    if (!target.name) return;
    onAssign(target.id, target.name);
    setQuery('');
    setSelected(null);
  };

  return (
    <div className="mt-8 bg-slate-800/50 border border-slate-700/60 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-base">✏️</span>
        <h3 className="text-white font-bold text-sm">Manual Assignment</h3>
      </div>
      <p className="text-slate-500 text-xs mb-4">
        Can't find the right university in AI recommendations? Search and assign manually.
      </p>

      <div className="flex gap-2">
        {/* Search input with dropdown */}
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500"
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-4.35-4.35M17 11A6 6 0 1 0 5 11a6 6 0 0 0 12 0z" />
          </svg>
          <input
            type="text"
            placeholder="Type university name…"
            value={query}
            onChange={e => { setQuery(e.target.value); setSelected(null); setShowDropdown(true); }}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
            className="w-full bg-slate-900/80 border border-slate-700/60 text-slate-200 text-sm
              pl-9 pr-3 py-2.5 rounded-xl outline-none focus:border-indigo-500/60
              placeholder-slate-600 transition-colors"
          />
          {/* Dropdown suggestions */}
          {showDropdown && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden z-50 shadow-xl">
              {suggestions.map(u => (
                <button
                  key={u.id}
                  onMouseDown={() => handleSelect(u)}
                  className="w-full text-left px-4 py-2.5 hover:bg-slate-700/60 transition-colors"
                >
                  <p className="text-slate-200 text-sm font-semibold">{u.name}</p>
                  <p className="text-slate-500 text-xs">{u.location} · {u.type}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Assign button */}
        <button
          onClick={handleManualAssign}
          disabled={!query.trim() || isAssigning}
          className="flex-shrink-0 px-5 py-2.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-40
            disabled:cursor-not-allowed text-slate-200 hover:text-white text-sm font-bold
            rounded-xl border border-slate-600/60 hover:border-slate-500 transition-all"
        >
          Assign
        </button>
      </div>

      {/* Selected confirmation chip */}
      {selected && (
        <div className="mt-3 flex items-center gap-2 text-xs text-emerald-400">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Selected: <strong>{selected.name}</strong>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export: AIMatchingSection
// ─────────────────────────────────────────────────────────────────────────────

export default function AIMatchingSection({ challenge }) {
  const { assignUniversity } = useContext(ChallengeContext);
  const [assigningId, setAssigningId] = useState(null);
  const [toast,       setToast]       = useState(null); // { msg, type }
  const [showAll,     setShowAll]     = useState(false);

  // ── Compute matches once per challenge ────────────────────────────────────
  const allMatches = useMemo(
    () => calculateUniversityMatch(challenge, mockUniversities),
    [challenge]
  );

  // Top 3 for primary display; rest shown via "Show More"
  const topThree  = allMatches.slice(0, 3);
  const rest      = allMatches.slice(3);
  const displayed = showAll ? allMatches : topThree;

  const assignedId = challenge?.assignedUniversityId ?? null;
  const topScore   = allMatches[0]?.matchScore ?? 0;
  const avgScore   = allMatches.length
    ? Math.round(allMatches.reduce((s, m) => s + m.matchScore, 0) / allMatches.length)
    : 0;

  // ── Assign handler ────────────────────────────────────────────────────────
  const handleAssign = async (universityId, universityName) => {
    setAssigningId(universityId);
    await new Promise(r => setTimeout(r, 500)); // brief UX delay
    assignUniversity(challenge.id, universityId, universityName);
    setToast({ msg: `✓ Assigned to ${universityName}`, type: 'success' });
    setAssigningId(null);
    setTimeout(() => setToast(null), 4000);
  };

  if (!challenge) return null;

  return (
    <div className="min-h-full bg-slate-900 p-6 space-y-6">

      {/* ── Toast ─────────────────────────────────────────────────────────── */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl
          border text-sm font-semibold shadow-xl animate-in slide-in-from-right-5 duration-200
          ${toast.type === 'success'
            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
            : 'bg-red-500/15 border-red-500/30 text-red-300'
          }`}>
          {toast.type === 'success' ? '✓' : '✗'} {toast.msg}
          <button onClick={() => setToast(null)} className="ml-2 text-current opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          <span className="text-2xl">🤖</span>
          <h2 className="text-white text-xl font-extrabold tracking-tight">
            AI University Matching Engine
          </h2>
          <span className="px-2.5 py-0.5 bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 text-[10px] font-black rounded-full tracking-widest">
            BETA
          </span>
        </div>
        <p className="text-slate-400 text-sm leading-relaxed">
          Automatically ranks universities by compatibility with this challenge —
          based on required skills, labs, research areas, and proximity.
        </p>
      </div>

      {/* ── Challenge context card ────────────────────────────────────────── */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4 space-y-3">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">
              Selected Challenge
            </p>
            <p className="text-white font-extrabold text-sm leading-snug">{challenge.title}</p>
            <p className="text-slate-500 text-[11px] font-mono mt-0.5">{challenge.id}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-2.5 py-1 border rounded-full text-[11px] font-bold ${URGENCY[challenge.urgency] || URGENCY.medium}`}>
              {cap(challenge.urgency)} Urgency
            </span>
            <span className="px-2.5 py-1 bg-slate-700/80 border border-slate-600/50 text-slate-300 rounded-full text-[11px] font-semibold">
              📍 {challenge.district}
            </span>
            <span className="px-2.5 py-1 bg-slate-700/80 border border-slate-600/50 text-slate-300 rounded-full text-[11px] font-semibold">
              🏷 {fmtCat(challenge.category)}
            </span>
            {challenge.aiAnalysis?.priorityScore != null && (
              <span className="px-2.5 py-1 bg-purple-500/10 border border-purple-500/30 text-purple-300 rounded-full text-[11px] font-semibold">
                🎯 AI Score {challenge.aiAnalysis.priorityScore}/100
              </span>
            )}
          </div>
        </div>

        {/* Required skills */}
        {challenge.aiAnalysis?.requiredSkills?.length > 0 && (
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1.5">
              Required Skills
            </p>
            <div className="flex flex-wrap gap-1.5">
              {challenge.aiAnalysis.requiredSkills.map(s => (
                <span key={s} className="px-2 py-1 bg-slate-700/70 border border-slate-600/50 text-slate-300 text-[11px] rounded-lg font-medium">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Summary stats ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: '🏛',  label: 'Analysed',      value: allMatches.length },
          { icon: '⭐',  label: 'Best Match',     value: `${topScore}%`   },
          { icon: '📊',  label: 'Avg Match',      value: `${avgScore}%`   },
        ].map(s => (
          <div key={s.label}
            className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 text-center">
            <div className="text-xl mb-1">{s.icon}</div>
            <div className="text-white text-base font-black">{s.value}</div>
            <div className="text-slate-500 text-[10px] mt-0.5 uppercase tracking-wide">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Already-assigned notice ───────────────────────────────────────── */}
      {assignedId && (
        <div className="flex items-center gap-3 px-4 py-3 bg-blue-500/10 border border-blue-500/25 rounded-xl text-blue-300 text-xs font-medium">
          <span>ℹ️</span>
          <span>Challenge is already assigned. You can re-assign below if needed.</span>
        </div>
      )}

      {/* ── Section label ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-700/60" />
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">
          Top Recommendations
        </span>
        <div className="h-px flex-1 bg-slate-700/60" />
      </div>

      {/* ── Top 3 recommendation cards ───────────────────────────────────── */}
      {allMatches.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <div className="text-4xl mb-3 opacity-30">🔍</div>
          <p className="font-semibold">No matching universities found</p>
          <p className="text-xs mt-1 text-slate-600">Use the manual search below to assign directly.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayed.map((match, i) => (
            <RecommendationCard
              key={match.universityId}
              match={match}
              rank={i}
              onAssign={handleAssign}
              isAssigning={assigningId === match.universityId}
              isAssigned={assignedId === match.universityId}
            />
          ))}
        </div>
      )}

      {/* ── Show more / less toggle ───────────────────────────────────────── */}
      {rest.length > 0 && (
        <button
          onClick={() => setShowAll(v => !v)}
          className="w-full py-2.5 bg-slate-800/50 hover:bg-slate-800/80 border border-slate-700/50
            hover:border-slate-600/70 text-slate-400 hover:text-slate-200 text-xs font-bold
            rounded-xl transition-all duration-150 flex items-center justify-center gap-2"
        >
          {showAll ? (
            <><span>↑</span> Show Top 3 Only</>
          ) : (
            <><span>↓</span> Show {rest.length} More Universit{rest.length === 1 ? 'y' : 'ies'}</>
          )}
        </button>
      )}

      {/* ── Divider ───────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-700/60" />
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">
          Manual Override
        </span>
        <div className="h-px flex-1 bg-slate-700/60" />
      </div>

      {/* ── Manual fallback ───────────────────────────────────────────────── */}
      <ManualAssign
        challengeId={challenge.id}
        onAssign={handleAssign}
        isAssigning={!!assigningId}
      />

      {/* ── Engine info footer ────────────────────────────────────────────── */}
      <div className="bg-slate-800/30 border border-slate-700/30 rounded-xl px-4 py-3">
        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-2">
          Scoring Factors
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-600">
          {[
            '✓ Skill overlap (45 pts)',
            '✓ Category/domain match (20 pts)',
            '✓ Lab availability (15 pts)',
            '✓ Research alignment (10 pts)',
            '✓ Urgency bonus (7 pts)',
            '✓ Location proximity (3 pts)',
          ].map(f => <span key={f}>{f}</span>)}
        </div>
      </div>

    </div>
  );
}
