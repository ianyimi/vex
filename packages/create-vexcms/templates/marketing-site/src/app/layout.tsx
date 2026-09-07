import type { Metadata } from "next"

import "./globals.css"

import { ThemeScript } from "@vexcms/react"
import { Geist, Geist_Mono } from "next/font/google"

import ClientProviders from "~/components/providers/client"
import ServerProviders from "~/components/providers/server"
import { ThemeLive } from "~/components/ThemeLive"

/**
 * Geist carries the whole type system — display through body — so weight is
 * the only axis the design varies. 800 is the hero display weight; without it
 * next/font would synthesise it and the -0.04em tracking would fall apart.
 *
 * `--font-sans` is also written by the active theme record's `fontFamily`
 * (THEME_SHARED_TOKENS). Both land at specificity (0,1,0), so the theme's
 * stack acts as the fallback and an editor can change the family without a
 * redeploy.
 */
const geistSans = Geist({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700", "800"],
})

const geistMono = Geist_Mono({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-geist-mono",
  weight: ["400", "500"],
})

/**
 * `icons.icon` lists the SVG first: browsers pick the last format they
 * understand, and every current engine understands `image/svg+xml`, so the
 * `.ico` only serves older ones. All three assets are the ember chevron from
 * `BrandMark` — placeholder branding, exactly like `BrandMark` itself and the
 * "VexCMS" site name in `convex/seed.ts`. Replace `public/favicon.svg`,
 * `public/favicons/favicon.ico` and `public/favicons/apple-touch-icon.png`
 * with your own mark; `.ico` and `apple-touch-icon` must stay raster, since
 * older browsers and iOS home-screen icons do not accept SVG.
 */
export const metadata: Metadata = {
  description: "Built with VexCMS",
  icons: {
    apple: "/favicons/apple-touch-icon.png",
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicons/favicon.ico", sizes: "16x16 32x32 48x48" },
    ],
  },
  title: "VexCMS",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      lang="en"
      suppressHydrationWarning
    >
      <head>
        {/* Applies the persisted light/dark class before first paint (no
            flash). Site theming now renders in `(frontend)/(site)/layout.tsx`
            — the admin layout re-emits its own scope for `/admin`. */}
        <ThemeScript />
      </head>
      <body>
        <ServerProviders>
          <ClientProviders>
            <ThemeLive />
            {children}
          </ClientProviders>
        </ServerProviders>
      </body>
    </html>
  )
}
