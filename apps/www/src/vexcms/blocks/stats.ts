import { array, defineBlock, group, text } from "@vexcms/core";

/**
 * Stats — a row of key metrics (e.g. "10K+ users", "99.9% uptime").
 * Each stat has a value and a label.
 */
export const statsBlock = defineBlock({
  slug: "stats",
  label: "Stats",
  name: "stats",
  admin: { icon: "Percent" },
  fields: {
    title: text({
      label: "Section Title",
      description: "Optional heading above the stats row.",
    }),
    stats: array({
      label: "Stats",
      labels: { singular: "stat", plural: "stats" },
      items: group({
        label: "Stat",
        fields: {
          value: text({
            required: true,
            label: "Value",
            description: "The number or metric, e.g. '10K+' or '99.9%'.",
          }),
          label: text({
            required: true,
            label: "Label",
            description: "What the number represents, e.g. 'Active Users'.",
          }),
        },
      }),
    }),
  },
});
