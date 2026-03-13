"use client";

import { useEffect, useRef } from "react";
import type { UploadFieldDef } from "@vexcms/core";
import { UploadField } from "@vexcms/ui";
import Link from "next/link";
import { useMediaPickerState } from "../hooks/useMediaPickers";

/**
 * Wraps UploadField with its own useMediaPickerState hook.
 * Each instance manages its own media picker search/pagination state.
 */
export function UploadFieldWrapper(props: {
  field: any;
  fieldDef: UploadFieldDef;
  name: string;
  onUploadNew: () => void;
  /** When set, automatically updates the field value (set after upload completes). */
  uploadedMediaId?: string;
  /** Base path for building edit links (e.g., "/admin") */
  basePath?: string;
  /** Initial value from the document (ensures value is available on first render). */
  initialValue?: string;
}) {
  const fieldValue = (props.field.state.value as string) || null;
  const selectedId = fieldValue || props.initialValue || null;
  const prevUploadedId = useRef(props.uploadedMediaId);

  // When a new media doc is uploaded via the modal, update the form field value
  useEffect(() => {
    if (
      props.uploadedMediaId &&
      props.uploadedMediaId !== prevUploadedId.current
    ) {
      props.field.handleChange(props.uploadedMediaId);
      prevUploadedId.current = props.uploadedMediaId;
    }
  }, [props.uploadedMediaId, props.field]);

  const pickerState = useMediaPickerState({
    collectionSlug: props.fieldDef.to,
    searchField: "filename",
    searchIndexName: "search_filename",
    selectedId: props.uploadedMediaId || selectedId,
  });

  const currentId = props.uploadedMediaId || selectedId;
  const mediaEditHref =
    currentId && props.basePath
      ? `${props.basePath}/${props.fieldDef.to}/${currentId}`
      : undefined;

  return (
    <UploadField
      field={props.field}
      fieldDef={props.fieldDef}
      name={props.name}
      mediaResults={pickerState.results}
      searchTerm={pickerState.searchTerm}
      onSearchChange={pickerState.setSearchTerm}
      canLoadMore={pickerState.canLoadMore}
      onLoadMore={pickerState.loadMore}
      isLoading={pickerState.isLoading}
      isSearching={pickerState.isSearching}
      onUploadNew={props.onUploadNew}
      selectedMedia={pickerState.selectedMedia}
      mediaEditHref={mediaEditHref}
      linkComponent={Link}
    />
  );
}
