import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "@tanstack/react-form";
import {
  adminFieldToInputSchema,
  defineConfig,
  text,
  type CollectionConfig,
  type TextField,
} from "@vexcms/core";
import { AppForm } from "../../form/AppForm";
import { VexConfigContext } from "../../../context/VexConfigContext";
import { testCollection } from "../../../testing/harness/accessFixtures";
import { runFieldInputContractSuite } from "../../../testing/fieldInputContract";
import { textFieldFixture } from "./testFixture";
import { TextFieldInput } from "./Input";

const { withMaskMock } = vi.hoisted(() => {
  const applyMaskMock = vi.fn();
  return { withMaskMock: vi.fn(() => applyMaskMock) };
});

vi.mock("use-mask-input", () => ({ withMask: withMaskMock }));

/**
 * Mounts `TextFieldInput` behind a real `useForm` + `<AppForm>`, wired with the
 * same real `adminFieldToInputSchema`-driven `onSubmit` validator the generic
 * factory uses internally — needed here (rather than the shared fixture's fixed
 * schema) because every boundary test below constructs and submits its own
 * `min`/`max`/`required` combination.
 */
function TextValidationHarness(props: {
  fieldDef: TextField;
  collection: CollectionConfig;
  initialValue: string | undefined;
}) {
  const form = useForm({
    defaultValues: { testField: props.initialValue },
    validators: {
      onSubmit: ({ value }) => {
        const schema = adminFieldToInputSchema({ field: props.fieldDef });
        const result = schema.safeParse(value.testField);
        if (result.success) return undefined;
        return { fields: { testField: result.error.issues[0]?.message ?? "Invalid value" } };
      },
    },
  });
  return (
    <AppForm form={form}>
      <TextFieldInput
        name="testField"
        fieldDef={props.fieldDef}
        collection={props.collection}
        readOnly={false}
      />
      <button type="submit">Submit</button>
    </AppForm>
  );
}

runFieldInputContractSuite({
  fixture: textFieldFixture,
  Component: TextFieldInput,
  extra: (options) => {
    const collection = options.collection ?? testCollection;

    async function submit(fieldDef: TextField, value: string | undefined): Promise<string> {
      const user = userEvent.setup();
      const { container } = render(
        <TextValidationHarness fieldDef={fieldDef} collection={collection} initialValue={value} />,
      );
      await user.click(screen.getByRole("button", { name: /submit/i }));
      return container.querySelector(".text-destructive")?.textContent ?? "";
    }

    describe("text: length boundaries, the required-vs-min/max override trap, and no client-side truncation", () => {
      it("accepts a value at exactly the configured min length", async () => {
        const fieldDef = text({ label: "Bio", min: 3 });
        expect(await submit(fieldDef, "x".repeat(3))).toBe("");
      });

      it("rejects a value one character below the min length with the default min-length message", async () => {
        const fieldDef = text({ label: "Bio", min: 3 });
        expect(await submit(fieldDef, "x".repeat(2))).toBe("Must be at least 3 characters.");
      });

      it("accepts a value at exactly the configured max length", async () => {
        const fieldDef = text({ label: "Bio", max: 10 });
        expect(await submit(fieldDef, "x".repeat(10))).toBe("");
      });

      it("rejects a value one character over the max length with the default max-length message", async () => {
        const fieldDef = text({ label: "Bio", max: 10 });
        expect(await submit(fieldDef, "x".repeat(11))).toBe("Must be no more than 10 characters.");
      });

      it("uses a custom min.error message instead of the default when configured", async () => {
        const fieldDef = text({
          label: "Bio",
          min: [5, "Bio needs at least 5 characters."],
        });
        expect(await submit(fieldDef, "x".repeat(4))).toBe("Bio needs at least 5 characters.");
      });

      it("uses a custom max.error message instead of the default when configured", async () => {
        const fieldDef = text({
          label: "Bio",
          max: [5, "Bio can be at most 5 characters."],
        });
        expect(await submit(fieldDef, "x".repeat(6))).toBe("Bio can be at most 5 characters.");
      });

      it("required + min (no max): a missing value fails with the required message — CORE-1 fixed: min/max compose onto the required branch instead of reassigning over it", async () => {
        const fieldDef = text({ label: "Bio", required: true, min: 3 });
        expect(await submit(fieldDef, undefined)).toBe("This field is required.");
      });

      it("required + max only (no min): a missing value fails with the required message, not silently passing", async () => {
        const fieldDef = text({ label: "Bio", required: true, max: 10 });
        expect(await submit(fieldDef, undefined)).toBe("This field is required.");
      });

      it("required + min AND max together: a missing value still fails with the required message", async () => {
        const fieldDef = text({
          label: "Bio",
          required: true,
          min: 3,
          max: 10,
        });
        expect(await submit(fieldDef, undefined)).toBe("This field is required.");
      });

      it('a plain required field with no min/max keeps "This field is required." for a missing value', async () => {
        const fieldDef = text({ label: "Bio", required: true });
        expect(await submit(fieldDef, undefined)).toBe("This field is required.");
      });

      it("an optional field with no min/max accepts a missing value", async () => {
        const fieldDef = text({ label: "Bio" });
        expect(await submit(fieldDef, undefined)).toBe("");
      });

      it("never client-side truncates or rejects a value past max — enforcement is deferred to the schema on submit", async () => {
        const user = userEvent.setup();
        const fieldDef = text({ label: "Bio", max: 5 });
        render(
          <TextValidationHarness
            fieldDef={fieldDef}
            collection={collection}
            initialValue={undefined}
          />,
        );

        const input = screen.getByLabelText("Bio", { exact: false });
        await user.type(input, "way too long for max");
        expect(input).toHaveValue("way too long for max");
      });
    });

    describe("text: character counter", () => {
      it("renders no counter when fieldDef.max is not set", () => {
        render(
          <TextValidationHarness
            fieldDef={text({ label: "Bio" })}
            collection={collection}
            initialValue=""
          />,
        );
        expect(screen.queryByText(/^\d+\/\d+$/)).not.toBeInTheDocument();
      });

      it("shows current length / max once fieldDef.max is set", () => {
        const fieldDef = text({ label: "Bio", max: [10, "Too long"] });
        render(
          <TextValidationHarness
            fieldDef={fieldDef}
            collection={collection}
            initialValue="Hi"
          />,
        );
        expect(screen.getByText("2/10")).toBeInTheDocument();
      });

      it("updates live as the user types", async () => {
        const user = userEvent.setup();
        const fieldDef = text({ label: "Bio", max: [10, "Too long"] });
        render(
          <TextValidationHarness
            fieldDef={fieldDef}
            collection={collection}
            initialValue=""
          />,
        );
        const input = screen.getByLabelText("Bio", { exact: false });
        await user.type(input, "Hello");
        expect(screen.getByText("5/10")).toBeInTheDocument();
      });
    });
  },
});

describe("text: admin.mask", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function TextMaskHarness(props: { fieldDef: TextField }) {
    const form = useForm({ defaultValues: { testField: "" } });
    return (
      <AppForm form={form}>
        <TextFieldInput name="testField" fieldDef={props.fieldDef} readOnly={false} collection={testCollection} />
      </AppForm>
    );
  }

  function renderMasked(fieldDef: TextField) {
    return render(
      <VexConfigContext.Provider value={defineConfig()}>
        <TextMaskHarness fieldDef={fieldDef} />
      </VexConfigContext.Provider>,
    );
  }

  it("lazily applies the mask when admin.mask is set", async () => {
    const fieldDef = text({ label: "Phone", admin: { mask: "(999) 999-9999" } });
    renderMasked(fieldDef);
    await waitFor(() =>
      expect(withMaskMock).toHaveBeenCalledWith("(999) 999-9999", { autoUnmask: true }),
    );
  });

  it("renders the ordinary controlled input when no mask resolves", () => {
    const fieldDef = text({ label: "Title" });
    renderMasked(fieldDef);
    expect(withMaskMock).not.toHaveBeenCalled();
  });
});
