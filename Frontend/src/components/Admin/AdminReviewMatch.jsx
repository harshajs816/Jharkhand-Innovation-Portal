import { useContext, useState } from 'react';
import { ChallengeContext } from '../../context/ChallengeContext';
import AIMatchingSection from './AIMatchingSection';

const STATUS_LABELS = {
  'submitted':           { label: 'Submitted',           dot: 'bg-yellow-400' },
  'ai-analysis':         { label: 'AI Analysis',         dot: 'bg-purple-400' },
  'under-review':        { label: 'Under Review',        dot: 'bg-blue-400'   },
  'validated':           { label: 'Validated',           dot: 'bg-teal-400'   },
  'university-matching': { label: 'Matching',            dot: 'bg-indigo-400' },
  'university-accepted': { label: 'Accepted',            dot: 'bg-emerald-400'},
};

const URGENCY_COLOR = {
  critical: 'text-red-400',
  high:     'text-orange-400',
  medium:   'text-yellow-400',
  low:      'text-green-400',
};

export default function AdminReviewMatch() {
  const { challenges } = useContext(ChallengeContext);
  const [selectedId,    setSelectedId]    = useState(null);
  const [searchQuery,   setSearchQuery]   = useState('');

  // Challenges that need admin attention (not yet deployed/completed)
  const reviewable = challenges.filter(c =>
    ['submitted', 'ai-analysis', 'under-review', 'validated', 'university-matching'].includes(c.status)
  );

  const filtered = reviewable.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeChallenge = challenges.find(c => c.id === selectedId);

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden font-sans">

      {/* ── Left panel: challenge list ──────────────────────────────────────── */}
      <div className="w-80 flex-shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col">
        {/* Header */}
        <div className="px-4 pt-5 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">📋</span>
            <h2 className="text-white font-extrabold text-sm tracking-wide">
              PENDING REVIEW
            </h2>
            <span className="ml-auto bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-xs font-bold px-2 py-0.5 rounded-full">
              {reviewable.length}
            </span>
          </div>
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 0 5 11a6 6 0 0 0 12 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search challenges…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800/70 border border-slate-700/60 text-slate-200 text-xs
                pl-8 pr-3 py-2 rounded-lg outline-none focus:border-indigo-500/60 placeholder-slate-600
                transition-colors"
            />
          </div>
        </div>

        {/* Challenge list */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-slate-600 text-sm">
              No challenges found
            </div>
          ) : (
            filtered.map(c => {
              const st = STATUS_LABELS[c.status] || { label: c.status, dot: 'bg-slate-400' };
              const isActive = selectedId === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  className={`
                    w-full text-left px-4 py-3 border-b border-slate-800/60
                    transition-all duration-150
                    ${isActive
                      ? 'bg-indigo-600/15 border-l-2 border-l-indigo-500'
                      : 'hover:bg-slate-800/50 border-l-2 border-l-transparent'
                    }
                  `}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className={`text-xs font-bold leading-snug line-clamp-2 ${isActive ? 'text-white' : 'text-slate-300'}`}>
                      {c.title}
                    </p>
                    <span className={`flex-shrink-0 text-xs font-semibold ${URGENCY_COLOR[c.urgency] || 'text-slate-400'}`}>
                      {c.urgency?.toUpperCase().slice(0, 4)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${st.dot}`} />
                    <span className="text-xs text-slate-500">{st.label}</span>
                    <span className="text-xs text-slate-600 ml-auto">📍 {c.district}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5 font-mono">{c.id}</p>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── Right panel: AI matching ────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {activeChallenge ? (
          <AIMatchingSection challenge={activeChallenge} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-600 select-none">
            <div className="text-6xl mb-4 opacity-30">🎓</div>
            <p className="text-lg font-bold text-slate-500">Select a challenge</p>
            <p className="text-sm text-slate-600 mt-1">
              Choose from the list on the left to view AI university recommendations.
            </p>
            <div className="mt-6 flex flex-col gap-2 text-xs text-slate-700 max-w-xs text-center">
              <p>The AI engine scores each university based on:</p>
              <div className="flex flex-wrap gap-2 justify-center mt-2">
                {['Skill Overlap','Lab Availability','Research Alignment','Urgency Bonus','Location Proximity'].map(t => (
                  <span key={t} className="px-2.5 py-1 bg-slate-800/80 border border-slate-700/60 text-slate-500 rounded-full">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
