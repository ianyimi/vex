import type { AdminField } from "./types";
import { getDataFields } from "./utils";
import { VexConfigError } from "../errors";

/**
 * Validates every top-level field's `dependsOn` against the resource's own
 * top-level field keys — the same flattened universe (`getDataFields`, which
 * hoists `row()`/`collapsible()`/unnamed-`tabs()` children up and leaves
 * `group()`/`array()`/`blocks()` as single data fields) `resolveCollectionIndexes`
 * already checks a field-level index's `additionalFields` against.
 *
 * A field nested inside a `group()`/`array()`/`blocks()` is never visited
 * here — `getDataFields` does not descend into one — so a `dependsOn` set on
 * such a field is never checked. That matches its complete lack of runtime
 * effect: `validateFields` only ever runs a TOP-LEVEL field's own
 * `validate()` (`fields/validate.ts`), so a nested field's own
 * `validate()`/`dependsOn` never individually runs regardless of what it names.
 *
 * @param props.at - The error-message prefix naming the collection/global —
 *   `defineCollection: collection "posts"` or `defineGlobal: global "siteSettings"`.
 * @param props.resourceNoun - `"collection"` or `"global"`, for the "is not a
 *   field of this ___" message.
 * @param props.fields - The resource's own (pre-flatten) field map.
 * @throws {VexConfigError} When a field's `dependsOn` names a key that is not
 *   one of this resource's own top-level field keys.
 */
export function validateFieldDependsOn(props: {
  at: string;
  resourceNoun: "collection" | "global";
  fields: Record<string, AdminField>;
}): void {
  const dataFields = getDataFields({ fields: props.fields });
  const fieldKeys = new Set(Object.keys(dataFields));

  for (const [fieldKey, field] of Object.entries(dataFields)) {
    if (field.dependsOn === undefined) continue;
    for (const dependency of field.dependsOn) {
      if (!fieldKeys.has(dependency)) {
        throw new VexConfigError(
          `${props.at}: field "${fieldKey}" declares dependsOn naming "${dependency}", which is not a ` +
            `field of this ${props.resourceNoun}.`,
        );
      }
    }
  }
}
