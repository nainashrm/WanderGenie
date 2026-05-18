'use client'

export default function HeroSection() {
  return (
    <div className="relative text-center mb-10 sm:mb-14">
      {/* Badge */}
      <div className="inline-flex items-center gap-2 pill pill-light mb-6 anim-init animate-fade-up delay-100">
        <span>✦</span>
        <span>AI Travel Intelligence</span>
      </div>

      {/* Main headline — WANDER.ph inspired bold display type */}
      <h1 className="font-display text-[72px] sm:text-[96px] lg:text-[120px] leading-[0.92] tracking-wide text-white anim-init animate-fade-up delay-200">
        PLAN YOUR<br />
        <span className="text-[#a8d5b5]">DREAM TRIP</span><br />
        WITH AI
      </h1>

      {/* Subtitle */}
      <p className="mt-6 text-base sm:text-lg text-white/70 font-body font-light max-w-lg mx-auto leading-relaxed anim-init animate-fade-up delay-300">
        Describe your travel preferences. Our AI crafts a personalized
        day-by-day itinerary with a smart weather-aware packing list — in seconds.
      </p>

      {/* Stats */}
      <div className="mt-10 flex items-center justify-center gap-4 sm:gap-8 anim-init animate-fade-up delay-400">
        {[
          { value: '10K+', label: 'Trips Planned' },
          { value: '120+', label: 'Destinations' },
          { value: '4.9★', label: 'User Rating' },
        ].map(({ value, label }) => (
          <div key={label} className="stat-card min-w-[90px]">
            <div className="font-display text-2xl text-white tracking-wide">{value}</div>
            <div className="text-xs text-white/50 font-body mt-0.5">{label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
