import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { User, Mail, Phone, MapPin, Calendar, Edit3, CheckCircle, Lock, AlertCircle } from 'lucide-react'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { useProfile, useUpdateProfile, useChangePassword } from '../hooks/useQueries'
import { useAuth } from '../context/AuthContext'
import { formatDate } from '../utils/helpers'
import { useApp } from '../context/AppContext'
import { JHARKHAND_DISTRICTS } from '../data/mockData'

const profileSchema = z.object({
  name:     z.string().min(2, 'Name must be at least 2 characters'),
  phone:    z.string().min(10, 'Enter a valid phone number'),
  district: z.string().min(1, 'Select a district'),
  address:  z.string().optional(),
})

const pwdSchema = z.object({
  currentPassword: z.string().min(1, 'Current password required'),
  newPassword:     z.string().min(6, 'New password must be at least 6 characters'),
})

function BadgeCard({ badge }) {
  return (
    <div className={`rounded-2xl p-4 border-2 flex flex-col items-center gap-2 text-center transition-all ${
      badge.earned
        ? 'bg-gradient-to-br from-primary-light to-green-100 border-primary/30'
        : 'bg-gray-50 border-gray-200 opacity-50 grayscale'
    }`}>
      <span className="text-3xl">{badge.icon}</span>
      <div>
        <p className={`text-sm font-bold ${badge.earned ? 'text-primary' : 'text-gray-400'}`}>{badge.name}</p>
        <p className="text-[11px] text-gray-500 mt-0.5 leading-tight">{badge.desc}</p>
      </div>
      {badge.earned
        ? <div className="flex items-center gap-1 text-xs text-primary font-semibold"><CheckCircle size={12} /> Earned</div>
        : <div className="flex items-center gap-1 text-xs text-gray-400"><Lock size={12} /> Locked</div>
      }
    </div>
  )
}

function InputField({ label, error, required, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11} />{error}</p>}
    </div>
  )
}

const inputCls = (err) =>
  `w-full px-3 py-2.5 text-sm border rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary ${
    err ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'
  }`

export default function Profile() {
  const { t }          = useApp()
  const { updateUser } = useAuth()
  const [editMode,   setEditMode]   = useState(false)
  const [pwdMode,    setPwdMode]    = useState(false)
  const [savedMsg,   setSavedMsg]   = useState('')
  const [pwdError,   setPwdError]   = useState('')

  const { data: profile, isLoading } = useProfile()
  const updateMutation  = useUpdateProfile()
  const changePwdMutation = useChangePassword()

  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    values: profile ? { name: profile.name, phone: profile.phone ?? '', district: profile.district ?? '', address: profile.address ?? '' } : {},
  })

  const pwdForm = useForm({ resolver: zodResolver(pwdSchema) })

  const onProfileSave = async (data) => {
    await updateMutation.mutateAsync(data)
    updateUser(data)
    setEditMode(false)
    setSavedMsg('Profile updated successfully!')
    setTimeout(() => setSavedMsg(''), 3000)
  }

  const onPasswordSave = async (data) => {
    setPwdError('')
    try {
      await changePwdMutation.mutateAsync(data)
      setPwdMode(false)
      setSavedMsg('Password changed successfully!')
      setTimeout(() => setSavedMsg(''), 3000)
      pwdForm.reset()
    } catch (err) {
      setPwdError(err?.response?.data?.message || 'Failed to change password.')
    }
  }

  if (isLoading) return (
    <DashboardLayout title={t('Profile', 'प्रोफ़ाइल')}>
      <LoadingSpinner text="Loading profile..." />
    </DashboardLayout>
  )

  const earnedCount = profile?.badges?.filter(b => b.earned).length ?? 0
  const totalBadges = profile?.badges?.length ?? 6

  return (
    <DashboardLayout title={t('Profile', 'प्रोफ़ाइल')}>
      <div className="max-w-4xl mx-auto space-y-6">

        {savedMsg && (
          <div className="flex items-center gap-2 text-sm text-primary bg-primary-light px-4 py-3 rounded-xl border border-primary/20">
            <CheckCircle size={16} /> {savedMsg}
          </div>
        )}

        {/* Profile header */}
        <Card>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="relative flex-shrink-0">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-green-600 flex items-center justify-center text-white text-4xl font-bold shadow-lg">
                {profile?.name?.charAt(0) ?? 'U'}
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-accent flex items-center justify-center shadow-md text-sm">
                🏆
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-2xl font-bold text-gray-800">{profile?.name}</h2>
                <span className="text-xs bg-primary-light text-primary font-semibold px-2.5 py-1 rounded-full border border-primary/20 capitalize">
                  {profile?.role}
                </span>
              </div>
              <p className="text-gray-500 text-sm mt-1">{profile?.email}</p>
              <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-400">
                <span className="flex items-center gap-1"><MapPin size={12} /> {profile?.district}</span>
                <span className="flex items-center gap-1"><Calendar size={12} /> Joined {formatDate(profile?.createdAt)}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => { setEditMode(e => !e); setPwdMode(false) }}>
                <Edit3 size={14} /> {editMode ? 'Cancel' : 'Edit Profile'}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { setPwdMode(e => !e); setEditMode(false) }}>
                <Lock size={14} /> {pwdMode ? 'Cancel' : 'Password'}
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mt-6 pt-5 border-t border-gray-100">
            {[
              { label: 'Challenges Submitted', value: profile?.totalSubmitted   ?? 0, color: 'text-primary',    bg: 'bg-primary-light' },
              { label: 'Challenges Solved',    value: profile?.challengesSolved ?? 0, color: 'text-blue-600',   bg: 'bg-blue-50' },
              { label: 'Total Endorsements',   value: profile?.totalUpvotes     ?? 0, color: 'text-purple-600', bg: 'bg-purple-50' },
            ].map(s => (
              <div key={s.label} className={`${s.bg} rounded-2xl p-4 flex flex-col items-center gap-1 text-center`}>
                <span className={`text-2xl font-bold ${s.color}`}>{s.value}</span>
                <span className="text-xs text-gray-500">{s.label}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Edit form */}
        {editMode && (
          <Card>
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Edit3 size={16} className="text-primary" /> Edit Profile Information
            </h3>
            <form onSubmit={profileForm.handleSubmit(onProfileSave)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField label="Full Name" required error={profileForm.formState.errors.name?.message}>
                  <input className={inputCls(profileForm.formState.errors.name)} {...profileForm.register('name')} />
                </InputField>
                <InputField label="Phone" required error={profileForm.formState.errors.phone?.message}>
                  <input className={inputCls(profileForm.formState.errors.phone)} {...profileForm.register('phone')} />
                </InputField>
                <InputField label="District" required error={profileForm.formState.errors.district?.message}>
                  <select className={inputCls(profileForm.formState.errors.district)} {...profileForm.register('district')}>
                    <option value="">Select district</option>
                    {JHARKHAND_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </InputField>
                <InputField label="Address" error={profileForm.formState.errors.address?.message}>
                  <input className={inputCls(false)} {...profileForm.register('address')} />
                </InputField>
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button variant="secondary" type="button" onClick={() => setEditMode(false)}>Cancel</Button>
              </div>
            </form>
          </Card>
        )}

        {/* Change password form */}
        {pwdMode && (
          <Card>
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Lock size={16} className="text-primary" /> Change Password
            </h3>
            {pwdError && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4">
                <AlertCircle size={15} /> {pwdError}
              </div>
            )}
            <form onSubmit={pwdForm.handleSubmit(onPasswordSave)} className="space-y-4 max-w-md">
              <InputField label="Current Password" required error={pwdForm.formState.errors.currentPassword?.message}>
                <input type="password" className={inputCls(pwdForm.formState.errors.currentPassword)}
                  {...pwdForm.register('currentPassword')} />
              </InputField>
              <InputField label="New Password" required error={pwdForm.formState.errors.newPassword?.message}>
                <input type="password" className={inputCls(pwdForm.formState.errors.newPassword)}
                  {...pwdForm.register('newPassword')} />
              </InputField>
              <div className="flex gap-3">
                <Button type="submit" disabled={changePwdMutation.isPending}>
                  {changePwdMutation.isPending ? 'Updating...' : 'Update Password'}
                </Button>
                <Button variant="secondary" type="button" onClick={() => setPwdMode(false)}>Cancel</Button>
              </div>
            </form>
          </Card>
        )}

        {/* Badges */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-800">Achievement Badges</h3>
              <p className="text-xs text-gray-500 mt-0.5">{earnedCount} of {totalBadges} badges earned</p>
            </div>
            <div className="w-32">
              <div className="bg-gray-100 rounded-full h-2">
                <div className="bg-accent rounded-full h-2 progress-animate"
                  style={{ width: `${(earnedCount / totalBadges) * 100}%` }} />
              </div>
              <p className="text-xs text-gray-400 mt-1 text-right">
                {Math.round((earnedCount / totalBadges) * 100)}% complete
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {profile?.badges?.map(b => <BadgeCard key={b.id} badge={b} />)}
          </div>
        </div>

        {/* Account info */}
        <Card>
          <h3 className="font-semibold text-gray-800 mb-4">Account Information</h3>
          <div className="space-y-3">
            {[
              { Icon: User,     label: 'Full Name',    value: profile?.name },
              { Icon: Mail,     label: 'Email',        value: profile?.email },
              { Icon: Phone,    label: 'Phone',        value: profile?.phone },
              { Icon: MapPin,   label: 'District',     value: profile?.district },
              { Icon: MapPin,   label: 'Address',      value: profile?.address },
              { Icon: Calendar, label: 'Member Since', value: formatDate(profile?.createdAt) },
            ].map(({ Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <Icon size={15} className="text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400">{label}</p>
                  <p className="text-sm font-medium text-gray-800 truncate">{value || '—'}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}
