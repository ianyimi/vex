import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { bytes, type TDocument } from "@vexcms/core";
import { BytesFieldDisplay } from "./Display";
import { testCollection } from "../../testing/harness/accessFixtures";

const field = bytes({ label: "Payload" });
const document: TDocument = { _id: "doc_1", _creationTime: 0 };

describe("BytesFieldDisplay", () => {
  it("shows the byte size and a hex preview of the stored payload", () => {
    const value = Uint8Array.from([0, 1, 2, 255]).buffer;
    render(
      <BytesFieldDisplay field={field} value={value} document={document} collection={testCollection} />,
    );
    expect(screen.getByText("4 B")).toBeInTheDocument();
    expect(screen.getByText("00 01 02 ff")).toBeInTheDocument();
  });

  it("truncates the hex preview past 16 bytes with a trailing ellipsis", () => {
    const value = new Uint8Array(20).buffer;
    render(
      <BytesFieldDisplay field={field} value={value} document={document} collection={testCollection} />,
    );
    expect(screen.getByText(/…$/)).toBeInTheDocument();
  });

  it("shows an em-dash placeholder for an absent value", () => {
    render(
      <BytesFieldDisplay field={field} value={undefined} document={document} collection={testCollection} />,
    );
    expect(screen.getByText("—")).toBeInTheDocument();
  });
});
