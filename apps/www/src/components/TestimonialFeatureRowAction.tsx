"use client"

import { useMutation } from "convex/react"
import { toast } from "sonner"
import { CRUD_ACTIONS, PERMISSION_SCOPES, vexConvexApi, type TDocument } from "@vexcms/core"
import { DropdownMenuItem, Icon, usePermission } from "@vexcms/react"

import { TABLE_SLUG_TESTIMONIALS } from "~/db/constants"

/** Same shape as `@vexcms/react`'s internal `ListRowSlotProps` — one row for `list.row.actions`. */
interface TestimonialRowActionProps {
  docs: TDocument[]
}

/**
 * `www.testimonials.feature` — a project `list.row.actions` contribution,
 * ported from `apps/test`'s list-view showcase.
 * Toggles `featured` on a single testimonial
 * via the generic `update` mutation, respecting `access`: gated client-side
 * on the `testimonials` `update` permission (the server re-checks on every
 * call regardless — this is UX, not the security boundary).
 */
export function TestimonialFeatureRowAction(props: TestimonialRowActionProps) {
  const doc = props.docs[0]
  const canUpdate = usePermission({
    resource: TABLE_SLUG_TESTIMONIALS,
    action: CRUD_ACTIONS.update,
    scope: PERMISSION_SCOPES.any,
  })
  const update = useMutation(vexConvexApi.update)

  if (!doc || !canUpdate) return null

  const isFeatured = doc.featured === true

  return (
    <DropdownMenuItem
      onClick={() => {
        void update({
          collection: TABLE_SLUG_TESTIMONIALS,
          id: doc._id,
          data: { featured: !isFeatured },
        })
          .then(() => {
            toast(isFeatured ? "Removed from Featured." : "Marked as Featured.")
          })
          .catch(() => {
            toast.error("Could not update this testimonial.")
          })
      }}
    >
      <Icon name="Star" />
      {isFeatured ? "Unfeature" : "Feature"}
    </DropdownMenuItem>
  )
}
