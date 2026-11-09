"use client";

import type { ReactNode } from "react";
import { CRUD_ACTIONS, PERMISSION_SCOPES } from "@vexcms/core";
import { usePermission } from "../../../access";
import { useVexConfig } from "../../../config/VexConfigContext";
import { adminHref } from "../../../admin/adminHref";
import { VexLink } from "../../../ui/VexLink";
import { Button } from "../../../ui";
import { ListViewCreateDocumentModal } from "../create/ListViewCreateDocumentModal";
import { useListViewContext } from "../ListViewContext";

/**
 * `vex.list.create` — the "+ New {singular}" button and its create modal, moved verbatim
 * from `CollectionListView`'s prior JSX. Renders the link disabled (not absent) without
 * create access — `CollectionListView`'s own `runRbacStateSuite` coverage asserts an
 * `aria-disabled` link, not an absent one, matching `CollectionDeleteAction`'s own
 * self-check precedent (a disabled affordance, never a hidden one).
 *
 * `collection.disableCreate` is different in kind, not degree: a collection whose
 * rows only ever come from an external write path (the auth adapter's user collection,
 * populated by sign-up — decision D2) has no "create" workflow to offer at all, so this
 * renders nothing rather than a disabled affordance.
 *
 * @returns The create button + modal, or `null` when `disableCreate` is set.
 */
export function ListViewCreateAction(): ReactNode {
  const { collection } = useListViewContext();
  const canCreate = usePermission({
    resource: collection.slug,
    action: CRUD_ACTIONS.create,
    scope: PERMISSION_SCOPES.any,
  });
  const config = useVexConfig();

  if (collection.disableCreate) return null;

  return (
    <>
      <ListViewCreateDocumentModal collection={collection.slug} />
      <Button
        nativeButton={false}
        disabled={!canCreate}
        render={
          <VexLink href={adminHref({ type: "create", slug: collection.slug }, config.basePath)} />
        }
      >
        + New {collection.labels.singular}
      </Button>
    </>
  );
}
