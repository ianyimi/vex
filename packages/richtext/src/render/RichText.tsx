import type { VexRenderComponentProps } from "@vexcms/core";
import { createStaticEditor, PlateStatic } from "platejs/static";
import { BaseParagraphPlugin } from "platejs";
import {
  BaseBoldPlugin,
  BaseItalicPlugin,
  BaseUnderlinePlugin,
  BaseStrikethroughPlugin,
  BaseCodePlugin,
  BaseHeadingPlugin,
  BaseBlockquotePlugin,
  BaseHorizontalRulePlugin,
} from "@platejs/basic-nodes";
import { BaseCodeBlockPlugin, BaseCodeLinePlugin } from "@platejs/code-block";
import { BaseLinkPlugin } from "@platejs/link";
import { BaseListPlugin } from "@platejs/list";
import { BaseImagePlugin } from "@platejs/media";
import {
  BaseTablePlugin,
  BaseTableRowPlugin,
  BaseTableCellPlugin,
  BaseTableCellHeaderPlugin,
} from "@platejs/table";
import { getStaticComponents } from "./staticComponents";

/**
 * Server-safe static renderer for rich text content.
 *
 * Uses PlateStatic (no browser APIs) so it works in RSC, SSR, and client.
 * Accepts the same `VexRenderComponentProps` as any VEX render adapter.
 *
 * @example
 * ```tsx
 * import { RichText } from "@vexcms/richtext/render";
 * <RichText content={doc.body} className="prose" />
 * ```
 */
export function RichText(props: VexRenderComponentProps) {
  const { content, className, resolveMedia } = props;

  if (!content || (Array.isArray(content) && content.length === 0)) {
    return null;
  }

  if (resolveMedia) {
    console.warn(
      "[@vexcms/richtext] resolveMedia requires async pre-processing " +
        "of the content tree before passing it to <RichText>. " +
        "Async resolution inside the static renderer is not yet supported."
    );
  }

  const components = getStaticComponents();

  const editor = createStaticEditor({
    plugins: [
      BaseParagraphPlugin,
      BaseBoldPlugin,
      BaseItalicPlugin,
      BaseUnderlinePlugin,
      BaseStrikethroughPlugin,
      BaseCodePlugin,
      BaseHeadingPlugin,
      BaseBlockquotePlugin,
      BaseHorizontalRulePlugin,
      BaseCodeBlockPlugin,
      BaseCodeLinePlugin,
      BaseLinkPlugin,
      BaseListPlugin,
      BaseImagePlugin,
      BaseTablePlugin,
      BaseTableRowPlugin,
      BaseTableCellPlugin,
      BaseTableCellHeaderPlugin,
    ],
    components,
    value: content as any,
  });

  return <PlateStatic editor={editor} className={className} />;
}
