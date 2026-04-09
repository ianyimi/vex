/* eslint-disable jsdoc/require-jsdoc */

export const CORE_ADMIN_FIELDS = {
  id: {
    slug: "_id",
  },
  createdAt: {
    slug: "_creationTime",
  },
} as const;
export type CoreAdminField =
  (typeof CORE_ADMIN_FIELDS)[keyof typeof CORE_ADMIN_FIELDS]["slug"];
