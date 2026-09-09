import { describe, expect, it, beforeAll } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "@tanstack/react-form";
import { colorFieldToInputSchema, type ColorField, type CollectionConfig } from "@vexcms/core";
import { AppForm } from "../../form/AppForm";
import { installDomPolyfills } from "../../../testing/setup";
import { testCollection } from "../../../testing/harness/accessFixtures";
import { getControl, runFieldInputContractSuite } from "../../../testing/fieldInputContract";
import { colorFieldFixture } from "./testFixture";
import { ColorFieldInput } from "./Input";

// The colour picker's popover is positioned by Base UI's floating-ui
// integration, which — like cmdk's virtual list in `ui/multi-select.test.tsx`
// — expects a real layout engine. jsdom has none; install the same
// ResizeObserver/scrollIntoView stubs before opening any popover in this file.
beforeAll(() => {
  installDomPolyfills();
});

/** Mounts `ColorFieldInput` behind a real `useForm` + `<AppForm>`. */
function ColorHarness(props: {
  fieldDef: ColorField;
  collection: CollectionConfig;
  initialValue: string | undefined;
}) {
  const form = useForm({ defaultValues: { testField: props.initialValue } });
  return (
    <AppForm form={form}>
      <ColorFieldInput
        name="testField"
        fieldDef={props.fieldDef}
        collection={props.collection}
        readOnly={false}
      />
    </AppForm>
  );
}

runFieldInputContractSuite({
  fixture: colorFieldFixture,
  Component: ColorFieldInput,
  extra: (options) => {
    const collection = options.collection ?? testCollection;
    const label = options.fixture.fieldDef.label;

    describe("color: the plain text input accepts any notation, mirrored to the swatch", () => {
      it("accepts a hex value and reflects it as the swatch's background colour", async () => {
        const user = userEvent.setup();
        const { container } = render(
          <ColorHarness
            fieldDef={options.fixture.fieldDef}
            collection={collection}
            initialValue={options.fixture.empty}
          />,
        );
        const input = getControl(container, label);
        await user.type(input, "#ff0000");
        const swatch = screen.getByRole("button", { name: `Pick a colour for ${label}` });
        // jsdom normalizes a hex colour assigned to `style.backgroundColor` to rgb().
        expect(swatch.style.backgroundColor).toBe("rgb(255, 0, 0)");
      });

      it("accepts an rgb() value verbatim as the swatch's background colour", async () => {
        const user = userEvent.setup();
        const { container } = render(
          <ColorHarness
            fieldDef={options.fixture.fieldDef}
            collection={collection}
            initialValue={options.fixture.empty}
          />,
        );
        const input = getControl(container, label);
        await user.type(input, "rgb(0, 128, 0)");
        const swatch = screen.getByRole("button", { name: `Pick a colour for ${label}` });
        expect(swatch.style.backgroundColor).toBe("rgb(0, 128, 0)");
      });
    });

    describe("color: colorFieldToInputSchema — format governs the picker's writes, not what submit accepts", () => {
      it('accepts every supported notation on submit even though fieldDef.format is "hex"', () => {
        const schema = colorFieldToInputSchema({ field: options.fixture.fieldDef });
        expect(schema.safeParse("rgb(0, 128, 0)").success).toBe(true);
        expect(schema.safeParse("hsl(120, 100%, 25%)").success).toBe(true);
        expect(schema.safeParse("oklch(50% 0.2 140)").success).toBe(true);
      });

      it("rejects a shorthand/invalid hex with the field's exact real error message", () => {
        const schema = colorFieldToInputSchema({ field: options.fixture.fieldDef });
        const result = schema.safeParse("#fff");
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe("Enter a colour, e.g. #E8622A.");
        }
      });

      it("accepts an 8-digit hex value with an alpha channel", () => {
        const schema = colorFieldToInputSchema({ field: options.fixture.fieldDef });
        expect(schema.safeParse("#e8622a80").success).toBe(true);
      });

      it("rejects a var(--token) theme reference when themeColors is off (this fixture's default)", () => {
        const schema = colorFieldToInputSchema({ field: options.fixture.fieldDef });
        const result = schema.safeParse("var(--primary)");
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe("Enter a colour, e.g. #E8622A.");
        }
      });
    });

    describe("color: the swatch button opens/closes a picker with its own value-commit path", () => {
      it("opens the picker on click, revealing its own Hex sub-input", async () => {
        const user = userEvent.setup();
        render(
          <ColorHarness
            fieldDef={options.fixture.fieldDef}
            collection={collection}
            initialValue={options.fixture.valid}
          />,
        );
        expect(screen.queryByLabelText("Hex")).not.toBeInTheDocument();
        await user.click(screen.getByRole("button", { name: `Pick a colour for ${label}` }));
        expect(await screen.findByLabelText("Hex")).toBeInTheDocument();
      });

      it("closes on Escape", async () => {
        const user = userEvent.setup();
        render(
          <ColorHarness
            fieldDef={options.fixture.fieldDef}
            collection={collection}
            initialValue={options.fixture.valid}
          />,
        );
        await user.click(screen.getByRole("button", { name: `Pick a colour for ${label}` }));
        await screen.findByLabelText("Hex");
        await user.keyboard("{Escape}");
        await waitFor(() => {
          expect(screen.queryByLabelText("Hex")).not.toBeInTheDocument();
        });
      });

      it("typing a full value into the picker's own Hex sub-input commits through onChange, updating the outer text input and the swatch", async () => {
        const user = userEvent.setup();
        const { container } = render(
          <ColorHarness
            fieldDef={options.fixture.fieldDef}
            collection={collection}
            initialValue={options.fixture.empty}
          />,
        );
        await user.click(screen.getByRole("button", { name: `Pick a colour for ${label}` }));
        const hexBox = await screen.findByLabelText("Hex");
        // A single fireEvent.change (one native "change" event carrying the
        // final string) rather than userEvent.type — the Hex sub-input only
        // forwards onChange once ITS OWN local value is a clean 3- or
        // 6-character hex string, so typing character by character fires
        // several intermediate 3-character commits (e.g. "e86") before the
        // full 6-character value lands.
        fireEvent.change(hexBox, { target: { value: "e8622a" } });
        expect(getControl(container, label)).toHaveValue("#e8622a");
        const swatch = screen.getByRole("button", { name: `Pick a colour for ${label}` });
        expect(swatch.style.backgroundColor).toBe("rgb(232, 98, 42)");
      });
    });
  },
});
