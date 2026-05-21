'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import {
  MapPin, Calendar, DollarSign, LogOut, User,
  Zap, Settings, Bookmark, Clock, ChevronRight,
  Eye, Trash2, Plus
} from 'lucide-react'

function TripCard({ trip, onView, onDelete }) {
  const interests = trip.interests || []
  const date      = new Date(trip.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md transition-all duration-200 group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1a2e1a] flex items-center justify-center flex-shrink-0">
            <MapPin className="w-4 h-4 text-[#a8d5b5]" />
          </div>
          <div>
            <h3 className="font-display text-lg text-[#1a2e1a] tracking-wide leading-tight">
              {trip.destination?.toUpperCase()}
            </h3>
            <p className="text-xs text-gray-400 font-body flex items-center gap-1 mt-0.5">
              <Clock className="w-3 h-3" /> {date}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onView(trip)}
            className="p-1.5 rounded-lg hover:bg-[#f0f7f2] text-gray-400 hover:text-[#4a7c59] transition-colors">
            <Eye className="w-4 h-4" />
          </button>
          <button onClick={() => onDelete(trip._id)}
            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-gray-500 font-body mb-3">
        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{trip.duration} days</span>
        <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />₹{Number(trip.budget).toLocaleString('en-IN')}</span>
        {trip.travelStyle && <span className="capitalize">{trip.travelStyle}</span>}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {interests.slice(0, 4).map(tag => (
          <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-[#f0f7f2] text-[#4a7c59] font-mono capitalize">
            {tag}
          </span>
        ))}
        {interests.length > 4 && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-400 font-mono">
            +{interests.length - 4} more
          </span>
        )}
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="font-display text-3xl text-[#1a2e1a] tracking-wide">{value}</div>
      <div className="text-xs text-gray-400 font-body mt-1">{label}</div>
    </div>
  )
}

export default function DashboardPage() {
  const router            = useRouter()
  const { user, logout, getMyTrips } = useAuth()
  const [trips, setTrips] = useState([])
  const [loading, setLoading]   = useState(true)
  const [activeTab, setActiveTab] = useState('trips')
  const [deleteId, setDeleteId]   = useState(null)

  useEffect(() => {
    if (!user) { router.push('/login'); return }
    loadTrips()
  }, [user])

  async function loadTrips() {
    try {
      const data = await getMyTrips()
      setTrips(data)
    } catch { setTrips([]) }
    finally  { setLoading(false) }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this trip?')) return
    const token = localStorage.getItem('wg_access_token')
    await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/trips/${id}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
    })
    setTrips(prev => prev.filter(t => t._id !== id))
  }

  function handleView(trip) {
    sessionStorage.setItem('wandergenie_result', JSON.stringify({
      itinerary:    trip.itinerary    || [],
      packing_list: trip.packing_list || {},
      weather:      trip.weather      || {},
      budgetBreakdown: trip.budgetBreakdown || null,
    }))
    sessionStorage.setItem('wandergenie_form', JSON.stringify({
      destination: trip.destination,
      budget:      trip.budget,
      duration:    trip.duration,
      interests:   trip.interests,
      travelStyle: trip.travelStyle,
    }))
    router.push('/results')
  }

  async function handleLogout() {
    await logout()
    router.push('/')
  }

  if (!user) return null

  const initials = user.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'
  const destinations = [...new Set(trips.map(t => t.destination))].length

  return (
    <div className="min-h-screen bg-[#fafaf8]">
      {/* Top nav */}
      <div className="bg-[#1a2e1a] px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#4a7c59] flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-display text-lg text-white tracking-wide">WANDERGENIE</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link href="/"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-white/60 hover:text-white hover:bg-white/10 transition-all font-body">
              <Plus className="w-3.5 h-3.5" /> New Trip
            </Link>
            <button onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-white/60 hover:text-white hover:bg-white/10 transition-all font-body">
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Profile hero */}
      <div className="bg-[#1a2e1a] pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto pt-6 flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-[#4a7c59] flex items-center justify-center flex-shrink-0">
            <span className="font-display text-2xl text-white">{initials}</span>
          </div>
          <div>
            <p className="font-mono text-[10px] text-[#a8d5b5] uppercase tracking-widest mb-1">Welcome back</p>
            <h1 className="font-display text-4xl text-white tracking-wide">{user.name?.toUpperCase()}</h1>
            <p className="text-white/40 text-sm font-body">{user.email}</p>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 pb-16">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard icon={MapPin}    label="Trips Planned"    value={trips.length}  color="bg-[#4a7c59]" />
          <StatCard icon={Bookmark}  label="Destinations"     value={destinations}  color="bg-[#e07b39]" />
          <StatCard icon={Calendar}  label="Total Days"       value={trips.reduce((s, t) => s + (t.duration || 0), 0)} color="bg-[#5b7fa6]" />
          <StatCard icon={DollarSign} label="Total Budget"    value={`₹${(trips.reduce((s, t) => s + (Number(t.budget) || 0), 0) / 1000).toFixed(0)}K`} color="bg-[#7c5b9e]" />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-white border border-gray-100 rounded-xl mb-6 w-fit shadow-sm">
          {[
            { id: 'trips',    label: 'My Trips',  icon: MapPin  },
            { id: 'profile',  label: 'Profile',   icon: User    },
            { id: 'settings', label: 'Settings',  icon: Settings},
          ].map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-body font-medium transition-all
                ${activeTab === id ? 'bg-[#1a2e1a] text-white shadow-sm' : 'text-gray-500 hover:text-[#1a2e1a] hover:bg-gray-50'}`}>
              <Icon className="w-4 h-4" strokeWidth={1.8} />
              {label}
            </button>
          ))}
        </div>

        {/* ── My Trips tab ── */}
        {activeTab === 'trips' && (
          <div>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1,2,3].map(i => (
                  <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 animate-pulse">
                    <div className="h-4 bg-gray-100 rounded w-3/4 mb-3" />
                    <div className="h-3 bg-gray-100 rounded w-1/2 mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-2/3" />
                  </div>
                ))}
              </div>
            ) : trips.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-5xl mb-4">🗺️</div>
                <h3 className="font-display text-2xl text-[#1a2e1a] tracking-wide mb-2">NO TRIPS YET</h3>
                <p className="text-gray-400 text-sm font-body mb-6">Start planning your first adventure!</p>
                <Link href="/"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#1a2e1a] text-white text-sm font-body font-semibold hover:bg-[#2e5c3a] transition-colors">
                  <Plus className="w-4 h-4" /> Plan a Trip
                </Link>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-gray-400 font-body">{trips.length} trip{trips.length !== 1 ? 's' : ''} planned</p>
                  <Link href="/"
                    className="flex items-center gap-1.5 text-sm text-[#4a7c59] font-body font-semibold hover:underline">
                    <Plus className="w-4 h-4" /> New Trip
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {trips.map(trip => (
                    <TripCard key={trip._id} trip={trip} onView={handleView} onDelete={handleDelete} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Profile tab ── */}
        {activeTab === 'profile' && <ProfileTab user={user} />}

        {/* ── Settings tab ── */}
        {activeTab === 'settings' && <SettingsTab />}
      </main>
    </div>
  )
}

// ─── Profile Tab ─────────────────────────────────────────────────────────────
function ProfileTab({ user }) {
  const { updateProfile } = useAuth()
  const [form, setForm]     = useState({ name: user.name || '', avatar: user.avatar || '' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)
  const [error, setError]   = useState(null)

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true); setError(null)
    try {
      await updateProfile({ name: form.name })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) { setError(err.message) }
    finally { setSaving(false) }
  }

  const initials = user.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'

  return (
    <div className="max-w-lg">
      <div className="bg-white border border-gray-100 rounded-2xl p-6">
        <h2 className="font-display text-2xl text-[#1a2e1a] tracking-wide mb-6">YOUR PROFILE</h2>

        {/* Avatar */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
          <div className="w-16 h-16 rounded-2xl bg-[#4a7c59] flex items-center justify-center flex-shrink-0">
            <span className="font-display text-2xl text-white">{initials}</span>
          </div>
          <div>
            <p className="font-semibold text-[#1a2e1a] font-body">{user.name}</p>
            <p className="text-sm text-gray-400 font-body">{user.email}</p>
            <p className="text-xs text-gray-300 font-body mt-1">
              Member since {new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        {error && <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600">{error}</div>}
        {saved && <div className="mb-4 p-3 rounded-xl bg-green-50 border border-green-100 text-sm text-green-600">✓ Profile updated successfully</div>}

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="section-label block mb-2">Full Name</label>
            <input type="text" value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              className="input-field px-4 py-3 rounded-xl text-sm w-full" />
          </div>
          <div>
            <label className="section-label block mb-2">Email</label>
            <input type="email" value={user.email} disabled
              className="input-field px-4 py-3 rounded-xl text-sm w-full bg-gray-50 text-gray-400 cursor-not-allowed" />
            <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
          </div>
          <button type="submit" disabled={saving}
            className="btn-accent px-6 py-3 rounded-xl text-sm font-semibold flex items-center gap-2">
            {saving ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Saving...</> : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── Settings Tab ─────────────────────────────────────────────────────────────
function SettingsTab() {
  const { changePassword, logout } = useAuth()
  const router = useRouter()
  const [form, setForm]     = useState({ current: '', newPw: '', confirm: '' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)
  const [error, setError]   = useState(null)

  const handleChange = async (e) => {
    e.preventDefault()
    if (form.newPw !== form.confirm) { setError('New passwords do not match'); return }
    if (form.newPw.length < 6)      { setError('New password must be at least 6 characters'); return }
    setSaving(true); setError(null)
    try {
      await changePassword(form.current, form.newPw)
      setSaved(true)
      setForm({ current: '', newPw: '', confirm: '' })
      setTimeout(() => setSaved(false), 2500)
    } catch (err) { setError(err.message) }
    finally { setSaving(false) }
  }

  return (
    <div className="max-w-lg space-y-6">
      {/* Change Password */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6">
        <h2 className="font-display text-2xl text-[#1a2e1a] tracking-wide mb-6">CHANGE PASSWORD</h2>

        {error && <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600">{error}</div>}
        {saved && <div className="mb-4 p-3 rounded-xl bg-green-50 border border-green-100 text-sm text-green-600">✓ Password changed successfully</div>}

        <form onSubmit={handleChange} className="space-y-4">
          {[
            { key: 'current', label: 'Current Password',  placeholder: '••••••••' },
            { key: 'newPw',   label: 'New Password',       placeholder: '••••••••' },
            { key: 'confirm', label: 'Confirm New Password', placeholder: '••••••••' },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="section-label block mb-2">{label}</label>
              <input type="password" placeholder={placeholder} value={form[key]}
                onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                className="input-field px-4 py-3 rounded-xl text-sm w-full" />
            </div>
          ))}
          <button type="submit" disabled={saving}
            className="btn-accent px-6 py-3 rounded-xl text-sm font-semibold flex items-center gap-2">
            {saving ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Updating...</> : 'Update Password'}
          </button>
        </form>
      </div>

      {/* Danger zone */}
      <div className="bg-white border border-red-100 rounded-2xl p-6">
        <h3 className="font-semibold text-red-600 font-body mb-2">Sign Out</h3>
        <p className="text-sm text-gray-400 font-body mb-4">You will be redirected to the home page.</p>
        <button onClick={async () => { await logout(); router.push('/') }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-red-200 text-red-500 text-sm font-body font-semibold hover:bg-red-50 transition-colors">
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </div>
  )
}