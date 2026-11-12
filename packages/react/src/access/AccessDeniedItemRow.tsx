"use client";

import { Badge, Button, Icon, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui";

/** Props for {@link AccessDeniedItemRow}. */
export interface AccessDeniedItemRowProps {
  /** The denied permission's subject, from `VexAccessError.resource`. */
  resource: string;
  /** The denied permission's action, from `VexAccessError.action`. */
  action: string;
  /** The denied field, when the denial is field-scoped (`VexAccessError.field`). */
  field?: string;
  /** Label for the hidden item — the target collection's singular label. */
  label: string;
}

/**
 * The locked-row shown in place of a relationship/upload item the viewer may
 * not read — a `VexAccessError` resolving a target document. Mirrors
 * `SavedListViewHiddenFilterBadge`'s visual language (muted `Lock` icon)
 * instead of surfacing the raw access-error message in red: the row reads
 * "Hidden {label}", and an `Info` icon button exposes the denied permission
 * (`resource/action`, plus `field` when the denial is field-scoped) in a
 * tooltip for sighted and screen-reader users alike.
 *
 * @param props - See {@link AccessDeniedItemRowProps}.
 * @returns The muted lock row with its info tooltip trigger.
 */
export function AccessDeniedItemRow({ resource, action, field, label }: AccessDeniedItemRowProps) {
  const permission = field ? `${resource}/${action} (field: ${field})` : `${resource}/${action}`;
  const tooltipText = `Requires ${permission}`;

  return (
    <p className="flex w-full items-center justify-center gap-1.5 text-muted-foreground">
      <Icon name="Lock" size={12} aria-hidden="true" className="shrink-0 text-muted-foreground" />
      <span>Hidden {label}</span>
      <TooltipProvider delay={200}>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="xs"
                icon="Info"
                iconPosition="center"
                type="button"
                aria-label={tooltipText}
              />
            }
          />
          <TooltipContent>{tooltipText}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </p>
  );
}

/** Props for {@link AccessDeniedChip}. */
export interface AccessDeniedChipProps {
  /** The denied permission's subject, from `VexAccessError.resource` / `HiddenDocument.resource`. */
  resource: string;
  /** The denied permission's action, from `VexAccessError.action` / `HiddenDocument.action`. */
  action: string;
  /** The denied field, when the denial is field-scoped. */
  field?: string;
  /** Label for the hidden item — the target collection's singular label. */
  label: string;
}

/**
 * Compact, badge-shaped counterpart of {@link AccessDeniedItemRow} for a
 * chip-list context — the relationship field's read-only `Display`, which
 * renders one `Badge` per related doc inline among its siblings rather than
 * one full-width row per item. Same muted lock icon and "Requires
 * resource/action" tooltip text, sized to sit inline.
 *
 * @param props - See {@link AccessDeniedChipProps}.
 * @returns A muted lock badge with the same info tooltip trigger.
 */
export function AccessDeniedChip({ resource, action, field, label }: AccessDeniedChipProps) {
  const permission = field ? `${resource}/${action} (field: ${field})` : `${resource}/${action}`;
  const tooltipText = `Requires ${permission}`;

  return (
    <Badge variant="secondary" className="gap-1 text-muted-foreground">
      <Icon name="Lock" size={11} aria-hidden="true" className="shrink-0" />
      <span>Hidden {label}</span>
      <TooltipProvider delay={200}>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="xs"
                icon="Info"
                iconPosition="center"
                type="button"
                aria-label={tooltipText}
              />
            }
          />
          <TooltipContent>{tooltipText}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </Badge>
  );
}
