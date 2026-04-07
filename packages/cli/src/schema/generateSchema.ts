// @ts-nocheck
import { writeFileSync } from "fs";
import { textFieldToValidator } from "@vexcms/core";
import type { TextField, VexConfig } from "@vexcms/core";
import { adminFieldToValidator } from "../../../core/src/fields";

/**
 * Generates vex.schema.ts from vex.config.ts.
 *
 * Reads the user's config, extracts all collections/fields, and generates
 * a Convex schema file with typed tables + validators.
 *
 * @param props - Input props
 * @param props.config - The loaded vex config
 *
 * @example
 * ```ts
 * import config from './vex.config.ts';
 * generateVexSchema({ config, outPath: 'convex/vex.schema.ts' });
 * ```
 */
export function generateVexSchema(props: { config: VexConfig }): void {
  // TODO: implement
  //
  // 1. Extract collections from props.config.collections
  //    → Loop over each collection
  //    → Extract fields from each collection
  //
  // 2. For each field, call the appropriate *ToValidator() function
  //    → Right now only textFieldToValidator exists
  //    → Later: numberFieldToValidator, etc.
  //    → Build up a fields object: { fieldName: validatorString, ... }
  //
  // 3. Generate Convex schema code as a string
  //    → Import statement: import { defineSchema, defineTable } from "convex/server";
  //    → defineSchema({ [collectionSlug]: defineTable({ ...fields }) })
  //
  // 4. Write to props.outPath with writeFileSync
  //    → Optionally run Prettier on output for formatting
  //
  // Edge cases:
  // - Handle collections with no fields (rare but possible)
  // - Handle unknown field types gracefully (log warning, skip field)
  // - Ensure outPath directory exists (create if needed)

  let vexSchemaString = "";
  for (const collection of props.config.collections) {
    const fieldsArray = Object.entries(collection.fields);
    if (fieldsArray.length < 1) continue;
    const collectionSchemaString = `const ${collection.slug} = defineTable({
      ${fieldsArray
        .map(
          ([fieldKey, field], fieldIndex) =>
            `\t${fieldKey}: ${adminFieldToValidator({ field })}${fieldIndex === fieldsArray.length - 1 ? "" : ","}`,
        )
        .join("\n")}\n})\n`;
    vexSchemaString = vexSchemaString.concat(collectionSchemaString);
  }

  throw new Error("Not implemented");
}
