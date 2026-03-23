import { ThemeInjector } from "~/components/ThemeInjector"

export default function PreviewLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <>
      <ThemeInjector siteSettingsSlug="site_settings" drafts="snapshot" />
      {children}
    </>
  )
}
