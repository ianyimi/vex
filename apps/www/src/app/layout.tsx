import type { Metadata } from "next"
import { Geist, Geist_Mono, Inter } from "next/font/google"

import ClientProviders from "~/components/providers/client"
import ServerProviders from "~/components/providers/server"

import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })
const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" })
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" })

export const metadata: Metadata = {
  description: "Test application for Vex CMS development",
  title: "Vex CMS Test App",
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
