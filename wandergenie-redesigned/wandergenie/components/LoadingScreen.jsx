'use client'
import { useEffect, useState } from 'react'
import { Compass } from 'lucide-react'

const STEPS = [
  { label: 'Analyzing destination...', pct: 15 },
  { label: 'Checking weather patterns...', pct: 35 },
  { label: 'Crafting your itinerary...', pct: 60 },
  { label: 'Curating packing list...', pct: 80 },
  { label: 'Adding local insights...', pct: 92 },
  { label: 'Almost ready!', pct: 98 },
]

export default function LoadingScreen({ destination }) {
  const [step, setStep] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => {
        if (prev >= STEPS.length - 1) { clearInterval(interval); return prev }
        return prev + 1
      })
    }, 420)
    return () => clearInterval(interval)
  }, [])

  const current = STEPS[step]

  return (
    <div className="min-h-screen bg-[#0f1f0f] flex items-center justify-center px-4">
      <div className="text-center max-w-sm w-full">
        {/* Spinner */}
        <div className="flex justify-center mb-10">
          <div className="relative">
            <div className="w-20 h-20 rounded-full border border-[#4a7c59]/20 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-t-2 border-[#4a7c59] animate-spin" />
              <Compass className="w-8 h-8 text-[#a8d5b5] animate-spin-slow" strokeWidth={1.5} />
            </div>
          </div>
        </div>

        {/* Text */}
        <h2 className="font-display text-4xl text-white tracking-wide mb-2">
          PLANNING YOUR TRIP
        </h2>
        <p className="text-sm text-white/40 font-body mb-1">
          to <span className="text-[#a8d5b5] font-medium capitalize">{destination || 'paradise'}</span>
        </p>
        <p className="text-xs text-white/30 font-body mb-8">
          Our AI is handcrafting a bespoke experience just for you
        </p>

        {/* Progress */}
        <div className="progress-bar mb-3">
          <div className="progress-fill" style={{ width: `${current.pct}%` }} />
        </div>
        <p className="text-xs font-mono text-[#4a7c59] tracking-wide" key={step}>
          {current.label}
        </p>

        {/* Skeleton cards */}
        <div className="mt-10 space-y-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-white/5 border border-white/8 rounded-xl p-4 text-left"
              style={{ opacity: 1 - i * 0.28 }}
            >
              <div className="skeleton h-2.5 w-20 mb-3" />
              <div className="skeleton h-2 w-full mb-2" />
              <div className="skeleton h-2 w-4/5" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
