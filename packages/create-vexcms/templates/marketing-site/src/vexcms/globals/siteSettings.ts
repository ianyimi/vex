import { defineGlobal, relationship, text, upload } from "@vexcms/core"

import { TABLE_SLUG_IMAGES, TABLE_SLUG_THEMES } from "~/db/constants"

/**
 * Site-wide settings — a singleton `vex_globals` row, not a collection.
 *
 * `activeTheme` is what makes the `themes` collection do something: the root
 * layout follows it. `adminTheme` is optional — leaving it unset (the
 * default) means the admin panel wears the site's theme, matching
 * `apps/test/convex/theme.ts`'s `getAdmin` fallback.
 */
export const siteSettings = defineGlobal({
  slug: "siteSettings",
  label: "Site Settings",
  admin: {
    icon: "Settings",
    description: "Site name, SEO defaults, and the themes applied to the site and the admin panel.",
  },
  fields: {
    name: text({
      label: "Site Name",
      required: true,
      description: "Used as fallback for logo text, page titles, and meta tags.",
    }),
    description: text({
      label: "Site Description",
    }),
    activeTheme: relationship({
      collection: { slug: TABLE_SLUG_THEMES },
      hasMany: false,
      label: "Active Theme",
      description: "The theme applied to the public site.",
    }),
    adminTheme: relationship({
      collection: { slug: TABLE_SLUG_THEMES },
      hasMany: false,
      label: "Admin Theme",
      description: "Optional. Leave empty and the admin panel uses the Active Theme.",
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
    googleAnalyticsId: text({
      label: "Google Analytics ID",
      description: "GA4 measurement ID (G-XXXXXXXXXX)",
      admin: { position: "sidebar" },
    }),
  },
})
