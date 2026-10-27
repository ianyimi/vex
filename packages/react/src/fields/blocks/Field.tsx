"use client";

import { useContext } from "react";
import type { AnyFieldApi } from "@tanstack/react-form";
import type { BlocksField as BlocksFieldDef, GenericBlock } from "@vexcms/core";
import {
  buildDefaultBlock,
  cloneBlockWithFreshIds,
  CRUD_ACTIONS,
  getDataFields,
  PERMISSION_SCOPES,
  SLOT_IDS,
  type ComponentContributionInput,
  type FieldComponentProps,
} from "@vexcms/core";
import { parseAsString, useQueryState } from "nuqs";
import { toast } from "sonner";
import {
  BlocksField,
  useFieldContext,
  type BlockTypeOption,
  type BlocksHeaderClipboardMutators,
  type BlocksItemActionsProps,
} from "../../forms";
import type { ReactHKT } from "../../adapter";
import { usePermission } from "../../access";
import { VexConfigContext } from "../../config";
import { MODALS } from "../../modals";
import { RenderFields } from "../RenderFields";
import { SlotOutlet } from "../../slots/SlotOutlet";
import { AdminFieldBinding } from "../AdminFieldBinding";
import { BlockActionsMenu } from "./BlockActionsMenu";
import { useBlockClipboard } from "./useBlockClipboard";
import {
  builtinHeaderActions,
  resolvePasteCandidates,
  toastPasteOutcome,
  type BlocksHeaderActionsProps,
} from "./clipboard";

/**
 * The blocks admin field's own render body — reads the `FieldApi` provided
 * by the enclosing `AdminFieldBinding` via `useFieldContext()`, maps
 * `fieldDef` to the app form's `BlocksField`, and resolves the `blocks.
 * headerActions`/`blocks.itemActions` slots against the `localStorage`-backed
 * {@link useBlockClipboard}. `canPaste`/`canReplaceAll` are computed
 * synchronously from the clipboard's current contents against `fieldDef.max`
 * (mirroring the deleted `FormBlocks.tsx`'s own `pasteWouldExceedMax`/
 * `replaceWouldExceedMax` guards) so a paste/replace that would exceed `max`
 * is disabled, not just silently truncated. Every mutation is applied
 * through `BlocksField`'s own key-tracking mutators (passed in via
 * `headerActions`'/`itemActions`' render props), so pasting mid-array can
 * never desync an item's identity from its position.
 *
 * Also re-checks `usePermission` independently of the `readOnly` prop
 * (defense-in-depth): every current admin surface already threads a
 * permission-derived `readOnly` down through `RenderFields`, but a future
 * custom admin surface that forgets to would otherwise leave this field
 * editable.
 *
 * @param props - {@link FieldComponentProps} narrowed to `BlocksField`, for this item's own level of nesting.
 * @returns The blocks field's `BlocksField` body, wrapped in a labelled group.
 */
function BlocksFieldAdminInner(props: FieldComponentProps<{}, BlocksFieldDef>) {
  const field = useFieldContext<GenericBlock[]>();
  const config = useContext(VexConfigContext);
  const [activeField, setActiveField] = useQueryState(MODALS.editBlocks.urlParam, parseAsString);
  const blockDefMap = new Map(
    props.fieldDef.blocks.map((blockDef) => [blockDef.blockType, blockDef]),
  );
  const canEdit = usePermission({
    resource: props.collection.slug,
    action: CRUD_ACTIONS.update,
    scope: PERMISSION_SCOPES.any,
  });
  const readOnly = props.readOnly || props.fieldDef.admin.readOnly || !canEdit;
  const items: GenericBlock[] = field.state.value ?? [];
  const maxValue = props.fieldDef.max?.[0];

  const blockTypes: BlockTypeOption<GenericBlock>[] = props.fieldDef.blocks.map((blockDef) => ({
    type: blockDef.blockType,
    label: blockDef.label || blockDef.blockType,
    defaultCollapsed: blockDef.admin?.defaultCollapsed,
    fieldCount: Object.keys(getDataFields({ fields: blockDef.fields })).length,
    newBlock: () => buildDefaultBlock({ blockDef }),
  }));

  const { clipboard, copyBlocks } = useBlockClipboard();
  const pasteCandidates = resolvePasteCandidates({ blocks: clipboard?.blocks ?? [], blockDefMap });
  const pasteWouldExceedMax =
    maxValue !== undefined && items.length + pasteCandidates.accepted.length > maxValue;
  const replaceWouldExceedMax = maxValue !== undefined && pasteCandidates.accepted.length > maxValue;
  const canPaste = !readOnly && pasteCandidates.accepted.length > 0 && !pasteWouldExceedMax;
  const canReplaceAll = !readOnly && pasteCandidates.accepted.length > 0 && !replaceWouldExceedMax;

  function handlePasteAppend(mutators: BlocksHeaderClipboardMutators<GenericBlock>) {
    if (!canPaste) return;
    mutators.pushMany(pasteCandidates.accepted);
    toastPasteOutcome({
      acceptedCount: pasteCandidates.accepted.length,
      skipped: pasteCandidates.skipped,
      droppedKeys: pasteCandidates.droppedKeys,
    });
  }

  function handleReplaceAllRequest(mutators: BlocksHeaderClipboardMutators<GenericBlock>) {
    if (!canReplaceAll) return;
    mutators.replaceAll(pasteCandidates.accepted);
    toastPasteOutcome({
      acceptedCount: pasteCandidates.accepted.length,
      skipped: pasteCandidates.skipped,
      droppedKeys: pasteCandidates.droppedKeys,
    });
  }

  function handlePasteAt(position: number, insertAt: (position: number, blocks: GenericBlock[]) => void) {
    if (!canPaste) return;
    insertAt(position, pasteCandidates.accepted);
    toastPasteOutcome({
      acceptedCount: pasteCandidates.accepted.length,
      skipped: pasteCandidates.skipped,
      droppedKeys: pasteCandidates.droppedKeys,
    });
  }

  const projectHeaderActions = config?.admin.components.blocks.headerActions as unknown as
    | ComponentContributionInput<ReactHKT, BlocksHeaderActionsProps>[]
    | undefined;

  return (
    <div role="group" aria-labelledby={`${field.name}-label`} aria-disabled={readOnly}>
      <BlocksField<GenericBlock>
        label={props.fieldDef.label || props.name}
        description={props.fieldDef.description}
        required={props.fieldDef.required}
        index={props.index}
        max={maxValue}
        itemLabelSingular={props.fieldDef.labels?.singular ?? "Block"}
        itemLabelPlural={props.fieldDef.labels?.plural ?? "Blocks"}
        readOnly={readOnly}
        blockTypes={blockTypes}
        picker={{
          open: activeField === props.name,
          onOpenChange: (open) => void setActiveField(open ? props.name : null),
        }}
        cloneBlock={(block) =>
          cloneBlockWithFreshIds({ block, blockDef: blockDefMap.get(block.blockType)! })
        }
        renderBlock={({ name: blockName, block }) => {
          const blockDef = blockDefMap.get(block.blockType)!;
          if (Object.keys(blockDef.fields).length === 0) {
            return <p className="text-sm text-muted-foreground italic">This block has no configurable fields.</p>;
          }
          return (
            <RenderFields
              fields={blockDef.fields}
              collection={props.collection}
              namePrefix={blockName}
              readOnly={readOnly}
            />
          );
        }}
        headerActions={(mutators) => (
          <SlotOutlet<BlocksHeaderActionsProps>
            slotId={SLOT_IDS.blocks.headerActions}
            builtins={builtinHeaderActions}
            contributions={projectHeaderActions}
            contributedProps={{
              itemCount: items.length,
              canCopyAll: items.length > 0,
              canPaste,
              canReplaceAll,
              pasteCount: pasteCandidates.accepted.length,
              singular: props.fieldDef.labels?.singular ?? "Block",
              plural: props.fieldDef.labels?.plural ?? "Blocks",
              placement: "menu",
              onCopyAll: () => {
                copyBlocks({ blocks: items });
                toast(`Copied ${items.length} block${items.length === 1 ? "" : "s"}.`);
              },
              onPasteAppend: () => handlePasteAppend(mutators),
              onReplaceAllRequest: () => handleReplaceAllRequest(mutators),
            }}
            conditionName={field.name}
          />
        )}
        itemActions={(itemProps: BlocksItemActionsProps<GenericBlock>) => {
          const source = items[itemProps.index];
          if (!source) return null;
          return (
            <BlockActionsMenu
              index={itemProps.index}
              count={itemProps.itemCount}
              readOnly={itemProps.readOnly}
              canAdd={itemProps.canAdd}
              blockLabel={blockDefMap.get(source.blockType)?.label || source.blockType}
              onDuplicate={itemProps.onDuplicate ?? (() => {})}
              onInsertAbove={itemProps.onInsertAbove}
              onInsertBelow={itemProps.onInsertBelow}
              onMoveUp={itemProps.onMoveUp}
              onMoveDown={itemProps.onMoveDown}
              onRemove={itemProps.onRemove}
              onCopy={() => {
                copyBlocks({ blocks: [source] });
                toast(`Copied "${source.blockName || source.blockType}".`);
              }}
              onPasteAbove={() => handlePasteAt(itemProps.index, itemProps.insertAt)}
              onPasteBelow={() => handlePasteAt(itemProps.index + 1, itemProps.insertAt)}
              canPaste={canPaste}
            />
          );
        }}
      />
    </div>
  );
}

/**
 * Blocks admin field — binds `props.name` to the nearest `<AppForm>` (or an
 * explicit `field` prop) via `AdminFieldBinding`, then renders the app
 * form's `BlocksField` accordion wired to this field's clipboard/picker.
 *
 * @param props - {@link FieldComponentProps} narrowed to `BlocksField`.
 * @returns The app form's `BlocksField`, wrapping this blocks field's rendered items.
 */
export function BlocksFieldAdmin(
  props: FieldComponentProps<{}, BlocksFieldDef> & { field?: AnyFieldApi },
) {
  return (
    <AdminFieldBinding name={props.name} field={props.field}>
      <BlocksFieldAdminInner {...props} />
    </AdminFieldBinding>
  );
}

export { resolvePasteCandidates, toastPasteOutcome };
