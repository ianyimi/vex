import { useState } from "react";
import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "@tanstack/react-form";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import {
  defineConfig,
  richtext,
  type CollectionConfig,
  type RichTextDocument,
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

/** A config with no `editor:` entry — exercises the configuration-error branch. */
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

describe("richtext: null-toggle restore rule", () => {
  const RESTORED_DOCUMENT: RichTextDocument = [{ type: "p", children: [{ text: "Restored text" }] }];

  function NullableRichTextHarness(props: { initialValue: RichTextDocument | null }) {
    const fieldDef = richtext({ label: "Body", nullable: true });
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
          <VexConfigContext.Provider value={configWithEditor}>
            <AppForm form={form}>
              <RichTextFieldAdmin
                name="testField"
                fieldDef={fieldDef}
                collection={testCollection}
                readOnly={false}
              />
              <form.Subscribe selector={(state) => state.values.testField}>
                {(value) => <output data-testid="value-probe">{JSON.stringify(value)}</output>}
              </form.Subscribe>
            </AppForm>
          </VexConfigContext.Provider>
        </QueryClientProvider>
      </ConvexProvider>
    );
  }

  it("unchecking after checking restores the document held before Null was checked", async () => {
    const user = userEvent.setup();
    render(<NullableRichTextHarness initialValue={RESTORED_DOCUMENT} />);
    await user.click(screen.getByRole("checkbox", { name: /Set Body to null/i }));
    expect(screen.getByTestId("value-probe")).toHaveTextContent("null");
    await user.click(screen.getByRole("checkbox", { name: /Set Body to null/i }));
    expect(screen.getByTestId("value-probe")).toHaveTextContent(JSON.stringify(RESTORED_DOCUMENT));
  });

  it("a page loaded with the field already null falls back to the field's empty default when unchecked", async () => {
    const user = userEvent.setup();
    render(<NullableRichTextHarness initialValue={null} />);
    expect(screen.getByTestId("value-probe")).toHaveTextContent("null");
    await user.click(screen.getByRole("checkbox", { name: /Set Body to null/i }));
    expect(screen.getByTestId("value-probe")).toHaveTextContent(JSON.stringify([]));
  });
});
