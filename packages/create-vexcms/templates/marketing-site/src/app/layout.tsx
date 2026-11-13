import type { Metadata } from "next"

import "./globals.css"

import { LivePreviewProvider } from "@vexcms/react"
import localFont from "next/font/local"

import ClientProviders from "~/components/providers/client"
import ServerProviders from "~/components/providers/server"
import { ThemeScript } from "~/components/ThemeScript"
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
 *
 * Loaded from the `geist` package rather than `next/font/google`: Google Fonts
 * intermittently serves extensionless `/l/font?kit=…&skey=…` URLs that break
 * Turbopack builds (vercel/next.js#99114).
 */
const geistSans = localFont({
  display: "swap",
  src: "../../node_modules/geist/dist/fonts/geist-sans/Geist-Variable.woff2",
  variable: "--font-sans",
  weight: "100 900",
})

const geistMono = localFont({
  display: "swap",
  src: "../../node_modules/geist/dist/fonts/geist-mono/GeistMono-Variable.woff2",
  variable: "--font-geist-mono",
  weight: "100 900",
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
  auth,
  children,
}: Readonly<{
  auth: React.ReactNode
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
            {/* Wraps the whole app, not just `(site)`: `<ThemeLive />` lives
                here (it skins every route, auth pages included) and the overlay
                only reaches consumers inside the provider. Rendered directly —
                it takes nothing but `children`, reading collections, globals,
                and allowed origins from `VexConfigContext` — and gates itself
                on the session-verified cookie plus
                `?vexLivePreview=1` (or the preview window name it writes on
                first activation), so every public route stays prerenderable. */}
            <LivePreviewProvider>
              <ThemeLive />
              {children}
              {/* `@auth` parallel slot (`app/@auth/`), sibling of this layout —
                  covers both `(frontend)` and `(vexcms)` since both groups share
                  this root. Rendered after `children` so the intercepted
                  `/auth/[pathname]` dialog/full-screen card portals/paints over
                  whichever page (site or admin) triggered it. */}
              {auth}
            </LivePreviewProvider>
          </ClientProviders>
        </ServerProviders>
      </body>
    </html>
  )
}
