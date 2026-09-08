import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "@tanstack/react-form";
import { urlFieldToInputSchema, type CollectionConfig, type UrlField } from "@vexcms/core";
import { AppForm } from "../../form/AppForm";
import { testCollection } from "../../../testing/harness/accessFixtures";
import { runFieldInputContractSuite } from "../../../testing/fieldInputContract";
import { urlFieldFixture } from "./testFixture";
import { UrlFieldInput } from "./Input";

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

      // Real finding from reading urlFieldToInputSchema directly: the
      // required branch is `z.url().min(1, "This field is required.")` — the
      // url-format check runs BEFORE the length check in that chain, and an
      // empty string fails the format check too (`new URL("")` throws), so
      // issues[0] — the one FormError displays — is "Invalid URL", not "This
      // field is required.", for an empty required url field.
      it('shows "Invalid URL" (not "This field is required.") as the first error when the required field is left empty', async () => {
        const user = userEvent.setup();
        render(
          <UrlBoundaryHarness
            fieldDef={options.fixture.fieldDef}
            collection={collection}
            initialValue=""
          />,
        );
        await user.click(screen.getByRole("button", { name: "Save" }));
        expect(await screen.findByText("Invalid URL")).toBeInTheDocument();
        expect(screen.queryByText("This field is required.")).not.toBeInTheDocument();
      });
    });
  },
});
