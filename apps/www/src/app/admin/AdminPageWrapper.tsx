"use client"

import { AdminPage } from "@vexcms/admin-next"
import type { AdminInitialData } from "@vexcms/admin-next"
import type { ClientVexConfig } from "@vexcms/core"
import { extractLivePreviewConfigs, sanitizeConfigForClient } from "@vexcms/core"
import { RichTextFieldWithMedia } from "./RichTextFieldWithMedia"
import originalConfig from "~/../vex.config"

const livePreviewConfigs = extractLivePreviewConfigs(originalConfig)
// Sanitize on the client so component references in admin.components survive
// (they can't cross the RSC serialization boundary)
const clientConfig = sanitizeConfigForClient(originalConfig)

export function AdminPageWrapper({
  config: _serverConfig,
  path,
  initialData,
}: {
  config: ClientVexConfig
  path?: string[]
  initialData?: AdminInitialData
}) {
  return (
    <AdminPage
      config={clientConfig}
      path={path}
      initialData={initialData}
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
