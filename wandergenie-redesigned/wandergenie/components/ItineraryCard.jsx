'use client'
import { Utensils, Lightbulb, MapPin } from 'lucide-react'

const ACTIVITY_ICONS = ['🌅', '🗺️', '🍽️', '🌃', '🏛️', '🎭', '🌊', '🧘']
const MEAL_ICONS = { breakfast: '🥐', lunch: '🍱', dinner: '🍷' }

/**
 * Renders a meal value that can be either:
 *   - a plain string:  "Britto's, Baga Beach"
 *   - an object:       { place: "Britto's", dish: "Fish curry", estimatedCost: 350 }
 */
function MealContent({ suggestion }) {
  if (!suggestion) return null

  // Plain string — original mock format
  if (typeof suggestion === 'string') {
    return <span className="text-xs text-gray-600 leading-tight block font-body">{suggestion}</span>
  }

  // Object — Groq AI format { place, dish, estimatedCost }
  if (typeof suggestion === 'object') {
    return (
      <div className="text-left">
        {suggestion.place && (
          <span className="text-xs font-semibold text-[#1a2e1a] leading-tight block font-body">
            {suggestion.place}
          </span>
        )}
        {suggestion.dish && (
          <span className="text-xs text-gray-500 leading-tight block font-body mt-0.5">
            {suggestion.dish}
          </span>
        )}
        {suggestion.estimatedCost > 0 && (
          <span className="text-[10px] text-[#4a7c59] font-mono mt-0.5 block">
            ₹{suggestion.estimatedCost}
          </span>
        )}
      </div>
    )
  }

  return null
}

export default function ItineraryCard({ day, index }) {
  const { day: dayNum, title, activities, meals, tips, insider_tip, theme } = day

  // Support both plain string tips and insider_tip from Groq
  const tipText = tips || insider_tip || null

  return (
    <div
      className="card anim-init animate-fade-up"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Header band */}
      <div className="bg-[#1a2e1a] px-5 pt-4 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[#4a7c59] flex items-center justify-center">
            <span className="font-display text-white text-lg tracking-wide">
              {String(dayNum).padStart(2, '0')}
            </span>
          </div>
          <div>
            <span className="font-mono text-[10px] text-[#a8d5b5] uppercase tracking-widest">
              Day {dayNum}
            </span>
            <h3 className="text-sm font-semibold text-white font-body leading-tight">{title}</h3>
            {theme && (
              <p className="text-[10px] text-[#a8d5b5]/70 font-body mt-0.5 leading-tight">{theme}</p>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 space-y-5 bg-white">

        {/* Activities */}
        {activities && activities.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-3.5 h-3.5 text-[#4a7c59]" />
              <span className="section-label">Activities</span>
            </div>
            <div className="space-y-2">
              {activities.map((activity, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 rounded-xl bg-[#f4f1ec] hover:bg-[#eeeae3] transition-colors"
                >
                  <span className="text-base flex-shrink-0 mt-0.5">
                    {ACTIVITY_ICONS[i % ACTIVITY_ICONS.length]}
                  </span>
                  <span className="text-sm text-[#2a2a2a]/75 font-body leading-relaxed">
                    {typeof activity === 'string' ? activity : JSON.stringify(activity)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Meals */}
        {meals && typeof meals === 'object' && Object.keys(meals).length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Utensils className="w-3.5 h-3.5 text-[#e07b39]" />
              <span className="section-label">Meals</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(meals).map(([mealType, suggestion]) => (
                <div
                  key={mealType}
                  className="p-3 rounded-xl border border-gray-100 text-center bg-white"
                >
                  <span className="text-lg block mb-1">{MEAL_ICONS[mealType] || '🍴'}</span>
                  <span className="font-mono text-[9px] text-gray-400 uppercase tracking-wide block mb-1 capitalize">
                    {mealType}
                  </span>
                  <MealContent suggestion={suggestion} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pro tip */}
        {tipText && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-100">
            <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
            <p className="text-xs text-gray-600 font-body leading-relaxed">
              <span className="text-amber-600 font-semibold">Pro tip: </span>
              {tipText}
            </p>
          </div>
        )}

      </div>
    </div>
  )
}