import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { createElement } from "react";
import type { FieldMask } from "@vexcms/core";
import { useFieldMask } from "./useFieldMask";

const { withMaskMock, applyMaskMock } = vi.hoisted(() => {
  const applyMaskMock = vi.fn();
  return { withMaskMock: vi.fn(() => applyMaskMock), applyMaskMock };
});

vi.mock("use-mask-input", () => ({ withMask: withMaskMock }));

/** Mounts a single masked/unmasked `<input>` driven by `useFieldMask`. */
function MaskedInput(props: { mask: FieldMask | undefined }) {
  const ref = useFieldMask({ mask: props.mask });
  return createElement("input", { "data-testid": "field", ref });
}

describe("useFieldMask", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns undefined and never imports use-mask-input when mask is undefined", () => {
    render(createElement(MaskedInput, { mask: undefined }));
    expect(withMaskMock).not.toHaveBeenCalled();
  });

  it("lazily applies the mask to the mounted node, left-aligned by default (rightAlign: false)", async () => {
    const mask: FieldMask = {
      mask: "(999) 999-9999",
      storeMasked: false,
      options: {},
    };
    const { getByTestId } = render(createElement(MaskedInput, { mask }));
    await waitFor(() =>
      expect(withMaskMock).toHaveBeenCalledWith("(999) 999-9999", {
        rightAlign: false,
        autoUnmask: true,
      }),
    );
    expect(applyMaskMock).toHaveBeenCalledWith(getByTestId("field"));
  });

  it("defaults numeric-family aliases (decimal/integer/currency/percentage) to left-aligned too, overriding their own rightAlign: true", async () => {
    const mask: FieldMask = {
      mask: "decimal",
      storeMasked: false,
      options: {},
    };
    render(createElement(MaskedInput, { mask }));
    await waitFor(() =>
      expect(withMaskMock).toHaveBeenCalledWith("decimal", {
        rightAlign: false,
        autoUnmask: true,
      }),
    );
  });

  it("passes autoUnmask: false and forwards options when storeMasked is true", async () => {
    const mask: FieldMask = {
      mask: "decimal",
      storeMasked: true,
      options: { radixPoint: "," },
    };
    render(createElement(MaskedInput, { mask }));
    await waitFor(() =>
      expect(withMaskMock).toHaveBeenCalledWith("decimal", {
        rightAlign: false,
        radixPoint: ",",
        autoUnmask: false,
      }),
    );
  });

  it("still allows a field to opt back into right-alignment via mask.options.rightAlign", async () => {
    const mask: FieldMask = {
      mask: "decimal",
      storeMasked: false,
      options: { rightAlign: true },
    };
    render(createElement(MaskedInput, { mask }));
    await waitFor(() =>
      expect(withMaskMock).toHaveBeenCalledWith("decimal", {
        rightAlign: true,
        autoUnmask: true,
      }),
    );
  });

  it("initializes Inputmask once across re-renders with an equal-but-new mask object (no caret-reset regression)", async () => {
    const makeMask = (): FieldMask => ({
      mask: "decimal",
      storeMasked: false,
      options: {},
    });
    const { rerender } = render(createElement(MaskedInput, { mask: makeMask() }));
    await waitFor(() => expect(withMaskMock).toHaveBeenCalledTimes(1));

    // Simulate a parent re-render (e.g. every keystroke) that re-resolves
    // a brand-new but value-equal mask object, as `resolveFieldMask` does.
    rerender(createElement(MaskedInput, { mask: makeMask() }));
    rerender(createElement(MaskedInput, { mask: makeMask() }));
    rerender(createElement(MaskedInput, { mask: makeMask() }));

    expect(withMaskMock).toHaveBeenCalledTimes(1);
    expect(applyMaskMock).not.toHaveBeenCalledWith(null);
  });

  it("tears down the previous mask instance on unmount", async () => {
    const mask: FieldMask = {
      mask: "decimal",
      storeMasked: false,
      options: {},
    };
    const { unmount } = render(createElement(MaskedInput, { mask }));
    await waitFor(() => expect(applyMaskMock).toHaveBeenCalledTimes(1));
    unmount();
    expect(applyMaskMock).toHaveBeenCalledWith(null);
  });
});
