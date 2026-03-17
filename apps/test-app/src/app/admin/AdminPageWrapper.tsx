"use client"

import { AdminPage } from "@vexcms/admin-next"
import type { ClientVexConfig } from "@vexcms/core"
import { extractLivePreviewConfigs } from "@vexcms/core"
import { RichTextFieldWithMedia } from "./RichTextFieldWithMedia"
import originalConfig from "~/../vex.config"

const livePreviewConfigs = extractLivePreviewConfigs(originalConfig)

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
      livePreviewConfigs={livePreviewConfigs}
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
