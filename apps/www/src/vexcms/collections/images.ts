import { defineMediaCollection } from "@vexcms/file-storage-convex";

export const images = defineMediaCollection({
  slug: "images",
  labels: {
    singular: "Image",
    plural: "Images",
  },
});
