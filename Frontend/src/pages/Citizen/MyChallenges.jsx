import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronRight, ChevronLeft, Search, Filter, MapPin,
  Calendar, Users, ArrowUpRight, CheckCircle, Clock,
  Bot, Trash2, AlertTriangle,
} from 'lucide-react'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { StatusBadge } from '../../components/ui/Badge'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { useMyChallenges, useChallengeById, useDeleteChallenge } from '../../hooks/useQueries'
import { CHALLENGE_STATUSES } from '../../data/mockData'
import { formatDate, getUrgencyColor, getStatusIndex } from '../../utils/helpers'
import { useApp } from '../../context/AppContext'

/* ── Timeline ────────────────────────────────────────────────────────────── */
function StatusTimeline({ currentStatus, timeline }) {
  const currentIdx = getStatusIndex(currentStatus, CHALLENGE_STATUSES)
  return (
    <div className="relative">
      <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-gray-100" />
      <div className="space-y-0">
        {CHALLENGE_STATUSES.map((s, i) => {
          const done   = i < currentIdx
          const active = i === currentIdx
          const log    = timeline?.find(t => t.status === s.key)
          return (
            <div key={s.key} className="flex gap-4 pb-1">
              <div className="relative flex flex-col items-center z-10">
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                  done   ? 'bg-primary border-primary'
                  : active ? 'bg-white border-primary shadow-sm'
                           : 'bg-white border-gray-200'
                }`}>
                  {done   && <CheckCircle size={14} className="text-white" />}
                  {active && <Clock size={14} className="text-primary animate-pulse" />}
                  {!done && !active && <span className="w-2 h-2 rounded-full bg-gray-200" />}
                </div>
              </div>
              <div className={`flex-1 pb-4 ${i > currentIdx && !log ? 'opacity-40' : ''}`}>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-sm font-semibold ${
                    active ? 'text-primary' : done ? 'text-gray-700' : 'text-gray-400'
                  }`}>{s.label}</span>
                  {active && (
                    <span className="text-[10px] bg-primary-light text-primary font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                      Current
                    </span>
                  )}
                  {log?.date && (
                    <span className="text-xs text-gray-400 ml-auto">{formatDate(log.date)}</span>
                  )}
                </div>
                {log?.note && <p className="text-xs text-gray-500 mt-0.5">{log.note}</p>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ── AI panel ────────────────────────────────────────────────────────────── */
function AIPanel({ ai }) {
  if (!ai) return (
    <Card className="bg-purple-50 border-purple-100">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center">
          <Bot size={16} className="text-white" />
        </div>
        <h4 className="font-semibold text-gray-700">AI Analysis</h4>
      </div>
      <p className="text-sm text-gray-500">Analysis pending. Will be available shortly after submission.</p>
    </Card>
  )
  return (
    <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-100">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center">
            <Bot size={16} className="text-white" />
          </div>
          <h4 className="font-semibold text-gray-800">AI Analysis Report</h4>
        </div>
        <span className="text-xs text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full font-medium">Simulated</span>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white rounded-xl p-3">
          <p className="text-xs text-gray-500 mb-1">Priority Score</p>
          <div className="flex items-end gap-1">
            <span className="text-2xl font-bold text-primary">{ai.priorityScore}</span>
            <span className="text-sm text-gray-400 mb-0.5">/100</span>
          </div>
          <div className="mt-2 bg-gray-100 rounded-full h-2">
            <div className="bg-primary rounded-full h-2 progress-animate" style={{ width: `${ai.priorityScore}%` }} />
          </div>
        </div>
        <div className="bg-white rounded-xl p-3">
          <p className="text-xs text-gray-500 mb-1">Severity</p>
          <span className={`font-bold text-lg ${
            ai.severity === 'Critical' ? 'text-red-600'
            : ai.severity === 'High'   ? 'text-orange-500'
            : ai.severity === 'Medium' ? 'text-yellow-600'
                                       : 'text-green-600'
          }`}>{ai.severity}</span>
          <p className="text-xs text-gray-400 mt-1 truncate">{ai.category}</p>
        </div>
      </div>
      <div className="bg-white rounded-xl p-3 mb-3">
        <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Users size={12} /> Estimated Impact</p>
        <p className="text-sm text-gray-700">{ai.estimatedImpact}</p>
      </div>
      <div className="mb-3">
        <p className="text-xs text-gray-500 mb-2 font-medium">Required Skills</p>
        <div className="flex flex-wrap gap-1.5">
          {ai.requiredSkills?.map(s => (
            <span key={s} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{s}</span>
          ))}
        </div>
      </div>
      <div className="mb-3">
        <p className="text-xs text-gray-500 mb-2 font-medium">Suggested Solutions</p>
        <ul className="space-y-1">
          {ai.suggestedSolutions?.map(s => (
            <li key={s} className="text-xs text-gray-600 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" /> {s}
            </li>
          ))}
        </ul>
      </div>
      {ai.duplicatesFound > 0 && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
          <AlertTriangle size={16} className="text-amber-500 flex-shrink-0" />
          <p className="text-xs text-amber-700">
            <strong>{ai.duplicatesFound} similar challenges found.</strong> Admin may merge duplicates.
          </p>
        </div>
      )}
    </Card>
  )
}

/* ── Challenge detail ────────────────────────────────────────────────────── */
function ChallengeDetail({ id, onBack }) {
  const { data: challenge, isLoading } = useChallengeById(id)

  if (isLoading) return <LoadingSpinner text="Loading challenge..." />
  if (!challenge) return <div className="text-center py-20 text-gray-400">Challenge not found.</div>

  return (
    <div className="space-y-5">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-primary hover:underline">
        <ChevronLeft size={16} /> Back to My Challenges
      </button>
      <Card>
        <div className="flex items-start gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="font-mono text-sm font-bold text-primary bg-primary-light px-2.5 py-0.5 rounded">
                {challenge.challengeId}
              </span>
              <StatusBadge status={challenge.status} />
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${getUrgencyColor(challenge.urgency)}`}>
                {challenge.urgency}
              </span>
            </div>
            <h2 className="text-lg font-bold text-gray-800">{challenge.title}</h2>
            <p className="text-sm text-gray-500 mt-1">{challenge.description}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-gray-500 border-t border-gray-100 pt-3">
          <span className="flex items-center gap-1"><MapPin size={14} /> {challenge.district}{challenge.city ? `, ${challenge.city}` : ''}</span>
          <span className="flex items-center gap-1"><Users size={14} /> {challenge.affectedPeople?.toLocaleString()} affected</span>
          <span className="flex items-center gap-1"><Calendar size={14} /> {formatDate(challenge.createdAt)}</span>
        </div>
      </Card>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <h3 className="font-semibold text-gray-800 mb-5">Challenge Lifecycle</h3>
          <StatusTimeline currentStatus={challenge.status} timeline={challenge.timeline} />
        </Card>
        <AIPanel ai={challenge.aiAnalysis} />
      </div>
    </div>
  )
}

/* ── Challenge card ──────────────────────────────────────────────────────── */
function ChallengeCard({ challenge, onClick, onDelete }) {
  const pct = Math.round(
    ((getStatusIndex(challenge.status, CHALLENGE_STATUSES) + 1) / CHALLENGE_STATUSES.length) * 100
  )
  return (
    <Card hover className="cursor-pointer" onClick={onClick}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-mono text-xs font-bold text-primary bg-primary-light px-2 py-0.5 rounded">
              {challenge.challengeId}
            </span>
            <StatusBadge status={challenge.status} />
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${getUrgencyColor(challenge.urgency)}`}>
              {challenge.urgency}
            </span>
          </div>
          <h3 className="font-semibold text-gray-800 truncate">{challenge.title}</h3>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={e => { e.stopPropagation(); onDelete(challenge._id) }}
            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors"
            title="Delete challenge"
          >
            <Trash2 size={14} />
          </button>
          <ArrowUpRight size={16} className="text-gray-400" />
        </div>
      </div>
      <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-3">
        <span className="flex items-center gap-1"><MapPin size={12} /> {challenge.district}</span>
        <span className="flex items-center gap-1"><Users size={12} /> {challenge.affectedPeople?.toLocaleString()}</span>
        <span className="flex items-center gap-1"><Calendar size={12} /> {formatDate(challenge.createdAt)}</span>
      </div>
      <div>
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>Progress</span><span>{pct}%</span>
        </div>
        <div className="bg-gray-100 rounded-full h-1.5">
          <div className="bg-primary rounded-full h-1.5 progress-animate" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </Card>
  )
}

/* ── Main page ───────────────────────────────────────────────────────────── */
export default function MyChallenges() {
  const { t } = useApp()
  const [selectedId, setSelectedId] = useState(null)
  const [search,     setSearch]     = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  const { data, isLoading } = useMyChallenges({ status: filterStatus !== 'all' ? filterStatus : undefined })
  const deleteMutation = useDeleteChallenge()

  const challenges = data?.challenges ?? []
  const filtered = challenges.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.challengeId?.includes(search)
  )

  if (selectedId) {
    return (
      <DashboardLayout title={t('Challenge Detail', 'चुनौती विवरण')}>
        <div className="max-w-5xl mx-auto">
          <ChallengeDetail id={selectedId} onBack={() => setSelectedId(null)} />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title={t('My Challenges', 'मेरी चुनौतियां')}>
      <div className="max-w-5xl mx-auto space-y-5">
        {/* Filters */}
        <Card className="py-3">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search by title or ID..."
                value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl
                           focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={15} className="text-gray-400" />
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option value="all">All Statuses</option>
                {CHALLENGE_STATUSES.map(s => (
                  <option key={s.key} value={s.key}>{s.label}</option>
                ))}
              </select>
            </div>
            <Button size="sm" onClick={() => window.location.href = '/submit'}>+ New Challenge</Button>
          </div>
        </Card>

        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total',     count: data?.total ?? 0,                                                                   color: 'text-gray-700', bg: 'bg-white' },
            { label: 'Active',    count: challenges.filter(c => !['completed'].includes(c.status)).length,                   color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Completed', count: challenges.filter(c => c.status === 'completed').length,                            color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Critical',  count: challenges.filter(c => c.urgency === 'critical').length,                            color: 'text-red-600', bg: 'bg-red-50' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-2xl p-4 border border-gray-100 text-center`}>
              <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* List */}
        {isLoading ? (
          <LoadingSpinner text="Loading your challenges..." />
        ) : filtered.length === 0 ? (
          <Card className="text-center py-16">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-gray-600 font-medium">No challenges found</p>
            <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filters</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map(c => (
              <ChallengeCard
                key={c._id}
                challenge={c}
                onClick={() => setSelectedId(c._id)}
                onDelete={id => { if (confirm('Delete this challenge?')) deleteMutation.mutate(id) }}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
