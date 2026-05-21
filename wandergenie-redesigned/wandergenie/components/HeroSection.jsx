'use client'
export default function HeroSection() {
  return (
    <div className="relative text-center mb-10 sm:mb-14">
      {/* Badge */}
      <div className="inline-flex items-center gap-2 pill pill-light mb-6 anim-init animate-fade-up delay-100">
        <span>✦</span>
        <span>AI Travel Intelligence</span>
      </div>

      {/* Main headline */}
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
    </div>
  )
}