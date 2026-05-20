'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ItineraryCard from '@/components/ItineraryCard'
import PackingList from '@/components/PackingList'
import WeatherCard from '@/components/WeatherCard'
import {
  MapPin, DollarSign, Calendar, ArrowLeft, Download,
  Map, Backpack, Umbrella, Share2
} from 'lucide-react'

const TABS = [
  { id: 'itinerary', label: 'Itinerary', icon: Map },
  { id: 'packing', label: 'Packing List', icon: Backpack },
]

function TripMetaBar({ formData }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5 mb-6">
      <div className="flex flex-wrap items-center gap-4 sm:gap-6">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#1a2e1a] flex items-center justify-center flex-shrink-0">
            <MapPin className="w-3.5 h-3.5 text-[#a8d5b5]" strokeWidth={2} />
          </div>
          <div>
            <div className="font-mono text-[9px] text-gray-400 uppercase tracking-widest">Destination</div>
            <div className="text-sm font-semibold text-[#1a2e1a] capitalize font-body">{formData?.destination}</div>
          </div>
        </div>

        <div className="h-8 w-px bg-gray-100 hidden sm:block" />

        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#4a7c59]" strokeWidth={1.8} />
          <div>
            <div className="font-mono text-[9px] text-gray-400 uppercase tracking-widest">Duration</div>
            <div className="text-sm font-semibold text-[#1a2e1a] font-body">{formData?.duration} days</div>
          </div>
        </div>

        <div className="h-8 w-px bg-gray-100 hidden sm:block" />

        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-[#e07b39]" strokeWidth={1.8} />
          <div>
            <div className="font-mono text-[9px] text-gray-400 uppercase tracking-widest">Budget</div>
            <div className="text-sm font-semibold text-[#1a2e1a] font-body">
              ₹{Number(formData?.budget).toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        <div className="h-8 w-px bg-gray-100 hidden sm:block" />

        <div className="flex flex-wrap gap-1.5 flex-1">
          {formData?.interests?.map((tag) => (
            <span key={tag} className="text-[10px] px-2.5 py-1 rounded-full bg-[#f0f7f2] border border-[#4a7c59]/20 text-[#4a7c59] font-mono capitalize">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

function EmptyState({ router }) {
  return (
    <div className="min-h-screen bg-[#fafaf8] flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-5xl mb-4">🗺️</div>
        <h2 className="font-display text-4xl text-[#1a2e1a] tracking-wide mb-2">NO TRIP DATA</h2>
        <p className="text-gray-400 text-sm mb-6 font-body">Head back and generate your dream trip.</p>
        <button
          onClick={() => router.push('/')}
          className="btn-primary px-6 py-3 rounded-xl text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>
      </div>
    </div>
  )
}

export default function ResultsPage() {
  const router = useRouter()
  const [result, setResult] = useState(null)
  const [formData, setFormData] = useState(null)
  const [activeTab, setActiveTab] = useState('itinerary')

  useEffect(() => {
    const savedResult = sessionStorage.getItem('wandergenie_result')
    const savedForm = sessionStorage.getItem('wandergenie_form')
    if (savedResult) setResult(JSON.parse(savedResult))
    if (savedForm) setFormData(JSON.parse(savedForm))
  }, [])

  if (!result) return <EmptyState router={router} />

  const { itinerary, packing_list, weather } = result

  return (
    <div className="min-h-screen bg-[#fafaf8]">
      {/* Results hero header */}
      <div className="bg-[#1a2e1a] pt-16 pb-10">
        <Navbar transparent={true} />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          {/* Back + actions */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 text-sm text-white/50 hover:text-white/80 transition-colors font-body group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              Plan another trip
            </button>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-white/50 hover:text-white/80 border border-white/10 hover:bg-white/8 transition-all font-body">
                <Share2 className="w-3.5 h-3.5" />
                Share
              </button>
              <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-white/50 hover:text-white/80 border border-white/10 hover:bg-white/8 transition-all font-body">
                <Download className="w-3.5 h-3.5" />
                Export
              </button>
            </div>
          </div>

          {/* Title */}
          <div>
            <span className="section-label text-[#a8d5b5] block mb-1">Your AI-generated trip</span>
            <h1 className="font-display text-5xl sm:text-7xl text-white tracking-wide">
              {formData?.destination?.toUpperCase() || 'YOUR TRIP'}
            </h1>
            <p className="text-white/40 font-body text-sm mt-2">
              {formData?.duration}-day itinerary · AI-crafted just for you
            </p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Trip meta bar */}
        <TripMetaBar formData={formData} result={result} />

        {/* Grid: main + sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: tabs + content */}
          <div className="lg:col-span-2">
            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-white border border-gray-100 rounded-xl mb-6 w-fit shadow-sm">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-body font-medium transition-all duration-200
                    ${activeTab === id
                      ? 'bg-[#1a2e1a] text-white shadow-sm'
                      : 'text-gray-500 hover:text-[#1a2e1a] hover:bg-gray-50'
                    }`}
                >
                  <Icon className="w-4 h-4" strokeWidth={1.8} />
                  {label}
                </button>
              ))}
            </div>

            {activeTab === 'itinerary' && (
              <div className="space-y-4">
                {itinerary?.map((day, i) => (
                  <ItineraryCard key={day.day} day={day} index={i} />
                ))}
              </div>
            )}

            {activeTab === 'packing' && (
              <div className="animate-fade-in">
                <PackingList packingList={packing_list} />
              </div>
            )}
          </div>

          {/* Right: sidebar */}
          <div className="space-y-5">
            {/* Weather */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Umbrella className="w-4 h-4 text-[#4a7c59]" strokeWidth={1.8} />
                <span className="section-label">Weather</span>
              </div>
              <WeatherCard weather={weather} />
            </div>

            {/* Trip summary card */}
            <div className="card p-5">
              <span className="section-label block mb-4">Trip Summary</span>
              <div className="space-y-3">
                {[
                  { label: 'Total days', value: `${formData?.duration} days` },
                  { label: 'Itinerary days', value: `${itinerary?.length || 0} planned` },
                  { label: 'Packing items', value: `${Object.values(packing_list || {}).flat().length} items` },
                  { label: 'Est. budget', value: `₹${Number(formData?.budget).toLocaleString('en-IN')}` },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <span className="text-xs text-gray-400 font-body">{label}</span>
                    <span className="text-xs font-mono text-[#1a2e1a] font-medium">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Interests */}
            <div className="card p-5">
              <span className="section-label block mb-3">Your Interests</span>
              <div className="flex flex-wrap gap-2">
                {formData?.interests?.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-3 py-1.5 rounded-full bg-[#f0f7f2] border border-[#4a7c59]/20 text-[#4a7c59] font-mono capitalize"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Replan CTA */}
            <button
              onClick={() => router.push('/')}
              className="w-full py-3.5 rounded-xl border border-gray-200 text-sm text-gray-500 hover:text-[#1a2e1a] hover:border-[#1a2e1a] hover:bg-[#f4f1ec] transition-all font-body flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Replan this trip
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
