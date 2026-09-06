import { useState } from 'react'
import { Search, Filter, ThumbsUp, MapPin, TrendingUp } from 'lucide-react'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { Card } from '../components/ui/Card'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { usePublicChallenges, useEndorseChallenge } from '../hooks/useQueries'
import { CATEGORIES } from '../data/mockData'
import { getUrgencyColor } from '../utils/helpers'
import { useApp } from '../context/AppContext'

function ChallengeCard({ challenge, onEndorse }) {
  const [endorsed, setEndorsed] = useState(challenge.userEndorsed)
  const [count,    setCount]    = useState(challenge.endorseCount ?? 0)
  const cat = CATEGORIES.find(c => c.value === challenge.category)

  return (
    <Card hover className="flex flex-col gap-3">
      <div className="h-36 rounded-xl overflow-hidden bg-gray-100">
        <img src={`https://picsum.photos/seed/${challenge._id}/400/150`} alt={challenge.title}
          className="w-full h-full object-cover" />
      </div>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          <span className="text-base">{cat?.icon ?? '📌'}</span>
          <span className="text-xs text-gray-500 font-medium capitalize">
            {challenge.category?.replace(/-/g, ' ')}
          </span>
        </div>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${getUrgencyColor(challenge.urgency)}`}>
          {challenge.urgency}
        </span>
      </div>
      <div>
        <h3 className="font-semibold text-gray-800 text-sm leading-snug">{challenge.title}</h3>
        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{challenge.description}</p>
      </div>
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
        <span className="text-xs text-gray-400 flex items-center gap-1">
          <MapPin size={11} /> {challenge.district}
        </span>
        <button
          onClick={() => { if (!endorsed) { setEndorsed(true); setCount(c => c + 1); onEndorse(challenge._id) } }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
            endorsed ? 'bg-primary text-white shadow-sm' : 'border border-primary text-primary hover:bg-primary-light'
          }`}
        >
          <ThumbsUp size={12} />
          {endorsed ? 'Endorsed!' : 'I Face This Too!'} ({count})
        </button>
      </div>
    </Card>
  )
}

export default function PublicFeed() {
  const { t } = useApp()
  const [search,    setSearch]    = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [sortBy,    setSortBy]    = useState('endorseCount')
  const [page,      setPage]      = useState(1)

  const { data, isLoading } = usePublicChallenges({
    search:   search  || undefined,
    category: filterCat || undefined,
    sort:     sortBy,
    page,
    limit:    12,
  })
  const endorseMutation = useEndorseChallenge()

  const challenges = data?.challenges ?? []
  const totalPages = data?.pages ?? 1

  return (
    <DashboardLayout title={t('Public Feed', 'सार्वजनिक चुनौतियां')}>
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-12 gap-6">
          {/* Main feed */}
          <div className="col-span-12 lg:col-span-8 space-y-5">
            {/* Filters */}
            <Card className="py-3">
              <div className="flex flex-wrap gap-3 items-center">
                <div className="relative flex-1 min-w-[180px]">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" placeholder="Search by title or district..."
                    value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl
                               focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                </div>
                <div className="flex items-center gap-2">
                  <Filter size={15} className="text-gray-400" />
                  <select value={filterCat} onChange={e => { setFilterCat(e.target.value); setPage(1) }}
                    className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20">
                    <option value="">All Categories</option>
                    {CATEGORIES.map(c => (
                      <option key={c.value} value={c.value}>{c.icon} {c.label}</option>
                    ))}
                  </select>
                  <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                    className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20">
                    <option value="endorseCount">Most Endorsed</option>
                    <option value="urgency">By Urgency</option>
                    <option value="newest">Newest First</option>
                  </select>
                </div>
              </div>
            </Card>

            {/* Banner */}
            <div className="bg-gradient-to-r from-primary to-green-600 rounded-xl p-4 flex items-center gap-4 text-white">
              <ThumbsUp size={28} className="flex-shrink-0 opacity-80" />
              <div>
                <p className="font-semibold text-sm">See a problem that affects you?</p>
                <p className="text-xs opacity-80 mt-0.5">
                  Click "I Face This Too!" to endorse it — your voice raises its AI priority score and routes it to universities faster.
                </p>
              </div>
            </div>

            {/* Grid */}
            {isLoading ? (
              <LoadingSpinner text="Loading challenges..." />
            ) : challenges.length === 0 ? (
              <Card className="text-center py-16">
                <p className="text-4xl mb-3">🔍</p>
                <p className="text-gray-600 font-medium">No challenges match your filters</p>
              </Card>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {challenges.map(c => (
                    <ChallengeCard key={c._id} challenge={c}
                      onEndorse={id => endorseMutation.mutate(id)} />
                  ))}
                </div>
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-2">
                    <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                      className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors">
                      ← Prev
                    </button>
                    <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
                    <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
                      className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors">
                      Next →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Sidebar */}
          <div className="col-span-12 lg:col-span-4 space-y-4">
            <Card>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={15} className="text-primary" />
                <h3 className="font-semibold text-gray-800 text-sm">Total on Platform</h3>
              </div>
              <p className="text-3xl font-extrabold text-primary">{data?.total ?? 0}</p>
              <p className="text-xs text-gray-400 mt-1">public challenges submitted</p>
            </Card>

            <Card>
              <h3 className="font-semibold text-gray-800 text-sm mb-3">Browse by Category</h3>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setFilterCat('')}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                    filterCat === '' ? 'bg-primary text-white border-primary' : 'border-gray-200 text-gray-600 hover:border-primary hover:text-primary'
                  }`}>All</button>
                {CATEGORIES.map(c => (
                  <button key={c.value} onClick={() => setFilterCat(c.value)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                      filterCat === c.value ? 'bg-primary text-white border-primary' : 'border-gray-200 text-gray-600 hover:border-primary hover:text-primary'
                    }`}>
                    {c.icon} {c.label}
                  </button>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
