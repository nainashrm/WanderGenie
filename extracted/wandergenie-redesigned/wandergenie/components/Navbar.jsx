'use client'
import Link from 'next/link'
import { Compass } from 'lucide-react'

export default function Navbar({ transparent = false }) {
  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      transparent
        ? 'bg-transparent'
        : 'bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-[#1a2e1a] flex items-center justify-center">
              <Compass className="w-4.5 h-4.5 text-[#c8e6c9]" strokeWidth={1.8} />
            </div>
            <span className={`font-display text-2xl tracking-wide ${transparent ? 'text-white' : 'text-[#1a2e1a]'}`}>
              WANDERGENIE
            </span>
          </Link>

          {/* Right: nav items */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#4a7c59]/10 border border-[#4a7c59]/20">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4a7c59] animate-pulse" />
              <span className="font-mono text-[10px] text-[#4a7c59] uppercase tracking-widest font-medium">AI Powered</span>
            </div>
            <Link
              href="/"
              className={`hidden sm:block text-sm font-medium transition-colors ${
                transparent ? 'text-white/80 hover:text-white' : 'text-gray-500 hover:text-[#1a2e1a]'
              }`}
            >
              Plan a Trip
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
