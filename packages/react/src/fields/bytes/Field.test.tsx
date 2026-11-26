import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "@tanstack/react-form";
import { adminFieldToInputSchema, bytes, type BytesField, type CollectionConfig } from "@vexcms/core";
import { AppForm } from "../../forms";
import { testCollection } from "../../testing/harness/accessFixtures";
import { runFieldInputContractSuite } from "../../testing/fieldInputContract";
import { bytesFieldFixture } from "./testFixture";
import { BytesFieldAdmin } from "./Field";

/**
 * Mounts `BytesFieldAdmin` behind a real `useForm` + `<AppForm>`, wired with
 * the same real `adminFieldToInputSchema`-driven `onSubmit` validator the
 * generic factory uses internally.
 */
function BytesValidationHarness(props: {
  fieldDef: BytesField;
  collection: CollectionConfig;
  initialValue: ArrayBuffer | undefined;
  readOnly?: boolean;
}) {
  const form = useForm({
    defaultValues: { testField: props.initialValue },
    validators: {
      onSubmit: ({ value }) => {
        const schema = adminFieldToInputSchema({ field: props.fieldDef });
        const result = schema.safeParse(value.testField);
        if (result.success) return undefined;
        return { fields: { testField: result.error.issues[0]?.message ?? "Invalid value" } };
      },
    },
  });
  return (
    <AppForm form={form}>
      <BytesFieldAdmin
        name="testField"
        fieldDef={props.fieldDef}
        collection={props.collection}
        readOnly={props.readOnly ?? false}
      />
      <button type="submit">Submit</button>
    </AppForm>
  );
}

runFieldInputContractSuite({
  fixture: bytesFieldFixture,
  Component: BytesFieldAdmin,
  extra: (options) => {
    const collection = options.collection ?? testCollection;

    describe("bytes: File tab", () => {
      it("commits an ArrayBuffer read from a selected file", async () => {
        const fieldDef = bytes({ label: "Payload" });
        render(
          <BytesValidationHarness fieldDef={fieldDef} collection={collection} initialValue={undefined} />,
        );
        const fileInput = document.getElementById("testField") as HTMLInputElement;
        const file = new File([new Uint8Array([1, 2, 3])], "payload.bin", {
          type: "application/octet-stream",
        });
        await userEvent.upload(fileInput, file);

        expect(await screen.findByText("3 B")).toBeInTheDocument();
      });

      it("rejects a file larger than maxSize, showing a local message and not changing the committed value", async () => {
        const fieldDef = bytes({ label: "Payload", maxSize: 2 });
        render(
          <BytesValidationHarness fieldDef={fieldDef} collection={collection} initialValue={undefined} />,
        );
        const fileInput = document.getElementById("testField") as HTMLInputElement;
        const file = new File([new Uint8Array([1, 2, 3])], "payload.bin");
        await userEvent.upload(fileInput, file);

        expect(await screen.findByText(/must be 2 B or smaller/i)).toBeInTheDocument();
        expect(screen.queryByText("3 B")).not.toBeInTheDocument();
      });

      it("keeps the dropzone's native file input in the tab order (opacity-0, not hidden) — real Tab reaches it with no custom keyboard handler needed", async () => {
        const user = userEvent.setup();
        const fieldDef = bytes({ label: "Payload" });
        render(
          <BytesValidationHarness fieldDef={fieldDef} collection={collection} initialValue={undefined} />,
        );
        const fileInput = document.getElementById("testField") as HTMLInputElement;
        fileInput.focus();
        await user.tab({ shift: true });
        await user.tab();
        expect(fileInput).toHaveFocus();
        expect(fileInput).not.toHaveAttribute("hidden");
        expect(fileInput).not.toHaveAttribute("disabled");
      });

      it("shows a drag-active message while a file is dragged over, reverting on drag-leave", async () => {
        const fieldDef = bytes({ label: "Payload" });
        render(
          <BytesValidationHarness fieldDef={fieldDef} collection={collection} initialValue={undefined} />,
        );
        const dropzone = (document.getElementById("testField") as HTMLInputElement).parentElement!;

        fireEvent.dragOver(dropzone);
        expect(screen.getByText("Drop the file here")).toBeInTheDocument();

        fireEvent.dragLeave(dropzone);
        expect(screen.getByText("Drop a file here, or click to browse")).toBeInTheDocument();
      });

      it("commits a dropped file", async () => {
        const fieldDef = bytes({ label: "Payload" });
        render(
          <BytesValidationHarness fieldDef={fieldDef} collection={collection} initialValue={undefined} />,
        );
        const dropzone = (document.getElementById("testField") as HTMLInputElement).parentElement!;
        const file = new File([new Uint8Array([1, 2, 3])], "payload.bin");

        fireEvent.drop(dropzone, { dataTransfer: { files: [file] } });

        expect(await screen.findByText("3 B")).toBeInTheDocument();
      });

      it("disables the native input and ignores a drop when readOnly", () => {
        const fieldDef = bytes({ label: "Payload" });
        render(
          <BytesValidationHarness
            fieldDef={fieldDef}
            collection={collection}
            initialValue={undefined}
            readOnly
          />,
        );
        const fileInput = document.getElementById("testField") as HTMLInputElement;
        expect(fileInput).toBeDisabled();

        fireEvent.drop(fileInput.parentElement!, {
          dataTransfer: { files: [new File([new Uint8Array([1, 2, 3])], "payload.bin")] },
        });
        expect(screen.queryByText("3 B")).not.toBeInTheDocument();
      });
    });

    describe("bytes: Hex tab", () => {
      it("commits a value typed as space-separated hex bytes, showing the size below the textarea", async () => {
        const user = userEvent.setup();
        const fieldDef = bytes({ label: "Payload" });
        render(
          <BytesValidationHarness fieldDef={fieldDef} collection={collection} initialValue={undefined} />,
        );
        await user.click(screen.getByRole("tab", { name: "Hex" }));
        await user.type(screen.getByPlaceholderText("48 65 6c 6c 6f"), "01 02 03");

        const hexPanel = screen.getByPlaceholderText("48 65 6c 6c 6f").closest('[role="tabpanel"]') as HTMLElement;
        expect(await within(hexPanel).findByText("3 B")).toBeInTheDocument();
      });

      it("shows a local error and leaves the committed value unchanged for invalid hex, the unchanged size still shown below the textarea", async () => {
        const user = userEvent.setup();
        const fieldDef = bytes({ label: "Payload" });
        render(
          <BytesValidationHarness
            fieldDef={fieldDef}
            collection={collection}
            initialValue={bytesFieldFixture.valid}
          />,
        );
        await user.click(screen.getByRole("tab", { name: "Hex" }));
        const textarea = screen.getByPlaceholderText("48 65 6c 6c 6f") as HTMLTextAreaElement;
        await user.clear(textarea);
        await user.type(textarea, "zz");

        const hexPanel = textarea.closest('[role="tabpanel"]') as HTMLElement;
        expect(await within(hexPanel).findByText(/invalid hex byte/i)).toBeInTheDocument();
        expect(within(hexPanel).getByText("4 B")).toBeInTheDocument();
      });
    });

    describe("bytes: clear", () => {
      it("clears the committed value via the Clear button", async () => {
        const user = userEvent.setup();
        const fieldDef = bytes({ label: "Payload" });
        render(
          <BytesValidationHarness
            fieldDef={fieldDef}
            collection={collection}
            initialValue={bytesFieldFixture.valid}
          />,
        );
        await user.click(screen.getByRole("button", { name: "Clear" }));

        expect(screen.queryByRole("button", { name: "Clear" })).not.toBeInTheDocument();
      });
    });

    describe("bytes: filled row", () => {
      it("shows the selected file's name and size after a File tab commit", async () => {
        const fieldDef = bytes({ label: "Payload" });
        render(
          <BytesValidationHarness fieldDef={fieldDef} collection={collection} initialValue={undefined} />,
        );
        const fileInput = document.getElementById("testField") as HTMLInputElement;
        const file = new File([new Uint8Array([1, 2, 3])], "payload.bin");
        await userEvent.upload(fileInput, file);

        expect(await screen.findByText("payload.bin")).toBeInTheDocument();
        expect(screen.getByText("3 B")).toBeInTheDocument();
      });

      it("falls back to a generic label when the filename is unknown (a value loaded from storage)", () => {
        const fieldDef = bytes({ label: "Payload" });
        render(
          <BytesValidationHarness
            fieldDef={fieldDef}
            collection={collection}
            initialValue={bytesFieldFixture.valid}
          />,
        );

        expect(screen.getByText("Binary payload")).toBeInTheDocument();
      });

      it("downloads the committed payload via the Download button", async () => {
        const user = userEvent.setup();
        const fieldDef = bytes({ label: "Payload" });
        const { container } = render(
          <BytesValidationHarness
            fieldDef={fieldDef}
            collection={collection}
            initialValue={bytesFieldFixture.valid}
          />,
        );
        const anchorClickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
        await user.click(container.querySelector('button[title="Download"]')!);

        expect(anchorClickSpy).toHaveBeenCalledTimes(1);
        anchorClickSpy.mockRestore();
      });

      it("disables Clear and Replace, but not Download, when readOnly", () => {
        const fieldDef = bytes({ label: "Payload" });
        const { container } = render(
          <BytesValidationHarness
            fieldDef={fieldDef}
            collection={collection}
            initialValue={bytesFieldFixture.valid}
            readOnly
          />,
        );

        expect(container.querySelector('button[title="Clear"]')).toBeDisabled();
        expect(container.querySelector('button[title="Download"]')).not.toBeDisabled();
        expect(screen.getByRole("button", { name: "Replace" })).toBeDisabled();
      });

      it("clicking Replace opens the native picker; choosing a new file there replaces the committed value", async () => {
        const user = userEvent.setup();
        const fieldDef = bytes({ label: "Payload" });
        render(
          <BytesValidationHarness
            fieldDef={fieldDef}
            collection={collection}
            initialValue={bytesFieldFixture.valid}
          />,
        );
        const hiddenInput = document.getElementById("testField") as HTMLInputElement;
        const clickSpy = vi.spyOn(hiddenInput, "click");
        await user.click(screen.getByRole("button", { name: "Replace" }));
        expect(clickSpy).toHaveBeenCalledTimes(1);

        const newFile = new File([new Uint8Array([9, 9, 9, 9, 9])], "replacement.bin");
        fireEvent.change(hiddenInput, { target: { files: [newFile] } });

        expect(await screen.findByText("replacement.bin")).toBeInTheDocument();
        expect(screen.getByText("5 B")).toBeInTheDocument();
      });
    });

    describe("bytes: polish findings", () => {
      it("W6 — surfaces a file.arrayBuffer() rejection via a local error instead of an unhandled rejection", async () => {
        const fieldDef = bytes({ label: "Payload" });
        render(
          <BytesValidationHarness fieldDef={fieldDef} collection={collection} initialValue={undefined} />,
        );
        const arrayBufferSpy = vi
          .spyOn(File.prototype, "arrayBuffer")
          .mockRejectedValueOnce(new Error("boom"));
        const fileInput = document.getElementById("testField") as HTMLInputElement;
        const file = new File([new Uint8Array([1, 2, 3])], "payload.bin");
        await userEvent.upload(fileInput, file);

        expect(await screen.findByText(/could not read "payload\.bin"/i)).toBeInTheDocument();
        arrayBufferSpy.mockRestore();
      });

      it("W7 — the filled-state field-id input is visually hidden but accessible (sr-only), not display:none", () => {
        const fieldDef = bytes({ label: "Payload" });
        render(
          <BytesValidationHarness
            fieldDef={fieldDef}
            collection={collection}
            initialValue={bytesFieldFixture.valid}
          />,
        );
        const input = document.getElementById("testField")!;
        expect(input).not.toHaveClass("hidden");
        expect(input).toHaveClass("sr-only");
      });

      it("W8 — the file and hex errors have ids referenced from aria-describedby and reserve height even when empty", async () => {
        const user = userEvent.setup();
        const fieldDef = bytes({ label: "Payload" });
        render(
          <BytesValidationHarness fieldDef={fieldDef} collection={collection} initialValue={undefined} />,
        );
        const fileInput = document.getElementById("testField") as HTMLInputElement;
        const fileErrorId = `${fileInput.id}-file-error`;
        expect(fileInput.getAttribute("aria-describedby")).toContain(fileErrorId);
        const fileErrorEl = document.getElementById(fileErrorId)!;
        expect(fileErrorEl).toBeInTheDocument();
        expect(fileErrorEl).toHaveClass("min-h-5");
        expect(fileErrorEl.textContent).toBe("");

        await user.click(screen.getByRole("tab", { name: "Hex" }));
        const textarea = screen.getByPlaceholderText("48 65 6c 6c 6f") as HTMLTextAreaElement;
        const hexErrorId = `${fileInput.id}-hex-error`;
        expect(textarea.getAttribute("aria-describedby")).toContain(hexErrorId);
        const hexErrorEl = document.getElementById(hexErrorId)!;
        expect(hexErrorEl).toBeInTheDocument();
        expect(hexErrorEl).toHaveClass("min-h-5");
        expect(hexErrorEl.textContent).toBe("");
      });

      it("W9 — a pending hex debounce does not commit a stale value while a slow file read is in flight", async () => {
        const user = userEvent.setup();
        const fieldDef = bytes({ label: "Payload" });
        render(
          <BytesValidationHarness fieldDef={fieldDef} collection={collection} initialValue={undefined} />,
        );
        await user.click(screen.getByRole("tab", { name: "Hex" }));
        const textarea = screen.getByPlaceholderText("48 65 6c 6c 6f") as HTMLTextAreaElement;
        fireEvent.change(textarea, { target: { value: "ab" } });

        let resolveRead: (buffer: ArrayBuffer) => void = () => {};
        const readPromise = new Promise<ArrayBuffer>((resolve) => {
          resolveRead = resolve;
        });
        const arrayBufferSpy = vi.spyOn(File.prototype, "arrayBuffer").mockReturnValue(readPromise);

        await user.click(screen.getByRole("tab", { name: "File" }));
        const fileInput = document.getElementById("testField") as HTMLInputElement;
        const file = new File([new Uint8Array([9, 9, 9])], "winner.bin");
        await userEvent.upload(fileInput, file);

        await new Promise((resolve) => setTimeout(resolve, 300));
        expect(screen.getByText("Drop a file here, or click to browse")).toBeInTheDocument();

        resolveRead(new Uint8Array([9, 9, 9]).buffer);
        expect(await screen.findByText("winner.bin")).toBeInTheDocument();
        expect(screen.getByText("3 B")).toBeInTheDocument();

        arrayBufferSpy.mockRestore();
      });

      it("S1 — an explicit empty hex textarea commits undefined on blur, and the size line updates", async () => {
        const user = userEvent.setup();
        const fieldDef = bytes({ label: "Payload" });
        render(
          <BytesValidationHarness
            fieldDef={fieldDef}
            collection={collection}
            initialValue={bytesFieldFixture.valid}
          />,
        );
        await user.click(screen.getByRole("tab", { name: "Hex" }));
        const textarea = screen.getByPlaceholderText("48 65 6c 6c 6f") as HTMLTextAreaElement;
        const hexPanel = textarea.closest('[role="tabpanel"]') as HTMLElement;
        expect(within(hexPanel).getByText("4 B")).toBeInTheDocument();

        await user.clear(textarea);
        await user.tab();

        await waitFor(() => expect(within(hexPanel).queryByText("4 B")).not.toBeInTheDocument());
      });
    });
  },
});
