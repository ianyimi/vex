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
});
