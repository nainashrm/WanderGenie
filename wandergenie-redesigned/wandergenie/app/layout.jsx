import './globals.css'

export const metadata = {
  title: 'WanderGenie — AI Travel Planner',
  description: 'Plan your perfect trip with AI-powered itineraries and smart packing lists.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased bg-[#fafaf8]">
        {children}
      </body>
    </html>
  )
}
