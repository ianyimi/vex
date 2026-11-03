"use client";

import { type ReactNode } from "react";
import { useCopyToClipboard } from "@ts-hooks-kit/core";
import { toast } from "sonner";
import { Button } from "../../../../ui/button";

/**
 * Copy-button text for a field value: `JSON.stringify` for an
 * object/array-shaped value (a `select`'s option array, an `upload`'s
 * doc array, `array`/`group`/`blocks`/`json`'s structured values, a
 * `relationship`'s populated docs), `String(value)` for a primitive,
 * empty for `null`/`undefined`. The SAME resolver for every field now —
 * each field's own richer presentation lives in its registered `Display`
 * component (`fieldToDisplayComponent`), not in a second per-type
 * branch here.
 *
 * @param value - The raw field value to stringify for the copy button.
 * @returns The copy-button text.
 */
export function peekFieldCopyText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

/**
 * Icon-only copy button with toast-confirmed feedback — the same
 * `useCopyToClipboard` + `toast.success`/`toast.error` pair
 * `ListViewCopyLinkButton`/`ListViewRowCopyIdAction` already use, reused here
 * (not reimplemented) for every copy affordance the peek has: each
 * Fields-tab row (`PeekFieldRow`) and the JSON tab's own "Copy
 * JSON" action.
 *
 * @param props.disabled - Disables the button for an empty value (the
 *   same `isDisplayValueEmpty` rule every `Display` component uses for
 *   its own "—") — nothing to copy, nothing to confirm.
 * @returns An icon-only copy button; success toasts `Copied {label}`, failure toasts an error.
 */
export function PeekCopyButton(props: { label: string; text: string; disabled?: boolean }): ReactNode {
  const [, copyToClipboard] = useCopyToClipboard();

  async function handleCopy() {
    if (props.disabled) return;
    const ok = await copyToClipboard(props.text);
    if (ok) toast.success(`Copied ${props.label}`);
    else toast.error("Couldn't copy the value");
  }

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      icon="Copy"
      aria-label={`Copy ${props.label}`}
      disabled={props.disabled}
      onClick={() => void handleCopy()}
    />
  );
}
