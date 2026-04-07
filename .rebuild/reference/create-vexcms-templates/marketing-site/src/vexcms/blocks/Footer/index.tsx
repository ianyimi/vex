import type { BlockComponentProps } from "@vexcms/ui"

import { icons } from "lucide-react"
import Link from "next/link"

export { footerBlock } from "./config"

function SocialIcon({ name }: { name: string }) {
  const Icon = icons[name as keyof typeof icons]
  if (!Icon) return null
  return <Icon className="size-5" />
}

export default function FooterBlock({ block }: BlockComponentProps) {
  const { logoText, copyright, links, socialLinks } = block as {
    logoText?: string
    logoImage?: string
    copyright?: string
    links?: Array<{ label: string; href: string }>
    socialLinks?: Array<{ platform: string; href: string; icon?: string }>
  }

  return (
    <footer>
      <div className="mx-auto max-w-5xl px-6 py-8 md:py-16">
        <Link
          aria-label="go home"
          className="mx-auto block w-fit text-lg font-semibold"
          href="/"
        >
          {logoText ?? "Vex CMS"}
        </Link>

        <div className="mt-6 flex flex-wrap justify-center gap-6 text-sm">
          {(links ?? []).map((link, index) => (
            <Link
              className="text-muted-foreground hover:text-primary block duration-150"
              href={link.href}
              key={index}
            >
              <span>{link.label}</span>
            </Link>
          ))}
        </div>

        {socialLinks && socialLinks.length > 0 && (
          <div className="my-8 flex flex-wrap justify-center gap-6 text-sm">
            {socialLinks.map((social, index) => (
              <Link
                key={index}
                href={social.href}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label={social.platform}
              >
                {social.icon ? (
                  <SocialIcon name={social.icon} />
                ) : (
                  <span className="text-sm">{social.platform}</span>
                )}
              </Link>
            ))}
          </div>
        )}

        <span className="text-muted-foreground block text-center text-sm">
          &copy; {new Date().getFullYear()} {copyright ?? "All rights reserved"}
        </span>
      </div>
    </footer>
  )
}
