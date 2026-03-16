"use client"

import { AdminPage } from "@vexcms/admin-next"
import type { ClientVexConfig } from "@vexcms/core"
import { RichTextFieldWithMedia } from "./RichTextFieldWithMedia"

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
      renderRichTextField={(props: any) => (
        <RichTextFieldWithMedia
          field={props.field}
          fieldDef={props.fieldDef}
          name={props.name}
          generateUploadUrl={props.generateUploadUrl}
          createMediaDocument={props.createMediaDocument}
          onUploadNew={props.onUploadNew}
        />
      )}
    />
  )
}
