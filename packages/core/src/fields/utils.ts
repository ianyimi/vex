import { AdminField } from "./types";

/**
 * Wraps a string into lines that do not exceed `maxLen` characters, splitting
 * on word boundaries.
 *
 * Used by `adminFieldToJSDocComment` to keep JSDoc comment lines within the
 * conventional 80-character limit before emitting them into generated source files.
 *
 * @param props - Input props.
 * @param props.text - The string to wrap.
 * @param props.maxLen - Maximum character length per line.
 * @returns An array of strings, each no longer than `maxLen` characters.
 *
 * @example
 * ```ts
 * wrapLines({ text: "This is a long description that should wrap.", maxLen: 20 })
 * // → ["This is a long", "description that", "should wrap."]
 * ```
 */
export function wrapLines(props: { text: string; maxLen: number }): string[] {
  const words = props.text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if (current && current.length + 1 + word.length > props.maxLen) {
      lines.push(current);
      current = word;
    } else {
      current = current ? `${current} ${word}` : word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/**
 * Builds a tab-indented JSDoc comment block for a field's description.
 *
 * Reads `field.interfaceDescription` first, falling back to `field.description`.
 * Returns an empty string when neither is set. The output is ready to insert
 * directly above a property line in a generated TypeScript interface — lines are
 * wrapped at 80 characters via `wrapLines`.
 *
 * @param props - Input props.
 * @param props.field - The resolved field definition to extract the description from.
 * @returns A tab-indented JSDoc block string ready to splice into generated
 *   TypeScript source, or an empty string if the field has no description.
 *
 * @example
 * ```ts
 * const field = text({ description: "Page title shown in browser tabs." })
 * adminFieldToJSDocComment({ field })
 * // Returns a multi-line JSDoc block wrapping the description text
 * ```
 */
export function adminFieldToJSDocComment(props: { field: AdminField }): string {
  let jsdocComment = "";
  const jsdoc = props.field.interfaceDescription ?? props.field.description;
  if (jsdoc) {
    const linesArray = wrapLines({
      text: jsdoc,
      maxLen: 80,
    });
    jsdocComment = `\t/**\n${linesArray.map((l) => `\t * ${l}`).join("\n")}\n\t */\n`;
  }
  return jsdocComment;
}
