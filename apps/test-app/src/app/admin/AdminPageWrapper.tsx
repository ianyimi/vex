"use client"

import { AdminPage } from "@vexcms/admin-next"
import type { ClientVexConfig } from "@vexcms/core"
import { PlateEditorField } from "@vexcms/richtext/editor"
import { defaultFeatures } from "@vexcms/richtext/editor"

export function AdminPageWrapper({
  config,
  path,
}: {
  config: ClientVexConfig
  path?: string[]
}) {
  return (
    <AdminPage
      config={config}
      path={path}
      renderRichTextField={({ field, fieldDef, name }) => (
        <PlateEditorField
          value={field.state.value}
          onChange={(val) => field.handleChange(val)}
          name={name}
          label={fieldDef.label ?? name}
          description={fieldDef.description}
          features={defaultFeatures}
        />
      )}
    />
  )
}
