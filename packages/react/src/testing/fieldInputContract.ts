import {
  type ChangeEvent,
  type ComponentType,
  type ReactNode,
  createElement,
  useState,
} from "react";
import { useForm } from "@tanstack/react-form";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  ADMIN_FIELDS,
  adminFieldToInputSchema,
  defineCollection,
  defineConfig,
  text,
  type AdminDataField,
  type RichTextDocument,
  type VexEditorAdapter,
  type VexEditorComponentProps,
  type VexRenderComponentProps,
  type CollectionConfig,
  type VexClientConfig,
  type FieldComponentProps,
  type ComponentOverrideInput,
} from "@vexcms/core";
import { defineMediaCollection } from "@vexcms/file-storage-convex/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { VexConfigContext } from "../config/VexConfigContext";
import { AppForm } from "../forms";
import type { SlotOverrideProps } from "../slots";
import type { ReactHKT } from "../adapter";

/**
 * The slice of TanStack Form's API the contract's assertions actually read.
 * Named here rather than reusing `AnyFormApi`: `useForm`'s concrete return type
 * is not assignable to it (its 12 generic parameters default to shapes the
 * concrete instantiation does not match), and this states exactly what the
 * suite depends on.
 */
export interface ContractFormProbe {
  getFieldValue: (name: string) => unknown;
  getFieldMeta: (name: string) => { isTouched: boolean } | undefined;
}
import { expectNoA11yViolations } from "./a11y";
import { testCollection } from "./harness/accessFixtures";
import type { FieldFixture } from "./fixtures/types";

/** Options for {@link runFieldInputContractSuite}. */
export interface FieldInputContractOptions<
  TField extends AdminDataField = AdminDataField,
  TValue = unknown,
> {
  fixture: FieldFixture<TField, TValue>;
  /**
   * The field's input component. Typed by the props `renderField` actually
   * passes rather than `FieldComponentProps<BaseFieldMeta, TField>`: every real
   * field input is an admin `*FieldAdmin` component bound through
   * `AdminFieldBinding`, so its props are `FieldComponentProps<{}, XField>`
   * and `{}` is not `BaseFieldMeta`. None of the props below depend on the
   * meta parameter anyway — it only constrains `TField`, which this suite
   * takes directly.
   *
   * `field` is deliberately absent: this suite always mounts through the
   * `<AppForm>` context path, never the explicit-`field` escape hatch. Declaring
   * it as `field?: unknown` would also break assignability outright — props are
   * contravariant, so a component requiring `AnyFieldApi` cannot accept a
   * caller promising to pass any `unknown`.
   */
  Component: ComponentType<{
    name: string;
    fieldDef: TField;
    readOnly: boolean;
    collection: CollectionConfig;
    index?: number;
  }>;
  /** Test-only collection config the field is rendered as part of. Defaults to the shared
   * harness's testCollection from testing/harness/accessFixtures.ts if omitted. */
  collection?: CollectionConfig;
  /** Per-type extension point for assertions the shared contract can't generalize
   * (e.g. select's hasMany branch, date's time-picker opt-in). Receives the same options. */
  extra?: (options: FieldInputContractOptions<TField, TValue>) => void;
}

/**
 * `AppForm` narrowed to the two props this harness passes.
 *
 * Spec 2026-09-07 Step 2 widened `AnyFormApi`'s validator-slot generics to
 * default to their own declared bound (`undefined | FormValidateOrFn<TFormData>`)
 * instead of the narrower `undefined`, per AP-006 — see `AppFormContext.ts`.
 * That fix does not reach this cast. `createElement(AppForm, props)` passes
 * `AppForm` as a bare, uninstantiated generic function reference; TypeScript
 * resolves `createElement`'s own type parameter by erasing EVERY one of
 * `AppForm`'s generics — including `TFormData` itself, not just the
 * validator slots — to `unknown` before it ever looks at the `props`
 * argument. A concrete form's `options.validators.onSubmit: (props: { value:
 * { title: string } }) => ...` then fails against the erased `(props: {
 * value: unknown }) => ...` on the contravariant `value` parameter,
 * regardless of what `AnyFormApi` declares as its default. Verified directly
 * against the installed `@tanstack/react-form` version in an isolated
 * checkout: even a direct, non-`createElement` assignment of a form carrying
 * an actual validator (`const wide: AnyFormApi = formWithOnSubmitValidator`)
 * still fails separately, because TanStack's own `UnwrapFormValidateOrFnForInner`
 * collapses any abstract, non-literal validator-generic bound to `undefined`
 * when computing `FormState.errorMap` — so a real validator's return type
 * (e.g. `"required" | undefined`) is never assignable back to it, no matter
 * how `AnyFormApi`'s type parameters default. JSX (`<AppForm form={form}>`)
 * never hits either problem — it infers `AppForm`'s generics straight from
 * the concrete `form` argument — but this harness is a `.ts` file building a
 * dynamic component tree and cannot use JSX syntax. Retyping `AppForm`/
 * `AnyFormApi` to route around TanStack's internal error-extraction is
 * production work and stays out of this spec's scope.
 */
const AppFormBoundary = AppForm as unknown as ComponentType<{
  form: unknown;
  children: ReactNode;
}>;

/**
 * Minimal `VexEditorAdapter` mounted for every field under this shared
 * contract suite via `stubClientConfig.editor`. Renders a single `<textarea>`
 * holding the first text leaf's content — enough for `richtext`'s generic
 * label/required/readOnly assertions (resolved through the field's own
 * `role="group"` wrapper, like `array`/`blocks`/`upload`, never through this
 * textarea's own identity) to exercise a real control instead of hitting the
 * "missing `editor`" configuration-error branch every OTHER fixture here
 * never triggers. `richtext/Input.test.tsx`'s own `extra` block drives the
 * full node-array round trip through this same textarea directly, and
 * separately asserts the configuration-error branch using its own
 * editor-less config (not this one).
 *
 * @param props - The editor-component props the host field input supplies.
 * @returns The stub textarea element.
 */
function StubRichTextEditor(props: VexEditorComponentProps) {
  const firstChild = props.value[0]?.children[0];
  const text = firstChild && "text" in firstChild ? firstChild.text : "";
  return createElement("textarea", {
    "aria-label": props.label ?? props.name,
    disabled: props.readOnly,
    placeholder: props.placeholder,
    value: text,
    onChange: (event: ChangeEvent<HTMLTextAreaElement>) => {
      const next: RichTextDocument = [
        { type: "p", children: [{ text: event.target.value }] },
      ];
      props.onChange(next);
    },
  });
}

/** Test-only `VexEditorAdapter` — {@link StubRichTextEditor} plus a plain-text `renderComponent`. Exported so `richtext/Input.test.tsx` can compose its own configs for the editor-present and editor-absent cases. */
export const stubEditorAdapter: VexEditorAdapter<ReactHKT> = {
  type: "stub",
  editorComponent: StubRichTextEditor,
  renderComponent: (props: VexRenderComponentProps) =>
    createElement("span", null, JSON.stringify(props.content)),
};

/**
 * Stub client config every mounted field renders against.
 *
 * Load-bearing, not defensive: `UploadFieldInput` resolves its target media
 * collection from `useVexConfig()` and THROWS `Media collection "images" not
 * found in config.` without one, and `RelationshipFieldInput` resolves its
 * target collection the same way (rendering an "Unknown collection" guard
 * instead of the real control). Providing it here — rather than only in
 * `nestedFieldContainer.ts` — is what lets those two field types exercise their
 * actual controls under the shared contract instead of reporting ~96 failures
 * that describe the harness rather than the component.
 *
 * `collections` carries the relationship fixture's target slug; `mediaCollections`
 * carries the upload fixture's `to` slug.
 */
const stubClientConfig: VexClientConfig = defineConfig({
  editor: stubEditorAdapter,
  collections: [
    defineCollection({
      slug: "documents",
      fields: { title: text({ required: false }) },
      admin: { useAsTitle: "title" },
    }),
  ],
  mediaCollections: [defineMediaCollection({ slug: "images" })],
});

/** The `form.defaultValues` key every mounted field is registered under. */
const FIELD_NAME = "testField";

/**
 * Clones a field definition with shallow overrides, deep-merging `admin` — the
 * one nested object generic assertions need to vary in isolation (`readOnly`,
 * `placeholder`) independent of top-level properties (`label`, `description`,
 * `required`), which live directly on the field, not under `admin`.
 *
 * @param fieldDef - The base field definition to clone.
 * @param overrides - Shallow overrides, deep-merged under `admin`.
 * @returns A new field definition with `overrides` applied.
 */
function withFieldDef<TField extends AdminDataField>(
  fieldDef: TField,
  // Loose override keys on purpose: `Partial<TField>` cannot be satisfied by a
  // literal like `{ label: "" }` when `TField` is still generic (TS cannot prove
  // the literal is assignable to every possible instantiation). This is a
  // test-only variant builder and already casts its result.
  overrides: Record<string, unknown> & { admin?: Record<string, unknown> },
): TField {
  const { admin, ...rest } = overrides;
  return {
    ...fieldDef,
    ...rest,
    admin: { ...fieldDef.admin, ...admin },
  } as TField;
}

/**
 * Whether `control` is a resolved-by-fallback element with no single DOM
 * value to drive generically: a popover-opening trigger (`role="combobox"`,
 * e.g. `date`'s `DateTimePicker`), or a multi-state field's `role="group"`
 * wrapper (e.g. `upload`, whose empty/filled/read-only states don't all
 * have one focusable control for `getControl` to resolve to `id`-first).
 * Neither has a text-entry mode or a meaningful `.value`; their real
 * interaction model is exercised by the field type's own `extra` block, the
 * same reason `setControlValue`/`expectControlValue` already skip `BUTTON`/
 * file inputs rather than guessing an interaction model that would just be
 * wrong.
 *
 * @param control - The rendered control element to inspect.
 * @returns Whether `control` is a combobox trigger or a group wrapper.
 */
function isPopoverTriggerControl(control: Element): boolean {
  const role = control.getAttribute("role");
  return role === "combobox" || role === "group";
}

/**
 * Whether `control` is a contenteditable control (CodeMirror's `json`
 * editor) — jsdom does not implement the `HTMLElement.isContentEditable`
 * getter (it is always `undefined`), so this reads the `contenteditable`
 * attribute directly instead of relying on the DOM property. Checks for the
 * attribute's PRESENCE, not specifically `"true"`: CodeMirror always sets it
 * (via `EditorView.editable`), toggling it to `"false"` — never removing it
 * — when the editor is read-only, so a readOnly json field's control still
 * needs this generic-DOM-value path skipped in favor of `expectControlValue`'s
 * `textContent` branch.
 *
 * @param control - The rendered control element to inspect.
 * @returns Whether `control` is a CodeMirror editable surface, editable or not.
 */
function isContentEditableControl(control: Element): boolean {
  return control.hasAttribute("contenteditable");
}

/**
 * Best-effort generic interaction used by every value-mutating assertion below.
 * Handles the two control shapes a fixture is guaranteed to be able to drive
 * generically — a plain text-like control, and a checkbox/radio — and is a
 * deliberate no-op for anything else (file inputs, `BUTTON`s, popover
 * triggers like `date`'s combobox): those get their real interaction model
 * exercised by the field type's own `extra`, not a generic guess that would
 * just be wrong.
 *
 * @param user - The `userEvent` instance driving the interaction.
 * @param control - The rendered control element to interact with.
 * @param value - The value to set on `control`.
 */

async function setControlValue(
  user: UserEvent,
  control: HTMLElement,
  value: unknown,
): Promise<void> {
  const input = control as HTMLInputElement;
  if (input.type === "checkbox" || input.type === "radio") {
    const shouldBeChecked = Boolean(value);
    if (input.checked !== shouldBeChecked) {
      await user.click(input);
    }
    return;
  }
  if (input.type === "file" || control.tagName === "BUTTON" || isPopoverTriggerControl(control)) {
    return;
  }
  if (control.tagName === "INPUT" || control.tagName === "TEXTAREA") {
    await user.clear(input);
    const text = value === undefined || value === null ? "" : String(value);
    if (text) {
      await user.type(input, text);
    }
    return;
  }
  // A contenteditable control (CodeMirror's `json` editor): no `.value`/`<input>`
  // identity, but `@testing-library/user-event` v14 supports `clear()`/`type()`
  // on contenteditable elements directly.
  if (isContentEditableControl(control)) {
    await user.clear(control);
    const text = value === undefined || value === null ? "" : String(value);
    if (text) {
      await user.type(control, text);
    }
  }
}

/**
 * Like `setControlValue`, but swallows the exception `@testing-library/user-event`
 * v14's `clear()` throws on a genuinely non-editable (disabled/readOnly) control —
 * that throw itself is evidence editing is blocked, not a test bug. Used only by
 * the readOnly-source assertions, which want to prove a value attempt has no
 * effect regardless of whether the underlying library no-ops or throws.
 *
 * @param user - The `userEvent` instance driving the interaction.
 * @param control - The rendered control element to interact with.
 * @param value - The value to attempt setting on `control`.
 */
async function attemptEdit(user: UserEvent, control: HTMLElement, value: unknown): Promise<void> {
  try {
    await setControlValue(user, control, value);
  } catch {
    // Non-editable control — the attempt correctly could not proceed.
  }
}

/**
 * Asserts the control's own DOM value/checked state — not the form's — matches `expected`.
 * No-ops for a popover-trigger control (see {@link isPopoverTriggerControl}): it has
 * no DOM "value" to assert against.
 *
 * @param control - The rendered control element to inspect.
 * @param expected - The value the control's DOM state should reflect.
 */
function expectControlValue(control: HTMLElement, expected: unknown): void {
  if (isPopoverTriggerControl(control)) return;
  if (isContentEditableControl(control)) {
    expect(control.textContent).toBe(expected === undefined || expected === null ? "" : String(expected));
    return;
  }
  const input = control as HTMLInputElement;
  if (input.type === "checkbox" || input.type === "radio") {
    expect(input.checked).toBe(Boolean(expected));
    return;
  }
  if (input.type === "file") return;
  // jest-dom's `toHaveValue` coerces its own expected argument against the
  // control's type — a `type="number"` input demands a `number` (or
  // `undefined`/`null` for "empty"), not a stringified one, or the matcher
  // itself throws a type-mismatch failure that has nothing to do with the
  // component under test.
  if (input.type === "number") {
    expect(control).toHaveValue(expected === undefined || expected === null ? undefined : Number(expected));
    return;
  }
  expect(control).toHaveValue(expected === undefined || expected === null ? "" : String(expected));
}

/**
 * Whether a control exposes ANY standard non-editable signal. The two readOnly
 * sources (design-change item 4) are documented to produce genuinely different
 * DOM attributes per field type (`text/Input.tsx` maps the `readOnly` prop to
 * `disabled` and `fieldDef.admin.readOnly` to the native `readonly` attribute)
 * — checking for any of the four standard signals lets one assertion generalize
 * across that documented inconsistency instead of hardcoding one field type's
 * choice as the only acceptable one.
 *
 * @param control - The rendered control element to inspect.
 * @returns Whether `control` carries any inert/read-only signal.
 */
function hasInertSignal(control: Element): boolean {
  return (
    control.hasAttribute("disabled") ||
    control.hasAttribute("readonly") ||
    control.getAttribute("aria-disabled") === "true" ||
    control.getAttribute("aria-readonly") === "true"
  );
}

/**
 * Resolves the field's control deterministically by the `id` this factory itself
 * assigns (`FormLabel` wires `htmlFor={name}` and every field input sets
 * `id={name}`), falling back to an accessible-label lookup only when a field
 * type doesn't set the id.
 *
 * NOT `getByLabelText(label, { exact: false })`: substring matching collides
 * whenever another element's accessible name embeds the field label — measured
 * on `color`, whose swatch button is named "Pick a colour for Brand Color",
 * making every such query ambiguous and failing 15 tests for a reason that had
 * nothing to do with the component. Container fields (array/group/blocks) hit
 * the SAME trap from a different angle: nested sub-fields' own labels routinely
 * share a singular/plural substring with the container's own label (fixture
 * measured: array's "Tags" vs its item type's "Tag") — resolved by matching
 * `[role="group"][aria-labelledby="${FIELD_NAME}-label"]` directly instead of
 * falling through to the ambiguous substring lookup.
 *
 * `checkbox` is a deliberate special case: Base UI's `Checkbox.Root` puts the
 * `id` prop on its visually-hidden, `aria-hidden="true"` native `<input>`
 * (so `<label for>` native click-delegation still works and this suite's
 * `.type`/`.checked`-based generic assertions have a real form element to
 * inspect), not on the visible `role="checkbox"` element — the two-element
 * split is intentional, not a defect (`checkbox/Input.tsx` also forwards
 * Base UI's own `required` prop, which it mirrors onto both elements as the
 * native `required` attribute and the visible element's `aria-required`).
 *
 * @param container - The rendered form's root element to search within.
 * @param labelText - The field's accessible label text, used as a fallback lookup.
 * @returns The resolved control element.
 */
export function getControl(container: HTMLElement, labelText: string): HTMLElement {
  const byId = container.querySelector<HTMLElement>(`#${FIELD_NAME}`);
  if (byId) return byId;
  const group = container.querySelector<HTMLElement>(
    `[role="group"][aria-labelledby="${FIELD_NAME}-label"]`,
  );
  if (group) return group;
  return screen.getByLabelText(labelText, { exact: false });
}

/**
 * Resolves the accessible label node for either labelling pattern this suite
 * supports: a single-control field's `<label for={FIELD_NAME}>` (`FormLabel`),
 * or a container field's `role="group"` wrapper whose `aria-labelledby`
 * resolves to a plain labelled node (array/group/blocks — no single control
 * for `htmlFor` to point at).
 *
 * @param container - The rendered form's root element to search within.
 * @returns The resolved label node, or `null` if neither pattern is present.
 */
function getLabelNode(container: HTMLElement): HTMLElement | null {
  const labelEl = container.querySelector<HTMLElement>(`label[for="${FIELD_NAME}"]`);
  if (labelEl) return labelEl;

  const group = container.querySelector<HTMLElement>('[role="group"]');
  const labelledBy = group?.getAttribute("aria-labelledby");
  if (!labelledBy) return null;
  return container.querySelector<HTMLElement>(`#${labelledBy}`);
}

/**
 * Polls `container.innerHTML` until two consecutive checks (10ms apart,
 * under `act()`) match, or 20 attempts (200ms) elapse.
 *
 * A field's control behind a `React.lazy`/`Suspense` boundary (`json`'s
 * `JsonEditor`) still shows its Suspense `fallback` synchronously right
 * after `render()` — the real dynamic `import("./JsonEditorView")` resolves
 * only after genuine async module-transform work, not a single microtask, so
 * one `act(async () => {})` isn't enough to observe it settle. Comparing
 * successive snapshots needs no field-type-specific knowledge: a
 * non-lazy field's markup is already identical on the very first two checks
 * (one extra 10ms wait, same for every one of the other 29 field types), a
 * lazy one keeps changing until the real control swaps in.
 *
 * @param container - The rendered field's container to poll.
 */
async function waitForStableRender(container: HTMLElement): Promise<void> {
  let previous = container.innerHTML;
  for (let attempt = 0; attempt < 20; attempt++) {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });
    const current = container.innerHTML;
    if (current === previous) return;
    previous = current;
  }
}

/**
 * Mounts `Component` inside a real `useForm`/`<AppForm>` pair — the exact wiring
 * `createFieldInput`-built components expect in production. The mounted form's
 * only validator is a form-level `onSubmit` that delegates to the real
 * `adminFieldToInputSchema` dispatcher, so submitting the form exercises the
 * field's actual production validation, not a test-only stand-in.
 *
 * `async`, polling via {@link waitForStableRender} after mount so every
 * caller's `getControl` resolves the field's REAL control, never a stale
 * Suspense fallback node React is about to replace.
 *
 * @returns Utilities for interacting with and asserting on the mounted field.
 */
async function renderField<TField extends AdminDataField, TValue>(props: {
  Component: FieldInputContractOptions<TField, TValue>["Component"];
  fieldDef: TField;
  collection: CollectionConfig;
  readOnly: boolean;
  initialValue: TValue | undefined;
  index?: number;
}) {
  // Captured on first render so assertions can read live form state. `AnyFormApi`
  // is the package's own generics-erased form type — the same one `AppForm` and
  // `AppFormContext` publish for exactly this purpose.
  let form: ContractFormProbe | undefined;

  function Harness() {
    // Every provider a field input may read outside `<AppForm>`. `upload` and
    // `relationship` both fetch through TanStack Query + Convex ("No QueryClient
    // set" / transport errors without these), and `blocks` reads nuqs. Inert for
    // the field types that read none of them. Held in state so each mounted
    // harness gets exactly one client instance across re-renders.
    //
    // No shared-contract assertion here ever reads resolved query content —
    // upload's own dedicated Cell/preview-content tests and relationship's own
    // picker-search tests both mount through a real convex-test bridge instead
    // (their own `extra` blocks), not this generic harness. A `queryFn` that
    // never resolves keeps the pending/Skeleton state deterministic: without
    // one, React Query logs "No queryFn was passed" on every render. Executor
    // form, not `Promise.withResolvers()`: this package's `lib` target is
    // ES2022, which predates it.
    const [queryClient] = useState(() => new QueryClient({
      defaultOptions: { queries: { retry: false, queryFn: () => new Promise<never>(() => {}) } },
    }));
    const [convexClient] = useState(() => new ConvexReactClient("https://example.convex.cloud"));
    const f = useForm({
      defaultValues: { [FIELD_NAME]: props.initialValue },
      validators: {
        onSubmit: ({ value }) => {
          const schema = adminFieldToInputSchema({ field: props.fieldDef });
          const result = schema.safeParse((value as Record<string, unknown>)[FIELD_NAME]);
          if (result.success) return undefined;
          return {
            fields: { [FIELD_NAME]: result.error.issues[0]?.message ?? "Invalid value" },
          };
        },
      },
    });
    // Narrow to the read-only probe surface above; the full form API carries 12
    // generic parameters this suite never touches.
    form = f as unknown as ContractFormProbe;

    // `NuqsTestingAdapter` wraps every field, not just `blocks`: `BlocksFieldInput`
    // reads `useQueryState` for its editor modal and throws "nuqs requires an
    // adapter" without one, and any container can nest a blocks child. Inert for
    // every field type that reads no URL state.
    return createElement(
      ConvexProvider,
      { client: convexClient },
      createElement(
      QueryClientProvider,
      { client: queryClient },
      createElement(
      NuqsTestingAdapter,
      null,
      createElement(
        VexConfigContext.Provider,
        { value: stubClientConfig },
        createElement(
      AppFormBoundary,
      { form: f } as { form: unknown; children: ReactNode },
      createElement(props.Component, {
        name: FIELD_NAME,
        fieldDef: props.fieldDef,
        collection: props.collection,
        readOnly: props.readOnly,
        index: props.index,
      }),
          createElement("button", { type: "submit" }, "Submit"),
        ),
      ),
      ),
      ),
    );
  }

  const result = render(createElement(Harness));
  await waitForStableRender(result.container);
  return {
    ...result,
    // `render` above mounts `Harness` synchronously, so `form` is always assigned
    // by the time any caller can reach this.
    getForm: (): ContractFormProbe => form as ContractFormProbe,
  };
}

/**
 * Call at module top level inside a *.test.tsx file — it calls describe/it itself.
 *
 * @param options - The field's fixture, component, and contract options.
 */
export function runFieldInputContractSuite<TField extends AdminDataField, TValue>(
  options: FieldInputContractOptions<TField, TValue>,
): void {
  const { fixture, Component, extra } = options;
  const collection = options.collection ?? testCollection;
  const label = fixture.fieldDef.label || FIELD_NAME;

  /**
   * Derives the fixture's real validation-failure message by actually running
   * its schema against `fixture.invalid` — never a hardcoded, field-type-specific
   * string. Runs inside each `it()` that needs it (never at `describe()`-collection
   * time): a fixture whose `invalid` value doesn't fail its own schema is a
   * fixture-authoring bug and must fail that one test, not abort the whole file.
   *
   * @returns The real validation-failure message `fixture.invalid` produces.
   */
  function deriveInvalidErrorMessage(): string {
    const schema = adminFieldToInputSchema({ field: fixture.fieldDef });
    const validation = schema.safeParse(fixture.invalid);
    if (validation.success) {
      // Not a fixture-authoring bug in every case: several field types'
      // inputSchema ends in an UNCONDITIONAL `.default(field.defaultValue)`
      // (verified in number's and checkbox's) which is never gated behind
      // `!field.required` the way `applyBaseInputSchemaMeta`'s `.optional()`
      // is — so a missing value is silently replaced by the default and
      // validated as that, and required-ness is unenforceable at the schema
      // level. Failing this one test names that defect and records it; it
      // never aborts collection, so the rest of the file still runs.
      expect.fail(
        `${fixture.fieldType}: schema ACCEPTS its own \`invalid\` fixture value ` +
          `(${JSON.stringify(fixture.invalid)}), so no validation error can ever render. ` +
          `Either the fixture's \`invalid\` value is wrong, or this field type's ` +
          `required-ness is unenforceable — check its inputSchema for an ` +
          `unconditional .default().`,
      );
    }
    return validation.error.issues[0]?.message ?? "Invalid value";
  }

  /**
   * Narrows `value` to a resolved `admin.components.Input` chain entry —
   * `id`/`component` are the only two fields every `ComponentOverrideInput`
   * carries, so checking for both is sufficient to discriminate it from any
   * other shape `value` might be.
   *
   * @param value - The value to narrow.
   * @returns `true` if `value` has both an `id` and `component` field.
   */
  function isComponentOverride(
    value: unknown,
  ): value is ComponentOverrideInput<ReactHKT, FieldComponentProps> {
    return (
      typeof value === "object" &&
      value !== null &&
      "id" in value &&
      "component" in value
    );
  }

  /**
   * Reads `fieldDef.admin.components.Input` and normalizes it to a chain
   * array. Normally already a resolved array (`resolveFieldComponents`), but
   * this suite's own override-chain test assigns a single raw override
   * object directly, bypassing field-factory resolution — accept either
   * shape.
   *
   * @param fieldDef - The field definition to read `admin.components.Input` from.
   * @returns The normalized override chain array.
   */
  function extractInputOverrides(
    fieldDef: TField,
  ): ComponentOverrideInput<ReactHKT, FieldComponentProps>[] {
    const input: unknown = fieldDef.admin?.components?.Input;
    if (Array.isArray(input)) {
      return input.filter(isComponentOverride);
    }
    return isComponentOverride(input) ? [input] : [];
  }

  /** The exact props shape every registered field type's built-in `Component` accepts — see {@link FieldInputContractOptions.Component}'s doc comment for why this is not `FieldComponentProps`. */
  type ContractComponentProps = {
    name: string;
    fieldDef: TField;
    readOnly: boolean;
    collection: CollectionConfig;
    index?: number;
  };

  /**
   * Mounts `fieldDef`'s resolved input directly — the built-in (`Component`)
   * wrapped by its own `admin.components.Input` override chain, composed the
   * same way `resolveFieldInputComponent` composes it in production — with no
   * `useForm`/`renderField` wiring beyond what rendering requires. Proves the
   * override chain (S3/S8) composes for every registered field type:
   * `onProbe` fires only when the chain's innermost built-in actually
   * renders, so an override whose `renderDefault` never calls through is
   * caught.
   *
   * @returns The mounted test harness element.
   */
  function ContractHarness(props: {
    fieldDef: TField;
    value: TValue;
    onProbe: () => void;
  }) {
    const [queryClient] = useState(
      () =>
        new QueryClient({
          defaultOptions: {
            queries: { retry: false, queryFn: () => new Promise<never>(() => {}) },
          },
        }),
    );
    const [convexClient] = useState(
      () => new ConvexReactClient("https://example.convex.cloud"),
    );
    const f = useForm({ defaultValues: { [FIELD_NAME]: props.value } });

    function ProbedBuiltin(p: ContractComponentProps) {
      props.onProbe();
      return createElement(Component, p);
    }

    const Resolved = extractInputOverrides(props.fieldDef).reduce<
      ComponentType<ContractComponentProps>
    >((renderDefault, override) => {
      // `override.component` is typed against the production `FieldComponentProps`
      // shape (S3), which this suite's own narrower `ContractComponentProps`
      // (see its doc comment) is not structurally assignable to — both describe
      // the same runtime props, just via two different declared types across
      // package boundaries, so the chain composes correctly at runtime.
      const Override = override.component as unknown as ComponentType<
        ContractComponentProps & { renderDefault: ComponentType<ContractComponentProps> }
      >;
      return (p: ContractComponentProps) =>
        createElement(Override, { ...p, renderDefault });
    }, ProbedBuiltin);

    return createElement(
      ConvexProvider,
      { client: convexClient },
      createElement(
        QueryClientProvider,
        { client: queryClient },
        createElement(
          NuqsTestingAdapter,
          null,
          createElement(
            VexConfigContext.Provider,
            { value: stubClientConfig },
            createElement(
              AppFormBoundary,
              { form: f } as { form: unknown; children: ReactNode },
              createElement(Resolved, {
                name: FIELD_NAME,
                fieldDef: props.fieldDef,
                collection,
                readOnly: false,
              }),
            ),
          ),
        ),
      ),
    );
  }

  describe(`${fixture.fieldType} field input contract`, () => {
    // ── 1. Label ────────────────────────────────────────────────────────────
    it('renders a label associated with the input via htmlFor/id, or (for container fields with no single control) a labelled role="group"', async () => {
      const { container } = await renderField({
        Component,
        fieldDef: fixture.fieldDef,
        collection,
        readOnly: false,
        initialValue: fixture.valid,
      });

      // Scoped to THIS field's own `for`, not the first `<label>` anywhere in
      // the container — a container field (array/group/blocks) renders each
      // nested sub-field's own real `<label for="testField[0]">` inside it,
      // which a bare `querySelector("label")` would find first and
      // misidentify as this field's own labelling pattern.
      const labelEl = container.querySelector(`label[for="${FIELD_NAME}"]`);
      if (labelEl) {
        expect(getControl(container, label)).toHaveAttribute("id", FIELD_NAME);
        return;
      }

      const group = container.querySelector('[role="group"]');
      expect(group).not.toBeNull();
      const labelledBy = group?.getAttribute("aria-labelledby");
      expect(labelledBy).toBeTruthy();
      const labelNode = labelledBy ? container.querySelector(`#${labelledBy}`) : null;
      expect(labelNode).not.toBeNull();
      expect(labelNode?.textContent).toContain(label);
    });

    it("falls back to the field name when fieldDef.label is empty", async () => {
      const fieldDef = withFieldDef(fixture.fieldDef, { label: "" });
      await renderField({ Component, fieldDef, collection, readOnly: false, initialValue: fixture.valid });

      // `checkbox`-shaped controls associate the SAME label text with two
      // elements (the visible `role="checkbox"` via `aria-labelledby`, and
      // its `aria-hidden` native input via `<label for>`) — both real,
      // neither wrong, so pick whichever isn't hidden from assistive tech.
      const matches = screen.getAllByLabelText(FIELD_NAME, { exact: false });
      const visible = matches.find((el) => el.getAttribute("aria-hidden") !== "true") ?? matches[0];
      expect(visible).toBeInTheDocument();
    });

    it("prefixes the label with a 1-based index when `index` is supplied (nested rendering)", async () => {
      const { container } = await renderField({
        Component,
        fieldDef: fixture.fieldDef,
        collection,
        readOnly: false,
        initialValue: fixture.valid,
        index: 2,
      });

      const expected = `[3] - ${label}${fixture.fieldDef.required ? "*" : ""}`;
      expect(getLabelNode(container)?.textContent).toBe(expected);
    });

    it("shows a required-asterisk in the label when the field is required", async () => {
      const fieldDef = withFieldDef(fixture.fieldDef, { required: true });
      const { container } = await renderField({
        Component,
        fieldDef,
        collection,
        readOnly: false,
        initialValue: fixture.valid,
      });

      expect(getLabelNode(container)?.textContent).toBe(
        `${fieldDef.label || FIELD_NAME}*`,
      );
    });

    it("hides the required-asterisk in the label when the field is not required", async () => {
      const fieldDef = withFieldDef(fixture.fieldDef, { required: false });
      const { container } = await renderField({
        Component,
        fieldDef,
        collection,
        readOnly: false,
        initialValue: fixture.valid,
      });

      expect(getLabelNode(container)?.textContent).toBe(fieldDef.label || FIELD_NAME);
    });

    it("marks the control as required for assistive tech when the field is required", async () => {
      // Ambiguous whether "reflected in the control" (design-change item 5) means a
      // native `required` attribute or `aria-required` — either is accepted.
      // `text/Input.tsx` forwards neither to its `<Input>` (only `disabled`,
      // `readOnly`, `value`, `onChange`, `onBlur`, `placeholder` are forwarded —
      // see Input.tsx), so this is expected to fail for text: a genuine a11y gap
      // surfaced here, not a test bug.
      const fieldDef = withFieldDef(fixture.fieldDef, { required: true });
      const { container } = await renderField({ Component, fieldDef, collection, readOnly: false, initialValue: fixture.valid });

      const control = getControl(container, fieldDef.label || FIELD_NAME);
      // `aria-required` is not an ARIA-allowed attribute on `role="group"`
      // (multi-state fields like `upload`, and the `array`/`group`/`blocks`
      // containers) — required-ness is communicated there through the
      // required asterisk in the group's own accessible name instead,
      // already covered by the "shows/hides a required-asterisk" tests.
      if (control.getAttribute("role") === "group") return;
      const marked =
        control.hasAttribute("required") || control.getAttribute("aria-required") === "true";
      expect(marked).toBe(true);
    });

    // ── 2. Description ─────────────────────────────────────────────────────
    // `FormDescription` reads `field.description` (a top-level `BaseField`
    // property), not `field.admin.description` — implemented against the real
    // component, not the design change's checklist shorthand.
    it("renders the field's description when fieldDef.description is set", async () => {
      const fieldDef = withFieldDef(fixture.fieldDef, {
        description: "Contract-probe description.",
      });
      await renderField({ Component, fieldDef, collection, readOnly: false, initialValue: fixture.valid });

      expect(screen.getByText("Contract-probe description.")).toBeVisible();
    });

    it("hides the description paragraph when fieldDef.description is not set", async () => {
      const fieldDef = withFieldDef(fixture.fieldDef, { description: undefined });
      const { container } = await renderField({
        Component,
        fieldDef,
        collection,
        readOnly: false,
        initialValue: fixture.valid,
      });

      // `Activity` (React 19.2) renders `display: none` on the existing node when
      // hidden rather than unmounting it, so `.not.toBeVisible()` is the correct
      // matcher — `.not.toBeInTheDocument()` would pass even if the hidden logic
      // were broken and always rendered the paragraph visible with empty text.
      expect(container.querySelector('[data-slot="form-description"]')).not.toBeVisible();
    });

    // ── 3. Placeholder ──────────────────────────────────────────────────────
    it("forwards fieldDef.admin.placeholder to the control", async () => {
      const fieldDef = withFieldDef(fixture.fieldDef, {
        admin: { placeholder: "Contract placeholder probe" },
      });
      const { container } = await renderField({ Component, fieldDef, collection, readOnly: false, initialValue: fixture.empty });

      const control = getControl(container, fieldDef.label || FIELD_NAME);
      if (isPopoverTriggerControl(control)) return;
      const controlInput = control as HTMLInputElement;
      if (["checkbox", "radio", "file"].includes(controlInput.type)) return;
      // A contenteditable control (CodeMirror's `json` editor) has no native
      // `placeholder` HTML attribute to forward to — it renders its own
      // `.cm-placeholder` widget instead, a different rendering model this
      // generic DOM-attribute assertion can't generalize to.
      if (isContentEditableControl(control)) return;
      expect(control).toHaveAttribute("placeholder", "Contract placeholder probe");
    });

    // ── 4. Two independent readOnly sources ─────────────────────────────────
    it("the `readOnly` prop disables editing independent of fieldDef.admin.readOnly", async () => {
      const user = userEvent.setup();
      const fieldDef = withFieldDef(fixture.fieldDef, { admin: { readOnly: false } });
      const { container } = await renderField({ Component, fieldDef, collection, readOnly: true, initialValue: fixture.empty });

      const control = getControl(container, fieldDef.label || FIELD_NAME);
      await attemptEdit(user, control, fixture.valid);
      expectControlValue(control, fixture.empty);
      expect(hasInertSignal(control)).toBe(true);
    });

    it("fieldDef.admin.readOnly disables editing independent of the `readOnly` prop", async () => {
      const user = userEvent.setup();
      const fieldDef = withFieldDef(fixture.fieldDef, { admin: { readOnly: true } });
      const { container } = await renderField({ Component, fieldDef, collection, readOnly: false, initialValue: fixture.empty });

      const control = getControl(container, fieldDef.label || FIELD_NAME);
      await attemptEdit(user, control, fixture.valid);
      expectControlValue(control, fixture.empty);
      expect(hasInertSignal(control)).toBe(true);
    });

    it("disables editing when both readOnly sources are set together", async () => {
      const user = userEvent.setup();
      const fieldDef = withFieldDef(fixture.fieldDef, { admin: { readOnly: true } });
      const { container } = await renderField({ Component, fieldDef, collection, readOnly: true, initialValue: fixture.empty });

      const control = getControl(container, fieldDef.label || FIELD_NAME);
      await attemptEdit(user, control, fixture.valid);
      expectControlValue(control, fixture.empty);
      expect(hasInertSignal(control)).toBe(true);
    });

    // ── 5 & 7. Required + error timing ──────────────────────────────────────
    it("shows no validation error before any interaction or submission", async () => {
      const errorMessage = deriveInvalidErrorMessage();
      await renderField({
        Component,
        fieldDef: fixture.fieldDef,
        collection,
        readOnly: false,
        initialValue: fixture.invalid,
      });

      expect(screen.queryByText(errorMessage)).not.toBeInTheDocument();
    });

    it("blurring an untouched field alone shows no error — this harness's only validator is form-level onSubmit, so isTouched has no error to reveal without a prior submit", async () => {
      const errorMessage = deriveInvalidErrorMessage();
      const { container } = await renderField({
        Component,
        fieldDef: fixture.fieldDef,
        collection,
        readOnly: false,
        initialValue: fixture.invalid,
      });

      const control = getControl(container, label);
      fireEvent.blur(control);
      expect(screen.queryByText(errorMessage)).not.toBeInTheDocument();
    });

    it("shows the field's validation error only after a submission attempt", async () => {
      const errorMessage = deriveInvalidErrorMessage();
      const user = userEvent.setup();
      await renderField({
        Component,
        fieldDef: fixture.fieldDef,
        collection,
        readOnly: false,
        initialValue: fixture.invalid,
      });

      // Not touched, not yet submitted — FormError has no error to render at all.
      expect(screen.queryByText(errorMessage)).not.toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: /submit/i }));

      expect(await screen.findByText(errorMessage)).toBeVisible();
    });

    it("clears the error once the value becomes valid and the form is resubmitted", async () => {
      const errorMessage = deriveInvalidErrorMessage();
      const user = userEvent.setup();
      const { container } = await renderField({
        Component,
        fieldDef: fixture.fieldDef,
        collection,
        readOnly: false,
        initialValue: fixture.invalid,
      });

      const control = getControl(container, label);
      if (isPopoverTriggerControl(control) || (control as HTMLInputElement).type === "file") return;
      await user.click(screen.getByRole("button", { name: /submit/i }));
      expect(await screen.findByText(errorMessage)).toBeVisible();

      // No onChange/onBlur validator is wired (only onSubmit, kept as-is per the
      // design change) — the stale error only clears on a fresh submit that
      // re-runs the schema and gets back a clean result for this field.
      await setControlValue(user, control, fixture.valid);
      await user.click(screen.getByRole("button", { name: /submit/i }));

      expect(screen.queryByText(errorMessage)).not.toBeInTheDocument();
    });

    // ── 6. Value states ─────────────────────────────────────────────────────
    (
      [
        ["empty", fixture.empty],
        ["valid", fixture.valid],
        ["invalid", fixture.invalid],
      ] as const
    ).forEach(([name, value]) => {
      it(`renders the ${name} fixture value without crashing or a React input warning`, async () => {
        const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
        await renderField({
          Component,
          fieldDef: fixture.fieldDef,
          collection,
          readOnly: false,
          initialValue: value,
        });

        const inputWarning = consoleError.mock.calls.some((args) =>
          /uncontrolled|controlled|defaultValue|onChange handler/i.test(String(args[0])),
        );
        expect(inputWarning).toBe(false);
        consoleError.mockRestore();
      });
    });

    // ── 8. Change/blur wiring ───────────────────────────────────────────────
    it("round-trips a typed value through the controlled input", async () => {
      const user = userEvent.setup();
      const { container } = await renderField({
        Component,
        fieldDef: fixture.fieldDef,
        collection,
        readOnly: false,
        initialValue: fixture.empty,
      });

      const control = getControl(container, label);
      await setControlValue(user, control, fixture.valid);
      await waitFor(() => expectControlValue(control, fixture.valid));
    });

    it("passes the correctly-typed value (not stringified) to field.handleChange", async () => {
      const user = userEvent.setup();
      const { container, getForm } = await renderField({
        Component,
        fieldDef: fixture.fieldDef,
        collection,
        readOnly: false,
        initialValue: fixture.empty,
      });

      const control = getControl(container, label);
      if (isPopoverTriggerControl(control) || (control as HTMLInputElement).type === "file") return;
      await setControlValue(user, control, fixture.valid);
      expect(getForm().getFieldValue(FIELD_NAME)).toStrictEqual(fixture.valid);
    });

    it("calls field.handleBlur on blur, marking the field touched", async () => {
      const { container, getForm } = await renderField({
        Component,
        fieldDef: fixture.fieldDef,
        collection,
        readOnly: false,
        initialValue: fixture.empty,
      });

      const control = getControl(container, label);
      // Container fields (array/group/blocks — no single control, per the
      // label test above) have no element whose blur meaningfully marks the
      // WHOLE container field touched; each nested sub-field already wires
      // its own `field.handleBlur` independently. Same skip precedent as
      // "marks the control as required for assistive tech" above.
      if (control.getAttribute("role") === "group") return;
      // `checkbox`-shaped controls resolve `control` to an `aria-hidden`
      // native input (see `getControl`'s doc) — real focus/blur lands on the
      // sibling `role="checkbox"` element instead, which is what carries the
      // `onBlur` handler these field types actually wire.
      const blurTarget =
        control.getAttribute("aria-hidden") === "true"
          ? (container.querySelector<HTMLElement>('[role="checkbox"], [role="radio"]') ?? control)
          : control;
      expect(getForm().getFieldMeta(FIELD_NAME)?.isTouched).toBe(false);
      fireEvent.blur(blurTarget);
      expect(getForm().getFieldMeta(FIELD_NAME)?.isTouched).toBe(true);
    });

    // ── 9. defaultValue ─────────────────────────────────────────────────────
    it("starts at ADMIN_FIELDS[type].defaultValue when the form is seeded with it", async () => {
      const defaultValue = ADMIN_FIELDS[fixture.fieldType].defaultValue as TValue;
      const { container } = await renderField({
        Component,
        fieldDef: fixture.fieldDef,
        collection,
        readOnly: false,
        initialValue: defaultValue,
      });

      expectControlValue(getControl(container, label), defaultValue);
    });

    // ── 10. Accessibility ───────────────────────────────────────────────────
    it("has no detectable accessibility violations in its default render", async () => {
      const { container } = await renderField({
        Component,
        fieldDef: fixture.fieldDef,
        collection,
        readOnly: false,
        initialValue: fixture.empty,
      });

      await expectNoA11yViolations(container);
    });

    it("has no detectable accessibility violations when read-only", async () => {
      const { container } = await renderField({
        Component,
        fieldDef: fixture.fieldDef,
        collection,
        readOnly: true,
        initialValue: fixture.valid,
      });

      await expectNoA11yViolations(container);
    });

    it("has no detectable accessibility violations while showing a validation error", async () => {
      const user = userEvent.setup();
      const { container } = await renderField({
        Component,
        fieldDef: fixture.fieldDef,
        collection,
        readOnly: false,
        initialValue: fixture.invalid,
      });

      await user.click(screen.getByRole("button", { name: /submit/i }));
      await screen.findByText(deriveInvalidErrorMessage());
      await expectNoA11yViolations(container);
    });

    // ── 11. Read-only + error rendered together ─────────────────────────────
    it("still shows the validation error after submission when the field is read-only via the `readOnly` prop", async () => {
      const errorMessage = deriveInvalidErrorMessage();
      const user = userEvent.setup();
      const { container } = await renderField({
        Component,
        fieldDef: fixture.fieldDef,
        collection,
        readOnly: true,
        initialValue: fixture.invalid,
      });

      await user.click(screen.getByRole("button", { name: /submit/i }));

      expect(await screen.findByText(errorMessage)).toBeVisible();
      expect(hasInertSignal(getControl(container, label))).toBe(true);
    });

    it("still shows the validation error after submission when the field is read-only via fieldDef.admin.readOnly", async () => {
      const errorMessage = deriveInvalidErrorMessage();
      const user = userEvent.setup();
      const fieldDef = withFieldDef(fixture.fieldDef, {
        admin: { readOnly: true },
      });
      const { container } = await renderField({
        Component,
        fieldDef,
        collection,
        readOnly: false,
        initialValue: fixture.invalid,
      });

      await user.click(screen.getByRole("button", { name: /submit/i }));

      expect(await screen.findByText(errorMessage)).toBeVisible();
      expect(hasInertSignal(getControl(container, label))).toBe(true);
    });

    describe(`${fixture.fieldType}: admin.components.Input override`, () => {
      it("renders the override in place of the built-in, and its renderDefault re-renders the built-in unchanged", () => {
        const rendered = { default: false, override: false };
        const OverrideProbe = (
          props: SlotOverrideProps<ReactHKT, FieldComponentProps>,
        ) => {
          rendered.override = true;
          const RenderDefault = props.renderDefault;
          return createElement(RenderDefault, props);
        };
        const fieldDefWithOverride = {
          ...fixture.fieldDef,
          admin: {
            ...fixture.fieldDef.admin,
            components: {
              Input: { id: "test.override", component: OverrideProbe },
            },
          },
        };
        render(
          createElement(ContractHarness, {
            fieldDef: fieldDefWithOverride,
            value: fixture.valid,
            onProbe: () => (rendered.default = true),
          }),
        );
        expect(rendered.override).toBe(true);
        expect(rendered.default).toBe(true);
      });
    });

    extra?.(options);
  });
}
