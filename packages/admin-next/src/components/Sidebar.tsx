"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { VexConfig } from "@vexcms/core";

interface SidebarProps {
  config: VexConfig;
}

export function Sidebar({ config }: SidebarProps) {
  const pathname = usePathname();
  const basePath = config.admin?.basePath ?? "/admin";

  return (
    <aside className="flex w-64 flex-col border-r border-border bg-muted/30">
      <div className="flex h-14 items-center border-b border-border px-4">
        <span className="font-semibold">Vex CMS</span>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        <Link
          href={basePath}
          className={`block rounded-md px-3 py-2 text-sm ${pathname === basePath
              ? "bg-accent text-accent-foreground"
              : "hover:bg-accent/50"
            }`}
        >
          Dashboard
        </Link>

        {config.collections.map((collection) => {
          const href = `${basePath}/${collection.slug}`;
          const isActive = pathname.startsWith(href);
          const label =
            collection.config.labels?.plural ??
            collection.slug.charAt(0).toUpperCase() + collection.slug.slice(1);

          return (
            <Link
              key={collection.slug}
              href={href}
              className={`block rounded-md px-3 py-2 text-sm ${isActive
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent/50"
                }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
