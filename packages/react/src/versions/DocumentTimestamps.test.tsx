import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DocumentTimestamps } from "./DocumentTimestamps";
import { formatDateFieldValue } from "../fields/date/utils";

describe("DocumentTimestamps", () => {
  it("renders nothing when creationTime is undefined", () => {
    const { container } = render(<DocumentTimestamps creationTime={undefined} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("associates the 'Created at' label with the value via role=group/aria-labelledby", () => {
    const timestamp = Date.UTC(2025, 5, 15, 14, 30);
    render(<DocumentTimestamps creationTime={timestamp} />);
    const group = screen.getByRole("group");
    const label = screen.getByText("Created at");
    expect(label).toHaveAttribute("id", group.getAttribute("aria-labelledby"));
    const expected = formatDateFieldValue({
      value: timestamp,
      time: { hidden: false, use12HourFormat: true, timePicker: { hour: true, minute: true, second: true } },
    });
    expect(group).toHaveTextContent(expected);
  });

  // Regression (muted read-only label, developer report): "Created at" is
  // ALWAYS a locked/system value (sourced from `_creationTime`, never
  // editable), but its label carried no visual "disabled" treatment at
  // all — a plain `text-muted-foreground` span with no
  // `data-disabled`/`group/field` wiring, unlike every other locked/
  // `admin.readOnly` field's label (muted via `FormFieldLayout`'s
  // `data-disabled`). The group now carries `data-disabled="true"`
  // unconditionally, and the label mutes through the same
  // `group-data-[disabled=true]/field:opacity-50` convention every other
  // field's label uses.
  it("always marks its group disabled, muting the label like a locked/system field", () => {
    const timestamp = Date.UTC(2025, 5, 15, 14, 30);
    render(<DocumentTimestamps creationTime={timestamp} />);
    const group = screen.getByRole("group");
    expect(group).toHaveAttribute("data-disabled", "true");
    expect(screen.getByText("Created at").className).toContain("group-data-[disabled=true]/field:opacity-50");
  });
});
