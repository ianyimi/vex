"use client";

import { useState, type ReactNode } from "react";
import { SLOT_IDS, type ComponentContributionInput, type EditSlotConfigInput, type EditSlotProps } from "@vexcms/core";
import type { ReactHKT } from "../adapter";
import { Button } from "../ui";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { useResolvedEditSlot, EditSlotContribution } from "./DocumentEditSlotOutlet";
import { EditActionsMenuDialogContext, type EditActionsMenuDialogState } from "./EditActionsMenuDialogContext";

/**
 * The ⋯ menu for a collection or global edit view's `edit.actionsMenu` slot (decision: Step 4
 * post-implementation note — least-used actions sit in a menu left of the status badge, instead
 * of standalone header buttons). Built-ins: `vex.revalidate`, `vex.duplicate`, both collection
 * documents only, appended to `props.builtins` by `CollectionEditView.tsx` the same way
 * `vex.delete` is appended to `edit.header.actions` — `GlobalEditView.tsx` passes no built-ins,
 * so a global's menu renders only when something (a project item, or the responsive header
 * collapsing `vex.livePreview` in — see `useHeaderActionsCollapse`) contributes one.
 *
 * Resolves and renders its contribution list through the SAME per-contribution
 * composition/error-boundary machinery as {@link DocumentEditSlotOutlet}
 * (`useResolvedEditSlot`/`EditSlotContribution`, exported from that module) — every contribution
 * gets its own `ComponentErrorBoundary`, override chains compose the same way, and the cached
 * composed-component fix (never build a component type inline in render — remounts wipe state)
 * applies here too.
 *
 * Renders NO trigger when the resolved, access-filtered contribution list is empty — a project
 * that hides both built-ins and contributes nothing gets no empty ⋯ button. This only holds when
 * every item gates its own visibility through `access` (`ComponentContributionInput.access`,
 * checked by `useResolvedEditSlot` before anything mounts) rather than returning `null` from
 * render: a contribution still counts as "present" in the resolved list even when it renders
 * `null` — the list length check that decides whether the ⋯ trigger mounts runs BEFORE any
 * component renders. `RevalidateMenuItem`'s `access: (ctx) => ctx.resource?.kind === "collection"`
 * is the pattern to follow for a kind-specific item; a permission-only gate (e.g. `canCreate`
 * here) is fine to resolve inside the component via `disabled`, since the item itself still
 * belongs in the menu.
 *
 * The dialog host: clicking a `DropdownMenuItem` closes the dropdown, and base-ui unmounts
 * `DropdownMenuContent` and every item inside it — so an item cannot own a dialog, or any state
 * for a promise that resolves after the click (Duplicate's conflict dialog, the collapsed
 * Delete's confirm dialog). `EditActionsMenuDialogContext` is provided INSIDE the dropdown (every
 * contribution can call `useEditActionsMenuDialog().open(...)`); the current dialog node renders
 * OUTSIDE `DropdownMenuContent`, as a sibling of the whole `DropdownMenu`, so it survives the
 * dropdown closing.
 *
 * @param props.root - The root-level `admin.components.edit.actionsMenu` config.
 * @param props.resource - The collection/global-level `actionsMenu` config.
 * @param props.builtins - This slot's built-in contributions (`[]` for a global with nothing collapsed into it).
 * @param props.contributedProps - `EditSlotProps` (or a superset, e.g. with `placement`) passed to every contribution.
 * @returns The ⋯ trigger, its menu, and the dialog host — or `null` when the resolved list is empty.
 */
export function DocumentEditActionsMenu<TProps extends EditSlotProps = EditSlotProps>(props: {
  root: EditSlotConfigInput<ReactHKT> | undefined;
  resource: EditSlotConfigInput<ReactHKT> | undefined;
  builtins: ComponentContributionInput<ReactHKT, EditSlotProps>[];
  contributedProps: TProps;
}) {
  const { contributions, overrides } = useResolvedEditSlot({
    slotId: SLOT_IDS.edit.actionsMenu,
    root: props.root,
    resource: props.resource,
    builtins: props.builtins,
    contributedProps: props.contributedProps,
  });

  const [dialogNode, setDialogNode] = useState<ReactNode>(null);
  const dialogState: EditActionsMenuDialogState = {
    open: (node) => setDialogNode(node),
    close: () => setDialogNode(null),
  };

  if (contributions.length === 0) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="outline"
              size="icon"
              icon="EllipsisVertical"
              iconPosition="center"
              aria-label="More actions"
            />
          }
        />
        <DropdownMenuContent align="end">
          <EditActionsMenuDialogContext value={dialogState}>
            {contributions.map((contribution) => (
              <EditSlotContribution<TProps>
                key={contribution.id}
                contribution={contribution}
                chain={overrides[contribution.id] ?? []}
                contributedProps={props.contributedProps}
              />
            ))}
          </EditActionsMenuDialogContext>
        </DropdownMenuContent>
      </DropdownMenu>
      {dialogNode}
    </>
  );
}
