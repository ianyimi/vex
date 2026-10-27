import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { useForm } from "@tanstack/react-form";
import { ui } from "@vexcms/core";
import { AppForm } from "../../forms";
import { FormUI } from "./Field";

describe("FormUI", () => {
  it("passes name/data/siblingData/readOnly to the custom Field component", () => {
    function Probe(props: { name: string; data: Record<string, unknown>; readOnly: boolean }) {
      return (
        <span data-testid="probe">
          {props.name}:{String(props.data.title)}:{String(props.readOnly)}
        </span>
      );
    }
    const field = ui({ admin: { components: { Field: Probe } } });
    function Harness() {
      const form = useForm({ defaultValues: { title: "hello" } });
      return (
        <AppForm form={form}>
          <FormUI field={field} fieldKey="wordCount" context={{ collection: undefined as never }} />
        </AppForm>
      );
    }
    render(<Harness />);
    expect(screen.getByTestId("probe")).toHaveTextContent("wordCount:hello:false");
  });
});
