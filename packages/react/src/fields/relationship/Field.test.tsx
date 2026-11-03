import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "@tanstack/react-form";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConvexQueryClient } from "@convex-dev/react-query";
import { ConvexProvider, type ConvexReactClient } from "convex/react";
import { convexTest } from "convex-test";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { describe, expect, test, vi } from "vitest";
import {
  defineConfig,
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
} from "./testFixture";
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
    initialValue?: string[] | ((seededIds: string[]) => string[]);
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
  const initialValue =
    typeof overrides.initialValue === "function"
      ? overrides.initialValue(seededIds)
      : (overrides.initialValue ?? []);

  function Harness() {
    const form = useForm({ defaultValues: { testField: initialValue } });
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
