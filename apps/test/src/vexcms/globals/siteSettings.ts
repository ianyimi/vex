import { defineGlobal, relationship, text, upload } from "@vexcms/core";

import { GLOBAL_SLUG_SITE_SETTINGS, TABLE_SLUG_IMAGES, TABLE_SLUG_THEMES } from "~/db/constants";
import { CachePurgeNote } from "~/vexcms/components/CachePurgeNote";

/**
 * Site-wide settings — a singleton, so a global rather than a collection.
 *
 * The two theme references are what make the themes collection do something:
 * the root layout follows `activeTheme`, the admin layout follows `adminTheme`
 * and falls back to `activeTheme` when it is empty. Leaving `adminTheme` unset
 * — the default — means the admin panel wears the site's theme.
 */
export const siteSettings = defineGlobal({
  slug: GLOBAL_SLUG_SITE_SETTINGS,
  label: "Site Settings",
  admin: {
    icon: "Settings",
    description: "Site name, SEO defaults, and the themes applied to the site and the admin panel.",
    components: {
      edit: {
        sidebar: {
          after: [{ id: "editorial.cachePurgeNote", component: CachePurgeNote }],
        },
      },
    },
  },
  fields: {
    name: text({
      label: "Site Name",
      required: true,
      description: "Global site name used as fallback for logo text, page titles, and meta tags.",
    }),
    description: text({
      label: "Site Description",
    }),
    activeTheme: relationship({
      collection: { slug: TABLE_SLUG_THEMES },
      hasMany: false,
      label: "Active Theme",
      description:
        "The theme applied to the public site. Changing it re-skins the site on the next page load.",
    }),
    adminTheme: relationship({
      collection: { slug: TABLE_SLUG_THEMES },
      hasMany: false,
      label: "Admin Theme",
      description:
        "Optional. Leave empty and the admin panel uses the Active Theme; set it to give the admin its own palette.",
    }),
    favicon: upload({
      to: TABLE_SLUG_IMAGES,
      label: "Favicon",
      description: "Site favicon image",
    }),
    metaTitle: text({
      label: "Meta Title",
      description: "Default <title> tag for the site",
      admin: { position: "sidebar" },
    }),
    metaDescription: text({
      label: "Meta Description",
      description: "Default meta description for SEO",
      admin: { position: "sidebar" },
    }),
    ogImage: upload({
      to: TABLE_SLUG_IMAGES,
      label: "OG Image",
      description: "Default Open Graph image for social sharing",
      admin: { position: "sidebar" },
    }),
    twitterHandle: text({
      label: "Twitter Handle",
      description: "@handle for Twitter cards",
      admin: { position: "sidebar" },
    }),
  },
});
