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

  it("lazily applies the mask to the mounted node", async () => {
    const mask: FieldMask = {
      mask: "(999) 999-9999",
      storeMasked: false,
      options: {},
    };
    const { getByTestId } = render(createElement(MaskedInput, { mask }));
    await waitFor(() =>
      expect(withMaskMock).toHaveBeenCalledWith("(999) 999-9999", {
        autoUnmask: true,
      }),
    );
    expect(applyMaskMock).toHaveBeenCalledWith(getByTestId("field"));
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
        radixPoint: ",",
        autoUnmask: false,
      }),
    );
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
