'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { Eye, EyeOff, Zap, Mail, Lock, User } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const { register } = useAuth()

  const [form, setForm]       = useState({ name: '', email: '', password: '', confirm: '' })
  const [showPw, setShowPw]   = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)
  const [errors, setErrors]   = useState({})

  const validate = () => {
    const e = {}
    if (!form.name.trim())                          e.name     = 'Name is required'
    if (!form.email.trim())                         e.email    = 'Email is required'
    if (form.password.length < 6)                   e.password = 'Password must be at least 6 characters'
    if (form.password !== form.confirm)             e.confirm  = 'Passwords do not match'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setError(null)
    setLoading(true)
    try {
      await register(form.name, form.email, form.password)
      router.push('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const field = (key, label, type, placeholder, icon) => (
    <div>
      <label className="section-label block mb-2">{label}</label>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4a7c59]">{icon}</span>
        <input
          type={key === 'password' || key === 'confirm' ? (showPw ? 'text' : 'password') : type}
          placeholder={placeholder}
          value={form[key]}
          onChange={e => { setForm(p => ({ ...p, [key]: e.target.value })); if (errors[key]) setErrors(p => ({ ...p, [key]: null })) }}
          className={`input-field pl-10 pr-4 py-3 rounded-xl text-sm w-full ${errors[key] ? 'border-red-400' : ''}`}
        />
        {(key === 'password') && (
          <button type="button" onClick={() => setShowPw(!showPw)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
      {errors[key] && <p className="text-xs text-red-500 mt-1.5">{errors[key]}</p>}
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: 'linear-gradient(135deg, #0f2010 0%, #1a3a20 40%, #2d5a35 100%)' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors">
            <div className="w-8 h-8 rounded-lg bg-[#4a7c59] flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-display text-xl tracking-wide">WANDERGENIE</span>
          </Link>
          <p className="text-white/40 text-sm mt-2 font-body">Start planning your adventures</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h1 className="font-display text-3xl text-[#1a2e1a] tracking-wide mb-6">CREATE ACCOUNT</h1>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100">
              <p className="text-sm text-red-600 font-body">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {field('name',     'Full Name',        'text',  'Your name',        <User className="w-4 h-4" />)}
            {field('email',    'Email',            'email', 'you@example.com',  <Mail className="w-4 h-4" />)}
            {field('password', 'Password',         'password', '••••••••',      <Lock className="w-4 h-4" />)}
            {field('confirm',  'Confirm Password', 'password', '••••••••',      <Lock className="w-4 h-4" />)}

            <button type="submit" disabled={loading}
              className="btn-accent w-full py-3.5 rounded-xl text-sm font-semibold mt-2 flex items-center justify-center gap-2">
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /><span>Creating account...</span></>
              ) : (
                <><Zap className="w-4 h-4" /><span>Create Account</span></>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 font-body mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-[#4a7c59] font-semibold hover:underline">Sign in</Link>
          </p>
          <p className="text-center mt-3">
            <Link href="/" className="text-xs text-gray-300 hover:text-gray-500 font-body">← Back to home</Link>
          </p>
        </div>
      </div>
    </div>
  )
}