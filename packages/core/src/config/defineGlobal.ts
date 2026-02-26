import type {
  GlobalConfig,
  InferFieldsType,
  VexGlobal,
  VexField,
} from "../types";

/**
 * Define a global with typed fields.
 *
 * @param slug - The global identifier (used in URLs and database)
 * @param config - Global configuration including fields and admin options
 * @returns A VexGlobal with inferred document type
 *
 * @example
 * const metadata = defineGlobal('metadata', {
 *   label: 'Metadata',
 *   fields: {
 *     title: text({ label: 'Title', required: true }),
 *     status: select({ options: [...] }),
 *   },
 * });
 *
 * // Type inference:
 * type Metadata = typeof posts._docType;
 * // Metadata = { title: string; status: "ok" | "err" }
 */
export function defineGlobal<
  TFields extends Record<string, VexField<any, any>>,
>(slug: string, config: GlobalConfig<TFields>): VexGlobal<TFields> {
  if (process.env.NODE_ENV !== "production") {
    if (!/^[a-z][a-z0-9_]*$/.test(slug)) {
      console.warn(
        `[vex] Global slug "${slug}" should be lowercase alphanumeric with underscores, starting with a letter`,
      );
    }

    if (slug.startsWith("vex_")) {
      console.warn(`[vex] Global slug "${slug}" uses reserved prefix "vex_"`);
    }

    if (Object.keys(config.fields).length === 0) {
      console.warn(`[vex] Global "${slug}" has no fields defined`);
    }
  }

  return {
    slug,
    config,
    _docType: {} as InferFieldsType<TFields>,
  };
}
