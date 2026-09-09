import { type ComponentType, type ReactNode, createElement, useState } from "react";
import { useForm } from "@tanstack/react-form";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import {
  array,
  blocks,
  defineBlock,
  group,
  text,
  type AdminField,
  type AdminFieldType,
  type ClientVexConfig,
  type CollectionConfig,
  type MediaCollectionConfig,
} from "@vexcms/core";
import type { AnyFormApi } from "../components/form/AppFormContext";
import { AppForm } from "../components/form/AppForm";
import { fieldToInputComponent } from "../components/fields";
import { StorageAdapterContextProvider, VexConfigContext } from "../context";
import { runFieldInputContractSuite } from "./fieldInputContract";
import { testCollection } from "./harness/accessFixtures";
import { fieldFixtures } from "./fixtures";
import type { FieldFixture } from "./fixtures/types";

/** Options for {@link runNestedFieldContainerSuite}. */
export interface NestedFieldContainerOptions {
  container: "array" | "group" | "blocks";
  Component: ComponentType<any>;
  childFieldTypes: AdminFieldType[];
  fixtures?: Partial<Record<AdminFieldType, FieldFixture>>;
}

/** The `form.defaultValues` key every mounted container is registered under. */
const FIELD_NAME = "testField";
/** Sub-field key used inside every synthetic `group`/`blocks` wrapper built around a child fixture. */
const CHILD_KEY = "child";
/** The single block slug used by every synthetic `blocks` wrapper. */
const BLOCK_SLUG = "block";

/**
 * Minimal stub media collection so a nested "upload" child (which reads
 * `VexConfigContext` to resolve its target media collection) can mount
 * without a real backend — mirrors `components/fields/upload/Input.test.tsx`.
 *
 * @returns A stub media collection config.
 */
function makeStubMediaCollection(): MediaCollectionConfig {
  return {
    slug: "images",
    fields: { alt: text({ required: false }), filename: text({ required: false }) },
    labels: { singular: "Image", plural: "Images" },
    admin: { useAsTitle: "_id", components: {} },
    meta: { storageAdapter: "convex" },
  } as unknown as MediaCollectionConfig;
}

const stubClientConfig = {
  mediaCollections: [makeStubMediaCollection()],
} as unknown as ClientVexConfig;

/**
 * `AppForm` narrowed to the two props this harness passes — the same
 * documented AP-006 boundary cast as `fieldInputContract.ts`'s own
 * `AppFormBoundary`, including its Step 2 finding: widening `AnyFormApi`'s
 * validator-slot defaults does not unlock removing this cast, because
 * `createElement(AppForm, props)` erases ALL of `AppForm`'s generics —
 * `TFormData` included — to `unknown` before checking `props`, independent
 * of what `AnyFormApi` declares as a default. See `fieldInputContract.ts`
 * for the full write-up and the verified TanStack Form internals
 * (`UnwrapFormValidateOrFnForInner`) that independently block it.
 */
const AppFormBoundary = AppForm as unknown as ComponentType<{
  form: unknown;
  children: ReactNode;
}>;

/**
 * Builds the `array`/`blocks` field definition wrapping a single child
 * fixture, plus the resolved `labels` used to find its "Add"/empty-state
 * copy. `array`'s child becomes `items`; `blocks`'s child becomes the sole
 * field (keyed `"child"`) of one synthetic block type.
 *
 * @returns The wrapping field definition and its resolved labels.
 */
function buildItemContainerFieldDef(props: {
  container: "array" | "blocks";
  childFixture: FieldFixture;
}): { fieldDef: AdminField; labels: { singular: string; plural: string } } {
  if (props.container === "array") {
    const fieldDef = array({ label: "Items", items: props.childFixture.fieldDef });
    return { fieldDef, labels: fieldDef.labels };
  }
  const fieldDef = blocks({
    label: "Blocks",
    blocks: [
      defineBlock({
        slug: BLOCK_SLUG,
        label: "Block",
        fields: { [CHILD_KEY]: props.childFixture.fieldDef },
      }),
    ],
  });
  return { fieldDef, labels: fieldDef.labels };
}

/**
 * Builds the `group` field definition wrapping a single child fixture as its sole sub-field.
 *
 * @param childFixture - The fixture whose field definition becomes the group's sole sub-field.
 * @returns The wrapping group field definition.
 */
function buildGroupFieldDef(childFixture: FieldFixture): AdminField {
  return group({ label: "Group", fields: { [CHILD_KEY]: childFixture.fieldDef } });
}

/**
 * One item/sub-field carrying the child fixture's `valid` value.
 *
 * @returns The seeded value for the given container type.
 */
function buildSeededValue(props: {
  container: NestedFieldContainerOptions["container"];
  childFixture: FieldFixture;
}): unknown {
  switch (props.container) {
    case "array":
      return [props.childFixture.valid];
    case "group":
      return { [CHILD_KEY]: props.childFixture.valid };
    case "blocks":
      return [
        { id: "seed-block", blockType: BLOCK_SLUG, blockName: "Block", [CHILD_KEY]: props.childFixture.valid },
      ];
  }
}

/**
 * The item a fresh "Add" click produces, mirroring `FormArray`'s
 * `getNewItemDefault()` (the item's raw `defaultValue`, verbatim) and
 * `FormBlocks`'s `buildDefaultBlock()` (each sub-field's `defaultValue ?? null`,
 * plus the framework keys).
 *
 * @returns The matcher for the item a fresh "Add" click produces.
 */
function buildAddedItemMatcher(props: { container: "array" | "blocks"; childFixture: FieldFixture }): unknown {
  const childDefault = props.childFixture.fieldDef.defaultValue;
  if (props.container === "array") return childDefault;
  return expect.objectContaining({
    blockType: BLOCK_SLUG,
    blockName: "Block",
    [CHILD_KEY]: childDefault ?? null,
  });
}

/**
 * Mounts `Component` inside a real `useForm`/`<AppForm>` pair, wrapped in every
 * provider a nested child field might read outside `<AppForm>`. Returns a
 * `formRef` so assertions can read the live form state without depending on
 * any one child type's DOM shape.
 *
 * @returns The render result plus a `formRef` for reading live form state.
 */
function renderContainer(props: {
  Component: ComponentType<any>;
  fieldDef: AdminField;
  readOnly: boolean;
  initialValue: unknown;
}) {
  const formRef: { current: AnyFormApi | undefined } = { current: undefined };

  function Harness() {
    // The "network-via-react-query" child category (upload) never has its
    // resolved doc/search-result content asserted on here — only container-
    // level behavior (readOnly cascade, seed/remove, a11y). A `queryFn` that
    // never resolves keeps that pending/Skeleton state deterministic: without
    // one, React Query logs "No queryFn was passed" on every render, and
    // whatever eventually settles the query updates state outside `act(...)`,
    // after the test's synchronous assertions finish.
    // ES2022 lib target (packages/tsconfig/react-library.json) has no
    // Promise.withResolvers, so this stays executor-form.
    const [queryClient] = useState(
      () =>
        new QueryClient({
          defaultOptions: { queries: { queryFn: () => new Promise<never>(() => {}) } },
        }),
    );
    const [convexClient] = useState(() => new ConvexReactClient("https://example.convex.cloud"));
    const form = useForm({ defaultValues: { [FIELD_NAME]: props.initialValue } });
    formRef.current = form as AnyFormApi;

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
              StorageAdapterContextProvider,
              {
                adapterClients: { convex: async () => ({ storageId: "stub-id" }) },
                children: createElement(
                  AppFormBoundary,
                  { form } as { form: unknown; children: ReactNode },
                  createElement(props.Component, {
                    name: FIELD_NAME,
                    fieldDef: props.fieldDef,
                    collection: testCollection,
                    readOnly: props.readOnly,
                  }),
                ),
              },
            ),
          ),
        ),
      ),
    );
  }

  const utils = render(createElement(Harness));
  return { ...utils, formRef };
}

/**
 * Call at module top level inside a *.test.tsx file — it calls describe/it itself.
 *
 * @param options - The container type, mounted component, and child field types to nest.
 */
export function runNestedFieldContainerSuite(options: NestedFieldContainerOptions): void {
  const { container, Component, childFieldTypes, fixtures = fieldFixtures } = options;

  describe(`${container} container (nested fields)`, () => {
    for (const childType of childFieldTypes) {
      const childFixture = fixtures[childType];
      if (!childFixture) {
        throw new Error(
          `runNestedFieldContainerSuite: no fixture registered for child type "${childType}" — pass one via \`fixtures\`.`,
        );
      }

      describe(`nesting a "${childType}" field`, () => {
        const isOrdinaryChild = childType !== "array" && childType !== "group" && childType !== "blocks";
        if (isOrdinaryChild) {
          const ChildComponent = fieldToInputComponent(childType);
          if (!ChildComponent) {
            throw new Error(`runNestedFieldContainerSuite: no input component registered for "${childType}".`);
          }
          // Delegates the leaf field's own label/readOnly/error-timing/value-roundtrip/a11y
          // contract to the shared factory — this suite only adds container-specific behavior.
          // Boundary cast: `InputComponentProps.collection` is `CollectionConfig | GlobalConfig`,
          // but comparing `ComponentType`s checks `defaultProps` covariantly, which rejects the
          // wider union against the contract's narrower `CollectionConfig`-only prop.
          runFieldInputContractSuite({
            fixture: childFixture,
            Component: ChildComponent as unknown as ComponentType<{
              name: string;
              fieldDef: AdminField;
              readOnly: boolean;
              collection: CollectionConfig;
              index?: number;
            }>,
          });
        }

        if (container === "group") {
          const fieldDef = buildGroupFieldDef(childFixture);

          it("round-trips a seeded value through the group's sub-field", () => {
            const seeded = buildSeededValue({ container, childFixture });
            const { formRef } = renderContainer({ Component, fieldDef, readOnly: false, initialValue: seeded });
            expect(formRef.current?.state.values).toEqual({ [FIELD_NAME]: seeded });
          });

          it("cascades readOnly to the nested sub-field", () => {
            const seeded = buildSeededValue({ container, childFixture });
            const { container: dom } = renderContainer({
              Component,
              fieldDef,
              readOnly: true,
              initialValue: seeded,
            });
            const controls = dom.querySelectorAll("button, input, select, textarea");
            expect(controls.length).toBeGreaterThan(0);
            controls.forEach((el) => {
              // Base UI's `AccordionTrigger` implements a "focusable-when-
              // disabled" pattern: it signals inert state via
              // `aria-disabled="true"`, not the native `disabled` attribute
              // (`FormGroup.tsx`/`FormBlocks.tsx` wire `AccordionItem`'s own
              // `disabled` prop, which Base UI's `useButton` maps to
              // `aria-disabled` for exactly this reason) — every other
              // control still uses the real `disabled` attribute.
              const inert = el.hasAttribute("disabled") || el.getAttribute("aria-disabled") === "true";
              expect(inert).toBe(true);
            });
          });
        } else {
          const { fieldDef, labels } = buildItemContainerFieldDef({ container, childFixture });
          const emptyMessage = container === "array" ? "No items yet." : `No ${labels.plural} yet.`;
          const emptyValue: unknown[] = [];

          it("starts empty and shows the empty-state message", () => {
            const { formRef } = renderContainer({
              Component,
              fieldDef,
              readOnly: false,
              initialValue: emptyValue,
            });
            expect(screen.getByText(emptyMessage)).toBeInTheDocument();
            expect(formRef.current?.state.values).toEqual({ [FIELD_NAME]: emptyValue });
          });

          it("adds a new item with the child's default value via the Add button", async () => {
            const user = userEvent.setup();
            const { formRef } = renderContainer({
              Component,
              fieldDef,
              readOnly: false,
              initialValue: emptyValue,
            });

            await user.click(screen.getByRole("button", { name: new RegExp(`Add ${labels.singular}`, "i") }));

            const values = formRef.current?.state.values as Record<string, unknown[]>;
            expect(values[FIELD_NAME]).toHaveLength(1);
            expect(values[FIELD_NAME][0]).toEqual(buildAddedItemMatcher({ container, childFixture }));
          });

          it("removes a seeded item, returning to the empty state", async () => {
            const user = userEvent.setup();
            const seeded = buildSeededValue({ container, childFixture });
            const { formRef } = renderContainer({
              Component,
              fieldDef,
              readOnly: false,
              initialValue: seeded,
            });

            const removeButton =
              container === "array"
                ? screen.getByRole("button", { name: "Remove item 1 from Items" })
                : screen.getByRole("button", { name: "Remove Block block" });
            await user.click(removeButton);

            expect(await screen.findByText(emptyMessage)).toBeInTheDocument();
            expect(formRef.current?.state.values).toEqual({ [FIELD_NAME]: emptyValue });
          });

          it("round-trips a seeded value into the container's form state", () => {
            const seeded = buildSeededValue({ container, childFixture });
            const { formRef } = renderContainer({
              Component,
              fieldDef,
              readOnly: false,
              initialValue: seeded,
            });
            expect(screen.queryByText(emptyMessage)).not.toBeInTheDocument();
            expect(formRef.current?.state.values).toEqual({ [FIELD_NAME]: seeded });
          });

          it("cascades readOnly to every nested control", () => {
            const seeded = buildSeededValue({ container, childFixture });
            const { container: dom } = renderContainer({
              Component,
              fieldDef,
              readOnly: true,
              initialValue: seeded,
            });
            const controls = dom.querySelectorAll("button, input, select, textarea");
            expect(controls.length).toBeGreaterThan(0);
            controls.forEach((el) => {
              // Same Base UI "focusable-when-disabled" AccordionTrigger
              // pattern as the `group` branch above — `blocks`' own
              // `AccordionItem` (`FormBlocks.tsx`) signals inert state via
              // `aria-disabled`, not the native `disabled` attribute.
              const inert = el.hasAttribute("disabled") || el.getAttribute("aria-disabled") === "true";
              expect(inert).toBe(true);
            });
          });
        }
      });
    }
  });
}
