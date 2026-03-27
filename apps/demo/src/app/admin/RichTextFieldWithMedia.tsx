"use client"

import { PlateEditorField } from "@vexcms/richtext/editor"
import { defaultFeatures } from "@vexcms/richtext/editor"
import { useMediaPickerState } from "@vexcms/admin-next"

/**
 * Inner component that always calls useMediaPickerState (no conditional hook).
 */
function WithMedia({
  field,
  fieldDef,
  name,
  mediaCollection,
  generateUploadUrl,
  createMediaDocument,
  onUploadNew,
}: {
  field: any
  fieldDef: any
  name: string
  mediaCollection: string
  generateUploadUrl?: () => Promise<string>
  createMediaDocument?: (props: { collectionSlug: string; fields: Record<string, unknown> }) => Promise<string>
  onUploadNew?: () => void
}) {
  const mediaPicker = useMediaPickerState({
    collectionSlug: mediaCollection,
    searchField: "filename",
    searchIndexName: "search_filename",
    selectedId: null,
  })

  return (
    <PlateEditorField
      value={field.state.value}
      onChange={(val: any) => field.handleChange(val)}
      name={name}
      label={fieldDef.label ?? name}
      description={fieldDef.description}
      features={defaultFeatures}
      mediaCollection={mediaCollection}
      mediaResults={mediaPicker.results}
      mediaSearchTerm={mediaPicker.searchTerm}
      onMediaSearchChange={mediaPicker.setSearchTerm}
      mediaCanLoadMore={mediaPicker.canLoadMore}
      onMediaLoadMore={mediaPicker.loadMore}
      mediaIsLoading={mediaPicker.isLoading}
      onUploadNew={onUploadNew}
      generateUploadUrl={generateUploadUrl}
      createMediaDocument={createMediaDocument}
    />
  )
}

/**
 * Wrapper that creates media picker state for a richtext field
 * when mediaCollection is configured.
 */
export function RichTextFieldWithMedia({
  field,
  fieldDef,
  name,
  generateUploadUrl,
  createMediaDocument,
  onUploadNew,
}: {
  field: any
  fieldDef: any
  name: string
  generateUploadUrl?: () => Promise<string>
  createMediaDocument?: (props: { collectionSlug: string; fields: Record<string, unknown> }) => Promise<string>
  onUploadNew?: () => void
}) {
  const mediaCollection = fieldDef?.mediaCollection as string | undefined

  if (mediaCollection) {
    return (
      <WithMedia
        field={field}
        fieldDef={fieldDef}
        name={name}
        mediaCollection={mediaCollection}
        generateUploadUrl={generateUploadUrl}
        createMediaDocument={createMediaDocument}
        onUploadNew={onUploadNew}
      />
    )
  }

  return (
    <PlateEditorField
      value={field.state.value}
      onChange={(val: any) => field.handleChange(val)}
      name={name}
      label={fieldDef.label ?? name}
      description={fieldDef.description}
      features={defaultFeatures}
    />
  )
}
