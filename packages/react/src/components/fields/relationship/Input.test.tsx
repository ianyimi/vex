import "@testing-library/jest-dom";

import { render, screen, waitFor, within, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "@tanstack/react-form";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConvexQueryClient } from "@convex-dev/react-query";
import type { ConvexReactClient } from "convex/react";
import type { DataModelFromSchemaDefinition, GenericMutationCtx } from "convex/server";
import type { GenericId } from "convex/values";
import { convexTest } from "convex-test";
import { describe, test, expect } from "vitest";
import {
  defineConfig,
  sanitizeConfigForClient,
  type ClientVexConfig,
  type CollectionFieldMeta,
  type RelationshipField,
  type RelationshipPreviewProps,
} from "@vexcms/core";

import { AppForm } from "../../form/AppForm";
import { VexConfigContext } from "../../../context/VexConfigContext";
import { runFieldInputContractSuite } from "../../../testing/fieldInputContract";
import { testCollection } from "../../../testing/harness/accessFixtures";
import {
  relationshipFieldFixture,
  relationshipTargetCollection,
  relationshipTargetCollectionByCreationTime,
} from "./testFixture";
import { createFakeConvexClient } from "../../../testing/convex/bridge";
import schema, { testModules } from "../../../testing/convex/schema";
import { RelationshipFieldInput } from "./Input";

type SchemaCtx = GenericMutationCtx<DataModelFromSchemaDefinition<typeof schema>>;

/**
 * Seeds `seedTitles` into a fresh convex-test instance (capturing their
 * real generated ids in insertion order — never hand-typed), optionally
 * mutates further via `afterSeed` (e.g. deleting a doc to produce a stale
 * reference), wires the fake convex client through a real
 * `ConvexQueryClient` + `QueryClient` (byte-for-byte the same wiring
 * `testing/convex/bridge.test.ts` proved in Step 10), and renders
 * `RelationshipFieldInput` inside the real `useForm`/`AppForm` harness plus
 * a `VexConfigContext` that registers `relationshipTargetCollection` by
 * default. Returns the `render()` result plus `queryClient` (to inspect
 * query-cache state directly — e.g. proving `enabled: open` gating) and
 * `seededIds`.
 */
async function renderRelationship(
  overrides: {
    fieldDef?: RelationshipField<CollectionFieldMeta>;
    config?: ClientVexConfig;
    initialValue?: string[] | ((seededIds: string[]) => string[]);
    seedTitles?: string[];
    afterSeed?: (ctx: SchemaCtx, seededIds: string[]) => Promise<void>;
  } = {},
) {
  const t = convexTest(schema, testModules);
  const seededIds: string[] = [];
  await t.run(async (ctx) => {
    for (const title of overrides.seedTitles ?? ["Alpha", "Bravo", "Charlie"]) {
      seededIds.push(await ctx.db.insert("documents", { title }));
    }
    await overrides.afterSeed?.(ctx, seededIds);
  });

  const fakeClient = createFakeConvexClient(t) as ConvexReactClient;
  const convexQueryClient = new ConvexQueryClient(fakeClient);
  const queryClient = new QueryClient({
    defaultOptions: { queries: { queryFn: convexQueryClient.queryFn(), retry: false } },
  });
  convexQueryClient.connect(queryClient);

  const config =
    overrides.config ??
    sanitizeConfigForClient(defineConfig({ collections: [relationshipTargetCollection] }));
  const fieldDef = overrides.fieldDef ?? relationshipFieldFixture.fieldDef;
  const initialValue =
    typeof overrides.initialValue === "function"
      ? overrides.initialValue(seededIds)
      : (overrides.initialValue ?? []);

  function Harness() {
    const form = useForm({ defaultValues: { testField: initialValue } });
    return (
      <QueryClientProvider client={queryClient}>
        <VexConfigContext.Provider value={config}>
          <AppForm form={form}>
            <RelationshipFieldInput
              name="testField"
              fieldDef={fieldDef}
              collection={testCollection}
              readOnly={false}
            />
          </AppForm>
        </VexConfigContext.Provider>
      </QueryClientProvider>
    );
  }

  return { ...render(<Harness />), queryClient, seededIds };
}

/** Scopes queries to the popover's list of candidate rows, disambiguating
 * them from the trigger button — which, in single-select mode, gets
 * re-labeled with the selected doc's own preview text once something is
 * chosen (`data-slot="popover-content"`, `ui/popover.tsx`). */
const popoverContent = () =>
  document.querySelector('[data-slot="popover-content"]') as HTMLElement;

function FieldLevelPreview({ doc }: RelationshipPreviewProps) {
  return <span>Field preview: {String((doc as Record<string, unknown>).title)}</span>;
}

runFieldInputContractSuite({
  fixture: relationshipFieldFixture,
  Component: RelationshipFieldInput,
  extra: () => {
    describe("relationship picker (Step 10 bridge)", () => {
      describe("target collection resolution", () => {
        test("renders the missing-target-collection error instead of crashing when the field's target slug isn't registered", async () => {
          await renderRelationship({
            config: sanitizeConfigForClient(defineConfig({ collections: [testCollection] })),
          });

          expect(await screen.findByText(/unknown collection/i)).toBeInTheDocument();
          expect(screen.getByText("documents", { selector: "code" })).toBeInTheDocument();
          expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
        });
      });

      describe("picker query (Decision 12)", () => {
        test("the picker query is gated by `enabled: open` — it does not fetch until the popover opens", async () => {
          const user = userEvent.setup();
          const { queryClient } = await renderRelationship();
          const searchQueries = () =>
            queryClient.getQueryCache().findAll({ queryKey: ["convexQuery", "vex:search"] });

          expect(searchQueries()).toHaveLength(1);
          expect(searchQueries()[0]?.state.fetchStatus).toBe("idle");
          expect(searchQueries()[0]?.state.dataUpdatedAt).toBe(0);

          await user.click(screen.getByRole("combobox"));

          await waitFor(() => expect(searchQueries()[0]?.state.status).toBe("success"));
          expect(searchQueries()[0]?.state.dataUpdatedAt).toBeGreaterThan(0);
        });

        test("debounced search (200ms): narrowing to the typed query is deferred, not immediate, then settles on the match", async () => {
          const user = userEvent.setup();
          await renderRelationship();

          await user.click(screen.getByRole("combobox"));
          expect(await screen.findByText("Alpha")).toBeInTheDocument();
          expect(screen.getByText("Bravo")).toBeInTheDocument();
          expect(screen.getByText("Charlie")).toBeInTheDocument();

          const search = screen.getByPlaceholderText(/search document/i);
          await user.type(search, "Bra");

          // Immediately after typing — before the 200ms debounce has had a
          // chance to fire — the pre-search result set is still on screen.
          // This is the assertion that proves genuine deferral, not just
          // eventual convergence.
          expect(screen.getByText("Alpha")).toBeInTheDocument();
          expect(screen.getByText("Charlie")).toBeInTheDocument();

          await waitFor(() => expect(screen.queryByText("Alpha")).not.toBeInTheDocument(), {
            timeout: 2000,
          });
          expect(screen.getByText("Bravo")).toBeInTheDocument();
          expect(screen.queryByText("Charlie")).not.toBeInTheDocument();
        });

        test("non-searchable branch: when the target collection's useAsTitle is a system field, the picker lists via find() and ignores the search text", async () => {
          const user = userEvent.setup();
          const { queryClient } = await renderRelationship({
            config: sanitizeConfigForClient(
              defineConfig({ collections: [relationshipTargetCollectionByCreationTime] }),
            ),
          });

          await user.click(screen.getByRole("combobox"));
          // `getAllByRole("button")` also matches Base UI's `role="button"`
          // focus-guard spans used for its focus trap — real interactive
          // controls are the only actual `<button>` elements, so scope to
          // those instead of the ambiguous accessible-role query.
          await waitFor(() =>
            expect(document.querySelectorAll("button")).toHaveLength(4),
          ); // trigger + 3 rows

          const search = screen.getByPlaceholderText(/search document/i);
          await user.type(search, "zzz-no-match-for-anything");

          expect(document.querySelectorAll("button")).toHaveLength(4); // unaffected by the typed text
          expect(
            queryClient.getQueryCache().findAll({ queryKey: ["convexQuery", "vex:find"] }),
          ).toHaveLength(1); // one stable cache entry — find()'s args never include `query`
        });

        test("renders a loading indicator while the picker query is pending, then the seeded documents once it resolves", async () => {
          await renderRelationship();
          const trigger = screen.getByRole("combobox");

          // `fireEvent.click` (unlike `userEvent.click`) does not await anything
          // beyond synchronous React updates, so the very next synchronous
          // assertion runs before convex-test's promise chain has resolved:
          // `isPending` is still true.
          fireEvent.click(trigger);
          expect(screen.getByText("Loading…")).toBeInTheDocument();
          // The popover's content renders into a Base UI portal appended as a
          // sibling of `render()`'s `container`, not inside it — query
          // `document` rather than `container` to reach it.
          const spinner = document.querySelector("svg.animate-spin");
          expect(spinner).not.toHaveClass("invisible");

          expect(await screen.findByText("Alpha")).toBeInTheDocument();
          expect(document.querySelector("svg.animate-spin")).toHaveClass("invisible");
        });

        test("no documents match the search text renders 'No documents found' instead of an empty list", async () => {
          const user = userEvent.setup();
          await renderRelationship();

          await user.click(screen.getByRole("combobox"));
          expect(await screen.findByText("Alpha")).toBeInTheDocument();

          const search = screen.getByPlaceholderText(/search document/i);
          await user.type(search, "no-such-document-exists");

          expect(await screen.findByText("No documents found")).toBeInTheDocument();
          expect(screen.queryByText("Alpha")).not.toBeInTheDocument();
        });
      });

      describe("selection state machine", () => {
        test("hasMany: selecting a document adds a chip; selecting it again in the list toggles it off", async () => {
          const user = userEvent.setup();
          await renderRelationship({ seedTitles: ["Alpha", "Bravo"] });

          await user.click(screen.getByRole("combobox"));
          const row = await screen.findByRole("button", { name: /alpha/i });

          await user.click(row);
          await waitFor(() => expect(screen.getAllByText("Alpha")).toHaveLength(2));

          await user.click(screen.getByRole("button", { name: /alpha/i }));
          await waitFor(() => expect(screen.getAllByText("Alpha")).toHaveLength(1));
        });

        test("hasMany: the chip's own remove (×) button removes the selected document from the value", async () => {
          const user = userEvent.setup();
          const { container } = await renderRelationship({ seedTitles: ["Alpha", "Bravo"] });

          await user.click(screen.getByRole("combobox"));
          await user.click(await screen.findByRole("button", { name: /alpha/i }));
          await waitFor(() => expect(screen.getAllByText("Alpha")).toHaveLength(2));

          // The chip's × button is icon-only (lucide `X`, `aria-hidden`) with no
          // accessible name of its own, so it's queried by its distinguishing
          // class rather than role/name. Enabled while the field is editable,
          // disabled only when `readOnly` or `fieldDef.admin.readOnly` is true —
          // mirrors `handleRemove`'s own guard
          // (`if (readOnly || fieldDef.admin.readOnly) return;`) exactly (UI-10).
          const removeButton = container.querySelector<HTMLButtonElement>(
            "button.hover\\:text-destructive",
          );
          expect(removeButton).not.toBeDisabled();
          await user.click(removeButton!);
          // Assert the CHIP is gone, not a global "Alpha" count. The × sits
          // outside the popover, so clicking it also triggers Base UI's
          // outside-press dismissal and the candidate list unmounts once its CSS
          // exit animation finishes. A `getAllByText("Alpha")` count races that
          // unmount — 1 while the list is still mounted, 0 after — and 0 makes
          // `getAllByText` THROW ("Unable to find an element with the text:
          // Alpha") rather than compare, so `waitFor` retries until it times out.
          // That is how this passed locally and failed on slower CI runners. The
          // chip renders from the field value, so no × means the document is no
          // longer selected, which is what this test is about.
          await waitFor(() =>
            expect(container.querySelector("button.hover\\:text-destructive")).toBeNull(),
          );
        });

        test("single-select: choosing a document sets the trigger preview and closes the popover", async () => {
          const user = userEvent.setup();
          const singleFieldDef: RelationshipField<CollectionFieldMeta> = {
            ...relationshipFieldFixture.fieldDef,
            hasMany: false,
          };
          await renderRelationship({ fieldDef: singleFieldDef, seedTitles: ["Alpha", "Bravo"] });

          const trigger = screen.getByRole("combobox");
          await user.click(trigger);
          await user.click(within(popoverContent()).getByRole("button", { name: "Alpha" }));

          // Base UI's `Popover.Popup` unmounts only after its CSS exit
          // animation completes (`data-closed:animate-out`, `popover.tsx`),
          // so a synchronous assertion right after the click races the
          // animation-driven unmount — a harness timing gap, not a
          // component defect. `waitFor` lets it settle.
          await waitFor(() => {
            expect(screen.queryByPlaceholderText(/search document/i)).not.toBeInTheDocument();
          });
          expect(await within(trigger).findByText("Alpha")).toBeInTheDocument();
        });

        test("single-select: choosing a second document replaces the first rather than adding to it", async () => {
          const user = userEvent.setup();
          const singleFieldDef: RelationshipField<CollectionFieldMeta> = {
            ...relationshipFieldFixture.fieldDef,
            hasMany: false,
          };
          await renderRelationship({ fieldDef: singleFieldDef, seedTitles: ["Alpha", "Bravo"] });

          const trigger = screen.getByRole("combobox");
          await user.click(trigger);
          await user.click(within(popoverContent()).getByRole("button", { name: "Alpha" }));
          await waitFor(() => expect(within(trigger).queryByText("Alpha")).toBeInTheDocument());

          await user.click(trigger);
          await user.click(within(popoverContent()).getByRole("button", { name: "Bravo" }));

          expect(await within(trigger).findByText("Bravo")).toBeInTheDocument();
          // Same Base UI exit-animation lag documented above.
          await waitFor(() => {
            expect(screen.queryByText("Alpha")).not.toBeInTheDocument();
          });
        });

        test("single-select: choosing the currently-selected document again clears the value", async () => {
          const user = userEvent.setup();
          const singleFieldDef: RelationshipField<CollectionFieldMeta> = {
            ...relationshipFieldFixture.fieldDef,
            hasMany: false,
          };
          await renderRelationship({ fieldDef: singleFieldDef, seedTitles: ["Alpha", "Bravo"] });

          const trigger = screen.getByRole("combobox");
          await user.click(trigger);
          await user.click(within(popoverContent()).getByRole("button", { name: "Alpha" }));
          await waitFor(() => expect(within(trigger).queryByText("Alpha")).toBeInTheDocument());

          await user.click(trigger);
          await user.click(within(popoverContent()).getByRole("button", { name: "Alpha" }));

          expect(await within(trigger).findByText(/select document/i)).toBeInTheDocument();
          // Same Base UI exit-animation lag as above — the popover's row list
          // (which also renders "Alpha" as a candidate's preview label) can
          // still be mid-unmount right after the closing click.
          await waitFor(() => {
            expect(screen.queryByText("Alpha")).not.toBeInTheDocument();
          });
        });

        test("a selected id that no longer resolves (e.g. a deleted document) is silently dropped from the chip list", async () => {
          await renderRelationship({
            seedTitles: ["Ghost", "Alpha"],
            afterSeed: async (ctx, ids) => {
              await ctx.db.delete(ids[0] as GenericId<"documents">);
            },
            initialValue: (ids) => [ids[0], ids[1]],
          });

          await waitFor(() => expect(screen.getByText("Alpha")).toBeInTheDocument());
          expect(screen.queryByText("Ghost")).not.toBeInTheDocument();
        });
      });

      describe("resolveRelationshipPreview (ARCH-1)", () => {
        test("field-level admin.components.preview overrides the default text preview", async () => {
          const user = userEvent.setup();
          const fieldDefWithPreview: RelationshipField<CollectionFieldMeta> = {
            ...relationshipFieldFixture.fieldDef,
            admin: {
              ...relationshipFieldFixture.fieldDef.admin,
              components: { preview: FieldLevelPreview },
            },
          };
          await renderRelationship({
            fieldDef: fieldDefWithPreview,
            seedTitles: ["Alpha"],
          });

          await user.click(screen.getByRole("combobox"));
          expect(await screen.findByText("Field preview: Alpha")).toBeInTheDocument();
          expect(screen.queryByText("Alpha")).not.toBeInTheDocument();
        });
      });
    });
  },
});
