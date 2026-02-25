import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Vex CMS Test App",
  description: "Test application for Vex CMS development",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
