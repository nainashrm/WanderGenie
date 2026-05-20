'use client'
import Link from 'next/link'
import { Compass } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-[#1a2e1a] mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#4a7c59] flex items-center justify-center">
              <Compass className="w-4 h-4 text-white" strokeWidth={1.8} />
            </div>
            <span className="font-display text-xl tracking-wide text-white">WANDERGENIE</span>
          </Link>

          <p className="text-xs text-white/35 font-body">
            AI-powered travel planning · MVP v1.0 · {new Date().getFullYear()}
          </p>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#4a7c59]/30">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4a7c59]" />
            <span className="font-mono text-[10px] text-[#a8d5b5] uppercase tracking-widest">Beta</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
