import { useState, useRef, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import {
  MapPin, Upload, Mic, MicOff, ChevronRight, ChevronLeft,
  CheckCircle, AlertCircle, FileText, Image, Video, X, Info,
} from 'lucide-react'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { useApp } from '../../context/AppContext'
import { useSubmitChallenge } from '../../hooks/useQueries'
import { CATEGORIES, SUBCATEGORIES, JHARKHAND_DISTRICTS } from '../../data/mockData'
import { generateChallengeId } from '../../utils/helpers'

// ── Zod schemas per step ─────────────────────────────────────────────────────
const step1Schema = z.object({
  title:       z.string().min(10, 'Title must be at least 10 characters'),
  description: z.string().min(30, 'Please describe the problem in at least 30 characters'),
  category:    z.string().min(1, 'Select a category'),
  subCategory: z.string().min(1, 'Select a sub-category'),
  urgency:     z.enum(['low','medium','high','critical'], { required_error: 'Select urgency level' }),
})

const step2Schema = z.object({
  district:        z.string().min(1, 'Select a district'),
  city:            z.string().min(2, 'Enter city or village name'),
  address:         z.string().min(5, 'Enter address'),
  affectedPeople:  z.coerce.number().min(1, 'Enter number of people affected').max(10000000),
  latitude:        z.coerce.number().optional(),
  longitude:       z.coerce.number().optional(),
})

const step3Schema = z.object({
  existingAttempts:   z.string().optional(),
  expectedSolution:   z.string().min(1, 'Select expected solution type'),
})

const STEPS = [
  { id: 1, label: 'Problem Details',   labelHi: 'समस्या विवरण' },
  { id: 2, label: 'Location & Impact', labelHi: 'स्थान और प्रभाव' },
  { id: 3, label: 'Context & Media',   labelHi: 'संदर्भ और मीडिया' },
  { id: 4, label: 'Review & Submit',   labelHi: 'समीक्षा और सबमिट' },
]

const SOLUTION_TYPES = [
  'Technology-based solution','Policy/Regulatory change','Community intervention',
  'Infrastructure development','Research & Study','Awareness campaign',
  'Financial/Funding support','Other',
]

const URGENCY_OPTIONS = [
  { value: 'low',      label: 'Low',      color: 'border-green-300  bg-green-50  text-green-700',  dot: 'bg-green-500' },
  { value: 'medium',   label: 'Medium',   color: 'border-yellow-300 bg-yellow-50 text-yellow-700', dot: 'bg-yellow-500' },
  { value: 'high',     label: 'High',     color: 'border-orange-300 bg-orange-50 text-orange-700', dot: 'bg-orange-500' },
  { value: 'critical', label: 'Critical', color: 'border-red-300    bg-red-50    text-red-700',     dot: 'bg-red-500' },
]

// ── Field wrapper ─────────────────────────────────────────────────────────────
function Field({ label, error, required, children, hint }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <AlertCircle size={12} /> {error}
        </p>
      )}
    </div>
  )
}

// ── Input ─────────────────────────────────────────────────────────────────────
function Input({ error, className = '', ...props }) {
  return (
    <input
      className={`w-full px-3 py-2.5 text-sm border rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-[#1a6b3c]/30 focus:border-[#1a6b3c] ${
        error ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white hover:border-gray-300'
      } ${className}`}
      {...props}
    />
  )
}

function Textarea({ error, rows = 4, ...props }) {
  return (
    <textarea
      rows={rows}
      className={`w-full px-3 py-2.5 text-sm border rounded-lg resize-none transition-all focus:outline-none focus:ring-2 focus:ring-[#1a6b3c]/30 focus:border-[#1a6b3c] ${
        error ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
      {...props}
    />
  )
}

function Select({ error, children, ...props }) {
  return (
    <select
      className={`w-full px-3 py-2.5 text-sm border rounded-lg bg-white transition-all focus:outline-none focus:ring-2 focus:ring-[#1a6b3c]/30 focus:border-[#1a6b3c] ${
        error ? 'border-red-300' : 'border-gray-200 hover:border-gray-300'
      }`}
      {...props}
    >
      {children}
    </select>
  )
}

// ── Map picker (Leaflet lazy-loaded) ─────────────────────────────────────────
function MapPicker({ lat, lng, onSelect }) {
  const mapRef    = useRef(null)
  const mapInst   = useRef(null)
  const markerRef = useRef(null)

  useEffect(() => {
    if (mapInst.current) return
    import('leaflet').then(L => {
      delete L.Icon.Default.prototype._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })
      const map = L.map(mapRef.current).setView([23.6102, 85.2799], 7)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map)
      mapInst.current = map

      map.on('click', e => {
        const { lat, lng } = e.latlng
        if (markerRef.current) markerRef.current.setLatLng([lat, lng])
        else markerRef.current = L.marker([lat, lng]).addTo(map)
        onSelect(lat.toFixed(6), lng.toFixed(6))
      })

      if (lat && lng) {
        markerRef.current = L.marker([lat, lng]).addTo(map)
        map.setView([lat, lng], 12)
      }
    })
    return () => {
      if (mapInst.current) { mapInst.current.remove(); mapInst.current = null }
    }
  }, [])

  return (
    <div>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div ref={mapRef} style={{ height: 280, borderRadius: 10, zIndex: 0 }} />
      <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
        <Info size={12} /> Click on the map to pin exact location
      </p>
    </div>
  )
}

// ── File upload zone ─────────────────────────────────────────────────────────
function FileUploadZone({ accept, label, icon: Icon, files, onAdd, onRemove }) {
  const inputRef = useRef()
  return (
    <div>
      <input ref={inputRef} type="file" accept={accept} multiple className="hidden"
        onChange={e => { Array.from(e.target.files).forEach(f => onAdd(f)); e.target.value = '' }} />
      <button
        type="button"
        onClick={() => inputRef.current.click()}
        className="w-full border-2 border-dashed border-gray-200 rounded-xl p-4 hover:border-[#1a6b3c] hover:bg-[#e8f5ee]/30 transition-all flex flex-col items-center gap-2 text-gray-400 hover:text-[#1a6b3c]"
      >
        <Icon size={22} />
        <span className="text-sm font-medium">{label}</span>
        <span className="text-xs">Click to browse</span>
      </button>
      {files.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {files.map((f, i) => (
            <div key={i} className="flex items-center gap-1.5 bg-gray-100 rounded-lg px-2 py-1">
              <span className="text-xs text-gray-600 max-w-[120px] truncate">{f.name}</span>
              <button type="button" onClick={() => onRemove(i)}>
                <X size={12} className="text-gray-400 hover:text-red-500" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Voice input hook ─────────────────────────────────────────────────────────
function useVoiceInput(onResult) {
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef(null)

  const start = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Voice input not supported in this browser. Try Chrome.')
      return
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const r = new SR()
    r.lang = 'hi-IN'
    r.interimResults = false
    r.onresult = e => onResult(e.results[0][0].transcript)
    r.onend = () => setListening(false)
    r.start()
    recognitionRef.current = r
    setListening(true)
  }

  const stop = () => {
    recognitionRef.current?.stop()
    setListening(false)
  }

  return { listening, start, stop }
}

// ── Step progress bar ─────────────────────────────────────────────────────────
function StepBar({ current, steps, t }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((s, i) => {
        const done    = current > s.id
        const active  = current === s.id
        return (
          <div key={s.id} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                done   ? 'bg-[#1a6b3c] border-[#1a6b3c] text-white'
                : active ? 'bg-white border-[#1a6b3c] text-[#1a6b3c]'
                         : 'bg-gray-100 border-gray-200 text-gray-400'
              }`}>
                {done ? <CheckCircle size={16} /> : s.id}
              </div>
              <span className={`text-xs mt-1 font-medium whitespace-nowrap ${active ? 'text-[#1a6b3c]' : done ? 'text-gray-600' : 'text-gray-400'}`}>
                {t(s.label, s.labelHi)}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 mb-5 transition-all ${done ? 'bg-[#1a6b3c]' : 'bg-gray-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Review row ─────────────────────────────────────────────────────────────────
function ReviewRow({ label, value }) {
  if (!value) return null
  return (
    <div className="flex gap-3 py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500 w-40 flex-shrink-0">{label}</span>
      <span className="text-sm font-medium text-gray-800">{String(value)}</span>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function SubmitChallenge() {
  const { t } = useApp()
  const navigate = useNavigate()
  const submitMutation = useSubmitChallenge()

  const [step, setStep]           = useState(1)
  const [formData, setFormData]   = useState({})
  const [photos, setPhotos]       = useState([])
  const [videos, setVideos]       = useState([])
  const [docs, setDocs]           = useState([])
  const [submitted, setSubmitted] = useState(false)
  const [newId, setNewId]         = useState('')

  // Per-step forms
  const form1 = useForm({ resolver: zodResolver(step1Schema), defaultValues: formData })
  const form2 = useForm({ resolver: zodResolver(step2Schema), defaultValues: formData })
  const form3 = useForm({ resolver: zodResolver(step3Schema), defaultValues: formData })

  const watchCategory = form1.watch('category')

  // Voice input on description
  const { listening, start: startVoice, stop: stopVoice } = useVoiceInput(text => {
    form1.setValue('description', (form1.getValues('description') || '') + ' ' + text)
  })

  const mergeAndNext = (data) => {
    setFormData(prev => ({ ...prev, ...data }))
    setStep(s => s + 1)
  }

  const handleFinalSubmit = async () => {
    // Build multipart/form-data for file uploads
    const fd = new FormData()
    Object.entries(formData).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') fd.append(k, v)
    })
    photos.forEach(f => fd.append('photos',    f))
    videos.forEach(f => fd.append('videos',    f))
    docs.forEach(f   => fd.append('documents', f))

    const res = await submitMutation.mutateAsync(fd)
    setNewId(res.data?.challenge?.challengeId || 'JH-2026-XXXXXX')
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <DashboardLayout title={t('Submit Challenge', 'चुनौती दर्ज करें')}>
        <div className="max-w-xl mx-auto">
          <Card className="text-center py-12">
            <div className="w-20 h-20 rounded-full bg-[#e8f5ee] flex items-center justify-center mx-auto mb-5">
              <CheckCircle size={40} className="text-[#1a6b3c]" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {t('Challenge Submitted!', 'चुनौती दर्ज की गई!')}
            </h2>
            <p className="text-gray-500 mb-4">
              {t('Your challenge has been successfully submitted and is awaiting validation.',
                 'आपकी चुनौती सफलतापूर्वक दर्ज हो गई है और सत्यापन की प्रतीक्षा में है।')}
            </p>
            <div className="inline-flex items-center gap-2 bg-[#e8f5ee] border border-[#1a6b3c]/20 rounded-xl px-5 py-3 mb-6">
              <span className="text-gray-500 text-sm">Challenge ID:</span>
              <span className="font-bold text-[#1a6b3c] text-lg font-mono">{newId}</span>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
              <h4 className="font-semibold text-gray-700 mb-2 text-sm">What happens next?</h4>
              <ol className="space-y-1.5 text-sm text-gray-600">
                {[
                  '🤖 AI analysis will categorize & prioritize your challenge',
                  '👮 Admin will validate your submission within 2–3 days',
                  '🎓 Matched universities will be notified',
                  '🔔 You will receive status updates via notifications',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">{item}</li>
                ))}
              </ol>
            </div>
            <div className="flex gap-3 justify-center">
              <Button variant="secondary" onClick={() => navigate('/my-challenges')}>
                View My Challenges
              </Button>
              <Button onClick={() => { setSubmitted(false); setStep(1); setFormData({}) }}>
                Submit Another
              </Button>
            </div>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title={t('Submit New Challenge', 'नई चुनौती दर्ज करें')}>
      <div className="max-w-3xl mx-auto">
        <StepBar current={step} steps={STEPS} t={t} />

        {/* ── STEP 1: Problem Details ── */}
        {step === 1 && (
          <Card>
            <h2 className="text-base font-semibold text-gray-800 mb-5 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-[#1a6b3c] text-white text-xs flex items-center justify-center font-bold">1</span>
              {t('Problem Details', 'समस्या विवरण')}
            </h2>
            <form onSubmit={form1.handleSubmit(mergeAndNext)} className="space-y-5">
              {/* Title */}
              <Field label={t('Problem Title', 'समस्या शीर्षक')} required error={form1.formState.errors.title?.message}>
                <Input
                  placeholder={t('e.g. Contaminated drinking water in Ward 14', 'जैसे: वार्ड 14 में दूषित पेयजल')}
                  error={form1.formState.errors.title}
                  {...form1.register('title')}
                />
              </Field>

              {/* Description + Voice */}
              <Field label={t('Detailed Problem Description', 'समस्या का विस्तृत विवरण')} required
                error={form1.formState.errors.description?.message}
                hint={t('Be specific about what, where, when and who is affected.',
                         'क्या, कहाँ, कब और कौन प्रभावित है, स्पष्ट रूप से बताएं।')}>
                <div className="relative">
                  <Textarea
                    placeholder={t('Describe the problem in detail...', 'समस्या का विवरण दें...')}
                    rows={5}
                    error={form1.formState.errors.description}
                    {...form1.register('description')}
                  />
                  <button
                    type="button"
                    onMouseDown={startVoice}
                    onMouseUp={stopVoice}
                    className={`absolute bottom-2 right-2 p-2 rounded-full transition-colors ${
                      listening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 text-gray-500 hover:bg-[#1a6b3c] hover:text-white'
                    }`}
                    title="Hold to speak (Hindi/English)"
                  >
                    {listening ? <MicOff size={16} /> : <Mic size={16} />}
                  </button>
                </div>
                {listening && (
                  <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse inline-block" />
                    Listening... Release to stop
                  </p>
                )}
              </Field>

              {/* Category + Sub-category */}
              <div className="grid grid-cols-2 gap-4">
                <Field label={t('Category', 'श्रेणी')} required error={form1.formState.errors.category?.message}>
                  <Select error={form1.formState.errors.category} {...form1.register('category')}>
                    <option value="">Select category</option>
                    {CATEGORIES.map(c => (
                      <option key={c.value} value={c.value}>{c.icon} {c.label}</option>
                    ))}
                  </Select>
                </Field>
                <Field label={t('Sub-category', 'उप-श्रेणी')} required error={form1.formState.errors.subCategory?.message}>
                  <Select error={form1.formState.errors.subCategory} {...form1.register('subCategory')}>
                    <option value="">Select sub-category</option>
                    {(SUBCATEGORIES[watchCategory] || []).map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </Select>
                </Field>
              </div>

              {/* Urgency */}
              <Field label={t('Urgency Level', 'तात्कालिकता स्तर')} required error={form1.formState.errors.urgency?.message}>
                <Controller
                  control={form1.control}
                  name="urgency"
                  render={({ field }) => (
                    <div className="grid grid-cols-4 gap-2">
                      {URGENCY_OPTIONS.map(opt => (
                        <button
                          type="button"
                          key={opt.value}
                          onClick={() => field.onChange(opt.value)}
                          className={`px-3 py-2.5 rounded-lg border-2 text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                            field.value === opt.value
                              ? opt.color + ' ring-2 ring-offset-1 ring-current'
                              : 'border-gray-200 text-gray-500 hover:border-gray-300'
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full ${opt.dot}`} />
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                />
              </Field>

              <div className="flex justify-end pt-2">
                <Button type="submit">
                  {t('Next: Location', 'अगला: स्थान')} <ChevronRight size={16} />
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* ── STEP 2: Location & Impact ── */}
        {step === 2 && (
          <Card>
            <h2 className="text-base font-semibold text-gray-800 mb-5 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-[#1a6b3c] text-white text-xs flex items-center justify-center font-bold">2</span>
              {t('Location & Impact', 'स्थान और प्रभाव')}
            </h2>
            <form onSubmit={form2.handleSubmit(mergeAndNext)} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <Field label={t('District', 'जिला')} required error={form2.formState.errors.district?.message}>
                  <Select error={form2.formState.errors.district} {...form2.register('district')}>
                    <option value="">Select district</option>
                    {JHARKHAND_DISTRICTS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </Select>
                </Field>
                <Field label={t('City / Village', 'शहर / गाँव')} required error={form2.formState.errors.city?.message}>
                  <Input placeholder="e.g. Ranchi, Torpa" error={form2.formState.errors.city} {...form2.register('city')} />
                </Field>
              </div>

              <Field label={t('Address', 'पता')} required error={form2.formState.errors.address?.message}>
                <Input placeholder="e.g. Ward 14, Harmu Colony" error={form2.formState.errors.address} {...form2.register('address')} />
              </Field>

              <Field label={t('Number of People Affected', 'प्रभावित लोगों की संख्या')} required
                error={form2.formState.errors.affectedPeople?.message}
                hint="Approximate count of people impacted by this problem">
                <Input type="number" min="1" placeholder="e.g. 2500"
                  error={form2.formState.errors.affectedPeople}
                  {...form2.register('affectedPeople')} />
              </Field>

              {/* Map picker */}
              <Field label={t('Pin Location on Map', 'मानचित्र पर स्थान चुनें')}
                hint="Click anywhere on the map to set exact coordinates">
                <Controller
                  control={form2.control}
                  name="latitude"
                  render={() => (
                    <MapPicker
                      lat={form2.watch('latitude')}
                      lng={form2.watch('longitude')}
                      onSelect={(lat, lng) => {
                        form2.setValue('latitude', lat)
                        form2.setValue('longitude', lng)
                      }}
                    />
                  )}
                />
                {(form2.watch('latitude') && form2.watch('longitude')) && (
                  <div className="flex gap-4 mt-2">
                    <div className="flex-1">
                      <label className="text-xs text-gray-500">Latitude</label>
                      <Input readOnly value={form2.watch('latitude') || ''} {...form2.register('latitude')} className="bg-gray-50" />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-gray-500">Longitude</label>
                      <Input readOnly value={form2.watch('longitude') || ''} {...form2.register('longitude')} className="bg-gray-50" />
                    </div>
                  </div>
                )}
              </Field>

              <div className="flex justify-between pt-2">
                <Button variant="secondary" type="button" onClick={() => setStep(1)}>
                  <ChevronLeft size={16} /> {t('Back', 'वापस')}
                </Button>
                <Button type="submit">
                  {t('Next: Context', 'अगला: संदर्भ')} <ChevronRight size={16} />
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* ── STEP 3: Context & Media ── */}
        {step === 3 && (
          <Card>
            <h2 className="text-base font-semibold text-gray-800 mb-5 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-[#1a6b3c] text-white text-xs flex items-center justify-center font-bold">3</span>
              {t('Context & Media', 'संदर्भ और मीडिया')}
            </h2>
            <form onSubmit={form3.handleSubmit(mergeAndNext)} className="space-y-5">
              <Field label={t('Existing Attempts to Solve', 'पहले के समाधान के प्रयास')}
                hint="Have any previous efforts been made? Describe what worked/didn't work.">
                <Textarea
                  rows={3}
                  placeholder="e.g. Panchayat filed a complaint in 2024 but no action was taken..."
                  {...form3.register('existingAttempts')}
                />
              </Field>

              <Field label={t('Expected Type of Solution', 'अपेक्षित समाधान का प्रकार')} required
                error={form3.formState.errors.expectedSolution?.message}>
                <Select error={form3.formState.errors.expectedSolution} {...form3.register('expectedSolution')}>
                  <option value="">Select expected solution type</option>
                  {SOLUTION_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                </Select>
              </Field>

              {/* Media uploads */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700">
                  {t('Supporting Media', 'सहायक मीडिया')}
                  <span className="text-gray-400 font-normal ml-2">(optional)</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <FileUploadZone
                    accept="image/*"
                    label="Upload Photos"
                    icon={Image}
                    files={photos}
                    onAdd={f => setPhotos(prev => [...prev, f])}
                    onRemove={i => setPhotos(prev => prev.filter((_, idx) => idx !== i))}
                  />
                  <FileUploadZone
                    accept="video/*"
                    label="Upload Videos"
                    icon={Video}
                    files={videos}
                    onAdd={f => setVideos(prev => [...prev, f])}
                    onRemove={i => setVideos(prev => prev.filter((_, idx) => idx !== i))}
                  />
                  <FileUploadZone
                    accept=".pdf,.doc,.docx,.xls,.xlsx"
                    label="Supporting Docs"
                    icon={FileText}
                    files={docs}
                    onAdd={f => setDocs(prev => [...prev, f])}
                    onRemove={i => setDocs(prev => prev.filter((_, idx) => idx !== i))}
                  />
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <Button variant="secondary" type="button" onClick={() => setStep(2)}>
                  <ChevronLeft size={16} /> {t('Back', 'वापस')}
                </Button>
                <Button type="submit">
                  {t('Next: Review', 'अगला: समीक्षा')} <ChevronRight size={16} />
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* ── STEP 4: Review & Submit ── */}
        {step === 4 && (
          <Card>
            <h2 className="text-base font-semibold text-gray-800 mb-5 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-[#1a6b3c] text-white text-xs flex items-center justify-center font-bold">4</span>
              {t('Review & Submit', 'समीक्षा और सबमिट')}
            </h2>

            <div className="bg-[#e8f5ee] border border-[#1a6b3c]/20 rounded-xl p-4 mb-5 flex gap-3">
              <Info size={18} className="text-[#1a6b3c] flex-shrink-0 mt-0.5" />
              <p className="text-sm text-[#1a6b3c]">
                Please review your submission carefully. Once submitted, you can track its status from <strong>My Challenges</strong>.
              </p>
            </div>

            {/* Section: Problem */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Problem Details</h4>
                <button type="button" onClick={() => setStep(1)} className="text-xs text-[#1a6b3c] hover:underline">Edit</button>
              </div>
              <div className="bg-gray-50 rounded-xl px-4 py-2">
                <ReviewRow label="Title"         value={formData.title} />
                <ReviewRow label="Description"   value={formData.description} />
                <ReviewRow label="Category"      value={formData.category} />
                <ReviewRow label="Sub-category"  value={formData.subCategory} />
                <ReviewRow label="Urgency"       value={formData.urgency} />
              </div>
            </div>

            {/* Section: Location */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Location & Impact</h4>
                <button type="button" onClick={() => setStep(2)} className="text-xs text-[#1a6b3c] hover:underline">Edit</button>
              </div>
              <div className="bg-gray-50 rounded-xl px-4 py-2">
                <ReviewRow label="District"         value={formData.district} />
                <ReviewRow label="City/Village"     value={formData.city} />
                <ReviewRow label="Address"          value={formData.address} />
                <ReviewRow label="People Affected"  value={formData.affectedPeople ? `${formData.affectedPeople} persons` : ''} />
                <ReviewRow label="Coordinates"      value={formData.latitude ? `${formData.latitude}, ${formData.longitude}` : 'Not set'} />
              </div>
            </div>

            {/* Section: Context */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Context & Media</h4>
                <button type="button" onClick={() => setStep(3)} className="text-xs text-[#1a6b3c] hover:underline">Edit</button>
              </div>
              <div className="bg-gray-50 rounded-xl px-4 py-2">
                <ReviewRow label="Expected Solution" value={formData.expectedSolution} />
                <ReviewRow label="Existing Attempts" value={formData.existingAttempts || 'None mentioned'} />
                <ReviewRow label="Photos"            value={photos.length ? `${photos.length} file(s)` : 'None'} />
                <ReviewRow label="Videos"            value={videos.length ? `${videos.length} file(s)` : 'None'} />
                <ReviewRow label="Documents"         value={docs.length   ? `${docs.length} file(s)`   : 'None'} />
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="secondary" type="button" onClick={() => setStep(3)}>
                <ChevronLeft size={16} /> {t('Back', 'वापस')}
              </Button>
              <Button
                onClick={handleFinalSubmit}
                disabled={submitMutation.isPending}
                className="min-w-[160px]"
              >
                {submitMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Submitting...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <CheckCircle size={16} />
                    {t('Submit Challenge', 'चुनौती दर्ज करें')}
                  </span>
                )}
              </Button>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
