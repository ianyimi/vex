import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "@tanstack/react-form";
import { describe, expect, it } from "vitest";
import { commitTs, type CommitTsField } from "@vexcms/core";
import { CommitTsFieldAdmin } from "./Field";
import { AppForm } from "../../forms";
import { testCollection } from "../../testing/harness/accessFixtures";

/**
 * Mounts `CommitTsFieldAdmin` behind a real `useForm` + `<AppForm>` —
 * `commitTs` has no editable control, so the shared
 * `runFieldInputContractSuite` (which asserts against an editable control
 * via `getControl`) does not apply here; this harness mirrors
 * `fields/date/Field.test.tsx`'s own `DateHarness` structure instead.
 */
function CommitTsHarness(props: { fieldDef: CommitTsField; initialValue: number | undefined }) {
  const form = useForm({ defaultValues: { testField: props.initialValue } });
  return (
    <AppForm form={form}>
      <CommitTsFieldAdmin
        name="testField"
        fieldDef={props.fieldDef}
        collection={testCollection}
        readOnly={false}
      />
    </AppForm>
  );
}

describe("CommitTsFieldAdmin", () => {
  it("renders nothing when the value is undefined", () => {
    const { container } = render(
      <CommitTsHarness fieldDef={commitTs({ label: "Updated At" })} initialValue={undefined} />,
    );
    expect(container.querySelector("form")).toBeEmptyDOMElement();
  });

  it("renders the label and formatted value, with the full datetime in a tooltip", async () => {
    const timestamp = Date.UTC(2025, 5, 15, 14, 30);
    render(<CommitTsHarness fieldDef={commitTs({ label: "Updated At" })} initialValue={timestamp} />);
    expect(screen.getByText("Updated At")).toBeInTheDocument();
    expect(screen.getByText("Jun 15, 2025 2:30 PM")).toBeInTheDocument();

    const user = userEvent.setup();
    await user.hover(screen.getByText("Jun 15, 2025 2:30 PM"));
    expect(await screen.findByText("Jun 15, 2025 2:30:00 PM", {}, { timeout: 2000 })).toBeInTheDocument();
  });

  it("falls back to the field's name when no label is set", () => {
    const timestamp = Date.UTC(2025, 5, 15, 14, 30);
    render(<CommitTsHarness fieldDef={commitTs({ label: "" })} initialValue={timestamp} />);
    expect(screen.getByText("testField")).toBeInTheDocument();
  });

  it("formats via admin.format: relative", () => {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    render(
      <CommitTsHarness
        fieldDef={commitTs({ label: "Updated At", admin: { format: "relative" } })}
        initialValue={fiveMinutesAgo}
      />,
    );
    expect(screen.getByText(/minutes? ago$/)).toBeInTheDocument();
  });

  it("formats via admin.format: date (no time component)", () => {
    const timestamp = Date.UTC(2025, 5, 15, 14, 30);
    render(
      <CommitTsHarness
        fieldDef={commitTs({ label: "Updated At", admin: { format: "date" } })}
        initialValue={timestamp}
      />,
    );
    expect(screen.getByText("Jun 15, 2025")).toBeInTheDocument();
  });

  it("formats via admin.format: datetime (the default)", () => {
    const timestamp = Date.UTC(2025, 5, 15, 14, 30);
    render(
      <CommitTsHarness
        fieldDef={commitTs({ label: "Updated At", admin: { format: "datetime" } })}
        initialValue={timestamp}
      />,
    );
    expect(screen.getByText("Jun 15, 2025 2:30 PM")).toBeInTheDocument();
  });
});
