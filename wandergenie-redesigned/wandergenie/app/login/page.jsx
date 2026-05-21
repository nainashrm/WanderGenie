'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { Eye, EyeOff, Zap, Mail, Lock } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()

  const [form, setForm]       = useState({ email: '', password: '' })
  const [showPw, setShowPw]   = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(form.email, form.password)
      router.push('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'linear-gradient(135deg, #0f2010 0%, #1a3a20 40%, #2d5a35 100%)' }}>

      {/* Card */}
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors">
            <div className="w-8 h-8 rounded-lg bg-[#4a7c59] flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-display text-xl tracking-wide">WANDERGENIE</span>
          </Link>
          <p className="text-white/40 text-sm mt-2 font-body">Welcome back, explorer</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h1 className="font-display text-3xl text-[#1a2e1a] tracking-wide mb-6">SIGN IN</h1>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100">
              <p className="text-sm text-red-600 font-body">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="section-label block mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a7c59]" />
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  required
                  className="input-field pl-10 pr-4 py-3 rounded-xl text-sm w-full"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="section-label block mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a7c59]" />
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  required
                  className="input-field pl-10 pr-10 py-3 rounded-xl text-sm w-full"
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading}
              className="btn-accent w-full py-3.5 rounded-xl text-sm font-semibold mt-2 flex items-center justify-center gap-2">
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /><span>Signing in...</span></>
              ) : (
                <><Zap className="w-4 h-4" /><span>Sign In</span></>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 font-body mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-[#4a7c59] font-semibold hover:underline">Create one</Link>
          </p>

          <p className="text-center mt-3">
            <Link href="/" className="text-xs text-gray-300 hover:text-gray-500 font-body">
              ← Back to home
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}