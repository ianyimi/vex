import { defineMediaCollection } from "@vexcms/file-storage-convex";

import { TABLE_SLUG_IMAGES } from "~/db/constants";

export const images = defineMediaCollection({
  slug: TABLE_SLUG_IMAGES,
  admin: {
    icon: "Image",
  },
  labels: {
    singular: "Image",
    plural: "Images",
  },
  interfaceName: "Image",
});
