'use client'
import { useState } from 'react'
import { MapPin, DollarSign, Calendar, Zap, ChevronRight } from 'lucide-react'

const INTERESTS = [
  { id: 'beaches',   label: 'Beaches',   emoji: '🏖️' },
  { id: 'cafes',     label: 'Cafés',     emoji: '☕' },
  { id: 'nightlife', label: 'Nightlife', emoji: '🌙' },
  { id: 'adventure', label: 'Adventure', emoji: '🧗' },
  { id: 'mountains', label: 'Mountains', emoji: '⛰️' },
  { id: 'culture',   label: 'Culture',   emoji: '🏛️' },
  { id: 'shopping',  label: 'Shopping',  emoji: '🛍️' },
  { id: 'food',      label: 'Food',      emoji: '🍜' },
  { id: 'nature',    label: 'Nature',    emoji: '🌿' },
]

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const TRAVEL_STYLES = [
  { id: 'budget',    label: 'Budget'    },
  { id: 'balanced',  label: 'Balanced'  },
  { id: 'luxury',    label: 'Luxury'    },
  { id: 'adventure', label: 'Adventure' },
  { id: 'family',    label: 'Family'    },
  { id: 'solo',      label: 'Solo'      },
]

export default function TripForm({ onSubmit, isLoading }) {
  const currentMonth = MONTHS[new Date().getMonth()]
  const [form, setForm] = useState({
    destination:  '',
    budget:       '',
    duration:     '',
    interests:    [],
    travelMonth:  currentMonth,
    travelStyle:  'balanced',
  })
  const [errors, setErrors] = useState({})

  const validate = () => {
    const e = {}
    if (!form.destination.trim())                          e.destination = 'Enter a destination'
    if (!form.budget || form.budget <= 0)                  e.budget      = 'Enter a valid budget'
    if (!form.duration || form.duration < 1 || form.duration > 30) e.duration = 'Duration: 1–30 days'
    if (form.interests.length === 0)                       e.interests   = 'Pick at least one interest'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const toggleInterest = (id) => {
    setForm((prev) => ({
      ...prev,
      interests: prev.interests.includes(id)
        ? prev.interests.filter((i) => i !== id)
        : [...prev.interests, id],
    }))
    if (errors.interests) setErrors((e) => ({ ...e, interests: null }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (validate()) onSubmit(form)
  }

  return (
    <div className="w-full anim-init animate-fade-up delay-500">
      <div className="bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.18)] p-6 sm:p-8">

        {/* Card header */}
        <div className="flex items-center gap-3 mb-6 pb-5 border-b border-gray-100">
          <div className="w-8 h-8 rounded-lg bg-[#1a2e1a] flex items-center justify-center flex-shrink-0">
            <Zap className="w-4 h-4 text-[#a8d5b5]" strokeWidth={2} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[#1a2e1a] font-body">Plan Your Trip</h2>
            <p className="text-xs text-gray-400 font-body">Fill in your preferences below</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Destination */}
          <div>
            <label className="section-label block mb-2">Destination</label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a7c59]" />
              <input
                type="text"
                placeholder="e.g. Goa, Bali, Paris, Tokyo..."
                value={form.destination}
                onChange={(e) => {
                  setForm((p) => ({ ...p, destination: e.target.value }))
                  if (errors.destination) setErrors((er) => ({ ...er, destination: null }))
                }}
                className={`input-field pl-10 pr-4 py-3 rounded-xl text-sm ${errors.destination ? 'border-red-400' : ''}`}
              />
            </div>
            {errors.destination && <p className="text-xs text-red-500 mt-1.5">{errors.destination}</p>}
          </div>

          {/* Budget + Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="section-label block mb-2">Budget (₹)</label>
              <div className="relative">
                <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a7c59]" />
                <input
                  type="number"
                  placeholder="20,000"
                  min={1}
                  value={form.budget}
                  onChange={(e) => {
                    setForm((p) => ({ ...p, budget: e.target.value }))
                    if (errors.budget) setErrors((er) => ({ ...er, budget: null }))
                  }}
                  className={`input-field pl-10 pr-4 py-3 rounded-xl text-sm ${errors.budget ? 'border-red-400' : ''}`}
                />
              </div>
              {errors.budget && <p className="text-xs text-red-500 mt-1.5">{errors.budget}</p>}
            </div>
            <div>
              <label className="section-label block mb-2">Duration (days)</label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a7c59]" />
                <input
                  type="number"
                  placeholder="5"
                  min={1}
                  max={30}
                  value={form.duration}
                  onChange={(e) => {
                    setForm((p) => ({ ...p, duration: e.target.value }))
                    if (errors.duration) setErrors((er) => ({ ...er, duration: null }))
                  }}
                  className={`input-field pl-10 pr-4 py-3 rounded-xl text-sm ${errors.duration ? 'border-red-400' : ''}`}
                />
              </div>
              {errors.duration && <p className="text-xs text-red-500 mt-1.5">{errors.duration}</p>}
            </div>
          </div>

          {/* Travel Month + Travel Style */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="section-label block mb-2">Travel Month</label>
              <select
                value={form.travelMonth}
                onChange={(e) => setForm((p) => ({ ...p, travelMonth: e.target.value }))}
                className="input-field py-3 rounded-xl text-sm w-full"
              >
                {MONTHS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="section-label block mb-2">Travel Style</label>
              <select
                value={form.travelStyle}
                onChange={(e) => setForm((p) => ({ ...p, travelStyle: e.target.value }))}
                className="input-field py-3 rounded-xl text-sm w-full"
              >
                {TRAVEL_STYLES.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Interests */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="section-label">Interests</label>
              <span className="text-xs text-gray-400 font-body">{form.interests.length} selected</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map((interest) => (
                <button
                  key={interest.id}
                  type="button"
                  onClick={() => toggleInterest(interest.id)}
                  className={`interest-tag ${form.interests.includes(interest.id) ? 'active' : ''}`}
                >
                  <span>{interest.emoji}</span>
                  <span>{interest.label}</span>
                </button>
              ))}
            </div>
            {errors.interests && <p className="text-xs text-red-500 mt-2">{errors.interests}</p>}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="btn-accent w-full py-4 rounded-xl text-sm font-semibold mt-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <span>Generating your trip...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                <span>Generate My Trip</span>
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>

        </form>
      </div>
    </div>
  )
}