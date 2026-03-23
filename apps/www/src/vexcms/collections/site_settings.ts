import { defineCollection, relationship, text, upload } from "@vexcms/core"

import { TABLE_SLUG_MEDIA, TABLE_SLUG_SITE_SETTINGS, TABLE_SLUG_THEMES } from "~/db/constants"

export const siteSettings = defineCollection({
  slug: TABLE_SLUG_SITE_SETTINGS,
  admin: {
    group: "Site Builder",
    useAsTitle: "name",
  },
  fields: {
    name: text({
      label: "Site Name",
      required: true,
    }),
    description: text({
      label: "Site Description",
    }),
    activeTheme: relationship({
      label: "Active Theme",
      to: TABLE_SLUG_THEMES,
    }),
    favicon: upload({
      admin: { description: "Site favicon image" },
      label: "Favicon",
      to: TABLE_SLUG_MEDIA,
    }),
    metaTitle: text({
      label: "Meta Title",
      admin: { description: "Default <title> tag for the site" },
    }),
    metaDescription: text({
      label: "Meta Description",
      admin: { description: "Default meta description for SEO" },
    }),
    ogImage: upload({
      label: "OG Image",
      to: TABLE_SLUG_MEDIA,
      admin: { description: "Default Open Graph image for social sharing" },
    }),
    twitterHandle: text({
      label: "Twitter Handle",
      admin: { description: "@handle for Twitter cards" },
    }),
    googleAnalyticsId: text({
      label: "Google Analytics ID",
      admin: { description: "GA4 measurement ID (G-XXXXXXXXXX)" },
    }),
  },
  labels: {
    plural: "Site Settings",
    singular: "Site Settings",
  },
})
