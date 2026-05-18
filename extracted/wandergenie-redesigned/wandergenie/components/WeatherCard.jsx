'use client'
import { Sun, Cloud, CloudRain, Thermometer, Droplets } from 'lucide-react'

const WEATHER_ICONS = {
  sunny: Sun,
  hot: Sun,
  cloudy: Cloud,
  'cloudy-rain': CloudRain,
  rain: CloudRain,
}

const WEATHER_BG = {
  sunny: '#fef4e0',
  hot: '#fde8d8',
  cloudy: '#eef3f8',
  'cloudy-rain': '#e8f0f8',
  rain: '#dce9f5',
}

const WEATHER_ACCENT = {
  sunny: '#e07b39',
  hot: '#c4622a',
  cloudy: '#4a7c59',
  'cloudy-rain': '#3a5f8a',
  rain: '#2a4f7a',
}

export default function WeatherCard({ weather }) {
  if (!weather) return null
  const { temp_high, temp_low, condition, humidity, rain_chance, icon } = weather
  const Icon = WEATHER_ICONS[icon] || Cloud
  const bg = WEATHER_BG[icon] || WEATHER_BG.cloudy
  const accent = WEATHER_ACCENT[icon] || WEATHER_ACCENT.cloudy

  const getRainMessage = () => {
    if (rain_chance >= 60) return '🌧️ High chance of rain. Pack a waterproof jacket and footwear.'
    if (rain_chance >= 30) return '🌦️ Some rain possible. Bring a compact umbrella.'
    return '☀️ Mostly clear skies. Sunscreen and sunglasses are a must.'
  }

  return (
    <div className="card overflow-hidden">
      {/* Top colored band */}
      <div className="p-5" style={{ background: bg }}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <span className="section-label block mb-1">Weather Forecast</span>
            <h3 className="text-base font-semibold text-[#1a2e1a] font-body">{condition}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${accent}20` }}>
            <Icon className="w-5 h-5" style={{ color: accent }} strokeWidth={1.8} />
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: Thermometer, label: 'High / Low', value: `${temp_high}° / ${temp_low}°C`, color: '#c45252' },
            { icon: Droplets, label: 'Humidity', value: `${humidity}%`, color: '#3a5f8a' },
            { icon: CloudRain, label: 'Rain', value: `${rain_chance}%`, color: '#4a7c59' },
          ].map(({ icon: StatIcon, label, value, color }) => (
            <div key={label} className="bg-white rounded-xl p-3 text-center shadow-sm">
              <StatIcon className="w-3.5 h-3.5 mx-auto mb-1" style={{ color }} strokeWidth={1.8} />
              <div className="font-mono text-[9px] text-gray-400 uppercase tracking-wide mb-0.5">{label}</div>
              <div className="text-xs font-semibold text-[#1a2e1a] font-body">{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Advisory */}
      <div className="px-5 py-4 bg-white border-t border-gray-100">
        <p className="text-xs text-gray-600 font-body leading-relaxed">{getRainMessage()}</p>
      </div>
    </div>
  )
}
