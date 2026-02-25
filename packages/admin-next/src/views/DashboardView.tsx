import Link from "next/link";
import type { VexConfig } from "@vexcms/core";

interface DashboardViewProps {
  config: VexConfig;
}

export function DashboardView({ config }: DashboardViewProps) {
  const basePath = config.admin?.basePath ?? "/admin";

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="mt-2 text-muted-foreground">Welcome to Vex CMS</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {config.collections.map((collection) => {
          const fieldCount = Object.keys(collection.config.fields).length;
          const label =
            collection.config.labels?.plural ??
            collection.slug.charAt(0).toUpperCase() + collection.slug.slice(1);

          return (
            <Link
              key={collection.slug}
              href={`${basePath}/${collection.slug}`}
              className="block rounded-lg border border-border p-4 transition-colors hover:bg-accent/50"
            >
              <h2 className="font-semibold">{label}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {fieldCount} {fieldCount === 1 ? "field" : "fields"}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
