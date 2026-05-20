'use client'
import { useState } from 'react'
import { Shirt, Package, Gem, Heart, ChevronDown } from 'lucide-react'

const SECTION_CONFIG = {
  clothing:   { icon: Shirt,   label: 'Clothing',        accent: '#4a7c59', bg: '#f0f7f2' },
  essentials: { icon: Package, label: 'Essentials',      accent: '#e07b39', bg: '#fef4ed' },
  accessories:{ icon: Gem,     label: 'Accessories',     accent: '#7c6a4a', bg: '#f7f4f0' },
  health:     { icon: Heart,   label: 'Health & Safety', accent: '#c45252', bg: '#fef2f2' },
}

function PackingSection({ sectionKey, items }) {
  const [checked, setChecked] = useState({})
  const [open, setOpen] = useState(true)
  const config = SECTION_CONFIG[sectionKey] || SECTION_CONFIG.essentials
  const Icon = config.icon
  const checkedCount = Object.values(checked).filter(Boolean).length
  const pct = items.length ? (checkedCount / items.length) * 100 : 0

  return (
    <div className="card">
      {/* Header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: config.bg }}
          >
            <Icon className="w-4 h-4" style={{ color: config.accent }} strokeWidth={1.8} />
          </div>
          <div className="text-left">
            <span className="font-semibold text-[#1a2e1a] text-sm font-body">{config.label}</span>
            <span className="text-xs text-gray-400 font-mono ml-2">{checkedCount}/{items.length}</span>
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Progress */}
      {open && (
        <div className="progress-bar mx-5">
          <div className="progress-fill" style={{ width: `${pct}%`, background: config.accent }} />
        </div>
      )}

      {/* Items */}
      {open && (
        <div className="p-4 pt-3 space-y-1">
          {items.map((item, i) => (
            <label
              key={i}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all group
                ${checked[i] ? 'bg-gray-50 opacity-55' : 'hover:bg-gray-50'}`}
            >
              <input
                type="checkbox"
                className="custom-checkbox"
                checked={!!checked[i]}
                onChange={(e) => setChecked((c) => ({ ...c, [i]: e.target.checked }))}
              />
              <span
                className={`text-sm font-body transition-all ${
                  checked[i] ? 'line-through text-gray-400' : 'text-gray-700 group-hover:text-[#1a2e1a]'
                }`}
              >
                {item.item}
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

export default function PackingList({ packingList }) {
  if (!packingList) return null
  return (
    <div className="space-y-4">
      {Object.entries(packingList).map(([key, items]) => (
        <PackingSection key={key} sectionKey={key} items={items} />
      ))}
    </div>
  )
}
