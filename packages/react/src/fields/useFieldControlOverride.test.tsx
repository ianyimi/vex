import { createElement, type ComponentType } from "react";
import { render, renderHook, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ComponentOverrideInput, FieldControlProps } from "@vexcms/core";
import type { ReactHKT } from "../adapter";
import { useFieldControlOverride } from "./useFieldControlOverride";

type Props = FieldControlProps<string>;
type OverrideProps = Props & { renderDefault: ComponentType<Props> };

const baseControlProps: Props = {
  id: "test-field",
  value: "",
  onChange: () => {},
  onBlur: () => {},
  readOnly: false,
  invalid: false,
  describedBy: undefined,
};

/**
 * An override whose `component` renders `renderDefault` as JSX
 * (`<RenderDefault {...props} />`) — the natural pattern a real
 * `admin.components.Input` override uses to wrap the built-in control, and
 * the exact pattern an unstable `renderDefault` identity remounts on every
 * render.
 */
function jsxWrappingOverride(id: string): ComponentOverrideInput<ReactHKT, Props> {
  return {
    id,
    component: (props: OverrideProps) => {
      const RenderDefault = props.renderDefault;
      return createElement(RenderDefault, props);
    },
  };
}

// Defined once, outside any render — mirrors a real `fieldDef.admin.components.Input`,
// which is read off a stable config object, never recreated inline per render.
const fieldOverrides = [jsxWrappingOverride("test.jsx-wrap")];

describe("useFieldControlOverride", () => {
  it("returns undefined when neither the field instance nor the project-wide config declares an Input override", () => {
    const { result } = renderHook(() =>
      useFieldControlOverride<string>({
        fieldType: "text",
        fieldOverrides: undefined,
        defaultControl: () => null,
      }),
    );
    expect(result.current).toBeUndefined();
  });

  it("keeps the composed renderDefault's identity stable across re-renders, even though the caller passes a brand-new defaultControl closure every render", () => {
    let renderCount = 0;
    const { result, rerender } = renderHook(() => {
      renderCount += 1;
      // A fresh closure every render — mirrors every `*FieldAdmin`'s inline
      // `renderMaskedControl`/`renderBareControl` (the root cause this hook guards against).
      const defaultControl = (_props: Props) => createElement("span", null, `render #${renderCount}`);
      return useFieldControlOverride<string>({
        fieldType: "text",
        fieldOverrides,
        defaultControl,
      });
    });

    const first = result.current;
    expect(first).toBeDefined();

    rerender();
    const second = result.current;

    expect(second).toBe(first);

    rerender();
    expect(result.current).toBe(first);
  });

  it("recomposes (a new identity) when the override chain itself genuinely changes", () => {
    const { result, rerender } = renderHook(
      (props: { overrides: typeof fieldOverrides }) =>
        useFieldControlOverride<string>({
          fieldType: "text",
          fieldOverrides: props.overrides,
          defaultControl: () => null,
        }),
      { initialProps: { overrides: fieldOverrides } },
    );

    const first = result.current;
    const otherOverrides = [jsxWrappingOverride("test.jsx-wrap-2")];
    rerender({ overrides: otherOverrides });

    expect(result.current).not.toBe(first);
  });

  it("the stable renderDefault still delegates to the LATEST defaultControl, and rendering it as JSX never remounts the DOM node it produces", () => {
    function Harness(props: { label: string }) {
      const defaultControl = (_controlProps: Props) =>
        createElement("span", { "data-testid": "leaf" }, props.label);
      const overrideControl = useFieldControlOverride<string>({
        fieldType: "text",
        fieldOverrides,
        defaultControl,
      });
      return overrideControl ? overrideControl(baseControlProps) : null;
    }

    const { rerender } = render(createElement(Harness, { label: "first" }));
    const firstNode = screen.getByTestId("leaf");
    expect(firstNode).toHaveTextContent("first");

    rerender(createElement(Harness, { label: "second" }));
    const secondNode = screen.getByTestId("leaf");

    // Same DOM node survived the re-render (not unmounted/remounted)...
    expect(secondNode).toBe(firstNode);
    // ...and it reflects the latest render's defaultControl, not a stale one.
    expect(secondNode).toHaveTextContent("second");
  });
});
