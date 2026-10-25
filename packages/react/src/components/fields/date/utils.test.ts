import { describe, expect, it } from "vitest";
import { formatDateFieldValue } from "./utils";

// `TZ=UTC` is set on the `test`/`coverage`/`test:watch` npm scripts
// (`packages/react/package.json`), not here — jsdom's Date implementation
// reads the host timezone once at worker-process boot, so setting
// `process.env.TZ` from inside a test file (even at module top-level) is too
// late to affect it.
const TIMESTAMP = Date.UTC(2025, 5, 15, 14, 30, 45);

describe("formatDateFieldValue", () => {
  it("formats date-only when time.hidden", () => {
    expect(
      formatDateFieldValue({
        value: TIMESTAMP,
        time: { hidden: true, use12HourFormat: true, timePicker: { hour: true, minute: true, second: false } },
      }),
    ).toBe("Jun 15, 2025");
  });

  it("formats date+time in 12-hour format without seconds by default", () => {
    expect(
      formatDateFieldValue({
        value: TIMESTAMP,
        time: { hidden: false, use12HourFormat: true, timePicker: { hour: true, minute: true, second: false } },
      }),
    ).toBe("Jun 15, 2025 2:30 PM");
  });

  it("appends seconds before the AM/PM marker in 12-hour format", () => {
    expect(
      formatDateFieldValue({
        value: TIMESTAMP,
        time: { hidden: false, use12HourFormat: true, timePicker: { hour: true, minute: true, second: true } },
      }),
    ).toBe("Jun 15, 2025 2:30:45 PM");
  });

  it("formats date+time in 24-hour format without seconds", () => {
    expect(
      formatDateFieldValue({
        value: TIMESTAMP,
        time: { hidden: false, use12HourFormat: false, timePicker: { hour: true, minute: true, second: false } },
      }),
    ).toBe("Jun 15, 2025 14:30");
  });

  it("appends seconds in 24-hour format", () => {
    expect(
      formatDateFieldValue({
        value: TIMESTAMP,
        time: { hidden: false, use12HourFormat: false, timePicker: { hour: true, minute: true, second: true } },
      }),
    ).toBe("Jun 15, 2025 14:30:45");
  });
});
