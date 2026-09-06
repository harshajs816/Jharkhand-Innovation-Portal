import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronRight, ChevronLeft, Trophy, Send,
  CheckCircle, ThumbsUp, MoreVertical, MapPin, Mic,
  TrendingUp,
} from 'lucide-react'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { StatusBadge } from '../components/ui/Badge'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import {
  useMyChallenges, useSuccessStories,
  usePublicChallenges, useEndorseChallenge, useDashboardStats,
} from '../hooks/useQueries'

/* ── Stat item ───────────────────────────────────────────────────────────── */
function StatItem({ icon, label, value }) {
  return (
    <div className="flex flex-col items-center gap-0.5 text-center">
      <div className="text-primary mb-0.5">{icon}</div>
      <p className="text-xl sm:text-2xl font-bold text-gray-800">{value ?? 0}</p>
      <p className="text-[10px] sm:text-xs text-gray-400 leading-tight">{label}</p>
    </div>
  )
}

/* ── Platform stat row ───────────────────────────────────────────────────── */
function PlatStat({ label, value, color = 'text-primary' }) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-gray-100 last:border-0">
      <span className="text-xs text-gray-600">{label}</span>
      <span className={`text-sm font-bold ${color}`}>{value}</span>
    </div>
  )
}

/* ── Success story carousel ──────────────────────────────────────────────── */
function SuccessCarousel({ stories }) {
  const [idx, setIdx] = useState(0)
  const navigate      = useNavigate()
  if (!stories?.length) return null
  const story = stories[idx]

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800 text-sm sm:text-base">Recent Success Stories</h3>
        <button onClick={() => navigate('/success-stories')}
          className="text-xs text-primary font-semibold hover:underline">
          View All
        </button>
      </div>

      {/* Thumbnails — 3 across on all sizes */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mb-3">
        {stories.map((s, i) => (
          <button key={s._id || i} onClick={() => setIdx(i)}
            className={`relative h-20 sm:h-24 rounded-xl overflow-hidden transition-all ${
              i === idx ? 'ring-2 ring-primary ring-offset-1' : 'opacity-70 hover:opacity-100'
            }`}>
            <img src={s.image} alt={s.title} className="w-full h-full object-cover" />
            {i === idx && (
              <div className="absolute inset-0 bg-primary/20 flex items-end p-1.5">
                <CheckCircle size={12} className="text-white drop-shadow" />
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Caption */}
      <div className="flex items-center gap-2">
        <button onClick={() => setIdx(i => Math.max(0, i - 1))}
          className="w-6 h-6 sm:w-7 sm:h-7 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 flex-shrink-0">
          <ChevronLeft size={13} />
        </button>
        <div className="flex-1 min-w-0 animate-fade-in">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
              <CheckCircle size={10} className="text-white" />
            </div>
            <p className="font-semibold text-gray-800 text-xs sm:text-sm truncate">{story.title}</p>
          </div>
          <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 ml-6">Impact: {story.impact}</p>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          {stories.map((_, i) => (
            <button key={i} onClick={() => setIdx(i)}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                i === idx ? 'bg-primary' : 'bg-gray-300'
              }`} />
          ))}
        </div>
        <button onClick={() => setIdx(i => Math.min(stories.length - 1, i + 1))}
          className="w-6 h-6 sm:w-7 sm:h-7 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 flex-shrink-0">
          <ChevronRight size={13} />
        </button>
      </div>
    </Card>
  )
}

/* ── Public feed card ────────────────────────────────────────────────────── */
function PublicFeedCard({ challenge, onEndorse }) {
  const [endorsed, setEndorsed] = useState(challenge.userEndorsed)
  const [count,    setCount]    = useState(challenge.endorseCount ?? challenge.endorsements?.length ?? 0)

  const handle = () => {
    if (!endorsed) { setEndorsed(true); setCount(c => c + 1); onEndorse(challenge._id) }
  }

  return (
    <div className="flex gap-3 pb-3 sm:pb-4 border-b border-gray-100 last:border-0 last:pb-0">
      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
        <img src={`https://picsum.photos/seed/${challenge._id}/64/64`} alt=""
          className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Problem Title:</p>
        <p className="text-xs sm:text-sm font-semibold text-gray-800 leading-snug line-clamp-2">{challenge.title}</p>
        <p className="text-[10px] sm:text-xs text-gray-500">Category: {challenge.category?.replace(/-/g, ' ')}</p>
        <p className="text-[10px] sm:text-xs text-gray-500">District: {challenge.district}</p>
        <button onClick={handle}
          className={`mt-1.5 flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold transition-all ${
            endorsed
              ? 'bg-primary text-white'
              : 'border border-primary text-primary hover:bg-primary-light'
          }`}>
          <ThumbsUp size={9} />
          I Face This Too! ({count})
        </button>
      </div>
    </div>
  )
}

/* ── Taglines ────────────────────────────────────────────────────────────── */
const TAGLINES = [
  { emoji: '🤝', title: 'Empowering Communities', sub: 'Creating impact through collaboration.' },
  { emoji: '🌿', title: 'Sustainable Solutions',  sub: 'Building a better & greener Jharkhand.' },
  { emoji: '💡', title: 'Innovate Together',      sub: 'Ideas today, change tomorrow.' },
  { emoji: '❤️', title: 'Stronger Jharkhand',     sub: 'United citizens, progressive state.' },
]

/* ── Main page ───────────────────────────────────────────────────────────── */
export default function Dashboard() {
  const { t }    = useApp()
  const { user } = useAuth()
  const navigate = useNavigate()

  const { data: myData,    isLoading: loadingC } = useMyChallenges({ limit: 5 })
  const { data: storyData, isLoading: loadingS } = useSuccessStories({ limit: 3 })
  const { data: feedData,  isLoading: loadingF } = usePublicChallenges({ limit: 3, sort: 'endorseCount' })
  const { data: stats }                          = useDashboardStats()
  const endorseMutation = useEndorseChallenge()

  const ongoing = (myData?.challenges ?? []).filter(c => c.status !== 'completed').slice(0, 3)
  const stories = storyData?.stories ?? []
  const pubFeed = feedData?.challenges ?? []

  return (
    <DashboardLayout title={t('Citizen Dashboard', 'नागरिक डैशबोर्ड')}>

      {/* ── Hero greeting ── */}
      <div className="relative rounded-2xl overflow-hidden mb-4 sm:mb-6"
        style={{ background: 'linear-gradient(135deg,#c8e6d4 0%,#a8d5b5 40%,#7dbf99 100%)', minHeight: 110 }}>
        <img
          src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=900&h=200&fit=crop"
          alt="" className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none"
        />
        <div className="relative z-10 p-4 sm:p-6">
          <h2 className="text-lg sm:text-2xl font-extrabold text-gray-800">
            {t(`Hello, ${user?.name ?? 'Citizen'}! 👋`, `नमस्ते, ${user?.name ?? 'नागरिक'}! 👋`)}
          </h2>
          <p className="text-gray-600 mt-1 text-xs sm:text-sm max-w-md">
            {t(
              'Welcome to Jharkhand Innovation Portal.',
              'झारखंड नवाचार पोर्टल में आपका स्वागत है।'
            )}
          </p>
        </div>
        <div className="absolute right-4 bottom-2 text-4xl sm:text-5xl opacity-10 select-none">🌾</div>
      </div>

      {/* ── Mobile: CTA row ── */}
      <div className="flex gap-2 mb-4 lg:hidden">
        <Button className="flex-1 text-sm py-2.5" onClick={() => navigate('/submit')}>
          + {t('Submit Challenge', 'चुनौती दर्ज करें')}
        </Button>
        <button
          className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center text-white flex-shrink-0"
          title="Voice Input"
        >
          <Mic size={18} />
        </button>
      </div>

      {/* ── Two-column desktop layout, single column mobile ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">

        {/* ══ LEFT ══════════════════════════════════════════════ */}
        <div className="lg:col-span-8 space-y-4 sm:space-y-5">

          {/* My Impact + Ongoing — side-by-side sm+, stacked on xs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">

            {/* My Impact */}
            <Card>
              <h3 className="font-semibold text-gray-800 mb-3 text-sm sm:text-base">My Impact</h3>
              <div className="flex items-start gap-3 sm:gap-4">
                {/* Badge icon */}
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-primary-light flex flex-col
                                items-center justify-center flex-shrink-0 border-2 border-primary/20">
                  <Trophy size={20} className="text-primary" />
                  <p className="text-[8px] sm:text-[9px] font-bold text-primary text-center mt-0.5 leading-tight px-1">
                    Community<br />Catalyst
                  </p>
                </div>
                {/* Stats */}
                <div className="grid grid-cols-3 gap-1 sm:gap-2 flex-1">
                  <StatItem icon={<Send size={13} />}        label="Submitted"  value={user?.totalSubmitted} />
                  <StatItem icon={<CheckCircle size={13} />} label="Solved"     value={user?.challengesSolved} />
                  <StatItem icon={<ThumbsUp size={13} />}    label="Upvotes"    value={user?.totalUpvotes} />
                </div>
              </div>
            </Card>

            {/* Ongoing challenges */}
            <Card>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-800 text-sm sm:text-base">Ongoing Challenges</h3>
                <button onClick={() => navigate('/my-challenges')}
                  className="text-xs text-primary font-semibold hover:underline">
                  View All
                </button>
              </div>
              {loadingC ? <LoadingSpinner size="sm" text="" /> : (
                <div className="space-y-1">
                  {ongoing.length === 0
                    ? <p className="text-xs text-gray-400 text-center py-3">No active challenges yet.</p>
                    : ongoing.map(c => (
                      <button key={c._id} onClick={() => navigate('/my-challenges')}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-gray-50 transition-colors group">
                        <span className="font-mono text-[10px] sm:text-xs font-bold text-gray-600 flex-shrink-0 truncate max-w-[90px]">
                          {c.challengeId}
                        </span>
                        <div className="flex-1 flex justify-end overflow-hidden">
                          <StatusBadge status={c.status} />
                        </div>
                        <ChevronRight size={12} className="text-gray-300 group-hover:text-gray-500 flex-shrink-0" />
                      </button>
                    ))
                  }
                </div>
              )}
            </Card>
          </div>

          {/* Success stories */}
          {loadingS ? <LoadingSpinner size="sm" /> : <SuccessCarousel stories={stories} />}

          {/* Taglines — 2 cols on mobile, 4 on md+ */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
            {TAGLINES.map(tl => (
              <div key={tl.title}
                className="bg-white rounded-2xl p-2.5 sm:p-3 flex flex-col items-center text-center border border-gray-100 gap-1">
                <span className="text-xl sm:text-2xl">{tl.emoji}</span>
                <p className="text-[10px] sm:text-xs font-semibold text-gray-700">{tl.title}</p>
                <p className="text-[9px] sm:text-[10px] text-gray-400 leading-tight hidden sm:block">{tl.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ══ RIGHT ═════════════════════════════════════════════ */}
        <div className="lg:col-span-4 space-y-4">

          {/* Desktop CTA */}
          <div className="hidden lg:flex gap-2">
            <Button className="flex-1 text-sm" onClick={() => navigate('/submit')}>
              + {t('Submit New Challenge', 'नई चुनौती')}
            </Button>
            <button className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center text-white flex-shrink-0">
              <Mic size={18} />
            </button>
          </div>

          {/* Platform stats */}
          {stats && (
            <Card>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={14} className="text-primary" />
                <h3 className="font-semibold text-gray-800 text-sm">Platform Stats</h3>
              </div>
              <PlatStat label="Total Challenges" value={stats.total}     />
              <PlatStat label="Active"           value={stats.active}    color="text-blue-600" />
              <PlatStat label="Completed"        value={stats.completed} color="text-green-600" />
            </Card>
          )}

          {/* Public challenges near you */}
          <Card>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 min-w-0">
                <MapPin size={13} className="text-primary flex-shrink-0" />
                <h3 className="font-semibold text-gray-800 text-sm truncate">
                  {t('Public Challenges Near You', 'आपके पास की चुनौतियां')}
                </h3>
              </div>
              <button className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 ml-2">
                <MoreVertical size={14} />
              </button>
            </div>

            {loadingF
              ? <LoadingSpinner size="sm" text="" />
              : pubFeed.length === 0
                ? <p className="text-sm text-gray-400 text-center py-4">No public challenges yet.</p>
                : (
                  <div className="space-y-3 sm:space-y-4">
                    {pubFeed.map(c => (
                      <PublicFeedCard key={c._id} challenge={c}
                        onEndorse={id => endorseMutation.mutate(id)} />
                    ))}
                  </div>
                )
            }

            <button onClick={() => navigate('/public-feed')}
              className="mt-3 w-full text-center text-xs text-primary font-semibold hover:underline">
              View all public challenges →
            </button>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
