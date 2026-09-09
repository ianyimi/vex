import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "@tanstack/react-form";
import { describe, expect, it } from "vitest";
import { adminFieldToInputSchema, date, type DateField } from "@vexcms/core";
import { DateFieldInput } from "./Input";
import { AppForm } from "../../form/AppForm";
import { runFieldInputContractSuite } from "../../../testing/fieldInputContract";
import { dateFieldFixture } from "./testFixture";
import { testCollection } from "../../../testing/harness/accessFixtures";

// "MMMM d, yyyy" — date-only trigger label (time.hidden: true)
const DATE_ONLY_LABEL = /^[A-Z][a-z]+ \d{1,2}, \d{4}$/;
// "MMM d, yyyy hh:mm:ss a" — default date+time trigger label (12-hour)
const DATE_TIME_LABEL = /^[A-Z][a-z]{2} \d{1,2}, \d{4} \d{2}:\d{2}:\d{2} (AM|PM)$/;
// "MMM d, yyyy HH:mm:ss" — date+time trigger label, time.use12HourFormat: false
const DATE_TIME_24H_LABEL = /^[A-Z][a-z]{2} \d{1,2}, \d{4} \d{2}:\d{2}:\d{2}$/;
// inline TimePicker's own button label, seconds hidden (timePicker.second: false, the default)
const TIME_NO_SECONDS = /^\d{2}:\d{2} (AM|PM)$/;
// inline TimePicker's own button label, seconds shown (timePicker.second: true)
const TIME_WITH_SECONDS = /^\d{2}:\d{2}:\d{2} (AM|PM)$/;
// inline TimePicker's own button label, hour hidden (timePicker.hour: false) — only minute + period remain
const TIME_MINUTE_ONLY = /^\d{2} (AM|PM)$/;

function DateHarness(props: { fieldDef: DateField; initialValue: string | undefined }) {
  const form = useForm({ defaultValues: { testField: props.initialValue } });
  return (
    <AppForm form={form}>
      <DateFieldInput
        name="testField"
        fieldDef={props.fieldDef}
        collection={testCollection}
        readOnly={false}
      />
      <form.Subscribe selector={(state) => state.values.testField}>
        {(value) => <output data-testid="value-probe">{JSON.stringify(value)}</output>}
      </form.Subscribe>
    </AppForm>
  );
}

/**
 * Finds a clickable, in-range, in-month calendar day cell in an already-open
 * picker — used by the day-selection tests instead of a hardcoded date, since
 * the exact days rendered depend on the fixture's local-timezone-rendered month.
 *
 * Queries `document.body` rather than the RTL `container`: the picker's
 * popover content renders through a Base UI `Portal` directly into
 * `document.body` (`ui/popover.tsx`), outside the RTL render container's own
 * subtree.
 */
function findSelectableDayCell(): HTMLElement {
  const cell = document.body.querySelector<HTMLElement>(
    "td[data-day]:not([data-outside]):not([data-selected]):not([data-disabled])",
  );
  if (!cell) throw new Error("No selectable day cell found in the open calendar.");
  return cell;
}

runFieldInputContractSuite({
  fixture: dateFieldFixture,
  Component: DateFieldInput,
  extra: ({ fixture }) => {
    describe("date field: date-only vs date+time formatting", () => {
      it("renders a date-only trigger label when time.hidden is true", () => {
        render(
          <DateHarness
            fieldDef={{
              ...fixture.fieldDef,
              time: { ...fixture.fieldDef.time, hidden: true },
            }}
            initialValue={fixture.valid}
          />,
        );
        expect(screen.getByText(DATE_ONLY_LABEL)).toBeInTheDocument();
      });

      it("renders a date+time trigger label in 12-hour format by default", () => {
        render(<DateHarness fieldDef={fixture.fieldDef} initialValue={fixture.valid} />);
        expect(screen.getByText(DATE_TIME_LABEL)).toBeInTheDocument();
      });

      it("renders a 24-hour date+time trigger label when time.use12HourFormat is false", () => {
        render(
          <DateHarness
            fieldDef={{
              ...fixture.fieldDef,
              time: { ...fixture.fieldDef.time, use12HourFormat: false },
            }}
            initialValue={fixture.valid}
          />,
        );
        expect(screen.getByText(DATE_TIME_24H_LABEL)).toBeInTheDocument();
      });
    });

    describe("date field: time.timePicker per-unit opt-in/opt-out", () => {
      it("hides the seconds column by default (timePicker.second: false)", async () => {
        const user = userEvent.setup();
        render(<DateHarness fieldDef={fixture.fieldDef} initialValue={fixture.valid} />);
        await user.click(screen.getByText(DATE_TIME_LABEL));
        expect(screen.getByText(TIME_NO_SECONDS)).toBeInTheDocument();
      });

      it("shows the seconds column when time.timePicker.second is opted in", async () => {
        const user = userEvent.setup();
        render(
          <DateHarness
            fieldDef={{
              ...fixture.fieldDef,
              time: {
                ...fixture.fieldDef.time,
                timePicker: { ...fixture.fieldDef.time.timePicker, second: true },
              },
            }}
            initialValue={fixture.valid}
          />,
        );
        await user.click(screen.getByText(DATE_TIME_LABEL));
        expect(screen.getByText(TIME_WITH_SECONDS)).toBeInTheDocument();
      });

      it("hides the hour column when time.timePicker.hour is opted out, independently of its minute/second siblings", async () => {
        const user = userEvent.setup();
        render(
          <DateHarness
            fieldDef={{
              ...fixture.fieldDef,
              time: {
                ...fixture.fieldDef.time,
                timePicker: { ...fixture.fieldDef.time.timePicker, hour: false },
              },
            }}
            initialValue={fixture.valid}
          />,
        );
        await user.click(screen.getByText(DATE_TIME_LABEL));
        expect(screen.getByText(TIME_MINUTE_ONLY)).toBeInTheDocument();
      });
    });

    describe("date field: calendar day selection commits only via Done", () => {
      it("selecting a different calendar day and clicking Done commits the new day, preserving the time-of-day", async () => {
        const user = userEvent.setup();
        render(<DateHarness fieldDef={fixture.fieldDef} initialValue={fixture.valid} />);
        await user.click(screen.getByText(DATE_TIME_LABEL));

        const initialDate = new Date(fixture.valid);
        const targetCell = findSelectableDayCell();
        const targetDay = targetCell.getAttribute("data-day")!; // "yyyy-MM-dd"
        await user.click(targetCell.querySelector("button")!);
        await user.click(screen.getByRole("button", { name: /done/i }));

        const probe = screen.getByTestId("value-probe").textContent;
        const committed = new Date(JSON.parse(probe!) as number);
        const [year, month, day] = targetDay.split("-").map(Number);
        expect(committed.getFullYear()).toBe(year);
        expect(committed.getMonth() + 1).toBe(month);
        expect(committed.getDate()).toBe(day);
        // onDayChanged (date-picker.tsx) only overwrites y/m/d — the clicked day's
        // h/m/s come from whatever internal `date` state already held, unchanged
        // since no time-of-day interaction happened in this test.
        expect(committed.getHours()).toBe(initialDate.getHours());
        expect(committed.getMinutes()).toBe(initialDate.getMinutes());
      });

      it("selecting a day but dismissing with Escape instead of Done leaves the committed value unchanged", async () => {
        const user = userEvent.setup();
        render(<DateHarness fieldDef={fixture.fieldDef} initialValue={fixture.valid} />);
        const before = screen.getByTestId("value-probe").textContent;

        await user.click(screen.getByText(DATE_TIME_LABEL));
        const targetCell = findSelectableDayCell();
        await user.click(targetCell.querySelector("button")!);
        await user.keyboard("{Escape}");

        expect(screen.getByTestId("value-probe").textContent).toBe(before);
      });
    });

    describe("date field: clearing to empty", () => {
      it("KNOWN GAP — clicking the clear button never reaches field.handleChange, so the value never actually clears", async () => {
        const user = userEvent.setup();
        render(<DateHarness fieldDef={fixture.fieldDef} initialValue={fixture.valid} />);
        const before = screen.getByTestId("value-probe").textContent;
        expect(before).not.toBe("");

        await user.click(screen.getByRole("button", { name: /clear date/i }));

        // Intended: clearable is unconditionally set on DateTimePicker (Input.tsx), so
        // clicking Clear should empty the field and restore the "Pick a date" placeholder.
        // Actual: Input.tsx's handleChange wrapper is `if (date) { ...handleChange(...) }` —
        // it silently drops the clear button's `onChange(undefined)`, so the form value
        // and the rendered trigger label never change.
        expect(screen.getByTestId("value-probe").textContent).toBe("");
        expect(screen.getByText("Pick a date")).toBeInTheDocument();
      });
    });

    describe('date field: min/max bounds (JSDoc: "Validated in the input schema")', () => {
      it("KNOWN GAP — accepts a timestamp before fieldDef.min: dateFieldToInputSchema never reads field.min", () => {
        const boundary = new Date(fixture.valid).getTime();
        const fieldWithMin: DateField = { ...fixture.fieldDef, min: boundary };
        const belowMin = boundary - 1;

        const result = adminFieldToInputSchema({ field: fieldWithMin }).safeParse(belowMin);

        expect(result.success).toBe(false);
      });

      it("KNOWN GAP — accepts a timestamp after fieldDef.max: dateFieldToInputSchema never reads field.max", () => {
        const boundary = new Date(fixture.valid).getTime();
        const fieldWithMax: DateField = { ...fixture.fieldDef, max: boundary };
        const aboveMax = boundary + 1;

        const result = adminFieldToInputSchema({ field: fieldWithMax }).safeParse(aboveMax);

        expect(result.success).toBe(false);
      });

      it("KNOWN GAP — DateFieldInput never forwards fieldDef.min/max to the calendar, so out-of-range days are never disabled", async () => {
        const user = userEvent.setup();
        const initial = new Date(fixture.valid);
        const fieldWithMin: DateField = { ...fixture.fieldDef, min: initial.getTime() };
        render(<DateHarness fieldDef={fieldWithMin} initialValue={fixture.valid} />);

        await user.click(screen.getByText(DATE_TIME_LABEL));

        const dayBefore = new Date(initial);
        dayBefore.setDate(dayBefore.getDate() - 1);
        const iso = [
          dayBefore.getFullYear(),
          String(dayBefore.getMonth() + 1).padStart(2, "0"),
          String(dayBefore.getDate()).padStart(2, "0"),
        ].join("-");
        const cell = document.body.querySelector(`td[data-day="${iso}"]`);

        // Intended: DateTimePicker's own `disabled` prop (date-picker.tsx's DayPicker)
        // already disables days before `min`/after `max` when those props are supplied.
        // Actual: Input.tsx's JSX never forwards `fieldDef.min`/`fieldDef.max` to
        // <DateTimePicker> (only value/onChange/disabled/clearable/hideTime/
        // use12HourFormat/timePicker are passed), so this day is always enabled.
        expect(cell).toHaveAttribute("data-disabled");
      });
    });

    describe("date field: ADMIN_FIELDS.date.defaultValue is undefined, never 0", () => {
      it("date() resolves defaultValue to undefined when unset — unlike number()'s 0 or checkbox()'s false", () => {
        expect(date().defaultValue).toBeUndefined();
      });

      it("mounting a brand-new document (unset defaultValue) shows the 'Pick a date' placeholder, never a Jan 1 1970 date", () => {
        expect(fixture.fieldDef.defaultValue).toBeUndefined();
        render(<DateHarness fieldDef={fixture.fieldDef} initialValue={undefined} />);
        expect(screen.getByText("Pick a date")).toBeInTheDocument();
        expect(screen.queryByText(/1970/)).not.toBeInTheDocument();
      });
    });
  },
});
