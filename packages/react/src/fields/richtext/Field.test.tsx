import { useState } from "react";
import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "@tanstack/react-form";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import {
  defineConfig,
  type CollectionConfig,
  type RichTextField,
  type VexClientConfig,
} from "@vexcms/core";
import { AppForm } from "../../forms";
import { VexConfigContext } from "../../config/VexConfigContext";
import { testCollection } from "../../testing/harness/accessFixtures";
import {
  getControl,
  runFieldInputContractSuite,
  stubEditorAdapter,
} from "../../testing/fieldInputContract";
import { richTextFieldFixture } from "./testFixture";
import { RichTextFieldAdmin } from "./Field";

/** The stub-editor config every OTHER fixture in this file's shared suite also mounts against. */
const configWithEditor: VexClientConfig = defineConfig({
  editor: stubEditorAdapter,
});

/** A config with no `editor:` entry — exercises the Design Decision 7 configuration-error branch. */
const configWithoutEditor: VexClientConfig = defineConfig({});

/** Mounts `RichTextFieldInput` behind a real `useForm` + `<AppForm>`, inside the Convex/QueryClient providers its media hooks need and an explicit `VexConfigContext`. */
function RichTextHarness(props: {
  fieldDef: RichTextField;
  collection: CollectionConfig;
  initialValue: unknown;
  config: VexClientConfig;
  readOnly?: boolean;
}) {
  const form = useForm({ defaultValues: { testField: props.initialValue } });
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { retry: false, queryFn: () => new Promise<never>(() => {}) } },
      }),
  );
  const [convexClient] = useState(() => new ConvexReactClient("https://example.convex.cloud"));
  return (
    <ConvexProvider client={convexClient}>
      <QueryClientProvider client={queryClient}>
        <VexConfigContext.Provider value={props.config}>
          <AppForm form={form}>
            <RichTextFieldAdmin
              name="testField"
              fieldDef={props.fieldDef}
              collection={props.collection}
              readOnly={props.readOnly ?? false}
            />
          </AppForm>
        </VexConfigContext.Provider>
      </QueryClientProvider>
    </ConvexProvider>
  );
}

runFieldInputContractSuite({
  fixture: richTextFieldFixture,
  Component: RichTextFieldAdmin,
  extra: (options) => {
    const collection = options.collection ?? testCollection;
    const label = options.fixture.fieldDef.label;

    describe("richtext: missing editor adapter", () => {
      it('renders a role="alert" configuration error naming editor: plateEditor() instead of crashing', () => {
        render(
          <RichTextHarness
            fieldDef={options.fixture.fieldDef}
            collection={collection}
            initialValue={options.fixture.empty}
            config={configWithoutEditor}
          />,
        );
        const alert = screen.getByRole("alert");
        expect(alert).toHaveTextContent("editor: plateEditor()");
      });
    });

    describe("richtext: the configured editor adapter renders and round-trips a value", () => {
      it("typing into the stub editor's control updates it to the typed text", async () => {
        const user = userEvent.setup();
        const { container } = render(
          <RichTextHarness
            fieldDef={options.fixture.fieldDef}
            collection={collection}
            initialValue={options.fixture.empty}
            config={configWithEditor}
          />,
        );
        const group = getControl(container, label);
        const textarea = within(group).getByRole("textbox");
        await user.type(textarea, "Hello world");
        expect(textarea).toHaveValue("Hello world");
      });

      it("readOnly disables the configured editor's control", () => {
        const { container } = render(
          <RichTextHarness
            fieldDef={options.fixture.fieldDef}
            collection={collection}
            initialValue={options.fixture.valid}
            config={configWithEditor}
            readOnly
          />,
        );
        const group = getControl(container, label);
        const textarea = within(group).getByRole("textbox");
        expect(textarea).toBeDisabled();
      });
    });
  },
});
