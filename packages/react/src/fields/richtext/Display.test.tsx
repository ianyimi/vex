import { createElement } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { defineConfig, richtext, type RichTextDocument, type TDocument, type VexRenderComponentProps } from "@vexcms/core";
import { RichTextFieldDisplay } from "./Display";
import { testCollection } from "../../testing/harness/accessFixtures";
import { VexConfigProvider } from "../../config/VexConfigContext";

const field = richtext({ label: "Body" });
const document: TDocument = { _id: "doc_1", _creationTime: 0 };
const value: RichTextDocument = [{ type: "p", children: [{ text: "Hello world" }] }];

function TestRenderComponent(props: VexRenderComponentProps) {
  return createElement("div", { "data-testid": "static-renderer" }, JSON.stringify(props.content));
}

describe("RichTextFieldDisplay", () => {
  it("renders the configured editor adapter's own renderComponent directly", () => {
    const config = defineConfig({
      editor: {
        type: "test",
        editorComponent: () => null,
        renderComponent: TestRenderComponent,
      },
    });
    render(
      <VexConfigProvider config={config}>
        <RichTextFieldDisplay field={field} value={value} document={document} collection={testCollection} />
      </VexConfigProvider>,
    );
    expect(screen.getByTestId("static-renderer")).toHaveTextContent(JSON.stringify(value));
  });

  it("falls back to plain text when no editor adapter is configured", () => {
    const config = defineConfig();
    render(
      <VexConfigProvider config={config}>
        <RichTextFieldDisplay field={field} value={value} document={document} collection={testCollection} />
      </VexConfigProvider>,
    );
    expect(screen.getByText("Hello world")).toBeInTheDocument();
    expect(screen.queryByTestId("static-renderer")).not.toBeInTheDocument();
  });

  it("shows an em-dash for an empty document", () => {
    const config = defineConfig();
    render(
      <VexConfigProvider config={config}>
        <RichTextFieldDisplay field={field} value={[]} document={document} collection={testCollection} />
      </VexConfigProvider>,
    );
    expect(screen.getByText("—")).toBeInTheDocument();
  });
});
