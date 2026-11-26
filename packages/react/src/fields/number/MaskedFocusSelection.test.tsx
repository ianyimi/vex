import { describe, expect, it } from "vitest";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { useForm } from "@tanstack/react-form";
import { defineConfig, number } from "@vexcms/core";
import { AppForm } from "../../forms";
import { VexConfigContext } from "../../config/VexConfigContext";
import { testCollection } from "../../testing/harness/accessFixtures";
import { NumberFieldAdmin } from "./Field";

/**
 * Mounts `NumberFieldAdmin` against the REAL `use-mask-input` (not the
 * `withMask` spy `Field.test.tsx` installs module-wide) so this file alone
 * exercises Inputmask's own native `focus` listener — the only way to prove
 * a React `onFocus` handler's selection survives it, since a mocked
 * `applyMask` never attaches that listener at all.
 */
function MaskHarness(props: { initial?: number | null }) {
  const form = useForm({ defaultValues: { amount: props.initial } });
  const fieldDef = number({ label: "Amount", admin: { mask: "999-999-9999" } });
  return (
    <VexConfigContext.Provider value={defineConfig()}>
      <AppForm form={form}>
        <NumberFieldAdmin name="amount" fieldDef={fieldDef} readOnly={false} collection={testCollection} />
        <form.Subscribe selector={(state) => state.values.amount}>
          {(value) => <output data-testid="value-probe">{value === undefined ? "undefined" : JSON.stringify(value)}</output>}
        </form.Subscribe>
      </AppForm>
    </VexConfigContext.Provider>
  );
}

/**
 * Reads the input's true displayed text, bypassing `autoUnmask`'s own
 * instance-level override of the native `value` getter (which makes every
 * OTHER `.value` read, and every `input`/`change` event's `target.value`,
 * report the raw unmasked string instead) — the only way to see the masked
 * placeholder pattern Inputmask is actually rendering on screen.
 */
function readDisplayedText(input: HTMLInputElement): string | undefined {
  return Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.get?.call(input) as
    | string
    | undefined;
}

describe("number: masked control focus selection (real Inputmask)", () => {
  it("selects the whole masked value on focus, surviving Inputmask's own native focus handler", async () => {
    const { container } = render(<MaskHarness initial={0} />);
    const input = container.querySelector("input") as HTMLInputElement;
    await waitFor(() => expect("inputmask" in input).toBe(true));
    fireEvent.focus(input);
    expect(input.selectionStart).toBe(0);
    expect(input.selectionEnd).toBeGreaterThan(0);
  });
});

describe("number: masked control stays visible while empty (real Inputmask)", () => {
  it("still shows the mask placeholder pattern after blur, with the committed form value left empty", async () => {
    const { container, getByTestId } = render(<MaskHarness />);
    const input = container.querySelector("input") as HTMLInputElement;
    await waitFor(() => expect("inputmask" in input).toBe(true));

    expect(readDisplayedText(input)).toBe("___-___-____");
    expect(input.value).toBe("");

    fireEvent.focus(input);
    expect(readDisplayedText(input)).toBe("___-___-____");

    fireEvent.blur(input);
    expect(readDisplayedText(input)).toBe("___-___-____");
    expect(input.value).toBe("");
    expect(getByTestId("value-probe")).toHaveTextContent("undefined");
  });
});
