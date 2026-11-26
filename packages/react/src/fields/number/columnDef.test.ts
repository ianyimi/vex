import { number } from "@vexcms/core";
import { describe, expect, it } from "vitest";
import { runColumnDefSuite } from "../../testing/columnDefSuite";
import { testCollection } from "../../testing/harness/accessFixtures";
import { numberFieldFixture } from "./testFixture";
import { numberFieldToColumnDef } from "./columnDef";

runColumnDefSuite({ fixture: numberFieldFixture });

describe("numberFieldToColumnDef: int64", () => {
  it("falls back to undefined for a missing value when the field has no explicit defaultValue", () => {
    const fieldDef = number({ schema: { validator: "int64" } });
    const column = numberFieldToColumnDef({
      fieldDef,
      fieldKey: "views",
      collection: testCollection,
    });
    const cell = column.cell as (props: { row: { getValue: (key: string) => unknown } }) => unknown;
    const rendered = cell({ row: { getValue: () => undefined } }) as { props: { value: bigint | undefined } };
    expect(rendered.props.value).toBeUndefined();
  });

  it("falls back to the field's own explicit bigint defaultValue for a missing value", () => {
    const fieldDef = number({ schema: { validator: "int64" }, defaultValue: 7n });
    const column = numberFieldToColumnDef({
      fieldDef,
      fieldKey: "views",
      collection: testCollection,
    });
    const cell = column.cell as (props: { row: { getValue: (key: string) => unknown } }) => unknown;
    const rendered = cell({ row: { getValue: () => undefined } }) as { props: { value: bigint } };
    expect(rendered.props.value).toBe(7n);
  });
});
