"use client";

import { useState, type FormEvent } from "react";
import { VEX_VIEW_SOURCES, type VexViewSource } from "@vexcms/core";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Field,
  FieldContent,
  FieldLabel,
  Input,
  RadioGroup,
  RadioGroupItem,
} from "../../../ui";

/** Where a saved view's own write lands — `config`/`default` views are read-only and never a save target. */
export type SaveListViewTarget = Exclude<VexViewSource, "config" | "default">;

/** The values {@link SaveListViewDialog} collects before calling `onSubmit`. */
export interface SaveListViewDialogSubmitValues {
  name: string;
  description: string;
  target: SaveListViewTarget;
}

/** Props for {@link SaveListViewDialog}. */
export interface SaveListViewDialogProps {
  /** Whether the dialog is open — `SavedListViewTabs` owns this as local state (`saveDialog !== null`). */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** `"create"` (save as new) shows the scope selector; `"rename"` keeps the view's current source fixed. */
  mode: "create" | "rename";
  /** The initial name — the view's current name in rename mode, `""` in create mode. */
  name: string;
  /** The initial description. */
  description: string;
  /** The initial (and, in rename mode, FIXED) scope. */
  target: SaveListViewTarget;
  /**
   * Whether the caller may write a shared view (`VIEW_ACTIONS.createView`
   * for a new view, `.updateView` for renaming an existing shared one) —
   * disables the "Everyone with access" scope option when `false`. Users
   * without it can still save/rename locally (Decision 13).
   */
  canCreateShared: boolean;
  /**
   * Whether shared views are usable AT ALL for the current caller —
   * `false` only when org scoping is configured and the caller's own
   * organization doesn't resolve (`useCanAccessSharedSavedListViews`, polish fix,
   * Decision 3 continued). Unlike `canCreateShared` (disables the
   * "Everyone with access" option), this HIDES it entirely — a caller
   * with no org has no path to ever use it, not just a role they could be
   * granted, so there's nothing useful to show as disabled.
   */
  sharedViewsAvailable: boolean;
  /** Whether the save/rename mutation is in flight — disables the form and shows a spinner on Save. */
  isPending: boolean;
  /** Called with the trimmed form values on submit. The caller performs the actual write and closes the dialog on success. */
  onSubmit: (values: SaveListViewDialogSubmitValues) => void;
}

/**
 * Save-as-new / rename dialog for a saved view (Decision 11), reusing the
 * same `Dialog`/`Field` composition `ListViewCreateDocumentForm` and the edit
 * view's own dialogs use elsewhere in this folder. The Save button is
 * disabled while the name is blank.
 *
 * In create mode, the scope radio offers "Only you" (local, always
 * available) and "Everyone with access" (shared, Decision 33's copy —
 * disabled when `canCreateShared` is `false`, per-view access being out of
 * scope, Decision 13). In rename mode the scope is fixed to the view's
 * current source and no selector renders — renaming never changes where a
 * view lives; promoting a local view to shared is a separate confirm flow
 * (`SavedListViewTabs`' own promote dialog), not this one.
 *
 * @param props - See {@link SaveListViewDialogProps}.
 * @returns The dialog.
 */
export function SaveListViewDialog(props: SaveListViewDialogProps) {
  const [name, setName] = useState(props.name);
  const [description, setDescription] = useState(props.description);
  const [target, setTarget] = useState<SaveListViewTarget>(
    props.sharedViewsAvailable ? props.target : VEX_VIEW_SOURCES.local,
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const trimmedName = name.trim();
    if (trimmedName === "") return;
    props.onSubmit({ name: trimmedName, description: description.trim(), target });
  }

  return (
    <Dialog
      open={props.open}
      onOpenChange={(open) => {
        if (!open) {
          setName(props.name);
          setDescription(props.description);
          setTarget(props.sharedViewsAvailable ? props.target : VEX_VIEW_SOURCES.local);
        }
        props.onOpenChange(open);
      }}
    >
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{props.mode === "create" ? "Save view" : "Rename view"}</DialogTitle>
            <DialogDescription>
              {props.mode === "create"
                ? "Saves the current search, filters, sort, and columns as a view."
                : "Renames this view. Its search, filters, sort, and columns stay as they are."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <Field>
              <FieldLabel htmlFor="list-save-view-name">Name</FieldLabel>
              <FieldContent>
                <Input
                  id="list-save-view-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  autoFocus
                  disabled={props.isPending}
                />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="list-save-view-description">Description</FieldLabel>
              <FieldContent>
                <Input
                  id="list-save-view-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Optional"
                  disabled={props.isPending}
                />
              </FieldContent>
            </Field>
            {props.mode === "create" && (
              <Field>
                <FieldLabel>Who can see this view</FieldLabel>
                <FieldContent>
                  <RadioGroup
                    value={target}
                    onValueChange={(value) => setTarget(value as SaveListViewTarget)}
                  >
                    <label className="flex items-center gap-2 text-sm">
                      <RadioGroupItem value={VEX_VIEW_SOURCES.local} />
                      Only you
                    </label>
                    {props.sharedViewsAvailable && (
                      <label className="flex items-center gap-2 text-sm aria-disabled:opacity-50" aria-disabled={!props.canCreateShared}>
                        <RadioGroupItem value={VEX_VIEW_SOURCES.shared} disabled={!props.canCreateShared} />
                        Everyone with access
                      </label>
                    )}
                  </RadioGroup>
                </FieldContent>
              </Field>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => props.onOpenChange(false)} disabled={props.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={name.trim() === "" || props.isPending} isPending={props.isPending}>
              {props.mode === "create" ? "Save" : "Rename"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
