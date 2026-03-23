import { SiteHeader } from "~/components/SiteHeader"
import { SiteFooter } from "~/components/SiteFooter"
import { ThemeInjector } from "~/components/ThemeInjector"

export default function FrontendLayout({
  auth,
  children,
}: Readonly<{
  auth: React.ReactNode
  children: React.ReactNode
}>) {
  return (
    <>
      <ThemeInjector siteSettingsSlug="site_settings" />
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
      {auth}
    </>
  )
}
