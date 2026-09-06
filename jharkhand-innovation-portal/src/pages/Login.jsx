import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Lightbulb, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui/Button'

const schema = z.object({
  email:    z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

export default function Login() {
  const { login }  = useAuth()
  const navigate   = useNavigate()
  const location   = useLocation()
  const from       = location.state?.from?.pathname || '/'

  const [showPwd,  setShowPwd]  = useState(false)
  const [apiError, setApiError] = useState('')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data) => {
    setApiError('')
    try {
      await login(data)
      navigate(from, { replace: true })
    } catch (err) {
      setApiError(err?.response?.data?.message || 'Login failed. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* ── Left panel ── */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between p-12 text-white"
        style={{ background: 'linear-gradient(160deg,#0f3d24 0%,#16522e 55%,#0b2d1a 100%)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
            <Lightbulb size={20} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-sm">Jharkhand Societal</p>
            <p className="text-green-300 text-xs">Innovation Collaboration Portal</p>
          </div>
        </div>

        <div>
          <h2 className="text-4xl font-extrabold leading-tight mb-4">
            Turning community<br />problems into<br />
            <span className="text-accent">innovation.</span>
          </h2>
          <p className="text-green-200 text-sm max-w-sm leading-relaxed">
            Connect with universities, industry partners, and government
            departments to solve real societal challenges across Jharkhand.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {[
            { value: '1,247', label: 'Challenges Submitted' },
            { value: '89',    label: 'Solutions Deployed' },
            { value: '14',    label: 'Universities Partnered' },
            { value: '1.2L+', label: 'Citizens Impacted' },
          ].map(s => (
            <div key={s.label} className="bg-white/10 rounded-xl p-4">
              <p className="text-2xl font-bold text-accent">{s.value}</p>
              <p className="text-xs text-green-300 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <Lightbulb size={18} className="text-white" />
            </div>
            <p className="font-bold text-gray-800 text-sm">Jharkhand Innovation Portal</p>
          </div>

          <h1 className="text-2xl font-extrabold text-gray-800 mb-1">Welcome back</h1>
          <p className="text-gray-500 text-sm mb-7">Sign in to your citizen account</p>

          {/* Demo credentials hint */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-5 text-xs text-blue-700">
            <strong>Demo login:</strong> rajesh@example.com / password123
          </div>

          {apiError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700
                            text-sm px-4 py-3 rounded-xl mb-5">
              <AlertCircle size={16} className="flex-shrink-0" />
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                className={`w-full px-4 py-3 text-sm border rounded-xl transition-all
                  focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary
                  ${errors.email ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'}`}
                {...register('email')}
              />
              {errors.email && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle size={11} />{errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  placeholder="Your password"
                  className={`w-full px-4 py-3 pr-11 text-sm border rounded-xl transition-all
                    focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary
                    ${errors.password ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'}`}
                  {...register('password')}
                />
                <button type="button" onClick={() => setShowPwd(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle size={11} />{errors.password.message}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full py-3" disabled={isSubmitting}>
              {isSubmitting
                ? <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Signing in...
                  </span>
                : 'Sign In'}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary font-semibold hover:underline">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
