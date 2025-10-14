import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css"
import { Suspense } from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { ReduxProvider } from "@/components/providers/redux-provider"

export const metadata: Metadata = {
  title: "HireNest",
  description: "Admin panel for HireNest",
  generator: "HireNest",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <ReduxProvider>
          <ThemeProvider attribute="class" defaultTheme="white" enableSystem disableTransitionOnChange>
            <Suspense fallback={null}>
              {children}
              <Toaster />
            </Suspense>
          </ThemeProvider>
        </ReduxProvider>
        <Analytics />
      </body>
    </html>
  )
}
