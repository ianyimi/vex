import { describe, it, expect, vi } from "vitest";
import { defineMediaCollection } from "./defineMediaCollection";
import { text } from "../fields/text";
import { number } from "../fields/number";
import type { VexField } from "../types";

describe("defineMediaCollection", () => {
  describe("default fields", () => {
    it("includes all default media fields when no config provided", () => {
      const collection = defineMediaCollection("images");
      const fieldNames = Object.keys(collection.config.fields);

      expect(fieldNames).toContain("storageId");
      expect(fieldNames).toContain("filename");
      expect(fieldNames).toContain("mimeType");
      expect(fieldNames).toContain("size");
      expect(fieldNames).toContain("url");
      expect(fieldNames).toContain("alt");
      expect(fieldNames).toContain("width");
      expect(fieldNames).toContain("height");
    });

    it("includes all default media fields when config has empty fields", () => {
      const collection = defineMediaCollection("images", { fields: {} });
      const fieldNames = Object.keys(collection.config.fields);
      expect(fieldNames).toContain("storageId");
      expect(fieldNames).toContain("mimeType");
      expect(fieldNames).toContain("alt");
    });

    it("sets storageId as required hidden text field", () => {
      const collection = defineMediaCollection("images");
      const field = collection.config.fields.storageId as VexField;
      expect(field._meta.type).toBe("text");
      expect(field._meta.required).toBe(true);
      expect(field._meta.admin?.hidden).toBe(true);
    });

    it("sets mimeType as required read-only text field with index", () => {
      const collection = defineMediaCollection("images");
      const field = collection.config.fields.mimeType as VexField;
      expect(field._meta.type).toBe("text");
      expect(field._meta.required).toBe(true);
      expect(field._meta.admin?.readOnly).toBe(true);
      expect(field._meta.index).toBe("by_mimeType");
    });

    it("sets alt as optional text field", () => {
      const collection = defineMediaCollection("images");
      const field = collection.config.fields.alt as VexField;
      expect(field._meta.type).toBe("text");
      expect(field._meta.required).toBeUndefined();
    });
  });

  describe("useAsTitle default", () => {
    it("defaults useAsTitle to 'filename' when admin config not provided", () => {
      const collection = defineMediaCollection("images");
      expect(collection.config.admin?.useAsTitle).toBe("filename");
    });

    it("defaults useAsTitle to 'filename' when admin config has no useAsTitle", () => {
      const collection = defineMediaCollection("images", {
        admin: { group: "Media" },
      });
      expect(collection.config.admin?.useAsTitle).toBe("filename");
      expect(collection.config.admin?.group).toBe("Media");
    });

    it("respects explicit useAsTitle from user config", () => {
      const collection = defineMediaCollection("images", {
        admin: { useAsTitle: "alt" as any },
      });
      expect(collection.config.admin?.useAsTitle).toBe("alt");
    });
  });

  describe("user field overrides", () => {
    it("allows overriding overridable fields (alt)", () => {
      const collection = defineMediaCollection("images", {
        fields: {
          alt: text({
            label: "Image Alt Text",
            required: true,
            defaultValue: "",
            maxLength: 200,
          }),
        },
      });
      const field = collection.config.fields.alt as VexField;
      expect(field._meta.label).toBe("Image Alt Text");
      expect(field._meta.required).toBe(true);
      expect((field._meta as any).maxLength).toBe(200);
    });

    it("allows adding custom fields", () => {
      const collection = defineMediaCollection("images", {
        fields: {
          caption: text({ label: "Caption" }),
          sortOrder: number({ label: "Sort Order" }),
        },
      });
      const fieldNames = Object.keys(collection.config.fields);
      expect(fieldNames).toContain("caption");
      expect(fieldNames).toContain("sortOrder");
      expect(fieldNames).toContain("storageId");
    });

    it("drops locked fields with dev warning", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const collection = defineMediaCollection("images", {
        fields: {
          storageId: text({ label: "My Custom Storage ID" }),
        },
      });

      expect(collection.config.fields.storageId._meta.label).toBe("Storage ID");
      expect(collection.config.fields.storageId._meta.admin?.hidden).toBe(true);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("storageId"),
      );

      warnSpy.mockRestore();
    });

    it("drops all locked fields (storageId, filename, mimeType, size)", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const collection = defineMediaCollection("images", {
        fields: {
          storageId: text({ label: "override1" }),
          filename: text({ label: "override2" }),
          mimeType: text({ label: "override3" }),
          size: number({ label: "override4" }),
        },
      });

      expect(collection.config.fields.storageId._meta.label).toBe("Storage ID");
      expect(collection.config.fields.filename._meta.label).toBe("Filename");
      expect(collection.config.fields.mimeType._meta.label).toBe("MIME Type");
      expect(collection.config.fields.size._meta.label).toBe(
        "File Size (bytes)",
      );
      expect(warnSpy).toHaveBeenCalledTimes(4);

      warnSpy.mockRestore();
    });
  });

  describe("slug and config passthrough", () => {
    it("sets the slug on the collection", () => {
      const collection = defineMediaCollection("images");
      expect(collection.slug).toBe("images");
    });

    it("passes through tableName", () => {
      const collection = defineMediaCollection("images", {
        tableName: "media_images",
      });
      expect(collection.config.tableName).toBe("media_images");
    });

    it("passes through labels", () => {
      const collection = defineMediaCollection("images", {
        labels: { singular: "Image", plural: "Images" },
      });
      expect(collection.config.labels).toEqual({
        singular: "Image",
        plural: "Images",
      });
    });
  });
});
