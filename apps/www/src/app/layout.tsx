import type { Metadata } from "next"
import { Geist, Geist_Mono, Inter } from "next/font/google"

import ClientProviders from "~/components/providers/client"
import ServerProviders from "~/components/providers/server"

import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })
const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" })
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" })

export const metadata: Metadata = {
  title: {
    default: "Vex CMS",
    template: "%s",
  },
  description:
    "The headless CMS built for Convex. Real-time data, type-safe schemas, and a beautiful admin panel.",
  icons: {
    icon: "/favicons/favicon.ico",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${geistSans.variable} ${geistMono.variable}`}>
      <body className="antialiased">
        <ServerProviders>
          <ClientProviders>
            {children}
          </ClientProviders>
        </ServerProviders>
      </body>
    </html>
  )
}
