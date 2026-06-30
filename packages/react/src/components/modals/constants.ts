/**
 * Registry of all admin modal definitions.
 *
 * Each entry provides the `urlParam` key that controls the modal's open state
 * via `nuqs` and a `label` for the modal's primary action button.
 * Open a modal by setting `?urlParam=true` in the URL.
 */
export const MODALS = {
  createDocument: {
    /** URL search param that controls the create-document modal (`?createNew=true`). */
    urlParam: "createNew",
    /** Label for the create-document modal's submit button. */
    label: "Create",
  },
  uploadMedia: {
    /** URL search param that controls the media upload modal (`?upload=true`). */
    urlParam: "upload",
    /** Label for the media upload modal's primary action. */
    label: "Upload",
  },
} as const;

/** Union of all URL parameter strings used to control admin modals. */
export type ModalURLParam = (typeof MODALS)[keyof typeof MODALS]["urlParam"];
