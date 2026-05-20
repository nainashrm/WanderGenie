'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import HeroSection from '@/components/HeroSection'
import TripForm from '@/components/TripForm'
import Footer from '@/components/Footer'
import LoadingScreen from '@/components/LoadingScreen'
import { generateItinerary } from '@/lib/api'

const POPULAR_DESTINATIONS = [
  { name: 'Goa', emoji: '🌴', tag: 'Beaches & Vibes' },
  { name: 'Bali', emoji: '🏝️', tag: 'Culture & Surf' },
  { name: 'Manali', emoji: '🏔️', tag: 'Mountains' },
  { name: 'Paris', emoji: '🗼', tag: 'Romance & Art' },
  { name: 'Tokyo', emoji: '🗾', tag: 'City & Food' },
  { name: 'Maldives', emoji: '🌊', tag: 'Luxury & Coral' },
]

const FEATURES = [
  {
    emoji: '🗓️',
    title: 'Day-by-Day Itinerary',
    desc: 'Detailed daily plans with activities, meals, and local tips — perfectly timed.',
  },
  {
    emoji: '🎒',
    title: 'Smart Packing List',
    desc: 'Weather-aware packing suggestions tailored to your destination and interests.',
  },
  {
    emoji: '🌤️',
    title: 'Weather Intelligence',
    desc: "Real-time weather insights with advisories so you're never caught off guard.",
  },
]

export default function HomePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [destination, setDestination] = useState('')
  const [error, setError] = useState(null)

  const handleSubmit = async (formData) => {
    setIsLoading(true)
    setDestination(formData.destination)
    setError(null)
    try {
      const result = await generateItinerary(formData)
      sessionStorage.setItem('wandergenie_result', JSON.stringify(result))
      sessionStorage.setItem('wandergenie_form', JSON.stringify(formData))
      router.push('/results')
    } catch (err) {
      setIsLoading(false)
      setError(err.message || 'Something went wrong. Please try again.')
    }
  }

  if (isLoading) return <LoadingScreen destination={destination} />

  return (
    <div className="min-h-screen">
      {/* ── HERO: Full-bleed photo background ── */}
      <section className="relative min-h-screen flex flex-col">
        <div
          className="absolute inset-0"
          style={{
            background: `
              linear-gradient(
                to bottom,
                rgba(8,18,8,0.42) 0%,
                rgba(8,18,8,0.18) 35%,
                rgba(8,18,8,0.62) 100%
              ),
              linear-gradient(
                135deg,
                #0f2010 0%,
                #1a3a20 25%,
                #2d5a35 50%,
                #1a3a20 75%,
                #0f2010 100%
              )
            `,
          }}
        >
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px)',
              backgroundSize: '28px 28px',
            }}
          />
          <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, #4a7c59 0%, transparent 70%)' }} />
          <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] rounded-full opacity-15"
            style={{ background: 'radial-gradient(circle, #2e7d52 0%, transparent 70%)' }} />
        </div>

        <Navbar transparent={true} />

        <div className="relative z-10 flex-1 flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-20 pb-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <HeroSection />
              </div>
              <div>
                <TripForm onSubmit={handleSubmit} isLoading={isLoading} />
                {error && (
                  <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-100 text-center">
                    <p className="text-sm text-red-600 font-body">{error}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex justify-center pb-8">
          <div className="flex flex-col items-center gap-2 text-white/35">
            <span className="font-mono text-[10px] tracking-widest uppercase">Scroll to explore</span>
            <div className="w-px h-8 bg-white/20" />
          </div>
        </div>
      </section>

      {/* ── Why WanderGenie section ── */}
      <section className="bg-[#fafaf8] py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="section-label block mb-3">Why WanderGenie</span>
            <h2 className="font-display text-5xl sm:text-6xl text-[#1a2e1a] tracking-wide">
              TRAVEL SMARTER<br />WITH AI
            </h2>
            <p className="mt-4 text-gray-500 font-body max-w-md mx-auto text-sm leading-relaxed">
              From pristine beaches to mountain adventures, we make planning easy, fast, and personalized.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <div key={f.title} className="card p-6 anim-init animate-fade-up" style={{ animationDelay: `${i * 100}ms` }}>
                <div className="w-12 h-12 rounded-2xl bg-[#f4f1ec] flex items-center justify-center text-2xl mb-4">
                  {f.emoji}
                </div>
                <h3 className="font-semibold text-[#1a2e1a] mb-2 font-body text-base">{f.title}</h3>
                <p className="text-sm text-gray-500 font-body leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Popular Destinations ── */}
      <section className="bg-[#f4f1ec] py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <span className="section-label block mb-2">Top Destinations</span>
              <h2 className="font-display text-4xl sm:text-5xl text-[#1a2e1a] tracking-wide">
                WHERE WILL<br />YOU GO?
              </h2>
            </div>
            <p className="text-sm text-gray-400 font-body max-w-[200px] text-right hidden sm:block">
              From island escapes to city adventures, discover what's next.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {POPULAR_DESTINATIONS.map((dest, i) => (
              <div
                key={dest.name}
                className="group relative overflow-hidden rounded-2xl cursor-pointer anim-init animate-fade-up"
                style={{
                  animationDelay: `${i * 80}ms`,
                  background: 'linear-gradient(135deg, #1a2e1a, #2e5c3a)',
                  minHeight: '160px',
                }}
              >
                <div className="absolute inset-0 opacity-10"
                  style={{
                    backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)',
                    backgroundSize: '20px 20px',
                  }} />
                <div className="relative z-10 p-5 flex flex-col justify-between h-full min-h-[160px]">
                  <span className="text-3xl">{dest.emoji}</span>
                  <div>
                    <div className="font-display text-2xl text-white tracking-wide">{dest.name.toUpperCase()}</div>
                    <div className="font-mono text-[10px] text-[#a8d5b5] uppercase tracking-widest mt-1">{dest.tag}</div>
                  </div>
                </div>
                <div className="absolute inset-0 bg-[#4a7c59]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="bg-[#1a2e1a] py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-5xl sm:text-7xl text-white tracking-wide mb-4">
            READY TO<br /><span className="text-[#a8d5b5]">EXPLORE?</span>
          </h2>
          <p className="text-white/50 font-body text-sm mb-8 max-w-sm mx-auto">
            Fill in your travel preferences above and let AI do the heavy lifting.
          </p>
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
            className="btn-accent px-8 py-4 rounded-xl text-sm font-semibold inline-flex items-center gap-2"
          >
            Start Planning Now →
          </a>
        </div>
      </section>

      <Footer />
    </div>
  )
}