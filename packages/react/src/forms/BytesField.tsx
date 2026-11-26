"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useStore } from "@tanstack/react-form";
import { formatBytes } from "@vexcms/core";
import { useFieldContext, useFormContext } from "./formContext";
import { FormFieldLayout, fieldDescribedBy, isFieldShowingError } from "./FormFieldLayout";
import { Button } from "../ui/button";
import { Icon } from "../ui/Icon";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Textarea } from "../ui/textarea";
import { cn } from "../utils/cn";
import type { BaseFormFieldProps, FieldControlProps } from "./types";

function bufferToHexText(buffer: ArrayBuffer | undefined): string {
  if (!buffer || buffer.byteLength === 0) return "";
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join(" ");
}

type HexParseResult = { ok: true; value: ArrayBuffer } | { ok: false; error: string };

function parseHexText(text: string): HexParseResult {
  const trimmed = text.trim();
  if (trimmed === "") return { ok: true, value: new ArrayBuffer(0) };
  const tokens = trimmed.split(/\s+/);
  const bytes = new Uint8Array(tokens.length);
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (!/^[0-9a-fA-F]{1,2}$/.test(token)) {
      return { ok: false, error: `Invalid hex byte "${token}" at position ${index + 1}.` };
    }
    bytes[index] = parseInt(token, 16);
  }
  return { ok: true, value: bytes.buffer };
}

function downloadBuffer(props: { buffer: ArrayBuffer; fileName: string }): void {
  const blob = new Blob([props.buffer]);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = props.fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

/** Props for {@link BytesEmptyInput} — the `bytes` field's File tab dropzone. */
interface BytesEmptyInputProps {
  /** The control's DOM id — applied to the hidden native `<input type="file">`, so `FormLabel`'s `htmlFor` finds it. */
  id: string;
  /** HTML `accept` attribute value for the picker/dropzone. */
  accept?: string;
  /** Marks the hidden native input `aria-required` for assistive tech. */
  required?: boolean;
  /** Whether the field must reject edits. */
  readOnly?: boolean;
  /** Whether `FormFieldLayout` is currently showing a validation error for this field. */
  invalid?: boolean;
  /** `aria-describedby` value, joining description/error ids. */
  describedBy?: string;
  /** Marks the field touched. */
  onBlur?: () => void;
  /** Called with the dropped/selected file. */
  onFile: (file: File) => void;
}

/**
 * The `bytes` field's File tab dropzone — a dashed-border box with a real
 * `<input type="file">` stretched across it at `opacity-0` (never
 * `display: none`, so Tab still reaches it with no extra keyboard wiring —
 * same technique as `fields/upload/EmptyInput.tsx`'s `UploadEmpty`) plus a
 * drag-active visual swap, borrowed from `media/MediaUploadDropzone.tsx`'s
 * own `isDragActive` state (`UploadEmpty` itself has no such feedback).
 * Always rendered, filled or not — dropping/choosing a new file always
 * replaces the committed payload, so there is no separate "replace" affordance.
 *
 * Local to {@link BytesControl} (same reasoning as `KeyValueField.tsx`
 * keeping `useKeyValueRows` inline) — `forms/` only allows `*Field.tsx` plus
 * a fixed set of file names, so this never got its own file.
 *
 * @param props - See {@link BytesEmptyInputProps}.
 * @returns The dropzone.
 */
function BytesEmptyInput(props: BytesEmptyInputProps): ReactNode {
  const [isDragActive, setIsDragActive] = useState(false);

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (file) props.onFile(file);
  }

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        if (!props.readOnly) setIsDragActive(true);
      }}
      onDragLeave={() => setIsDragActive(false)}
      onDrop={(event) => {
        event.preventDefault();
        setIsDragActive(false);
        if (props.readOnly) return;
        handleFiles(event.dataTransfer.files);
      }}
      className={cn(
        "relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-input p-8 text-center transition-colors",
        isDragActive ? "border-primary bg-primary/5" : "hover:border-primary",
      )}
    >
      <input
        id={props.id}
        type="file"
        accept={props.accept}
        disabled={props.readOnly}
        aria-invalid={props.invalid}
        aria-required={props.required}
        aria-describedby={props.describedBy}
        onBlur={props.onBlur}
        onChange={(event) => handleFiles(event.target.files)}
        className="absolute inset-0 cursor-pointer opacity-0"
      />
      <div className="pointer-events-none space-y-1 text-muted-foreground">
        <Icon name="Upload" className="mx-auto size-5" />
        <p className="text-sm">
          {isDragActive ? "Drop the file here" : "Drop a file here, or click to browse"}
        </p>
      </div>
    </div>
  );
}

/** Props for {@link BytesFilledInput} — the `bytes` field's File tab filled state. */
interface BytesFilledInputProps {
  /** The committed payload. */
  value: ArrayBuffer;
  /** The last-selected file's name, when known — `undefined` for a value loaded from storage (carries no filename of its own) or committed via the Hex tab. */
  fileName?: string;
  /** Whether the field must reject edits — disables Clear and Replace; Download stays available either way. */
  readOnly?: boolean;
  /** Downloads the committed payload as a file. */
  onDownload: () => void;
  /** Clears the committed payload. */
  onClear: () => void;
  /** Opens the native file picker to replace the committed payload. */
  onReplace: () => void;
}

/**
 * The `bytes` field's File tab filled state — a copy-and-adapt of
 * `fields/upload/FilledInput.tsx`'s `UploadFilledState` (scalar branch) and
 * its `UploadItemRow`: the same card (`flex items-center justify-between
 * gap-2 rounded border-2 border-border px-2` row) and the same
 * `flex flex-wrap items-center gap-2.5` actions bar below it with a
 * `variant="outline" icon="FilePenLine"` Replace button — REPLACES the
 * dropzone entirely while filled (upload's own filled state has no
 * dropzone either). Differences, each noted inline: a file icon stands in
 * for upload's media-document thumbnail (no document to query), no drag
 * handle (nothing to reorder), and the row's trailing buttons carry
 * Download alongside Clear — upload's row has only Remove; downloading a
 * payload that already lives in the document itself has no upload
 * equivalent.
 *
 * Local to {@link BytesControl} — see {@link BytesEmptyInput}'s doc comment
 * for why this never got its own file.
 *
 * @param props - See {@link BytesFilledInputProps}.
 * @returns The filled-state card plus its Replace actions bar.
 */
function BytesFilledInput(props: BytesFilledInputProps): ReactNode {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2 rounded border-2 border-border px-2">
        <div className="flex min-w-0 flex-1 items-center gap-2 font-mono">
          <Icon name="File" size={32} className="shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <div className="truncate text-sm" title={props.fileName}>
              {props.fileName ?? "Binary payload"}
            </div>
            <div className="truncate text-xs text-muted-foreground">{formatBytes(props.value.byteLength)}</div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="ghost"
            className="p-0 transition-colors duration-300"
            type="button"
            title="Download"
            onClick={props.onDownload}
            icon="Download"
            iconPosition="center"
          />
          <Button
            variant="ghost"
            className="p-0 transition-colors duration-300 hover:text-destructive"
            type="button"
            title="Clear"
            onClick={props.onClear}
            disabled={props.readOnly}
            icon="X"
            iconPosition="center"
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2.5">
        <Button variant="outline" size="sm" onClick={props.onReplace} disabled={props.readOnly} icon="FilePenLine">
          Replace
        </Button>
      </div>
    </div>
  );
}

/** Props for {@link BytesControl} — the `bytes` field's bare File/Hex tabbed control. */
export interface BytesControlProps extends FieldControlProps<ArrayBuffer | undefined> {
  /** Maximum accepted payload size, in bytes. A file (or committed hex value) over this is rejected with a message. */
  maxSize: number;
  /** HTML `accept` attribute value for the File tab's picker/dropzone. */
  accept?: string;
  /** Marks the File tab's picker input `aria-required` for assistive tech when the field is required. */
  required?: boolean;
}

/**
 * The `bytes` field's bare control — a "File"/"Hex" `Tabs` widget, built
 * only from {@link FieldControlProps} so it doubles as both the field's own
 * default control and the `renderDefault` an `admin.components.Input`
 * override falls back to. Tab triggers follow the same `TabsTrigger
 * render={<Button variant="ghost" icon="...">}` pattern as
 * `fields/relationship/RelationshipPicker.tsx`'s own tabs.
 *
 * File tab: {@link BytesEmptyInput}'s dropzone while empty; once a payload
 * is committed the dropzone is REPLACED by {@link BytesFilledInput} — a
 * copy-and-adapt of `fields/upload/FilledInput.tsx`'s `UploadFilledState`,
 * same card and Replace button, Replace re-opening the native picker via
 * `fileInputRef` — same two-state swap upload itself uses between
 * `UploadEmpty`/`UploadFilledState`. The filled state's own `id={props.id}`
 * input stays `sr-only` rather than `hidden` (`display: none`), so it keeps
 * `aria-required` discoverable by assistive tech instead of disappearing
 * from the accessibility tree entirely — `getControl()`-style lookups by id
 * still find it either way. Hex tab: unaffected by either state — a
 * textarea of space-separated hex byte pairs, max-height-capped with
 * internal scroll (see its own `className` comment). Typing updates the
 * textarea's own text instantly and (re)schedules `commitHexText` 250ms out
 * via `hexCommitTimerRef` — not per keystroke, which measured ~8ms median
 * (up to ~160ms) on a 100 KB file's hex text before this fix, almost
 * entirely `parseHexText`'s own O(text length) full re-parse (a tiny
 * value's keystroke cost measured under 1.5ms). `handleFile`/`handleClear`
 * cancel that timer explicitly (`cancelPendingHexCommit`) before doing
 * anything else, so a hex edit pending when a file replaces or clears the
 * field can never land after it — relying on `hexText` merely *changing*
 * (and so indirectly invalidating a prior schedule) would still leave a
 * window open while `handleFile` is mid-`await`. A valid, in-limit parse
 * commits via `props.onChange`; an invalid or oversize one shows a local
 * error and leaves the committed value alone. An explicitly emptied
 * textarea does NOT commit `undefined` from the debounce (a mid-delete the
 * user might still be typing over) — only `commitHexText`'s `commitEmpty`
 * option, set by the blur handler alone, does that. Both tabs' local
 * text/filename state resets from `props.value` whenever it changes from
 * anything other than this control's own commit (an external reset, or
 * Clear).
 *
 * @param props - See {@link BytesControlProps}.
 * @returns The tabbed control.
 */
export function BytesControl(props: BytesControlProps): ReactNode {
  const [activeTab, setActiveTab] = useState<"file" | "hex">("file");
  const [hexText, setHexText] = useState(() => bufferToHexText(props.value));
  const [hexError, setHexError] = useState<string | undefined>(undefined);
  const [fileError, setFileError] = useState<string | undefined>(undefined);
  const [fileName, setFileName] = useState<string | undefined>(undefined);
  const lastValueRef = useRef(props.value);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hexCommitTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (props.value !== lastValueRef.current) {
      lastValueRef.current = props.value;
      setHexText(bufferToHexText(props.value));
      setHexError(undefined);
      setFileName(undefined);
    }
  }, [props.value]);

  function cancelPendingHexCommit() {
    if (hexCommitTimerRef.current !== undefined) {
      clearTimeout(hexCommitTimerRef.current);
      hexCommitTimerRef.current = undefined;
    }
  }

  useEffect(() => cancelPendingHexCommit, []);

  async function handleFile(file: File) {
    cancelPendingHexCommit();
    let buffer: ArrayBuffer;
    try {
      buffer = await file.arrayBuffer();
    } catch {
      setFileError(`Could not read "${file.name}".`);
      return;
    }
    if (buffer.byteLength > props.maxSize) {
      setFileError(
        `File must be ${formatBytes(props.maxSize)} or smaller (got ${formatBytes(buffer.byteLength)}).`,
      );
      return;
    }
    setFileError(undefined);
    lastValueRef.current = buffer;
    setFileName(file.name);
    setHexText(bufferToHexText(buffer));
    setHexError(undefined);
    props.onChange(buffer);
  }

  function commitHexText(text: string, options?: { commitEmpty?: boolean }) {
    if (text === bufferToHexText(props.value)) return;
    if (text.trim() === "") {
      setHexError(undefined);
      if (options?.commitEmpty && props.value !== undefined) {
        lastValueRef.current = undefined;
        setFileName(undefined);
        props.onChange(undefined);
      }
      return;
    }
    const result = parseHexText(text);
    if (!result.ok) {
      setHexError(result.error);
      return;
    }
    if (result.value.byteLength > props.maxSize) {
      setHexError(
        `Value must be ${formatBytes(props.maxSize)} or smaller (got ${formatBytes(result.value.byteLength)}).`,
      );
      return;
    }
    setHexError(undefined);
    lastValueRef.current = result.value;
    setFileName(undefined);
    props.onChange(result.value);
  }

  function handleHexChange(nextText: string) {
    setHexText(nextText);
    cancelPendingHexCommit();
    hexCommitTimerRef.current = setTimeout(() => {
      hexCommitTimerRef.current = undefined;
      commitHexText(nextText);
    }, 250);
  }

  function handleClear() {
    cancelPendingHexCommit();
    lastValueRef.current = undefined;
    setFileError(undefined);
    setHexError(undefined);
    setFileName(undefined);
    setHexText("");
    props.onChange(undefined);
  }

  function handleDownload() {
    if (!props.value) return;
    downloadBuffer({ buffer: props.value, fileName: fileName ?? "payload.bin" });
  }

  const fileErrorId = `${props.id}-file-error`;
  const hexErrorId = `${props.id}-hex-error`;
  const fileDescribedBy = [props.describedBy, fileErrorId].filter(Boolean).join(" ");
  const hexDescribedBy = [props.describedBy, hexErrorId].filter(Boolean).join(" ");

  return (
    <div className="flex flex-col gap-2">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "file" | "hex")}>
        <TabsList>
          <TabsTrigger
            value="file"
            render={
              <Button variant="ghost" icon="Upload">
                File
              </Button>
            }
          />
          <TabsTrigger
            value="hex"
            render={
              <Button variant="ghost" icon="Binary">
                Hex
              </Button>
            }
          />
        </TabsList>
        <TabsContent value="file">
          {props.value === undefined ? (
            <BytesEmptyInput
              id={props.id}
              accept={props.accept}
              required={props.required}
              readOnly={props.readOnly}
              invalid={props.invalid}
              describedBy={fileDescribedBy}
              onBlur={props.onBlur}
              onFile={(file) => void handleFile(file)}
            />
          ) : (
            <>
              <input
                ref={fileInputRef}
                id={props.id}
                type="file"
                accept={props.accept}
                disabled={props.readOnly}
                aria-invalid={props.invalid}
                aria-required={props.required}
                aria-describedby={fileDescribedBy}
                onBlur={props.onBlur}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void handleFile(file);
                }}
                className="sr-only"
              />
              <BytesFilledInput
                value={props.value}
                fileName={fileName}
                readOnly={props.readOnly}
                onDownload={handleDownload}
                onClear={handleClear}
                onReplace={() => fileInputRef.current?.click()}
              />
            </>
          )}
          <p id={fileErrorId} className="mt-2 min-h-5 text-[0.8rem] text-destructive">
            {fileError}
          </p>
        </TabsContent>
        <TabsContent value="hex">
          <Textarea
            value={hexText}
            disabled={props.readOnly}
            aria-invalid={Boolean(hexError)}
            aria-describedby={hexDescribedBy}
            onChange={(event) => handleHexChange(event.target.value)}
            onBlur={() => {
              cancelPendingHexCommit();
              commitHexText(hexText, { commitEmpty: true });
              props.onBlur();
            }}
            placeholder="48 65 6c 6c 6f"
            className="max-h-72 overflow-y-auto"
          />
          <p id={hexErrorId} className="min-h-5 text-[0.8rem] text-destructive">
            {hexError}
          </p>
          {props.value !== undefined && (
            <p className="mt-2 text-xs text-muted-foreground">{formatBytes(props.value.byteLength)}</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

/** Props for {@link BytesField}. */
export interface BytesFieldProps extends BaseFormFieldProps<ArrayBuffer | undefined> {
  /** Maximum accepted payload size, in bytes — forwarded to {@link BytesControl}. */
  maxSize: number;
  /** HTML `accept` attribute value for the File tab — forwarded to {@link BytesControl}. */
  accept?: string;
}

/**
 * A binary-payload field bound to the nearest `<form.AppField name="...">`.
 * Renders {@link BytesControl} — or `props.renderControl`'s override, given
 * the same control props — inside the standard labelled layout.
 *
 * @param props - See {@link BytesFieldProps} and {@link BaseFormFieldProps}.
 * @returns The labelled File/Hex control, description and form error.
 */
export function BytesField(props: BytesFieldProps): ReactNode {
  const field = useFieldContext<ArrayBuffer | undefined>();
  const form = useFormContext();
  const submissionAttempts = useStore(form.store, (state) => state.submissionAttempts);
  const invalid = isFieldShowingError({ field, submissionAttempts });
  const describedBy = fieldDescribedBy({
    id: field.name,
    hasDescription: Boolean(props.description),
    showError: invalid,
  });
  const controlProps: BytesControlProps = {
    id: field.name,
    value: field.state.value,
    onChange: field.handleChange,
    onBlur: field.handleBlur,
    readOnly: Boolean(props.readOnly),
    invalid,
    describedBy,
    maxSize: props.maxSize,
    accept: props.accept,
    required: props.required,
  };
  const control = props.renderControl ? props.renderControl(controlProps) : <BytesControl {...controlProps} />;
  return (
    <FormFieldLayout
      id={field.name}
      label={props.label}
      required={props.required}
      description={props.description}
      index={props.index}
      field={field}
      submissionAttempts={submissionAttempts}
      before={props.before}
      after={props.after}
      className={props.className}
      readOnly={props.readOnly}
    >
      {control}
    </FormFieldLayout>
  );
}
