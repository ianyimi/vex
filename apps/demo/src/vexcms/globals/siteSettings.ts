import { defineGlobal, relationship, text, upload } from "@vexcms/core"

import { TABLE_SLUG_MEDIA, TABLE_SLUG_SITE_SETTINGS, TABLE_SLUG_THEMES } from "~/db/constants"

export const siteSettings = defineGlobal({
  slug: TABLE_SLUG_SITE_SETTINGS,
  admin: {
    group: "Site Builder",
    livePreview: {
      url: "/preview/home",
    },
    useAsTitle: "name",
  },
  fields: {
    name: text({
      label: "Site Name",
      required: true,
    }),
    activeTheme: relationship({
      label: "Active Theme",
      to: TABLE_SLUG_THEMES,
    }),
    description: text({
      label: "Site Description",
    }),
    favicon: upload({
      admin: { description: "Site favicon image" },
      label: "Favicon",
      to: TABLE_SLUG_MEDIA,
    }),
    googleAnalyticsId: text({
      admin: { description: "GA4 measurement ID (G-XXXXXXXXXX)" },
      label: "Google Analytics ID",
    }),
    metaDescription: text({
      admin: { description: "Default meta description for SEO" },
      label: "Meta Description",
    }),
    metaTitle: text({
      admin: { description: "Default <title> tag for the site" },
      label: "Meta Title",
    }),
    ogImage: upload({
      admin: { description: "Default Open Graph image for social sharing" },
      label: "OG Image",
      to: TABLE_SLUG_MEDIA,
    }),
    twitterHandle: text({
      admin: { description: "@handle for Twitter cards" },
      label: "Twitter Handle",
    }),
  },
  label: "Site Settings",
  versions: {
    drafts: true,
  },
})
