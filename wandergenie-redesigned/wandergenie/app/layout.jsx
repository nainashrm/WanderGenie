import { AuthProvider } from '@/context/AuthContext'
import './globals.css'

export const metadata = {
  title: 'WanderGenie — AI Travel Planner',
  description: 'AI-powered personalised travel itineraries in seconds',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}