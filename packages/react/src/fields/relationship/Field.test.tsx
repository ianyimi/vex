import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm, useStore } from "@tanstack/react-form";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConvexQueryClient } from "@convex-dev/react-query";
import { ConvexProvider, type ConvexReactClient } from "convex/react";
import { convexTest } from "convex-test";
import { parseAsString, useQueryState } from "nuqs";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { describe, expect, test, vi } from "vitest";
import {
  defineConfig,
  resolveNullableSaveValue,
  type CollectionFieldMeta,
  type RelationshipField,
  type VexClientConfig,
  type VexResourceSlug,
} from "@vexcms/core";

import { AppForm } from "../../forms";
import { VexConfigContext } from "../../config/VexConfigContext";
import { runFieldInputContractSuite } from "../../testing/fieldInputContract";
import { testCollection } from "../../testing/harness/accessFixtures";
import { createFakeConvexClient } from "../../testing/convex/bridge";
import schema, { testModules } from "../../testing/convex/schema";
import {
  relationshipFieldFixture,
  relationshipTargetCollection,
  scalarRelationshipFieldFixture,
} from "./testFixture";
import { MODALS } from "../../modals/constants";
import { RelationshipFieldAdmin } from "./Field";

vi.mock("./RelationshipPicker", () => ({
  RelationshipPicker: ({
    fieldDef,
    defaultTab,
    onSelect,
    onCancel,
  }: {
    fieldDef: RelationshipField;
    defaultTab?: "select" | "create";
    onSelect: (ids: string[]) => void;
    onCancel: () => void;
  }) => (
    <div role="dialog" aria-label="relationship picker stub">
      <p>tab: {defaultTab ?? "select"}</p>
      <button type="button" onClick={() => onSelect(["picked-id"])}>
        confirm pick
      </button>
      <button type="button" onClick={onCancel}>
        dismiss picker
      </button>
      <p>hasMany: {String(fieldDef.hasMany)}</p>
    </div>
  ),
}));

/**
 * Seeds `seedTitles` into a fresh convex-test instance, wires the fake convex
 * client through a real `ConvexQueryClient` + `QueryClient`, and renders
 * `RelationshipFieldAdmin` behind `AppForm` + `VexConfigContext` +
 * `NuqsTestingAdapter` (the picker's open state is URL-driven, `RelationshipPicker`
 * itself is mocked above so this file only exercises `Input.tsx`'s own
 * empty/filled/read-only/draft-gate logic).
 */
async function renderRelationship(
  overrides: {
    fieldDef?: RelationshipField<VexResourceSlug, CollectionFieldMeta>;
    config?: VexClientConfig;
    initialValue?:
      | string[]
      | string
      | undefined
      | ((seededIds: string[]) => string[] | string | undefined);
    readOnly?: boolean;
    documentStatus?: "draft" | "published";
    seedTitles?: string[];
  } = {},
) {
  const t = convexTest(schema, testModules);
  const seededIds: string[] = [];
  await t.run(async (ctx) => {
    for (const title of overrides.seedTitles ?? ["Alpha", "Bravo"]) {
      seededIds.push(await ctx.db.insert("documents", { title }));
    }
  });

  const convexClient = createFakeConvexClient(t) as ConvexReactClient;
  const convexQueryClient = new ConvexQueryClient(convexClient);
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { queryFn: convexQueryClient.queryFn(), retry: false },
    },
  });
  convexQueryClient.connect(queryClient);

  const config =
    overrides.config ??
    defineConfig({ collections: [relationshipTargetCollection] });
  const fieldDef = overrides.fieldDef ?? relationshipFieldFixture.fieldDef;
  const resolvedInitialValue =
    typeof overrides.initialValue === "function"
      ? overrides.initialValue(seededIds)
      : overrides.initialValue;
  const isScalarFixture = fieldDef.schema !== undefined;
  const initialValue = isScalarFixture ? resolvedInitialValue : (resolvedInitialValue ?? []);

  function Harness() {
    const form = useForm({ defaultValues: { testField: initialValue } });
    const rawValue = useStore(form.store, (state) => state.values.testField);
    return (
      <ConvexProvider client={convexClient}>
        <QueryClientProvider client={queryClient}>
          <NuqsTestingAdapter>
            <VexConfigContext.Provider value={config}>
              <AppForm form={form}>
                <RelationshipFieldAdmin
                  name="testField"
                  fieldDef={fieldDef}
                  collection={testCollection}
                  readOnly={overrides.readOnly ?? false}
                  documentStatus={overrides.documentStatus}
                />
              </AppForm>
              <span data-testid="raw-value">{JSON.stringify(rawValue)}</span>
              <span data-testid="save-payload-probe">
                {JSON.stringify(resolveNullableSaveValue({ field: fieldDef, value: rawValue }))}
              </span>
            </VexConfigContext.Provider>
          </NuqsTestingAdapter>
        </QueryClientProvider>
      </ConvexProvider>
    );
  }

  return { ...render(<Harness />), queryClient, seededIds };
}

function FieldLevelPreview({ doc }: { doc: unknown }) {
  return (
    <span>Field preview: {String((doc as Record<string, unknown>).title)}</span>
  );
}

runFieldInputContractSuite({
  fixture: relationshipFieldFixture,
  Component: RelationshipFieldAdmin,
  extra: () => {
    describe("relationship state switch", () => {
      test("renders the missing-target-collection error instead of crashing when the field's target slug isn't registered", async () => {
        await renderRelationship({
          config: defineConfig({ collections: [testCollection] }),
        });

        expect(
          await screen.findByText(/unknown collection/i),
        ).toBeInTheDocument();
        expect(
          screen.getByText("documents", { selector: "code" }),
        ).toBeInTheDocument();
      });

      test("empty value renders RelationshipEmpty with Select/Create buttons", async () => {
        await renderRelationship({ initialValue: [] });

        expect(
          await screen.findByRole("button", { name: /select documents/i }),
        ).toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: /create document/i }),
        ).toBeInTheDocument();
      });

      test("clicking Select opens the picker on the select tab", async () => {
        const user = userEvent.setup();
        await renderRelationship({ initialValue: [] });

        await user.click(
          await screen.findByRole("button", { name: /select documents/i }),
        );

        expect(
          await screen.findByRole("dialog", {
            name: "relationship picker stub",
          }),
        ).toBeInTheDocument();
        expect(screen.getByText("tab: select")).toBeInTheDocument();
      });

      test("clicking Create opens the picker on the create tab", async () => {
        const user = userEvent.setup();
        await renderRelationship({ initialValue: [] });

        await user.click(
          await screen.findByRole("button", { name: /create document/i }),
        );

        expect(await screen.findByText("tab: create")).toBeInTheDocument();
      });

      test("picker confirm writes the selection and closes the dialog", async () => {
        const user = userEvent.setup();
        await renderRelationship({ initialValue: [] });

        await user.click(
          await screen.findByRole("button", { name: /select documents/i }),
        );
        await user.click(
          await screen.findByRole("button", { name: "confirm pick" }),
        );

        await waitFor(() =>
          expect(
            screen.queryByRole("dialog", { name: "relationship picker stub" }),
          ).not.toBeInTheDocument(),
        );
      });

      test("non-empty value renders RelationshipFilledState with the resolved preview and a Select button", async () => {
        await renderRelationship({
          seedTitles: ["Alpha"],
          initialValue: (seededIds) => [seededIds[0]!],
        });

        expect(await screen.findByText("Alpha")).toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: /select documents/i }),
        ).toBeInTheDocument();
      });

      test("read-only with an empty value renders an em dash and no Select/Create buttons", async () => {
        await renderRelationship({ readOnly: true, initialValue: [] });

        expect(await screen.findByText("—")).toBeInTheDocument();
        expect(
          screen.queryByRole("button", { name: /select documents/i }),
        ).not.toBeInTheDocument();
      });

      test("read-only with a value renders RelationshipFilledState in its disabled form", async () => {
        await renderRelationship({
          readOnly: true,
          seedTitles: ["Alpha"],
          initialValue: (seededIds) => [seededIds[0]!],
        });

        expect(await screen.findByText("Alpha")).toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: /select documents/i }),
        ).toBeDisabled();
      });

      test("field-level admin.components.preview overrides the default preview in RelationshipFilledState", async () => {
        const fieldDefWithPreview: RelationshipField<
          VexResourceSlug,
          CollectionFieldMeta
        > = {
          ...relationshipFieldFixture.fieldDef,
          admin: {
            ...relationshipFieldFixture.fieldDef.admin,
            components: {
              ...relationshipFieldFixture.fieldDef.admin.components,
              preview: FieldLevelPreview,
            },
          },
        };
        await renderRelationship({
          fieldDef: fieldDefWithPreview,
          seedTitles: ["Alpha"],
          initialValue: (seededIds) => [seededIds[0]!],
        });

        expect(
          await screen.findByText("Field preview: Alpha"),
        ).toBeInTheDocument();
      });
    });
  },
});

runFieldInputContractSuite({
  fixture: scalarRelationshipFieldFixture,
  Component: RelationshipFieldAdmin,
});

describe("relationship scalar storage (schema.validator set)", () => {
  const scalarFieldDef: RelationshipField<VexResourceSlug, CollectionFieldMeta> = {
    ...relationshipFieldFixture.fieldDef,
    hasMany: false,
    schema: { validator: "id" },
  };

  test("empty scalar value renders RelationshipEmpty, same as an empty array would", async () => {
    await renderRelationship({ fieldDef: scalarFieldDef, initialValue: undefined });
    expect(
      await screen.findByRole("button", { name: /select document/i }),
    ).toBeInTheDocument();
  });

  test("picker confirm writes a bare string, never an array, to the form field", async () => {
    const user = userEvent.setup();
    await renderRelationship({ fieldDef: scalarFieldDef, initialValue: undefined });

    await user.click(await screen.findByRole("button", { name: /select document/i }));
    await user.click(await screen.findByRole("button", { name: "confirm pick" }));

    await waitFor(() =>
      expect(screen.getByTestId("raw-value")).toHaveTextContent('"picked-id"'),
    );
  });

  test("Clear writes undefined, not [], for scalar storage", async () => {
    const user = userEvent.setup();
    await renderRelationship({
      fieldDef: scalarFieldDef,
      seedTitles: ["Alpha"],
      initialValue: (seededIds) => seededIds[0]!,
    });

    await user.click(await screen.findByRole("button", { name: "Clear" }));

    await waitFor(() => expect(screen.getByTestId("raw-value")).toBeEmptyDOMElement());
  });

  test("clearing a scalar relationship resolves to null for the save payload, surviving Convex's wire serializer", async () => {
    const user = userEvent.setup();
    await renderRelationship({
      fieldDef: scalarFieldDef,
      seedTitles: ["Alpha"],
      initialValue: (seededIds) => seededIds[0]!,
    });

    await user.click(await screen.findByRole("button", { name: "Clear" }));

    await waitFor(() =>
      expect(screen.getByTestId("save-payload-probe")).toHaveTextContent("null"),
    );
  });
});

/**
 * Regression coverage for the picker-reopen race: on a real `siteSettings`
 * global, `activeTheme` and `adminTheme` are two SEPARATE `relationship()`
 * fields both pointed at `themes` — and every relationship field's picker
 * shares the exact same `MODALS.relationshipPicker.urlParam` nuqs key
 * (only the VALUE, the open field's own name, distinguishes which one is
 * open). Live-reproduced on a freshly loaded `siteSettings` global in both
 * the conference example (:3220) and `apps/test` (:3020): confirming a
 * pick in one field's picker committed the value, closed the dialog, then
 * IMMEDIATELY reopened it — only on a fresh page load, never again
 * afterward. Root cause: `handleSelect` (`Field.tsx`) called
 * `field.handleChange(ids)` (which flips the form pristine → dirty and
 * re-renders every sibling field sharing the picker's url key) BEFORE
 * `closePicker()`'s url-clearing write had settled — a sibling's own
 * `useQueryState` subscription could resync from the still-stale "open"
 * url during that window. `handleSelect` now `await`s `closePicker()`
 * fully before calling `field.handleChange`, closing that window.
 */
describe("RelationshipFieldAdmin — sibling picker close race", () => {
  /**
   * Renders TWO relationship fields under the SAME `<AppForm>`, both
   * targeting {@link relationshipTargetCollection} but with distinct
   * `name`/`label`s — the real-world precondition for the race (two
   * `relationship()` fields on one document, sharing the picker's url key).
   */
  function renderSiblingRelationshipFields() {
    const t = convexTest(schema, testModules);
    const convexClient = createFakeConvexClient(t) as ConvexReactClient;
    const convexQueryClient = new ConvexQueryClient(convexClient);
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { queryFn: convexQueryClient.queryFn(), retry: false },
      },
    });
    convexQueryClient.connect(queryClient);

    const config = defineConfig({ collections: [relationshipTargetCollection] });
    const fieldDefA: RelationshipField<VexResourceSlug, CollectionFieldMeta> = {
      ...relationshipFieldFixture.fieldDef,
      hasMany: false,
      required: false,
      label: "Field A",
    };
    const fieldDefB: RelationshipField<VexResourceSlug, CollectionFieldMeta> = {
      ...relationshipFieldFixture.fieldDef,
      hasMany: false,
      required: false,
      label: "Field B",
    };

    function Harness() {
      const form = useForm({
        defaultValues: { fieldA: [] as string[], fieldB: [] as string[] },
      });
      return (
        <ConvexProvider client={convexClient}>
          <QueryClientProvider client={queryClient}>
            <NuqsTestingAdapter>
              <VexConfigContext.Provider value={config}>
                <AppForm form={form}>
                  <RelationshipFieldAdmin
                    name="fieldA"
                    fieldDef={fieldDefA}
                    collection={testCollection}
                    readOnly={false}
                  />
                  <RelationshipFieldAdmin
                    name="fieldB"
                    fieldDef={fieldDefB}
                    collection={testCollection}
                    readOnly={false}
                  />
                </AppForm>
              </VexConfigContext.Provider>
            </NuqsTestingAdapter>
          </QueryClientProvider>
        </ConvexProvider>
      );
    }

    return render(<Harness />);
  }

  test("confirming a pick in one field, with a sibling relationship field sharing the picker's url key, closes the dialog without it reopening", async () => {
    const user = userEvent.setup();
    renderSiblingRelationshipFields();

    const fieldAGroup = await screen.findByRole("group", { name: "Field A" });
    await user.click(
      within(fieldAGroup).getByRole("button", { name: /select document/i }),
    );

    const dialog = await screen.findByRole("dialog", {
      name: "relationship picker stub",
    });
    await user.click(within(dialog).getByRole("button", { name: "confirm pick" }));

    // The dialog must close…
    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", { name: "relationship picker stub" }),
      ).not.toBeInTheDocument(),
    );
    // …and STAY closed across a window spanning the real nuqs throttle
    // delay the live race depended on. ES2022 lib target (no
    // `Promise.withResolvers`) — executor form, matching
    // `useSavedListViewPrefetch.test.ts`'s own precedent.
    await new Promise<void>((resolve) => setTimeout(resolve, 100));
    expect(
      screen.queryByRole("dialog", { name: "relationship picker stub" }),
    ).not.toBeInTheDocument();

    // The selection was actually committed, not dropped by the fix.
    expect(
      within(fieldAGroup).getByRole("button", { name: /select document/i }),
    ).toBeInTheDocument();
  });
});

/**
 * Regression coverage for a scalar-storage variant of the sibling picker
 * race above: two `schema: { validator: "id" }` relationship fields (bare
 * `string | undefined` storage, not `string[]`) sharing the picker's url
 * key. Live-reproduced on `storage_shapes` in `apps/test` (:3020):
 * selecting a value for `ownerId`, then selecting a value for `ownerRef`,
 * reset `ownerId` back to "No user selected" — the array-storage sibling
 * race test above does NOT cover this (its fields are `hasMany: false`
 * array storage, not `schema`-scalar storage).
 */
describe("RelationshipFieldAdmin — sibling scalar fields retain independent values", () => {
  function renderSiblingScalarRelationshipFields() {
    const t = convexTest(schema, testModules);
    const convexClient = createFakeConvexClient(t) as ConvexReactClient;
    const convexQueryClient = new ConvexQueryClient(convexClient);
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { queryFn: convexQueryClient.queryFn(), retry: false },
      },
    });
    convexQueryClient.connect(queryClient);

    const config = defineConfig({ collections: [relationshipTargetCollection] });
    const fieldDefA: RelationshipField<VexResourceSlug, CollectionFieldMeta> = {
      ...relationshipFieldFixture.fieldDef,
      hasMany: false,
      required: false,
      label: "Field A",
      schema: { validator: "id" },
    };
    const fieldDefB: RelationshipField<VexResourceSlug, CollectionFieldMeta> = {
      ...relationshipFieldFixture.fieldDef,
      hasMany: false,
      required: false,
      label: "Field B",
      schema: { validator: "id" },
    };

    function Harness() {
      const form = useForm({
        defaultValues: {
          fieldA: undefined as string | undefined,
          fieldB: undefined as string | undefined,
        },
      });
      const rawA = useStore(form.store, (state) => state.values.fieldA);
      const rawB = useStore(form.store, (state) => state.values.fieldB);
      return (
        <ConvexProvider client={convexClient}>
          <QueryClientProvider client={queryClient}>
            <NuqsTestingAdapter>
              <VexConfigContext.Provider value={config}>
                <AppForm form={form}>
                  <RelationshipFieldAdmin
                    name="fieldA"
                    fieldDef={fieldDefA}
                    collection={testCollection}
                    readOnly={false}
                  />
                  <RelationshipFieldAdmin
                    name="fieldB"
                    fieldDef={fieldDefB}
                    collection={testCollection}
                    readOnly={false}
                  />
                </AppForm>
                <span data-testid="raw-a">{JSON.stringify(rawA)}</span>
                <span data-testid="raw-b">{JSON.stringify(rawB)}</span>
              </VexConfigContext.Provider>
            </NuqsTestingAdapter>
          </QueryClientProvider>
        </ConvexProvider>
      );
    }

    return render(<Harness />);
  }

  test("selecting a value for the second scalar field leaves the first scalar field's value untouched", async () => {
    const user = userEvent.setup();
    renderSiblingScalarRelationshipFields();

    const fieldAGroup = await screen.findByRole("group", { name: "Field A" });
    await user.click(
      within(fieldAGroup).getByRole("button", { name: /select document/i }),
    );
    await user.click(
      within(await screen.findByRole("dialog", { name: "relationship picker stub" })).getByRole(
        "button",
        { name: "confirm pick" },
      ),
    );

    await waitFor(() =>
      expect(screen.getByTestId("raw-a")).toHaveTextContent('"picked-id"'),
    );

    const fieldBGroup = await screen.findByRole("group", { name: "Field B" });
    await user.click(
      within(fieldBGroup).getByRole("button", { name: /select document/i }),
    );
    await user.click(
      within(await screen.findByRole("dialog", { name: "relationship picker stub" })).getByRole(
        "button",
        { name: "confirm pick" },
      ),
    );

    await waitFor(() =>
      expect(screen.getByTestId("raw-b")).toHaveTextContent('"picked-id"'),
    );
    // The regression: field A's value must survive field B's selection.
    expect(screen.getByTestId("raw-a")).toHaveTextContent('"picked-id"');
  });
});

/**
 * Array-storage control for the scalar sibling test above (`hasMany:
 * false`, NO `schema` override — the pre-existing storage shape): confirms
 * the sibling-value-independence invariant isn't scalar-specific.
 */
describe("RelationshipFieldAdmin — sibling array-storage fields retain independent values", () => {
  function renderSiblingArrayRelationshipFields() {
    const t = convexTest(schema, testModules);
    const convexClient = createFakeConvexClient(t) as ConvexReactClient;
    const convexQueryClient = new ConvexQueryClient(convexClient);
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { queryFn: convexQueryClient.queryFn(), retry: false },
      },
    });
    convexQueryClient.connect(queryClient);

    const config = defineConfig({ collections: [relationshipTargetCollection] });
    const fieldDefA: RelationshipField<VexResourceSlug, CollectionFieldMeta> = {
      ...relationshipFieldFixture.fieldDef,
      hasMany: false,
      required: false,
      label: "Field A",
    };
    const fieldDefB: RelationshipField<VexResourceSlug, CollectionFieldMeta> = {
      ...relationshipFieldFixture.fieldDef,
      hasMany: false,
      required: false,
      label: "Field B",
    };

    function Harness() {
      const form = useForm({
        defaultValues: { fieldA: [] as string[], fieldB: [] as string[] },
      });
      const rawA = useStore(form.store, (state) => state.values.fieldA);
      const rawB = useStore(form.store, (state) => state.values.fieldB);
      return (
        <ConvexProvider client={convexClient}>
          <QueryClientProvider client={queryClient}>
            <NuqsTestingAdapter>
              <VexConfigContext.Provider value={config}>
                <AppForm form={form}>
                  <RelationshipFieldAdmin
                    name="fieldA"
                    fieldDef={fieldDefA}
                    collection={testCollection}
                    readOnly={false}
                  />
                  <RelationshipFieldAdmin
                    name="fieldB"
                    fieldDef={fieldDefB}
                    collection={testCollection}
                    readOnly={false}
                  />
                </AppForm>
                <span data-testid="raw-a">{JSON.stringify(rawA)}</span>
                <span data-testid="raw-b">{JSON.stringify(rawB)}</span>
              </VexConfigContext.Provider>
            </NuqsTestingAdapter>
          </QueryClientProvider>
        </ConvexProvider>
      );
    }

    return render(<Harness />);
  }

  test("selecting a value for the second array-storage field leaves the first field's value untouched", async () => {
    const user = userEvent.setup();
    renderSiblingArrayRelationshipFields();

    const fieldAGroup = await screen.findByRole("group", { name: "Field A" });
    await user.click(
      within(fieldAGroup).getByRole("button", { name: /select document/i }),
    );
    await user.click(
      within(await screen.findByRole("dialog", { name: "relationship picker stub" })).getByRole(
        "button",
        { name: "confirm pick" },
      ),
    );

    await waitFor(() =>
      expect(screen.getByTestId("raw-a")).toHaveTextContent('["picked-id"]'),
    );

    const fieldBGroup = await screen.findByRole("group", { name: "Field B" });
    await user.click(
      within(fieldBGroup).getByRole("button", { name: /select document/i }),
    );
    await user.click(
      within(await screen.findByRole("dialog", { name: "relationship picker stub" })).getByRole(
        "button",
        { name: "confirm pick" },
      ),
    );

    await waitFor(() =>
      expect(screen.getByTestId("raw-b")).toHaveTextContent('["picked-id"]'),
    );
    // The regression: field A's value must survive field B's selection.
    expect(screen.getByTestId("raw-a")).toHaveTextContent('["picked-id"]');
  });
});

/**
 * Deterministic reproduction of the live `storage_shapes` sibling-reset bug
 * (:3020, `ownerId` then `ownerRef`) with the EXACT failure mechanism
 * confirmed via live instrumentation (React DevTools + a `MutationObserver`
 * + `history.pushState`/`replaceState` probe through `tab.run`, browser
 * eval): closing field A's picker and, right after, opening field B's can
 * be followed by a STALE write landing late on the shared
 * `MODALS.relationshipPicker.urlParam` nuqs key — the Next.js app-router
 * adapter's `useOptimistic`/`startTransition`-based URL commit — which
 * transiently REASSERTS field A's own name as `activeField` while field
 * B's dialog is open. `NuqsTestingAdapter` doesn't replicate that adapter's
 * `useOptimistic` timing (confirmed: a prior version of this test using
 * `userEvent` click timing alone never failed in jsdom), so this test
 * injects the exact observed symptom directly — an independent
 * `useQueryState` consumer on the SAME key writing field A's name back
 * onto the url WHILE field B's picker is legitimately open — and asserts
 * each field's open/closed state is immune to it. Before the fix (`isOpen`
 * derived from `activeField === props.name` every render), this stale
 * write flipped field A's `isOpen` back to `true` (spurious reopen) and
 * field B's back to `false` (its in-progress picker silently closed). The
 * fix drives `isOpen` from local state instead, touched only by this
 * field's own `openPicker`/`closePicker` calls — `setActiveField` is still
 * called (fire-and-forget) so the url stays shareable, but nothing reads
 * it back to decide what to render.
 */
describe("RelationshipFieldAdmin — sibling field isOpen is immune to a stale shared-key write", () => {
  /** Imitates a late-landing write from field A's own (already-resolved) close — the live-observed symptom — without depending on nuqs's real throttle timing. */
  function ChaosReassert({ to }: { to: string }) {
    const [, setActiveField] = useQueryState(MODALS.relationshipPicker.urlParam, parseAsString);
    return (
      <button type="button" onClick={() => void setActiveField(to)}>
        chaos: reassert {to}
      </button>
    );
  }

  function renderWithChaos() {
    const t = convexTest(schema, testModules);
    const convexClient = createFakeConvexClient(t) as ConvexReactClient;
    const convexQueryClient = new ConvexQueryClient(convexClient);
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { queryFn: convexQueryClient.queryFn(), retry: false },
      },
    });
    convexQueryClient.connect(queryClient);

    const config = defineConfig({ collections: [relationshipTargetCollection] });
    const fieldDefA: RelationshipField<VexResourceSlug, CollectionFieldMeta> = {
      ...relationshipFieldFixture.fieldDef,
      hasMany: false,
      required: false,
      label: "Field A",
    };
    const fieldDefB: RelationshipField<VexResourceSlug, CollectionFieldMeta> = {
      ...relationshipFieldFixture.fieldDef,
      hasMany: false,
      required: false,
      label: "Field B",
    };

    function Harness() {
      const form = useForm({
        defaultValues: { fieldA: [] as string[], fieldB: [] as string[] },
      });
      return (
        <ConvexProvider client={convexClient}>
          <QueryClientProvider client={queryClient}>
            <NuqsTestingAdapter>
              <VexConfigContext.Provider value={config}>
                <AppForm form={form}>
                  <RelationshipFieldAdmin
                    name="fieldA"
                    fieldDef={fieldDefA}
                    collection={testCollection}
                    readOnly={false}
                  />
                  <RelationshipFieldAdmin
                    name="fieldB"
                    fieldDef={fieldDefB}
                    collection={testCollection}
                    readOnly={false}
                  />
                </AppForm>
                <ChaosReassert to="fieldA" />
              </VexConfigContext.Provider>
            </NuqsTestingAdapter>
          </QueryClientProvider>
        </ConvexProvider>
      );
    }

    return render(<Harness />);
  }

  test("a stale write reasserting field A's name while field B's picker is open does not reopen A or close B", async () => {
    const user = userEvent.setup();
    renderWithChaos();

    const fieldAGroup = await screen.findByRole("group", { name: "Field A" });
    const fieldBGroup = await screen.findByRole("group", { name: "Field B" });

    // Open and confirm A first (closed, value committed — matches the live repro's first step).
    await user.click(
      within(fieldAGroup).getByRole("button", { name: /select document/i }),
    );
    await user.click(
      within(await screen.findByRole("dialog", { name: "relationship picker stub" })).getByRole(
        "button",
        { name: "confirm pick" },
      ),
    );
    await waitFor(() =>
      expect(within(fieldAGroup).queryByRole("dialog")).not.toBeInTheDocument(),
    );

    // Open B.
    await user.click(
      within(fieldBGroup).getByRole("button", { name: /select document/i }),
    );
    await waitFor(() =>
      expect(within(fieldBGroup).getByRole("dialog")).toBeInTheDocument(),
    );

    // Inject the live-observed stale write: something reasserts "fieldA"
    // on the shared url key while B's picker is legitimately open.
    await user.click(screen.getByRole("button", { name: "chaos: reassert fieldA" }));

    // B's dialog must still be open, and A's must not have spuriously reopened.
    await waitFor(() => {
      expect(within(fieldBGroup).queryByRole("dialog")).toBeInTheDocument();
      expect(within(fieldAGroup).queryByRole("dialog")).not.toBeInTheDocument();
    });

    // B's in-progress interaction still completes normally.
    await user.click(
      within(within(fieldBGroup).getByRole("dialog")).getByRole("button", { name: "confirm pick" }),
    );
    await waitFor(() =>
      expect(within(fieldBGroup).queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });
});
