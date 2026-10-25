import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "@tanstack/react-form";
import {
  defineConfig,
  url,
  urlFieldToInputSchema,
  type CollectionConfig,
  type UrlField,
} from "@vexcms/core";
import { AppForm } from "../../form/AppForm";
import { VexConfigContext } from "../../../context/VexConfigContext";
import { testCollection } from "../../../testing/harness/accessFixtures";
import { runFieldInputContractSuite } from "../../../testing/fieldInputContract";
import { urlFieldFixture } from "./testFixture";
import { UrlFieldInput } from "./Input";

const { withMaskMock } = vi.hoisted(() => {
  const applyMaskMock = vi.fn();
  return { withMaskMock: vi.fn(() => applyMaskMock) };
});

vi.mock("use-mask-input", () => ({ withMask: withMaskMock }));

/** Mounts `UrlFieldInput` behind a real `useForm` + `<AppForm>`. */
function UrlHarness(props: {
  fieldDef: UrlField;
  collection: CollectionConfig;
  initialValue: string | undefined;
}) {
  const form = useForm({ defaultValues: { testField: props.initialValue } });
  return (
    <AppForm form={form}>
      <UrlFieldInput
        name="testField"
        fieldDef={props.fieldDef}
        collection={props.collection}
        readOnly={false}
      />
    </AppForm>
  );
}

/**
 * Mounts `UrlFieldInput` with the field's REAL `urlFieldToInputSchema` wired
 * as an explicit `form.Field` `onSubmit` validator, plus a submit button, so
 * the schema's actual accepted/rejected notations and exact error messages
 * can be checked through the real submit path.
 */
function UrlBoundaryHarness(props: {
  fieldDef: UrlField;
  collection: CollectionConfig;
  initialValue: string;
}) {
  const form = useForm({ defaultValues: { testField: props.initialValue } });
  const schema = urlFieldToInputSchema({ field: props.fieldDef });
  return (
    <AppForm form={form}>
      <form.Field
        name="testField"
        validators={{
          onSubmit: ({ value }) => {
            const result = schema.safeParse(value);
            return result.success ? undefined : result.error.issues[0]?.message;
          },
        }}
      >
        {(field) => (
          <UrlFieldInput
            name="testField"
            fieldDef={props.fieldDef}
            collection={props.collection}
            readOnly={false}
            field={field}
          />
        )}
      </form.Field>
      <button type="submit">Save</button>
    </AppForm>
  );
}

runFieldInputContractSuite({
  fixture: urlFieldFixture,
  Component: UrlFieldInput,
  extra: (options) => {
    const collection = options.collection ?? testCollection;

    describe("url: the input never format-checks — that is deferred entirely to the schema", () => {
      it('renders a plain text input, not the browser\'s native type="url"', () => {
        render(
          <UrlHarness
            fieldDef={options.fixture.fieldDef}
            collection={collection}
            initialValue={options.fixture.empty}
          />,
        );
        expect(
          screen.getByLabelText(options.fixture.fieldDef.label, { exact: false }),
        ).toHaveAttribute("type", "text");
      });

      it("accepts a malformed URL verbatim while typing — no client-side format rejection", async () => {
        const user = userEvent.setup();
        render(
          <UrlHarness
            fieldDef={options.fixture.fieldDef}
            collection={collection}
            initialValue={options.fixture.empty}
          />,
        );
        const input = screen.getByLabelText(options.fixture.fieldDef.label, { exact: false });
        await user.type(input, "not-a-valid-url");
        expect(input).toHaveValue("not-a-valid-url");
      });

      it("accepts a well-formed absolute URL while typing", async () => {
        const user = userEvent.setup();
        render(
          <UrlHarness
            fieldDef={options.fixture.fieldDef}
            collection={collection}
            initialValue={options.fixture.empty}
          />,
        );
        const input = screen.getByLabelText(options.fixture.fieldDef.label, { exact: false });
        await user.type(input, options.fixture.valid);
        expect(input).toHaveValue(options.fixture.valid);
      });
    });

    describe("url: urlFieldToInputSchema — absolute-only, protocol-agnostic, whitespace-trimmed", () => {
      it('rejects a bare domain with no scheme ("example.com") with the schema\'s real "Invalid URL" message', async () => {
        const user = userEvent.setup();
        render(
          <UrlBoundaryHarness
            fieldDef={options.fixture.fieldDef}
            collection={collection}
            initialValue=""
          />,
        );
        const input = screen.getByLabelText(options.fixture.fieldDef.label, { exact: false });
        await user.type(input, "example.com");
        await user.click(screen.getByRole("button", { name: "Save" }));
        expect(await screen.findByText("Invalid URL")).toBeInTheDocument();
      });

      it('rejects a root-relative path ("/relative/path") the same way — the schema requires an absolute URL', async () => {
        const user = userEvent.setup();
        render(
          <UrlBoundaryHarness
            fieldDef={options.fixture.fieldDef}
            collection={collection}
            initialValue=""
          />,
        );
        const input = screen.getByLabelText(options.fixture.fieldDef.label, { exact: false });
        await user.type(input, "/relative/path");
        await user.click(screen.getByRole("button", { name: "Save" }));
        expect(await screen.findByText("Invalid URL")).toBeInTheDocument();
      });

      it("accepts a non-http(s) scheme (mailto:) — urlFieldToInputSchema is not restricted to http/https", async () => {
        const user = userEvent.setup();
        render(
          <UrlBoundaryHarness
            fieldDef={options.fixture.fieldDef}
            collection={collection}
            initialValue=""
          />,
        );
        const input = screen.getByLabelText(options.fixture.fieldDef.label, { exact: false });
        await user.type(input, "mailto:test@example.com");
        await user.click(screen.getByRole("button", { name: "Save" }));
        expect(screen.queryByText("Invalid URL")).not.toBeInTheDocument();
      });

      it("accepts a value with leading/trailing whitespace — z.url() trims before validating", async () => {
        const user = userEvent.setup();
        render(
          <UrlBoundaryHarness
            fieldDef={options.fixture.fieldDef}
            collection={collection}
            initialValue=""
          />,
        );
        const input = screen.getByLabelText(options.fixture.fieldDef.label, { exact: false });
        await user.type(input, "  https://example.com  ");
        await user.click(screen.getByRole("button", { name: "Save" }));
        expect(screen.queryByText("Invalid URL")).not.toBeInTheDocument();
      });

      // CORE-2 (fixed in Step 1): `urlFieldToInputSchema`'s required branch
      // is now `z.string({ error: requiredError }).min(1, requiredError).pipe(z.url())`
      // — `.min(1)` runs on the plain string and short-circuits the pipe, so
      // an empty required field correctly reports "This field is required."
      // instead of "Invalid URL".
      it('shows "This field is required." (not "Invalid URL") when the required field is left empty', async () => {
        const user = userEvent.setup();
        render(
          <UrlBoundaryHarness
            fieldDef={options.fixture.fieldDef}
            collection={collection}
            initialValue=""
          />,
        );
        await user.click(screen.getByRole("button", { name: "Save" }));
        expect(await screen.findByText("This field is required.")).toBeInTheDocument();
        expect(screen.queryByText("Invalid URL")).not.toBeInTheDocument();
      });
    });

    describe("url: open-link button", () => {
      it("disables the open-link button when the field is empty", () => {
        render(
          <UrlHarness
            fieldDef={options.fixture.fieldDef}
            collection={collection}
            initialValue=""
          />,
        );
        expect(
          screen.getByRole("button", { name: "Open link in new tab" }),
        ).toHaveAttribute("aria-disabled", "true");
      });

      it("disables the open-link button while the value does not parse as a URL", async () => {
        const user = userEvent.setup();
        render(
          <UrlHarness
            fieldDef={options.fixture.fieldDef}
            collection={collection}
            initialValue={options.fixture.empty}
          />,
        );
        const input = screen.getByLabelText(options.fixture.fieldDef.label, {
          exact: false,
        });
        await user.type(input, "not-a-valid-url");
        expect(
          screen.getByRole("button", { name: "Open link in new tab" }),
        ).toHaveAttribute("aria-disabled", "true");
      });

      it("enables the open-link button once the value parses as a URL, pointing at it with target=_blank and rel=noopener", async () => {
        const user = userEvent.setup();
        render(
          <UrlHarness
            fieldDef={options.fixture.fieldDef}
            collection={collection}
            initialValue={options.fixture.empty}
          />,
        );
        const input = screen.getByLabelText(options.fixture.fieldDef.label, {
          exact: false,
        });
        await user.type(input, options.fixture.valid);
        const link = screen.getByRole("button", { name: "Open link in new tab" });
        expect(link).toHaveAttribute("href", options.fixture.valid);
        expect(link).toHaveAttribute("target", "_blank");
        expect(link.getAttribute("rel")).toContain("noopener");
      });
    });
  },
});

describe("url: admin.mask", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function UrlMaskHarness(props: { fieldDef: UrlField }) {
    const form = useForm({ defaultValues: { testField: "" } });
    return (
      <AppForm form={form}>
        <UrlFieldInput name="testField" fieldDef={props.fieldDef} readOnly={false} collection={testCollection} />
      </AppForm>
    );
  }

  it("lazily applies the mask when admin.mask is set", async () => {
    const fieldDef = url({ label: "Profile", admin: { mask: "url" } });
    render(
      <VexConfigContext.Provider value={defineConfig()}>
        <UrlMaskHarness fieldDef={fieldDef} />
      </VexConfigContext.Provider>,
    );
    await waitFor(() => expect(withMaskMock).toHaveBeenCalledWith("url", { autoUnmask: true }));
  });

  it("falls back to the project-wide default from fields.inputMasks.url", async () => {
    const fieldDef = url({ label: "Profile" });
    render(
      <VexConfigContext.Provider value={defineConfig({ fields: { inputMasks: { url: "url" } } })}>
        <UrlMaskHarness fieldDef={fieldDef} />
      </VexConfigContext.Provider>,
    );
    await waitFor(() => expect(withMaskMock).toHaveBeenCalledWith("url", { autoUnmask: true }));
  });

  it("renders the ordinary controlled input when no mask resolves", () => {
    const fieldDef = url({ label: "Website" });
    render(
      <VexConfigContext.Provider value={defineConfig()}>
        <UrlMaskHarness fieldDef={fieldDef} />
      </VexConfigContext.Provider>,
    );
    expect(withMaskMock).not.toHaveBeenCalled();
  });
});
