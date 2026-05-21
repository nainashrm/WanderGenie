'use client'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { Zap, User, LogOut, LayoutDashboard } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function Navbar({ transparent = false }) {
  const { user, logout } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  return (
    <nav className={`w-full z-50 ${transparent ? 'absolute top-0 left-0' : 'bg-[#1a2e1a]'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-lg bg-[#4a7c59] flex items-center justify-center group-hover:bg-[#5a8c69] transition-colors">
              <Zap className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-display text-lg text-white tracking-wide">WANDERGENIE</span>
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                {/* User name */}
                <span className="hidden sm:block text-xs text-white/50 font-body mr-1">
                  Hi, {user.name?.split(' ')[0]}
                </span>

                {/* Dashboard */}
                <Link href="/dashboard"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-white/70 hover:text-white hover:bg-white/10 transition-all font-body">
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>

                {/* Sign out */}
                <button onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-white/70 hover:text-white hover:bg-white/10 transition-all font-body">
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </>
            ) : (
              <>
                <Link href="/login"
                  className="px-4 py-2 rounded-lg text-xs text-white/70 hover:text-white hover:bg-white/10 transition-all font-body">
                  Sign In
                </Link>
                <Link href="/register"
                  className="px-4 py-2 rounded-lg text-xs bg-[#4a7c59] hover:bg-[#5a8c69] text-white transition-all font-body font-semibold">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}