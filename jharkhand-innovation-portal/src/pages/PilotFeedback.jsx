import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Star, CheckCircle, Calendar, GraduationCap, AlertCircle } from 'lucide-react'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { usePilotFeedbacks, useSubmitPilotFeedback } from '../hooks/useQueries'
import { formatDate } from '../utils/helpers'
import { useApp } from '../context/AppContext'

const schema = z.object({
  overallRating:       z.number({ required_error: 'Please rate overall' }).min(1).max(5),
  effectivenessScore:  z.number().min(1).max(5).optional(),
  usabilityScore:      z.number().min(1).max(5).optional(),
  sustainabilityScore: z.number().min(1).max(5).optional(),
  actualImpact:        z.string().min(20, 'Describe the impact in at least 20 characters'),
  improvements:        z.string().optional(),
  wouldRecommend:      z.enum(['yes','no','maybe'], { required_error: 'Please select one' }),
})

function StarRating({ value = 0, onChange, label }) {
  const [hover, setHover] = useState(0)
  return (
    <div>
      {label && <p className="text-sm font-medium text-gray-700 mb-1.5">{label}</p>}
      <div className="flex gap-1">
        {[1,2,3,4,5].map(n => (
          <button key={n} type="button"
            onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)}
            onClick={() => onChange(n)}
            className="transition-transform hover:scale-110">
            <Star size={24} className={`transition-colors ${
              n <= (hover || value) ? 'fill-accent text-accent' : 'text-gray-300'
            }`} />
          </button>
        ))}
        <span className="ml-2 text-sm text-gray-500 self-center">
          {['','Poor','Fair','Good','Very Good','Excellent'][hover || value] ?? ''}
        </span>
      </div>
    </div>
  )
}

function FeedbackForm({ feedback, onClose }) {
  const [done, setDone] = useState(false)
  const submitMutation  = useSubmitPilotFeedback()

  const { control, register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { wouldRecommend: 'yes' },
  })

  const onSubmit = async (data) => {
    await submitMutation.mutateAsync({ ...data, challengeId: feedback.challengeId })
    setDone(true)
  }

  if (done) return (
    <Card className="text-center py-12">
      <div className="w-16 h-16 rounded-full bg-primary-light flex items-center justify-center mx-auto mb-4">
        <CheckCircle size={32} className="text-primary" />
      </div>
      <h3 className="text-xl font-bold text-gray-800 mb-2">Thank you for your feedback!</h3>
      <p className="text-gray-500 text-sm mb-5">Your response helps measure real community impact and improve future solutions.</p>
      <Button variant="secondary" onClick={onClose}>Back to Feedback List</Button>
    </Card>
  )

  return (
    <Card>
      <div className="mb-5">
        <button onClick={onClose} className="text-xs text-primary hover:underline mb-3">← Back</button>
        <h2 className="text-lg font-bold text-gray-800 mb-1">Rate the Deployed Solution</h2>
        <p className="text-sm text-gray-500">Challenge: <strong>{feedback.challengeTitle}</strong></p>
        <p className="text-sm text-gray-500">Solution: {feedback.solution}</p>
        <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
          <GraduationCap size={13} /> {feedback.university} · Deployed {formatDate(feedback.deployedDate)}
        </p>
      </div>

      {submitMutation.isError && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-5">
          <AlertCircle size={16} className="flex-shrink-0" />
          {submitMutation.error?.response?.data?.message || 'Submission failed. Please try again.'}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-primary-light rounded-xl p-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">Overall Satisfaction</p>
          <Controller control={control} name="overallRating"
            render={({ field }) => <StarRating value={field.value} onChange={field.onChange} label="Overall Rating *" />} />
          {errors.overallRating && (
            <p className="text-xs text-red-500 mt-1">{errors.overallRating.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { name: 'effectivenessScore',  label: 'Effectiveness' },
            { name: 'usabilityScore',      label: 'Ease of Use' },
            { name: 'sustainabilityScore', label: 'Sustainability' },
          ].map(({ name, label }) => (
            <div key={name} className="bg-gray-50 rounded-xl p-3">
              <Controller control={control} name={name}
                render={({ field }) => <StarRating value={field.value} onChange={field.onChange} label={label} />} />
            </div>
          ))}
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">
            Actual On-Ground Impact <span className="text-red-500">*</span>
          </label>
          <textarea rows={4} placeholder="Describe what actually changed on the ground after this solution was implemented..."
            className={`w-full px-3 py-2.5 text-sm border rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary ${errors.actualImpact ? 'border-red-300' : 'border-gray-200'}`}
            {...register('actualImpact')} />
          {errors.actualImpact && <p className="text-xs text-red-500 mt-1">{errors.actualImpact.message}</p>}
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">Suggestions for Improvement</label>
          <textarea rows={3} placeholder="What could be done better?"
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary"
            {...register('improvements')} />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">
            Would you recommend this solution to other communities?
          </label>
          <div className="flex gap-4 flex-wrap">
            {[
              { value: 'yes',   label: '✅ Yes, definitely' },
              { value: 'maybe', label: '🤔 Maybe' },
              { value: 'no',    label: '❌ No' },
            ].map(opt => (
              <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" value={opt.value} className="accent-primary" {...register('wouldRecommend')} />
                <span className="text-sm text-gray-700">{opt.label}</span>
              </label>
            ))}
          </div>
          {errors.wouldRecommend && <p className="text-xs text-red-500 mt-1">{errors.wouldRecommend.message}</p>}
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={submitMutation.isPending}>
            {submitMutation.isPending
              ? <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting...
                </span>
              : 'Submit Feedback'}
          </Button>
        </div>
      </form>
    </Card>
  )
}

export default function PilotFeedback() {
  const { t } = useApp()
  const [selected, setSelected] = useState(null)
  const { data: feedbacks, isLoading } = usePilotFeedbacks()

  if (selected) return (
    <DashboardLayout title={t('Pilot Feedback', 'पायलट फीडबैक')}>
      <div className="max-w-2xl mx-auto">
        <FeedbackForm feedback={selected} onClose={() => setSelected(null)} />
      </div>
    </DashboardLayout>
  )

  const pending   = feedbacks?.filter(f => !f.submitted) ?? []
  const completed = feedbacks?.filter(f =>  f.submitted) ?? []

  return (
    <DashboardLayout title={t('Pilot Feedback', 'पायलट फीडबैक')}>
      <div className="max-w-3xl mx-auto space-y-5">
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-5">
          <h3 className="font-semibold text-amber-800 flex items-center gap-2 mb-1">
            <Star size={18} className="text-amber-500" /> Rate Deployed Solutions
          </h3>
          <p className="text-sm text-amber-700">
            Your feedback on deployed solutions measures true community impact and helps universities improve future innovations.
          </p>
        </div>

        {/* Pending */}
        <div>
          <h3 className="font-semibold text-gray-800 mb-3">
            Pending Feedback <span className="text-sm font-normal text-gray-400">({pending.length})</span>
          </h3>
          {isLoading ? <LoadingSpinner text="Loading..." /> : (
            pending.length === 0 ? (
              <Card className="text-center py-10">
                <p className="text-3xl mb-2">✅</p>
                <p className="text-gray-600 font-medium">All feedback submitted!</p>
                <p className="text-sm text-gray-400 mt-1">No pending requests.</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {pending.map(f => (
                  <Card key={f.id} className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-mono text-xs font-bold text-primary bg-primary-light px-2 py-0.5 rounded">
                          {f.challengeId}
                        </span>
                        <span className="text-xs bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded-full">
                          Feedback Due
                        </span>
                      </div>
                      <h4 className="font-semibold text-gray-800 text-sm truncate">{f.challengeTitle}</h4>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{f.solution}</p>
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-400">
                        <span className="flex items-center gap-1"><GraduationCap size={11} /> {f.university}</span>
                        <span className="flex items-center gap-1"><Calendar size={11} /> Deployed {formatDate(f.deployedDate)}</span>
                      </div>
                    </div>
                    <Button size="sm" onClick={() => setSelected(f)}>Give Feedback</Button>
                  </Card>
                ))}
              </div>
            )
          )}
        </div>

        {/* Completed */}
        {completed.length > 0 && (
          <div>
            <h3 className="font-semibold text-gray-800 mb-3">
              Feedback Submitted <span className="text-sm font-normal text-gray-400">({completed.length})</span>
            </h3>
            <div className="space-y-3">
              {completed.map(f => (
                <Card key={f.id} className="flex items-center gap-4 opacity-70">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle size={16} className="text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-700 text-sm truncate">{f.challengeTitle}</p>
                    <p className="text-xs text-gray-400">{f.challengeId} · Feedback submitted</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
