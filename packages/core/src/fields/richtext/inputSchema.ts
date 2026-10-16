import * as z from "zod";
import type { ZodType } from "zod";
import type { RichTextField, RichTextDocument } from "./types";
import { applyBaseInputSchemaMeta } from "../inputSchemas/utils";
import { richTextToPlainText } from "./utils";

/**
 * Builds a Zod schema for validating a richtext field value in the admin form.
 *
 * Checks shape only, not Plate's full node catalogue: every array item is
 * either an element (`{ type: string, children: [...] }`, recursive) or an
 * inline leaf (`{ text: string }`), with every other key passed through
 * unchanged — Plate attaches feature-specific props (`url`, `bold`,
 * `mediaId`, …) to the same nodes, and this schema only needs to agree with
 * Plate on the two keys core actually reads ({@link richTextToPlainText}'s
 * `text`/`children`). This keeps core independent of whichever `editor`
 * adapter is configured.
 *
 * `required` means at least one node's accumulated plain text
 * ({@link richTextToPlainText}) is non-empty — a document holding only empty
 * paragraphs is shape-valid but fails the required check, the same way an
 * empty string fails `text()`'s required check (CORE-1). Richtext has no own
 * `ignoreRequired` parameter: it is a leaf field type like
 * `uploadFieldToInputSchema`, not a `group`/`array`/`blocks` container with
 * sub-fields to recurse into — a draft-lenient pass reaches it the same way
 * it reaches `upload`, via `adminFieldToInputSchema`'s own
 * `{ ...field, required: false }` override before dispatch (wired when this
 * field joins that switch in Step 3).
 *
 * @param props - Input props.
 * @param props.field - The resolved richtext field definition.
 * @returns A Zod array schema with optionality and the required content check applied.
 *
 * @example
 * ```ts
 * const field = richtext({ required: true })
 * richTextFieldToInputSchema({ field })
 * // rejects [], [{ type: "p", children: [{ text: "" }] }]
 * // accepts [{ type: "p", children: [{ text: "Hello" }] }]
 * ```
 */
export function richTextFieldToInputSchema(props: {
  field: RichTextField;
}): ZodType {
  const { field } = props;
  const richTextTextSchema: ZodType = z.looseObject({ text: z.string() });
  const richTextElementSchema: ZodType = z.lazy(() =>
    z.looseObject({
      type: z.string(),
      children: z.array(z.union([richTextElementSchema, richTextTextSchema])),
    }),
  );
  const requiredError = "This field is required.";
  const baseSchema = z.array(richTextElementSchema);

  const inputSchema = field.required
    ? baseSchema.superRefine((value, ctx) => {
        if (
          richTextToPlainText({ document: value as RichTextDocument }).length === 0
        ) {
          ctx.addIssue({ code: "custom", message: requiredError });
        }
      })
    : baseSchema.default(field.defaultValue ?? []);

  return applyBaseInputSchemaMeta({ field, inputSchema });
}
