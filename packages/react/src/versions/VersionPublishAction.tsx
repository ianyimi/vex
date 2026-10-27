"use client";

import { useMemo } from "react";
import { useStore } from "@tanstack/react-form";
import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import {
  DRAFT_ACTIONS,
  getDataFields,
  getFieldsDefaultValues,
  valuesEqual,
  vexConvexApi,
  type EditSlotProps,
} from "@vexcms/core";
import { useVexDocument } from "../documents/VexDocumentContext";
import { useVexForm } from "../forms/useVexForm";
import { useVexConfig } from "../config/VexConfigContext";
import { usePermission } from "../access";
import { useVexMutation } from "../hooks";
import { useVisibleFields } from "../fields/useVisibleFields";
import { pickReadableValues } from "../fields/readableFields";
import { useDocumentEditRuntime } from "../documents/DocumentEditRuntimeContext";
import { changedValues } from "../forms/changedValues";
import { applyVexFieldErrors } from "../utils/errors";
import { showsUnpublish } from "./showsUnpublish";
import { Button } from "../ui";

/**
 * Built-in `vex.publish` contribution for `edit.header.actions`. Renders nothing for a
 * non-versioned resource.
 *
 * @param props - `{ kind, slug }`.
 * @returns The Publish button, or `null` when the resource is not versioned.
 * @throws Never — a rejected mutation applies field errors via {@link applyVexFieldErrors}, never re-thrown.
 */
export function VersionPublishAction(props: EditSlotProps) {
  const config = useVexConfig();
  const document = useVexDocument();
  const form = useVexForm()!;
  const runtime = useDocumentEditRuntime();

  const resolved =
    props.kind === "collection"
      ? config.collections.find((c) => c.slug === props.slug)
      : config.globals.find((g) => g.slug === props.slug);
  const isVersioned = Boolean(resolved?.versions.drafts);
  const isDraftDoc = document.status === "draft";

  const canPublish = usePermission({
    resource: props.slug,
    action: DRAFT_ACTIONS.publish,
    data: document.saved,
  });

  // While the live document is a draft, the published row is a different Convex row — fetched
  // only then, to compute `matchesPublished` below (mirrors today's edit views).
  const { data: publishedCollectionRow } = useQuery({
    ...convexQuery(vexConvexApi.get, { id: document.id ?? "", collection: props.slug }),
    enabled: props.kind === "collection" && isVersioned && isDraftDoc,
  });
  const { data: publishedGlobalRow } = useQuery({
    ...convexQuery(vexConvexApi.globals.get, { slug: props.slug }),
    enabled: props.kind === "global" && isVersioned && isDraftDoc,
  });
  const publishedDocument = isDraftDoc
    ? props.kind === "collection"
      ? publishedCollectionRow
      : publishedGlobalRow
    : document.saved;

  const fields = resolved?.fields ?? {};
  const dataFields = useMemo(() => getDataFields({ fields }), [fields]);
  const visibleFields = useVisibleFields({ resource: props.slug, fields: dataFields, data: document.saved });
  const readableFieldKeys = visibleFields.map(([fieldKey]) => fieldKey);
  const formValues = useStore(form.store, (state) => state.values);
  const isDefaultValue = useStore(form.store, (state) => state.isDefaultValue);
  const matchesPublished =
    !!publishedDocument &&
    valuesEqual(
      formValues,
      pickReadableValues(getFieldsDefaultValues({ fields, document: publishedDocument }), readableFieldKeys),
    );
  const neverSaved = props.kind === "global" && document.saved === undefined;

  const { mutateAsync: publishMutation } = useVexMutation({
    collection: props.slug,
    errorToast: { message: "Publish failed" },
    getChanges: () => [{ after: { ...(document.saved ?? {}), ...form.state.values } }],
    mutationFn: vexConvexApi.versions.publish,
    operation: "publish",
  });

  /**
   * Publishes the currently-open draft (or, for a never-published document, the published
   * row), merging any not-yet-saved form edits on top in the same mutation call.
   *
   * @returns Promise resolving once publish completes (or rejects).
   * @throws Never — every rejection is caught, handled, and never re-thrown.
   */
  async function handlePublish(): Promise<void> {
    try {
      const changes = changedValues(form);
      const published = await publishMutation(
        props.kind === "collection"
          ? {
              collection: props.slug,
              id: document.id!,
              data: changes,
              version: runtime.viewedVersion?.version,
            }
          : { global: props.slug, data: changes, version: runtime.viewedVersion?.version },
      );
      if (props.kind === "collection") runtime.onDocumentIdChange?.(published);
      runtime.onViewVersion(null);
      runtime.onSaved(changes);
    } catch (error) {
      applyVexFieldErrors(form as unknown as Parameters<typeof applyVexFieldErrors>[0], error);
    }
  }

  if (!isVersioned) return null;

  // Publish/Unpublish share one spot (decision: developer feedback) — exactly one of the two
  // ever renders, never both side by side. `showsUnpublish` computes the SAME condition
  // `VersionUnpublishAction` renders on; kept as a shared predicate since the two built-ins are
  // independent contributions resolved separately by `DocumentEditSlotOutlet`, not siblings that
  // could share local state.
  if (showsUnpublish({ document, runtime })) return null;

  const disabled =
    !canPublish ||
    (runtime.viewedVersion === null && ((neverSaved && isDefaultValue) || matchesPublished));

  return (
    // `min-w-[100px]` matches `VersionUnpublishAction`'s button — the wider "Unpublish" label's
    // width, so swapping between the two on publish/unpublish never shifts neighbouring buttons.
    <Button
      type="button"
      className="min-w-[100px] transition-all duration-300"
      disabled={disabled}
      onClick={() => void handlePublish()}
    >
      Publish
    </Button>
  );
}
