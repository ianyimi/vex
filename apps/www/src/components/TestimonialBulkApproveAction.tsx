"use client"

import { useMutation } from "convex/react"
import { useState } from "react"
import { toast } from "sonner"
import { CRUD_ACTIONS, PERMISSION_SCOPES, vexConvexApi, type TDocument } from "@vexcms/core"
import { Button, usePermission } from "@vexcms/react"

import { TABLE_SLUG_TESTIMONIALS } from "~/db/constants"

/** Same shape as `@vexcms/react`'s internal `ListRowSlotProps` — every selected row for `list.bulkActions`. */
interface TestimonialBulkActionProps {
  docs: TDocument[]
}

/**
 * `www.testimonials.bulkApprove` — a project `list.bulkActions` contribution,
 * ported from `apps/test`'s list-view showcase.
 * Sets `approved: true` on every selected,
 * not-yet-approved testimonial via the generic `update` mutation, one call
 * per row (no bespoke server endpoint). Respects `access`: gated client-side
 * on the `testimonials` `update` permission, renders nothing with no
 * selection — same convention as the built-in `vex.list.bulk.delete`.
 */
export function TestimonialBulkApproveAction(props: TestimonialBulkActionProps) {
  const canUpdate = usePermission({
    resource: TABLE_SLUG_TESTIMONIALS,
    action: CRUD_ACTIONS.update,
    scope: PERMISSION_SCOPES.any,
  })
  const update = useMutation(vexConvexApi.update)
  const [isApproving, setIsApproving] = useState(false)

  const unapproved = props.docs.filter((doc) => doc.approved !== true)

  if (props.docs.length === 0 || !canUpdate) return null

  return (
    <Button
      variant="outline"
      size="sm"
      icon="Check"
      disabled={isApproving || unapproved.length === 0}
      onClick={() => {
        setIsApproving(true)
        void Promise.all(
          unapproved.map((doc) =>
            update({ collection: TABLE_SLUG_TESTIMONIALS, id: doc._id, data: { approved: true } }),
          ),
        )
          .then(() => {
            toast(`Approved ${unapproved.length} testimonial${unapproved.length === 1 ? "" : "s"}.`)
          })
          .catch(() => {
            toast.error("Could not approve the selected testimonials.")
          })
          .finally(() => {
            setIsApproving(false)
          })
      }}
    >
      Approve
    </Button>
  )
}
