import { useState } from 'react'
import { CheckCircle, Award, Calendar, GraduationCap, Building2, MapPin, Users } from 'lucide-react'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { Card } from '../components/ui/Card'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { useSuccessStories } from '../hooks/useQueries'
import { formatDate } from '../utils/helpers'
import { useApp } from '../context/AppContext'

const CAT_FILTERS = ['All','Agriculture','Sanitation','Energy','Healthcare','Education','Water Management']

function StoryCard({ story }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <Card hover className="overflow-hidden p-0 flex flex-col">
      <div className="relative h-48 bg-gray-100">
        <img src={story.image} alt={story.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-3 left-4 right-4">
          <span className="text-[10px] bg-accent text-white font-semibold px-2 py-0.5 rounded-full uppercase">
            {story.category}
          </span>
          <h3 className="text-white font-bold text-sm leading-tight mt-1">{story.title}</h3>
        </div>
        <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-lg">
          <CheckCircle size={16} className="text-white" />
        </div>
      </div>
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-3 bg-primary-light rounded-lg px-3 py-2">
          <Award size={16} className="text-primary" />
          <span className="text-sm font-semibold text-primary">{story.impact}</span>
        </div>
        <p className={`text-sm text-gray-600 ${expanded ? '' : 'line-clamp-2'}`}>{story.description}</p>
        <button onClick={() => setExpanded(e => !e)}
          className="text-xs text-primary font-medium mt-1 hover:underline self-start">
          {expanded ? 'Show less' : 'Read more'}
        </button>
        <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2 text-xs text-gray-500">
          <span className="flex items-center gap-1"><MapPin size={11} /> {story.district}</span>
          <span className="flex items-center gap-1"><Calendar size={11} /> {formatDate(story.completedDate)}</span>
          <span className="flex items-center gap-1 truncate"><GraduationCap size={11} /> {story.university}</span>
          <span className="flex items-center gap-1 truncate"><Building2 size={11} /> {story.industry}</span>
        </div>
      </div>
    </Card>
  )
}

export default function SuccessStories() {
  const { t } = useApp()
  const [activeCat, setActiveCat] = useState('All')

  const { data, isLoading } = useSuccessStories({
    category: activeCat !== 'All' ? activeCat : undefined,
  })
  const stories = data?.stories ?? []

  return (
    <DashboardLayout title={t('Success Stories', 'सफलता की कहानियां')}>
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Hero */}
        <div className="relative rounded-2xl overflow-hidden"
          style={{ background: 'linear-gradient(135deg,#1a6b3c 0%,#2d8a55 100%)', minHeight: 140 }}>
          <img src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=1000&fit=crop"
            alt="" className="absolute inset-0 w-full h-full object-cover opacity-10 pointer-events-none" />
          <div className="relative p-7">
            <div className="flex items-center gap-3 mb-2">
              <Award size={28} className="text-accent" />
              <h2 className="text-2xl font-bold text-white">{t('Success Stories', 'सफलता की कहानियां')}</h2>
            </div>
            <p className="text-green-200 max-w-xl text-sm">
              Real problems solved through citizen reporting, university research, and industry collaboration.
            </p>
            <div className="flex flex-wrap gap-6 mt-4">
              {[
                { label: 'Challenges Solved', value: data?.total ?? '—' },
                { label: 'Universities',      value: '14+' },
                { label: 'Industry Partners', value: '31+' },
                { label: 'Citizens Impacted', value: '1.2L+' },
              ].map(s => (
                <div key={s.label}>
                  <p className="text-2xl font-bold text-white">{s.value}</p>
                  <p className="text-xs text-green-300">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap gap-2">
          {CAT_FILTERS.map(cat => (
            <button key={cat} onClick={() => setActiveCat(cat)}
              className={`text-sm px-4 py-1.5 rounded-full border font-medium transition-all ${
                activeCat === cat
                  ? 'bg-primary text-white border-primary'
                  : 'border-gray-200 text-gray-600 hover:bg-primary hover:text-white hover:border-primary'
              }`}>
              {cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        {isLoading ? (
          <LoadingSpinner text="Loading success stories..." />
        ) : stories.length === 0 ? (
          <Card className="text-center py-16">
            <p className="text-4xl mb-3">🏆</p>
            <p className="text-gray-600 font-medium">No success stories yet for this category.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {stories.map(s => <StoryCard key={s._id} story={s} />)}
          </div>
        )}

        {/* CTA */}
        <Card className="text-center bg-primary-light border-primary/20">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Users size={20} className="text-primary" />
            <h3 className="font-semibold text-gray-800">Your challenge could be next!</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Submit a community challenge today and connect with universities and industry to find solutions.
          </p>
          <a href="/submit" className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-primary-dark transition-colors">
            Submit a Challenge →
          </a>
        </Card>
      </div>
    </DashboardLayout>
  )
}
