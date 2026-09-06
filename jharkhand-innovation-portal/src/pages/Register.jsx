import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Lightbulb, AlertCircle, CheckCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui/Button'
import { JHARKHAND_DISTRICTS } from '../data/mockData'

const schema = z.object({
  name:     z.string().min(2, 'Name must be at least 2 characters'),
  email:    z.string().email('Enter a valid email address'),
  phone:    z.string().min(10, 'Enter a valid 10-digit phone number'),
  district: z.string().min(1, 'Select your district'),
  address:  z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirm:  z.string(),
}).refine(d => d.password === d.confirm, {
  message: 'Passwords do not match',
  path:    ['confirm'],
})

function Field({ label, error, required, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
          <AlertCircle size={11} />{error}
        </p>
      )}
    </div>
  )
}

export default function Register() {
  const { register: registerUser } = useAuth()
  const navigate  = useNavigate()
  const [showPwd,  setShowPwd]  = useState(false)
  const [apiError, setApiError] = useState('')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  })

  const onSubmit = async ({ confirm, ...data }) => {
    setApiError('')
    try {
      await registerUser(data)
      navigate('/', { replace: true })
    } catch (err) {
      setApiError(err?.response?.data?.message || 'Registration failed. Please try again.')
    }
  }

  const inputCls = (err) =>
    `w-full px-4 py-2.5 text-sm border rounded-xl transition-all
     focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary
     ${err ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'}`

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Lightbulb size={18} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-gray-800 text-sm">Jharkhand Innovation Portal</p>
            <p className="text-gray-400 text-xs">Create your citizen account</p>
          </div>
        </div>

        <h1 className="text-xl font-extrabold text-gray-800 mb-1">Join as a Citizen</h1>
        <p className="text-gray-500 text-sm mb-6">
          Submit societal challenges, track solutions, and drive community impact.
        </p>

        {apiError && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700
                          text-sm px-4 py-3 rounded-xl mb-5">
            <AlertCircle size={16} className="flex-shrink-0" />{apiError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Full Name" required error={errors.name?.message}>
              <input className={inputCls(errors.name)} placeholder="Rajesh Kumar"
                {...register('name')} />
            </Field>
            <Field label="Phone Number" required error={errors.phone?.message}>
              <input className={inputCls(errors.phone)} placeholder="+91 98765 43210"
                {...register('phone')} />
            </Field>
          </div>

          <Field label="Email Address" required error={errors.email?.message}>
            <input type="email" className={inputCls(errors.email)}
              placeholder="you@example.com" {...register('email')} />
          </Field>

          <Field label="District" required error={errors.district?.message}>
            <select className={inputCls(errors.district)} {...register('district')}>
              <option value="">Select your district</option>
              {JHARKHAND_DISTRICTS.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </Field>

          <Field label="Address" error={errors.address?.message}>
            <input className={inputCls(false)} placeholder="Village / Ward / Colony"
              {...register('address')} />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Password" required error={errors.password?.message}>
              <div className="relative">
                <input type={showPwd ? 'text' : 'password'} className={inputCls(errors.password)}
                  placeholder="Min 6 characters" {...register('password')} />
                <button type="button" onClick={() => setShowPwd(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </Field>
            <Field label="Confirm Password" required error={errors.confirm?.message}>
              <input type="password" className={inputCls(errors.confirm)}
                placeholder="Repeat password" {...register('confirm')} />
            </Field>
          </div>

          <Button type="submit" className="w-full py-3" disabled={isSubmitting}>
            {isSubmitting
              ? <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating account...
                </span>
              : <span className="flex items-center gap-2"><CheckCircle size={16} /> Create Account</span>}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-5">
          Already have an account?{' '}
          <Link to="/login" className="text-primary font-semibold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
