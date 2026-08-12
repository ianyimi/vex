"use client";

import { Card, CardDescription, CardHeader, CardTitle } from "../ui";
import { ClientVexConfig } from "@vexcms/core";

export function GlobalsListView({ config }: { config: ClientVexConfig }) {
  return (
    <div className="relative">
      <div className="flex items-center justify-between py-4">
        <div>
          <h1 className="text-2xl font-bold">Globals</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {config.globals.map((global) => (
          <a key={global.slug} href={`/admin/globals/${global.slug}`} className="group block">
            <Card className="cursor-pointer transition-shadow group-hover:shadow-md">
              <CardHeader>
                <CardTitle>{global.label}</CardTitle>
                <CardDescription>Edit Global</CardDescription>
              </CardHeader>
            </Card>
          </a>
        ))}
      </div>
    </div>
  );
}
