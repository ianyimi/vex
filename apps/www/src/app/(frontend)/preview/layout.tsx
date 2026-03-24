import { ThemeInjector } from "~/components/ThemeInjector"
import { ThemeStyle } from "~/components/ThemeStyle"

export default function PreviewLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <>
      {/* Server-rendered draft theme CSS — eliminates flash on preview load */}
      <ThemeStyle drafts />
      {/* Client-side theme injector — picks up real-time draft changes via snapshot */}
      <ThemeInjector siteSettingsSlug="site_settings" drafts="snapshot" />
      {children}
    </>
  )
}
