export default function FrontendLayout({
  auth,
  children,
}: Readonly<{
  auth: React.ReactNode
  children: React.ReactNode
}>) {
  return (
    <>
      {children}
      {auth}
    </>
  )
}
